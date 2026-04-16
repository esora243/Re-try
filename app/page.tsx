'use client';

export default function Home() {
  // ボタンが押されたら、LiffBootstrapに合図を送る処理
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
