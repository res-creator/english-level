import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TodayResponse } from "@english-level/contracts";
import { useAuth } from "../auth/useAuth.ts";
import { getToday } from "../api/productClient.ts";
import { Button } from "../ui/Button.tsx";
import { ProgressBar } from "../ui/ProgressBar.tsx";
import { SkeletonList } from "../ui/states.tsx";
import { HeroArt } from "../brand/illustrations.tsx";
import { levelTitle } from "../ui/labels.tsx";
import { plural, resolveTodayCta, resolveTodayEyebrow } from "./todayCopy.ts";

type State =
  | { status: "loading" }
  | { status: "ready"; data: TodayResponse }
  // A failed load still lets the learner reach the course — Today never
  // blocks the one thing it exists for.
  | { status: "degraded" };

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

/**
 * Today answers one question — what do I do right now — and the server
 * gives exactly one answer. Everything else on the screen is context, and
 * every number on it is real.
 */
export function Today() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    getToday()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "degraded" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = auth.user?.firstName ?? "";
  const level = auth.user?.currentCefrLevel;
  const data = state.status === "ready" ? state.data : null;

  return (
    <section className="stack-lg">
      <header className="stack-sm">
        <span className="eyebrow muted">{greeting()}</span>
        <div className="row-between">
          <h1 className="h1">{firstName || "Рады видеть"}</h1>
          {level ? <span className="pill">{levelTitle(level)}</span> : null}
        </div>
      </header>

      {data?.daysAway ? <WelcomeBack days={data.daysAway} /> : null}

      {state.status === "loading" ? (
        <SkeletonList rows={1} height={210} />
      ) : data && data.episode ? (
        <TodayHero data={data} episode={data.episode} />
      ) : (
        <FallbackHero
          degraded={state.status === "degraded"}
          reviewDue={data?.reviewDue ?? 0}
        />
      )}

      {data && data.reviewDue > 0 && data.action !== "review" ? (
        <button
          type="button"
          className="row-card"
          onClick={() => navigate("/review")}
        >
          <span className="row-card__body">
            <span className="row-card__title">Повторение</span>
            <span className="row-card__meta">
              {data.reviewDue}{" "}
              {plural(data.reviewDue, "фраза", "фразы", "фраз")} ждут второго
              захода
            </span>
          </span>
          <span className="row-card__chevron" aria-hidden="true">
            →
          </span>
        </button>
      ) : null}

      {data?.weeklyGoal ? <WeeklyGoal goal={data.weeklyGoal} /> : null}

      {data && (data.capabilities.canDo > 0 || data.chapterProgress) ? (
        <div className="stat-strip">
          <div className="stat-strip__item">
            <span className="stat-strip__value num">
              {data.capabilities.canDo}
            </span>
            <span className="stat-strip__label">Умею по-английски</span>
          </div>
          {data.chapterProgress ? (
            <div className="stat-strip__item">
              <span className="stat-strip__value num">
                {data.chapterProgress.done}/{data.chapterProgress.total}
              </span>
              <span className="stat-strip__label">Ситуаций в главе</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function TodayHero({
  data,
  episode,
}: {
  data: TodayResponse;
  episode: NonNullable<TodayResponse["episode"]>;
}) {
  const navigate = useNavigate();
  const isMission = data.action === "mission";
  const inProgress = episode.sessionsDone > 0 && !isMission;

  return (
    <article className="hero">
      <div className="hero__art" aria-hidden="true">
        <HeroArt />
      </div>
      <div className="hero__head">
        <span className="eyebrow" style={{ opacity: 0.85 }}>
          {resolveTodayEyebrow(data.action, episode)}
        </span>
        <h2 className="hero__lesson">
          {episode.situationTitle ?? episode.title}
        </h2>
        {episode.capability ? (
          <p className="hero__capability">{episode.capability}</p>
        ) : null}
      </div>

      {episode.sessionsTotal > 0 && !isMission ? (
        <div className="stack-sm">
          <div className="hero__meta">
            <span>
              Заход {Math.min(episode.sessionsDone + 1, episode.sessionsTotal)}{" "}
              из {episode.sessionsTotal}
            </span>
            {data.estimatedMinutes ? (
              <span className="num">~{data.estimatedMinutes} мин</span>
            ) : null}
          </div>
          <ProgressBar
            percent={Math.round(
              (100 * episode.sessionsDone) / episode.sessionsTotal,
            )}
            thin
            onGreen
          />
        </div>
      ) : null}

      <div className="hero__cta">
        <Button
          variant="onGreen"
          onClick={() => navigate(`/course/${episode.id}/session`)}
        >
          {resolveTodayCta(data.action, episode)}
        </Button>
      </div>
    </article>
  );
}

function FallbackHero({
  degraded,
  reviewDue,
}: {
  degraded: boolean;
  reviewDue: number;
}) {
  const navigate = useNavigate();
  if (reviewDue > 0) {
    return (
      <article className="hero">
        <div className="hero__art" aria-hidden="true">
          <HeroArt />
        </div>
        <div className="hero__head">
          <span className="eyebrow" style={{ opacity: 0.85 }}>
            Сегодня
          </span>
          <h2 className="hero__lesson">Освежим то, что уже знаешь</h2>
        </div>
        <div className="hero__cta">
          <Button variant="onGreen" onClick={() => navigate("/review")}>
            Повторить
          </Button>
        </div>
      </article>
    );
  }

  return (
    <article className="hero">
      <div className="hero__art" aria-hidden="true">
        <HeroArt />
      </div>
      <div className="hero__head">
        <span className="eyebrow" style={{ opacity: 0.85 }}>
          {degraded ? "Курс" : "Всё пройдено"}
        </span>
        <h2 className="hero__lesson">
          {degraded
            ? "Открой курс и продолжай"
            : "Ты прошла все ситуации этого уровня"}
        </h2>
      </div>
      <div className="hero__cta">
        <Button variant="onGreen" onClick={() => navigate("/course")}>
          Открыть курс
        </Button>
      </div>
    </article>
  );
}

/** Returning is never framed as a debt or a broken streak. */
function WelcomeBack({ days }: { days: number }) {
  return (
    <div className="panel-blush stack-sm">
      <span className="caption" style={{ color: "var(--accent-ink)" }}>
        С возвращением
      </span>
      <p className="small" style={{ color: "var(--ink-700)" }}>
        Тебя не было {days} {plural(days, "день", "дня", "дней")}. Ничего не
        потеряно — начнём с короткого захода.
      </p>
    </div>
  );
}

function WeeklyGoal({
  goal,
}: {
  goal: NonNullable<TodayResponse["weeklyGoal"]>;
}) {
  const total = goal.mine + (goal.friendDone ?? 0);
  const percent = Math.min(100, Math.round((100 * total) / goal.target));
  return (
    <div className="panel stack-sm">
      <div className="row-between">
        <span className="caption">
          {goal.friendName ? `Вместе с ${goal.friendName}` : "Общая цель"}
        </span>
        <span className="caption num">
          {total} / {goal.target}
        </span>
      </div>
      <ProgressBar percent={percent} thin />
      <p className="small muted">
        {goal.completed
          ? "Цель недели закрыта — вы оба справились."
          : "Занятия складываются в одну общую цель на неделю."}
      </p>
    </div>
  );
}
