import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI Stock Tracker',
  description: 'Monitor AI Tech Stack Stocks',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex overflow-hidden`}>
        <Sidebar />
        <main className="flex-1 ml-64 min-h-screen relative flex flex-col overflow-y-auto h-screen bg-black/50">
          <Header />
          <div className="p-8 flex-1">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

