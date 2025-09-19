import { Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import prisma from '../../../lib/prisma';
import { authOptions } from '../../../lib/auth';
import { formatMonthLabel, getCurrentMonthRange } from '../../../lib/date';

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/');
  }
  return session;
}

async function createUser(formData: FormData) {
  'use server';
  const session = await ensureAdmin();
  if (!session) return;

  const name = (formData.get('name') as string)?.trim() || null;
  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase();
  const password = (formData.get('password') as string) ?? '';
  const monthlyLimit = Number(formData.get('monthlyLimit') ?? 0);
  const role = (formData.get('role') as Role) ?? 'USER';

  if (!email || !password) {
    throw new Error('メールアドレスとパスワードは必須です');
  }

  const passwordHash = await hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      monthlyLimit: Number.isFinite(monthlyLimit) && monthlyLimit > 0 ? monthlyLimit : 30,
      role
    }
  });

  revalidatePath('/admin/users');
}

async function updateUser(formData: FormData) {
  'use server';
  const session = await ensureAdmin();
  if (!session) return;

  const userId = formData.get('userId') as string;
  const monthlyLimit = Number(formData.get('monthlyLimit') ?? 0);
  const role = (formData.get('role') as Role) ?? 'USER';
  const newPassword = (formData.get('newPassword') as string) ?? '';

  const data: {
    monthlyLimit?: number;
    role?: Role;
    passwordHash?: string;
  } = {};

  if (Number.isFinite(monthlyLimit) && monthlyLimit > 0) {
    data.monthlyLimit = monthlyLimit;
  }

  if (role) {
    data.role = role;
  }

  if (newPassword) {
    data.passwordHash = await hash(newPassword, 10);
  }

  await prisma.user.update({
    where: { id: userId },
    data
  });

  revalidatePath('/admin/users');
}

export default async function AdminUsersPage() {
  const session = await ensureAdmin();
  if (!session) return null;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' }
  });

  const { start: monthStart, end: monthEnd } = getCurrentMonthRange();
  const uploadCounts = await prisma.upload.groupBy({
    by: ['userId'],
    where: {
      createdAt: {
        gte: monthStart,
        lt: monthEnd
      }
    },
    _count: {
      _all: true
    }
  });

  const countMap = new Map<string, number>();
  uploadCounts.forEach((entry) => {
    countMap.set(entry.userId, entry._count._all);
  });
  const monthLabel = formatMonthLabel(monthStart);

  return (
    <section className="space-y-10">
      <div className="rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">ユーザー作成</h1>
        <p className="mt-2 text-sm text-slate-600">新しいユーザーを追加し、役割と月間アップロード上限を設定します。</p>
        <form action={createUser} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="name">
              名前
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              初期パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="monthlyLimit">
              月間アップロード上限
            </label>
            <input
              id="monthlyLimit"
              name="monthlyLimit"
              type="number"
              min={1}
              defaultValue={30}
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="role">
              権限
            </label>
            <select
              id="role"
              name="role"
              defaultValue="USER"
              className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="USER">一般</option>
              <option value="ADMIN">管理者</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
            >
              追加
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold">ユーザー一覧</h2>
        <p className="mt-2 text-sm text-slate-600">今月（{monthLabel}）のアップロード状況と上限を確認できます。</p>
        <div className="mt-6 space-y-6">
          {users.length === 0 ? (
            <p className="text-sm text-slate-600">ユーザーが存在しません。</p>
          ) : (
            users.map((user) => (
              <form key={user.id} action={updateUser} className="rounded border border-slate-200 p-4">
                <input type="hidden" name="userId" value={user.id} />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{user.name ?? '未設定'}</h3>
                    <p className="text-sm text-slate-600">{user.email}</p>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>
                      今月のアップロード: {countMap.get(user.id) ?? 0} / {user.monthlyLimit}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700" htmlFor={`role-${user.id}`}>
                      権限
                    </label>
                    <select
                      id={`role-${user.id}`}
                      name="role"
                      defaultValue={user.role}
                      className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                    >
                      <option value="USER">一般</option>
                      <option value="ADMIN">管理者</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700" htmlFor={`monthlyLimit-${user.id}`}>
                      月間上限
                    </label>
                    <input
                      id={`monthlyLimit-${user.id}`}
                      name="monthlyLimit"
                      type="number"
                      min={1}
                      defaultValue={user.monthlyLimit}
                      className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-slate-700" htmlFor={`newPassword-${user.id}`}>
                      パスワード再設定
                    </label>
                    <input
                      id={`newPassword-${user.id}`}
                      name="newPassword"
                      type="password"
                      placeholder="変更しない場合は空欄"
                      className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                  >
                    更新
                  </button>
                </div>
              </form>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
