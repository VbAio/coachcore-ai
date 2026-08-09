import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import '@/games';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ClutchCore — Deadlock Coaching Platform',
  description: 'Upload your Deadlock replay and receive professional AI coaching in minutes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
