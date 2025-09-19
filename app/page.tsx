import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import prisma from '../lib/prisma';
import { authOptions } from '../lib/auth';
import { formatMonthLabel, getCurrentMonthRange } from '../lib/date';

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user) {
    redirect('/login');
  }

  const { start: monthStart, end: monthEnd } = getCurrentMonthRange();
  const [uploads, monthlyCount] = await Promise.all([
    prisma.upload.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
    prisma.upload.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: monthStart,
          lt: monthEnd
        }
      }
    })
  ]);

  const remaining = Math.max(user.monthlyLimit - monthlyCount, 0);
  const monthLabel = formatMonthLabel(monthStart);

  const formatter = new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'short',
    timeStyle: 'short'
  });

  return (
    <section className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">こんにちは、{session.user.name ?? session.user.email} さん</h1>
        <p className="mt-2 text-sm text-slate-600">
          {monthLabel}の残りアップロード可能枚数は {remaining} / {user.monthlyLimit} です。
        </p>
        <p className="mt-1 text-sm text-slate-600">最新10件のアップロード履歴を以下に表示します。</p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold">最近のアップロード</h2>
        {uploads.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">まだアップロードがありません。</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {uploads.map((upload) => (
              <li key={upload.id} className="flex justify-between rounded border border-slate-200 px-3 py-2 text-sm">
                <span>{upload.originalName}</span>
                <span className="text-slate-500">{formatter.format(upload.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
