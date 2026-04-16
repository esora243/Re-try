import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { LiffBootstrap } from "@/components/liff-bootstrap";
// 既存のProvidersコンポーネントを読み込む（ファイルパスは実際の配置場所に合わせてください）
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Re-try",
  description: "医学部編入プラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {/* 既存のProvidersで全体を囲み、React Queryを有効化します */}
        <Providers>
          <LiffBootstrap liffId={process.env.NEXT_PUBLIC_LIFF_ID} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
