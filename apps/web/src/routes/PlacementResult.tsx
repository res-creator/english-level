import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type {
  PlacementResultResponse,
  PlacementSkill,
  TodayResponse,
} from "@english-level/contracts";
import { getPlacementResult } from "../placement/placementClient.ts";
import { getToday } from "../api/productClient.ts";
import { Kvo } from "../brand/Kvo.tsx";
import { Button } from "../ui/Button.tsx";
import { ProgressBar } from "../ui/ProgressBar.tsx";
import { LoadingScreen, ErrorState } from "../ui/states.tsx";
import { levelTitle } from "../ui/labels.tsx";

const SKILL_LABELS: Record<PlacementSkill, string> = {
  vocabulary: "Слова",
  grammar: "Грамматика",
  reading: "Чтение",
  active_english: "Речь",
};

const LEVEL_MEANING: Record<string, string> = {
  A1: "Базовые фразы и повседневные выражения — начинаем с самого нужного.",
  A2: "Простые бытовые темы — расширяем словарь и уверенность.",
  B1: "Уверенное общение на знакомые темы — добавляем точность.",
  B2: "Свободное общение на большинство тем — шлифуем нюансы.",
};

type State =
  | { status: "loading" }
  | { status: "ready"; result: PlacementResultResponse }
  | { status: "error" };

/** The first situation comes from the same read Today uses — never a
 * guess, so the CTA always lands on real content. */
type FirstLesson =
  | { status: "loading" }
  | { status: "ready"; episodeId: string; title: string }
  | { status: "unavailable" };

export function PlacementResult() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });
  const [firstLesson, setFirstLesson] = useState<FirstLesson>({
    status: "loading",
  });

  useEffect(() => {
    if (!attemptId) return;
    getPlacementResult(attemptId)
      .then((result) => setState({ status: "ready", result }))
      .catch(() => setState({ status: "error" }));
  }, [attemptId]);

  useEffect(() => {
    if (state.status !== "ready") return;
    let cancelled = false;
    getToday()
      .then((data: TodayResponse) => {
        if (cancelled) return;
        setFirstLesson(
          data.episode
            ? {
                status: "ready",
                episodeId: data.episode.id,
                title: data.episode.situationTitle ?? data.episode.title,
              }
            : { status: "unavailable" },
        );
      })
      .catch(() => {
        if (!cancelled) setFirstLesson({ status: "unavailable" });
      });
    return () => {
      cancelled = true;
    };
  }, [state.status]);

  if (state.status === "loading") return <LoadingScreen />;

  if (state.status === "error") {
    return (
      <div className="center-screen">
        <ErrorState
          title="Результат не найден"
          message="Похоже, тест ещё не завершён."
          onRetry={() => navigate("/placement")}
        />
      </div>
    );
  }

  const { result } = state;
  const skills: Array<{ skill: PlacementSkill; value: number }> = [
    { skill: "vocabulary", value: result.scores.vocabulary },
    { skill: "grammar", value: result.scores.grammar },
    { skill: "reading", value: result.scores.reading },
    { skill: "active_english", value: result.scores.activeEnglish },
  ];

  return (
    <div className="hero-screen">
      <div className="hero-screen__stage hero-screen__stage--tall">
        <span className="stage-chip">Твой уровень</span>
        <div className="hero-screen__kvo">
          <Kvo size={200} state="happy" title="Кво" />
        </div>
      </div>

      <div className="hero-screen__sheet">
        <div className="sheet-grabber" aria-hidden="true" />
        <h1 className="display">{levelTitle(result.level)}</h1>
        <p className="body muted">
          {LEVEL_MEANING[result.level] ??
            "Курс собран под твой текущий уровень."}
        </p>

        <div className="stack-sm">
          <span className="section-title">По навыкам</span>
          {skills.map((row) => (
            <div key={row.skill} className="stack-sm">
              <div className="row-between">
                <span className="small">{SKILL_LABELS[row.skill]}</span>
                <span className="caption muted num">{row.value}%</span>
              </div>
              <ProgressBar percent={row.value} thin />
            </div>
          ))}
        </div>

        <div className="panel stack-sm">
          <span className="caption">
            Сильнее всего — {SKILL_LABELS[result.strongestSkill]}
          </span>
          <span className="small muted">
            Подтянем {SKILL_LABELS[result.weakestSkill].toLowerCase()} — с этого
            и начнём.
          </span>
        </div>

        <div className="hero-screen__actions">
          {firstLesson.status === "ready" ? (
            <Button
              onClick={() => navigate(`/course/${firstLesson.episodeId}`)}
            >
              Начать: {firstLesson.title}
            </Button>
          ) : (
            <Button
              disabled={firstLesson.status === "loading"}
              onClick={() => navigate("/course")}
            >
              {firstLesson.status === "loading"
                ? "Собираем курс…"
                : "Открыть курс"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
