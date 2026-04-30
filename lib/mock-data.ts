import type { CommunityChannel, CommunityMessage, ExamSchedule, Problem, StudyLog, SummaryResponse, University, UserProfile } from '@/types/models';

type ProgressStatus = 'correct' | 'wrong' | 'bookmarked';

type MockStore = {
  profiles: Record<string, UserProfile>;
  studyLogs: StudyLog[];
  progress: Array<{ id: string; user_id: string; problem_id: string; status: ProgressStatus; updated_at: string; created_at: string }>;
  messages: CommunityMessage[];
};

const globalStore = globalThis as typeof globalThis & { __retryMockStore?: MockStore };

const nowIso = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export const mockUniversities: University[] = [
  {
    id: 'uni-hokkaido',
    name: '北海道大学',
    region: '北海道・東北',
    life_sci: '生命科学の頻出範囲が広く、基礎知識の確認が重要',
    physics_chem: '化学中心',
    stats_math: '統計の基本問題が多い',
    note: '面接対策も重要',
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-nagoya',
    name: '名古屋大学',
    region: '中部',
    life_sci: '論述と知識のバランス型',
    physics_chem: '化学・物理の横断出題あり',
    stats_math: 'データ解釈の比重が高い',
    note: '年度によって形式差あり',
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-osaka',
    name: '大阪大学',
    region: '近畿',
    life_sci: '読解量が多め',
    physics_chem: '標準レベル中心',
    stats_math: '数学の基本計算力が必要',
    note: '英語も安定して対策',
    created_at: nowIso(),
    updated_at: nowIso()
  }
];

export const mockSchedules: ExamSchedule[] = [
  {
    id: 'sch-hokkaido-2026',
    university_id: 'uni-hokkaido',
    year: 2026,
    application_start: '2026-04-20',
    application_end: '2026-05-10',
    first_exam_date: '2026-06-14',
    second_exam_date: '2026-07-05',
    memo: '募集要項公開後に再確認推奨',
    created_at: nowIso(),
    updated_at: nowIso(),
    university: { id: 'uni-hokkaido', name: '北海道大学', region: '北海道・東北' }
  },
  {
    id: 'sch-nagoya-2026',
    university_id: 'uni-nagoya',
    year: 2026,
    application_start: '2026-05-01',
    application_end: '2026-05-20',
    first_exam_date: '2026-06-28',
    second_exam_date: '2026-07-19',
    memo: '二次面接あり',
    created_at: nowIso(),
    updated_at: nowIso(),
    university: { id: 'uni-nagoya', name: '名古屋大学', region: '中部' }
  }
];

export const mockProblems: Problem[] = [
  {
    id: 'problem-free-1',
    university_id: 'uni-hokkaido',
    subject: '生命科学',
    year: 2026,
    difficulty: 3,
    question: '細胞膜の流動モザイクモデルについて説明しなさい。',
    options: null,
    answer: 'リン脂質二重層に膜タンパク質がモザイク状に存在し、膜成分が側方拡散するモデル。',
    answer_detail: '膜の流動性と機能の関係を説明できるようにする。',
    is_premium: false,
    created_at: nowIso(),
    updated_at: nowIso(),
    university: { id: 'uni-hokkaido', name: '北海道大学', region: '北海道・東北' },
    can_view_answer: true
  },
  {
    id: 'problem-premium-1',
    university_id: 'uni-nagoya',
    subject: '数学',
    year: 2026,
    difficulty: 4,
    question: 'ある検査の陽性的中率を条件付き確率から求めなさい。',
    options: null,
    answer: '8.75%',
    answer_detail: '事前確率・感度・特異度からベイズの定理で計算する。',
    is_premium: true,
    created_at: nowIso(),
    updated_at: nowIso(),
    university: { id: 'uni-nagoya', name: '名古屋大学', region: '中部' },
    can_view_answer: false
  }
];

export const mockChannels: CommunityChannel[] = [
  {
    id: 'channel-free',
    slug: 'general',
    name: '受験相談',
    description: '無料で読める相談チャンネル',
    icon: 'message-square',
    is_premium: false,
    sort_order: 1,
    member_count: 120,
    created_at: nowIso()
  },
  {
    id: 'channel-premium',
    slug: 'premium-room',
    name: 'プレミアム相談室',
    description: 'プレミアム限定の質問部屋',
    icon: 'crown',
    is_premium: true,
    sort_order: 2,
    member_count: 32,
    created_at: nowIso()
  }
];

const initialMessages: CommunityMessage[] = [
  {
    id: uuid(),
    channel_id: 'channel-premium',
    user_id: 'tutor-1',
    display_name: 'Re-try Tutor',
    avatar_url: null,
    avatar_color: '#1B2A4A',
    content: 'プレミアム相談室へようこそ。過去問の解き方も質問できます。',
    is_tutor: true,
    created_at: nowIso()
  }
];

const createDefaultProfile = (lineUserId: string, displayName: string, pictureUrl?: string | null): UserProfile => ({
  id: `mock-${lineUserId}`,
  line_user_id: lineUserId,
  display_name: displayName,
  full_name: null,
  school_name: null,
  gender: null,
  club_name: null,
  onboarding_completed: false,
  avatar_url: pictureUrl ?? null,
  avatar_color: '#1B2A4A',
  is_premium: false,
  is_admin: false,
  free_views_used: 0,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  premium_activated_at: null,
  created_at: nowIso(),
  updated_at: nowIso()
});

export const getMockStore = () => {
  if (!globalStore.__retryMockStore) {
    globalStore.__retryMockStore = {
      profiles: {},
      studyLogs: [],
      progress: [],
      messages: [...initialMessages]
    };
  }
  return globalStore.__retryMockStore;
};

export const upsertMockProfile = (lineUserId: string, displayName: string, pictureUrl?: string | null) => {
  const store = getMockStore();
  const id = `mock-${lineUserId}`;
  const existing = store.profiles[id] ?? createDefaultProfile(lineUserId, displayName, pictureUrl);
  const updated: UserProfile = {
    ...existing,
    display_name: displayName,
    avatar_url: pictureUrl ?? existing.avatar_url,
    updated_at: nowIso()
  };
  store.profiles[id] = updated;
  return updated;
};

export const getMockProfileById = (id: string, displayName?: string, lineUserId?: string) => {
  const store = getMockStore();
  if (store.profiles[id]) return store.profiles[id];
  if (lineUserId && displayName) {
    const profile = createDefaultProfile(lineUserId, displayName);
    profile.id = id;
    store.profiles[id] = profile;
    return profile;
  }
  return null;
};

export const updateMockProfile = (id: string, patch: Partial<UserProfile>) => {
  const store = getMockStore();
  const current = store.profiles[id];
  if (!current) return null;
  const next = { ...current, ...patch, updated_at: nowIso() };
  store.profiles[id] = next;
  return next;
};

export const getMockSummary = (): SummaryResponse => ({
  universities: mockUniversities.length,
  problems: mockProblems.length,
  channels: mockChannels.length,
  messages: getMockStore().messages.length
});

export const listMockMessages = (channelId: string) => getMockStore().messages.filter((item) => item.channel_id === channelId);

export const addMockMessage = (message: Omit<CommunityMessage, 'id' | 'created_at'>) => {
  const store = getMockStore();
  const created: CommunityMessage = { ...message, id: uuid(), created_at: nowIso() };
  store.messages.push(created);
  return created;
};

export const listMockStudyLogs = (userId: string) => getMockStore().studyLogs.filter((item) => item.user_id === userId).sort((a, b) => b.logged_on.localeCompare(a.logged_on));

export const addMockStudyLog = (log: Omit<StudyLog, 'id' | 'created_at'>) => {
  const store = getMockStore();
  const created: StudyLog = { ...log, id: uuid(), created_at: nowIso() };
  store.studyLogs.push(created);
  return created;
};

export const listMockProgress = (userId: string) => getMockStore().progress.filter((item) => item.user_id === userId);

export const upsertMockProgress = (userId: string, problemId: string, status: ProgressStatus) => {
  const store = getMockStore();
  const existing = store.progress.find((item) => item.user_id === userId && item.problem_id === problemId);
  if (existing) {
    existing.status = status;
    existing.updated_at = nowIso();
    return existing;
  }
  const created = { id: uuid(), user_id: userId, problem_id: problemId, status, updated_at: nowIso(), created_at: nowIso() };
  store.progress.push(created);
  return created;
};
