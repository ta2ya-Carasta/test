# Upload Manager (Next.js + Prisma)

Next.js 13 アプリケーションです。ユーザーログイン、ユーザー管理画面、静止画アップロード（月間制限付き）を実装しています。Prisma + SQLite を採用しています。

## セットアップ

```bash
npm install
```

### 環境変数

`.env` を作成し、以下を設定します（`.env.example` を参照）。

```bash
cp .env.example .env
```

- `DATABASE_URL`: SQLite のパス（デフォルトは `file:./dev.db`）
- `NEXTAUTH_SECRET`: NextAuth 用のシークレット
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`: シード時に作成される管理者アカウント

### Prisma セットアップ

```bash
npm run prisma:generate
npx prisma migrate dev --name init
npm run prisma:seed
```

## 開発サーバー

```bash
npm run dev
```

- `http://localhost:3000/login` からログインします。
- 管理者アカウントでログインすると `/admin/users` にアクセスできます。
- 画像アップロードは `/upload` から行えます。`public/uploads` に保存されます。

## テストユーザー

`npm run prisma:seed` 実行時に管理者アカウントが作成されます。

- メール: `admin@example.com`
- パスワード: `admin123`

必要に応じて `.env` の値を変更してください。

## 機能概要

- NextAuth (Credentials) によるメール + パスワード認証
- Prisma によるユーザー・アップロード管理
- 管理画面でのユーザー作成／権限・月間上限・パスワード更新
- 静止画アップロード（JPEG/PNG/GIF/WebP、5MB、月間制限付き）
- 月間アップロード数は当月1日〜月末の範囲でカウントし、翌月にリセットされます

## 注意事項

- 本番運用では S3 等の外部ストレージを利用してください。
- HTTPS、CSRF 対策、ログ監査などのセキュリティ強化は別途実施してください。
