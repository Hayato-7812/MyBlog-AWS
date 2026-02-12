import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'MyBlog - テクノロジー、ライフスタイル、ビジネスのブログ',
    template: '%s | MyBlog',
  },
  description:
    'テクノロジー、ライフスタイル、ビジネスなど様々なトピックの記事を配信するブログサイト',
  keywords: [
    'ブログ',
    'テクノロジー',
    'ライフスタイル',
    'ビジネス',
    '技術記事',
  ],
  authors: [{ name: 'MyBlog Team' }],
  creator: 'MyBlog',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'MyBlog',
    title: 'MyBlog - テクノロジー、ライフスタイル、ビジネスのブログ',
    description:
      'テクノロジー、ライフスタイル、ビジネスなど様々なトピックの記事を配信',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyBlog',
    description:
      'テクノロジー、ライフスタイル、ビジネスなど様々なトピックの記事を配信',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
