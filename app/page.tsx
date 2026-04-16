'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<{ displayName: string; pictureUrl?: string } | null>(null);

  useEffect(() => {
    // 裏方（LiffBootstrap）の準備が完了して、ログイン済みか判定する
    const checkLogin = setInterval(() => {
      if (window.liff) {
        clearInterval(checkLogin);
        if (window.liff.isLoggedIn()) {
          setIsLoggedIn(true);
          // ログイン済みならプロフィールを取得して表示
          window.liff.getProfile().then((p) => {
            setProfile({ displayName: p.displayName, pictureUrl: p.pictureUrl });
          });
        }
      }
    }, 500);

    return () => clearInterval(checkLogin);
  }, []);

  const handleLogin = () => {
    window.dispatchEvent(new Event('line-login-request'));
  };

  const handleLogout = () => {
    window.dispatchEvent(new Event('line-logout-request'));
    setIsLoggedIn(false);
    setProfile(null);
  };

  // -------------------------
  // ログイン済みの画面
  // -------------------------
  if (isLoggedIn) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-gray-200">
          <h1 className="text-2xl font-bold text-[#06C755] mb-6">ログイン成功！</h1>
          {profile && (
            <div className="mb-8">
              {profile.pictureUrl && (
                <img 
                  src={profile.pictureUrl} 
                  alt="profile" 
                  className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-gray-100 shadow-sm" 
                />
              )}
              <p className="text-lg font-bold text-gray-800">{profile.displayName} さん</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-800 underline transition-colors"
          >
            ログアウト
          </button>
        </div>
      </main>
    );
  }

  // -------------------------
  // 未ログイン時の画面（元のボタン）
  // -------------------------
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
      <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">ログイン</h1>
        <p className="text-gray-600 mb-8 text-sm">
          システムを利用するにはLINEでのログインが必要です。
        </p>
        <button
          onClick={handleLogin}
          className="bg-[#06C755] hover:bg-[#05b34c] text-white font-bold py-3 px-8 rounded-full shadow-md transition-all"
        >
          LINEでログイン
        </button>
      </div>
    </main>
  );
}
