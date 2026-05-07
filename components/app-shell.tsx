'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChartColumnBig,
  CheckCircle2,
  Crown,
  LayoutGrid,
  Loader2,
  Lock,
  LogOut,
  MessageSquare,
  Pin,
  Plus,
  ShieldCheck,
  Sparkles,
  Target,
  University as UniversityIcon,
  UserRound
} from 'lucide-react';
import { format } from 'date-fns';
import { LiffBootstrap } from '@/components/liff-bootstrap';
import { publicLineConfig } from '@/lib/line';
import { formatDate, formatDateTime } from '@/lib/utils';
import type {
  BoardCategory,
  BoardReply,
  BoardThread,
  CommunityChannel,
  CommunityMessage,
  DashboardResponse,
  ExamSchedule,
  Problem,
  SummaryResponse,
  University,
  UserGender,
  UserProfile
} from '@/types/models';

type TabKey = 'home' | 'universities' | 'schedules' | 'problems' | 'dashboard' | 'community' | 'admin';

type MeResponse = {
  authenticated: boolean;
  profile: UserProfile | null;
};

type ProblemsResponse = {
  problems: Problem[];
  progress: Record<string, 'correct' | 'wrong' | 'bookmarked'>;
  profile: Pick<UserProfile, 'id' | 'is_premium'> | null;
};

type OnboardingPayload = {
  full_name: string;
  school_name: string;
  gender: UserGender;
  club_name: string;
};

const tabs: Array<{ key: Exclude<TabKey, 'admin'>; label: string; icon: typeof LayoutGrid }> = [
  { key: 'home', label: 'ホーム', icon: LayoutGrid },
  { key: 'universities', label: '大学比較', icon: UniversityIcon },
  { key: 'schedules', label: '日程', icon: CalendarDays },
  { key: 'problems', label: '過去問', icon: BookOpen },
  { key: 'dashboard', label: '学習記録', icon: ChartColumnBig },
  { key: 'community', label: '掲示板', icon: MessageSquare }
];

const boardCategories: Array<'all' | BoardCategory> = ['all', '相談', '勉強法', '出願', '面接', '雑談'];

const subjectOptions = ['all', '生命科学', '数学', '英語', '化学', '物理', '小論文'];
const genderOptions: UserGender[] = ['男性', '女性', 'その他', '回答しない'];
const regionOptions = ['all', '北海道・東北', '関東', '中部', '近畿', '中国・四国', '九州'];
const scheduleYears = ['2025', '2026', '2027'];

const featureCards = [
  {
    title: '志望校比較',
    description: '地域と大学ごとの特徴をまとめて確認。迷いやすい比較軸を整理できます。',
    tab: 'universities' as const,
    icon: UniversityIcon
  },
  {
    title: '試験日程の見える化',
    description: '出願・一次・二次の流れを年度別に確認し、直前の取りこぼしを防ぎます。',
    tab: 'schedules' as const,
    icon: CalendarDays
  },
  {
    title: '過去問で仕上げる',
    description: '無料問題で感触を掴み、必要ならプレミアムで解説と限定機能へ進めます。',
    tab: 'problems' as const,
    icon: BookOpen
  }
];

const howToUseSteps = [
  {
    title: 'まず志望校を絞る',
    body: '大学比較で地域・出題傾向・メモを確認し、自分に合う候補校を絞り込みます。'
  },
  {
    title: '日程から逆算する',
    body: '出願締切と試験日を確認し、今週やるべき勉強を逆算します。'
  },
  {
    title: '過去問と記録で改善する',
    body: '過去問の進捗と学習ログを残し、苦手分野をダッシュボードで見直します。'
  }
];

const trustPoints = [
  '受験行動に直結する情報だけを、見やすく一画面で整理',
  'LINEログインで使い始めやすく、学習記録まで継続しやすい設計',
  '無料で試し、必要な時だけプレミアムへ進めるわかりやすい導線'
];

const premiumBenefits = [
  'プレミアム問題の解答・解説を解放',
  '限定コミュニティの閲覧・投稿が可能',
  '今後追加される上位機能を優先的に利用'
];

const weeklyTips = [
  '出願締切が近い大学から、志望順位を先に確定する',
  '過去問は「解けた / 解けない」より「なぜ迷ったか」を残す',
  '生命科学・英語・数学のうち、今週の主軸科目を1つ決める'
];

const fetchJson = async <T,>(input: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  const body = (await response.json().catch(() => null)) as T & { error?: string };
  if (!response.ok) throw new Error(body?.error ?? 'データ取得に失敗しました。');
  return body;
};

const requestLogin = () => window.dispatchEvent(new Event('line-login-request'));
const requestLogout = () => window.dispatchEvent(new Event('line-logout-request'));

const SectionCard = ({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) => (
  <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-navy-900 sm:text-xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
    <div className="text-xs font-medium tracking-wide text-slate-500">{label}</div>
    <div className="mt-2 text-2xl font-bold tracking-tight text-navy-900">{value}</div>
  </div>
);

const AccessGate = ({
  title,
  description,
  premium = false,
  onAction
}: {
  title: string;
  description: string;
  premium?: boolean;
  onAction: () => void;
}) => (
  <div className={`rounded-[28px] border p-6 ${premium ? 'border-gold-200 bg-gold-50' : 'border-emerald-200 bg-emerald-50'}`}>
    <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
      {premium ? <Crown className="h-5 w-5 text-gold-900" /> : <UserRound className="h-5 w-5 text-emerald-700" />}
      {title}
    </div>
    <p className="mt-2 text-sm leading-7 text-slate-700">{description}</p>
    <button
      onClick={onAction}
      className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white ${premium ? 'bg-navy' : 'bg-[#06C755]'}`}
    >
      {premium ? <Crown className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
      {premium ? '決済案内へ進む' : 'LINEでログイン'}
    </button>
  </div>
);

const LoadingPanel = () => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="h-36 animate-pulse rounded-[28px] bg-slate-100" />
    ))}
  </div>
);

export const AppShell = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>('home');
  const [billingStatus, setBillingStatus] = useState<'success' | 'cancel' | null>(null);
  const [selectedScheduleYear, setSelectedScheduleYear] = useState('2026');
  const [problemSubject, setProblemSubject] = useState('all');
  const [problemYear, setProblemYear] = useState('all');
  const [problemUniversityId, setProblemUniversityId] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [universitySearch, setUniversitySearch] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [communityMode, setCommunityMode] = useState<'board' | 'chat'>('board');
  const [boardCategory, setBoardCategory] = useState<'all' | BoardCategory>('all');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [showThreadComposer, setShowThreadComposer] = useState(false);
  const [threadDraft, setThreadDraft] = useState<{ title: string; category: BoardCategory; body: string; is_premium: boolean }>({
    title: '',
    category: '相談',
    body: '',
    is_premium: false
  });
  const [replyDraft, setReplyDraft] = useState('');
  const [onboardingForm, setOnboardingForm] = useState<OnboardingPayload>({
    full_name: '',
    school_name: '',
    gender: '回答しない',
    club_name: ''
  });
  const [studyLog, setStudyLog] = useState({
    subject: '生命科学',
    minutes: 60,
    memo: '',
    logged_on: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextTab = params.get('tab') as TabKey | null;
    const billing = params.get('billing');
    if (nextTab) setTab(nextTab);
    if (billing === 'success' || billing === 'cancel') setBillingStatus(billing);
  }, []);

  const navigate = (nextTab: TabKey) => {
    setTab(nextTab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', nextTab);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  const meQuery = useQuery<MeResponse>({ queryKey: ['me'], queryFn: () => fetchJson('/api/me') });
  const summaryQuery = useQuery<SummaryResponse>({ queryKey: ['summary'], queryFn: () => fetchJson('/api/summary') });
  const universitiesQuery = useQuery<University[]>({ queryKey: ['universities'], queryFn: () => fetchJson('/api/universities') });
  const schedulesQuery = useQuery<ExamSchedule[]>({
    queryKey: ['schedules', selectedScheduleYear],
    queryFn: () => fetchJson(`/api/schedules?year=${encodeURIComponent(selectedScheduleYear)}`)
  });
  const problemsQuery = useQuery<ProblemsResponse>({
    queryKey: ['problems', problemSubject, problemYear, problemUniversityId],
    queryFn: () =>
      fetchJson(
        `/api/problems?subject=${encodeURIComponent(problemSubject)}&year=${encodeURIComponent(problemYear)}&universityId=${encodeURIComponent(problemUniversityId)}`
      )
  });

  const profile = meQuery.data?.profile ?? null;
  const isAuthenticated = Boolean(meQuery.data?.authenticated && profile);
  const isPremium = Boolean(profile?.is_premium);

  const dashboardQuery = useQuery<DashboardResponse>({
    queryKey: ['dashboard'],
    queryFn: () => fetchJson('/api/dashboard'),
    enabled: isAuthenticated
  });
  const channelsQuery = useQuery<CommunityChannel[]>({ queryKey: ['channels'], queryFn: () => fetchJson('/api/community/channels') });
  const messagesQuery = useQuery<CommunityMessage[]>({
    queryKey: ['messages', selectedChannelId],
    queryFn: () => fetchJson(`/api/community/messages?channelId=${selectedChannelId}`),
    enabled: Boolean(selectedChannelId && isAuthenticated && isPremium)
  });
  const adminUsersQuery = useQuery<UserProfile[]>({
    queryKey: ['admin-users'],
    queryFn: () => fetchJson('/api/admin/users'),
    enabled: Boolean(profile?.is_admin)
  });

  useEffect(() => {
    if (!selectedChannelId && channelsQuery.data?.length) {
      setSelectedChannelId(channelsQuery.data[0].id);
    }
  }, [channelsQuery.data, selectedChannelId]);

  useEffect(() => {
    if (!profile) return;
    setOnboardingForm({
      full_name: profile.full_name ?? profile.display_name ?? '',
      school_name: profile.school_name ?? '',
      gender: profile.gender ?? '回答しない',
      club_name: profile.club_name ?? ''
    });
  }, [profile]);

  useEffect(() => {
    const onLogin = async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      navigate('dashboard');
    };
    window.addEventListener('line-login-success', onLogin);
    return () => window.removeEventListener('line-login-success', onLogin);
  }, [queryClient]);

  const onboardingMutation = useMutation({
    mutationFn: () =>
      fetchJson('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingForm)
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      navigate('dashboard');
    }
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

  const threadsQuery = useQuery<{ threads: BoardThread[]; isPremium: boolean }>({
    queryKey: ['board-threads', boardCategory],
    queryFn: () => fetchJson(`/api/board/threads?category=${encodeURIComponent(boardCategory)}`)
  });

  const threadDetailQuery = useQuery<BoardThread>({
    queryKey: ['board-thread', activeThreadId],
    queryFn: () => fetchJson(`/api/board/threads/${activeThreadId}`),
    enabled: Boolean(activeThreadId)
  });

  const threadRepliesQuery = useQuery<BoardReply[]>({
    queryKey: ['board-replies', activeThreadId],
    queryFn: () => fetchJson(`/api/board/replies?threadId=${activeThreadId}`),
    enabled: Boolean(activeThreadId)
  });

  const createThreadMutation = useMutation({
    mutationFn: () =>
      fetchJson<BoardThread>('/api/board/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(threadDraft)
      }),
    onSuccess: async (created) => {
      setShowThreadComposer(false);
      setThreadDraft({ title: '', category: '相談', body: '', is_premium: false });
      await queryClient.invalidateQueries({ queryKey: ['board-threads'] });
      await queryClient.invalidateQueries({ queryKey: ['summary'] });
      if (created?.id) setActiveThreadId(created.id);
    }
  });

  const replyMutation = useMutation({
    mutationFn: () =>
      fetchJson('/api/board/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: activeThreadId, content: replyDraft })
      }),
    onSuccess: async () => {
      setReplyDraft('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['board-replies', activeThreadId] }),
        queryClient.invalidateQueries({ queryKey: ['board-threads'] }),
        queryClient.invalidateQueries({ queryKey: ['board-thread', activeThreadId] })
      ]);
    }
  });

  const upgradeMutation = useMutation({
    mutationFn: () => fetchJson<{ url: string; alreadyPremium?: boolean }>('/api/stripe/checkout', { method: 'POST' }),
    onSuccess: async (data) => {
      if (data.alreadyPremium) {
        setBillingStatus('success');
        await queryClient.invalidateQueries({ queryKey: ['me'] });
        navigate('problems');
        return;
      }
      if (data.url) window.location.href = data.url;
    }
  });

  const handleUpgrade = () => {
    if (!isAuthenticated) {
      requestLogin();
      return;
    }
    upgradeMutation.mutate();
  };

  const universities = universitiesQuery.data ?? [];
  const schedules = schedulesQuery.data ?? [];
  const problems = problemsQuery.data?.problems ?? [];
  const progressMap = problemsQuery.data?.progress ?? {};
  const dashboard = dashboardQuery.data;
  const channels = channelsQuery.data ?? [];

  const filteredUniversities = useMemo(() => {
    return universities.filter((university) => {
      const matchesRegion = regionFilter === 'all' || university.region === regionFilter;
      const text = `${university.name} ${university.note ?? ''}`.toLowerCase();
      const matchesSearch = !universitySearch || text.includes(universitySearch.toLowerCase());
      return matchesRegion && matchesSearch;
    });
  }, [regionFilter, universities, universitySearch]);

  const problemYears = useMemo(() => {
    const values = new Set<string>(['all']);
    problems.forEach((problem) => values.add(String(problem.year)));
    return [...values];
  }, [problems]);

  const quickUniversityOptions = useMemo(() => universities.map((item) => ({ id: item.id, name: item.name })), [universities]);

  const tabItems = useMemo<Array<{ key: TabKey; label: string; icon: typeof LayoutGrid }>>(() => {
    const items: Array<{ key: TabKey; label: string; icon: typeof LayoutGrid }> = [...tabs];
    if (profile?.is_admin) items.push({ key: 'admin', label: '管理者', icon: ShieldCheck });
    return items;
  }, [profile?.is_admin]);

  const handleFeatureClick = (targetTab: TabKey) => {
    if (targetTab === 'dashboard' && !isAuthenticated) {
      requestLogin();
      return;
    }
    navigate(targetTab);
  };

  const handleOpenThread = (thread: BoardThread) => {
    if (thread.is_premium && !isPremium) {
      handleUpgrade();
      return;
    }
    setActiveThreadId(thread.id);
  };

  const handleStartThreadCompose = () => {
    if (!isAuthenticated) {
      requestLogin();
      return;
    }
    setShowThreadComposer(true);
  };

  const renderHome = () => (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-soft">
        <div className="grid gap-8 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-xs font-semibold tracking-wide text-slate-600">
              Re-try / 医学部学士編入サポート
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy-900 sm:text-5xl">
              受験の不安を、
              <span className="block">次の一手に変える。</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Re-try は、医学部学士編入に必要な大学比較、試験日程、過去問、学習記録をひとつにまとめた受験プラットフォームです。
              何を見て、何から進めるかを迷わないように、受験生に必要な情報をわかりやすく整理しています。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => navigate('universities')} className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white">
                志望校を比較する
                <ArrowRight className="h-4 w-4" />
              </button>
              {isAuthenticated ? (
                <button onClick={() => navigate('dashboard')} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
                  学習記録を見る
                </button>
              ) : (
                <button onClick={requestLogin} className="inline-flex items-center gap-2 rounded-full border border-[#06C755] bg-[#06C755] px-5 py-3 text-sm font-semibold text-white">
                  <UserRound className="h-4 w-4" />
                  LINEで始める
                </button>
              )}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">情報の起点</div>
                <div className="mt-2 text-lg font-semibold text-navy-900">大学比較</div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">実行の起点</div>
                <div className="mt-2 text-lg font-semibold text-navy-900">日程確認</div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">改善の起点</div>
                <div className="mt-2 text-lg font-semibold text-navy-900">学習記録</div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy-900">
              <Sparkles className="h-4 w-4" />
              Re-try が大切にしていること
            </div>
            <div className="mt-4 space-y-3">
              {trustPoints.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-white p-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div className="text-sm leading-6 text-slate-700">{item}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-navy px-4 py-4 text-sm leading-7 text-white">
              キャッチフレーズ
              <div className="mt-1 text-lg font-semibold">「迷う時間を減らし、前に進む時間を増やす。」</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="掲載大学数" value={summaryQuery.isLoading ? '...' : `${summaryQuery.data?.universities ?? 0}`} />
        <StatCard label="公開問題数" value={summaryQuery.isLoading ? '...' : `${summaryQuery.data?.problems ?? 0}`} />
        <StatCard label="掲示板スレッド数" value={summaryQuery.isLoading ? '...' : `${summaryQuery.data?.boardThreads ?? 0}`} />
        <StatCard label="プラン状態" value={isPremium ? 'プレミアム' : '無料プラン'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {featureCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              onClick={() => handleFeatureClick(card.tab)}
              className="rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-soft transition hover:-translate-y-0.5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-navy-900">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-lg font-semibold text-navy-900">{card.title}</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-navy-900">
                開く
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionCard title="まず見るべき3ステップ" subtitle="初めて使う人でも迷わないよう、順番を固定しています。">
          <div className="grid gap-4 md:grid-cols-3">
            {howToUseSteps.map((step, index) => (
              <div key={step.title} className="rounded-3xl bg-slate-50 p-4">
                <div className="text-xs font-semibold tracking-wide text-slate-500">STEP {index + 1}</div>
                <div className="mt-2 text-base font-semibold text-navy-900">{step.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="今週の進め方" subtitle="受験生がつまずきやすいポイントを短く整理しました。">
          <div className="space-y-3">
            {weeklyTips.map((tip) => (
              <div key={tip} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                <Target className="mt-0.5 h-5 w-5 shrink-0 text-navy-900" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="プレミアムで解放されること" subtitle="無料で試したあと、必要なタイミングでアップグレードできます。">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid gap-3 md:grid-cols-3">
            {premiumBenefits.map((item) => (
              <div key={item} className="rounded-3xl border border-gold-200 bg-gold-50 p-4 text-sm leading-6 text-gold-900">
                <div className="mb-2 inline-flex rounded-full bg-white px-2 py-1 text-xs font-semibold text-gold-900">プレミアム</div>
                {item}
              </div>
            ))}
          </div>
          {!isPremium ? (
            <button onClick={handleUpgrade} className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white">
              <Crown className="h-4 w-4" />
              決済案内へ進む
            </button>
          ) : null}
        </div>
      </SectionCard>
    </div>
  );

  const renderUniversities = () => (
    <div className="space-y-6">
      <SectionCard title="大学比較" subtitle="地域や校名から候補校を絞り込み、出題傾向の違いをつかめます。">
        <div className="mb-4 grid gap-3 md:grid-cols-[180px_1fr]">
          <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
            {regionOptions.map((region) => (
              <option key={region} value={region}>{region === 'all' ? '全地域' : region}</option>
            ))}
          </select>
          <input
            value={universitySearch}
            onChange={(e) => setUniversitySearch(e.target.value)}
            placeholder="大学名やメモで検索"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />
        </div>

        {universitiesQuery.isLoading ? <LoadingPanel /> : null}

        {!universitiesQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredUniversities.map((university) => (
              <div key={university.id} className="rounded-[28px] border border-slate-200 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-navy-900">{university.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{university.region}</div>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">比較用</div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">生命科学: {university.life_sci}</div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">物理 / 化学: {university.physics_chem}</div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">統計 / 数学: {university.stats_math}</div>
                </div>
                {university.note ? <p className="mt-4 text-sm leading-6 text-slate-600">{university.note}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
      </SectionCard>
    </div>
  );

  const renderSchedules = () => (
    <div className="space-y-6">
      <SectionCard title="試験日程" subtitle="出願から二次試験までを年度別に整理し、計画に落とし込みやすくしています。">
        <div className="mb-4 flex flex-wrap gap-2">
          {scheduleYears.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedScheduleYear(year)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedScheduleYear === year ? 'bg-navy text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              {year}年度
            </button>
          ))}
        </div>

        {schedulesQuery.isLoading ? <LoadingPanel /> : null}

        {!schedulesQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="rounded-[28px] border border-slate-200 p-5">
                <div className="text-lg font-semibold text-navy-900">{schedule.university?.name ?? '大学名未設定'}</div>
                <div className="mt-1 text-sm text-slate-500">{schedule.university?.region ?? '地域未設定'} / {schedule.year}年度</div>
                <div className="mt-4 space-y-2 text-sm text-slate-700">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">出願開始: {formatDate(schedule.application_start)}</div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">出願締切: {formatDate(schedule.application_end)}</div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">一次試験: {formatDate(schedule.first_exam_date)}</div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">二次試験: {formatDate(schedule.second_exam_date)}</div>
                </div>
                {schedule.memo ? <p className="mt-4 text-sm leading-6 text-slate-600">{schedule.memo}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
      </SectionCard>
    </div>
  );

  const renderProblems = () => (
    <div className="space-y-6">
      <SectionCard
        title="過去問"
        subtitle="まずは無料問題で感触を確認し、解説が必要な場面でプレミアムへ進める構成です。"
        action={
          !isPremium ? (
            <button onClick={handleUpgrade} disabled={upgradeMutation.isPending} className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {upgradeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
              決済案内へ進む
            </button>
          ) : null
        }
      >
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <select value={problemSubject} onChange={(e) => setProblemSubject(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
            {subjectOptions.map((subject) => (
              <option key={subject} value={subject}>{subject === 'all' ? '全科目' : subject}</option>
            ))}
          </select>
          <select value={problemYear} onChange={(e) => setProblemYear(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
            {problemYears.map((year) => (
              <option key={year} value={year}>{year === 'all' ? '全年' : `${year}年`}</option>
            ))}
          </select>
          <select value={problemUniversityId} onChange={(e) => setProblemUniversityId(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
            <option value="all">全大学</option>
            {quickUniversityOptions.map((university) => (
              <option key={university.id} value={university.id}>{university.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          {problems.map((problem) => (
            <div key={problem.id} className="rounded-[28px] border border-slate-200 p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{problem.subject}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{problem.year}年</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">難易度 {problem.difficulty}</span>
                <span className={`rounded-full px-3 py-1 ${problem.is_premium ? 'bg-gold-50 text-gold-900' : 'bg-emerald-50 text-emerald-700'}`}>
                  {problem.is_premium ? 'プレミアム' : '無料'}
                </span>
              </div>
              <div className="mt-3 text-sm font-medium text-slate-500">{problem.university?.name ?? '大学未設定'}</div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-800">{problem.question}</div>
              {problem.options ? <div className="mt-3 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">{problem.options}</div> : null}

              {problem.can_view_answer ? (
                <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                  <div className="font-semibold text-navy-900">解答</div>
                  <div className="mt-2">{problem.answer ?? '未設定'}</div>
                  {problem.answer_detail ? <div className="mt-2 text-slate-600">{problem.answer_detail}</div> : null}
                </div>
              ) : (
                <div className="mt-4 rounded-3xl border border-gold-200 bg-gold-50 p-4 text-sm text-gold-900">
                  <div className="flex items-center gap-2 font-semibold">
                    <Lock className="h-4 w-4" />
                    プレミアム会員のみ解答を閲覧できます
                  </div>
                  <p className="mt-2 leading-6">解答解説や限定コミュニティが必要な場合は、決済案内からアップグレードしてください。</p>
                  <button onClick={handleUpgrade} className="mt-3 rounded-full bg-navy px-4 py-2 text-white">決済案内へ進む</button>
                </div>
              )}

              {isAuthenticated ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(['correct', 'wrong', 'bookmarked'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => progressMutation.mutate({ problemId: problem.id, status })}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${progressMap[problem.id] === status ? 'bg-navy text-white' : 'border border-slate-200 bg-white text-slate-700'}`}
                    >
                      {status === 'correct' ? '正解' : status === 'wrong' ? '復習' : '保存'}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-4 text-sm text-slate-500">進捗保存にはログインが必要です。</div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const renderDashboard = () => {
    if (!isAuthenticated) {
      return <AccessGate title="学習記録はログイン後に利用可能" description="LINEログイン後、学習ログとダッシュボードを継続して使えます。" onAction={requestLogin} />;
    }

    return (
      <div className="space-y-6">
        {!profile?.onboarding_completed ? (
          <SectionCard title="初回プロフィール設定" subtitle="学習記録とコミュニティ表示を使いやすくするための最小限の設定です。">
            <div className="grid gap-3 md:grid-cols-2">
              <input value={onboardingForm.full_name} onChange={(e) => setOnboardingForm((current) => ({ ...current, full_name: e.target.value }))} placeholder="氏名" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <input value={onboardingForm.school_name} onChange={(e) => setOnboardingForm((current) => ({ ...current, school_name: e.target.value }))} placeholder="学校名" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <select value={onboardingForm.gender} onChange={(e) => setOnboardingForm((current) => ({ ...current, gender: e.target.value as UserGender }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                {genderOptions.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
              </select>
              <input value={onboardingForm.club_name} onChange={(e) => setOnboardingForm((current) => ({ ...current, club_name: e.target.value }))} placeholder="部活動" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            </div>
            <button onClick={() => onboardingMutation.mutate()} className="mt-4 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">保存する</button>
          </SectionCard>
        ) : null}

        <SectionCard title="学習サマリー" subtitle="進捗を定量的に見て、次に何をやるべきか判断しやすくします。">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="総学習時間" value={`${dashboard?.stats.totalHours ?? 0}h`} />
            <StatCard label="正解数" value={`${dashboard?.stats.correctCount ?? 0}`} />
            <StatCard label="正答率" value={`${dashboard?.stats.accuracy ?? 0}%`} />
            <StatCard label="連続学習日数" value={`${dashboard?.stats.streakDays ?? 0}日`} />
          </div>
        </SectionCard>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <SectionCard title="学習ログを追加" subtitle="今日の勉強を残すだけで、継続状況が見える化されます。">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <select value={studyLog.subject} onChange={(e) => setStudyLog((current) => ({ ...current, subject: e.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                {subjectOptions.filter((item) => item !== 'all').map((subject) => <option key={subject} value={subject}>{subject}</option>)}
              </select>
              <input type="number" value={studyLog.minutes} onChange={(e) => setStudyLog((current) => ({ ...current, minutes: Number(e.target.value) }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <input type="date" value={studyLog.logged_on} onChange={(e) => setStudyLog((current) => ({ ...current, logged_on: e.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <input value={studyLog.memo} onChange={(e) => setStudyLog((current) => ({ ...current, memo: e.target.value }))} placeholder="メモ" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            </div>
            <button onClick={() => studyLogMutation.mutate()} className="mt-4 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">保存する</button>
          </SectionCard>

          <SectionCard title="苦手の見直し" subtitle="復習対象をすぐ拾えるように、直近の弱点を並べています。">
            <div className="space-y-3">
              {(dashboard?.weakProblems ?? []).length ? (
                dashboard?.weakProblems.map((problem) => (
                  <div key={problem.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-sm font-semibold text-navy-900">{problem.subject} / {problem.university?.name ?? '大学未設定'}</div>
                    <div className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{problem.question}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">復習登録された問題はまだありません。</div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    );
  };

  const renderBoardThreadDetail = (thread: BoardThread) => {
    const replies = threadRepliesQuery.data ?? [];
    return (
      <SectionCard
        title={thread.title}
        subtitle={`カテゴリ: ${thread.category} / 返信 ${thread.reply_count} 件 / ${thread.is_premium ? 'プレミアム限定' : '誰でも閲覧可'}`}
        action={
          <button
            onClick={() => setActiveThreadId(null)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            一覧へ
          </button>
        }
      >
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-navy-900">{thread.display_name}</span>
            <span className="text-slate-500">{formatDateTime(thread.created_at)}</span>
          </div>
          <div className="mt-2 whitespace-pre-wrap">{thread.body}</div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold text-navy-900">返信一覧</div>
          <div className="mt-3 space-y-3">
            {replies.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                まだ返信はありません。最初の一人になりましょう。
              </div>
            ) : (
              replies.map((reply, index) => (
                <div key={reply.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-navy-900">
                      {index + 1}. {reply.display_name}
                      {reply.is_tutor ? <span className="ml-2 rounded-full bg-navy px-2 py-0.5 text-[10px] text-white">運営</span> : null}
                    </span>
                    <span className="text-slate-500">{formatDateTime(reply.created_at)}</span>
                  </div>
                  <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{reply.content}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
          {thread.is_closed ? (
            <div className="text-sm text-slate-500">このスレッドは閉鎖済みです。</div>
          ) : !isAuthenticated ? (
            <button onClick={requestLogin} className="inline-flex items-center gap-2 rounded-full bg-[#06C755] px-4 py-2 text-sm font-semibold text-white">
              <UserRound className="h-4 w-4" />
              返信するにはLINEログイン
            </button>
          ) : thread.is_premium && !isPremium ? (
            <button onClick={handleUpgrade} className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
              <Crown className="h-4 w-4" />
              プレミアムで返信する
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                placeholder="返信を入力 (規約遵守、個人情報・誘引限定のリンクは NG)"
                rows={4}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => replyMutation.mutate()}
                  disabled={!replyDraft.trim() || replyMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                  返信を送信
                </button>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    );
  };

  const renderBoardList = () => {
    const threads = threadsQuery.data?.threads ?? [];

    return (
      <div className="space-y-6">
        <SectionCard
          title="掲示板"
          subtitle="受験生同士で質問と情報をスレッドで交換できます。規約遵守をお願いします。"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleStartThreadCompose}
                className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                スレッドを立てる
              </button>
            </div>
          }
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {boardCategories.map((category) => (
              <button
                key={category}
                onClick={() => setBoardCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${boardCategory === category ? 'bg-navy text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                {category === 'all' ? 'すべて' : category}
              </button>
            ))}
          </div>

          {showThreadComposer ? (
            <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-sm font-semibold text-navy-900">新しいスレッドを作成</div>
              <div className="mt-4 grid gap-3">
                <input
                  value={threadDraft.title}
                  onChange={(e) => setThreadDraft((current) => ({ ...current, title: e.target.value }))}
                  placeholder="スレッドタイトル（2〜60文字）"
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                />
                <select
                  value={threadDraft.category}
                  onChange={(e) => setThreadDraft((current) => ({ ...current, category: e.target.value as BoardCategory }))}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                >
                  {(['相談', '勉強法', '出願', '面接', '雑談'] as BoardCategory[]).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <textarea
                  value={threadDraft.body}
                  onChange={(e) => setThreadDraft((current) => ({ ...current, body: e.target.value }))}
                  placeholder="本文（2〜2000文字、個人情報の公開は避けてください）"
                  rows={5}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                />
                {isPremium ? (
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={threadDraft.is_premium}
                      onChange={(e) => setThreadDraft((current) => ({ ...current, is_premium: e.target.checked }))}
                    />
                    プレミアム会員限定として公開
                  </label>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  onClick={() => {
                    setShowThreadComposer(false);
                    setThreadDraft({ title: '', category: '相談', body: '', is_premium: false });
                  }}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => createThreadMutation.mutate()}
                  disabled={!threadDraft.title.trim() || !threadDraft.body.trim() || createThreadMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {createThreadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  スレッドを作成
                </button>
              </div>
            </div>
          ) : null}

          {threadsQuery.isLoading ? <LoadingPanel /> : null}

          {!threadsQuery.isLoading ? (
            <div className="space-y-3">
              {threads.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  該当するスレッドがまだありません。最初の一人になりましょう。
                </div>
              ) : (
                threads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => handleOpenThread(thread)}
                    className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-soft transition hover:-translate-y-0.5"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      {thread.is_pinned ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-amber-800">
                          <Pin className="h-3 w-3" />
                          固定
                        </span>
                      ) : null}
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{thread.category}</span>
                      <span
                        className={`rounded-full px-3 py-1 ${
                          thread.is_premium ? 'bg-gold-50 text-gold-900' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {thread.is_premium ? 'プレミアム限定' : '誰でも閲覧可'}
                      </span>
                      {thread.is_closed ? (
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">閉鎖済み</span>
                      ) : null}
                    </div>
                    <div className="mt-3 text-base font-semibold text-navy-900 sm:text-lg">{thread.title}</div>
                    <div className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{thread.body}</div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{thread.display_name} ・ {formatDateTime(thread.created_at)}</span>
                      <span>返信 {thread.reply_count} 件 ・ 最終更新 {formatDateTime(thread.last_reply_at ?? thread.updated_at)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </SectionCard>
      </div>
    );
  };

  const renderCommunity = () => {
    if (activeThreadId) {
      if (threadDetailQuery.isLoading) return <LoadingPanel />;
      if (threadDetailQuery.data) return renderBoardThreadDetail(threadDetailQuery.data);
      return (
        <div className="space-y-4">
          <button
            onClick={() => setActiveThreadId(null)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            一覧へ戻る
          </button>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            スレッドを読み込めませんでした。限定スレッドの可能性があります。
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCommunityMode('board')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${communityMode === 'board' ? 'bg-navy text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            掲示板
          </button>
          <button
            onClick={() => setCommunityMode('chat')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${communityMode === 'chat' ? 'bg-navy text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            チャットチャンネル
          </button>
        </div>

        {communityMode === 'board' ? renderBoardList() : null}

        {communityMode === 'chat' ? (
          !isAuthenticated ? (
            <AccessGate title="チャットはログイン後に利用可能" description="LINEログイン後、無料チャンネルを閲覧できます。" onAction={requestLogin} />
          ) : !isPremium ? (
            <AccessGate
              title="プレミアムチャンネルはプレミアム会員向け"
              description="チャット形式の限定チャンネルを使うにはプレミアムへのアップグレードが必要です。"
              premium
              onAction={handleUpgrade}
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <SectionCard title="チャンネル一覧" subtitle="用途ごとにチャットの場を分けています。">
                <div className="space-y-2">
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannelId(channel.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm ${selectedChannelId === channel.id ? 'border-navy bg-slate-50' : 'border-slate-200 bg-white'}`}
                    >
                      <div className="font-semibold text-navy-900">{channel.name}</div>
                      <div className="mt-1 text-slate-500">{channel.description}</div>
                    </button>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="メッセージ" subtitle="質問は短く区切って送ると、あとで見返しやすくなります。">
                <div className="space-y-3">
                  {(messagesQuery.data ?? []).map((message) => (
                    <div key={message.id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-navy-900">{message.display_name}</div>
                      <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.content}</div>
                      <div className="mt-2 text-xs text-slate-500">{formatDateTime(message.created_at)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-3">
                  <input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="メッセージを入力"
                    className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  />
                  <button onClick={() => messageMutation.mutate()} className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
                    送信
                  </button>
                </div>
              </SectionCard>
            </div>
          )
        ) : null}
      </div>
    );
  };

  const renderAdmin = () => {
    if (!profile?.is_admin) {
      return <AccessGate title="管理画面" description="管理者権限が必要です。" onAction={() => navigate('home')} />;
    }

    return (
      <SectionCard title="登録ユーザー一覧" subtitle="運営確認用のシンプルな一覧です。">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(adminUsersQuery.data ?? []).map((user) => (
            <div key={user.id} className="rounded-[28px] border border-slate-200 p-5 text-sm text-slate-700">
              <div className="text-lg font-semibold text-navy-900">{user.display_name}</div>
              <div className="mt-2 leading-6">学校: {user.school_name ?? '-'}</div>
              <div className="leading-6">プレミアム: {user.is_premium ? 'はい' : 'いいえ'}</div>
              <div className="leading-6">登録日: {formatDateTime(user.created_at)}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <LiffBootstrap liffId={publicLineConfig.liffId} enableDevLogin={publicLineConfig.enableDevLogin} />

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="text-2xl font-bold tracking-tight text-navy-900">Re-try</div>
            <div className="text-sm text-slate-500">医学部学士編入の不安を、次の一手に変える</div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className={`rounded-full px-4 py-2 text-sm font-semibold ${isPremium ? 'bg-gold-50 text-gold-900' : 'bg-slate-100 text-slate-700'}`}>
                  {isPremium ? 'プレミアム' : '無料プラン'}
                </div>
                {!isPremium ? (
                  <button onClick={handleUpgrade} disabled={upgradeMutation.isPending} className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                    {upgradeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                    決済案内へ進む
                  </button>
                ) : null}
                <button onClick={requestLogout} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                  <LogOut className="h-4 w-4" />
                  ログアウト
                </button>
              </>
            ) : (
              <button onClick={requestLogin} className="inline-flex items-center gap-2 rounded-full bg-[#06C755] px-5 py-2.5 text-sm font-semibold text-white">
                <UserRound className="h-4 w-4" />
                LINEでログイン
              </button>
            )}
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 pb-4 sm:px-6 lg:px-8">
          {tabItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${tab === item.key ? 'bg-navy text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {billingStatus === 'success' ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            決済が完了しました。プレミアム状態の反映を確認してください。
          </div>
        ) : null}
        {billingStatus === 'cancel' ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            決済はキャンセルされました。必要であれば再度お試しください。
          </div>
        ) : null}

        {tab === 'home' ? renderHome() : null}
        {tab === 'universities' ? renderUniversities() : null}
        {tab === 'schedules' ? renderSchedules() : null}
        {tab === 'problems' ? renderProblems() : null}
        {tab === 'dashboard' ? renderDashboard() : null}
        {tab === 'community' ? renderCommunity() : null}
        {tab === 'admin' ? renderAdmin() : null}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>Re-try は、大学比較・日程・過去問・学習記録を一体化した受験支援アプリです。</div>
          <div className="flex items-center gap-4">
            <Link href="/legal/tokushoho" className="font-semibold text-navy-900">特定商取引法に基づく表記</Link>
          </div>
        </div>
      </footer>

      {(summaryQuery.isLoading || universitiesQuery.isLoading || schedulesQuery.isLoading || problemsQuery.isLoading) && (
        <div className="fixed bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm text-white shadow-soft">
          <Loader2 className="h-4 w-4 animate-spin" />
          読み込み中
        </div>
      )}
    </div>
  );
};
