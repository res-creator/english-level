import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type {
  ActivityDTO,
  AnswerFeedback,
  AnswerSessionResponse,
  SessionKind,
} from "@english-level/contracts";
import { answerActivity, startEpisodeSession } from "../api/productClient.ts";
import {
  SceneStage,
  sceneChip,
  type DialogueLine,
} from "../scene/SceneStage.tsx";
import { ActivityPanel } from "../scene/ActivityPanel.tsx";
import { openingLine, sceneForSituation } from "../brand/situationScenes.ts";
import { CAST, castArtNames } from "../brand/cast.tsx";
import { artName, preloadArt } from "../brand/artRegistry.ts";
import type { CastState } from "../brand/cast.tsx";
import { Button, IconButton } from "../ui/Button.tsx";
import { LoadingScreen, ErrorState } from "../ui/states.tsx";
import { IconArrowRight, IconClose } from "../ui/icons.tsx";

/**
 * A situation is one continuous visual conversation.
 *
 * The café, Майя and everything she has already said stay exactly where
 * they were for the whole episode — only her expression, the bubbles and
 * the sheet below change. Nothing slides the screen sideways, because a
 * page transition reads as "somewhere else" and the illusion is gone.
 *
 * Kvo stays secondary: he leans in at most once per mini-scene, and only
 * when the learner is genuinely stuck.
 */

interface Active {
  status: "active";
  sessionId: string;
  kind: SessionKind;
  episodeId: string;
  title: string;
  activity: ActivityDTO;
  submitting: boolean;
  feedback: AnswerFeedback | null;
  pendingNext: AnswerSessionResponse["session"] | null;
  /** The conversation so far — it only ever grows. */
  dialogue: DialogueLine[];
  /** How often this exact activity has been missed. */
  misses: number;
  /** Spent for this mini-scene once Kvo has spoken. */
  hintUsed: boolean;
}

type State = { status: "loading" } | { status: "error" } | Active;

/** Cards are never scored — acknowledging one just advances. */
function isCard(kind: ActivityDTO["kind"]): boolean {
  return kind === "info_card" || kind === "grammar_card";
}

export function Session() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });
  const [answer, setAnswer] = useState("");
  const startedAtRef = useRef<number>(Date.now());

  // A face that changes expression mid-conversation must never flicker
  // while the next file downloads — one frame is enough to break the
  // illusion of a single continuous scene.
  useEffect(() => {
    if (!episodeId) return;
    const { scene, cast } = sceneForSituation(episodeId);
    preloadArt([
      artName.sceneBackground(scene),
      artName.sceneForeground(scene),
      ...castArtNames(cast),
    ]);
  }, [episodeId]);

  useEffect(() => {
    if (!episodeId) return;
    let cancelled = false;
    startEpisodeSession(episodeId)
      .then((session) => {
        if (cancelled) return;
        if (!session.currentActivity) {
          navigate(`/course/${episodeId}`, { replace: true });
          return;
        }
        startedAtRef.current = Date.now();
        setAnswer("");
        setState({
          status: "active",
          sessionId: session.sessionId,
          kind: session.kind,
          episodeId,
          title: session.episode.situationTitle ?? session.episode.title,
          activity: session.currentActivity,
          submitting: false,
          feedback: null,
          pendingNext: null,
          dialogue: [
            { id: "open", from: "them", text: openingLine(episodeId) },
          ],
          misses: 0,
          hintUsed: false,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [episodeId, navigate]);

  async function submit(value: string) {
    if (state.status !== "active" || state.submitting) return;
    const current = state;
    setState({ ...current, submitting: true });

    try {
      const res = await answerActivity(current.sessionId, {
        activityId: current.activity.id,
        answer: value,
        responseTimeMs: Date.now() - startedAtRef.current,
        attemptId: crypto.randomUUID(),
      });

      if (isCard(current.activity.kind)) {
        advance(current, res.session, current.dialogue);
        return;
      }

      // What the learner said now belongs to the conversation — spoken
      // correctly by them, or spoken correctly *for* them after a miss.
      const said = spokenAnswer(current.activity, value, res.feedback);
      const dialogue = said
        ? [
            ...current.dialogue,
            {
              id: `${current.activity.id}-said`,
              from: "you" as const,
              text: said,
            },
          ]
        : current.dialogue;

      setState({
        ...current,
        submitting: false,
        feedback: res.feedback,
        pendingNext: res.session,
        dialogue,
        misses: res.feedback.correct ? current.misses : current.misses + 1,
      });
    } catch {
      setState({ status: "error" });
    }
  }

  function advance(
    current: Active,
    session: AnswerSessionResponse["session"],
    dialogue: DialogueLine[],
  ) {
    if (session.status === "completed") {
      navigate(`/course/${current.episodeId}/result/${current.sessionId}`, {
        replace: true,
        state: { result: session.result },
      });
      return;
    }
    startedAtRef.current = Date.now();
    setAnswer("");
    setState({
      ...current,
      activity: session.nextActivity,
      submitting: false,
      feedback: null,
      pendingNext: null,
      dialogue,
      misses: 0,
      // A new mini-scene: Kvo is allowed to speak once again.
      hintUsed: false,
    });
  }

  if (state.status === "loading") {
    return <LoadingScreen note="Заходим в ситуацию" />;
  }

  if (state.status === "error") {
    return (
      <div className="center-screen">
        <ErrorState
          title="Занятие прервалось"
          message="Прогресс сохранён — можно продолжить с того же места."
          onRetry={() => navigate(`/course/${episodeId}`)}
        />
      </div>
    );
  }

  const { activity, feedback, submitting, kind, misses, hintUsed } = state;
  const { scene, cast } = sceneForSituation(state.episodeId);
  const card = isCard(activity.kind);
  const canSubmit = card || answer.trim().length > 0;

  // Kvo speaks at most once per mini-scene, and only after a real miss.
  const kvoHint =
    hintUsed && !feedback ? "Слушай ситуацию, а не отдельные слова." : null;

  const castState: CastState = feedback
    ? feedback.correct
      ? "smiling"
      : "speaking"
    : card
      ? "listening"
      : answer.trim().length > 0
        ? "listening"
        : "speaking";

  return (
    <div className="lesson-screen">
      <div className="lesson-top">
        <IconButton
          label="Выйти"
          onClick={() => navigate(`/course/${state.episodeId}`)}
        >
          <IconClose size={19} />
        </IconButton>
        <div className="seg-progress">
          {Array.from({ length: activity.progress.total }).map((_, i) => (
            <span
              key={i}
              className={i < activity.progress.current ? "seg is-on" : "seg"}
            />
          ))}
        </div>
        <span className="lesson-top__label">
          {kind === "mission" ? "Миссия" : state.title}
        </span>
      </div>

      <SceneStage
        scene={scene}
        cast={cast}
        castState={castState}
        dialogue={state.dialogue}
        kvoHint={kvoHint}
        kvoState={misses > 0 ? "thinking" : "idle"}
        label={
          kind === "mission" ? (
            <>
              <b style={{ color: "var(--violet-600)" }}>Миссия</b> ·{" "}
              {state.title}
            </>
          ) : (
            sceneChip(scene)
          )
        }
      />

      <div className="task-sheet">
        <div className="sheet-grabber" aria-hidden="true" />

        {kind === "mission" ? (
          <div className="mission-log">
            {state.dialogue.map((line) =>
              line.pending ? null : (
                <div
                  key={line.id}
                  className={
                    line.from === "you"
                      ? "mission-log__row mission-log__row--you"
                      : "mission-log__row"
                  }
                >
                  {line.from === "them" ? (
                    <span className="mission-log__from">{CAST[cast].name}</span>
                  ) : null}
                  <span className="mission-log__bubble en">{line.text}</span>
                </div>
              ),
            )}
          </div>
        ) : null}

        <ActivityPanel
          key={activity.id}
          activity={activity}
          answer={answer}
          onAnswerChange={setAnswer}
          feedback={feedback}
          disabled={submitting || !!feedback}
        />

        {feedback && !feedback.correct ? (
          <div className="miss">
            <span className="miss__title">Не расслышала</span>
            <span className="miss__answer en">{feedback.correctAnswer}</span>
            {feedback.explanation ? (
              <span className="miss__note">{feedback.explanation}</span>
            ) : null}
          </div>
        ) : null}

        <div className="task-sheet__cta">
          {feedback ? (
            <Button
              onClick={() =>
                state.pendingNext &&
                advance(state, state.pendingNext, state.dialogue)
              }
            >
              Дальше <IconArrowRight size={18} />
            </Button>
          ) : (
            <Button
              disabled={!canSubmit || submitting}
              onClick={() => submit(card ? "" : answer)}
            >
              {submitting ? (
                "Проверяем…"
              ) : card ? (
                "Понятно"
              ) : (
                <>
                  Ответить <IconArrowRight size={18} />
                </>
              )}
            </Button>
          )}
          {!feedback && misses > 0 && !hintUsed ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setState({ ...state, hintUsed: true })}
            >
              Не знаю, подсказать
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** What the learner actually said, in English, for the transcript. */
function spokenAnswer(
  activity: ActivityDTO,
  value: string,
  feedback: AnswerFeedback,
): string | null {
  if (!feedback.correct) return feedback.correctAnswer;
  switch (activity.kind) {
    case "multiple_choice":
    case "fill_gap_choice":
      return activity.options.find((o) => o.id === value)?.text ?? null;
    case "typed_recall":
    case "sentence_build":
      return value.trim() || null;
    default:
      return null;
  }
}
