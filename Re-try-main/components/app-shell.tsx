'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CalendarDays,
  Crown,
  LayoutGrid,
  Loader2,
  Lock,
  LogOut,
  MessageSquare,
  ShieldCheck,
  University as UniversityIcon,
  UserRound
} from 'lucide-react';
import { format } from 'date-fns';
import { LiffBootstrap } from '@/components/liff-bootstrap';
import { publicLineConfig } from '@/lib/line';
import { formatDate, formatDateTime } from '@/lib/utils';
import type {
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
  { key: 'universities', label: '大学情報', icon: UniversityIcon },
  { key: 'schedules', label: '日程', icon: CalendarDays },
  { key: 'problems', label: '過去問', icon: BookOpen },
  { key: 'dashboard', label: '学習記録', icon: ShieldCheck },
  { key: 'community', label: 'コミュニティ', icon: MessageSquare }
];

const subjects = ['生命科学', '数学', '英語', '化学', '物理', '小論文'];
const genders: UserGender[] = ['男性', '女性', 'その他', '回答しない'];

const fetchJson = async <T,>(input: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  const body = (await response.json().catch(() => null)) as T & { error?: string };
  if (!response.ok) throw new Error(body?.error ?? '取得に失敗しました。');
  return body;
};

const login = () => window.dispatchEvent(new Event('line-login-request'));
const logout = () => window.dispatchEvent(new Event('line-logout-request'));

const Section = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-navy-900">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

const Gate = ({
  title,
  description,
  premium,
  onAction
}: {
  title: string;
  description: string;
  premium?: boolean;
  onAction: () => void;
}) => (
  <div className={`rounded-3xl border p-5 ${premium ? 'border-gold-200 bg-gold-50' : 'border-emerald-200 bg-emerald-50'}`}>
    <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
      {premium ? <Crown className="h-5 w-5 text-gold-900" /> : <UserRound className="h-5 w-5 text-emerald-700" />}
      {title}
    </div>
    <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
    <button
      onClick={onAction}
      className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white ${premium ? 'bg-navy' : 'bg-[#06C755]'}`}
    >
      {premium ? <Crown className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
      {premium ? '決済案内へ進む' : 'LINEでログイン'}
    </button>
  </div>
);

export const AppShell = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabKey>('home');
  const [problemSubject, setProblemSubject] = useState('all');
  const [problemYear, setProblemYear] = useState('all');
  const [problemUniversityId, setProblemUniversityId] = useState('all');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [billingStatus, setBillingStatus] = useState<'success' | 'cancel' | null>(null);
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
  const schedulesQuery = useQuery<ExamSchedule[]>({ queryKey: ['schedules'], queryFn: () => fetchJson('/api/schedules?year=2026') });
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
    enabled: Boolean(selectedChannelId && isAuthenticated)
  });
  const adminUsersQuery = useQuery<UserProfile[]>({
    queryKey: ['admin-users'],
    queryFn: () => fetchJson('/api/admin/users'),
    enabled: Boolean(profile?.is_admin)
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
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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

  const upgradeMutation = useMutation({
    mutationFn: () => fetchJson<{ url: string; alreadyPremium?: boolean }>('/api/stripe/checkout', { method: 'POST' }),
    onSuccess: (result) => {
      if (result.alreadyPremium) {
        setBillingStatus('success');
        navigate('problems');
        return;
      }
      window.location.href = result.url;
    }
  });

  const handleUpgrade = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    upgradeMutation.mutate();
  };

  const years = useMemo(() => {
    const set = new Set<string>(['all']);
    for (const item of problemsQuery.data?.problems ?? []) set.add(String(item.year));
    return [...set];
  }, [problemsQuery.data?.problems]);

  const universityOptions = universitiesQuery.data ?? [];
  const problems = problemsQuery.data?.problems ?? [];
  const progressMap = problemsQuery.data?.progress ?? {};

  const renderHome = () => (
    <div className="space-y-6">
      <Section title="医学部学士編入の学習を一画面で管理">
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h1 className="text-3xl font-bold leading-tight text-navy-900 sm:text-4xl">LINEログイン、受験情報、プレミアム決済まで一本化した完成版</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              LINEログインのループを抑えつつ、プレミアムが必要な導線はすべて決済案内へ統一しています。特定商取引法に基づく表記ページも追加済みです。
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => navigate('problems')} className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white">
                過去問を見る
              </button>
              {!isAuthenticated ? (
                <button onClick={login} className="rounded-full bg-[#06C755] px-5 py-2.5 text-sm font-semibold text-white">
                  LINEでログイン
                </button>
              ) : !isPremium ? (
                <button onClick={handleUpgrade} className="rounded-full border border-gold-200 bg-gold-50 px-5 py-2.5 text-sm font-semibold text-gold-900">
                  プレミアムへアップグレード
                </button>
              ) : null}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">大学数</div>
                <div className="mt-1 text-2xl font-bold text-navy-900">{summaryQuery.data?.universities ?? '-'}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">問題数</div>
                <div className="mt-1 text-2xl font-bold text-navy-900">{summaryQuery.data?.problems ?? '-'}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">コミュニティ投稿</div>
                <div className="mt-1 text-2xl font-bold text-navy-900">{summaryQuery.data?.messages ?? '-'}</div>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-gold-200 bg-gold-50 p-5">
            <div className="flex items-center gap-2 text-lg font-semibold text-gold-900">
              <Crown className="h-5 w-5" />
              プレミアム特典
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li>・プレミアム問題の解答 / 解説を解放</li>
              <li>・限定コミュニティの閲覧 / 投稿</li>
              <li>・今後の有料機能へ優先アクセス</li>
            </ul>
            {!isPremium ? (
              <button onClick={handleUpgrade} className="mt-4 w-full rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white">
                決済案内へ進む
              </button>
            ) : (
              <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-gold-900">現在プレミアム会員です</div>
            )}
          </div>
        </div>
      </Section>

      <Section title="主要導線">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { key: 'universities' as const, title: '大学情報', icon: UniversityIcon, desc: '大学ごとの特徴を比較' },
            { key: 'schedules' as const, title: '試験日程', icon: CalendarDays, desc: '出願〜試験日を確認' },
            { key: 'problems' as const, title: '過去問', icon: BookOpen, desc: '無料 / プレミアム問題を切替' }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} onClick={() => navigate(item.key)} className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-soft">
                <Icon className="h-6 w-6 text-navy-900" />
                <div className="mt-3 text-base font-semibold text-navy-900">{item.title}</div>
                <div className="mt-1 text-sm text-slate-600">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );

  const renderUniversities = () => (
    <Section title="大学情報">
      <div className="grid gap-4 md:grid-cols-2">
        {(universitiesQuery.data ?? []).map((university) => (
          <div key={university.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="text-lg font-semibold text-navy-900">{university.name}</div>
            <div className="mt-1 text-sm text-slate-500">{university.region}</div>
            <div className="mt-3 space-y-1 text-sm leading-6 text-slate-700">
              <div>生命科学: {university.life_sci}</div>
              <div>物理 / 化学: {university.physics_chem}</div>
              <div>統計 / 数学: {university.stats_math}</div>
              {university.note ? <div>備考: {university.note}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );

  const renderSchedules = () => (
    <Section title="試験日程">
      <div className="space-y-4">
        {(schedulesQuery.data ?? []).map((schedule) => (
          <div key={schedule.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="text-lg font-semibold text-navy-900">{schedule.university?.name ?? '大学名未設定'}</div>
            <div className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
              <div>出願開始: {formatDate(schedule.application_start)}</div>
              <div>出願終了: {formatDate(schedule.application_end)}</div>
              <div>一次試験: {formatDate(schedule.first_exam_date)}</div>
              <div>二次試験: {formatDate(schedule.second_exam_date)}</div>
            </div>
            {schedule.memo ? <div className="mt-2 text-sm text-slate-600">{schedule.memo}</div> : null}
          </div>
        ))}
      </div>
    </Section>
  );

  const renderProblems = () => (
    <Section
      title="過去問"
      action={
        !isPremium ? (
          <button onClick={handleUpgrade} className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
            <Crown className="h-4 w-4" />
            決済案内へ進む
          </button>
        ) : null
      }
    >
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <select value={problemSubject} onChange={(e) => setProblemSubject(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
          <option value="all">全科目</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
        <select value={problemYear} onChange={(e) => setProblemYear(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
          {years.map((year) => (
            <option key={year} value={year}>{year === 'all' ? '全年' : `${year}年`}</option>
          ))}
        </select>
        <select value={problemUniversityId} onChange={(e) => setProblemUniversityId(e.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
          <option value="all">全大学</option>
          {universityOptions.map((university) => (
            <option key={university.id} value={university.id}>{university.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-4">
        {problems.map((problem) => (
          <div key={problem.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-2 py-1">{problem.subject}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">{problem.year}年</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">難易度 {problem.difficulty}</span>
              <span className={`rounded-full px-2 py-1 ${problem.is_premium ? 'bg-gold-50 text-gold-900' : 'bg-emerald-50 text-emerald-700'}`}>
                {problem.is_premium ? 'プレミアム' : '無料'}
              </span>
            </div>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-800">{problem.question}</div>
            {problem.options ? <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">{problem.options}</div> : null}
            {problem.can_view_answer ? (
              <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                <div className="font-semibold text-navy-900">解答</div>
                <div>{problem.answer ?? '未設定'}</div>
                {problem.answer_detail ? <div className="mt-2">{problem.answer_detail}</div> : null}
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-gold-200 bg-gold-50 p-4 text-sm text-gold-900">
                <div className="flex items-center gap-2 font-semibold">
                  <Lock className="h-4 w-4" />
                  プレミアム会員のみ解答を閲覧できます
                </div>
                <button onClick={handleUpgrade} className="mt-3 rounded-full bg-navy px-4 py-2 text-white">決済案内へ進む</button>
              </div>
            )}
            {isAuthenticated ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {(['correct', 'wrong', 'bookmarked'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => progressMutation.mutate({ problemId: problem.id, status })}
                    className={`rounded-full px-3 py-1.5 text-sm ${progressMap[problem.id] === status ? 'bg-navy text-white' : 'border border-slate-200 bg-white text-slate-700'}`}
                  >
                    {status === 'correct' ? '正解' : status === 'wrong' ? '復習' : '保存'}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-sm text-slate-500">進捗保存にはログインが必要です。</div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );

  const renderDashboard = () => {
    if (!isAuthenticated) {
      return <Gate title="学習記録はログイン後に利用可能" description="LINEログイン後、学習ログとダッシュボードを使えます。" onAction={login} />;
    }

    return (
      <div className="space-y-6">
        {!profile?.onboarding_completed ? (
          <Section title="初回プロフィール設定">
            <div className="grid gap-3 md:grid-cols-2">
              <input value={onboardingForm.full_name} onChange={(e) => setOnboardingForm((c) => ({ ...c, full_name: e.target.value }))} placeholder="氏名" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <input value={onboardingForm.school_name} onChange={(e) => setOnboardingForm((c) => ({ ...c, school_name: e.target.value }))} placeholder="学校名" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
              <select value={onboardingForm.gender} onChange={(e) => setOnboardingForm((c) => ({ ...c, gender: e.target.value as UserGender }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                {genders.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
              </select>
              <input value={onboardingForm.club_name} onChange={(e) => setOnboardingForm((c) => ({ ...c, club_name: e.target.value }))} placeholder="部活動" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            </div>
            <button onClick={() => onboardingMutation.mutate()} className="mt-4 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">
              保存する
            </button>
          </Section>
        ) : null}

        <Section title="学習サマリー">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-500">総学習時間</div><div className="mt-1 text-2xl font-bold text-navy-900">{dashboardQuery.data?.stats.totalHours ?? 0}h</div></div>
            <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-500">正解数</div><div className="mt-1 text-2xl font-bold text-navy-900">{dashboardQuery.data?.stats.correctCount ?? 0}</div></div>
            <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-500">正答率</div><div className="mt-1 text-2xl font-bold text-navy-900">{dashboardQuery.data?.stats.accuracy ?? 0}%</div></div>
            <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-500">連続学習日数</div><div className="mt-1 text-2xl font-bold text-navy-900">{dashboardQuery.data?.stats.streakDays ?? 0}日</div></div>
          </div>
        </Section>

        <Section title="学習ログを追加">
          <div className="grid gap-3 md:grid-cols-4">
            <select value={studyLog.subject} onChange={(e) => setStudyLog((c) => ({ ...c, subject: e.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
              {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
            </select>
            <input type="number" value={studyLog.minutes} onChange={(e) => setStudyLog((c) => ({ ...c, minutes: Number(e.target.value) }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <input type="date" value={studyLog.logged_on} onChange={(e) => setStudyLog((c) => ({ ...c, logged_on: e.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <input value={studyLog.memo} onChange={(e) => setStudyLog((c) => ({ ...c, memo: e.target.value }))} placeholder="メモ" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
          <button onClick={() => studyLogMutation.mutate()} className="mt-4 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">保存する</button>
        </Section>
      </div>
    );
  };

  const renderCommunity = () => {
    if (!isAuthenticated) {
      return <Gate title="コミュニティはログイン後に利用可能" description="無料チャンネルの閲覧にはログインが必要です。" onAction={login} />;
    }
    if (!isPremium) {
      return <Gate title="限定コミュニティはプレミアム会員向け" description="プレミアム加入後、質問投稿と限定スレッドが利用できます。" premium onAction={handleUpgrade} />;
    }

    return (
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Section title="チャンネル一覧">
          <div className="space-y-2">
            {(channelsQuery.data ?? []).map((channel) => (
              <button key={channel.id} onClick={() => setSelectedChannelId(channel.id)} className={`w-full rounded-2xl border px-4 py-3 text-left text-sm ${selectedChannelId === channel.id ? 'border-navy bg-slate-50' : 'border-slate-200 bg-white'}`}>
                <div className="font-semibold text-navy-900">{channel.name}</div>
                <div className="mt-1 text-slate-500">{channel.description}</div>
              </button>
            ))}
          </div>
        </Section>
        <Section title="メッセージ">
          <div className="space-y-3">
            {(messagesQuery.data ?? []).map((message) => (
              <div key={message.id} className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm font-semibold text-navy-900">{message.display_name}</div>
                <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{message.content}</div>
                <div className="mt-2 text-xs text-slate-500">{formatDateTime(message.created_at)}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="メッセージを入力" className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
            <button onClick={() => messageMutation.mutate()} className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">送信</button>
          </div>
        </Section>
      </div>
    );
  };

  const renderAdmin = () => {
    if (!profile?.is_admin) {
      return <Gate title="管理画面" description="管理者権限が必要です。" onAction={() => navigate('home')} />;
    }
    return (
      <Section title="登録ユーザー一覧">
        <div className="space-y-3">
          {(adminUsersQuery.data ?? []).map((user) => (
            <div key={user.id} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
              <div className="font-semibold text-navy-900">{user.display_name}</div>
              <div>学校: {user.school_name ?? '-'}</div>
              <div>プレミアム: {user.is_premium ? 'はい' : 'いいえ'}</div>
              <div>登録日: {formatDateTime(user.created_at)}</div>
            </div>
          ))}
        </div>
      </Section>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <LiffBootstrap liffId={publicLineConfig.liffId} enableDevLogin={publicLineConfig.enableDevLogin} />
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xl font-bold text-navy-900">Re-try Pro</div>
            <div className="text-sm text-slate-500">医学部学士編入向けダッシュボード</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className={`rounded-full px-4 py-2 text-sm font-semibold ${isPremium ? 'bg-gold-50 text-gold-900' : 'bg-slate-100 text-slate-700'}`}>
                  {isPremium ? 'プレミアム' : '無料プラン'}
                </div>
                {!isPremium ? (
                  <button onClick={handleUpgrade} className="rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white">決済案内へ進む</button>
                ) : null}
                <button onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                  <LogOut className="h-4 w-4" />
                  ログアウト
                </button>
              </>
            ) : (
              <button onClick={login} className="inline-flex items-center gap-2 rounded-full bg-[#06C755] px-5 py-2.5 text-sm font-semibold text-white">
                <UserRound className="h-4 w-4" />
                LINEでログイン
              </button>
            )}
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 pb-4 sm:px-6 lg:px-8">
          {[...tabs, ...(profile?.is_admin ? [{ key: 'admin' as const, label: '管理者', icon: ShieldCheck }] : [])].map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} onClick={() => navigate(item.key)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${tab === item.key ? 'bg-navy text-white' : 'bg-slate-100 text-slate-700'}`}>
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {billingStatus === 'success' ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">決済が完了しました。プレミアム状態の反映を確認してください。</div> : null}
        {billingStatus === 'cancel' ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">決済はキャンセルされました。必要であれば再度お試しください。</div> : null}

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
          <div>LINEログイン / Stripe Checkout / 特定商取引法ページ対応済み</div>
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
