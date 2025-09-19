'use client';

import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';

export default function NavBar() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-slate-800">
          Upload Manager
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium">
          {user && (
            <>
              <Link href="/upload">アップロード</Link>
              {user.role === 'ADMIN' && <Link href="/admin/users">ユーザー管理</Link>}
            </>
          )}
          {status === 'authenticated' ? (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="rounded bg-slate-800 px-3 py-1 text-white hover:bg-slate-900"
            >
              ログアウト
            </button>
          ) : (
            <button
              onClick={() => signIn(undefined, { callbackUrl: '/' })}
              className="rounded bg-slate-800 px-3 py-1 text-white hover:bg-slate-900"
            >
              ログイン
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
