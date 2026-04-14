'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  ChartColumnBig,
  Crown,
  LayoutGrid,
  LineChart,
  Loader2,
  Lock,
  LogOut,
  MessageSquare,
  RefreshCw,
  Send,
  Sparkles,
  Trophy,
  University as UniversityIcon,
  UserRound
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { formatDate, formatDateTime } from '@/lib/utils';
import { LiffBootstrap } from '@/components/liff-bootstrap';
import type {
  CommunityChannel,
  CommunityMessage,
  DashboardResponse,
  ExamSchedule,
  Problem,
  SummaryResponse,
  University,
  UserProfile
} from '@/types/models';
import { env } from '@/lib/env';

type TabKey = 'home' | 'universities' | 'schedules' | 'problems' | 'dashboard' | 'community';

type MeResponse = {
  authenticated: boolean;
  profile: UserProfile;
};

type ProblemsResponse = {
  problems: Problem[];
  progress: Record<string, 'correct' | 'wrong' | 'bookmarked'>;
  profile: Pick<UserProfile, 'id' | 'is_premium'> | null;
};

const tabs: Array<{ key: TabKey; label: string; icon: typeof LayoutGrid }> = [
  { key: 'home', label: 'ホーム', icon: LayoutGrid },
  { key: 'universities', label: '大学情報', icon: UniversityIcon },
  { key: 'schedules', label: '試験日程', icon: CalendarDays },
  { key: 'problems', label: '過去問', icon: BookOpen },
  { key: 'dashboard', label: '学習管理', icon: ChartColumnBig },
  { key: 'community', label: 'コミュニティ', icon: MessageSquare }
];

const subjectOptions = ['all', '生命科学', '数学', '英語', '化学', '物理', '小論文'];
const regions = ['all', '北海道・東北', '関東', '中部', '近畿', '中国・四国', '九州'];

const fetchJson = async <T,>(input: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'データ取得に失敗しました。');
  }
  return response.json() as Promise<T>;
};

const dispatchLogin = () => window.dispatchEvent(new Event('line-login-request'));
const dispatchLogout = () => window.dispatchEvent(new Event('line-logout-request'));

const SectionCard = ({ title, subtitle, children }: React.PropsWithChildren<{ title: string; subtitle?: string }>) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-navy-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
    </div>
    {children}
  </section>
);

const LoadingGrid = () => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="h-40 animate-pulse rounded-3xl bg-slate-100" />
    ))}
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    <div className="font-medium">{message}</div>
    {onRetry ? (
      <button onClick={onRetry} className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-red-700">
        <RefreshCw className="h-4 w-4" />
        再読み込み
      </button>
    ) : null}
  </div>
);

const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
    <div className="font-medium text-slate-700">{title}</div>
    <p className="mt-1">{description}</p>
  </div>
);

const Stat = ({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Sparkles }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <div className="flex items-center gap-3">
      <div className="rounded-2xl bg-navy p-2 text-white">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-xl font-semibold text-navy-900">{value}</div>
      </div>
    </div>
  </div>
);

const AccessGate = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-3xl border border-gold-200 bg-gold-50 p-6 text-sm text-gold-900">
    <div className="flex items-center gap-3 text-lg font-semibold">
      <Lock className="h-5 w-5" />
      {title}
    </div>
    <p className="mt-2 leading-6">{description}</p>
    <button onClick={dispatchLogin} className="mt-4 inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-white">
      LINEでログイン
    </button>
  </div>
);

export const AppShell = () => {
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState<TabKey>('home');
  const [region, setRegion] = useState('all');
  const [science, setScience] = useState('all');
  const [uniSearch, setUniSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState(`${new Date().getFullYear()}`);
  const [problemSubject, setProblemSubject] = useState('all');
  const [problemYear, setProblemYear] = useState('all');
  const [problemUniversityId, setProblemUniversityId] = useState('all');
  const [studyLog, setStudyLog] = useState({
    subject: '生命科学',
    minutes: 60,
    memo: '',
    logged_on: format(new Date(), 'yyyy-MM-dd')
  });
  const [messageText, setMessageText] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') as TabKey | null;
    if (tab && tabs.some((item) => item.key === tab)) {
      setCurrentTab(tab);
    }
  }, []);

  const navigate = (tab: TabKey) => {
    setCurrentTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tab);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  const meQuery = useQuery<MeResponse>({
    queryKey: ['me'],
    queryFn: () => fetchJson('/api/me'),
    retry: false
  });

  const summaryQuery = useQuery<SummaryResponse>({
    queryKey: ['summary'],
    queryFn: () => fetchJson('/api/summary')
  });

  const universitiesQuery = useQuery<University[]>({
    queryKey: ['universities', region, science, uniSearch],
    queryFn: () => fetchJson(`/api/universities?region=${encodeURIComponent(region)}&science=${encodeURIComponent(science)}&search=${encodeURIComponent(uniSearch)}`)
  });

  const schedulesQuery = useQuery<ExamSchedule[]>({
    queryKey: ['schedules', selectedYear],
    queryFn: () => fetchJson(`/api/schedules?year=${encodeURIComponent(selectedYear)}`)
  });

  const problemsQuery = useQuery<ProblemsResponse>({
    queryKey: ['problems', problemSubject, problemYear, problemUniversityId],
    queryFn: () =>
      fetchJson(
        `/api/problems?subject=${encodeURIComponent(problemSubject)}&year=${encodeURIComponent(problemYear)}&universityId=${encodeURIComponent(problemUniversityId)}`
      )
  });

  const dashboardQuery = useQuery<DashboardResponse>({
    queryKey: ['dashboard'],
    queryFn: () => fetchJson('/api/dashboard'),
    enabled: meQuery.isSuccess
  });

  const channelsQuery = useQuery<CommunityChannel[]>({
    queryKey: ['channels'],
    queryFn: () => fetchJson('/api/community/channels')
  });

  useEffect(() => {
    if (!selectedChannelId && channelsQuery.data?.length) {
      setSelectedChannelId(channelsQuery.data[0].id);
    }
  }, [channelsQuery.data, selectedChannelId]);

  const messagesQuery = useQuery<CommunityMessage[]>({
    queryKey: ['messages', selectedChannelId],
    queryFn: () => fetchJson(`/api/community/messages?channelId=${selectedChannelId}`),
    enabled: Boolean(selectedChannelId)
  });

  const studyLogMutation = useMutation({
    mutationFn: () =>
      fetchJson('/api/study-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studyLog)
      }),
    onSuccess: async () => {
      setStudyLog((current) => ({ ...current, memo: '' }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['me'] })
      ]);
    }
  });

  const progressMutation = useMutation({
    mutationFn: ({ problemId, status }: { problemId: string; status: 'correct' | 'wrong' | 'bookmarked' }) =>
      fetchJson(`/api/problems/${problemId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['problems'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      ]);
    }
  });

  const messageMutation = useMutation({
    mutationFn: () =>
      fetchJson('/api/community/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: selectedChannelId, content: messageText })
      }),
    onSuccess: async () => {
      setMessageText('');
      await queryClient.invalidateQueries({ queryKey: ['messages', selectedChannelId] });
    }
  });

  const profile = meQuery.data?.profile;
  const channels = channelsQuery.data ?? [];
  const activeChannel = channels.find((channel) => channel.id === selectedChannelId);
  const universities = universitiesQuery.data ?? [];
  const problems = problemsQuery.data?.problems ?? [];
  const problemProgress = problemsQuery.data?.progress ?? {};
  const years = useMemo(() => {
    const yearSet = new Set<string>(['all']);
    for (const problem of problems) yearSet.add(String(problem.year));
    return [...yearSet];
  }, [problems]);

  const headerAction = meQuery.isSuccess ? (
    <div className="flex items-center gap-3">
      <div className="hidden rounded-full border border-gold-200 bg-gold-50 px-4 py-2 text-sm font-medium text-gold-900 md:inline-flex">
        {profile?.is_premium ? 'プレミアム' : '無料プラン'}
      </div>
      <button onClick={dispatchLogout} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">
        <LogOut className="h-4 w-4" />
        ログアウト
      </button>
    </div>
  ) : (
    <button onClick={dispatchLogin} className="inline-flex items-center gap-2 rounded-full bg-[#06C755] px-5 py-2.5 text-sm font-semibold text-white shadow-soft">
      <UserRound className="h-4 w-4" />
      LINEでログイン
    </button>
  );

  return (
    <>
      <LiffBootstrap liffId={env.lineLiffId()} enableDevLogin={env.enableDevLogin} />
      <div className="min-h-screen bg-gradient-to-b from-beige via-white to-slate-50 text-slate-900">
        <header className="sticky top-0 z-40 border-b border-white/60 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-navy px-3 py-2 text-white shadow-soft">Re-try Pro</div>
                <div>
                  <div className="text-lg font-semibold text-navy-900">医学部学士編入 完全対策プラットフォーム</div>
                  <div className="text-sm text-slate-500">Next.js + Supabase + LINE LIFF 実装版</div>
                </div>
              </div>
            </div>
            {headerAction}
          </div>
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = currentTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => navigate(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    active ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          {currentTab === 'home' ? (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <section className="overflow-hidden rounded-[32px] bg-navy p-8 text-white shadow-soft">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
                  <Sparkles className="h-4 w-4 text-gold-300" />
                  実データ運用向けに再構築済み
                </div>
                <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl">ハードコードを撤廃した、運用可能な受験対策Webアプリ</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">
                  LIFFでLINE UIDを取得し、Supabase Custom JWT を httpOnly Cookie に保存。以後の API リクエストは認証済みセッションで Supabase に接続し、大学情報・試験日程・過去問・学習記録・コミュニティ投稿をすべて動的に取得します。
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <Stat label="収録大学数" value={summaryQuery.data ? `${summaryQuery.data.universities}` : '...'} icon={UniversityIcon} />
                  <Stat label="過去問数" value={summaryQuery.data ? `${summaryQuery.data.problems}` : '...'} icon={BookOpen} />
                  <Stat label="コミュニティ投稿数" value={summaryQuery.data ? `${summaryQuery.data.messages}` : '...'} icon={MessageSquare} />
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button onClick={() => navigate('universities')} className="rounded-full bg-gold px-5 py-3 font-semibold text-navy-900">
                    大学情報を見る
                  </button>
                  <button onClick={() => navigate('problems')} className="rounded-full border border-white/30 px-5 py-3 font-semibold text-white">
                    過去問を確認
                  </button>
                </div>
              </section>

              <SectionCard title="実装状況" subtitle="この zip でそのまま開発を継続できる構成です。">
                <ul className="space-y-3 text-sm leading-6 text-slate-600">
                  <li>・Next.js App Router に移行し、Tailwind CSS ベースへ全面刷新</li>
                  <li>・Supabase への Fetch / Insert / Update を API Route で実装</li>
                  <li>・LINE LIFF 初期化、ID Token 検証、Custom JWT 発行を実装</li>
                  <li>・React Query による画面遷移・タブ切替時の再取得を実装</li>
                  <li>・ローディング UI / 例外時のフィードバックを全主要画面に実装</li>
                </ul>
                <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="font-medium text-slate-900">ログイン状態</div>
                  {meQuery.isSuccess ? (
                    <div className="mt-2 flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: profile?.avatar_color ?? '#1B2A4A' }}
                      >
                        {profile?.display_name?.slice(0, 1) ?? 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{profile?.display_name}</div>
                        <div className="text-xs text-slate-500">{profile?.is_admin ? '管理者' : '一般ユーザー'} / {profile?.is_premium ? 'プレミアム' : '無料'}</div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2">LINEログイン前でも公開データは閲覧可能です。学習管理・投稿系はログイン後に利用できます。</p>
                  )}
                </div>
              </SectionCard>
            </div>
          ) : null}

          {currentTab === 'universities' ? (
            <SectionCard title="大学情報データベース" subtitle="Supabase の universities テーブルから動的取得しています。">
              <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr]">
                <select value={region} onChange={(e) => setRegion(e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3">
                  {regions.map((value) => (
                    <option key={value} value={value}>{value === 'all' ? '地方: すべて' : value}</option>
                  ))}
                </select>
                <select value={science} onChange={(e) => setScience(e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3">
                  <option value="all">生命科学: すべて</option>
                  <option value="top">生命科学: ◎ のみ</option>
                  <option value="mid">生命科学: ◎ / ○</option>
                </select>
                <input value={uniSearch} onChange={(e) => setUniSearch(e.target.value)} placeholder="大学名・特徴で検索" className="rounded-2xl border border-slate-300 px-4 py-3" />
              </div>

              {universitiesQuery.isLoading ? <LoadingGrid /> : null}
              {universitiesQuery.isError ? <ErrorState message={universitiesQuery.error.message} onRetry={() => universitiesQuery.refetch()} /> : null}
              {universitiesQuery.isSuccess && universities.length === 0 ? <EmptyState title="該当大学がありません" description="条件を変えて再検索してください。" /> : null}

              {universitiesQuery.isSuccess ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {universities.map((university) => (
                    <article key={university.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-navy-900">{university.name}</h3>
                        <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">{university.region}</span>
                      </div>
                      <div className="mt-4 grid gap-3 text-sm text-slate-600">
                        <div className="flex justify-between rounded-2xl bg-white px-4 py-3"><span>生命科学</span><strong>{university.life_sci}</strong></div>
                        <div className="flex justify-between rounded-2xl bg-white px-4 py-3"><span>物理 / 化学</span><strong>{university.physics_chem}</strong></div>
                        <div className="flex justify-between rounded-2xl bg-white px-4 py-3"><span>統計 / 数学</span><strong>{university.stats_math}</strong></div>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-600">{university.note || '備考未設定'}</p>
                    </article>
                  ))}
                </div>
              ) : null}
            </SectionCard>
          ) : null}

          {currentTab === 'schedules' ? (
            <SectionCard title="受験スケジュール" subtitle="exam_schedules テーブルを year で絞り込み、大学マスタと JOIN しています。">
              <div className="mb-6 flex flex-wrap gap-3">
                {[`${new Date().getFullYear()}`, `${new Date().getFullYear() + 1}`, '2026'].map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`rounded-full px-4 py-2 text-sm font-medium ${selectedYear === year ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {year}年度
                  </button>
                ))}
              </div>
              {schedulesQuery.isLoading ? <LoadingGrid /> : null}
              {schedulesQuery.isError ? <ErrorState message={schedulesQuery.error.message} onRetry={() => schedulesQuery.refetch()} /> : null}
              {schedulesQuery.isSuccess && schedulesQuery.data.length === 0 ? <EmptyState title="日程データがありません" description="Supabase seed または管理画面から日程を登録してください。" /> : null}
              {schedulesQuery.isSuccess ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {schedulesQuery.data.map((schedule) => (
                    <div key={schedule.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-navy-900">{schedule.university?.name}</h3>
                          <p className="text-sm text-slate-500">{schedule.university?.region}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-500">{schedule.year}年度</span>
                      </div>
                      <dl className="mt-4 grid gap-3 text-sm text-slate-600">
                        <div className="flex justify-between rounded-2xl bg-white px-4 py-3"><dt>出願開始</dt><dd>{formatDate(schedule.application_start)}</dd></div>
                        <div className="flex justify-between rounded-2xl bg-white px-4 py-3"><dt>出願締切</dt><dd>{formatDate(schedule.application_end)}</dd></div>
                        <div className="flex justify-between rounded-2xl bg-white px-4 py-3"><dt>一次試験</dt><dd>{formatDate(schedule.first_exam_date)}</dd></div>
                        <div className="flex justify-between rounded-2xl bg-white px-4 py-3"><dt>二次試験</dt><dd>{formatDate(schedule.second_exam_date)}</dd></div>
                      </dl>
                      {schedule.memo ? <p className="mt-4 text-sm text-slate-600">{schedule.memo}</p> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </SectionCard>
          ) : null}

          {currentTab === 'problems' ? (
            <SectionCard title="過去問アーカイブ" subtitle="problems テーブルからフィルタリングし、必要に応じて progress を再取得します。">
              <div className="mb-6 grid gap-4 lg:grid-cols-3">
                <select value={problemSubject} onChange={(e) => setProblemSubject(e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3">
                  {subjectOptions.map((value) => (
                    <option key={value} value={value}>{value === 'all' ? '科目: すべて' : value}</option>
                  ))}
                </select>
                <select value={problemUniversityId} onChange={(e) => setProblemUniversityId(e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3">
                  <option value="all">大学: すべて</option>
                  {universities.map((university) => (
                    <option key={university.id} value={university.id}>{university.name}</option>
                  ))}
                </select>
                <select value={problemYear} onChange={(e) => setProblemYear(e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3">
                  {years.map((value) => (
                    <option key={value} value={value}>{value === 'all' ? '年度: すべて' : `${value}年度`}</option>
                  ))}
                </select>
              </div>

              {problemsQuery.isLoading ? <LoadingGrid /> : null}
              {problemsQuery.isError ? <ErrorState message={problemsQuery.error.message} onRetry={() => problemsQuery.refetch()} /> : null}
              {problemsQuery.isSuccess && problems.length === 0 ? <EmptyState title="過去問がありません" description="検索条件を変えるか、seed データを追加してください。" /> : null}

              {problemsQuery.isSuccess ? (
                <div className="space-y-4">
                  {problems.map((problem) => (
                    <article key={problem.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-white px-3 py-1">{problem.subject}</span>
                            <span className="rounded-full bg-white px-3 py-1">{problem.university?.name ?? '大学未設定'}</span>
                            <span className="rounded-full bg-white px-3 py-1">{problem.year}年度</span>
                            <span className="rounded-full bg-white px-3 py-1">難易度 {problem.difficulty}/5</span>
                            {problem.is_premium ? <span className="rounded-full bg-gold-100 px-3 py-1 text-gold-900">プレミアム</span> : <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">無料公開</span>}
                          </div>
                          <h3 className="mt-3 text-lg font-semibold text-navy-900">{problem.question}</h3>
                          {problem.options ? <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">選択肢: {problem.options}</p> : null}
                        </div>
                        <div className="text-sm text-slate-500">{problemProgress[problem.id] ? `進捗: ${problemProgress[problem.id]}` : '未記録'}</div>
                      </div>
                      <div className="mt-4 rounded-2xl bg-white p-4 text-sm leading-6 text-slate-600">
                        {problem.can_view_answer ? (
                          <>
                            <div className="font-medium text-slate-900">解答</div>
                            <p className="mt-2 whitespace-pre-wrap">{problem.answer || '解答未登録'}</p>
                            {problem.answer_detail ? <p className="mt-2 whitespace-pre-wrap text-slate-500">{problem.answer_detail}</p> : null}
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-gold-900"><Lock className="h-4 w-4" /> プレミアム会員のみ解答を閲覧できます。</div>
                        )}
                      </div>
                      {meQuery.isSuccess ? (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button onClick={() => progressMutation.mutate({ problemId: problem.id, status: 'correct' })} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white">正解</button>
                          <button onClick={() => progressMutation.mutate({ problemId: problem.id, status: 'wrong' })} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white">要復習</button>
                          <button onClick={() => progressMutation.mutate({ problemId: problem.id, status: 'bookmarked' })} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700">保存</button>
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-slate-500">進捗記録にはログインが必要です。</p>
                      )}
                    </article>
                  ))}
                </div>
              ) : null}
            </SectionCard>
          ) : null}

          {currentTab === 'dashboard' ? (
            meQuery.isSuccess ? (
              <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                <SectionCard title="学習ダッシュボード" subtitle="study_logs と problem_progress を集計して表示しています。">
                  {dashboardQuery.isLoading ? <LoadingGrid /> : null}
                  {dashboardQuery.isError ? <ErrorState message={dashboardQuery.error.message} onRetry={() => dashboardQuery.refetch()} /> : null}
                  {dashboardQuery.data ? (
                    <>
                      <div className="grid gap-4 md:grid-cols-4">
                        <Stat label="総学習時間" value={`${dashboardQuery.data.stats.totalHours}h`} icon={LineChart} />
                        <Stat label="正解数" value={`${dashboardQuery.data.stats.correctCount}`} icon={Trophy} />
                        <Stat label="正答率" value={`${dashboardQuery.data.stats.accuracy}%`} icon={ChartColumnBig} />
                        <Stat label="連続学習日" value={`${dashboardQuery.data.stats.streakDays}日`} icon={Sparkles} />
                      </div>
                      <div className="mt-6 grid gap-6 lg:grid-cols-2">
                        <div className="rounded-3xl bg-slate-50 p-5">
                          <h3 className="text-base font-semibold text-navy-900">科目別進捗</h3>
                          <div className="mt-4 space-y-4">
                            {dashboardQuery.data.subjectBreakdown.length === 0 ? <EmptyState title="進捗データがありません" description="問題採点または学習記録を登録してください。" /> : null}
                            {dashboardQuery.data.subjectBreakdown.map((item) => (
                              <div key={item.subject}>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium text-slate-700">{item.subject}</span>
                                  <span className="text-slate-500">{item.accuracy}% / {item.minutes}分</span>
                                </div>
                                <div className="mt-2 h-3 rounded-full bg-slate-200">
                                  <div className="h-3 rounded-full bg-navy" style={{ width: `${Math.max(item.accuracy, 5)}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-3xl bg-slate-50 p-5">
                          <h3 className="text-base font-semibold text-navy-900">要復習問題</h3>
                          <div className="mt-4 space-y-3 text-sm text-slate-600">
                            {dashboardQuery.data.weakProblems.length === 0 ? <EmptyState title="要復習問題はありません" description="復習対象ができるとここに表示されます。" /> : null}
                            {dashboardQuery.data.weakProblems.map((problem) => (
                              <div key={problem.id} className="rounded-2xl bg-white p-4">
                                <div className="text-xs text-slate-500">{problem.subject} / {problem.university?.name}</div>
                                <div className="mt-1 font-medium text-slate-800">{problem.question}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 rounded-3xl bg-slate-50 p-5">
                        <h3 className="text-base font-semibold text-navy-900">最新の学習記録</h3>
                        <div className="mt-4 space-y-3">
                          {dashboardQuery.data.studyLogs.length === 0 ? <EmptyState title="学習記録がありません" description="右側のフォームから登録してください。" /> : null}
                          {dashboardQuery.data.studyLogs.map((log) => (
                            <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                              <div>
                                <div className="font-medium text-slate-800">{log.subject}</div>
                                <div>{log.memo || 'メモなし'}</div>
                              </div>
                              <div className="text-right">
                                <div>{log.minutes}分</div>
                                <div className="text-xs text-slate-500">{formatDate(log.logged_on)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}
                </SectionCard>
                <SectionCard title="学習記録を追加" subtitle="Insert 処理は /api/study-logs 経由で Supabase に保存します。">
                  <div className="space-y-4">
                    <select value={studyLog.subject} onChange={(e) => setStudyLog((current) => ({ ...current, subject: e.target.value }))} className="w-full rounded-2xl border border-slate-300 px-4 py-3">
                      {subjectOptions.filter((subject) => subject !== 'all').map((subject) => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                    <input type="number" min={1} max={1440} value={studyLog.minutes} onChange={(e) => setStudyLog((current) => ({ ...current, minutes: Number(e.target.value) }))} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="学習時間（分）" />
                    <input type="date" value={studyLog.logged_on} onChange={(e) => setStudyLog((current) => ({ ...current, logged_on: e.target.value }))} className="w-full rounded-2xl border border-slate-300 px-4 py-3" />
                    <textarea value={studyLog.memo} onChange={(e) => setStudyLog((current) => ({ ...current, memo: e.target.value }))} rows={5} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="学習メモ" />
                    <button onClick={() => studyLogMutation.mutate()} disabled={studyLogMutation.isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-navy px-4 py-3 font-semibold text-white disabled:opacity-50">
                      {studyLogMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                      学習記録を保存
                    </button>
                    {studyLogMutation.isError ? <ErrorState message={studyLogMutation.error.message} /> : null}
                    {studyLogMutation.isSuccess ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">学習記録を保存しました。</div> : null}
                  </div>
                </SectionCard>
              </div>
            ) : (
              <AccessGate title="ダッシュボードはログイン後に利用できます" description="学習記録の追加、統計の集計、ストリーク計算は認証済みユーザー単位で保存されます。" />
            )
          ) : null}

          {currentTab === 'community' ? (
            meQuery.isSuccess ? (
              <div className="grid gap-6 xl:grid-cols-[0.35fr_0.65fr]">
                <SectionCard title="チャンネル" subtitle="community_channels テーブルを動的表示しています。">
                  {channelsQuery.isLoading ? <LoadingGrid /> : null}
                  {channelsQuery.isError ? <ErrorState message={channelsQuery.error.message} onRetry={() => channelsQuery.refetch()} /> : null}
                  <div className="space-y-3">
                    {channels.map((channel) => (
                      <button key={channel.id} onClick={() => setSelectedChannelId(channel.id)} className={`w-full rounded-2xl border px-4 py-3 text-left ${selectedChannelId === channel.id ? 'border-navy bg-navy text-white' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-medium">#{channel.name}</div>
                            <div className={`text-xs ${selectedChannelId === channel.id ? 'text-slate-200' : 'text-slate-500'}`}>{channel.description}</div>
                          </div>
                          {channel.is_premium ? <Crown className="h-4 w-4" /> : null}
                        </div>
                      </button>
                    ))}
                  </div>
                </SectionCard>
                <SectionCard title={activeChannel ? `#${activeChannel.name}` : 'メッセージ'} subtitle={activeChannel?.description ?? 'チャンネルを選択してください。'}>
                  {activeChannel?.is_premium && !profile?.is_premium ? (
                    <AccessGate title="このチャンネルはプレミアム限定です" description="投稿・閲覧にはプレミアム権限が必要です。必要であれば user_profiles.is_premium を true に更新してください。" />
                  ) : (
                    <>
                      {messagesQuery.isLoading ? <LoadingGrid /> : null}
                      {messagesQuery.isError ? <ErrorState message={messagesQuery.error.message} onRetry={() => messagesQuery.refetch()} /> : null}
                      <div className="space-y-4">
                        {messagesQuery.data?.map((message) => (
                          <div key={message.id} className="rounded-3xl bg-slate-50 p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ backgroundColor: message.avatar_color ?? '#1B2A4A' }}>
                                {message.display_name.slice(0, 1)}
                              </div>
                              <div>
                                <div className="font-medium text-slate-900">{message.display_name}</div>
                                <div className="text-xs text-slate-500">{formatDateTime(message.created_at)}</div>
                              </div>
                            </div>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.content}</p>
                          </div>
                        ))}
                        {messagesQuery.data?.length === 0 ? <EmptyState title="まだ投稿がありません" description="最初のメッセージを送信してください。" /> : null}
                      </div>
                      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={4} className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="メッセージを入力" />
                        <div className="mt-3 flex justify-end">
                          <button onClick={() => messageMutation.mutate()} disabled={!messageText.trim() || messageMutation.isPending || !selectedChannelId} className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                            {messageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            送信
                          </button>
                        </div>
                        {messageMutation.isError ? <div className="mt-3"><ErrorState message={messageMutation.error.message} /></div> : null}
                      </div>
                    </>
                  )}
                </SectionCard>
              </div>
            ) : (
              <AccessGate title="コミュニティ機能はログイン後に利用できます" description="投稿は LINE UID と紐づいたプロフィール単位で保存されます。" />
            )
          ) : null}
        </main>
      </div>
    </>
  );
};
