import { byQuestionId } from "./utils.js";
import { scoreSession } from "./quiz.js";

export function buildWrongAnswerReview(questions, session) {
  const questionMap = byQuestionId(questions);
  const summary = scoreSession(session, questions);

  return summary.wrongAnswers.map((item) => {
    const question = questionMap.get(item.id);

    return {
      id: question.id,
      question: question.question,
      options: question.options,
      selected: item.selected,
      correct: item.correct
    };
  });
}
