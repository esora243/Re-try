import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Re-try',
  description: '医学部学士編入の不安を、次の一手に変える学習アプリ',
  openGraph: {
    title: 'Re-try',
    description: '医学部学士編入に必要な情報をひとつにまとめた学習アプリ'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1F3A8A'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9475852513146230"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="bg-[#f6f7fb] text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}