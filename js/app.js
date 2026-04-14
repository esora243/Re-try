// =========================================
// MedTransfer Pro - App Logic
// =========================================

// ===== STATE =====
let appState = {
  isPremium: false,
  freeViewCount: 0,
  isDemoUnlocked: false,
  currentTab: 'universities',
  regionFilter: 'all',
  scienceFilter: 'all',
  chapterFilter: 'all',
  typeFilter: 'all',
  calendarMonth: new Date(2026, 5), // June 2026
  calendarView: 'grid',
  progress: {}, // { questionId: 'correct' | 'wrong' }
  theme: 'light',
  streak: 0,
  lastStudyDate: null
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadStateFromStorage();
  renderUniversities();
  renderQuestions();
  renderCalendar();
  renderDashboard();
  updatePremiumUI();
});

// ===== LOCAL STORAGE =====
function loadStateFromStorage() {
  try {
    const saved = JSON.parse(localStorage.getItem('medTransferState') || '{}');
    if (saved.isPremium !== undefined) appState.isPremium = saved.isPremium;
    if (saved.freeViewCount !== undefined) appState.freeViewCount = saved.freeViewCount;
    if (saved.progress) appState.progress = saved.progress;
    if (saved.theme) appState.theme = saved.theme;
    if (saved.streak !== undefined) appState.streak = saved.streak;
    if (saved.lastStudyDate) appState.lastStudyDate = saved.lastStudyDate;
    
    // Check streak
    checkStreak();
    
    // Apply theme
    if (appState.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.getElementById('themeDark').classList.add('active');
      document.getElementById('themeLight').classList.remove('active');
    }
  } catch (e) {
    console.warn('Failed to load state:', e);
  }
}

function saveState() {
  try {
    localStorage.setItem('medTransferState', JSON.stringify({
      isPremium: appState.isPremium,
      freeViewCount: appState.freeViewCount,
      progress: appState.progress,
      theme: appState.theme,
      streak: appState.streak,
      lastStudyDate: appState.lastStudyDate
    }));
  } catch (e) {}
}

function checkStreak() {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  if (appState.lastStudyDate === today) {
    // Already studied today
  } else if (appState.lastStudyDate === yesterday) {
    // Studied yesterday - streak continues (don't increment yet, wait for activity)
  } else if (appState.lastStudyDate && appState.lastStudyDate !== yesterday) {
    // Streak broken
    appState.streak = 0;
  }
}

function recordStudyActivity() {
  const today = new Date().toDateString();
  if (appState.lastStudyDate !== today) {
    appState.streak += 1;
    appState.lastStudyDate = today;
    saveState();
  }
}

// ===== TAB SWITCHING =====
function switchTab(tabName) {
  // Deactivate all tabs and content
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  
  // Activate selected
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.getElementById(`content-${tabName}`).classList.add('active');
  
  appState.currentTab = tabName;
  
  if (tabName === 'dashboard') {
    renderDashboard();
  }
}

// ===== UNIVERSITIES TAB =====
function renderUniversities() {
  const grid = document.getElementById('uniGrid');
  const filtered = getFilteredUniversities();
  
  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;padding:3rem;">条件に一致する大学が見つかりません。</div>';
    return;
  }
  
  grid.innerHTML = filtered.map((u, i) => `
    <div class="uni-card" onclick="openUniModal('${u.id}')" style="animation-delay:${i * 0.05}s">
      <div class="uni-card-header">
        <div class="uni-name">
          <i class="fas fa-university" style="color:var(--gold);font-size:0.9rem;"></i>
          ${u.name}
        </div>
        <span class="uni-region-tag">${u.region}</span>
      </div>
      
      <div class="uni-subjects">
        <div class="subject-cell">
          <span class="subject-label">生命科学</span>
          ${renderSubjectBadge(u.lifeSci)}
        </div>
        <div class="subject-cell">
          <span class="subject-label">物理/化学</span>
          ${renderSubjectBadge(u.physics)}
        </div>
        <div class="subject-cell">
          <span class="subject-label">統計/数学</span>
          ${renderSubjectBadge(u.math)}
        </div>
      </div>
      
      <div class="uni-note">${u.note}</div>
      
      <div class="uni-card-footer">
        <button class="btn-detail" onclick="event.stopPropagation();openUniModal('${u.id}')">
          <i class="fas fa-info-circle"></i> 詳細
        </button>
        <span style="font-size:0.75rem;color:var(--text-muted);">クリックで詳細</span>
      </div>
    </div>
  `).join('');
}

function renderSubjectBadge(val) {
  if (!val) return '<div class="subject-badge badge-none">-</div>';
  
  const baseVal = val.split(' ')[0].split('/')[0].trim();
  
  if (baseVal === '◎') return `<div class="subject-badge badge-excellent">◎</div>`;
  if (baseVal === '○') return `<div class="subject-badge badge-good">○</div>`;
  if (baseVal === '△') return `<div class="subject-badge badge-fair">△</div>`;
  if (baseVal === '×') return `<div class="subject-badge badge-none">×</div>`;
  
  // Handle composite like "◎ (300)"
  if (val.includes('◎')) return `<div class="subject-badge badge-excellent" style="font-size:0.8rem;width:42px;height:42px;">◎</div>`;
  return `<div class="subject-badge badge-fair">${baseVal}</div>`;
}

function getFilteredUniversities() {
  let list = [...UNIVERSITIES];
  
  // Region filter
  if (appState.regionFilter !== 'all') {
    list = list.filter(u => u.region === appState.regionFilter);
  }
  
  // Science filter
  if (appState.scienceFilter === '◎') {
    list = list.filter(u => u.lifeSci.includes('◎'));
  } else if (appState.scienceFilter === '○') {
    list = list.filter(u => u.lifeSci.includes('◎') || u.lifeSci.includes('○'));
  }
  
  // Search filter
  const searchVal = document.getElementById('uniSearch')?.value?.toLowerCase() || '';
  if (searchVal) {
    list = list.filter(u => u.name.toLowerCase().includes(searchVal) || u.note.toLowerCase().includes(searchVal));
  }
  
  return list;
}

function filterUniversities() {
  renderUniversities();
}

// Filter chip handlers
document.addEventListener('DOMContentLoaded', () => {
  // Region filter
  document.getElementById('regionFilter')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#regionFilter .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    appState.regionFilter = chip.dataset.value;
    renderUniversities();
  });
  
  // Science filter
  document.getElementById('scienceFilter')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#scienceFilter .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    appState.scienceFilter = chip.dataset.value;
    renderUniversities();
  });
  
  // Chapter filter
  document.getElementById('chapterFilter')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#chapterFilter .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    appState.chapterFilter = chip.dataset.value;
    renderQuestions();
  });
  
  // Type filter
  document.getElementById('typeFilter')?.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#typeFilter .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    appState.typeFilter = chip.dataset.value;
    renderQuestions();
  });
});

// University Modal
function openUniModal(uniId) {
  const u = UNIVERSITIES.find(x => x.id === uniId);
  if (!u) return;
  
  const content = document.getElementById('uniModalContent');
  content.innerHTML = `
    <div class="um-header">
      <div class="um-uni-name">${u.name}</div>
      <div class="um-region"><i class="fas fa-map-marker-alt"></i> ${u.region}</div>
    </div>
    
    <div class="um-subjects-grid">
      <div class="um-subject">
        <div class="um-subject-label">生命科学</div>
        <div class="um-subject-value">${getBadgeChar(u.lifeSci)}</div>
        ${u.lifeSci.includes('(') ? `<div style="font-size:0.75rem;color:var(--gold-dark);margin-top:0.25rem;">${u.lifeSci}</div>` : ''}
      </div>
      <div class="um-subject">
        <div class="um-subject-label">物理/化学</div>
        <div class="um-subject-value" style="font-size:1rem;">${u.physics}</div>
      </div>
      <div class="um-subject">
        <div class="um-subject-label">統計/数学</div>
        <div class="um-subject-value">${getBadgeChar(u.math)}</div>
      </div>
    </div>
    
    <div class="um-note-box">
      <div class="um-note-label"><i class="fas fa-lightbulb"></i> 試験特徴・対策ポイント</div>
      <div class="um-note-text">${u.note}</div>
    </div>
    
    <div style="background:var(--beige);border-radius:var(--radius-md);padding:1rem;border:1px solid var(--border);">
      <p style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.5rem;"><i class="fas fa-info-circle"></i> 配点凡例</p>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
        <span style="font-size:0.78rem;"><strong>◎</strong> = 重点科目</span>
        <span style="font-size:0.78rem;"><strong>○</strong> = 出題あり</span>
        <span style="font-size:0.78rem;"><strong>△</strong> = 一部出題</span>
        <span style="font-size:0.78rem;"><strong>×</strong> = 出題なし</span>
      </div>
    </div>
  `;
  
  document.getElementById('uniModal').classList.add('open');
}

function getBadgeChar(val) {
  if (!val) return '-';
  if (val.includes('◎')) return '◎';
  if (val.includes('○')) return '○';
  if (val.includes('△')) return '△';
  if (val.includes('×')) return '×';
  return val;
}

function closeUniModal(e) {
  if (!e || e.target === document.getElementById('uniModal')) {
    document.getElementById('uniModal').classList.remove('open');
  }
}

// ===== QUESTIONS TAB (PAYWALL) =====
function canViewQuestion(questionIndex) {
  // 0-indexed: question at position 0 is always free
  if (appState.isPremium) return true;
  if (appState.isDemoUnlocked) return true;
  
  const questionId = getFilteredQuestions()[questionIndex]?.id;
  if (!questionId) return false;
  
  // Check if this specific question was the free one viewed
  const viewedFreeIds = Object.keys(appState.progress).filter(k => appState.progress[k] === 'free_viewed');
  
  // First question in the filtered list is always viewable
  if (questionIndex === 0) return true;
  
  // If user has viewed less than 1 question for free, allow
  if (appState.freeViewCount === 0) return true;
  
  return false;
}

function getFilteredQuestions() {
  let list = [...QUESTIONS];
  
  if (appState.chapterFilter !== 'all') {
    list = list.filter(q => q.chapter === appState.chapterFilter);
  }
  
  if (appState.typeFilter !== 'all') {
    list = list.filter(q => q.type === appState.typeFilter);
  }
  
  return list;
}

function renderQuestions() {
  const container = document.getElementById('questionsList');
  const filtered = getFilteredQuestions();
  const freeRemaining = Math.max(0, 1 - appState.freeViewCount);
  
  // Update badge
  const freeEl = document.getElementById('freeRemaining');
  if (freeEl) freeEl.textContent = appState.isPremium || appState.isDemoUnlocked ? '∞' : freeRemaining;
  
  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">条件に一致する問題が見つかりません。</div>';
    return;
  }
  
  container.innerHTML = filtered.map((q, i) => {
    const isLocked = !appState.isPremium && !appState.isDemoUnlocked && i > 0 && appState.freeViewCount >= 1;
    const progressKey = appState.progress[q.id];
    const isCorrect = progressKey === 'correct';
    const isWrong = progressKey === 'wrong';
    
    return `
      <div class="question-card ${isLocked ? 'locked' : ''}" id="qcard-${q.id}">
        <div class="question-card-header" onclick="${isLocked ? `handleLockedClick('${q.id}')` : `toggleQuestion('${q.id}')`}">
          <div class="question-number-badge badge-${q.type}">
            ${q.type === 'QUIZ' ? '<i class="fas fa-question"></i>' : q.type === 'DRILL' ? '<i class="fas fa-tools"></i>' : '<i class="fas fa-dumbbell"></i>'}
          </div>
          <div class="question-meta">
            <div class="question-type-row">
              <span class="q-type-tag q-type-${q.type}">${q.type}</span>
              <span class="q-chapter-tag">${q.chapter}</span>
              ${isCorrect ? '<span style="color:var(--success);font-size:0.75rem;"><i class="fas fa-check-circle"></i> 正解済</span>' : ''}
              ${isWrong ? '<span style="color:var(--danger);font-size:0.75rem;"><i class="fas fa-times-circle"></i> 要復習</span>' : ''}
            </div>
            <div class="question-text-preview ${isLocked ? 'locked-blur' : ''}">
              ${q.question_text.length > 80 ? q.question_text.substring(0, 80) + '...' : q.question_text}
            </div>
          </div>
          <div class="question-actions" style="${isLocked ? 'pointer-events:none;' : ''}">
            ${!isLocked ? `
              <button class="btn-view-answer" onclick="event.stopPropagation();toggleAnswer('${q.id}')">
                <i class="fas fa-eye"></i> 解答
              </button>
            ` : '<i class="fas fa-lock" style="color:var(--gold);font-size:1.1rem;"></i>'}
          </div>
        </div>
        
        <div class="question-answer-box" id="answer-${q.id}">
          ${q.options ? `<div style="margin-bottom:0.75rem;"><div class="answer-label" style="color:var(--info);"><i class="fas fa-list-ul"></i> 選択肢</div><div class="answer-text" style="font-size:0.83rem;color:var(--text-secondary);">${q.options.split('/').map(o => `<div>• ${o.trim()}</div>`).join('')}</div></div>` : ''}
          ${q.sub_questions ? `<div style="margin-bottom:0.75rem;"><div class="answer-label" style="color:var(--info);"><i class="fas fa-list-ol"></i> 小問</div><div class="answer-text" style="font-size:0.83rem;">${q.sub_questions}</div></div>` : ''}
          <div class="answer-label"><i class="fas fa-check-circle"></i> 解答</div>
          <div class="answer-text">${q.answer}</div>
          ${q.answer_detail ? `<div class="answer-detail"><i class="fas fa-info-circle"></i> ${q.answer_detail}</div>` : ''}
          <div style="display:flex;gap:0.75rem;margin-top:1rem;">
            <button class="btn-mark-correct ${isCorrect ? 'active-btn' : ''}" onclick="markQuestion('${q.id}','correct')" style="${isCorrect ? 'background:var(--success);color:white;' : ''}">
              <i class="fas fa-check"></i> 正解
            </button>
            <button class="btn-mark-wrong ${isWrong ? 'active-btn' : ''}" onclick="markQuestion('${q.id}','wrong')" style="${isWrong ? 'background:var(--danger);color:white;' : ''}">
              <i class="fas fa-times"></i> 不正解
            </button>
          </div>
        </div>
        
        ${isLocked ? `
          <div class="paywall-overlay">
            <div class="paywall-icon"><i class="fas fa-lock"></i></div>
            <p class="paywall-text">プレミアム限定コンテンツ</p>
            <p style="font-size:0.78rem;color:var(--text-secondary);">残り${filtered.length - 1}問 + 詳細解説が閲覧可能</p>
            <button class="btn-paywall-unlock" onclick="openPremiumModal()">
              <i class="fas fa-crown"></i> ¥30,000でアンロック
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function handleLockedClick(questionId) {
  openPremiumModal();
}

function toggleQuestion(questionId) {
  // Mark free view
  const filtered = getFilteredQuestions();
  const idx = filtered.findIndex(q => q.id === questionId);
  
  if (!appState.isPremium && !appState.isDemoUnlocked && idx > 0) {
    // Check paywall
    if (appState.freeViewCount >= 1) {
      openPremiumModal();
      return;
    }
  }
  
  // First question - mark as free viewed
  if (idx === 0 && !appState.isPremium && !appState.isDemoUnlocked) {
    if (appState.freeViewCount === 0) {
      appState.freeViewCount = 1;
      saveState();
      const freeEl = document.getElementById('freeRemaining');
      if (freeEl) freeEl.textContent = '0';
    }
  }
  
  // Toggle answer
  const answerBox = document.getElementById(`answer-${questionId}`);
  if (answerBox) {
    const isOpen = answerBox.classList.contains('open');
    answerBox.classList.toggle('open', !isOpen);
  }
  
  recordStudyActivity();
}

function toggleAnswer(questionId) {
  const answerBox = document.getElementById(`answer-${questionId}`);
  if (answerBox) {
    answerBox.classList.toggle('open');
  }
  recordStudyActivity();
}

function markQuestion(questionId, status) {
  appState.progress[questionId] = status;
  saveState();
  renderQuestions();
  renderDashboard();
  showToast(status === 'correct' ? '✅ 正解として記録しました' : '❌ 要復習として記録しました');
  recordStudyActivity();
}

function toggleDemoUnlock() {
  appState.isDemoUnlocked = !appState.isDemoUnlocked;
  const btn = document.getElementById('btnDemoUnlock');
  if (btn) btn.classList.toggle('active', appState.isDemoUnlocked);
  renderQuestions();
  showToast(appState.isDemoUnlocked ? '🔓 デモモード: 全問閲覧可能になりました' : '🔒 デモモード解除');
}

// ===== PREMIUM MODAL =====
function openPremiumModal() {
  document.getElementById('premiumModal').classList.add('open');
}

function closePremiumModal(e) {
  if (!e || e.target === document.getElementById('premiumModal')) {
    document.getElementById('premiumModal').classList.remove('open');
  }
}

function simulateStripeCheckout() {
  document.getElementById('premiumModal').classList.remove('open');
  document.getElementById('stripeModal').classList.add('open');
}

function closeStripeModal(e) {
  if (!e || e.target === document.getElementById('stripeModal')) {
    document.getElementById('stripeModal').classList.remove('open');
  }
}

function completePurchase() {
  // Simulate successful payment
  appState.isPremium = true;
  appState.isDemoUnlocked = false;
  saveState();
  
  document.getElementById('stripeModal').classList.remove('open');
  
  // Show success animation
  showPremiumSuccess();
  updatePremiumUI();
  renderQuestions();
}

function showPremiumSuccess() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(27,42,74,0.85);
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    z-index:9999;animation:fadeIn 0.3s ease;
  `;
  overlay.innerHTML = `
    <div style="text-align:center;color:white;animation:slideUp 0.4s ease;">
      <div style="font-size:5rem;margin-bottom:1rem;">👑</div>
      <h2 style="font-family:'Noto Serif JP',serif;font-size:2rem;margin-bottom:0.5rem;">プレミアム会員になりました！</h2>
      <p style="opacity:0.8;margin-bottom:1.5rem;">全38問と大学データベースが解放されました</p>
      <div style="font-size:2rem;">🎉</div>
    </div>
  `;
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.5s';
    setTimeout(() => overlay.remove(), 500);
  }, 2500);
  
  showToast('👑 プレミアム会員になりました！全コンテンツが解放されました');
}

function updatePremiumUI() {
  const badge = document.getElementById('premiumBadge');
  const upgradeBtn = document.getElementById('btnUpgradeHeader');
  const statusIcon = document.getElementById('statusIcon');
  const statusValue = document.getElementById('statusValue');
  const statusCard = document.getElementById('premiumStatusCard');
  
  if (appState.isPremium) {
    if (badge) {
      badge.innerHTML = '<i class="fas fa-crown"></i><span>プレミアム</span>';
      badge.classList.add('is-premium');
    }
    if (upgradeBtn) upgradeBtn.style.display = 'none';
    if (statusIcon) { statusIcon.className = 'fas fa-crown'; statusIcon.style.color = 'var(--gold)'; }
    if (statusValue) statusValue.textContent = 'プレミアム会員';
    if (statusCard) statusCard.classList.add('is-premium');
  } else {
    if (badge) {
      badge.innerHTML = '<i class="fas fa-lock"></i><span>無料プラン</span>';
      badge.classList.remove('is-premium');
    }
    if (upgradeBtn) upgradeBtn.style.display = 'flex';
    if (statusIcon) { statusIcon.className = 'fas fa-lock'; statusIcon.style.color = ''; }
    if (statusValue) statusValue.textContent = '無料プラン';
    if (statusCard) statusCard.classList.remove('is-premium');
  }
  
  // Update upgrade button visibility
  const upgradeSmBtn = document.querySelector('.btn-upgrade-sm');
  if (upgradeSmBtn) {
    upgradeSmBtn.style.display = appState.isPremium ? 'none' : 'flex';
  }
}

// ===== QUESTION MODAL =====
function openQuestionModal(questionId) {
  const q = QUESTIONS.find(x => x.id === questionId);
  if (!q) return;
  
  const content = document.getElementById('questionModalContent');
  content.innerHTML = `
    <div class="qm-header">
      <span class="qm-id">${q.id}</span>
      <span class="q-type-tag q-type-${q.type}">${q.type}</span>
      <span class="qm-chapter">${q.chapter}</span>
    </div>
    
    <div class="qm-question">${q.question_text}</div>
    
    ${q.sub_questions ? `
      <div class="qm-sub-questions">
        <div style="font-size:0.75rem;font-weight:700;color:var(--navy);margin-bottom:0.5rem;"><i class="fas fa-list-ol"></i> 小問</div>
        <div style="white-space:pre-wrap;">${q.sub_questions}</div>
      </div>
    ` : ''}
    
    ${q.options ? `
      <div class="qm-options">
        <div style="font-size:0.75rem;font-weight:700;color:var(--navy);margin-bottom:0.5rem;"><i class="fas fa-list-ul"></i> 選択肢</div>
        <div>${q.options.split('/').map(o => `<div style="padding:0.2rem 0;">• ${o.trim()}</div>`).join('')}</div>
      </div>
    ` : ''}
    
    <button class="btn-show-answer" onclick="toggleQMAnswer()">
      <i class="fas fa-eye"></i> 解答を表示
    </button>
    
    <div class="qm-answer-box" id="qmAnswerBox">
      <div class="qm-answer-label"><i class="fas fa-check-circle"></i> 解答</div>
      <div class="qm-answer-text">${q.answer}</div>
      ${q.answer_detail ? `<div class="qm-answer-detail">${q.answer_detail}</div>` : ''}
    </div>
    
    <div class="qm-mark-btns" style="margin-top:1rem;">
      <button class="btn-mark-c" onclick="markQuestion('${q.id}','correct');closeQuestionModal()">
        <i class="fas fa-check"></i> 正解
      </button>
      <button class="btn-mark-w" onclick="markQuestion('${q.id}','wrong');closeQuestionModal()">
        <i class="fas fa-times"></i> 不正解
      </button>
    </div>
  `;
  
  document.getElementById('questionModal').classList.add('open');
}

function toggleQMAnswer() {
  const box = document.getElementById('qmAnswerBox');
  const btn = document.querySelector('.btn-show-answer');
  if (box) {
    box.classList.toggle('show');
    if (btn) {
      btn.innerHTML = box.classList.contains('show') 
        ? '<i class="fas fa-eye-slash"></i> 解答を隠す'
        : '<i class="fas fa-eye"></i> 解答を表示';
    }
  }
}

function closeQuestionModal(e) {
  if (!e || e.target === document.getElementById('questionModal')) {
    document.getElementById('questionModal').classList.remove('open');
  }
}

// ===== SCHEDULE / CALENDAR TAB =====
function renderCalendar() {
  if (appState.calendarView === 'grid') {
    renderCalendarGrid();
  } else {
    renderScheduleList();
  }
  
  // Update month title
  const d = appState.calendarMonth;
  document.getElementById('monthTitle').textContent = 
    `${d.getFullYear()}年 ${d.getMonth() + 1}月`;
}

function changeMonth(delta) {
  const d = appState.calendarMonth;
  appState.calendarMonth = new Date(d.getFullYear(), d.getMonth() + delta, 1);
  renderCalendar();
}

function setCalendarView(view) {
  appState.calendarView = view;
  
  document.getElementById('viewGrid').classList.toggle('active', view === 'grid');
  document.getElementById('viewList').classList.toggle('active', view === 'list');
  
  const gridEl = document.getElementById('calendarView');
  const listEl = document.getElementById('listView');
  
  if (view === 'grid') {
    gridEl.style.display = '';
    listEl.className = 'schedule-list-view hidden';
  } else {
    gridEl.style.display = 'none';
    listEl.className = 'schedule-list-view visible';
  }
  
  renderCalendar();
}

function renderCalendarGrid() {
  const calEl = document.getElementById('calendarView');
  const year = appState.calendarMonth.getFullYear();
  const month = appState.calendarMonth.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  
  // Build events map
  const events = buildEventsMap(year, month);
  
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  
  let html = `
    <div class="cal-header-row">
      ${days.map(d => `<div class="cal-day-header">${d}</div>`).join('')}
    </div>
    <div class="cal-body">
  `;
  
  // Leading empty cells
  for (let i = 0; i < firstDay; i++) {
    const prevDay = new Date(year, month, -firstDay + i + 1);
    html += `<div class="cal-cell other-month"><div class="cal-date">${prevDay.getDate()}</div></div>`;
  }
  
  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dayEvents = events[dateStr] || [];
    
    html += `
      <div class="cal-cell">
        <div class="cal-date ${isToday ? 'today' : ''}">${day}</div>
        ${dayEvents.slice(0, 3).map(ev => `
          <div class="cal-event ${ev.type}" title="${ev.uni}">
            ${ev.uni.replace(/大学/, '').replace(/医科/, '').substring(0, 4)}
          </div>
        `).join('')}
        ${dayEvents.length > 3 ? `<div style="font-size:0.65rem;color:var(--text-muted);">+${dayEvents.length - 3}</div>` : ''}
      </div>
    `;
  }
  
  // Trailing cells
  const totalCells = firstDay + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="cal-cell other-month"><div class="cal-date">${i}</div></div>`;
  }
  
  html += '</div>';
  calEl.innerHTML = html;
}

function buildEventsMap(year, month) {
  const events = {};
  
  SCHEDULE_DATA.forEach(s => {
    // Application period
    addRangeEvents(events, s.appStart, s.appEnd, s.uni, 'app', year, month);
    
    // Exam 1
    addDayEvent(events, s.exam1, s.uni, 'exam1', year, month);
    
    // Exam 2
    addDayEvent(events, s.exam2, s.uni, 'exam2', year, month);
  });
  
  return events;
}

function addRangeEvents(events, startStr, endStr, uni, type, year, month) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const cur = new Date(start);
  
  while (cur <= end) {
    if (cur.getFullYear() === year && cur.getMonth() === month) {
      const key = cur.toISOString().split('T')[0];
      if (!events[key]) events[key] = [];
      events[key].push({ uni, type });
    }
    cur.setDate(cur.getDate() + 1);
  }
}

function addDayEvent(events, dateStr, uni, type, year, month) {
  if (!dateStr) return;
  const d = new Date(dateStr);
  if (d.getFullYear() === year && d.getMonth() === month) {
    if (!events[dateStr]) events[dateStr] = [];
    events[dateStr].push({ uni, type });
  }
}

function renderScheduleList() {
  const listEl = document.getElementById('listView');
  
  // Build all events
  const allEvents = [];
  
  SCHEDULE_DATA.forEach(s => {
    allEvents.push({ date: new Date(s.appStart), dateEnd: new Date(s.appEnd), uni: s.uni, type: 'app', label: '出願開始' });
    allEvents.push({ date: new Date(s.appEnd), uni: s.uni, type: 'app', label: '出願締切' });
    if (s.exam1) allEvents.push({ date: new Date(s.exam1), uni: s.uni, type: 'exam1', label: '1次試験' });
    if (s.exam2) allEvents.push({ date: new Date(s.exam2), uni: s.uni, type: 'exam2', label: '2次試験' });
  });
  
  // Sort by date
  allEvents.sort((a, b) => a.date - b.date);
  
  const typeLabels = { app: '出願', exam1: '1次試験', exam2: '2次試験' };
  const typeClasses = { app: 'event-app', exam1: 'event-exam1', exam2: 'event-exam2' };
  
  listEl.innerHTML = allEvents.map(ev => `
    <div class="schedule-item">
      <div class="schedule-date-box">
        <div class="schedule-date-month">${ev.date.getMonth() + 1}月</div>
        <div class="schedule-date-day">${ev.date.getDate()}</div>
      </div>
      <span class="schedule-event-type ${typeClasses[ev.type]}">${typeLabels[ev.type]}</span>
      <span class="schedule-uni-name">${ev.uni}</span>
      <span style="margin-left:auto;font-size:0.78rem;color:var(--text-muted);">${ev.label}</span>
    </div>
  `).join('');
}

// ===== DASHBOARD =====
function renderDashboard() {
  const total = QUESTIONS.length;
  const answered = Object.keys(appState.progress).filter(k => appState.progress[k] !== 'free_viewed').length;
  const correct = Object.values(appState.progress).filter(v => v === 'correct').length;
  const wrong = Object.values(appState.progress).filter(v => v === 'wrong').length;
  const rate = answered > 0 ? Math.round((correct / answered) * 100) : null;
  
  // Update stats
  document.getElementById('statCorrect').textContent = correct;
  document.getElementById('statWrong').textContent = wrong;
  document.getElementById('statRate').textContent = rate !== null ? `${rate}%` : '-';
  document.getElementById('statStreak').textContent = appState.streak;
  
  // Chapter progress
  const chapters = [...new Set(QUESTIONS.map(q => q.chapter))];
  const chapterProgressEl = document.getElementById('chapterProgress');
  
  chapterProgressEl.innerHTML = chapters.map(ch => {
    const chQuestions = QUESTIONS.filter(q => q.chapter === ch);
    const chCorrect = chQuestions.filter(q => appState.progress[q.id] === 'correct').length;
    const chAnswered = chQuestions.filter(q => appState.progress[q.id] === 'correct' || appState.progress[q.id] === 'wrong').length;
    const pct = chAnswered > 0 ? Math.round((chCorrect / chAnswered) * 100) : 0;
    const shortChapter = ch.replace('第', 'L').replace('講 ', ':').replace('〜4講', '-4');
    
    return `
      <div class="progress-bar-row">
        <span class="progress-bar-label" title="${ch}">${ch.length > 15 ? ch.substring(0, 15) + '...' : ch}</span>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width:${pct}%"></div>
        </div>
        <span class="progress-bar-pct">${pct}%</span>
      </div>
    `;
  }).join('');
  
  // Weak list
  const weakList = document.getElementById('weakList');
  const weakQuestions = QUESTIONS.filter(q => appState.progress[q.id] === 'wrong');
  
  if (weakQuestions.length === 0) {
    weakList.innerHTML = '<p class="empty-state">まだ不正解の問題がありません。過去問タブで問題を解いてみましょう。</p>';
  } else {
    weakList.innerHTML = weakQuestions.map(q => `
      <div class="weak-card" onclick="switchTab('questions')">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem;">
          <span class="q-type-tag q-type-${q.type}">${q.type}</span>
          <span style="font-size:0.72rem;color:var(--text-muted);">${q.chapter}</span>
        </div>
        <div>${q.question_text.length > 60 ? q.question_text.substring(0, 60) + '...' : q.question_text}</div>
      </div>
    `).join('');
  }
  
  // Charts
  renderCharts(chapters);
}

let chapterChartInst = null;
let typeChartInst = null;

function renderCharts(chapters) {
  // Chapter chart
  const chapterData = chapters.map(ch => {
    const chQuestions = QUESTIONS.filter(q => q.chapter === ch);
    const chCorrect = chQuestions.filter(q => appState.progress[q.id] === 'correct').length;
    const chAnswered = chQuestions.filter(q => appState.progress[q.id] === 'correct' || appState.progress[q.id] === 'wrong').length;
    return chAnswered > 0 ? Math.round((chCorrect / chAnswered) * 100) : 0;
  });
  
  const chapterLabels = chapters.map(c => c.replace('第', 'L').replace('講', '').trim().substring(0, 12));
  
  const ctxBar = document.getElementById('chapterChart');
  if (ctxBar) {
    if (chapterChartInst) chapterChartInst.destroy();
    chapterChartInst = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: chapterLabels,
        datasets: [{
          label: '正答率 (%)',
          data: chapterData,
          backgroundColor: ['rgba(27,42,74,0.8)', 'rgba(200,169,81,0.8)', 'rgba(56,161,105,0.8)'],
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: v => v + '%', font: { size: 11 } },
            grid: { color: 'rgba(0,0,0,0.06)' }
          },
          x: { ticks: { font: { size: 10 } }, grid: { display: false } }
        }
      }
    });
  }
  
  // Type chart
  const types = ['QUIZ', 'DRILL', 'EXERCISE'];
  const typeData = types.map(type => {
    return QUESTIONS.filter(q => q.type === type).length;
  });
  
  const typeAnswered = types.map(type => {
    return QUESTIONS.filter(q => q.type === type && (appState.progress[q.id] === 'correct' || appState.progress[q.id] === 'wrong')).length;
  });
  
  const ctxPie = document.getElementById('typeChart');
  if (ctxPie) {
    if (typeChartInst) typeChartInst.destroy();
    typeChartInst = new Chart(ctxPie, {
      type: 'doughnut',
      data: {
        labels: types,
        datasets: [{
          data: typeData,
          backgroundColor: ['rgba(49,130,206,0.85)', 'rgba(56,161,105,0.85)', 'rgba(217,119,6,0.85)'],
          borderWidth: 3,
          borderColor: '#fff',
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 11 }, padding: 16 }
          }
        }
      }
    });
  }
}

function resetProgress() {
  if (confirm('学習進捗をリセットしますか？この操作は取り消せません。')) {
    appState.progress = {};
    appState.streak = 0;
    appState.lastStudyDate = null;
    saveState();
    renderDashboard();
    renderQuestions();
    showToast('🔄 学習進捗をリセットしました');
  }
}

// ===== SETTINGS =====
function setTheme(theme) {
  appState.theme = theme;
  saveState();
  
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('themeDark').classList.add('active');
    document.getElementById('themeLight').classList.remove('active');
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.getElementById('themeLight').classList.add('active');
    document.getElementById('themeDark').classList.remove('active');
  }
  
  showToast(theme === 'dark' ? '🌙 ダークモードに切り替えました' : '☀️ ライトモードに切り替えました');
}

function exportProgress() {
  const data = {
    exportDate: new Date().toLocaleString('ja-JP'),
    isPremium: appState.isPremium,
    streak: appState.streak,
    progress: Object.entries(appState.progress).map(([id, status]) => {
      const q = QUESTIONS.find(q => q.id === id);
      return {
        id,
        chapter: q?.chapter || '',
        type: q?.type || '',
        status,
        question: q?.question_text?.substring(0, 50) || ''
      };
    }),
    stats: {
      total: QUESTIONS.length,
      answered: Object.keys(appState.progress).length,
      correct: Object.values(appState.progress).filter(v => v === 'correct').length,
      wrong: Object.values(appState.progress).filter(v => v === 'wrong').length
    }
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `medtransfer_progress_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📥 学習データをエクスポートしました');
}

function toggleUserMenu() {
  showToast('👤 Supabase Authと連携してログイン機能を実装します');
}

// ===== TOAST =====
function showToast(message) {
  const toast = document.getElementById('toast');
  const msg = document.getElementById('toastMsg');
  
  if (msg) msg.textContent = message;
  toast.classList.add('show');
  
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  }
});
