const BUCKETS = [
  { id: 'white', label: 'Trắng', color: '#ffffff', match: (c) => c.toLowerCase().includes('trắng') || c.toLowerCase().includes('keo') },
  { id: 'yellow', label: 'Vàng', color: '#fde047', match: (c) => c.toLowerCase().includes('vàng') || c.toLowerCase().includes('cam') },
  { id: 'red', label: 'Đỏ', color: '#ef4444', match: (c) => c.toLowerCase().includes('đỏ') || c.toLowerCase().includes('gạch') || c.toLowerCase().includes('máu') },
  { id: 'blue', label: 'Xanh Dương', color: '#3b82f6', match: (c) => (c.toLowerCase().includes('xanh') && (c.toLowerCase().includes('thẫm') || c.toLowerCase().includes('đậm') || c.toLowerCase().includes('lơ'))) },
  { id: 'green', label: 'Xanh Lục', color: '#22c55e', match: (c) => (c.toLowerCase().includes('xanh lục') || (c.toLowerCase().includes('trắng xanh') && !c.toLowerCase().includes('thẫm'))) },
  { id: 'black', label: 'Đen', color: '#1f2937', match: (c) => c.toLowerCase().includes('đen') },
  { id: 'pink', label: 'Hồng', color: '#ec4899', match: (c) => c.toLowerCase().includes('hồng') },
  { id: 'purple', label: 'Tím', color: '#a855f7', match: (c) => c.toLowerCase().includes('tím') },
  { id: 'brown', label: 'Nâu', color: '#92400e', match: (c) => c.toLowerCase().includes('nâu') }
];

let allData = [];
let currentReaction = null;
let score = { correct: 0, wrong: 0 };

const reactionText = document.getElementById('reaction-text');
const bucketsContainer = document.getElementById('buckets-container');
const scoreText = document.getElementById('score-text');
const restartBtn = document.getElementById('restart-btn');

async function init() {
  try {
    const res = await fetch('./data/colors.json');
    allData = await res.json();
    renderBuckets();
    nextQuestion();
  } catch (err) {
    console.error('Lỗi khi tải dữ liệu:', err);
    reactionText.textContent = 'Không thể tải dữ liệu.';
  }
}

function renderBuckets() {
  bucketsContainer.innerHTML = '';
  BUCKETS.forEach(bucket => {
    const bucketEl = document.createElement('div');
    bucketEl.classList.add('color-bucket');
    bucketEl.innerHTML = `
      <div class="bucket-swatch" style="background-color: ${bucket.color}"></div>
      <span class="bucket-label">${bucket.label}</span>
    `;
    bucketEl.addEventListener('click', () => checkAnswer(bucket));
    bucketsContainer.appendChild(bucketEl);
  });
}

function nextQuestion() {
  const randomIndex = Math.floor(Math.random() * allData.length);
  currentReaction = allData[randomIndex];
  reactionText.textContent = currentReaction.reaction;

  // Reset bucket states
  document.querySelectorAll('.color-bucket').forEach(el => {
    el.classList.remove('is-correct', 'is-wrong');
  });
}

function checkAnswer(selectedBucket) {
  const isCorrect = selectedBucket.match(currentReaction.color);

  if (isCorrect) {
    score.correct++;
    const el = Array.from(document.querySelectorAll('.color-bucket')).find(e => e.innerText.includes(selectedBucket.label));
    el.classList.add('is-correct');

    setTimeout(() => {
      nextQuestion();
      updateScore();
    }, 600);
  } else {
    score.wrong++;
    const el = Array.from(document.querySelectorAll('.color-bucket')).find(e => e.innerText.includes(selectedBucket.label));
    el.classList.add('is-wrong');

    // Find correct bucket to show user
    const correctBucket = BUCKETS.find(b => b.match(currentReaction.color));
    const correctEl = Array.from(document.querySelectorAll('.color-bucket')).find(e => e.innerText.includes(correctBucket.label));
    correctEl.classList.add('is-correct');

    setTimeout(() => {
      nextQuestion();
      updateScore();
    }, 1500);
  }
}

function updateScore() {
  scoreText.textContent = `Đúng: ${score.correct} | Sai: ${score.wrong}`;
}

restartBtn.addEventListener('click', () => {
  score = { correct: 0, wrong: 0 };
  updateScore();
  nextQuestion();
});

init();
