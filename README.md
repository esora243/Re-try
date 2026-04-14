# Re-try Pro (Next.js App Router + Supabase + LINE LIFF)

医学部学士編入対策サービスのフロントエンド/バックエンド一体型 Next.js アプリです。

## 実装内容

- Next.js App Router / TypeScript / Tailwind CSS
- `@supabase/supabase-js` による動的データ取得・登録・更新
- LINE LIFF ログイン → LINE UID 取得 → サーバー側で Custom JWT 発行
- Supabase JWT を **httpOnly Cookie** に保存
- API Route 側で Cookie から JWT を読み取り、Supabase リクエストに Bearer token を付与
- React Query によるタブ切替・再訪時のデータ同期
- ローディング UI / エラー UI / try-catch ベースの例外処理
- Supabase Migration / Seed SQL 同梱
- Vercel デプロイ対応

## 画面構成

- ホーム
- 大学情報データベース
- 試験日程
- 過去問一覧
- 学習ダッシュボード
- コミュニティ

## セットアップ

```bash
npm install
cp .env.example .env.local
npm run dev
```

## 必要な環境変数

`.env.example` を参照してください。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`
- `NEXT_PUBLIC_LINE_LIFF_ID`
- `NEXT_PUBLIC_ENABLE_DEV_LOGIN`

## Supabase 設定

1. Supabase プロジェクトを作成
2. `supabase/migrations/001_init.sql` を実行
3. `supabase/seed.sql` を実行
4. `SUPABASE_JWT_SECRET` にプロジェクトの JWT Secret を設定
5. Vercel 環境変数にも同じ値を登録

## LINE LIFF 設定

1. LINE Developers で LIFF App を作成
2. Endpoint URL に Vercel の本番 URL を設定
3. `NEXT_PUBLIC_LINE_LIFF_ID` を設定
4. LINE ログイン後、クライアントから `/api/auth/line` に ID Token と UID を送信
5. サーバー側で ID Token を検証し、Supabase 用 Custom JWT を発行します

## 管理機能

- 大学情報: `POST /api/universities`, `PUT /api/universities/[id]`
- 試験日程: `POST /api/schedules`, `PUT /api/schedules/[id]`
- 過去問: `POST /api/problems`

上記は `user_profiles.is_admin = true` のユーザーのみ許可されます。

## 開発用ログイン

LINE LIFF が未接続のローカル検証時は、以下で簡易ログインを有効化できます。

```env
NEXT_PUBLIC_ENABLE_DEV_LOGIN=true
```

## 本番ビルド確認

```bash
npm run build
```

このプロジェクトはローカルで production build 成功確認済みです。

## デプロイ先

Vercel を想定しています。Node.js ランタイムでそのまま動作します。
