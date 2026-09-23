import type { AnswerFeedback } from "@english-level/contracts";

/**
 * The learning moment: what happened, what the right answer was, and the
 * explanation the engine already carries. Nothing is invented here, and a
 * miss is never framed as a failure.
 */
export function FeedbackPanel({ feedback }: { feedback: AnswerFeedback }) {
  if (feedback.correct) {
    return (
      <div className="feedback feedback--ok">
        <div className="feedback__head">
          <span className="feedback__icon" aria-hidden="true">
            ✓
          </span>
          <span className="feedback__title">Верно</span>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback feedback--no">
      <div className="feedback__head">
        <span className="feedback__icon" aria-hidden="true">
          ✕
        </span>
        <span className="feedback__title">Почти</span>
      </div>
      <div className="feedback__answer">{feedback.correctAnswer}</div>
      {feedback.explanation ? (
        <p className="feedback__explain">{feedback.explanation}</p>
      ) : null}
    </div>
  );
}
