import './globals.css';
import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import AuthProvider from '../components/auth-provider';
import NavBar from '../components/nav-bar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'Upload Manager',
  description: 'User management and image uploads with monthly limits'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} min-h-screen bg-slate-100 text-slate-900`}>
        <AuthProvider>
          <NavBar />
          <main className="mx-auto w-full max-w-4xl px-4 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
