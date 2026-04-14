'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

declare global {
  interface Window {
    liff?: {
      init: (input: { liffId: string }) => Promise<void>;
      isLoggedIn: () => boolean;
      login: (input?: { redirectUri?: string }) => void;
      getProfile: () => Promise<{ userId: string; displayName: string; pictureUrl?: string }>;
      getIDToken: () => string | null;
      logout: () => void;
    };
  }
}

type Props = {
  liffId?: string;
  enableDevLogin?: boolean;
};

export const LiffBootstrap = ({ liffId, enableDevLogin = false }: Props) => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'ready'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loginWithLiff = async () => {
      if (!liffId) {
        setStatus('ready');
        return;
      }

      try {
        setStatus('loading');
        const { default: liff } = await import('@line/liff');
        await liff.init({ liffId });
        window.liff = liff;

        if (!liff.isLoggedIn()) {
          setStatus('ready');
          return;
        }

        const profile = await liff.getProfile();
        const idToken = liff.getIDToken();

        const response = await fetch('/api/auth/line', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            lineUserId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
            idToken
          })
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? 'LINE認証に失敗しました。');
        }

        await queryClient.invalidateQueries({ queryKey: ['me'] });
        setStatus('ready');
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'LIFFの初期化に失敗しました。');
      }
    };

    void loginWithLiff();
  }, [liffId, queryClient]);

  useEffect(() => {
    const handler = async () => {
      if (liffId && window.liff) {
        if (!window.liff.isLoggedIn()) {
          window.liff.login({ redirectUri: window.location.href });
          return;
        }
      }

      if (enableDevLogin) {
        const fallbackId = `dev-${crypto.randomUUID()}`;
        const response = await fetch('/api/auth/line', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lineUserId: fallbackId,
            displayName: '開発用ユーザー',
            pictureUrl: null,
            idToken: null
          })
        });

        if (response.ok) {
          await queryClient.invalidateQueries({ queryKey: ['me'] });
          setStatus('ready');
        } else {
          setStatus('error');
          setMessage('開発用ログインに失敗しました。');
        }
      }
    };

    const logoutHandler = async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      if (window.liff?.isLoggedIn()) {
        window.liff.logout();
      }
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    };

    window.addEventListener('line-login-request', handler);
    window.addEventListener('line-logout-request', logoutHandler);
    return () => {
      window.removeEventListener('line-login-request', handler);
      window.removeEventListener('line-logout-request', logoutHandler);
    };
  }, [enableDevLogin, liffId, queryClient]);

  if (status === 'loading') {
    return (
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
        <div className="rounded-full bg-navy px-4 py-2 text-sm text-white shadow-soft">LINEセッションを初期化しています…</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-soft">{message}</div>
      </div>
    );
  }

  return null;
};
