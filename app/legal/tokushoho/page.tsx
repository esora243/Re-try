import { env } from '@/lib/env';

const rows = [
  ['サービス名', env.businessServiceName()],
  ['事業者区分', env.businessOperatorType()],
  ['販売事業者', env.businessSellerName()],
  ['運営責任者', env.businessRepresentative()],
  ['所在地', env.businessAddressNotice()],
  ['電話番号', env.businessPhoneNotice()],
  ['メールアドレス', env.businessContactEmail()],
  ['販売価格', '各申込ページに表示します。'],
  ['商品代金以外の必要料金', 'インターネット接続に必要な通信料はお客様負担です。'],
  ['支払方法', 'クレジットカードその他に対応しました'],
  ['支払時期', '申込時に決済されます。'],
  ['提供時期', '決済完了後、対象機能を直ちに利用できます。'],
  ['返品・キャンセル', 'デジタルサービスの性質上、決済完了後の返金・キャンセルは原則としてお受けしていません。'],
  ['動作環境', 'LINE が利用できるスマートフォン、またはsafariの最新環境を推奨。']
] as const;

export default function TokushohoPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 sm:px-6">
      <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-xs font-semibold tracking-wide text-slate-600">
            Re-try / 特定商取引法に基づく表記
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">特定商取引法に基づく表記</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            Re-try では、プレミアム機能の販売条件をわかりやすく確認できるよう、必要事項を以下に掲載しています。
            住所と電話番号はご請求があった場合に開示します。
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
          {rows.map(([label, value]) => (
            <div key={label} className="grid border-b border-slate-200 last:border-b-0 sm:grid-cols-[220px_1fr]">
              <div className="bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700">{label}</div>
              <div className="px-4 py-4 text-sm leading-7 text-slate-700">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
          <div className="font-semibold">本番公開前の確認</div>
          <p className="mt-2">
            ご不明な点等などはお問い合わせフォーム、公式LINEよりお問い合わせください。
          </p>
        </div>
      </div>
    </main>
  );
}
