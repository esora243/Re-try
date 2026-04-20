'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

const LOGIN_SUCCESS_EVENT = 'line-login-success';

export const LiffBootstrap = ({ liffId, enableDevLogin = false }: Props) => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const liffInitStartedRef = useRef(false);
  const authInFlightRef = useRef(false);

  const invalidateSession = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['me'] });
  }, [queryClient]);

  const exchangeSession = useCallback(async () => {
    if (!window.liff || authInFlightRef.current) return;

    authInFlightRef.current = true;

    try {
      const profile = await window.liff.getProfile();
      const idToken = window.liff.getIDToken();

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

      setMessage('');
      await invalidateSession();
      window.dispatchEvent(new Event(LOGIN_SUCCESS_EVENT));
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : 'LINEログインに失敗しました。');
    } finally {
      authInFlightRef.current = false;
    }
  }, [invalidateSession]);

  const initializeLiff = useCallback(async () => {
    if (!liffId || liffInitStartedRef.current) return;

    liffInitStartedRef.current = true;

    try {
      const { default: liff } = await import('@line/liff');
      await liff.init({ liffId });
      window.liff = liff;

      if (liff.isLoggedIn()) {
        await exchangeSession();
      }
    } catch (error) {
      console.error(error);
      setMessage('LINEログインの準備に失敗しました。時間をおいて再度お試しください。');
      liffInitStartedRef.current = false;
    }
  }, [exchangeSession, liffId]);

  useEffect(() => {
    void initializeLiff();
  }, [initializeLiff]);

  useEffect(() => {
    const loginHandler = async () => {
      if (liffId) {
        if (!window.liff) {
          await initializeLiff();
        }

        if (window.liff) {
          if (!window.liff.isLoggedIn()) {
            window.liff.login({ redirectUri: window.location.href });
            return;
          }

          await exchangeSession();
          return;
        }
      }

      if (enableDevLogin) {
        try {
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

          if (!response.ok) {
            throw new Error('開発用ログインに失敗しました。');
          }

          setMessage('');
          await invalidateSession();
          window.dispatchEvent(new Event(LOGIN_SUCCESS_EVENT));
        } catch (error) {
          console.error(error);
          setMessage(error instanceof Error ? error.message : 'ログインに失敗しました。');
        }
        return;
      }

      setMessage('LINEログインの設定が見つかりません。環境変数を確認してください。');
    };

    const logoutHandler = async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      if (window.liff?.isLoggedIn()) {
        window.liff.logout();
      }
      await invalidateSession();
    };

    window.addEventListener('line-login-request', loginHandler);
    window.addEventListener('line-logout-request', logoutHandler);

    return () => {
      window.removeEventListener('line-login-request', loginHandler);
      window.removeEventListener('line-logout-request', logoutHandler);
    };
  }, [enableDevLogin, exchangeSession, initializeLiff, invalidateSession, liffId]);

  if (!message) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-soft">{message}</div>
    </div>
  );
};
