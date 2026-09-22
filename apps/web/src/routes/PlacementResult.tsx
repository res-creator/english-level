import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type {
  PlacementResultResponse,
  PlacementSkill,
} from "@english-level/contracts";
import { getPlacementResult } from "../placement/placementClient.ts";

const SKILL_LABELS: Record<PlacementSkill, string> = {
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  reading: "Reading",
  active_english: "Active English",
};

type State =
  | { status: "loading" }
  | { status: "ready"; result: PlacementResultResponse }
  | { status: "error"; message: string };

export function PlacementResult() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!attemptId) return;
    getPlacementResult(attemptId)
      .then((result) => setState({ status: "ready", result }))
      .catch((err) =>
        setState({ status: "error", message: (err as Error).message }),
      );
  }, [attemptId]);

  if (state.status === "loading") return <p>Loading…</p>;

  if (state.status === "error") {
    return (
      <section className="onboarding-screen">
        <p className="onboarding-error">{state.message}</p>
      </section>
    );
  }

  const { result } = state;
  const skillRows: Array<{ skill: PlacementSkill; value: number }> = [
    { skill: "vocabulary", value: result.scores.vocabulary },
    { skill: "grammar", value: result.scores.grammar },
    { skill: "reading", value: result.scores.reading },
    { skill: "active_english", value: result.scores.activeEnglish },
  ];

  return (
    <section className="onboarding-screen">
      <p className="onboarding-progress">Your English Level</p>
      <p className="result-level">{result.level}</p>

      <div className="option-list">
        {skillRows.map((row) => (
          <div className="result-skill" key={row.skill}>
            <div className="result-skill-label">
              <span>{SKILL_LABELS[row.skill]}</span>
              <span>{row.value}%</span>
            </div>
            <div className="result-skill-track">
              <div
                className="result-skill-fill"
                style={{ width: `${row.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p>
        Strongest: {SKILL_LABELS[result.strongestSkill]}
        <br />
        Needs work: {SKILL_LABELS[result.weakestSkill]}
      </p>

      {result.selfReportedLevel && (
        <p className="onboarding-progress">
          During onboarding you guessed {result.selfReportedLevel}.
        </p>
      )}

      <div className="onboarding-actions">
        <button
          type="button"
          className="button-primary"
          onClick={() => navigate("/learn")}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
