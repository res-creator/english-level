import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  ChapterDTO,
  CourseResponse,
  EpisodeDTO,
} from "@english-level/contracts";
import { getCourse } from "../api/productClient.ts";
import { Kvo } from "../brand/Kvo.tsx";
import { Button } from "../ui/Button.tsx";
import { SkeletonJourney, ErrorState, EmptyState } from "../ui/states.tsx";
import { IconCheck, IconLock, IconPlay } from "../ui/icons.tsx";
import { situationGlyph } from "./situationGlyph.tsx";
import {
  LOCKED_NODE_MESSAGE,
  resolvePathNodeState,
} from "./coursePathState.ts";

type State =
  | { status: "loading" }
  | { status: "ready"; course: CourseResponse }
  | { status: "error" };

/**
 * The course is a path, not a list of lessons.
 *
 * Nodes alternate left and right down the screen, joined by a line that
 * is solid behind you and dotted ahead. Exactly one node is "you are
 * here", and it is the only one carrying a card and a way in — so the
 * screen never asks the learner to choose where to start.
 */
export function Course() {
  const [state, setState] = useState<State>({ status: "loading" });

  function load() {
    setState({ status: "loading" });
    getCourse()
      .then((course) => setState({ status: "ready", course }))
      .catch(() => setState({ status: "error" }));
  }

  useEffect(load, []);

  if (state.status === "loading") {
    return (
      <section className="stack-lg">
        <h1 className="h1">Курс</h1>
        <SkeletonJourney />
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="stack-lg">
        <h1 className="h1">Курс</h1>
        <ErrorState
          title="Курс не загрузился"
          message="Проверь связь — и попробуй ещё раз."
          onRetry={load}
        />
      </section>
    );
  }

  const { course } = state;

  if (!course.level) {
    return (
      <section className="stack-lg">
        <h1 className="h1">Курс</h1>
        <EmptyState
          title="Курс появится после теста"
          message="Пройди короткий тест — и мы соберём программу под твой уровень."
        />
      </section>
    );
  }

  if (course.chapters.length === 0) {
    return (
      <section className="stack-lg">
        <h1 className="h1">Курс</h1>
        <EmptyState
          title="Ситуации для этого уровня готовятся"
          message="Загляни чуть позже — мы дорабатываем главу."
        />
      </section>
    );
  }

  return (
    <section className="stack-lg">
      {course.chapters.map((chapter, index) => (
        <ChapterPath
          key={chapter.id}
          chapter={chapter}
          index={index}
          currentEpisodeId={course.currentEpisodeId}
        />
      ))}
    </section>
  );
}

function ChapterPath({
  chapter,
  index,
  currentEpisodeId,
}: {
  chapter: ChapterDTO;
  index: number;
  currentEpisodeId: string | null;
}) {
  const done = chapter.episodes.filter(
    (e) => e.state === "can_do" || e.state === "consolidated",
  ).length;

  return (
    <div className="path">
      <header className="path__head">
        <h1 className="h1">{index === 0 ? "Курс" : "Дальше"}</h1>
        <div className="row-between">
          <span className="body muted">
            Глава {index + 1} · {chapter.title}
          </span>
          <span className="pill">
            {done} из {chapter.episodes.length}
          </span>
        </div>
      </header>

      <ol className="path__list">
        {chapter.episodes.map((episode, i) => (
          <PathNode
            key={episode.id}
            episode={episode}
            position={i + 1}
            side={i % 2 === 0 ? "right" : "left"}
            isCurrent={episode.id === currentEpisodeId}
            isLast={i === chapter.episodes.length - 1}
          />
        ))}
      </ol>
    </div>
  );
}

function PathNode({
  episode,
  position,
  side,
  isCurrent,
  isLast,
}: {
  episode: EpisodeDTO;
  position: number;
  side: "left" | "right";
  isCurrent: boolean;
  isLast: boolean;
}) {
  const navigate = useNavigate();
  const nodeState = resolvePathNodeState(episode, isCurrent);
  const earned = nodeState === "done";
  const locked = nodeState === "locked";

  const stateClass =
    nodeState === "done"
      ? "is-done"
      : nodeState === "current"
        ? "is-current"
        : nodeState === "started"
          ? "is-started"
          : "is-ahead";

  // A locked situation stays visible — title, number, everything — it
  // just can't be opened yet. Public V1 is a sequential path: the
  // Mission before it has to pass first.
  function open() {
    if (locked) return;
    navigate(`/course/${episode.id}`);
  }

  return (
    <li className={`node2 node2--${side} ${stateClass}`}>
      {!isLast ? (
        <span
          className={earned ? "node2__link is-solid" : "node2__link"}
          aria-hidden="true"
        />
      ) : null}

      {isCurrent ? (
        <span className="node2__kvo" aria-hidden="true">
          <Kvo size={82} state="idle" flip={side === "left"} />
        </span>
      ) : null}

      <button
        type="button"
        className="node2__dot"
        onClick={open}
        disabled={locked}
        aria-label={
          locked
            ? `${episode.situationTitle ?? episode.title}: ${LOCKED_NODE_MESSAGE}`
            : (episode.situationTitle ?? episode.title)
        }
      >
        {earned ? (
          <IconCheck size={24} />
        ) : locked ? (
          <IconLock size={22} />
        ) : (
          situationGlyph(episode.id, position)
        )}
        {earned ? <i className="node2__badge" aria-hidden="true" /> : null}
      </button>

      {isCurrent ? (
        <div className="node2__card">
          <span className="tag tag-blush">
            {episode.missionReady ? "Миссия" : "Сейчас"}
          </span>
          <h2 className="h3">{episode.situationTitle ?? episode.title}</h2>
          <p className="small muted">
            {episode.estimatedMinutes ? `~${episode.estimatedMinutes} мин` : ""}
            {episode.sessionsTotal > 0
              ? ` · шаг ${Math.min(
                  episode.sessionsDone + 1,
                  episode.sessionsTotal,
                )} из ${episode.sessionsTotal}`
              : ""}
          </p>
          <Button onClick={() => navigate(`/course/${episode.id}/session`)}>
            <IconPlay size={16} />{" "}
            {episode.sessionsDone > 0 ? "Продолжить" : "Начать"}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          className="node2__label"
          onClick={open}
          disabled={locked}
        >
          <span className="node2__title">
            {episode.situationTitle ?? episode.title}
          </span>
          <span className="node2__meta">
            {locked
              ? LOCKED_NODE_MESSAGE
              : earned
                ? episode.state === "consolidated"
                  ? "Закреплено"
                  : "Пройдено"
                : `Заход ${episode.sessionsDone + 1}`}
          </span>
        </button>
      )}
    </li>
  );
}
