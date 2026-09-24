import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TodayAction, TodayResponse } from "@english-level/contracts";
import { getToday } from "../api/productClient.ts";
import { Kvo } from "../brand/Kvo.tsx";
import { ArtLayer } from "../brand/Art.tsx";
import { artName } from "../brand/artRegistry.ts";
import { Button } from "../ui/Button.tsx";
import { SkeletonList, ErrorState } from "../ui/states.tsx";
import {
  IconArrowRight,
  IconClock,
  IconCourse,
  IconPlay,
  IconRefresh,
  IconSparkle,
} from "../ui/icons.tsx";
import { plural, resolveTodayCta, resolveTodayEyebrow } from "./todayCopy.ts";

type State =
  | { status: "loading" }
  | { status: "ready"; data: TodayResponse }
  // A failed load still lets the learner reach the course — Today never
  // blocks the one thing it exists for.
  | { status: "degraded" };

/**
 * Today answers one question: what do I do right now. The server gives
 * exactly one answer, and it gets the whole screen — a single violet card
 * carrying the situation, the person waiting in it and the way in.
 *
 * Everything under the card is context, not a dashboard: a few honest
 * numbers, and review as a quiet chip rather than a permanent tab.
 */
export function Today() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });

  function load() {
    setState({ status: "loading" });
    getToday()
      .then((data) => setState({ status: "ready", data }))
      .catch(() => setState({ status: "degraded" }));
  }

  useEffect(load, []);

  if (state.status === "loading") {
    return (
      <section className="stack-lg">
        <SkeletonList rows={1} height={420} />
        <SkeletonList rows={1} height={72} />
      </section>
    );
  }

  if (state.status === "degraded") {
    return (
      <section className="stack-lg">
        <ErrorState
          title="Не удалось открыть сегодняшний день"
          message="Курс на месте — можно продолжить оттуда."
          onRetry={load}
        />
        <Button variant="secondary" onClick={() => navigate("/course")}>
          Открыть курс
        </Button>
      </section>
    );
  }

  const { data } = state;
  const episode = data.episode;
  const chapter = data.chapterProgress;

  return (
    <section className="stack-lg">
      <span className="small muted">{formatToday()}</span>

      {data.daysAway ? (
        <div className="welcome-back">
          Тебя не было {data.daysAway}{" "}
          {plural(data.daysAway, "день", "дня", "дней")}. Ничего не потеряно —
          начнём с короткого захода.
        </div>
      ) : null}

      {episode ? (
        <TodayCard data={data} episode={episode} />
      ) : (
        <EmptyToday
          action={data.action}
          onReview={() => navigate("/review")}
          onCourse={() => navigate("/course")}
        />
      )}

      <div className="today-stats">
        {data.reviewDue > 0 ? (
          <button
            type="button"
            className="today-stat today-stat--action"
            onClick={() => navigate("/review")}
          >
            <span className="today-stat__icon">
              <IconRefresh size={16} />
            </span>
            <span className="today-stat__value">{data.reviewDue}</span>
            <span className="today-stat__label">
              {plural(data.reviewDue, "фраза", "фразы", "фраз")}
            </span>
          </button>
        ) : null}

        <div className="today-stat">
          <span className="today-stat__icon">
            <IconSparkle size={16} />
          </span>
          <span className="today-stat__value">{data.capabilities.canDo}</span>
          <span className="today-stat__label">
            {/* A situation mid-progress hasn't earned "Я могу" yet — that's
                proven only by a passed Mission, not changing here — but
                saying nothing at all reads as "nothing was saved". */}
            {episode?.state === "learning"
              ? "1 в процессе"
              : plural(data.capabilities.canDo, "умение", "умения", "умений")}
          </span>
        </div>

        {chapter ? (
          <div className="today-stat">
            <span className="today-stat__icon">
              <IconCourse size={16} />
            </span>
            <span className="today-stat__value">{chapter.done}</span>
            <span className="today-stat__label">
              из {chapter.total} пройдено
            </span>
          </div>
        ) : null}
      </div>

      {chapter ? (
        <div className="stack-sm">
          <div className="row-between">
            <h2 className="h3">Твой прогресс</h2>
            <button
              type="button"
              className="link-chevron"
              onClick={() => navigate("/course")}
            >
              {data.chapterTitle ?? "Глава"} · {chapter.done} из {chapter.total}{" "}
              ›
            </button>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar__fill"
              style={{
                width: `${chapter.total ? Math.round((chapter.done / chapter.total) * 100) : 0}%`,
              }}
            />
          </div>
          <div className="today-minis">
            <button
              type="button"
              className="today-mini"
              onClick={() => navigate("/my")}
            >
              <span className="today-mini__icon today-mini__icon--peach">
                <IconSparkle size={17} />
              </span>
              <span className="today-mini__title">
                Я могу · {data.capabilities.canDo}
              </span>
              <span className="today-mini__sub">
                {plural(
                  data.capabilities.canDo,
                  "реальная ситуация",
                  "реальные ситуации",
                  "реальных ситуаций",
                )}
              </span>
            </button>
            <button
              type="button"
              className="today-mini"
              onClick={() => navigate("/course")}
            >
              <span className="today-mini__icon">
                <IconCourse size={17} />
              </span>
              <span className="today-mini__title">
                {data.chapterTitle ?? "Глава"}
              </span>
              <span className="today-mini__sub">
                {chapter.done} из {chapter.total} пройдено
              </span>
            </button>
          </div>
        </div>
      ) : null}

      {data.weeklyGoal ? (
        <div className="panel stack-sm">
          <div className="row-between">
            <span className="caption">
              {data.weeklyGoal.friendName
                ? `Вместе с ${data.weeklyGoal.friendName}`
                : "Общая цель"}
            </span>
            <span className="caption num">
              {data.weeklyGoal.mine + (data.weeklyGoal.friendDone ?? 0)} /{" "}
              {data.weeklyGoal.target}
            </span>
          </div>
          <p className="small muted">
            {data.weeklyGoal.completed
              ? "Цель недели закрыта — вы оба справились."
              : "Занятия обоих складываются в одну цель на неделю."}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function TodayCard({
  data,
  episode,
}: {
  data: TodayResponse;
  episode: NonNullable<TodayResponse["episode"]>;
}) {
  const navigate = useNavigate();
  const isMission = data.action === "mission";
  const step = Math.min(episode.sessionsDone + 1, episode.sessionsTotal || 1);
  const eyebrow = resolveTodayEyebrow(data.action, episode);

  return (
    <article className="today-hero">
      <div className="today-hero__stage ambient-stage">
        {/* Today's own hero backdrop — not tied to any one situation's
            scene, so it stays the same regardless of what's today. */}
        <ArtLayer
          name={artName.heroBackdrop("today")}
          priority
          position="center"
        />
        <div className="today-hero__kvo">
          <Kvo size={148} state={isMission ? "happy" : "idle"} />
        </div>
      </div>

      <div className="today-hero__card">
        <span className="overline">{eyebrow}</span>
        <h1 className="today-hero__title">
          {episode.situationTitle ?? episode.title}
        </h1>
        <p className="today-hero__meta">
          <IconClock size={15} />
          {data.estimatedMinutes
            ? `~${data.estimatedMinutes} минут`
            : "Коротко"}
          {episode.sessionsTotal > 0 && !isMission
            ? ` · шаг ${step} из ${episode.sessionsTotal}`
            : ""}
        </p>

        <Button onClick={() => navigate(`/course/${episode.id}/session`)}>
          <IconPlay size={17} /> {resolveTodayCta(data.action, episode)}{" "}
          <IconArrowRight size={18} />
        </Button>
      </div>
    </article>
  );
}

/**
 * Three genuinely different "nothing to show" states — never collapsed
 * into one, because "unavailable" (this level has no published content
 * yet) is not the same claim as "none" (finished everything it has).
 * Saying the wrong one is saying something false to the learner.
 */
function EmptyToday({
  action,
  onReview,
  onCourse,
}: {
  // Only ever "review" | "none" | "unavailable" in practice — EmptyToday
  // only renders when there's no episode, which "session"/"mission"
  // never leave null. Typed as the full TodayAction anyway so this stays
  // in sync with the server's own type rather than re-declaring a subset.
  action: TodayAction;
  onReview: () => void;
  onCourse: () => void;
}) {
  if (action === "unavailable") {
    return (
      <article className="today-hero">
        <div className="today-hero__stage today-hero__stage--quiet ambient-stage">
          <ArtLayer
            name={artName.heroBackdrop("today")}
            priority
            position="center"
          />
          <div className="today-hero__kvo">
            <Kvo size={130} state="thinking" />
          </div>
        </div>
        <div className="today-hero__card">
          <span className="overline">Сегодня</span>
          <h1 className="today-hero__title">
            Готовим программу для твоего уровня
          </h1>
          <Button onClick={onCourse}>Открыть курс</Button>
        </div>
      </article>
    );
  }

  return (
    <article className="today-hero">
      <div className="today-hero__stage today-hero__stage--quiet ambient-stage">
        <ArtLayer
          name={artName.heroBackdrop("today")}
          priority
          position="center"
        />
        <div className="today-hero__kvo">
          <Kvo size={130} state="happy" />
        </div>
      </div>
      <div className="today-hero__card">
        <span className="overline">Сегодня</span>
        <h1 className="today-hero__title">
          {action === "review"
            ? "Освежим то, что уже знаешь"
            : "Ты прошла все ситуации этого уровня"}
        </h1>
        <Button onClick={action === "review" ? onReview : onCourse}>
          {action === "review" ? "Повторить" : "Открыть курс"}
        </Button>
      </div>
    </article>
  );
}

function formatToday(): string {
  const formatted = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
