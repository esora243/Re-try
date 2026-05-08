import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Re-try',
  description: '医学部学士編入の不安を、次の一手に変える学習アプリ',
  openGraph: {
    title: 'Re-try',
    description: '日程・大学比較・過去問・学習記録・掲示板をひとつにまとめた学習アプリ'
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
      <body className="bg-[#f6f7fb] text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
