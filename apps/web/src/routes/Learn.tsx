import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CurriculumPathResponse } from "@english-level/contracts";
import { getCurriculumPath } from "../curriculum/curriculumClient.ts";

type State =
  | { status: "loading" }
  | { status: "ready"; path: CurriculumPathResponse }
  | { status: "error"; message: string };

export function Learn() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    getCurriculumPath()
      .then((path) => setState({ status: "ready", path }))
      .catch((err) =>
        setState({ status: "error", message: (err as Error).message }),
      );
  }, []);

  if (state.status === "loading") return <p>Loading…</p>;

  if (state.status === "error") {
    return (
      <section>
        <h1>Learn</h1>
        <p className="onboarding-error">{state.message}</p>
      </section>
    );
  }

  const { path } = state;

  if (!path.currentLevel) {
    return (
      <section>
        <h1>Learn</h1>
        <p>Finish placement to unlock your learning path.</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Learn</h1>
      <p>Your level: {path.currentLevel}</p>

      {path.modules.length === 0 ? (
        <p>Curriculum for {path.currentLevel} isn't available yet.</p>
      ) : (
        <div className="option-list">
          {path.modules.map((m) => (
            <Link
              key={m.id}
              to={`/learn/modules/${m.id}`}
              className="option-button"
            >
              {m.title}
              <span className="option-button__hint">{m.lessons} lessons</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
