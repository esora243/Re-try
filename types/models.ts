export type UserGender = '男性' | '女性' | 'その他' | '回答しない';

export type UserProfile = {
  id: string;
  line_user_id: string;
  display_name: string;
  full_name: string | null;
  school_name: string | null;
  gender: UserGender | null;
  club_name: string | null;
  onboarding_completed: boolean;
  avatar_url: string | null;
  avatar_color: string | null;
  is_premium: boolean;
  is_admin: boolean;
  free_views_used: number;
  created_at: string;
  updated_at: string;
};

export type University = {
  id: string;
  name: string;
  region: string;
  life_sci: string;
  physics_chem: string;
  stats_math: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type ExamSchedule = {
  id: string;
  university_id: string;
  year: number;
  application_start: string | null;
  application_end: string | null;
  first_exam_date: string | null;
  second_exam_date: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
  university?: Pick<University, 'id' | 'name' | 'region'>;
};

export type Problem = {
  id: string;
  university_id: string | null;
  subject: string;
  year: number;
  difficulty: number;
  question: string;
  options: string | null;
  answer: string | null;
  answer_detail: string | null;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
  university?: Pick<University, 'id' | 'name' | 'region'> | null;
  can_view_answer?: boolean;
};

export type ProblemProgress = {
  id: string;
  user_id: string;
  problem_id: string;
  status: 'correct' | 'wrong' | 'bookmarked';
  updated_at: string;
  created_at: string;
};

export type StudyLog = {
  id: string;
  user_id: string;
  subject: string;
  minutes: number;
  memo: string | null;
  logged_on: string;
  created_at: string;
};

export type CommunityChannel = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_premium: boolean;
  sort_order: number;
  member_count: number;
  created_at: string;
};

export type CommunityMessage = {
  id: string;
  channel_id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  avatar_color: string | null;
  content: string;
  is_tutor: boolean;
  created_at: string;
};

export type DashboardResponse = {
  stats: {
    totalMinutes: number;
    totalHours: number;
    correctCount: number;
    wrongCount: number;
    accuracy: number;
    streakDays: number;
  };
  subjectBreakdown: Array<{
    subject: string;
    minutes: number;
    attempted: number;
    correct: number;
    accuracy: number;
  }>;
  weakProblems: Problem[];
  studyLogs: StudyLog[];
};

export type SummaryResponse = {
  universities: number;
  problems: number;
  channels: number;
  messages: number;
};

export type SessionClaims = {
  sub: string;
  role: 'authenticated';
  aud: 'authenticated';
  line_user_id: string;
  display_name: string;
  iat: number;
  exp: number;
};
