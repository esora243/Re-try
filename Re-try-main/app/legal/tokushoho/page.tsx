const rows = [
  ['販売事業者', 'Re-try Pro 運営事務局'],
  ['運営責任者', '運営代表者'],
  ['所在地', '請求があった場合は遅滞なく開示します。'],
  ['電話番号', '請求があった場合は遅滞なく開示します。'],
  ['メールアドレス', 'support@example.com'],
  ['販売価格', '各申込ページに税込価格を表示'],
  ['商品代金以外の必要料金', '通信費はお客様負担'],
  ['支払方法', 'Stripe によるクレジットカード / 対応決済手段'],
  ['支払時期', '申込時に決済'],
  ['提供時期', '決済完了後ただちに利用可能'],
  ['返品・キャンセル', 'デジタルサービスの性質上、決済完了後の返金・キャンセルは原則不可'],
  ['動作環境', '最新の LINE / ブラウザ環境を推奨']
];

export default function TokushohoPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
        <h1 className="text-3xl font-bold text-navy-900">特定商取引法に基づく表記</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          プレミアムプランに関する販売条件を以下の通り表示します。実運用時は運営者情報を実データへ差し替えてください。
        </p>
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
          {rows.map(([label, value]) => (
            <div key={label} className="grid border-b border-slate-200 last:border-b-0 sm:grid-cols-[220px_1fr]">
              <div className="bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700">{label}</div>
              <div className="px-4 py-4 text-sm leading-7 text-slate-700">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
