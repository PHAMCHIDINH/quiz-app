export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function shuffleArray(items, randomFn = Math.random) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomFn() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

export function byQuestionId(questions) {
  return new Map(questions.map((question) => [question.id, question]));
}
