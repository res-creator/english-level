import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  ChapterDTO,
  CourseResponse,
  EpisodeDTO,
} from "@english-level/contracts";
import { getCourse } from "../api/productClient.ts";
import { Kvo } from "../brand/Kvo.tsx";
import { ArtLayer } from "../brand/Art.tsx";
import { artName } from "../brand/artRegistry.ts";
import { SceneBackdrop } from "../brand/scenes.tsx";
import { sceneForSituation } from "../brand/situationScenes.ts";
import { Button } from "../ui/Button.tsx";
import { SkeletonJourney, ErrorState, EmptyState } from "../ui/states.tsx";
import { IconArrowRight, IconCheck, IconLock, IconPlay } from "../ui/icons.tsx";
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
 * Every situation stays visible — done, current or locked — in the order
 * you'll reach it. Exactly one is "you are here", and it is the only one
 * carrying a way in, so the screen never asks the learner where to start.
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
  const total = chapter.episodes.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="course-chapter">
      <div className="course-hero">
        <div className="course-hero__kvo">
          <Kvo size={72} state="idle" />
        </div>
        <h1 className="course-hero__title">
          {index === 0 ? "Курс" : "Дальше"}
        </h1>
        <p className="course-hero__subtitle">
          Глава {index + 1} · {chapter.title}
        </p>
      </div>

      <div className="course-progress">
        <span className="small muted">Твой прогресс в курсе</span>
        <div className="row-between">
          <span className="course-progress__count">
            {done} из {total}
          </span>
          <span className="course-progress__pct">{pct}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ol className="situation-list">
        {chapter.episodes.map((episode, i) => (
          <SituationRow
            key={episode.id}
            episode={episode}
            position={i + 1}
            isCurrent={episode.id === currentEpisodeId}
          />
        ))}
      </ol>
    </div>
  );
}

function SituationRow({
  episode,
  position,
  isCurrent,
}: {
  episode: EpisodeDTO;
  position: number;
  isCurrent: boolean;
}) {
  const navigate = useNavigate();
  const nodeState = resolvePathNodeState(episode, isCurrent);
  const earned = nodeState === "done";
  const locked = nodeState === "locked";
  const { scene } = sceneForSituation(episode.id);
  const title = episode.situationTitle ?? episode.title;

  // A locked situation stays visible — title, number, everything — it
  // just can't be opened yet. Public V1 is a sequential path: the
  // Mission before it has to pass first.
  function open() {
    if (locked) return;
    navigate(`/course/${episode.id}`);
  }

  const thumb = (
    <span className="situation-row__thumb" aria-hidden="true">
      <ArtLayer
        name={artName.sceneBackground(scene)}
        fallback={<SceneBackdrop scene={scene} />}
      />
    </span>
  );

  return (
    <li
      className={
        "situation-row" +
        (isCurrent ? " is-current" : "") +
        (locked ? " is-locked" : "")
      }
    >
      <span className="situation-row__badge" aria-hidden="true">
        {earned ? (
          <IconCheck size={17} />
        ) : locked ? (
          <IconLock size={15} />
        ) : (
          position
        )}
      </span>

      {isCurrent ? (
        <div className="situation-row__card">
          {thumb}
          <div className="situation-row__body">
            <span className="tag tag-blush">
              {episode.missionReady ? "Миссия" : "Сейчас"}
            </span>
            <span className="situation-row__title">{title}</span>
            <span className="situation-row__meta">
              {episode.estimatedMinutes
                ? `~${episode.estimatedMinutes} мин`
                : ""}
              {episode.sessionsTotal > 0
                ? ` · шаг ${Math.min(
                    episode.sessionsDone + 1,
                    episode.sessionsTotal,
                  )} из ${episode.sessionsTotal}`
                : ""}
            </span>
            <Button onClick={() => navigate(`/course/${episode.id}/session`)}>
              <IconPlay size={16} />{" "}
              {episode.sessionsDone > 0 ? "Продолжить" : "Начать"}{" "}
              <IconArrowRight size={16} />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="situation-row__card situation-row__card--button"
          onClick={open}
          disabled={locked}
          aria-label={locked ? `${title}: ${LOCKED_NODE_MESSAGE}` : title}
        >
          {thumb}
          <div className="situation-row__body">
            <span className="situation-row__title">{title}</span>
            <span className="situation-row__meta">
              {locked ? (
                <>
                  <IconLock size={12} /> {LOCKED_NODE_MESSAGE}
                </>
              ) : earned ? (
                episode.state === "consolidated" ? (
                  "Закреплено"
                ) : (
                  "Пройдено · можно пройти снова"
                )
              ) : (
                `Заход ${episode.sessionsDone + 1}`
              )}
            </span>
          </div>
        </button>
      )}
    </li>
  );
}
