import {
  createSession,
  goToQuestion,
  scoreSession,
  selectAnswer
} from "./quiz.js";
import { buildWrongAnswerReview } from "./review.js";
import { createQuizStorage } from "./storage.js";

// ── Cute Reaction System 💖 ──────────────────────────────────────────────────
const CORRECT_MESSAGES = [
  { emoji: "💖", text: "Trời ơi đúng luôn, cưng quá vậy trời." },
  { emoji: "🌷", text: "Đúng đẹp luôn nha, nhìn cái là biết người thông minh." },
  { emoji: "✨", text: "Ui xịn quá, trả lời mà mượt như rót mật vào tai." },
  { emoji: "🍓", text: "Bé làm câu này ngọt quá, muốn thưởng hoa điểm mười." },
  { emoji: "🫶", text: "Đúng rồi đó, giỏi kiểu này ai chịu nổi." },
  { emoji: "🌟", text: "Chuẩn không cần chỉnh, đúng là cục cưng của môn này." },
  { emoji: "🎀", text: "Xinh xắn mà còn đúng nữa, khó ai đỡ nổi bé." },
  { emoji: "🍬", text: "Ngọt như kẹo luôn, đáp án này bé chốt quá chuẩn." },
  { emoji: "🥰", text: "Đúng rồi nha, thương cái cách bé học ghê." },
  { emoji: "💫", text: "Câu này bé xử mượt quá, nhìn phát thấy cưng liền." },
];

const WRONG_MESSAGES = [
  { emoji: "🫠", text: "Sai dữ thần luôn, đáp án đi lạc không mang theo não hả trời." },
  { emoji: "💀", text: "Câu này chọn kiểu gì nghe như kiến thức trượt chân ngã cầu thang." },
  { emoji: "🤡", text: "Ủa alo, chọn đáp án này là đang diễn hài đúng không." },
  { emoji: "🥴", text: "Sai mạnh bạo ghê, kiến thức chắc vừa đi uống trà sữa chưa về." },
  { emoji: "🪦", text: "Cú chọn này chôn luôn sự tự tin của câu hỏi." },
  { emoji: "🐔", text: "Đọc câu hỏi thì ít, lao vào chọn như gà mổ bàn phím thì nhiều." },
  { emoji: "🌪️", text: "Sai xoáy như lốc, đáp án đúng nhìn bé chắc cũng muốn khóc." },
  { emoji: "🫵", text: "Bắt được một bé chọn bừa rồi nha, khai mau." },
  { emoji: "🚑", text: "Kiến thức câu này đang cần xe cấp cứu gấp." },
  { emoji: "🧨", text: "Nổ to thật, nhưng tiếc là nổ sai đáp án." },
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function showReactionToast(isCorrect) {
  const old = document.getElementById("reaction-toast");
  if (old) old.remove();
  const msg = isCorrect ? randomItem(CORRECT_MESSAGES) : randomItem(WRONG_MESSAGES);
  const toast = document.createElement("div");
  toast.id = "reaction-toast";
  toast.className = isCorrect
    ? "reaction-toast reaction-toast--correct"
    : "reaction-toast reaction-toast--wrong";
  toast.innerHTML = `<span class="toast-emoji">${msg.emoji}</span><span class="toast-text">${msg.text}</span>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("reaction-toast--show"));
  setTimeout(() => {
    toast.classList.remove("reaction-toast--show");
    setTimeout(() => toast.remove(), 400);
  }, 2600);
}

function launchConfetti() {
  const colors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6", "#a855f7"];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    el.style.cssText = [
      `left:${Math.random() * 100}vw`,
      `background:${colors[Math.floor(Math.random() * colors.length)]}`,
      `animation-duration:${0.9 + Math.random() * 1.2}s`,
      `animation-delay:${Math.random() * 0.4}s`,
      `width:${6 + Math.random() * 8}px`,
      `height:${6 + Math.random() * 8}px`,
      `border-radius:${Math.random() > 0.5 ? "50%" : "2px"}`,
    ].join(";");
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }
}

function shakeCard() {
  const card = document.querySelector(".question-card");
  if (!card) return;
  card.classList.remove("shake-anim");
  void card.offsetWidth;
  card.classList.add("shake-anim");
  setTimeout(() => card.classList.remove("shake-anim"), 600);
}

function getResultEvaluation(percent) {
  if (percent === 100) return {
    emoji: "🏆", grade: "Hoàn Hảo Luôn!",
    msg: "Ôi trời! Bé đạt 100 điểm rồi!! Tự hào về bé lắm luôn~ Bé là thiên tài ôn bài đó! 🥰",
  };
  if (percent >= 90) return {
    emoji: "🌟", grade: "Xuất Sắc!",
    msg: "Bé giỏi quá trời! Trả lời đúng gần hết rồi đó. Anh hãnh diện về bé lắm~ 💖",
  };
  if (percent >= 75) return {
    emoji: "🎉", grade: "Rất Tốt Bé ơi!",
    msg: "Bé học giỏi lắm rồi! Cố thêm một chút xíu nữa là điểm cao thôi~",
  };
  if (percent >= 60) return {
    emoji: "💪", grade: "Khá Đấy Bé!",
    msg: "Được rồi nhỉ! Tuy nhiên còn mấy câu cần ôn thêm. Bé ôn lại phần sai rồi thử lại nhé~",
  };
  if (percent >= 40) return {
    emoji: "🌱", grade: "Cần Cố Thêm!",
    msg: "Hmm bé ơi, hôm nay chưa tập trung lắm hả? Thử lại một lần nữa nhé, bé làm được mà! 🤗",
  };
  return {
    emoji: "🫂", grade: "Cùng Ôn Lại Nào!",
    msg: "Không sao đâu bé ơi! Lần đầu ai cũng vậy thôi. Bé ôn lại rồi làm lại nhé. Anh tin bé làm được! 💕",
  };
}
// ── Kết thúc Reaction System ─────────────────────────────────────────────────

// ── Keyword Highlight & Clinical Detection ───────────────────────────────────
const DANGER_KEYWORDS = [
  "không", "ngoại trừ", "không phải", "không đúng", "không có",
  "không gặp", "không xảy ra", "sai", "không bao giờ", "trừ", "không thuộc"
];

function highlightKeywords(text) {
  let result = escapeHtml(text);
  // Sort longest first so "không phải" matches before "không"
  const sorted = [...DANGER_KEYWORDS].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(
    `(${sorted.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi'
  );
  result = result.replace(pattern, '<mark class="keyword-danger">$1</mark>');
  return result;
}

function isClinicalQuestion(questionText) {
  const clinicalPrefixes = [
    "bệnh nhân", "bệnh nhi", "người bệnh", "nb nam", "nb nữ", "bn nam", "bn nữ",
    "anh ", "chị ", "cháu ", "em bé"
  ];
  const lower = questionText.toLowerCase();
  return clinicalPrefixes.some(p => lower.startsWith(p) || lower.includes(p));
}
// ── Kết thúc Keyword Highlight ───────────────────────────────────────────────

// ── Stats / History tracking ─────────────────────────────────────────────────
function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function updateStudyHistory(stats, summary, totalInSession) {
  const today = getTodayStr();
  const newHistory = [...(stats.history || [])];

  newHistory.push({
    date: today,
    correct: summary.correctCount,
    total: totalInSession,
    percent: totalInSession > 0 ? Math.round((summary.correctCount / totalInSession) * 100) : 0
  });

  // Keep only last 10 sessions
  if (newHistory.length > 10) newHistory.splice(0, newHistory.length - 10);

  // Update wrong frequency
  const wrongFreq = { ...(stats.wrongFrequency || {}) };
  for (const w of summary.wrongAnswers) {
    wrongFreq[w.id] = (wrongFreq[w.id] || 0) + 1;
  }

  // Calculate streak
  const lastDate = stats.lastStudyDate;
  let streak = stats.streak || 0;
  if (lastDate === today) {
    // already counted today
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    if (lastDate === yesterdayStr) {
      streak += 1;
    } else {
      streak = 1;
    }
  }

  return {
    history: newHistory,
    wrongFrequency: wrongFreq,
    streak,
    lastStudyDate: today
  };
}

function getTopWrongQuestions(wrongFreq, questionsById, limit = 5) {
  return Object.entries(wrongFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([id, count]) => ({ id: Number(id), count, question: questionsById.get(Number(id)) }))
    .filter(item => item.question);
}
// ── Kết thúc Stats ───────────────────────────────────────────────────────────

const app = document.querySelector("#app");
const STORAGE_KEY = "htbt-quiz-app-state";
const STATS_KEY = "htbt-quiz-app-stats";
const storage = createQuizStorage(window.localStorage, STORAGE_KEY);
const statsStorage = createQuizStorage(window.localStorage, STATS_KEY);

const state = {
  questions: [],
  questionsById: new Map(),
  loading: true,
  error: "",
  persisted: {
    version: 1,
    settings: {
      shuffleQuestions: true,
      immediateFeedback: false,
      customQuestionCount: "50"
    },
    session: null,
    lastResult: null,
    bookmarks: []
  },
  stats: {
    history: [],
    wrongFrequency: {},
    streak: 0,
    lastStudyDate: null
  }
};

// Track current view for keyboard handler
let currentView = "home"; // "home" | "quiz" | "results"
// Show/hide question map
let showQuestionMap = false;

document.addEventListener("click", handleClick);
document.addEventListener("change", handleChange);
document.addEventListener("keydown", handleKeydown);

init();

async function init() {
  hydratePersistedState();

  try {
    const response = await fetch("./data/questions.json");

    if (!response.ok) {
      throw new Error(`Khong the tai data/questions.json (${response.status})`);
    }

    const questions = await response.json();

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("data/questions.json khong co du lieu hop le.");
    }

    state.questions = questions;
    state.questionsById = new Map(questions.map((question) => [question.id, question]));
    sanitizePersistedSession();
  } catch (error) {
    state.error = buildLoadErrorMessage(error);
  } finally {
    state.loading = false;
    render();
  }
}

function hydratePersistedState() {
  const saved = storage.load();
  const savedStats = statsStorage.load();

  if (saved && typeof saved === "object") {
    state.persisted = {
      version: 1,
      settings: {
        shuffleQuestions: saved.settings?.shuffleQuestions ?? true,
        immediateFeedback: saved.settings?.immediateFeedback ?? false,
        customQuestionCount: saved.settings?.customQuestionCount ?? "50"
      },
      session: saved.session ?? null,
      lastResult: saved.lastResult ?? null,
      bookmarks: Array.isArray(saved.bookmarks) ? saved.bookmarks : []
    };
  }

  if (savedStats && typeof savedStats === "object") {
    state.stats = {
      history: Array.isArray(savedStats.history) ? savedStats.history : [],
      wrongFrequency: savedStats.wrongFrequency && typeof savedStats.wrongFrequency === "object"
        ? savedStats.wrongFrequency : {},
      streak: savedStats.streak || 0,
      lastStudyDate: savedStats.lastStudyDate || null
    };
  }
}

function sanitizePersistedSession() {
  const session = state.persisted.session;

  if (!session) return;

  const validOrder = Array.isArray(session.order)
    ? session.order.filter((id) => state.questionsById.has(id))
    : [];

  if (validOrder.length === 0) {
    state.persisted.session = null;
    persistState();
    return;
  }

  const safeAnswers = {};
  const rawAnswers = session.answers ?? {};
  const safeFeedback = {};

  for (const id of validOrder) {
    const savedAnswer = rawAnswers[id];

    if (["A", "B", "C", "D"].includes(savedAnswer)) {
      safeAnswers[id] = savedAnswer;

      if (session.immediateFeedback) {
        const correctAnswer = state.questionsById.get(id)?.answer;

        if (correctAnswer) {
          safeFeedback[id] = {
            selected: savedAnswer,
            correct: correctAnswer,
            isCorrect: savedAnswer === correctAnswer
          };
        }
      }
    }
  }

  state.persisted.session = {
    order: validOrder,
    answers: safeAnswers,
    currentIndex: clampIndex(session.currentIndex ?? 0, validOrder.length),
    submitted: Boolean(session.submitted),
    mode: session.mode === "wrong-only" ? "wrong-only" : session.mode === "bookmark" ? "bookmark" : "all",
    immediateFeedback: Boolean(session.immediateFeedback),
    feedbackByQuestion: safeFeedback
  };
}

function buildLoadErrorMessage(error) {
  const protocolHint =
    window.location.protocol === "file:"
      ? "Ban can mo app bang local server, vi fetch data/questions.json se khong on dinh khi mo truc tiep file://."
      : "";

  return [error.message, protocolHint].filter(Boolean).join(" ");
}

function persistState() {
  storage.save(state.persisted);
}

function persistStats() {
  statsStorage.save(state.stats);
}

function render() {
  if (state.loading) {
    app.innerHTML = `
      <div class="status-block">
        <div class="loading-spinner"></div>
        <p>Đang tải dữ liệu câu hỏi...</p>
      </div>
    `;
    return;
  }

  if (state.error) {
    app.innerHTML = `
      <div class="error-state">
        <div class="warning-box">
          <strong>Không thể khởi tạo app.</strong>
          <p>${escapeHtml(state.error)}</p>
        </div>
      </div>
    `;
    return;
  }

  const session = state.persisted.session;

  if (!session) {
    renderHome();
    return;
  }

  if (!session.submitted) {
    renderQuiz(session);
    return;
  }

  renderResults(session);
}

// ── Home ─────────────────────────────────────────────────────────────────────
function renderHome() {
  currentView = "home";
  const session = state.persisted.session;
  const lastResult = state.persisted.lastResult;
  const wrongCount = lastResult?.wrongAnswers?.length ?? 0;
  const canContinue = Boolean(session && !session.submitted);
  const canReviewWrong = wrongCount > 0;
  const bookmarkCount = state.persisted.bookmarks.length;
  const answeredCount = session ? countAnswered(session) : 0;
  const customQuestionCount = state.persisted.settings.customQuestionCount;

  // Stats
  const { history, wrongFrequency, streak } = state.stats;
  const totalSessions = history.length;
  const avgPercent = totalSessions > 0
    ? Math.round(history.reduce((s, h) => s + h.percent, 0) / totalSessions)
    : null;

  const topWrong = getTopWrongQuestions(wrongFrequency, state.questionsById, 5);

  app.innerHTML = `
    <div class="home-grid">
      <section class="stats-grid">
        <article class="stat-card">
          <p class="stat-label">Tổng câu hỏi</p>
          <p class="stat-value">${state.questions.length}</p>
        </article>
        <article class="stat-card">
          <p class="stat-label">Tiến độ hiện tại</p>
          <p class="stat-value">${session && !session.submitted ? `${answeredCount}/${session.order.length}` : "Chưa có"}</p>
        </article>
        <article class="stat-card">
          <p class="stat-label">Câu sai gần nhất</p>
          <p class="stat-value">${canReviewWrong ? wrongCount : "0"}</p>
        </article>
        <article class="stat-card stat-card--streak">
          <p class="stat-label">🔥 Streak</p>
          <p class="stat-value">${streak} ngày</p>
        </article>
        <article class="stat-card">
          <p class="stat-label">Tỷ lệ đúng TB</p>
          <p class="stat-value">${avgPercent !== null ? `${avgPercent}%` : "—"}</p>
        </article>
        <article class="stat-card stat-card--bookmark">
          <p class="stat-label">⭐ Đánh dấu</p>
          <p class="stat-value">${bookmarkCount}</p>
        </article>
      </section>

      <section class="control-row">
        <label class="toggle-card">
          <input type="checkbox" data-role="shuffle-toggle" ${state.persisted.settings.shuffleQuestions ? "checked" : ""} />
          <span>🔀 Trộn thứ tự câu hỏi lúc bắt đầu</span>
        </label>
        <label class="toggle-card">
          <input type="checkbox" data-role="instant-feedback-toggle" ${state.persisted.settings.immediateFeedback ? "checked" : ""} />
          <span>⚡ Báo đúng/sai ngay sau khi chọn</span>
        </label>
      </section>

      <section class="setup-card">
        <div>
          <h3>🚀 Bắt đầu theo số câu</h3>
          <p class="subtle-text">
            Chọn nhanh 50, 100 câu hoặc nhập số bất kỳ từ 1 đến ${state.questions.length}.
          </p>
        </div>

        <div class="button-row">
          <button class="button" data-action="start-new" data-count="all">Làm toàn bộ đề</button>
          <button class="ghost-button" data-action="start-new" data-count="50">50 câu</button>
          <button class="ghost-button" data-action="start-new" data-count="100">100 câu</button>
        </div>

        <div class="custom-count-row">
          <label class="input-stack" for="custom-question-count">
            <span>Số câu tùy chỉnh</span>
            <input
              id="custom-question-count"
              class="number-input"
              type="number"
              min="1"
              max="${state.questions.length}"
              step="1"
              value="${escapeHtml(customQuestionCount)}"
              data-role="custom-question-count"
            />
          </label>
          <button class="secondary-button" data-action="start-custom">Bắt đầu theo số nhập</button>
        </div>
      </section>

      <section class="button-row">
        <button class="ghost-button" data-action="continue-session" ${canContinue ? "" : "disabled"}>
          ▶️ Tiếp tục
        </button>
        <button class="secondary-button" data-action="review-wrong" ${canReviewWrong ? "" : "disabled"}>
          🎯 Ôn lại câu sai
        </button>
        <button class="bookmark-button" data-action="review-bookmarks" ${bookmarkCount > 0 ? "" : "disabled"}>
          ⭐ Ôn câu đánh dấu (${bookmarkCount})
        </button>
        <button class="danger-button" data-action="reset-state" ${canContinue || canReviewWrong || bookmarkCount > 0 ? "" : "disabled"}>
          🗑️ Xóa tiến độ
        </button>
      </section>

      ${session
      ? `<p class="subtle-text">
              Trạng thái lưu hiện tại:
              <strong>${session.submitted ? "Đã nộp bài" : "Đang làm"}</strong>.
            </p>`
      : ""
    }

      ${renderDashboard(history, topWrong)}
    </div>
  `;
}

function renderDashboard(history, topWrong) {
  if (history.length === 0 && topWrong.length === 0) {
    return `
      <section class="dashboard-empty">
        <p>📊 Hoàn thành bài thi đầu tiên để xem thống kê học tập!</p>
      </section>
    `;
  }

  const chartBars = history.length > 0
    ? history.map((h, i) => {
      const label = h.date.slice(5); // MM-DD
      const colorClass = h.percent >= 75 ? "bar--good" : h.percent >= 50 ? "bar--ok" : "bar--bad";
      return `
          <div class="chart-column">
            <div class="bar-wrapper">
              <span class="bar-value">${h.percent}%</span>
              <div class="chart-bar ${colorClass}" style="height: ${Math.max(h.percent, 4)}%"></div>
            </div>
            <span class="bar-label">#${i + 1}</span>
          </div>
        `;
    }).join("")
    : "";

  const wrongList = topWrong.length > 0
    ? topWrong.map(item => `
        <li class="wrong-freq-item">
          <span class="wrong-freq-count">${item.count}x</span>
          <span class="wrong-freq-text">Câu ${item.id}: ${escapeHtml(item.question.question.slice(0, 70))}${item.question.question.length > 70 ? "…" : ""}</span>
        </li>
      `).join("")
    : "";

  return `
    <section class="dashboard-section">
      <h3 class="dashboard-title">📊 Thống kê học tập</h3>

      ${history.length > 0 ? `
        <div class="dashboard-chart-wrap">
          <p class="dashboard-subtitle">Tỷ lệ đúng theo từng lần làm gần đây</p>
          <div class="dashboard-chart">
            ${chartBars}
          </div>
        </div>
      ` : ""}

      ${topWrong.length > 0 ? `
        <div class="dashboard-wrong-wrap">
          <p class="dashboard-subtitle">🔴 Câu hay sai nhất</p>
          <ul class="wrong-freq-list">
            ${wrongList}
          </ul>
        </div>
      ` : ""}
    </section>
  `;
}

// ── Quiz ─────────────────────────────────────────────────────────────────────
function renderQuiz(session) {
  currentView = "quiz";
  const currentQuestionId = session.order[session.currentIndex];
  const question = state.questionsById.get(currentQuestionId);
  const selected = session.answers[currentQuestionId] ?? "";
  const feedback = session.feedbackByQuestion?.[currentQuestionId] ?? null;
  const isLocked = Boolean(session.immediateFeedback && feedback);
  const answeredCount = countAnswered(session);
  const progressPercent = Math.round(((session.currentIndex + 1) / session.order.length) * 100);
  const isBookmarked = state.persisted.bookmarks.includes(currentQuestionId);
  const isClinical = isClinicalQuestion(question.question);

  const selectionButtons = ["A", "B", "C", "D"]
    .map((choice) => {
      const isSelected = selected === choice;
      const isCorrectChoice = feedback && feedback.correct === choice;
      const isWrongSelected = feedback && feedback.selected === choice && !feedback.isCorrect;
      return `
        <button
          class="option-button ${isSelected ? "is-selected" : ""} ${isCorrectChoice ? "is-correct" : isWrongSelected ? "is-wrong" : ""}"
          data-action="select-answer"
          data-choice="${choice}"
          data-question-id="${question.id}"
          ${isLocked ? "disabled" : ""}
        >
          <span class="option-letter">${choice}</span>
          <span class="option-copy">${highlightKeywords(question.options[choice])}</span>
        </button>
      `;
    })
    .join("");

  // Mini question map
  const mapDots = session.order.map((qId, idx) => {
    const isAnswered = Boolean(session.answers[qId]);
    const isBookmarkedDot = state.persisted.bookmarks.includes(qId);
    const isCurrent = idx === session.currentIndex;
    const dotClass = [
      "qmap-dot",
      isCurrent ? "qmap-dot--current" : "",
      isAnswered ? "qmap-dot--answered" : "",
      isBookmarkedDot ? "qmap-dot--bookmarked" : ""
    ].filter(Boolean).join(" ");
    return `<button class="${dotClass}" data-action="jump-to-question" data-index="${idx}" title="Câu ${idx + 1}${isBookmarkedDot ? " ⭐" : ""}"></button>`;
  }).join("");

  app.innerHTML = `
    <section class="quiz-panel">
      <div class="quiz-header-row">
        <div>
          <h2>📝 Làm bài</h2>
          <p class="quiz-meta">
            Câu ${session.currentIndex + 1}/${session.order.length} · Đã trả lời ${answeredCount}/${session.order.length}
          </p>
        </div>
        <div class="quiz-header-actions">
          <button class="map-toggle-btn ${showQuestionMap ? "active" : ""}" data-action="toggle-map" title="Bản đồ câu hỏi">
            🗺️ Bản đồ
          </button>
          <div class="kbd-hints">
            <span class="kbd">A</span><span class="kbd">B</span><span class="kbd">C</span><span class="kbd">D</span>
            <span class="kbd-sep">·</span>
            <span class="kbd">←</span><span class="kbd">→</span>
          </div>
        </div>
      </div>

      <div class="progress-bar" aria-hidden="true">
        <div class="progress-fill" style="width: ${progressPercent}%"></div>
      </div>

      ${showQuestionMap ? `
        <div class="question-map">
          <div class="qmap-legend">
            <span><span class="qmap-dot qmap-dot--answered" style="display:inline-block"></span> Đã trả lời</span>
            <span><span class="qmap-dot qmap-dot--bookmarked" style="display:inline-block"></span> Đánh dấu</span>
            <span><span class="qmap-dot qmap-dot--current" style="display:inline-block"></span> Hiện tại</span>
          </div>
          <div class="qmap-grid">${mapDots}</div>

          <div class="quick-jump-row">
            <label for="quick-jump-input">Nhảy đến câu:</label>
            <input
              id="quick-jump-input"
              class="quick-jump-input"
              type="number"
              min="1"
              max="${session.order.length}"
              placeholder="1–${session.order.length}"
              data-role="quick-jump-input"
            />
            <button class="ghost-button small-btn" data-action="do-quick-jump">Đi</button>
          </div>
        </div>
      ` : ""}

      <article class="question-card">
        <div class="question-card-header">
          <p class="question-number">Câu ${question.id}</p>
          <div class="question-card-badges">
            ${isClinical ? '<span class="clinical-badge">🏥 Lâm sàng</span>' : ""}
            <button class="bookmark-toggle ${isBookmarked ? "is-bookmarked" : ""}" data-action="toggle-bookmark" data-question-id="${currentQuestionId}" title="${isBookmarked ? "Bỏ đánh dấu" : "Đánh dấu câu này"}">
              ${isBookmarked ? "⭐" : "☆"} ${isBookmarked ? "Đã đánh dấu" : "Đánh dấu"}
            </button>
          </div>
        </div>
        <p class="question-text">${highlightKeywords(question.question)}</p>
      </article>

      ${feedback
      ? `
            <div class="feedback-banner ${feedback.isCorrect ? "is-correct" : "is-wrong"}">
              <strong>${feedback.isCorrect ? "✅ Chính xác" : "❌ Sai rồi"}</strong>
              <p>
                ${feedback.isCorrect
        ? "Bạn đã trả lời đúng. Bấm Câu sau để tiếp tục."
        : `Đáp án đúng là <strong>${feedback.correct}</strong>. Bấm Câu sau để tiếp tục.`
      }
              </p>
            </div>
          `
      : ""
    }

      <div class="options-list">
        ${selectionButtons}
      </div>

      <div class="footer-bar">
        <div class="button-row">
          <button
            class="ghost-button"
            data-action="go-prev"
            ${session.currentIndex === 0 ? "disabled" : ""}
          >
            ← Câu trước
          </button>
          <button
            class="ghost-button"
            data-action="go-next"
          >
            ${session.currentIndex === session.order.length - 1 ? "Đến cuối bài →" : "Câu sau →"}
          </button>
        </div>

        <div class="button-row">
          <button class="danger-button" data-action="go-home">🏠 Về trang chính</button>
          <button class="button" data-action="submit-quiz">✅ Nộp bài</button>
        </div>
      </div>
    </section>
  `;
}

// ── Results ───────────────────────────────────────────────────────────────────
function renderResults(session) {
  currentView = "results";
  const summary = state.persisted.lastResult ?? scoreSession(session, state.questions);
  const wrongReview = buildWrongAnswerReview(state.questions, session);
  const total = session.order.length;
  const scorePercent = total > 0 ? Math.round((summary.correctCount / total) * 100) : 0;
  const ev = getResultEvaluation(scorePercent);

  app.innerHTML = `
    <section class="result-panel">
      <div class="result-header">
        <div class="result-grade-badge">${ev.emoji}</div>
        <h2>${ev.grade}</h2>
        <p class="result-copy">
          Bé đúng ${summary.correctCount}/${total} câu, tương đương ${scorePercent}%.
        </p>
        <div class="result-evaluation-msg">${ev.msg}</div>
      </div>

      <div class="score-grid">
        <article class="score-card is-correct">
          <span class="stat-label">Đúng</span>
          <strong>${summary.correctCount}</strong>
        </article>
        <article class="score-card is-wrong">
          <span class="stat-label">Sai</span>
          <strong>${summary.incorrectCount}</strong>
        </article>
        <article class="score-card">
          <span class="stat-label">Chưa trả lời</span>
          <strong>${summary.unansweredCount}</strong>
        </article>
        <article class="score-card">
          <span class="stat-label">Chế độ</span>
          <strong>${session.mode === "wrong-only" ? "Ôn câu sai" : session.mode === "bookmark" ? "Câu đánh dấu" : "Toàn bộ đề"}</strong>
        </article>
      </div>

      <div class="button-row">
        <button class="button" data-action="start-new">🔄 Làm lại từ đầu</button>
        <button class="secondary-button" data-action="review-wrong" ${wrongReview.length ? "" : "disabled"}>
          🎯 Ôn lại câu sai
        </button>
        <button class="ghost-button" data-action="go-home">🏠 Về trang chính</button>
      </div>

      ${wrongReview.length
      ? `
            <div class="review-list">
              <h3 style="margin: 16px 0 0; color: var(--muted); font-size: 1.1rem;">Nội dung cần ôn tập</h3>
              ${wrongReview.map(renderWrongItem).join("")}
            </div>
          `
      : `
            <div class="empty-state">
              <p>🎉 Tuyệt vời! Không có câu sai để ôn lại.</p>
            </div>
          `
    }
    </section>
  `;
}

function renderWrongItem(item) {
  const optionList = ["A", "B", "C", "D"]
    .map((choice) => {
      const value = highlightKeywords(item.options[choice]);
      const prefix = choice === item.correct ? "Đúng" : choice === item.selected ? "Bạn chọn" : "";

      return `
        <p class="answer-note ${choice === item.correct ? "is-correct" : choice === item.selected ? "is-wrong" : ""}">
          <strong>${choice}.</strong> ${value} ${prefix ? `· <em>${prefix}</em>` : ""}
        </p>
      `;
    })
    .join("");

  const isClinical = isClinicalQuestion(item.question);

  return `
    <article class="review-item">
      <h3>
        ${isClinical ? '<span class="clinical-badge clinical-badge--sm">🏥</span>' : ""}
        Câu ${item.id}: ${highlightKeywords(item.question)}
      </h3>
      ${optionList}
    </article>
  `;
}

// ── Event Handlers ────────────────────────────────────────────────────────────
function handleClick(event) {
  const button = event.target.closest("[data-action]");

  if (!button || state.loading || state.error) return;

  const { action } = button.dataset;

  if (action === "start-new") {
    startNewSession("all", button.dataset.count);
    return;
  }

  if (action === "start-custom") {
    startNewSession("all", state.persisted.settings.customQuestionCount);
    return;
  }

  if (action === "continue-session") {
    render();
    return;
  }

  if (action === "review-wrong") {
    startReviewWrongSession();
    return;
  }

  if (action === "review-bookmarks") {
    startBookmarkSession();
    return;
  }

  if (action === "reset-state") {
    resetAllState();
    return;
  }

  if (action === "go-home") {
    renderHome();
    return;
  }

  if (action === "toggle-map") {
    showQuestionMap = !showQuestionMap;
    renderQuiz(state.persisted.session);
    return;
  }

  if (action === "jump-to-question") {
    const idx = parseInt(button.dataset.index, 10);
    if (!isNaN(idx)) {
      state.persisted.session = goToQuestion(state.persisted.session, idx);
      persistState();
      renderQuiz(state.persisted.session);
    }
    return;
  }

  if (action === "do-quick-jump") {
    const input = document.getElementById("quick-jump-input");
    if (input) {
      const val = parseInt(input.value, 10);
      if (!isNaN(val) && val >= 1) {
        state.persisted.session = goToQuestion(state.persisted.session, val - 1);
        persistState();
        renderQuiz(state.persisted.session);
      }
    }
    return;
  }

  if (action === "toggle-bookmark") {
    const questionId = Number(button.dataset.questionId);
    toggleBookmark(questionId);
    renderQuiz(state.persisted.session);
    return;
  }

  const session = state.persisted.session;

  if (!session || session.submitted) return;

  if (action === "select-answer") {
    const questionId = Number(button.dataset.questionId);
    const correctAnswer = state.questionsById.get(questionId)?.answer ?? null;
    const chosenAnswer = button.dataset.choice;
    state.persisted.session = selectAnswer(
      session,
      questionId,
      chosenAnswer,
      correctAnswer
    );
    persistState();

    if (state.persisted.settings.immediateFeedback && correctAnswer) {
      const isCorrect = chosenAnswer === correctAnswer;
      showReactionToast(isCorrect);
      if (isCorrect) {
        launchConfetti();
      } else {
        shakeCard();
      }
    }

    renderQuiz(state.persisted.session);
    return;
  }

  if (action === "go-prev") {
    state.persisted.session = goToQuestion(session, session.currentIndex - 1);
    persistState();
    renderQuiz(state.persisted.session);
    return;
  }

  if (action === "go-next") {
    state.persisted.session = goToQuestion(session, session.currentIndex + 1);
    persistState();
    renderQuiz(state.persisted.session);
    return;
  }

  if (action === "submit-quiz") {
    submitSession(session);
  }
}

function handleChange(event) {
  const toggle = event.target.closest("[data-role='shuffle-toggle']");
  const instantFeedbackToggle = event.target.closest("[data-role='instant-feedback-toggle']");
  const customQuestionCountInput = event.target.closest("[data-role='custom-question-count']");

  if (toggle) {
    state.persisted.settings.shuffleQuestions = toggle.checked;
    persistState();
  }

  if (instantFeedbackToggle) {
    state.persisted.settings.immediateFeedback = instantFeedbackToggle.checked;
    persistState();
  }

  if (customQuestionCountInput) {
    state.persisted.settings.customQuestionCount = customQuestionCountInput.value;
    persistState();
  }
}

// ── Keyboard Shortcuts ────────────────────────────────────────────────────────
function handleKeydown(event) {
  // Don't capture when typing in an input
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea") return;

  if (currentView !== "quiz") return;

  const session = state.persisted.session;
  if (!session || session.submitted) return;

  const currentQuestionId = session.order[session.currentIndex];
  const feedback = session.feedbackByQuestion?.[currentQuestionId] ?? null;
  const isLocked = Boolean(session.immediateFeedback && feedback);

  switch (event.key) {
    case "a":
    case "A":
      if (!isLocked) selectAnswerByKey(session, currentQuestionId, "A");
      break;
    case "b":
    case "B":
      if (!isLocked) selectAnswerByKey(session, currentQuestionId, "B");
      break;
    case "c":
    case "C":
      if (!isLocked) selectAnswerByKey(session, currentQuestionId, "C");
      break;
    case "d":
    case "D":
      if (!isLocked) selectAnswerByKey(session, currentQuestionId, "D");
      break;
    case "ArrowRight":
    case " ":
      event.preventDefault();
      state.persisted.session = goToQuestion(session, session.currentIndex + 1);
      persistState();
      renderQuiz(state.persisted.session);
      break;
    case "ArrowLeft":
      event.preventDefault();
      state.persisted.session = goToQuestion(session, session.currentIndex - 1);
      persistState();
      renderQuiz(state.persisted.session);
      break;
    case "s":
    case "S":
      // S = Star = Bookmark toggle
      toggleBookmark(currentQuestionId);
      renderQuiz(state.persisted.session);
      break;
    case "m":
    case "M":
      showQuestionMap = !showQuestionMap;
      renderQuiz(state.persisted.session);
      break;
  }
}

function selectAnswerByKey(session, questionId, choice) {
  const correctAnswer = state.questionsById.get(questionId)?.answer ?? null;
  state.persisted.session = selectAnswer(session, questionId, choice, correctAnswer);
  persistState();

  if (state.persisted.settings.immediateFeedback && correctAnswer) {
    const isCorrect = choice === correctAnswer;
    showReactionToast(isCorrect);
    if (isCorrect) launchConfetti();
    else shakeCard();
  }

  renderQuiz(state.persisted.session);
}

// ── Session Management ────────────────────────────────────────────────────────
function startNewSession(mode, requestedCount = "all") {
  showQuestionMap = false;
  const questionLimit = normalizeQuestionCount(requestedCount, state.questions.length);
  state.persisted.session = createSession(state.questions, {
    shuffleQuestions: state.persisted.settings.shuffleQuestions,
    mode,
    questionLimit,
    immediateFeedback: state.persisted.settings.immediateFeedback
  });
  state.persisted.lastResult = null;
  persistState();
  renderQuiz(state.persisted.session);
}

function startReviewWrongSession() {
  const wrongIds = state.persisted.lastResult?.wrongAnswers?.map((item) => item.id) ?? [];

  if (wrongIds.length === 0) {
    render();
    return;
  }

  showQuestionMap = false;
  state.persisted.session = createSession(state.questions, {
    shuffleQuestions: state.persisted.settings.shuffleQuestions,
    mode: "wrong-only",
    sourceQuestionIds: wrongIds,
    immediateFeedback: state.persisted.settings.immediateFeedback
  });
  persistState();
  renderQuiz(state.persisted.session);
}

function startBookmarkSession() {
  const bookmarkIds = state.persisted.bookmarks;

  if (bookmarkIds.length === 0) {
    renderHome();
    return;
  }

  showQuestionMap = false;
  state.persisted.session = createSession(state.questions, {
    shuffleQuestions: state.persisted.settings.shuffleQuestions,
    mode: "bookmark",
    sourceQuestionIds: bookmarkIds,
    immediateFeedback: state.persisted.settings.immediateFeedback
  });
  persistState();
  renderQuiz(state.persisted.session);
}

function toggleBookmark(questionId) {
  const idx = state.persisted.bookmarks.indexOf(questionId);
  if (idx === -1) {
    state.persisted.bookmarks.push(questionId);
  } else {
    state.persisted.bookmarks.splice(idx, 1);
  }
  persistState();
}

function submitSession(session) {
  const submittedSession = { ...session, submitted: true };
  const summary = scoreSession(submittedSession, state.questions);

  // Update stats
  state.stats = updateStudyHistory(state.stats, summary, session.order.length);
  persistStats();

  state.persisted.session = submittedSession;
  state.persisted.lastResult = summary;
  persistState();
  renderResults(submittedSession);
}

function resetAllState() {
  state.persisted.session = null;
  state.persisted.lastResult = null;
  state.persisted.bookmarks = [];
  storage.clear();
  persistState();
  renderHome();
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function countAnswered(session) {
  return session.order.filter((id) => Boolean(session.answers[id])).length;
}

function clampIndex(index, length) {
  if (length <= 0) return 0;
  return Math.min(Math.max(index, 0), length - 1);
}

function normalizeQuestionCount(value, max) {
  if (value === "all" || value === "" || value == null) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.min(parsed, max);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
