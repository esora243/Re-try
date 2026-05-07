import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Re-try',
  description: '医学部学士編入の不安を、次の一手に変える学習プラットフォーム',
  openGraph: {
    title: 'Re-try',
    description: '日程・大学比較・過去問・学習記録をひとつにまとめた受験プラットフォーム'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-slate-50 text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
