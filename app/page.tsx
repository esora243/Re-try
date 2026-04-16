'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkLogin = setInterval(() => {
      if (window.liff) {
        clearInterval(checkLogin);
        if (window.liff.isLoggedIn()) {
          // ログイン済みなら、本来の画面へ自動的に移動する
          router.push('/home'); // 遷移先のパスに変更してください
        }
      }
    }, 500);

    return () => clearInterval(checkLogin);
  }, [router]);

  const handleLogin = () => {
    window.dispatchEvent(new Event('line-login-request'));
  };

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
