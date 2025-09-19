'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  remaining: number;
  monthlyLimit: number;
};

export default function UploadForm({ remaining, monthlyLimit }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      setError('画像ファイルを選択してください');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? 'アップロードに失敗しました');
      }

      setMessage('アップロードが完了しました');
      (event.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="file" className="text-sm font-medium text-slate-700">
          画像ファイル（JPEG/PNG/GIF/WebP、5MB以下）
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept="image/*"
          disabled={remaining <= 0}
          className="rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          required
        />
      </div>
      <p className="text-sm text-slate-600">
        残りアップロード可能枚数: {remaining} / {monthlyLimit}
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}
      <button
        type="submit"
        disabled={loading || remaining <= 0}
        className="rounded bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'アップロード中...' : 'アップロード'}
      </button>
    </form>
  );
}
