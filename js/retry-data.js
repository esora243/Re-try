// ============================================
// Re-try Pro — Data Layer (retry-data.js)
// ============================================

// ===== UNIVERSITIES =====
const UNIVERSITIES = [
  { id:'asahikawa', name:'旭川医科大学', region:'北海道・東北', ls:'◎ (300)', pc:'× / △', sm:'◎', note:'生命科学の配点80%以上。基礎医学系問題が中心。' },
  { id:'hokkaido',  name:'北海道大学',   region:'北海道・東北', ls:'◎',       pc:'◎ / ◎', sm:'◎', note:'課題論文あり。理系科目の総力戦。英語力も重要。' },
  { id:'hirosaki',  name:'弘前大学',     region:'北海道・東北', ls:'○',       pc:'○ / ○', sm:'○', note:'基礎自然科学(200)、面接(200)重視。バランス型。' },
  { id:'akita',     name:'秋田大学',     region:'北海道・東北', ls:'◎',       pc:'× / ×', sm:'○', note:'1次書類選考、面接重視。生命科学一本勝負の傾向。' },
  { id:'gunma',     name:'群馬大学',     region:'関東',         ls:'△',       pc:'× / △', sm:'×', note:'小論文、個人・集団面接あり。文系的素養が問われる。' },
  { id:'tsukuba',   name:'筑波大学',     region:'関東',         ls:'◎',       pc:'× / ○', sm:'◎', note:'適性試験。数学・統計の比重高。論理的思考力が鍵。' },
  { id:'tmd',       name:'東京科学大学', region:'関東',         ls:'△',       pc:'× / ×', sm:'△', note:'研究課題提出。英語力最重視。学術論文の英語読解必須。' },
  { id:'hamamatsu', name:'浜松医科大学', region:'中部',         ls:'◎ (120)', pc:'◎ / ◎', sm:'×', note:'英語(60)・小論文(60)・面接(90)。バランス重要。' },
  { id:'nagoya',    name:'名古屋大学',   region:'中部',         ls:'◎ (150)', pc:'× / ×', sm:'◎', note:'外部英語(150)と生命科学が鍵。TOEICスコアが重要。' },
  { id:'toyama',    name:'富山大学',     region:'中部',         ls:'△',       pc:'× / △', sm:'△', note:'総合試験(180分)、英和辞書持込可。' },
  { id:'kanazawa',  name:'金沢大学',     region:'中部',         ls:'◎',       pc:'× / ×', sm:'×', note:'3次試験（グループ口述）が鬼門。コミュ力も重要。' },
  { id:'fukui',     name:'福井大学',     region:'中部',         ls:'◎',       pc:'△ / △', sm:'◎', note:'物理・化学・統計は年度による。過去問傾向の把握必須。' },
  { id:'shiga',     name:'滋賀医科大学', region:'近畿',         ls:'◎ (100)', pc:'○ / ○', sm:'◎ (100)', note:'英語・数学含め各100点の均等配点。総合力が問われる。' },
  { id:'osaka',     name:'大阪大学',     region:'近畿',         ls:'◎ (150)', pc:'◎ / ◎', sm:'×', note:'生命科学の問題文に英語が含まれる。英語+生命科学融合問題。' },
  { id:'kobe',      name:'神戸大学',     region:'近畿',         ls:'△',       pc:'× / ×', sm:'△', note:'口述試験（最近の研究内容等）。研究経験が活かせる。' },
  { id:'nara',      name:'奈良県立医科大学', region:'近畿',     ls:'○',       pc:'○ / ○', sm:'○', note:'英語・数学・理科各150点。バランス型。面接も重要。' },
  { id:'tottori',   name:'鳥取大学',     region:'中国・四国',   ls:'◎',       pc:'× / ○', sm:'×', note:'地域枠限定。英語試験あり。地域医療への意欲が評価される。' },
  { id:'shimane',   name:'島根大学',     region:'中国・四国',   ls:'◎',       pc:'× / ◎', sm:'×', note:'2年次または3年次編入。化学の比重が高い。' },
  { id:'okayama',   name:'岡山大学',     region:'中国・四国',   ls:'◎ (200)', pc:'× / ×', sm:'×', note:'小論文(60)、面接(180)。生命科学一強。面接配点が高い。' },
  { id:'yamaguchi', name:'山口大学',     region:'中国・四国',   ls:'◎',       pc:'○ / ○', sm:'○', note:'小論文(英語)あり。地方国立の中でもバランスの取れた難問。' },
  { id:'kagawa',    name:'香川大学',     region:'中国・四国',   ls:'◎',       pc:'◎ / ◎', sm:'×', note:'自然科学(300)、TOEIC(150)。理系科目＋英語力が必須。' },
  { id:'ehime',     name:'愛媛大学',     region:'中国・四国',   ls:'◎',       pc:'○ / ○', sm:'×', note:'10分プレゼン・口述試験あり。プレゼン力が差になる。' },
  { id:'kochi',     name:'高知大学',     region:'中国・四国',   ls:'◎',       pc:'○ / ○', sm:'○', note:'卒論執筆経験必須。グループワーク。研究活動が評価される。' },
  { id:'oita',      name:'大分大学',     region:'九州',         ls:'◎ (200)', pc:'× / △', sm:'△', note:'書類(100)、英語(100)、GD(150)。グループディスカッション重視。' },
  { id:'nagasaki',  name:'長崎大学',     region:'九州',         ls:'◎ (600)', pc:'× / ×', sm:'×', note:'英語(50)に生命科学の内容を含む。生命科学が最大配点。' },
  { id:'kagoshima', name:'鹿児島大学',   region:'九州',         ls:'◎',       pc:'△ / △', sm:'△', note:'筆記(400)はマークシート。対策しやすい形式。' },
  { id:'ryukyu',    name:'琉球大学',     region:'九州',         ls:'◎',       pc:'× / ×', sm:'×', note:'小論文あり。医療資格の加点可。沖縄地域医療への意欲が重要。' }
];

// ===== PROBLEMS =====
const PROBLEMS = [
  // --- 生命科学 ---
  {
    id:'P001', subject:'生命科学', uni:'山口大学', year:2025, difficulty:3,
    question:'真核細胞に存在して原核細胞に存在しない細胞小器官を3つ挙げ、それぞれの機能を簡潔に述べよ。',
    options:'', isPremium:false,
    answer:'ミトコンドリア（好気呼吸・ATP産生）、ゴルジ体（タンパク質の修飾・輸送）、核膜（DNAの収容と保護）など。葉緑体（光合成）、リソソーム（細胞内消化）なども正解。',
    answer_detail:'原核細胞にはリボソームが存在するが、真核細胞のものとは構造が異なる（70S vs 80S）。膜系細胞小器官はすべて真核生物特有。'
  },
  {
    id:'P002', subject:'生命科学', uni:'岡山大学', year:2025, difficulty:4,
    question:'細胞膜を介した物質輸送には能動輸送と受動輸送がある。Na⁺/K⁺ポンプを例に、能動輸送の仕組みと生理的意義を述べよ。',
    options:'', isPremium:true,
    answer:'Na⁺/K⁺-ATPaseはATPを加水分解するエネルギーを利用し、Na⁺を3個細胞外へ、K⁺を2個細胞内へ輸送する（濃度勾配に逆らう能動輸送）。この濃度勾配は神経・筋肉の興奮性、細胞容量調節、グルコース等の二次能動輸送に利用される。',
    answer_detail:'Na⁺/K⁺ポンプはP型ATPaseの一種。阻害薬としてウアバイン（オウバイン）が有名。心不全治療薬ジゴキシンもNa⁺/K⁺ポンプを阻害することで薬効を発揮する。'
  },
  {
    id:'P003', subject:'生命科学', uni:'筑波大学', year:2024, difficulty:3,
    question:'mRNA、tRNA、rRNAのそれぞれの機能と、タンパク質合成（翻訳）における役割を説明せよ。',
    options:'', isPremium:true,
    answer:'mRNA（メッセンジャーRNA）：遺伝情報をDNAから転写し、コドン配列でアミノ酸の順序を指定。tRNA（トランスファーRNA）：アンチコドンでmRNAのコドンと対合し、対応するアミノ酸をリボソームに運搬。rRNA（リボソームRNA）：リボソームの構造成分として翻訳の場を形成し、ペプチジルトランスフェラーゼ活性を担う。',
    answer_detail:'リボソームは大サブユニット(60S)と小サブユニット(40S)から成る80S。細菌のリボソームは70Sで、抗菌薬の標的となる。'
  },
  {
    id:'P004', subject:'生命科学', uni:'大阪大学', year:2025, difficulty:5,
    question:'癌細胞の特徴について、正常細胞との比較を交えながら、増殖制御・アポトーシス・エネルギー代謝の観点から論じよ。(英語で解答)',
    options:'', isPremium:true,
    answer:'Cancer cells acquire unlimited proliferative potential by dysregulating the cell cycle (loss of RB, overactivation of cyclin/CDK), evading apoptosis (BCL-2 overexpression, p53 mutation), and shifting to aerobic glycolysis (Warburg effect) even in the presence of oxygen, supporting rapid biomass production.',
    answer_detail:'大阪大学は生命科学問題に英語が含まれることが特徴。Hallmarks of Cancer (Hanahan & Weinberg)の概念を押さえておくこと。'
  },
  {
    id:'P005', subject:'生命科学', uni:'名古屋大学', year:2024, difficulty:4,
    question:'DNA複製において、リーディング鎖とラギング鎖で複製の仕組みが異なる理由を、DNAポリメラーゼの特性と関連させて説明せよ。',
    options:'', isPremium:true,
    answer:'DNAポリメラーゼは5\'→3\'方向にしかDNA合成できず、かつプライマーを必要とする。リーディング鎖は3\'→5\'の鋳型に対して5\'→3\'に連続合成が可能。ラギング鎖は5\'→3\'方向の鋳型に対して不連続なオカザキ断片として合成され、後にDNAリガーゼで連結される。',
    answer_detail:'複製開始にはRNAプライマーが必要。RNAプライマーはRNaseHで除去され、DNAポリメラーゼδで埋め合わせられる。'
  },
  // --- 数学・統計 ---
  {
    id:'P006', subject:'数学', uni:'筑波大学', year:2025, difficulty:3,
    question:'ある疾患の有病率が1%の集団において、感度95%・特異度90%の検査を施行した。陽性的中率（PPV）を求めよ。',
    options:'', isPremium:false,
    answer:'ベイズの定理を使用。P(病気|陽性) = (感度×有病率) / (感度×有病率 + (1-特異度)×(1-有病率)) = (0.95×0.01) / (0.95×0.01 + 0.10×0.99) = 0.0095 / (0.0095 + 0.099) ≈ 0.0875 ≈ 8.75%',
    answer_detail:'有病率が低い集団では、高性能な検査でも陽性的中率は低くなることを示す重要な例。この結果は医療経済学・スクリーニングプログラム設計に直結する。'
  },
  {
    id:'P007', subject:'数学', uni:'名古屋大学', year:2024, difficulty:4,
    question:'100名の患者を対象に薬剤Aと薬剤Bの効果を比較した。以下の2×2表からオッズ比と95%信頼区間を求め、統計学的有意性について述べよ。薬剤A: 有効35名・無効15名、薬剤B: 有効20名・無効30名',
    options:'', isPremium:true,
    answer:'OR = (35×30) / (15×20) = 1050 / 300 = 3.5。ln(OR) = ln(3.5) ≈ 1.253。SE = √(1/35+1/15+1/20+1/30) ≈ 0.378。95%CI = exp(1.253 ± 1.96×0.378) = exp(0.512〜1.994) ≈ 1.67〜7.34。95%CIに1を含まないため統計学的に有意（p < 0.05）。',
    answer_detail:'オッズ比の95%信頼区間は対数変換後に計算してから逆変換する。CIが1をまたがない場合は有意差あり。'
  },
  {
    id:'P008', subject:'数学', uni:'旭川医科大学', year:2025, difficulty:3,
    question:'正規分布に従うとき、平均値±1.96標準偏差の範囲に含まれる確率は何%か。また、これを臨床研究における参照区間の設定にどう応用するか述べよ。',
    options:'a:90% / b:95% / c:99% / d:68% / e:99.7%', isPremium:false,
    answer:'b: 95%。正規分布では平均±1.96SDの範囲に全データの95%が含まれる（正確には95.0%）。参照区間（基準値範囲）の設定に応用：健常者集団の測定値の中央95%を「正常範囲」として採用。約5%の健常者が「異常値」として検出される（偽陽性5%）。',
    answer_detail:'参照区間の設定には通常120人以上の健常者データを使用（CLSI推奨）。非正規分布の場合は百分位数法を使用する。'
  },
  // --- 英語 ---
  {
    id:'P009', subject:'英語', uni:'香川大学', year:2025, difficulty:4,
    question:'次の英文を和訳せよ。"The gut microbiome has emerged as a pivotal mediator of the gut-brain axis, influencing neurotransmitter production, immune modulation, and the hypothalamic-pituitary-adrenal stress response."',
    options:'', isPremium:false,
    answer:'腸内マイクロバイオームは、腸脳軸の重要な仲介者として台頭しており、神経伝達物質の産生、免疫調節、および視床下部-下垂体-副腎（HPA）ストレス応答に影響を与えている。',
    answer_detail:'gut-brain axis（腸脳軸）、hypothalamic-pituitary-adrenal axis（HPA軸）は頻出表現。mediator（仲介者）、modulation（調節）も重要語彙。'
  },
  {
    id:'P010', subject:'英語', uni:'浜松医科大学', year:2025, difficulty:3,
    question:'あなたが医師を目指す理由を英語で200語程度で述べよ。',
    options:'', isPremium:true,
    answer:'【解答例】I aspire to become a physician because of a profound desire to alleviate human suffering. Growing up, witnessing my grandmother\'s battle with cancer instilled in me a deep empathy for patients and their families. As a researcher, I have studied the molecular mechanisms of disease, yet I feel an urgent need to translate this knowledge into direct patient care. Medicine uniquely integrates scientific rigor with humanistic compassion. I am particularly drawn to internal medicine, where a physician must synthesize complex data while maintaining a holistic view of the patient as a person. I believe that the graduate-entry pathway will allow me to bring maturity, scientific depth, and genuine commitment to the medical profession.',
    answer_detail:'浜松医科大学では英語面接・英作文が重要。具体的なエピソードを盛り込み、将来像を明確に。TOEIC 700点以上が推奨。'
  },
  // --- 化学 ---
  {
    id:'P011', subject:'化学', uni:'島根大学', year:2024, difficulty:4,
    question:'グルコースの解糖系（前半・後半）について、関与する主要な酵素名と産物を記し、1分子のグルコースから何分子のATPが基質レベルリン酸化で産生されるか答えよ。',
    options:'', isPremium:true,
    answer:'前半（エネルギー投資相）：ヘキソキナーゼ、ホスホフルクトキナーゼ-1（PFK-1）などが働きATPを2分子消費。後半（エネルギー産生相）：ホスホグリセリン酸キナーゼとピルビン酸キナーゼが各1回ずつ基質レベルリン酸化を行い、1分子グルコースあたり4分子のATPを産生。正味産生ATP = 4 - 2 = 2分子。',
    answer_detail:'好気条件下ではミトコンドリアでのTCA回路・電子伝達系を経て計30〜32分子のATPが産生される。解糖系のみ（嫌気）では2 ATP + 2乳酸。'
  },
  {
    id:'P012', subject:'化学', uni:'香川大学', year:2025, difficulty:3,
    question:'タンパク質の4種類の構造（1次〜4次）を説明し、それぞれを安定化する化学的相互作用を列挙せよ。',
    options:'', isPremium:true,
    answer:'1次構造：アミノ酸配列（ペプチド結合で安定化）。2次構造：α-ヘリックス・β-シート（水素結合で安定化）。3次構造：1本のポリペプチド全体の立体構造（疎水性相互作用・ジスルフィド結合・水素結合・イオン結合・ファンデルワールス力）。4次構造：複数のサブユニットの集合形式（主に疎水性相互作用・水素結合）。',
    answer_detail:'変性（denaturation）は3次・4次構造の破壊で、1次構造（共有結合）は保たれる。熱・強酸・強塩基・界面活性剤（SDS）が変性を引き起こす。'
  },
  // --- 物理 ---
  {
    id:'P013', subject:'物理', uni:'北海道大学', year:2024, difficulty:4,
    question:'心臓の拍動に伴う血圧波形（収縮期・拡張期）を流体力学的観点から説明し、脈圧と平均動脈圧（MAP）の計算式を示せ。',
    options:'', isPremium:true,
    answer:'収縮期に心室から血液が駆出されると大動脈壁が拡張し圧力が上昇（収縮期圧）。拡張期には弾性反跳により血流が維持され圧力は低下（拡張期圧）。脈圧 = 収縮期圧 - 拡張期圧。MAP ≈ 拡張期圧 + 脈圧/3 = 拡張期圧 + (収縮期圧 - 拡張期圧)/3。正常値：脈圧40mmHg、MAP70-100mmHg。',
    answer_detail:'ポアズイユの法則：Q = πr⁴ΔP / (8ηL)。血管抵抗は半径の4乗に反比例するため、細動脈が主要な抵抗血管となる。'
  },
  // --- 小論文 ---
  {
    id:'P014', subject:'小論文', uni:'山口大学', year:2025, difficulty:4,
    question:'「医師の地域偏在問題について、あなたの考えを述べよ。」（600字、英語）Write an essay in English about the problem of geographical maldistribution of physicians in Japan.',
    options:'', isPremium:true,
    answer:'【解答例】 Japan faces a persistent challenge of physician maldistribution, with urban centers enjoying physician-to-population ratios far exceeding rural areas. This disparity creates equity concerns and burdens both patients and overworked rural physicians. Solutions include mandatory rural service periods for new graduates, telemedicine expansion, financial incentives for rural practitioners, and restructuring medical education to cultivate "community-oriented" physicians. As a graduate-entry medical student, I would be deeply committed to serving underserved communities, leveraging my prior professional experience to build trust with rural patients.',
    answer_detail:'山口大学は英語小論文が特徴的。地域医療・医師偏在は頻出テーマ。地域枠・医師少数区域（医療法施行規則）についても把握しておくこと。'
  },
  {
    id:'P015', subject:'小論文', uni:'岡山大学', year:2024, difficulty:3,
    question:'「あなたが考える理想の医師像について述べよ。」（800字）',
    options:'', isPremium:true,
    answer:'【解答例の構成】①理想の医師像の提示（例：科学的思考力と人間的共感の両立）→②根拠となる経験・エピソード→③医学部進学後の具体的な学習計画→④社会への貢献の観点。\n\n核心：「理想」を抽象的に語るだけでなく、「なぜ自分がそれを体現できるか」という自己分析と結びつけることが高評価のポイント。',
    answer_detail:'岡山大学は小論文(60点)と面接(180点)の配点が高い。志望理由書と一貫したストーリーを持つことが重要。'
  }
];

// ===== TUTORS =====
const TUTORS = [
  { id:'yamada', name:'山田 先生', spec:'生命科学・旧帝大専門', color:'#0057B8', online:true },
  { id:'suzuki', name:'鈴木 先生', spec:'数学・統計・確率',     color:'#00A86B', online:true },
  { id:'tanaka', name:'田中 先生', spec:'英語・TOEIC・面接',    color:'#7C3AED', online:false },
  { id:'sato',   name:'佐藤 先生', spec:'小論文・出願書類',     color:'#EA580C', online:true }
];

// ===== DEMO MESSAGES =====
const DEMO_MESSAGES = {
  general: [
    { user:'合格者A', text:'山口大学の面接では「なぜ今の職業を辞めて医師を目指すのか」を必ず聞かれます。準備しておくといいです。', time:'10:23', avatar:'山', avatarColor:'#0057B8', isTutor:false },
    { user:'受験生B', text:'筑波の統計問題、オッズ比の計算が毎年出てますよね？', time:'10:45', avatar:'受', avatarColor:'#7C3AED', isTutor:false },
    { user:'@山田先生', text:'そうですね。P002の問題も参考にしてください。ROC曲線、カプランマイヤー曲線なども要チェックです。#生命科学', time:'11:02', avatar:'山', avatarColor:'#0057B8', isTutor:true },
    { user:'受験生C', text:'長崎大学って生命科学600点配点ですか？それほぼ一本勝負じゃないですか笑', time:'11:15', avatar:'受', avatarColor:'#00A86B', isTutor:false },
    { user:'合格者D（長崎）', text:'そうです！生命科学さえできれば受かります。でも問題の難易度は高くないので、基礎の完成度が鍵。', time:'11:28', avatar:'合', avatarColor:'#EA580C', isTutor:false }
  ],
  'life-science': [
    { user:'@鈴木先生', text:'今日は細胞シグナリングのポイントをまとめます。RTK→Ras→MAPK経路は必須です。', time:'09:15', avatar:'鈴', avatarColor:'#00A86B', isTutor:true },
    { user:'受験生E', text:'アポトーシスとネクローシスの違いは試験に出ますか？', time:'09:32', avatar:'受', avatarColor:'#7C3AED', isTutor:false },
    { user:'@山田先生', text:'大阪大学では頻出です。カスパーゼカスケード、シトクロムcの放出まで詳細に押さえておいてください。', time:'09:44', avatar:'山', avatarColor:'#0057B8', isTutor:true }
  ],
  'interview': [
    { user:'合格者F（岡山）', text:'岡山の面接では「医師不足についてどう思うか」が聞かれました。地域医療の話をするといいです。', time:'14:20', avatar:'合', avatarColor:'#EA580C', isTutor:false },
    { user:'@田中先生', text:'面接では「Why medicine, why now?」を英語で聞かれる大学も増えています（浜松医科等）。必ず英語でも準備しておいてください。', time:'14:35', avatar:'田', avatarColor:'#7C3AED', isTutor:true }
  ],
  math: [
    { user:'@鈴木先生', text:'【統計基礎】P値の解釈について：P値はH₀が正しいとした時に観察データ以上の差が生じる確率です。「差がある確率」ではないので注意！', time:'13:00', avatar:'鈴', avatarColor:'#00A86B', isTutor:true },
    { user:'受験生G', text:'筑波の2024年適性試験にベイズの定理が出ましたが、どこまで深く理解すれば良いですか？', time:'13:20', avatar:'受', avatarColor:'#0057B8', isTutor:false },
    { user:'@鈴木先生', text:'P(A|B) = P(B|A)P(A)/P(B) の公式と、感度・特異度・PPV・NPVの計算は完璧にしてください。P006の問題が典型例です。', time:'13:35', avatar:'鈴', avatarColor:'#00A86B', isTutor:true }
  ],
  english: [
    { user:'@田中先生', text:'今週のテーマ：医学英語語彙強化。epidemiology（疫学）、etiology（病因）、pathophysiology（病態生理）、prognosis（予後）を確認しましょう。', time:'08:30', avatar:'田', avatarColor:'#7C3AED', isTutor:true }
  ],
  report: [
    { user:'@佐藤先生', text:'志望理由書の添削、今月は5名受け付けています。フォームからご連絡ください。合格実績：山口・岡山・名古屋など。', time:'09:00', avatar:'佐', avatarColor:'#EA580C', isTutor:true },
    { user:'受験生H', text:'志望理由書って何字書けばいいんでしょうか？大学によって違いますよね？', time:'09:18', avatar:'受', avatarColor:'#0057B8', isTutor:false },
    { user:'@佐藤先生', text:'大学によって異なりますが、800〜1500字が多いです。重要なのは「なぜ今？」「なぜその大学？」「入学後の計画」の3点を明確にすること。', time:'09:30', avatar:'佐', avatarColor:'#EA580C', isTutor:true }
  ]
};

// ===== STUDY LOGS (demo) =====
const DEMO_STUDY_LOGS = [
  { subject:'生命科学', minutes:90, memo:'細胞小器官の機能まとめ', date:'2026-04-13' },
  { subject:'数学', minutes:60, memo:'統計・確率問題10問', date:'2026-04-12' },
  { subject:'英語', minutes:45, memo:'医学英語単語100語', date:'2026-04-12' },
  { subject:'小論文', minutes:30, memo:'地域医療テーマ練習', date:'2026-04-11' }
];

// Supabase DB Schema (for reference)
const DB_SCHEMA = {
  universities: `
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    region TEXT,
    life_sci TEXT, physics_chem TEXT, stats_math TEXT,
    note TEXT, created_at TIMESTAMPTZ DEFAULT NOW()`,
  problems: `
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject TEXT NOT NULL,
    university_name TEXT, year INT, difficulty INT,
    question TEXT NOT NULL, options TEXT,
    answer TEXT, answer_detail TEXT,
    is_premium BOOLEAN DEFAULT true,
    storage_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()`,
  user_profiles: `
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    display_name TEXT, line_user_id TEXT, avatar_url TEXT,
    is_premium BOOLEAN DEFAULT false,
    plan_expires_at TIMESTAMPTZ,
    free_views_used INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()`,
  study_logs: `
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id),
    subject TEXT, minutes INT, memo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()`,
  progress: `
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id),
    problem_id UUID REFERENCES problems(id),
    status TEXT CHECK (status IN ('correct','wrong','bookmarked')),
    created_at TIMESTAMPTZ DEFAULT NOW()`,
  messages: `
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel TEXT NOT NULL,
    user_id UUID REFERENCES user_profiles(id),
    display_name TEXT, avatar_color TEXT,
    content TEXT NOT NULL,
    is_tutor BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()`
};
