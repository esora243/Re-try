import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 既存のLiffBootstrapをインポート
import { LiffBootstrap } from "@/components/liff-bootstrap";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Re-try",
  description: "医学部学士編入プラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {/* ここにLiffBootstrapを設置し、環境変数のLIFF IDを渡します */}
        <LiffBootstrap liffId={process.env.NEXT_PUBLIC_LIFF_ID} />
        
        {children}
      </body>
    </html>
  );
}
