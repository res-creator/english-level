import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  ChapterDTO,
  CourseResponse,
  EpisodeDTO,
} from "@english-level/contracts";
import { getCourse } from "../api/productClient.ts";
import { ProgressBar } from "../ui/ProgressBar.tsx";
import { SkeletonJourney, ErrorState, EmptyState } from "../ui/states.tsx";
import { IconCheck, IconPlay } from "../ui/icons.tsx";
import { UnitScene } from "../brand/illustrations.tsx";
import { levelTitle } from "../ui/labels.tsx";

type State =
  | { status: "loading" }
  | { status: "ready"; course: CourseResponse }
  | { status: "error" };

/**
 * The course is one scrollable path of situations. There are no locks:
 * exactly one situation is "you are here", everything before it is done
 * and everything after it is simply ahead.
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
          title="Программа для этого уровня готовится"
          message="Мы дорабатываем ситуации для твоего уровня — загляни чуть позже."
        />
      </section>
    );
  }

  const percent =
    course.episodesTotal === 0
      ? 0
      : Math.round((100 * course.episodesDone) / course.episodesTotal);

  return (
    <section className="journey">
      <header className="journey-head has-blobs">
        <div
          className="blob blob-blush"
          style={{ width: 150, height: 150, top: -60, right: -50 }}
        />
        <span className="eyebrow muted">Твой путь</span>
        <h1 className="h1">{levelTitle(course.level)}</h1>
        <div className="stack-sm">
          <div className="row-between">
            <span className="small muted">
              {course.episodesDone} из {course.episodesTotal} ситуаций освоено
            </span>
            <span className="caption num">{percent}%</span>
          </div>
          <ProgressBar percent={percent} />
        </div>
      </header>

      {course.chapters.map((chapter, index) => (
        <ChapterSection
          key={chapter.id}
          chapter={chapter}
          index={index}
          currentEpisodeId={course.currentEpisodeId}
        />
      ))}

      <p className="caption muted" style={{ textAlign: "center" }}>
        Следующие уровни откроются, когда закончишь этот
      </p>
    </section>
  );
}

function ChapterSection({
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
  const isDone = done === chapter.episodes.length && done > 0;
  const holdsCurrent = chapter.episodes.some((e) => e.id === currentEpisodeId);

  const bannerClass = holdsCurrent
    ? "unit__banner unit__banner--current"
    : isDone
      ? "unit__banner unit__banner--done"
      : "unit__banner";

  return (
    <section className="unit">
      <div className={bannerClass}>
        <span className="unit__scene" aria-hidden="true">
          <UnitScene index={index} />
        </span>
        <span className="unit__label">
          <span className="unit__index">Глава {index + 1}</span>
          <span className="unit__title">{chapter.title}</span>
          <span className="unit__meta">
            {done} / {chapter.episodes.length} ситуаций
            {isDone ? " · пройдена" : ""}
          </span>
        </span>
      </div>

      <div className="nodes">
        {chapter.episodes.map((episode, i) => (
          <EpisodeNode
            key={episode.id}
            episode={episode}
            position={i + 1}
            isCurrent={episode.id === currentEpisodeId}
          />
        ))}
      </div>
    </section>
  );
}

function EpisodeNode({
  episode,
  position,
  isCurrent,
}: {
  episode: EpisodeDTO;
  position: number;
  isCurrent: boolean;
}) {
  const navigate = useNavigate();
  const earned = episode.state === "can_do" || episode.state === "consolidated";
  const modifier = earned ? " node--done" : isCurrent ? " node--current" : "";

  return (
    <button
      type="button"
      className={"node" + modifier}
      onClick={() => navigate(`/course/${episode.id}`)}
    >
      <span className="node__rail">
        <span className="node__line" aria-hidden="true" />
        <span className="node__dot">
          {earned ? (
            <IconCheck size={20} />
          ) : isCurrent ? (
            <IconPlay size={22} />
          ) : (
            position
          )}
        </span>
      </span>
      <span className="node__body">
        <span className="node__title">
          {episode.situationTitle ?? episode.title}
        </span>
        <span className="node__meta">
          {episode.state === "consolidated" ? (
            <span className="tag tag-green">Закреплено</span>
          ) : episode.state === "can_do" ? (
            <span className="tag tag-green">Могу</span>
          ) : episode.missionReady ? (
            <span className="tag tag-blush">Миссия</span>
          ) : episode.state === "learning" ? (
            <span className="tag">
              Заход {episode.sessionsDone + 1}
              {episode.sessionsTotal > 0 ? ` из ${episode.sessionsTotal}` : ""}
            </span>
          ) : episode.estimatedMinutes ? (
            <span className="tag">~{episode.estimatedMinutes} мин</span>
          ) : null}
          {isCurrent && !earned ? (
            <span className="tag tag-green">Сейчас</span>
          ) : null}
        </span>
      </span>
    </button>
  );
}
