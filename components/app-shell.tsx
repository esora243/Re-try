'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Crown,
  ExternalLink,
  Filter,
  Loader2,
  Lock,
  LogOut,
  MessageSquare,
  Pin,
  Plus,
  Search,
  ShieldCheck,
  University as UniversityIcon,
  UserRound
} from 'lucide-react';
import { format } from 'date-fns';
import { LiffBootstrap } from '@/components/liff-bootstrap';
import { BottomNav, type BottomTabKey } from '@/components/bottom-nav';
import { publicLineConfig } from '@/lib/line';
import { formatDate, formatDateTime, formatPriceJPY } from '@/lib/utils';
import {
  Badge,
  Card,
  EmptyState,
  FadeIn,
  ProgressBar,
  SectionCard,
  SelectField,
  SkeletonGrid,
  TapButton,
  TextField,
  TextareaField
} from '@/components/ui';
import type {
  AdmissionInfo,
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

type TabKey = BottomTabKey | 'admin';

type MeResponse = { authenticated: boolean; profile: UserProfile | null };
type ProblemsResponse = {
  problems: Problem[];
  progress: Record<string, 'correct' | 'wrong' | 'bookmarked'>;
  profile: Pick<UserProfile, 'id' | 'is_premium'> | null;
};
type UniversityDetailResponse = { university: University; problems: Problem[] };
type OnboardingPayload = { full_name: string; school_name: string; gender: UserGender; club_name: string };

const subjectOptions = ['all', '生命科学', '数学', '英語', '化学', '物理', '小論文'];
const genderOptions: UserGender[] = ['男性', '女性', 'その他', '回答しない'];
const regionOptions = ['all', '北海道・東北', '関東', '中部', '近畿', '中国・四国', '九州'];
const boardCategories: Array<'all' | BoardCategory> = ['all', '相談', '勉強法', '出願', '面接', '雑談'];
const problemFilterOptions = [
  { key: 'all', label: 'すべて' },
  { key: 'unfinished', label: '未着手' },
  { key: 'wrong', label: '復習対象' },
  { key: 'bookmarked', label: '保存' }
] as const;

const PREMIUM_PRICE = 30000;

const fetchJson = async <T,>(input: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  const body = (await response.json().catch(() => null)) as T & { error?: string };
  if (!response.ok) throw new Error(body?.error ?? '通信に失敗しました。少し時間をおいて再度お試しください。');
  return body;
};

const requestLogin = () => window.dispatchEvent(new Event('line-login-request'));
const requestLogout = () => window.dispatchEvent(new Event('line-logout-request'));

export const AppShell = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>('home');
  const [billingStatus, setBillingStatus] = useState<'success' | 'cancel' | null>(null);

  const [problemSubject, setProblemSubject] = useState('all');
  const [problemYear, setProblemYear] = useState('all');
  const [problemUniversityId, setProblemUniversityId] = useState('all');
  const [problemFilter, setProblemFilter] = useState<(typeof problemFilterOptions)[number]['key']>('all');
  const [problemSearch, setProblemSearch] = useState('');

  const [regionFilter, setRegionFilter] = useState('all');
  const [universitySearch, setUniversitySearch] = useState('');
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);

  const [studyLogSort, setStudyLogSort] = useState<'date_desc' | 'minutes_desc' | 'subject'>('date_desc');
  const [studyLogSubject, setStudyLogSubject] = useState('all');

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

  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [messageText, setMessageText] = useState('');

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
    setSelectedUniversityId(null);
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.set('tab', nextTab);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  const meQuery = useQuery<MeResponse>({ queryKey: ['me'], queryFn: () => fetchJson('/api/me') });
  const summaryQuery = useQuery<SummaryResponse>({ queryKey: ['summary'], queryFn: () => fetchJson('/api/summary') });
  const universitiesQuery = useQuery<University[]>({ queryKey: ['universities'], queryFn: () => fetchJson('/api/universities') });
  const problemsQuery = useQuery<ProblemsResponse>({
    queryKey: ['problems', problemSubject, problemYear, problemUniversityId],
    queryFn: () =>
      fetchJson(
        `/api/problems?subject=${encodeURIComponent(problemSubject)}&year=${encodeURIComponent(problemYear)}&universityId=${encodeURIComponent(problemUniversityId)}`
      )
  });
  const universityDetailQuery = useQuery<UniversityDetailResponse>({
    queryKey: ['university-detail', selectedUniversityId],
    queryFn: () => fetchJson(`/api/universities/${selectedUniversityId}`),
    enabled: Boolean(selectedUniversityId)
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

  useEffect(() => {
    if (!selectedChannelId && channelsQuery.data?.length) setSelectedChannelId(channelsQuery.data[0].id);
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
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['university-detail'] })
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

  const handleUpgrade = () => {
    if (!isAuthenticated) {
      requestLogin();
      return;
    }
    upgradeMutation.mutate();
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

  const universities = universitiesQuery.data ?? [];
  const problems = problemsQuery.data?.problems ?? [];
  const progressMap = problemsQuery.data?.progress ?? {};
  const dashboard = dashboardQuery.data;

  const filteredUniversities = useMemo(() => {
    return universities.filter((university) => {
      const matchesRegion = regionFilter === 'all' || university.region === regionFilter;
      const text = `${university.name} ${university.prefecture ?? ''} ${university.note ?? ''}`.toLowerCase();
      const matchesSearch = !universitySearch || text.includes(universitySearch.toLowerCase());
      return matchesRegion && matchesSearch;
    });
  }, [regionFilter, universities, universitySearch]);

  const problemYears = useMemo(() => {
    const values = new Set<string>(['all']);
    problems.forEach((problem) => values.add(String(problem.year)));
    return [...values];
  }, [problems]);

  const filteredProblems = useMemo(() => {
    const keyword = problemSearch.trim().toLowerCase();
    return problems.filter((problem) => {
      const status = progressMap[problem.id];
      if (problemFilter === 'unfinished' && status) return false;
      if (problemFilter === 'wrong' && status !== 'wrong') return false;
      if (problemFilter === 'bookmarked' && status !== 'bookmarked') return false;
      if (!keyword) return true;
      const text = `${problem.subject} ${problem.question ?? ''} ${problem.university?.name ?? ''}`.toLowerCase();
      return text.includes(keyword);
    });
  }, [problemFilter, problemSearch, problems, progressMap]);

  const sortedStudyLogs = useMemo(() => {
    const logs = (dashboard?.studyLogs ?? []).filter((log) => studyLogSubject === 'all' || log.subject === studyLogSubject);
    if (studyLogSort === 'minutes_desc') return [...logs].sort((a, b) => b.minutes - a.minutes);
    if (studyLogSort === 'subject') return [...logs].sort((a, b) => a.subject.localeCompare(b.subject));
    return [...logs].sort((a, b) => b.logged_on.localeCompare(a.logged_on));
  }, [dashboard?.studyLogs, studyLogSort, studyLogSubject]);

  const showAdminTab = Boolean(profile?.is_admin);

  const billingBanner =
    billingStatus === 'success' ? (
      <FadeIn>
        <Card className="border-emerald-200 bg-emerald-50 text-sm text-emerald-800">
          ご購入ありがとうございます。すべての機能が解放されました。
        </Card>
      </FadeIn>
    ) : billingStatus === 'cancel' ? (
      <FadeIn>
        <Card className="border-amber-200 bg-amber-50 text-sm text-amber-800">
          お支払いはキャンセルされました。気になったらいつでも続きから進められます。
        </Card>
      </FadeIn>
    ) : null;

  const upgradeCard = !isPremium ? (
    <SectionCard title="すべての機能を解放" subtitle="一度の支払いで、ずっと使えます。">
      <div className="rounded-3xl bg-cream-50 p-4">
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold text-navy-900">{formatPriceJPY(PREMIUM_PRICE)}</div>
          <div className="text-xs text-slate-500">税込・買い切り</div>
        </div>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />過去問本文と解説を閲覧</li>
          <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />掲示板の限定スレッドに参加</li>
          <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />これから追加される機能も追加料金なし</li>
        </ul>
        <TapButton variant="primary" onClick={handleUpgrade} disabled={upgradeMutation.isPending} className="mt-4 w-full">
          {upgradeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
          {formatPriceJPY(PREMIUM_PRICE)}を支払って解放する
        </TapButton>
        <p className="mt-2 text-[11px] leading-5 text-slate-500">デジタル商品の特性上、決済後の返金はお受けできません。</p>
      </div>
    </SectionCard>
  ) : null;

  const renderHome = () => (
    <div className="space-y-4">
      <FadeIn>
        <Card className="bg-gradient-to-br from-navy to-[#3253c8] text-white">
          <Badge tone="gold">医学部学士編入サポート</Badge>
          <h1 className="mt-3 text-2xl font-bold leading-snug">
            迷う時間を減らし、<br />前に進む時間を増やす。
          </h1>
          <p className="mt-3 text-sm leading-6 text-sky-100">
            大学比較・日程・過去問・学習記録・掲示板を一画面に。今日やる一手が、自然と決まります。
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <TapButton variant="line" className="w-full" onClick={isAuthenticated ? () => navigate('dashboard') : requestLogin}>
              <UserRound className="h-4 w-4" />
              {isAuthenticated ? '記録を開く' : 'LINEで始める'}
            </TapButton>
            <TapButton variant="ghost" className="w-full bg-white/15 text-white hover:bg-white/25" onClick={() => navigate('universities')}>
              <UniversityIcon className="h-4 w-4" />
              大学を見る
            </TapButton>
          </div>
        </Card>
      </FadeIn>

      <div className="grid grid-cols-2 gap-3">
        <FadeIn delay={60}>
          <Card>
            <div className="text-xs text-slate-500">掲載大学</div>
            <div className="mt-1 text-2xl font-bold text-navy-900">{summaryQuery.data?.universities ?? universities.length}</div>
          </Card>
        </FadeIn>
        <FadeIn delay={120}>
          <Card>
            <div className="text-xs text-slate-500">掲載問題</div>
            <div className="mt-1 text-2xl font-bold text-navy-900">{summaryQuery.data?.problems ?? 0}</div>
          </Card>
        </FadeIn>
        <FadeIn delay={180}>
          <Card>
            <div className="text-xs text-slate-500">掲示板スレッド</div>
            <div className="mt-1 text-2xl font-bold text-navy-900">{summaryQuery.data?.boardThreads ?? 0}</div>
          </Card>
        </FadeIn>
        <FadeIn delay={240}>
          <Card>
            <div className="text-xs text-slate-500">プラン</div>
            <div className="mt-1 text-base font-semibold text-navy-900">{isPremium ? '解放済み' : '無料で利用中'}</div>
          </Card>
        </FadeIn>
      </div>

      <SectionCard title="まずやることリスト" subtitle="この順番で進めると、迷いにくくなります。">
        <ol className="space-y-3 text-sm text-slate-700">
          <li className="flex gap-3 rounded-2xl bg-slate-50 p-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white">1</span>大学一覧で志望校の候補を絞る</li>
          <li className="flex gap-3 rounded-2xl bg-slate-50 p-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white">2</span>各大学の入試情報と過去問を確認する</li>
          <li className="flex gap-3 rounded-2xl bg-slate-50 p-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white">3</span>解いた記録を残して、復習対象を見直す</li>
        </ol>
      </SectionCard>

      {upgradeCard}

      <SectionCard title="最新の掲示板" subtitle="気になるスレッドを開くと、すぐ参加できます。">
        <div className="space-y-3">
          {(threadsQuery.data?.threads ?? []).slice(0, 3).map((thread, idx) => (
            <FadeIn key={thread.id} delay={idx * 60}>
              <button
                onClick={() => {
                  navigate('community');
                  setCommunityMode('board');
                  handleOpenThread(thread);
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left transition-all duration-200 hover:border-navy/30 hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex flex-wrap items-center gap-1">
                  <Badge tone="slate">{thread.category}</Badge>
                  {thread.is_premium ? <Badge tone="gold">解放済み限定</Badge> : <Badge tone="emerald">誰でも閲覧可</Badge>}
                </div>
                <div className="mt-2 text-sm font-semibold text-navy-900">{thread.title}</div>
                <div className="mt-1 text-xs text-slate-500">返信 {thread.reply_count} 件 ・ 最終 {formatDateTime(thread.last_reply_at ?? thread.updated_at)}</div>
              </button>
            </FadeIn>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const renderAdmissionBlock = (info: AdmissionInfo) => (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-navy-900">{info.year}年度入試</div>
        {info.capacity ? <Badge tone="navy">募集 {info.capacity}名</Badge> : null}
      </div>
      <dl className="mt-2 grid grid-cols-1 gap-y-1.5 text-xs text-slate-700">
        {info.application_period ? (
          <div className="flex gap-2"><dt className="w-20 shrink-0 text-slate-500">出願期間</dt><dd className="font-medium">{info.application_period}</dd></div>
        ) : null}
        {info.first_exam_date ? (
          <div className="flex gap-2"><dt className="w-20 shrink-0 text-slate-500">一次試験</dt><dd className="font-medium">{info.first_exam_date}</dd></div>
        ) : null}
        {info.second_exam_date ? (
          <div className="flex gap-2"><dt className="w-20 shrink-0 text-slate-500">二次試験</dt><dd className="font-medium">{info.second_exam_date}</dd></div>
        ) : null}
        {info.subjects_first ? (
          <div className="flex gap-2"><dt className="w-20 shrink-0 text-slate-500">試験科目</dt><dd className="font-medium leading-5">{info.subjects_first}{info.subjects_second ? ` / ${info.subjects_second}` : ''}</dd></div>
        ) : null}
        {info.english_requirement ? (
          <div className="flex gap-2"><dt className="w-20 shrink-0 text-slate-500">英語要件</dt><dd className="font-medium">{info.english_requirement}</dd></div>
        ) : null}
      </dl>
      {info.source_url ? (
        <a
          href={info.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline"
        >
          公式情報を見る
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : null}
    </div>
  );

  const renderUniversityDetail = (university: University, detailProblems: Problem[]) => {
    const sortedAdmissions = [...(university.admissions ?? [])].sort((a, b) => b.year - a.year).slice(0, 2);

    return (
      <div className="space-y-4 animate-fade-in-up">
        <SectionCard
          title={university.name}
          subtitle={`${university.prefecture} ・ ${university.entry_year}`}
          action={
            <TapButton variant="secondary" onClick={() => setSelectedUniversityId(null)} className="px-3">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </TapButton>
          }
        >
          <div className="flex flex-wrap gap-1 text-xs">
            <Badge tone="slate">{university.region}</Badge>
            <Badge tone="navy">{university.capacity_label}</Badge>
          </div>

          {university.note ? <p className="mt-3 text-xs leading-5 text-slate-600">{university.note}</p> : null}

          <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-slate-700">
            <div className="rounded-2xl bg-slate-50 px-3 py-2"><span className="text-slate-500">生命科学：</span>{university.life_sci}</div>
            <div className="rounded-2xl bg-slate-50 px-3 py-2"><span className="text-slate-500">物理 / 化学：</span>{university.physics_chem}</div>
            <div className="rounded-2xl bg-slate-50 px-3 py-2"><span className="text-slate-500">統計 / 数学：</span>{university.stats_math}</div>
            <div className="rounded-2xl bg-slate-50 px-3 py-2"><span className="text-slate-500">英語：</span>{university.english_summary}</div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={university.admissions_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] items-center gap-1 rounded-full bg-navy px-4 text-xs font-semibold text-white shadow-soft transition-all hover:shadow-md active:scale-[0.97]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              入試案内（公式）
            </a>
            <a
              href={university.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.97]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              大学公式
            </a>
          </div>
        </SectionCard>

        <SectionCard title="入試情報" subtitle="最新と前年度を表示しています。詳細は必ず公式の募集要項をご確認ください。">
          {sortedAdmissions.length === 0 ? (
            <EmptyState title="情報未登録" description="この大学の入試情報はまだ登録されていません。" />
          ) : (
            <div className="space-y-3">
              {sortedAdmissions.map((info, idx) => (
                <FadeIn key={`${info.year}-${idx}`} delay={idx * 80}>{renderAdmissionBlock(info)}</FadeIn>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="この大学の過去問" subtitle="掲載されている過去問の一覧です。">
          {detailProblems.length === 0 ? (
            <EmptyState title="掲載準備中" description="この大学の過去問はまだ登録されていません。" />
          ) : (
            <div className="space-y-3">
              {detailProblems.map((problem, idx) => (
                <FadeIn key={problem.id} delay={idx * 60}>
                  {renderProblemCard(problem)}
                </FadeIn>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    );
  };

  const renderUniversities = () => {
    if (selectedUniversityId) {
      if (universityDetailQuery.isLoading) return <SkeletonGrid count={3} />;
      if (universityDetailQuery.data) {
        return renderUniversityDetail(universityDetailQuery.data.university, universityDetailQuery.data.problems);
      }
      return (
        <div className="space-y-3">
          <TapButton variant="secondary" onClick={() => setSelectedUniversityId(null)}>
            <ArrowLeft className="h-4 w-4" />
            一覧へ戻る
          </TapButton>
          <Card className="border-rose-200 bg-rose-50 text-sm text-rose-700">大学情報を読み込めませんでした。少し時間をおいて再度お試しください。</Card>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <SectionCard title="大学一覧" subtitle="地域や校名で絞り込みできます。タップで詳細を開きます。">
          <div className="space-y-2">
            <SelectField value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
              {regionOptions.map((region) => (
                <option key={region} value={region}>{region === 'all' ? '全地域' : region}</option>
              ))}
            </SelectField>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <TextField
                value={universitySearch}
                onChange={(e) => setUniversitySearch(e.target.value)}
                placeholder="大学名・都道府県で検索"
                className="pl-10"
              />
            </div>
          </div>

          {universitiesQuery.isLoading ? (
            <div className="mt-4"><SkeletonGrid count={4} /></div>
          ) : filteredUniversities.length === 0 ? (
            <div className="mt-4"><EmptyState title="該当なし" description="条件をゆるめてもう一度お試しください。" /></div>
          ) : (
            <div className="mt-4 space-y-3">
              {filteredUniversities.map((university, idx) => {
                const latest = [...(university.admissions ?? [])].sort((a, b) => b.year - a.year)[0];
                return (
                  <FadeIn key={university.id} delay={Math.min(idx * 40, 400)}>
                    <Card
                      onClick={() => setSelectedUniversityId(university.id)}
                      className="hover:border-navy/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-base font-semibold text-navy-900">{university.name}</div>
                          <div className="mt-0.5 text-xs text-slate-500">{university.region} ・ {university.prefecture}</div>
                        </div>
                        <Badge tone="navy">{university.capacity_label}</Badge>
                      </div>

                      {latest ? (
                        <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          <span className="font-semibold text-navy-900">{latest.year}年度</span>
                          {latest.application_period ? <> ・ 出願 {latest.application_period}</> : null}
                          {latest.first_exam_date ? <> ・ 一次 {latest.first_exam_date}</> : null}
                        </div>
                      ) : null}

                      <div className="mt-2 text-[11px] text-slate-500">タップで詳細・過去問へ</div>
                    </Card>
                  </FadeIn>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    );
  };

  const renderSchedules = () => {
    const upcomingByUniversity = [...universities]
      .map((university) => ({
        university,
        latest: [...(university.admissions ?? [])].sort((a, b) => b.year - a.year)[0]
      }))
      .filter((entry) => entry.latest)
      .sort((a, b) => {
        const aDate = a.latest?.first_exam_date ?? a.latest?.application_period ?? '';
        const bDate = b.latest?.first_exam_date ?? b.latest?.application_period ?? '';
        return aDate.localeCompare(bDate);
      });

    return (
      <div className="space-y-4">
        <SectionCard title="試験日程" subtitle="各大学の最新入試の日程をまとめました。">
          {upcomingByUniversity.length === 0 ? (
            <SkeletonGrid count={3} />
          ) : (
            <div className="space-y-3">
              {upcomingByUniversity.map((entry, idx) => (
                <FadeIn key={entry.university.id} delay={Math.min(idx * 40, 400)}>
                  <Card onClick={() => { setTab('universities'); setSelectedUniversityId(entry.university.id); }}>
                    <div className="text-base font-semibold text-navy-900">{entry.university.name}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{entry.university.region} ・ {entry.latest?.year}年度</div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700">
                      <div className="rounded-2xl bg-slate-50 px-3 py-2"><div className="text-[11px] text-slate-500">出願</div><div className="font-semibold">{entry.latest?.application_period ?? '—'}</div></div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-2"><div className="text-[11px] text-slate-500">募集</div><div className="font-semibold">{entry.university.capacity_label}</div></div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-2"><div className="text-[11px] text-slate-500">一次試験</div><div className="font-semibold">{entry.latest?.first_exam_date ?? '—'}</div></div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-2"><div className="text-[11px] text-slate-500">二次試験</div><div className="font-semibold">{entry.latest?.second_exam_date ?? '—'}</div></div>
                    </div>
                    <a
                      href={entry.university.admissions_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline"
                    >
                      公式の入試案内を開く
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Card>
                </FadeIn>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    );
  };

  const renderProblemCard = (problem: Problem) => {
    const status = progressMap[problem.id];
    const locked = problem.is_premium && !problem.can_view_question;
    return (
      <Card key={problem.id}>
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <Badge tone="slate">{problem.subject}</Badge>
          <Badge tone="slate">{problem.year}年</Badge>
          <Badge tone="slate">難易度 {problem.difficulty}</Badge>
          {problem.is_premium ? <Badge tone="gold">解放済み限定</Badge> : <Badge tone="emerald">無料</Badge>}
          {status === 'correct' ? <Badge tone="emerald">正解</Badge> : null}
          {status === 'wrong' ? <Badge tone="rose">復習</Badge> : null}
          {status === 'bookmarked' ? <Badge tone="amber">保存</Badge> : null}
        </div>
        <div className="mt-2 text-xs font-medium text-slate-500">{problem.university?.name ?? ''}</div>

        {locked ? (
          <>
            <div className="mt-2 relative overflow-hidden rounded-2xl bg-slate-50 p-3">
              <div className="premium-blur text-sm leading-6 text-slate-800 select-none">
                この問題は解放後に表示されます。十分な分量の文章とともに、詳細な解説と模範解答が用意されています。
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
                <Lock className="h-4 w-4 text-gold-900" />
                <div className="text-xs font-semibold text-navy-900">問題文は解放後に閲覧できます</div>
              </div>
            </div>
            <TapButton variant="primary" onClick={handleUpgrade} className="mt-3 w-full">
              <Crown className="h-4 w-4" />
              {formatPriceJPY(PREMIUM_PRICE)}で解放
            </TapButton>
          </>
        ) : (
          <>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">{problem.question}</div>
            {problem.options ? <div className="mt-2 whitespace-pre-wrap rounded-2xl bg-slate-50 p-3 text-xs leading-6 text-slate-600">{problem.options}</div> : null}

            {problem.can_view_answer ? (
              <div className="mt-3 rounded-3xl bg-sky-50 p-3 text-xs leading-6 text-slate-700">
                <div className="font-semibold text-navy-900">解答</div>
                <div>{problem.answer ?? '—'}</div>
                {problem.answer_detail ? <div className="mt-1 text-slate-600">{problem.answer_detail}</div> : null}
              </div>
            ) : null}
          </>
        )}

        {isAuthenticated && !locked ? (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(['correct', 'wrong', 'bookmarked'] as const).map((next) => (
              <button
                key={next}
                onClick={() => progressMutation.mutate({ problemId: problem.id, status: next })}
                className={`min-h-[44px] rounded-full text-xs font-semibold transition-all duration-200 active:scale-[0.97] ${
                  status === next ? 'bg-navy text-white shadow-soft' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {next === 'correct' ? '正解' : next === 'wrong' ? '復習' : '保存'}
              </button>
            ))}
          </div>
        ) : !isAuthenticated && !locked ? (
          <div className="mt-3 text-xs text-slate-500">進捗を残すにはログインしてください。</div>
        ) : null}
      </Card>
    );
  };

  const renderProblems = () => {
    const visibleProblems = problems.filter((p) => p.can_view_question);
    const totalCount = visibleProblems.length;
    const finishedCount = visibleProblems.filter((p) => progressMap[p.id]).length;
    const correctCount = visibleProblems.filter((p) => progressMap[p.id] === 'correct').length;
    const progressValue = totalCount ? Math.round((finishedCount / totalCount) * 100) : 0;

    return (
      <div className="space-y-4">
        {!isPremium ? (
          <FadeIn>
            <Card className="border-gold-200 bg-cream-50">
              <div className="flex items-start gap-3">
                <Crown className="h-5 w-5 text-gold-900" />
                <div>
                  <div className="text-sm font-semibold text-navy-900">過去問の本文を読みたい方へ</div>
                  <p className="mt-1 text-xs leading-5 text-slate-700">
                    {formatPriceJPY(PREMIUM_PRICE)}（税込・買い切り）で、過去問の本文・解答・解説と掲示板の限定スレッドが解放されます。
                  </p>
                  <TapButton variant="primary" onClick={handleUpgrade} className="mt-3">
                    <Crown className="h-4 w-4" />
                    すべての機能を解放する
                  </TapButton>
                </div>
              </div>
            </Card>
          </FadeIn>
        ) : null}

        <SectionCard title="あなたの進捗" subtitle="閲覧可能な問題に対する到達度です。">
          <ProgressBar value={progressValue} label={`着手 ${finishedCount} / ${totalCount} 問`} />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <Card className="p-3"><div className="text-slate-500">正解</div><div className="mt-1 text-lg font-bold text-navy-900">{correctCount}</div></Card>
            <Card className="p-3"><div className="text-slate-500">復習対象</div><div className="mt-1 text-lg font-bold text-navy-900">{visibleProblems.filter((p) => progressMap[p.id] === 'wrong').length}</div></Card>
            <Card className="p-3"><div className="text-slate-500">保存</div><div className="mt-1 text-lg font-bold text-navy-900">{visibleProblems.filter((p) => progressMap[p.id] === 'bookmarked').length}</div></Card>
          </div>
        </SectionCard>

        <SectionCard title="絞り込み" subtitle="気になる条件で素早く絞れます。">
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <SelectField value={problemSubject} onChange={(e) => setProblemSubject(e.target.value)}>
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>{subject === 'all' ? '全科目' : subject}</option>
                ))}
              </SelectField>
              <SelectField value={problemYear} onChange={(e) => setProblemYear(e.target.value)}>
                {problemYears.map((year) => (
                  <option key={year} value={year}>{year === 'all' ? '全年度' : `${year}年`}</option>
                ))}
              </SelectField>
            </div>
            <SelectField value={problemUniversityId} onChange={(e) => setProblemUniversityId(e.target.value)}>
              <option value="all">全大学</option>
              {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </SelectField>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <TextField value={problemSearch} onChange={(e) => setProblemSearch(e.target.value)} placeholder="科目・大学名で検索" className="pl-10" />
            </div>
            <div className="flex flex-wrap gap-2">
              {problemFilterOptions.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setProblemFilter(item.key)}
                  className={`min-h-[40px] rounded-full px-4 text-xs font-semibold transition-all duration-200 active:scale-[0.97] ${
                    problemFilter === item.key ? 'bg-navy text-white shadow-soft' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Filter className="mr-1 inline h-3 w-3" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {problemsQuery.isLoading ? (
          <SkeletonGrid count={3} />
        ) : filteredProblems.length === 0 ? (
          <EmptyState title="一致する問題はありません" description="フィルタを少しゆるめてみてください。" />
        ) : (
          <div className="space-y-3">
            {filteredProblems.map((problem, idx) => (
              <FadeIn key={problem.id} delay={Math.min(idx * 40, 400)}>
                {renderProblemCard(problem)}
              </FadeIn>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderDashboard = () => {
    if (!isAuthenticated) {
      return (
        <FadeIn>
          <Card className="border-emerald-200 bg-emerald-50 text-emerald-900">
            <div className="text-sm font-semibold">学習記録はログイン後に使えます</div>
            <p className="mt-1 text-xs leading-5">LINEログインで、学習時間や正答率の記録を始められます。</p>
            <TapButton variant="line" onClick={requestLogin} className="mt-3">
              <UserRound className="h-4 w-4" />
              LINEでログイン
            </TapButton>
          </Card>
        </FadeIn>
      );
    }

    const stats = dashboard?.stats;

    return (
      <div className="space-y-4">
        {!profile?.onboarding_completed ? (
          <SectionCard title="プロフィールを整える" subtitle="記録を見やすくするために、まずは設定しましょう。">
            <div className="space-y-2">
              <TextField value={onboardingForm.full_name} onChange={(e) => setOnboardingForm((c) => ({ ...c, full_name: e.target.value }))} placeholder="氏名" />
              <TextField value={onboardingForm.school_name} onChange={(e) => setOnboardingForm((c) => ({ ...c, school_name: e.target.value }))} placeholder="学校名" />
              <SelectField value={onboardingForm.gender} onChange={(e) => setOnboardingForm((c) => ({ ...c, gender: e.target.value as UserGender }))}>
                {genderOptions.map((g) => <option key={g} value={g}>{g}</option>)}
              </SelectField>
              <TextField value={onboardingForm.club_name} onChange={(e) => setOnboardingForm((c) => ({ ...c, club_name: e.target.value }))} placeholder="部活動・サークル" />
            </div>
            <TapButton variant="primary" onClick={() => onboardingMutation.mutate()} className="mt-3 w-full" disabled={onboardingMutation.isPending}>
              {onboardingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              保存する
            </TapButton>
          </SectionCard>
        ) : null}

        <SectionCard title="学習サマリー" subtitle="続けるほど、見える化が役に立ちます。">
          <div className="grid grid-cols-2 gap-2 text-center">
            <Card className="p-3"><div className="text-xs text-slate-500">総学習時間</div><div className="mt-1 text-xl font-bold text-navy-900">{stats?.totalHours ?? 0}h</div></Card>
            <Card className="p-3"><div className="text-xs text-slate-500">正解数</div><div className="mt-1 text-xl font-bold text-navy-900">{stats?.correctCount ?? 0}</div></Card>
            <Card className="p-3"><div className="text-xs text-slate-500">正答率</div><div className="mt-1 text-xl font-bold text-navy-900">{stats?.accuracy ?? 0}%</div></Card>
            <Card className="p-3"><div className="text-xs text-slate-500">連続日数</div><div className="mt-1 text-xl font-bold text-navy-900">{stats?.streakDays ?? 0}日</div></Card>
          </div>
          <div className="mt-3"><ProgressBar value={stats?.accuracy ?? 0} label="正答率" /></div>
        </SectionCard>

        <SectionCard title="学習ログを追加" subtitle="今日の積み重ねを残しましょう。">
          <div className="grid grid-cols-2 gap-2">
            <SelectField value={studyLog.subject} onChange={(e) => setStudyLog((c) => ({ ...c, subject: e.target.value }))}>
              {subjectOptions.filter((item) => item !== 'all').map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </SelectField>
            <TextField type="number" value={studyLog.minutes} onChange={(e) => setStudyLog((c) => ({ ...c, minutes: Number(e.target.value) }))} placeholder="分数" />
            <TextField type="date" value={studyLog.logged_on} onChange={(e) => setStudyLog((c) => ({ ...c, logged_on: e.target.value }))} />
            <TextField value={studyLog.memo} onChange={(e) => setStudyLog((c) => ({ ...c, memo: e.target.value }))} placeholder="メモ（任意）" />
          </div>
          <TapButton variant="primary" onClick={() => studyLogMutation.mutate()} className="mt-3 w-full" disabled={studyLogMutation.isPending}>
            {studyLogMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            保存する
          </TapButton>
        </SectionCard>

        <SectionCard title="記録の見直し" subtitle="科目と並び順で、知りたい記録を素早く取り出せます。">
          <div className="grid grid-cols-2 gap-2">
            <SelectField value={studyLogSubject} onChange={(e) => setStudyLogSubject(e.target.value)}>
              {subjectOptions.map((subject) => <option key={subject} value={subject}>{subject === 'all' ? '全科目' : subject}</option>)}
            </SelectField>
            <SelectField value={studyLogSort} onChange={(e) => setStudyLogSort(e.target.value as typeof studyLogSort)}>
              <option value="date_desc">新しい順</option>
              <option value="minutes_desc">学習時間が長い順</option>
              <option value="subject">科目順</option>
            </SelectField>
          </div>
          <div className="mt-3 space-y-2">
            {sortedStudyLogs.length === 0 ? (
              <EmptyState title="記録がまだありません" description="上のフォームから最初のログを残してみましょう。" />
            ) : (
              sortedStudyLogs.map((log) => (
                <Card key={log.id} className="p-3">
                  <div className="flex items-center justify-between text-xs">
                    <Badge tone="slate">{log.subject}</Badge>
                    <span className="text-slate-500">{formatDate(log.logged_on)}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-navy-900">{log.minutes} 分</div>
                  {log.memo ? <p className="mt-1 text-xs leading-5 text-slate-600">{log.memo}</p> : null}
                </Card>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="苦手の見直し" subtitle="復習対象に登録した問題を最大6件まで表示します。">
          <div className="space-y-2">
            {(dashboard?.weakProblems ?? []).length === 0 ? (
              <EmptyState title="復習対象はまだありません" description="過去問で「復習」を押すと、ここに集まります。" />
            ) : (
              dashboard?.weakProblems.map((problem) => (
                <Card key={problem.id} className="p-3">
                  <div className="text-xs font-semibold text-navy-900">{problem.subject} ・ {problem.university?.name ?? ''}</div>
                  <div className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">{problem.question ?? '（解放後に表示されます）'}</div>
                </Card>
              ))
            )}
          </div>
        </SectionCard>
      </div>
    );
  };

  const renderBoardThreadDetail = (thread: BoardThread) => {
    const replies = threadRepliesQuery.data ?? [];
    return (
      <SectionCard
        title={thread.title}
        subtitle={`${thread.category} ・ 返信 ${thread.reply_count} 件 ・ ${thread.is_premium ? '解放済み限定' : '誰でも閲覧可'}`}
        action={
          <TapButton variant="secondary" onClick={() => setActiveThreadId(null)} className="px-3">
            <ArrowLeft className="h-4 w-4" />
            戻る
          </TapButton>
        }
      >
        <Card className="bg-slate-50">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-navy-900">{thread.display_name}</span>
            <span className="text-slate-500">{formatDateTime(thread.created_at)}</span>
          </div>
          <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{thread.body}</div>
        </Card>

        <div className="mt-4 text-sm font-semibold text-navy-900">返信</div>
        <div className="mt-2 space-y-2">
          {replies.length === 0 ? (
            <EmptyState title="まだ返信はありません" description="最初の一人になりましょう。" />
          ) : (
            replies.map((reply, index) => (
              <Card key={reply.id} className="p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-navy-900">
                    {index + 1}. {reply.display_name}
                    {reply.is_tutor ? <Badge tone="slate">運営</Badge> : null}
                  </span>
                  <span className="text-slate-500">{formatDateTime(reply.created_at)}</span>
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{reply.content}</div>
              </Card>
            ))
          )}
        </div>

        <Card className="mt-4">
          {thread.is_closed ? (
            <div className="text-xs text-slate-500">このスレッドは閉鎖済みです。</div>
          ) : !isAuthenticated ? (
            <TapButton variant="line" onClick={requestLogin} className="w-full">
              <UserRound className="h-4 w-4" />
              返信するにはLINEでログイン
            </TapButton>
          ) : thread.is_premium && !isPremium ? (
            <TapButton variant="primary" onClick={handleUpgrade} className="w-full">
              <Crown className="h-4 w-4" />
              {formatPriceJPY(PREMIUM_PRICE)}で解放して返信
            </TapButton>
          ) : (
            <div className="space-y-2">
              <TextareaField value={replyDraft} onChange={(e) => setReplyDraft(e.target.value)} rows={4} placeholder="返信を入力（個人情報や誘い文句のリンクは控えてください）" />
              <TapButton
                variant="primary"
                onClick={() => replyMutation.mutate()}
                disabled={!replyDraft.trim() || replyMutation.isPending}
                className="w-full"
              >
                {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                返信を送信
              </TapButton>
            </div>
          )}
        </Card>
      </SectionCard>
    );
  };

  const renderBoardList = () => {
    const threads = threadsQuery.data?.threads ?? [];

    return (
      <div className="space-y-4">
        <SectionCard
          title="掲示板"
          subtitle="受験生どうしで気軽に質問・情報交換ができる場所です。"
          action={
            <TapButton variant="primary" onClick={handleStartThreadCompose} className="px-3">
              <Plus className="h-4 w-4" />
              新規
            </TapButton>
          }
        >
          <div className="flex flex-wrap gap-2">
            {boardCategories.map((category) => (
              <button
                key={category}
                onClick={() => setBoardCategory(category)}
                className={`min-h-[40px] rounded-full px-3 text-xs font-semibold transition-all duration-200 active:scale-[0.97] ${
                  boardCategory === category ? 'bg-navy text-white shadow-soft' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {category === 'all' ? 'すべて' : category}
              </button>
            ))}
          </div>

          {showThreadComposer ? (
            <Card className="mt-4 bg-slate-50 animate-scale-in">
              <div className="text-sm font-semibold text-navy-900">新しいスレッドを立てる</div>
              <div className="mt-3 space-y-2">
                <TextField value={threadDraft.title} onChange={(e) => setThreadDraft((c) => ({ ...c, title: e.target.value }))} placeholder="タイトル（2〜60文字）" />
                <SelectField value={threadDraft.category} onChange={(e) => setThreadDraft((c) => ({ ...c, category: e.target.value as BoardCategory }))}>
                  {(['相談', '勉強法', '出願', '面接', '雑談'] as BoardCategory[]).map((category) => <option key={category} value={category}>{category}</option>)}
                </SelectField>
                <TextareaField rows={5} value={threadDraft.body} onChange={(e) => setThreadDraft((c) => ({ ...c, body: e.target.value }))} placeholder="本文（2〜2000文字）" />
                {isPremium ? (
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" checked={threadDraft.is_premium} onChange={(e) => setThreadDraft((c) => ({ ...c, is_premium: e.target.checked }))} />
                    解放済み会員のみが閲覧できるスレッドにする
                  </label>
                ) : null}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <TapButton variant="secondary" onClick={() => { setShowThreadComposer(false); setThreadDraft({ title: '', category: '相談', body: '', is_premium: false }); }}>
                  キャンセル
                </TapButton>
                <TapButton variant="primary" onClick={() => createThreadMutation.mutate()} disabled={!threadDraft.title.trim() || !threadDraft.body.trim() || createThreadMutation.isPending}>
                  {createThreadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  作成
                </TapButton>
              </div>
            </Card>
          ) : null}

          {threadsQuery.isLoading ? (
            <div className="mt-4"><SkeletonGrid count={3} /></div>
          ) : threads.length === 0 ? (
            <div className="mt-4"><EmptyState title="まだスレッドがありません" description="気になるテーマで最初のスレッドを立ててみましょう。" /></div>
          ) : (
            <div className="mt-4 space-y-2">
              {threads.map((thread, idx) => (
                <FadeIn key={thread.id} delay={Math.min(idx * 40, 400)}>
                  <button
                    onClick={() => handleOpenThread(thread)}
                    className="w-full rounded-3xl border border-slate-200 bg-white p-3 text-left transition-all duration-200 hover:border-navy/30 hover:shadow-md active:scale-[0.99]"
                  >
                    <div className="flex flex-wrap items-center gap-1 text-xs">
                      {thread.is_pinned ? <Badge tone="amber"><Pin className="h-3 w-3" />固定</Badge> : null}
                      <Badge tone="slate">{thread.category}</Badge>
                      {thread.is_premium ? <Badge tone="gold">解放済み限定</Badge> : <Badge tone="emerald">誰でも閲覧可</Badge>}
                      {thread.is_closed ? <Badge tone="slate">閉鎖済み</Badge> : null}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-navy-900">{thread.title}</div>
                    <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{thread.body}</div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{thread.display_name}</span>
                      <span>返信 {thread.reply_count} ・ {formatDateTime(thread.last_reply_at ?? thread.updated_at)}</span>
                    </div>
                  </button>
                </FadeIn>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    );
  };

  const renderCommunity = () => {
    if (activeThreadId) {
      if (threadDetailQuery.isLoading) return <SkeletonGrid count={2} />;
      if (threadDetailQuery.data) return renderBoardThreadDetail(threadDetailQuery.data);
      return (
        <div className="space-y-3">
          <TapButton variant="secondary" onClick={() => setActiveThreadId(null)}>
            <ArrowLeft className="h-4 w-4" />
            一覧へ戻る
          </TapButton>
          <Card className="border-rose-200 bg-rose-50 text-sm text-rose-700">スレッドを読み込めませんでした。閉鎖済みか、限定スレッドの可能性があります。</Card>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCommunityMode('board')} className={`min-h-[44px] rounded-full px-4 text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${communityMode === 'board' ? 'bg-navy text-white shadow-soft' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>掲示板</button>
          <button onClick={() => setCommunityMode('chat')} className={`min-h-[44px] rounded-full px-4 text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${communityMode === 'chat' ? 'bg-navy text-white shadow-soft' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>チャット</button>
        </div>

        {communityMode === 'board' ? renderBoardList() : null}

        {communityMode === 'chat' ? (
          !isAuthenticated ? (
            <Card className="border-emerald-200 bg-emerald-50 text-emerald-900">
              <div className="text-sm font-semibold">チャットはログイン後に使えます</div>
              <p className="mt-1 text-xs leading-5">LINEでログインすると、チャンネルの閲覧と参加ができます。</p>
              <TapButton variant="line" onClick={requestLogin} className="mt-3"><UserRound className="h-4 w-4" />LINEでログイン</TapButton>
            </Card>
          ) : !isPremium ? (
            <Card className="border-gold-200 bg-cream-50">
              <div className="text-sm font-semibold text-navy-900">チャットは解放後に使えます</div>
              <p className="mt-1 text-xs leading-5 text-slate-700">{formatPriceJPY(PREMIUM_PRICE)}（買い切り）で、チャットチャンネルが解放されます。</p>
              <TapButton variant="primary" onClick={handleUpgrade} className="mt-3"><Crown className="h-4 w-4" />すべての機能を解放</TapButton>
            </Card>
          ) : (
            <SectionCard title="チャンネル一覧" subtitle="用途ごとに会話を分けています。">
              <div className="space-y-2">
                {(channelsQuery.data ?? []).map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannelId(channel.id)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left text-sm transition-all duration-200 active:scale-[0.99] ${selectedChannelId === channel.id ? 'border-navy bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    <div className="font-semibold text-navy-900">{channel.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{channel.description}</div>
                  </button>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {(messagesQuery.data ?? []).map((message) => (
                  <Card key={message.id} className="bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-navy-900">{message.display_name}</div>
                    <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.content}</div>
                    <div className="mt-1 text-[11px] text-slate-500">{formatDateTime(message.created_at)}</div>
                  </Card>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <TextField value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="メッセージを入力" />
                <TapButton variant="primary" onClick={() => messageMutation.mutate()}>送信</TapButton>
              </div>
            </SectionCard>
          )
        ) : null}
      </div>
    );
  };

  const renderAdmin = () => {
    if (!profile?.is_admin) {
      return <Card className="text-sm text-slate-600">管理者向けの画面です。</Card>;
    }
    return (
      <SectionCard title="登録ユーザー" subtitle="運営確認用の一覧です。">
        <div className="space-y-2">
          {(adminUsersQuery.data ?? []).map((user) => (
            <Card key={user.id} className="p-3">
              <div className="text-sm font-semibold text-navy-900">{user.display_name}</div>
              <div className="mt-1 text-xs text-slate-600">学校：{user.school_name ?? '-'}</div>
              <div className="text-xs text-slate-600">解放済み：{user.is_premium ? 'はい' : 'いいえ'}</div>
              <div className="text-xs text-slate-600">登録：{formatDateTime(user.created_at)}</div>
            </Card>
          ))}
        </div>
      </SectionCard>
    );
  };

  const renderContent = () => {
    if (tab === 'home') return renderHome();
    if (tab === 'universities') return renderUniversities();
    if (tab === 'schedules') return renderSchedules();
    if (tab === 'problems') return renderProblems();
    if (tab === 'dashboard') return renderDashboard();
    if (tab === 'community') return renderCommunity();
    if (tab === 'admin') return renderAdmin();
    return null;
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] pb-24">
      <LiffBootstrap liffId={publicLineConfig.liffId} enableDevLogin={publicLineConfig.enableDevLogin} />

      <header className="sticky top-0 z-30 border-b border-slate-200 glass">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 py-3">
          <div>
            <div className="text-lg font-bold tracking-tight text-navy-900">Re-try</div>
            <div className="text-[11px] text-slate-500">迷う時間を減らし、前に進む時間を増やす。</div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Badge tone={isPremium ? 'gold' : 'slate'}>{isPremium ? '解放済み' : '無料'}</Badge>
                {!isPremium ? (
                  <button onClick={handleUpgrade} className="inline-flex min-h-[40px] items-center gap-1 rounded-full bg-navy px-3 text-xs font-semibold text-white shadow-soft transition-all hover:shadow-md active:scale-[0.97]">
                    <Crown className="h-3.5 w-3.5" />
                    解放
                  </button>
                ) : null}
                <button onClick={requestLogout} className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.97]">
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <button onClick={requestLogin} className="inline-flex min-h-[40px] items-center gap-1 rounded-full bg-[#06C755] px-3 text-xs font-semibold text-white shadow-soft transition-all hover:shadow-md active:scale-[0.97]">
                <UserRound className="h-3.5 w-3.5" />
                LINE
              </button>
            )}
          </div>
        </div>
        {showAdminTab ? (
          <div className="mx-auto max-w-md px-4 pb-2">
            <button
              onClick={() => navigate('admin')}
              className={`inline-flex min-h-[36px] items-center gap-1 rounded-full px-3 text-xs font-semibold transition-all duration-200 active:scale-[0.97] ${tab === 'admin' ? 'bg-navy text-white shadow-soft' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              管理者
            </button>
          </div>
        ) : null}
      </header>

      <main key={tab + (selectedUniversityId ?? '')} className="mx-auto max-w-md space-y-4 px-4 py-4 animate-fade-in-up">
        {billingBanner}
        {renderContent()}
        <div className="pt-2 text-center text-[11px] text-slate-500">
          <Link href="/legal/tokushoho" className="font-semibold text-navy-900">特定商取引法に基づく表記</Link>
        </div>
      </main>

      <BottomNav active={(tab === 'admin' ? 'home' : tab) as BottomTabKey} onChange={(next) => navigate(next)} />
    </div>
  );
};
