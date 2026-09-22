import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { ModuleDetailResponse } from "@english-level/contracts";
import { getModuleDetail } from "../curriculum/curriculumClient.ts";

type State =
  | { status: "loading" }
  | { status: "ready"; module: ModuleDetailResponse }
  | { status: "error"; message: string };

const LESSON_TYPE_LABELS: Record<string, string> = {
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  mixed: "Mixed practice",
  reading: "Reading",
  practice: "Practice",
  checkpoint: "Checkpoint",
};

export function ModuleDetail() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!moduleId) return;
    getModuleDetail(moduleId)
      .then((module) => setState({ status: "ready", module }))
      .catch((err) =>
        setState({ status: "error", message: (err as Error).message }),
      );
  }, [moduleId]);

  if (state.status === "loading") return <p>Loading…</p>;

  if (state.status === "error") {
    return (
      <section>
        <Link to="/learn">&larr; Back to Learn</Link>
        <p className="onboarding-error">{state.message}</p>
      </section>
    );
  }

  const { module } = state;

  return (
    <section>
      <Link to="/learn">&larr; Back to Learn</Link>
      <h1>{module.title}</h1>
      {module.description && <p>{module.description}</p>}

      <div className="option-list">
        {module.lessons.map((l) => (
          <Link
            key={l.id}
            to={`/learn/lessons/${l.id}`}
            className="option-button"
          >
            {l.title}
            <span className="option-button__hint">
              {LESSON_TYPE_LABELS[l.type] ?? l.type}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
