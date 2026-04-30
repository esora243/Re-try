適用手順
1. このzip内のファイルを、元の Re-try-main プロジェクトへ同じパスで上書きしてください。
2. 依存関係を再インストールしてください。
   npm install
3. Prisma Client を再生成してください。
   npx prisma generate
4. Supabase へ SQL マイグレーションを適用してください。
   supabase/migrations/002_premium_billing.sql
5. Stripe の環境変数を設定してください。
   STRIPE_SECRET_KEY
   STRIPE_WEBHOOK_SECRET
   STRIPE_PREMIUM_AMOUNT
   STRIPE_PREMIUM_NAME
   STRIPE_PREMIUM_DESCRIPTION
6. LINE / LIFF の公開環境変数を設定してください。
   NEXT_PUBLIC_LIFF_ID
   NEXT_PUBLIC_LINE_CHANNEL_ID
   NEXT_PUBLIC_LIFF_URL
7. 最終確認
   npx tsc --noEmit

このパッチで含めた主な修正
- LINE / LIFF の公開設定読み込みを client-safe に整理
- Stripe Checkout / Webhook を追加
- Prisma schema と Supabase migration を追加
- モバイル向けカードUIとプレミアム導線を追加
- プレミアム関連型を追加
