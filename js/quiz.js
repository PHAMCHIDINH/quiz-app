import { byQuestionId, clamp, shuffleArray } from "./utils.js";

export function createSession(questions, options = {}) {
  const {
    shuffleQuestions = false,
    randomFn = Math.random,
    mode = "all",
    sourceQuestionIds = null,
    questionLimit = null,
    immediateFeedback = false
  } = options;

  const selectedQuestions = sourceQuestionIds
    ? questions.filter((question) => sourceQuestionIds.includes(question.id))
    : questions;
  const orderedIds = selectedQuestions.map((question) => question.id);
  const nextOrder = shuffleQuestions ? shuffleArray(orderedIds, randomFn) : orderedIds;
  const normalizedLimit =
    Number.isInteger(questionLimit) && questionLimit > 0
      ? Math.min(questionLimit, nextOrder.length)
      : nextOrder.length;

  return {
    order: nextOrder.slice(0, normalizedLimit),
    answers: {},
    currentIndex: 0,
    submitted: false,
    mode,
    immediateFeedback,
    feedbackByQuestion: {}
  };
}

export function selectAnswer(session, questionId, choice, correctAnswer = null) {
  if (session.immediateFeedback && session.feedbackByQuestion?.[questionId]) {
    return session;
  }

  const nextFeedback =
    session.immediateFeedback && correctAnswer
      ? {
          ...session.feedbackByQuestion,
          [questionId]: {
            selected: choice,
            correct: correctAnswer,
            isCorrect: choice === correctAnswer
          }
        }
      : session.feedbackByQuestion ?? {};

  return {
    ...session,
    answers: {
      ...session.answers,
      [questionId]: choice
    },
    feedbackByQuestion: nextFeedback
  };
}

export function goToQuestion(session, nextIndex) {
  return {
    ...session,
    currentIndex: clamp(nextIndex, 0, Math.max(session.order.length - 1, 0))
  };
}

export function scoreSession(session, questions) {
  const questionsById = byQuestionId(questions);
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  const wrongAnswers = [];

  for (const questionId of session.order) {
    const question = questionsById.get(questionId);
    const selected = session.answers[questionId];

    if (!selected) {
      unansweredCount += 1;
      continue;
    }

    if (selected === question.answer) {
      correctCount += 1;
      continue;
    }

    incorrectCount += 1;
    wrongAnswers.push({
      id: questionId,
      selected,
      correct: question.answer
    });
  }

  return {
    correctCount,
    incorrectCount,
    unansweredCount,
    answeredCount: correctCount + incorrectCount,
    wrongAnswers
  };
}
