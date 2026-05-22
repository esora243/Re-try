import type {
  AdmissionInfo,
  BoardCategory,
  BoardReply,
  BoardThread,
  CommunityChannel,
  CommunityMessage,
  ExamSchedule,
  Problem,
  StudyLog,
  SummaryResponse,
  University,
  UserProfile
} from '@/types/models';

type ProgressStatus = 'correct' | 'wrong' | 'bookmarked';

type MockStore = {
  profiles: Record<string, UserProfile>;
  studyLogs: StudyLog[];
  progress: Array<{ id: string; user_id: string; problem_id: string; status: ProgressStatus; updated_at: string; created_at: string }>;
  messages: CommunityMessage[];
  boardThreads: BoardThread[];
  boardReplies: BoardReply[];
};

const globalStore = globalThis as typeof globalThis & { __retryMockStore?: MockStore };

const nowIso = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

// =============================================================
// 大学データ
// 出典:
//   - 各大学公式サイト
//   - 清光編入学院 まとめ(https://www.seiko-lab.com/topics/medicine/transfer/2026kokkouritsu-igakubuhennnyu/)
//   - Hennyu-Cell まとめ(https://hennyu-cell.com/?page_id=4161)
// 確実に確認できた情報のみを記載しています。
// =============================================================

const adm = (info: AdmissionInfo): AdmissionInfo => info;

export const mockUniversities: University[] = [
  {
    id: 'uni-hokkaido',
    name: '北海道大学',
    region: '北海道・東北',
    prefecture: '北海道',
    capacity_label: '5名',
    entry_year: '2年次',
    life_sci: '生命科学総合問題（一次）',
    physics_chem: '一次筆記に含まれる',
    stats_math: '一次筆記に含まれる',
    english_summary: 'TOEIC 680 / TOEFL iBT 71 相当',
    note: '一次は生命科学総合、二次で課題論文と面接を実施。',
    official_url: 'https://www.med.hokudai.ac.jp/sch-med/',
    admissions_url: 'https://www.med.hokudai.ac.jp/sch-med/admissions/index.html',
    admissions: [
      adm({
        year: 2026,
        capacity: 5,
        application_period: '2025年7月15日〜7月23日',
        first_exam_date: '2025年8月17日',
        second_exam_date: '2025年10月5日',
        result_announcement: null,
        subjects_first: '生命科学総合問題',
        subjects_second: '課題論文・面接',
        english_requirement: 'TOEIC 680 / TOEFL iBT 71 以上',
        source_url: 'https://www.med.hokudai.ac.jp/sch-med/admissions/index.html'
      }),
      adm({
        year: 2025,
        capacity: 5,
        application_period: '2024年7月中旬',
        first_exam_date: '2024年8月',
        second_exam_date: '2024年10月',
        result_announcement: null,
        subjects_first: '生命科学総合問題',
        subjects_second: '課題論文・面接',
        english_requirement: 'TOEIC 680 / TOEFL iBT 71 以上',
        source_url: 'https://www.med.hokudai.ac.jp/sch-med/admissions/index.html'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-asahikawa',
    name: '旭川医科大学',
    region: '北海道・東北',
    prefecture: '北海道',
    capacity_label: '10名',
    entry_year: '2年次',
    life_sci: '生命科学（一次）',
    physics_chem: '記載なし',
    stats_math: '記載なし',
    english_summary: '一次筆記の英語',
    note: '一次に生命科学と英語、二次に個人面接。',
    official_url: 'https://www.asahikawa-med.ac.jp/',
    admissions_url: 'https://www.asahikawa-med.ac.jp/admission/exam/faculty_app_guidebook/',
    admissions: [
      adm({
        year: 2026,
        capacity: 10,
        application_period: '2025年9月1日〜9月5日',
        first_exam_date: '2025年10月25日',
        second_exam_date: '2025年11月22日',
        result_announcement: null,
        subjects_first: '生命科学・英語',
        subjects_second: '個人面接',
        english_requirement: null,
        source_url: 'https://www.asahikawa-med.ac.jp/admission/exam/faculty_app_guidebook/'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-akita',
    name: '秋田大学',
    region: '北海道・東北',
    prefecture: '秋田県',
    capacity_label: '5名',
    entry_year: '2年次',
    life_sci: '生命科学（二次）',
    physics_chem: '記載なし',
    stats_math: '記載なし',
    english_summary: '記載なし',
    note: '一次は書類審査、二次で小論文・生命科学・面接。',
    official_url: 'https://www.med.akita-u.ac.jp/',
    admissions_url: 'https://www.med.akita-u.ac.jp/selection/md/selection-igakubu.php',
    admissions: [
      adm({
        year: 2026,
        capacity: 5,
        application_period: '2025年9月4日〜9月12日',
        first_exam_date: null,
        second_exam_date: '2025年11月6日〜11月7日',
        result_announcement: null,
        subjects_first: '書類審査',
        subjects_second: '小論文・生命科学・面接',
        english_requirement: null,
        source_url: 'https://www.med.akita-u.ac.jp/selection/md/selection-igakubu.php'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-hirosaki',
    name: '弘前大学',
    region: '北海道・東北',
    prefecture: '青森県',
    capacity_label: '20名',
    entry_year: '2年次',
    life_sci: '基礎自然科学に含まれる',
    physics_chem: '基礎自然科学（一次）',
    stats_math: '数学（一次）',
    english_summary: 'TOEFL iBT スコア提出必須',
    note: 'TOEFL iBT のスコア提出が出願要件。',
    official_url: 'https://www.hirosaki-u.ac.jp/',
    admissions_url: 'https://nyushi.hirosaki-u.ac.jp/transfer/requirements/',
    admissions: [
      adm({
        year: 2026,
        capacity: 20,
        application_period: '2025年10月21日〜10月27日',
        first_exam_date: '2025年11月16日',
        second_exam_date: '2025年12月14日',
        result_announcement: null,
        subjects_first: '基礎自然科学・数学',
        subjects_second: '面接',
        english_requirement: 'TOEFL iBT 提出必須',
        source_url: 'https://nyushi.hirosaki-u.ac.jp/transfer/requirements/'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-gunma',
    name: '群馬大学',
    region: '関東',
    prefecture: '群馬県',
    capacity_label: '15名（一般10名・地域医療枠5名）',
    entry_year: '2年次',
    life_sci: '小論文の中で出題',
    physics_chem: '小論文の中で出題',
    stats_math: '小論文の中で出題',
    english_summary: '小論文の中で出題',
    note: '一次は小論文1・2、二次は面接の形式。',
    official_url: 'https://www.med.gunma-u.ac.jp/',
    admissions_url: 'https://www.med.gunma-u.ac.jp/admissions/med/transfer_001',
    admissions: [
      adm({
        year: 2026,
        capacity: 15,
        application_period: '2025年7月23日〜7月28日',
        first_exam_date: '2025年9月7日',
        second_exam_date: '2025年10月12日',
        result_announcement: null,
        subjects_first: '小論文1・小論文2',
        subjects_second: '面接',
        english_requirement: null,
        source_url: 'https://www.med.gunma-u.ac.jp/admissions/med/transfer_001'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-tsukuba',
    name: '筑波大学',
    region: '関東',
    prefecture: '茨城県',
    capacity_label: '5名',
    entry_year: '2年次',
    life_sci: '学力試験2（生物学）',
    physics_chem: '学力試験2（化学）',
    stats_math: '学力試験1（数学）',
    english_summary: '学力試験1（英語）',
    note: '英語・数学・化学・生物・適性試験を含む本格的な学力試験。',
    official_url: 'https://www.tsukuba.ac.jp/',
    admissions_url: 'https://ac.tsukuba.ac.jp/wp/wp-content/uploads/2025/04/R8_hennyu.pdf',
    admissions: [
      adm({
        year: 2026,
        capacity: 5,
        application_period: '2025年6月2日〜6月6日',
        first_exam_date: '2025年7月12日〜13日',
        second_exam_date: '2025年7月12日〜13日',
        result_announcement: null,
        subjects_first: '学力試験1（英語・数学）・学力試験2（化学・生物学）',
        subjects_second: '適性試験・面接',
        english_requirement: null,
        source_url: 'https://ac.tsukuba.ac.jp/wp/wp-content/uploads/2025/04/R8_hennyu.pdf'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-science-tokyo',
    name: '東京科学大学',
    region: '関東',
    prefecture: '東京都',
    capacity_label: '5名',
    entry_year: '2年次',
    life_sci: '自然科学総合問題',
    physics_chem: '自然科学総合問題',
    stats_math: '自然科学総合問題',
    english_summary: 'TOEFL iBT 80 相当',
    note: '一次は自然科学総合問題と書類審査、二次は面接。',
    official_url: 'https://www.isct.ac.jp/',
    admissions_url: 'https://admissions.isct.ac.jp/ja/013/undergraduate/entrance-examination/med-transfer',
    admissions: [
      adm({
        year: 2026,
        capacity: 5,
        application_period: '2025年5月12日〜5月16日',
        first_exam_date: '2025年6月11日',
        second_exam_date: '2025年7月9日',
        result_announcement: null,
        subjects_first: '自然科学総合問題・書類審査',
        subjects_second: '面接',
        english_requirement: 'TOEFL iBT 80 程度',
        source_url: 'https://admissions.isct.ac.jp/ja/013/undergraduate/entrance-examination/med-transfer'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-hamamatsu',
    name: '浜松医科大学',
    region: '中部',
    prefecture: '静岡県',
    capacity_label: '5名',
    entry_year: '2年次',
    life_sci: '生命科学（一次）',
    physics_chem: '一次筆記に含まれる',
    stats_math: '記載なし',
    english_summary: '一次筆記の英語',
    note: '一次は生命科学と英語、二次は小論文と面接。',
    official_url: 'https://www.hama-med.ac.jp/',
    admissions_url: 'https://www.hama-med.ac.jp/education-and-campus/faculty-of-medicine/admission/transfer/index.html',
    admissions: [
      adm({
        year: 2026,
        capacity: 5,
        application_period: '2025年7月28日〜8月6日',
        first_exam_date: '2025年8月30日',
        second_exam_date: '2025年10月5日',
        result_announcement: null,
        subjects_first: '生命科学・英語',
        subjects_second: '小論文・面接',
        english_requirement: null,
        source_url: 'https://www.hama-med.ac.jp/education-and-campus/faculty-of-medicine/admission/transfer/index.html'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-nagoya',
    name: '名古屋大学',
    region: '中部',
    prefecture: '愛知県',
    capacity_label: '4名以内',
    entry_year: '2年次',
    life_sci: '筆記試験（生命科学等）',
    physics_chem: '記載なし',
    stats_math: '記載なし',
    english_summary: '一次に英語、TOEIC・TOEFLスコア活用',
    note: '一次に生命科学等の筆記と英語、二次は小論文と面接。',
    official_url: 'https://www.med.nagoya-u.ac.jp/medical_J/',
    admissions_url: 'https://www.med.nagoya-u.ac.jp/medical_J/admission/transfer/admissions/',
    admissions: [
      adm({
        year: 2026,
        capacity: 4,
        application_period: '2025年5月1日〜5月9日',
        first_exam_date: '2025年6月5日',
        second_exam_date: '2025年7月3日',
        result_announcement: null,
        subjects_first: '筆記試験（生命科学等）・英語',
        subjects_second: '小論文・面接',
        english_requirement: 'TOEIC または TOEFL のスコア提出',
        source_url: 'https://www.med.nagoya-u.ac.jp/medical_J/admission/transfer/admissions/'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-toyama',
    name: '富山大学',
    region: '中部',
    prefecture: '富山県',
    capacity_label: '5名',
    entry_year: '2年次',
    life_sci: '総合試験に含まれる',
    physics_chem: '総合試験に含まれる',
    stats_math: '総合試験に含まれる',
    english_summary: 'TOEIC または TOEFL のスコア提出',
    note: '一次は総合試験と課題作文、二次は口頭発表と面接。',
    official_url: 'https://www.u-toyama.ac.jp/',
    admissions_url: 'https://www.med.u-toyama.ac.jp/jp/edu/transfer.html',
    admissions: [
      adm({
        year: 2026,
        capacity: 5,
        application_period: '2025年7月28日〜8月1日',
        first_exam_date: '2025年9月7日',
        second_exam_date: '2025年11月16日',
        result_announcement: null,
        subjects_first: '総合試験・課題作文',
        subjects_second: '口頭発表・面接',
        english_requirement: 'TOEIC または TOEFL のスコア提出',
        source_url: 'https://www.med.u-toyama.ac.jp/jp/edu/transfer.html'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-kanazawa',
    name: '金沢大学',
    region: '中部',
    prefecture: '石川県',
    capacity_label: '5名',
    entry_year: '2年次',
    life_sci: '生命科学問題（二次）',
    physics_chem: '記載なし',
    stats_math: '記載なし',
    english_summary: 'TOEFL iBT のスコア提出',
    note: '一次は書類選考、二次は生命科学、三次は口述試験の三段階。',
    official_url: 'https://www.med.kanazawa-u.ac.jp/',
    admissions_url: 'https://www.med.kanazawa-u.ac.jp/admission/',
    admissions: [
      adm({
        year: 2026,
        capacity: 5,
        application_period: '2025年8月18日〜8月22日',
        first_exam_date: '2025年9月19日',
        second_exam_date: '2025年10月17日',
        result_announcement: null,
        subjects_first: '書類選考・生命科学問題',
        subjects_second: '口述試験',
        english_requirement: 'TOEFL iBT のスコア提出',
        source_url: 'https://www.med.kanazawa-u.ac.jp/admission/'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-fukui',
    name: '福井大学',
    region: '中部',
    prefecture: '福井県',
    capacity_label: '5名',
    entry_year: '2年次',
    life_sci: '自然科学総合（一次）',
    physics_chem: '自然科学総合（一次）',
    stats_math: '自然科学総合（一次）',
    english_summary: '自然科学総合に英語を含む',
    note: '一次は自然科学総合、二次は面接で構成される。',
    official_url: 'https://www.u-fukui.ac.jp/',
    admissions_url: 'https://www.med.u-fukui.ac.jp/MED/admission/transfer.html',
    admissions: [
      adm({
        year: 2026,
        capacity: 5,
        application_period: '2025年7月7日〜7月11日',
        first_exam_date: '2025年8月30日',
        second_exam_date: '2025年11月1日',
        result_announcement: null,
        subjects_first: '自然科学総合',
        subjects_second: '面接',
        english_requirement: null,
        source_url: 'https://www.med.u-fukui.ac.jp/MED/admission/transfer.html'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-shiga',
    name: '滋賀医科大学',
    region: '近畿',
    prefecture: '滋賀県',
    capacity_label: '15名',
    entry_year: '2年次',
    life_sci: '総合問題に含まれる',
    physics_chem: '総合問題に含まれる',
    stats_math: '総合問題に含まれる',
    english_summary: '一次筆記の英語',
    note: '一次は総合問題と英語、二次は小論文と個人面接。',
    official_url: 'https://www.shiga-med.ac.jp/',
    admissions_url: 'https://www.shiga-med.ac.jp/admission/undergraduate/requirements',
    admissions: [
      adm({
        year: 2026,
        capacity: 15,
        application_period: '2025年8月25日〜8月29日',
        first_exam_date: '2025年9月20日',
        second_exam_date: '2025年10月21日',
        result_announcement: null,
        subjects_first: '総合問題・英語',
        subjects_second: '小論文Ⅰ・小論文Ⅱ・個人面接',
        english_requirement: null,
        source_url: 'https://www.shiga-med.ac.jp/admission/undergraduate/requirements'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-osaka',
    name: '大阪大学',
    region: '近畿',
    prefecture: '大阪府',
    capacity_label: '10名',
    entry_year: '2年次',
    life_sci: '生命科学（一次）',
    physics_chem: '物理・化学（一次）',
    stats_math: '記載なし',
    english_summary: 'TOEFL・TOEIC のスコア活用',
    note: '一次に英語・生命科学・物理・化学、二次に小論文と面接。',
    official_url: 'https://www.med.osaka-u.ac.jp/',
    admissions_url: 'https://www.med.osaka-u.ac.jp/admission/admission-2-2',
    admissions: [
      adm({
        year: 2026,
        capacity: 10,
        application_period: '2025年6月2日〜6月6日',
        first_exam_date: '2025年7月5日',
        second_exam_date: '2025年7月26日',
        result_announcement: null,
        subjects_first: '英語・生命科学・物理学・化学',
        subjects_second: '小論文・面接',
        english_requirement: 'TOEFL または TOEIC のスコア活用',
        source_url: 'https://www.med.osaka-u.ac.jp/admission/admission-2-2'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-kobe',
    name: '神戸大学',
    region: '近畿',
    prefecture: '兵庫県',
    capacity_label: '5名',
    entry_year: '2年次',
    life_sci: '生命科学と英語の総合問題',
    physics_chem: '記載なし',
    stats_math: '記載なし',
    english_summary: '生命科学と英語の総合問題',
    note: '一次は生命科学と英語の総合問題、二次は口述試験。',
    official_url: 'https://www.med.kobe-u.ac.jp/',
    admissions_url: 'https://www.med.kobe-u.ac.jp/admission/transfer.html',
    admissions: [
      adm({
        year: 2026,
        capacity: 5,
        application_period: '2025年7月3日〜7月9日',
        first_exam_date: '2025年8月5日',
        second_exam_date: '2025年9月5日',
        result_announcement: null,
        subjects_first: '生命科学と英語の総合問題・書類審査',
        subjects_second: '口述試験',
        english_requirement: null,
        source_url: 'https://www.med.kobe-u.ac.jp/admission/transfer.html'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-okayama',
    name: '岡山大学',
    region: '中国・四国',
    prefecture: '岡山県',
    capacity_label: '5名',
    entry_year: '2年次',
    life_sci: '生物学（二次）',
    physics_chem: '記載なし',
    stats_math: '記載なし',
    english_summary: 'TOEFL iBT 60 相当',
    note: '一次は書類審査、二次に生物学・小論文・面接。',
    official_url: 'https://www.okayama-u.ac.jp/user/med/',
    admissions_url: 'https://www.okayama-u.ac.jp/user/med/page-30.html',
    admissions: [
      adm({
        year: 2026,
        capacity: 5,
        application_period: '2025年4月9日〜4月18日',
        first_exam_date: null,
        second_exam_date: '2025年6月28日',
        result_announcement: null,
        subjects_first: '書類審査',
        subjects_second: '生物学・小論文・面接',
        english_requirement: 'TOEFL iBT 60 程度',
        source_url: 'https://www.okayama-u.ac.jp/user/med/page-30.html'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-shimane',
    name: '島根大学',
    region: '中国・四国',
    prefecture: '島根県',
    capacity_label: '2年次5名・3年次5名',
    entry_year: '2年次・3年次',
    life_sci: '自然科学総合問題',
    physics_chem: '自然科学総合問題',
    stats_math: '自然科学総合問題',
    english_summary: 'TOEIC 600 相当',
    note: '2年次と3年次の枠があり、英語・自然科学総合問題と面接で選考。',
    official_url: 'https://www.shimane-u.ac.jp/',
    admissions_url: 'https://www.shimane-u.ac.jp/nyushi/information/application/2026/2026hennyu.html',
    admissions: [
      adm({
        year: 2026,
        capacity: 10,
        application_period: '2025年7月15日〜7月18日',
        first_exam_date: '2025年8月23日',
        second_exam_date: '2025年9月20日〜9月21日',
        result_announcement: null,
        subjects_first: '外国語（英語）・自然科学総合問題',
        subjects_second: '面接',
        english_requirement: 'TOEIC 600 程度',
        source_url: 'https://www.shimane-u.ac.jp/nyushi/information/application/2026/2026hennyu.html'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-tottori',
    name: '鳥取大学',
    region: '中国・四国',
    prefecture: '鳥取県',
    capacity_label: '5名',
    entry_year: '2年次',
    life_sci: '基礎科学（生命科学を含む）',
    physics_chem: '基礎科学（化学を含む）',
    stats_math: '記載なし',
    english_summary: '筆記試験の英語',
    note: '基礎科学・英語・面接で構成。',
    official_url: 'https://www.tottori-u.ac.jp/',
    admissions_url: 'https://www.admissions.adm.tottori-u.ac.jp/transfer/3841',
    admissions: [
      adm({
        year: 2026,
        capacity: 5,
        application_period: '2025年8月4日〜8月8日',
        first_exam_date: '2025年9月6日',
        second_exam_date: '2025年9月6日',
        result_announcement: null,
        subjects_first: '書類・基礎科学・英語',
        subjects_second: '面接',
        english_requirement: null,
        source_url: 'https://www.admissions.adm.tottori-u.ac.jp/transfer/3841'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-yamaguchi',
    name: '山口大学',
    region: '中国・四国',
    prefecture: '山口県',
    capacity_label: '10名（うち地域枠3名）',
    entry_year: '2年次',
    life_sci: '学科試験に含まれる',
    physics_chem: '学科試験に含まれる',
    stats_math: '学科試験に含まれる',
    english_summary: '学科試験に含まれる',
    note: '一次は学科試験と小論文、二次は面接。',
    official_url: 'https://www.yamaguchi-u.ac.jp/med/',
    admissions_url: 'https://www.yamaguchi-u.ac.jp/med/medicine/admission/incorporation/index.html',
    admissions: [
      adm({
        year: 2026,
        capacity: 10,
        application_period: '2025年7月28日〜7月31日',
        first_exam_date: '2025年9月28日',
        second_exam_date: '2025年11月16日',
        result_announcement: null,
        subjects_first: '学科試験・小論文',
        subjects_second: '面接',
        english_requirement: null,
        source_url: 'https://www.yamaguchi-u.ac.jp/med/medicine/admission/incorporation/index.html'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-kagawa',
    name: '香川大学',
    region: '中国・四国',
    prefecture: '香川県',
    capacity_label: '5名',
    entry_year: '2年次',
    life_sci: '自然科学総合問題',
    physics_chem: '自然科学総合問題',
    stats_math: '記載なし',
    english_summary: 'TOEIC 600 相当',
    note: '一次は自然科学総合問題、二次は面接。',
    official_url: 'https://www.med.kagawa-u.ac.jp/',
    admissions_url: 'https://www.med.kagawa-u.ac.jp/prospective_students/igaku/hennyu/',
    admissions: [
      adm({
        year: 2026,
        capacity: 5,
        application_period: '2025年5月7日〜5月15日',
        first_exam_date: '2025年6月6日',
        second_exam_date: null,
        result_announcement: null,
        subjects_first: '自然科学総合問題',
        subjects_second: '面接',
        english_requirement: 'TOEIC 600 程度',
        source_url: 'https://www.med.kagawa-u.ac.jp/prospective_students/igaku/hennyu/'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-ehime',
    name: '愛媛大学',
    region: '中国・四国',
    prefecture: '愛媛県',
    capacity_label: '5名',
    entry_year: '2年次',
    life_sci: '自然科学総合問題',
    physics_chem: '自然科学総合問題',
    stats_math: '記載なし',
    english_summary: 'TOEIC 600 相当',
    note: '出願後、一次の自然科学総合問題と二次の面接で選考。',
    official_url: 'https://www.m.ehime-u.ac.jp/',
    admissions_url: 'https://www.ehime-u.ac.jp/entrance/transfer-exam/',
    admissions: [
      adm({
        year: 2026,
        capacity: 5,
        application_period: '2025年6月下旬',
        first_exam_date: null,
        second_exam_date: null,
        result_announcement: null,
        subjects_first: '自然科学総合問題',
        subjects_second: '面接',
        english_requirement: 'TOEIC 600 程度',
        source_url: 'https://www.ehime-u.ac.jp/entrance/transfer-exam/'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-kochi',
    name: '高知大学',
    region: '中国・四国',
    prefecture: '高知県',
    capacity_label: '4名（2027年度より）',
    entry_year: '1年次',
    life_sci: '総合問題に含まれる',
    physics_chem: '総合問題に含まれる',
    stats_math: '総合問題に含まれる',
    english_summary: 'TOEIC・TOEFL・IELTS のスコア活用',
    note: '2027年度入試より1年次10月入学に変更。',
    official_url: 'https://www.kochi-u.ac.jp/kms/',
    admissions_url: 'https://www.kochi-u.ac.jp/kms/admission/index.html',
    admissions: [
      adm({
        year: 2026,
        capacity: 5,
        application_period: '2025年6月上旬',
        first_exam_date: '2025年7月',
        second_exam_date: '2025年8月',
        result_announcement: null,
        subjects_first: '総合問題',
        subjects_second: '面接・グループディスカッション',
        english_requirement: 'TOEIC・TOEFL・IELTS のいずれか',
        source_url: 'https://www.kochi-u.ac.jp/kms/admission/index.html'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-oita',
    name: '大分大学',
    region: '九州',
    prefecture: '大分県',
    capacity_label: '10名',
    entry_year: '2年次',
    life_sci: '生命科学（一次）',
    physics_chem: '記載なし',
    stats_math: '記載なし',
    english_summary: '一次筆記の英語',
    note: '一次は生命科学と英語、二次以降に小論文・面接。',
    official_url: 'https://www.oita-u.ac.jp/',
    admissions_url: 'https://www.oita-u.ac.jp/06nyushi/gakubu/gakubu-hennyugaku.html',
    admissions: [
      adm({
        year: 2026,
        capacity: 10,
        application_period: '2025年4月21日〜',
        first_exam_date: null,
        second_exam_date: null,
        result_announcement: null,
        subjects_first: '生命科学・英語',
        subjects_second: '小論文・面接',
        english_requirement: null,
        source_url: 'https://www.oita-u.ac.jp/06nyushi/gakubu/gakubu-hennyugaku.html'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-nagasaki',
    name: '長崎大学',
    region: '九州',
    prefecture: '長崎県',
    capacity_label: '5名',
    entry_year: '2年次',
    life_sci: '生命科学（一次）',
    physics_chem: '記載なし',
    stats_math: '記載なし',
    english_summary: 'TOEIC または TOEFL のスコア提出',
    note: '一次は生命科学と英語、二次に小論文と面接。',
    official_url: 'https://www.med.nagasaki-u.ac.jp/med/',
    admissions_url: 'https://www.med.nagasaki-u.ac.jp/med/contents/001_02_applications.html',
    admissions: [
      adm({
        year: 2026,
        capacity: 5,
        application_period: '2025年7月11日〜',
        first_exam_date: null,
        second_exam_date: null,
        result_announcement: null,
        subjects_first: '生命科学・英語',
        subjects_second: '小論文・面接',
        english_requirement: 'TOEIC または TOEFL のスコア提出',
        source_url: 'https://www.med.nagasaki-u.ac.jp/med/contents/001_02_applications.html'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-kagoshima',
    name: '鹿児島大学',
    region: '九州',
    prefecture: '鹿児島県',
    capacity_label: '10名',
    entry_year: '2年次',
    life_sci: '生命科学（一次）',
    physics_chem: '一次筆記に含まれる',
    stats_math: '記載なし',
    english_summary: 'TOEFL iBT 64 / TOEIC L&R 720 以上',
    note: 'TOEFL iBT 64 または TOEIC L&R 720 以上が出願要件。',
    official_url: 'https://www.kufm.kagoshima-u.ac.jp/~med/',
    admissions_url: 'https://www.kufm.kagoshima-u.ac.jp/~med/admission/exam/bachelor/',
    admissions: [
      adm({
        year: 2026,
        capacity: 10,
        application_period: '2025年4月30日〜5月8日',
        first_exam_date: '2025年6月6日',
        second_exam_date: '2025年7月4日',
        result_announcement: null,
        subjects_first: '学力試験（生命科学等）',
        subjects_second: '面接',
        english_requirement: 'TOEFL iBT 64 / TOEIC L&R 720 以上',
        source_url: 'https://www.kufm.kagoshima-u.ac.jp/~med/admission/exam/bachelor/'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'uni-ryukyu',
    name: '琉球大学',
    region: '九州',
    prefecture: '沖縄県',
    capacity_label: '5名',
    entry_year: '2年次',
    life_sci: '自然科学総合Ⅰ・Ⅱ',
    physics_chem: '自然科学総合Ⅰ・Ⅱ',
    stats_math: '記載なし',
    english_summary: 'TOEFL iBT 61 / TOEIC 600 相当',
    note: '一次は自然科学総合Ⅰ・Ⅱ、二次は小論文と個人面接。',
    official_url: 'https://www.med.u-ryukyu.ac.jp/',
    admissions_url: 'https://www.med.u-ryukyu.ac.jp/safe-area/20456.html',
    admissions: [
      adm({
        year: 2026,
        capacity: 5,
        application_period: '2025年7月31日〜',
        first_exam_date: '2025年9月',
        second_exam_date: '2025年11月',
        result_announcement: null,
        subjects_first: '自然科学総合Ⅰ・Ⅱ',
        subjects_second: '小論文Ⅰ・Ⅱ・個人面接',
        english_requirement: 'TOEFL iBT 61 / TOEIC 600 相当',
        source_url: 'https://www.med.u-ryukyu.ac.jp/safe-area/20456.html'
      })
    ],
    created_at: nowIso(),
    updated_at: nowIso()
  }
];

// =============================================================
// 試験日程（最新と前年）
// =============================================================
export const mockSchedules: ExamSchedule[] = mockUniversities.flatMap((university) =>
  university.admissions.map((info, idx) => ({
    id: `sch-${university.id}-${info.year}-${idx}`,
    university_id: university.id,
    year: info.year,
    application_start: info.application_period ?? null,
    application_end: null,
    first_exam_date: info.first_exam_date,
    second_exam_date: info.second_exam_date,
    memo: info.subjects_first ?? null,
    created_at: nowIso(),
    updated_at: nowIso(),
    university: {
      id: university.id,
      name: university.name,
      region: university.region,
      admissions_url: university.admissions_url
    }
  }))
);

// =============================================================
// サンプル過去問
// プレミアム問題は問題文・選択肢・解答すべてが課金後表示。
// =============================================================
export const mockProblems: Problem[] = [
  {
    id: 'problem-hokkaido-free-1',
    university_id: 'uni-hokkaido',
    subject: '生命科学',
    year: 2025,
    difficulty: 3,
    question: '細胞膜の流動モザイクモデルの特徴を、構成成分と機能の観点から説明してください。',
    options: null,
    answer: 'リン脂質二重層に膜タンパク質がモザイク状に存在し、膜成分が側方拡散することで、物質輸送や情報伝達などの機能を担う。',
    answer_detail: '膜の流動性は脂質の不飽和度や温度に影響され、機能発現にとって重要であることを押さえる。',
    is_premium: false,
    created_at: nowIso(),
    updated_at: nowIso(),
    university: { id: 'uni-hokkaido', name: '北海道大学', region: '北海道・東北' },
    can_view_answer: true,
    can_view_question: true
  },
  {
    id: 'problem-hokkaido-premium-1',
    university_id: 'uni-hokkaido',
    subject: '生命科学',
    year: 2026,
    difficulty: 4,
    question: '遺伝子発現制御におけるエピジェネティクスの代表的な機構を3つ挙げ、それぞれの作用を述べてください。',
    options: null,
    answer: 'DNAメチル化、ヒストン修飾、ノンコーディングRNAによる制御。',
    answer_detail: 'DNAメチル化は遺伝子発現の抑制、ヒストンアセチル化は発現の活性化、miRNAやlncRNAは翻訳・転写両方に作用する。',
    is_premium: true,
    created_at: nowIso(),
    updated_at: nowIso(),
    university: { id: 'uni-hokkaido', name: '北海道大学', region: '北海道・東北' },
    can_view_answer: false,
    can_view_question: false
  },
  {
    id: 'problem-osaka-premium-1',
    university_id: 'uni-osaka',
    subject: '化学',
    year: 2026,
    difficulty: 4,
    question: '酵素反応におけるミカエリス・メンテン式について、Vmax と Km の意味を述べた上で、阻害剤の種類によって速度パラメータがどう変化するか説明してください。',
    options: null,
    answer: 'Vmax は最大反応速度、Km は反応速度が Vmax の半分となる基質濃度。競合阻害では Km のみ増加、非競合阻害では Vmax のみ減少、不競合阻害では両方が減少する。',
    answer_detail: 'ラインウィーバー・バークプロットでの傾きと切片の変化と対応づけて理解する。',
    is_premium: true,
    created_at: nowIso(),
    updated_at: nowIso(),
    university: { id: 'uni-osaka', name: '大阪大学', region: '近畿' },
    can_view_answer: false,
    can_view_question: false
  },
  {
    id: 'problem-osaka-free-1',
    university_id: 'uni-osaka',
    subject: '英語',
    year: 2025,
    difficulty: 3,
    question: '次の英文の主旨を80字以内の日本語で要約してください（出題の傾向に基づくサンプル）：The mitochondrion is often described as the powerhouse of the cell, generating ATP through oxidative phosphorylation ...',
    options: null,
    answer: 'ミトコンドリアは酸化的リン酸化によりATPを産生し、細胞のエネルギー源として機能している、という主旨を要約する。',
    answer_detail: '電子伝達系・プロトン勾配・ATP合成酵素という3要素を含めて記述すると評価されやすい。',
    is_premium: false,
    created_at: nowIso(),
    updated_at: nowIso(),
    university: { id: 'uni-osaka', name: '大阪大学', region: '近畿' },
    can_view_answer: true,
    can_view_question: true
  },
  {
    id: 'problem-nagoya-premium-1',
    university_id: 'uni-nagoya',
    subject: '数学',
    year: 2026,
    difficulty: 4,
    question: 'ある疾患の有病率が 1% の集団で、感度 90%・特異度 95% の検査を行った。検査が陽性となった人が実際にその疾患である確率（陽性的中率）を求めてください。',
    options: null,
    answer: '約 15.4%',
    answer_detail: 'ベイズの定理：P(D|+) = (0.9 × 0.01) / (0.9 × 0.01 + 0.05 × 0.99) ≈ 0.154。事前確率の低さが PPV に与える影響を理解する。',
    is_premium: true,
    created_at: nowIso(),
    updated_at: nowIso(),
    university: { id: 'uni-nagoya', name: '名古屋大学', region: '中部' },
    can_view_answer: false,
    can_view_question: false
  },
  {
    id: 'problem-tsukuba-free-1',
    university_id: 'uni-tsukuba',
    subject: '生命科学',
    year: 2025,
    difficulty: 3,
    question: '細胞周期のチェックポイントが正常に機能しなかった場合、細胞や個体にどのような影響が生じうるかを述べてください。',
    options: null,
    answer: 'DNA損傷や染色体異常が修復されないまま分裂が進み、突然変異の蓄積や腫瘍化のリスクが高まる。',
    answer_detail: 'p53 などのチェックポイント因子の機能異常と発がんの関係を絡めると深まる。',
    is_premium: false,
    created_at: nowIso(),
    updated_at: nowIso(),
    university: { id: 'uni-tsukuba', name: '筑波大学', region: '関東' },
    can_view_answer: true,
    can_view_question: true
  },
  {
    id: 'problem-kobe-premium-1',
    university_id: 'uni-kobe',
    subject: '生命科学',
    year: 2026,
    difficulty: 4,
    question: '神経筋接合部における興奮伝達のしくみを、関与する分子と現象の順序を踏まえて説明してください。',
    options: null,
    answer: '神経終末でアセチルコリンが放出され、終板のニコチン性受容体に結合、Na+流入で終板電位が生じて筋細胞が興奮、収縮へとつながる。',
    answer_detail: '電位依存性 Ca2+ チャネルの役割、AChE による分解の意義もあわせて押さえる。',
    is_premium: true,
    created_at: nowIso(),
    updated_at: nowIso(),
    university: { id: 'uni-kobe', name: '神戸大学', region: '近畿' },
    can_view_answer: false,
    can_view_question: false
  },
  {
    id: 'problem-shimane-premium-1',
    university_id: 'uni-shimane',
    subject: '化学',
    year: 2026,
    difficulty: 3,
    question: 'pH 7.4 のヒト血液において、HCO3-/H2CO3 緩衝系がどのように働いて pH を一定に保つか、Henderson-Hasselbalch 式を用いて説明してください。',
    options: null,
    answer: 'pH = pKa + log([HCO3-]/[H2CO3]) の関係から、肺による H2CO3 の調整と腎による HCO3- の調整で比率が保たれ、結果として pH が 7.4 に維持される。',
    answer_detail: '呼吸性・代謝性のアシドーシス／アルカローシスの代償機構と関連づけると応用しやすい。',
    is_premium: true,
    created_at: nowIso(),
    updated_at: nowIso(),
    university: { id: 'uni-shimane', name: '島根大学', region: '中国・四国' },
    can_view_answer: false,
    can_view_question: false
  }
];

export const mockChannels: CommunityChannel[] = [
  {
    id: 'channel-free',
    slug: 'general',
    name: '受験相談',
    description: '誰でも参加できる相談チャンネル',
    icon: 'message-square',
    is_premium: false,
    sort_order: 1,
    member_count: 0,
    created_at: nowIso()
  },
  {
    id: 'channel-premium',
    slug: 'premium-room',
    name: '解放済み相談室',
    description: '解放後に参加できる相談チャンネル',
    icon: 'crown',
    is_premium: true,
    sort_order: 2,
    member_count: 0,
    created_at: nowIso()
  }
];

const initialMessages: CommunityMessage[] = [];

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

const initialBoardThreads: BoardThread[] = [
  {
    id: 'thread-welcome',
    title: 'はじめにお読みください',
    category: '雑談',
    body: '受験生どうしで気軽に質問・情報交換ができる掲示板です。まずは自己紹介や、いま気になっていることを気軽に書き込んでみてください。',
    user_id: 'tutor-1',
    display_name: 'Re-try',
    avatar_color: '#1B2A4A',
    is_premium: false,
    is_pinned: true,
    is_closed: false,
    reply_count: 0,
    last_reply_at: null,
    created_at: nowIso(),
    updated_at: nowIso()
  },
  {
    id: 'thread-study-method',
    title: '生命科学の勉強法・参考書情報',
    category: '勉強法',
    body: '使ってよかった参考書や、進め方をシェアしましょう。「何周したか」より「何を身につけたか」を書くと読みやすくなります。',
    user_id: 'tutor-1',
    display_name: 'Re-try',
    avatar_color: '#1B2A4A',
    is_premium: false,
    is_pinned: false,
    is_closed: false,
    reply_count: 0,
    last_reply_at: null,
    created_at: nowIso(),
    updated_at: nowIso()
  }
];

const initialBoardReplies: BoardReply[] = [];

export const getMockStore = () => {
  if (!globalStore.__retryMockStore) {
    globalStore.__retryMockStore = {
      profiles: {},
      studyLogs: [],
      progress: [],
      messages: [...initialMessages],
      boardThreads: [...initialBoardThreads],
      boardReplies: [...initialBoardReplies]
    };
  }
  const store = globalStore.__retryMockStore;
  if (!store.boardThreads) store.boardThreads = [...initialBoardThreads];
  if (!store.boardReplies) store.boardReplies = [...initialBoardReplies];
  return store;
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

export const getMockSummary = (): SummaryResponse => {
  const store = getMockStore();
  return {
    universities: mockUniversities.length,
    problems: mockProblems.length,
    channels: mockChannels.length,
    messages: store.messages.length,
    boardThreads: store.boardThreads.length
  };
};

export const listMockBoardThreads = (filters?: { category?: BoardCategory; includePremium?: boolean }) => {
  const store = getMockStore();
  return store.boardThreads
    .filter((thread) => (filters?.category ? thread.category === filters.category : true))
    .filter((thread) => (filters?.includePremium ? true : !thread.is_premium))
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      const aTime = a.last_reply_at ?? a.created_at;
      const bTime = b.last_reply_at ?? b.created_at;
      return bTime.localeCompare(aTime);
    });
};

export const getMockBoardThread = (threadId: string) =>
  getMockStore().boardThreads.find((thread) => thread.id === threadId) ?? null;

export const createMockBoardThread = (input: Omit<BoardThread, 'id' | 'reply_count' | 'last_reply_at' | 'created_at' | 'updated_at' | 'is_pinned' | 'is_closed'> & {
  is_pinned?: boolean;
  is_closed?: boolean;
}) => {
  const store = getMockStore();
  const thread: BoardThread = {
    ...input,
    id: uuid(),
    is_pinned: input.is_pinned ?? false,
    is_closed: input.is_closed ?? false,
    reply_count: 0,
    last_reply_at: null,
    created_at: nowIso(),
    updated_at: nowIso()
  };
  store.boardThreads.unshift(thread);
  return thread;
};

export const listMockBoardReplies = (threadId: string) =>
  getMockStore()
    .boardReplies.filter((reply) => reply.thread_id === threadId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

export const createMockBoardReply = (input: Omit<BoardReply, 'id' | 'created_at'>) => {
  const store = getMockStore();
  const reply: BoardReply = { ...input, id: uuid(), created_at: nowIso() };
  store.boardReplies.push(reply);
  const thread = store.boardThreads.find((item) => item.id === input.thread_id);
  if (thread) {
    thread.reply_count += 1;
    thread.last_reply_at = reply.created_at;
    thread.updated_at = reply.created_at;
  }
  return reply;
};

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
