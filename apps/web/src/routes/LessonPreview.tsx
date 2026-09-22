import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { LessonContentDTO } from "@english-level/contracts";
import { getLessonContent } from "../curriculum/curriculumClient.ts";

type State =
  | { status: "loading" }
  | { status: "ready"; lesson: LessonContentDTO }
  | { status: "error"; message: string };

export function LessonPreview() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!lessonId) return;
    getLessonContent(lessonId)
      .then((lesson) => setState({ status: "ready", lesson }))
      .catch((err) =>
        setState({ status: "error", message: (err as Error).message }),
      );
  }, [lessonId]);

  if (state.status === "loading") return <p>Loading…</p>;

  if (state.status === "error") {
    return (
      <section>
        <Link to="/learn">&larr; Back to Learn</Link>
        <p className="onboarding-error">{state.message}</p>
      </section>
    );
  }

  const { lesson } = state;

  return (
    <section>
      <Link to={`/learn/modules/${lesson.moduleId}`}>
        &larr; Back to module
      </Link>
      <h1>{lesson.title}</h1>

      <div className="option-list">
        {lesson.content.map((entry, idx) =>
          entry.contentType === "learning_item" ? (
            <div className="placement-passage" key={`${entry.item.id}-${idx}`}>
              <strong>{entry.item.displayForm}</strong> —{" "}
              {entry.item.translation}
              {entry.item.primaryExample && (
                <>
                  <br />
                  <em>{entry.item.primaryExample}</em>
                </>
              )}
            </div>
          ) : (
            <div
              className="placement-passage"
              key={`${entry.pattern.id}-${idx}`}
            >
              <strong>{entry.pattern.title}</strong>
              {entry.pattern.formula && (
                <>
                  <br />
                  {entry.pattern.formula}
                </>
              )}
              <br />
              {entry.pattern.explanation}
            </div>
          ),
        )}
      </div>

      <div className="onboarding-actions">
        <button
          type="button"
          className="button-primary"
          onClick={() => navigate(`/learn/lessons/${lesson.id}/session`)}
        >
          Start Lesson
        </button>
      </div>
    </section>
  );
}
