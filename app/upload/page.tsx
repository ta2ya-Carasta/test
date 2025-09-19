import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import prisma from '../../lib/prisma';
import { authOptions } from '../../lib/auth';
import UploadForm from '../../components/upload-form';
import { formatMonthLabel, getCurrentMonthRange } from '../../lib/date';

export default async function UploadPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user) {
    redirect('/');
  }

  const { start: monthStart, end: monthEnd } = getCurrentMonthRange();
  const uploadCount = await prisma.upload.count({
    where: {
      userId: user.id,
      createdAt: {
        gte: monthStart,
        lt: monthEnd
      }
    }
  });

  const remaining = Math.max(user.monthlyLimit - uploadCount, 0);
  const monthLabel = formatMonthLabel(monthStart);

  return (
    <section className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-semibold">画像アップロード</h1>
        <p className="mt-2 text-sm text-slate-600">
          月間アップロード上限: {user.monthlyLimit} 枚。{monthLabel}は {uploadCount} 枚アップロードしています。
        </p>
      </div>
      <div className="rounded-lg bg-white p-6 shadow">
        <UploadForm remaining={remaining} monthlyLimit={user.monthlyLimit} />
      </div>
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold">アップロード済みファイル</h2>
        <p className="mt-2 text-sm text-slate-600">アップロードした画像はサーバーの /public/uploads 配下に保存されます。</p>
        <ul className="mt-4 list-disc space-y-1 pl-4 text-sm text-slate-700">
          <li>アップロード可能な形式: JPEG, PNG, GIF, WebP</li>
          <li>最大ファイルサイズ: 5MB</li>
          <li>月間上限を超えた場合は翌月（{formatMonthLabel(monthEnd)}）までアップロードできません</li>
        </ul>
      </div>
    </section>
  );
}
