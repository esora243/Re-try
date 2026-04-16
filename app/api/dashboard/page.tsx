'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // APIからダッシュボードの統計データを取得する
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/dashboard');
        const json = await res.json();
        
        if (res.ok) {
          // ok()関数で返されるデータ構造に合わせてセット
          setData(json.data || json); 
        } else {
          console.error(json.error);
        }
      } catch (error) {
        console.error('データの取得に失敗しました', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">ダッシュボード</h1>

        {loading ? (
          <p className="text-slate-500">データを読み込み中...</p>
        ) : data?.stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">総学習時間</p>
              <p className="text-3xl font-bold text-navy-900">
                {data.stats.totalHours} <span className="text-base font-normal text-slate-600">時間</span>
              </p>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">問題演習 正答率</p>
              <p className="text-3xl font-bold text-navy-900">
                {data.stats.accuracy} <span className="text-base font-normal text-slate-600">%</span>
              </p>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">連続学習日数</p>
              <p className="text-3xl font-bold text-[#06C755]">
                {data.stats.streakDays} <span className="text-base font-normal text-slate-600">日</span>
              </p>
            </div>
          </div>
        ) : (
          <p className="text-red-500">データの読み込みに失敗しました。</p>
        )}
      </div>
    </AppShell>
  );
}
