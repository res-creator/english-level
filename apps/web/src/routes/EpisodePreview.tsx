import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { LessonContentDTO } from "@english-level/contracts";
import { getEpisodeContent } from "../api/productClient.ts";
import {
  resolveStartCtaKicker,
  resolveStartCtaLabel,
} from "./lessonPreviewCta.ts";
import { TopBar } from "../ui/TopBar.tsx";
import { Button } from "../ui/Button.tsx";
import { SkeletonList, ErrorState } from "../ui/states.tsx";
import { IconClock, IconStack } from "../ui/icons.tsx";
import { LessonCoverArt } from "../brand/illustrations.tsx";

type State =
  | { status: "loading" }
  | { status: "ready"; episode: LessonContentDTO }
  | { status: "error" };

/**
 * The situation before the language. The scene sets up why these phrases
 * matter, the capability says what the learner will be able to do, and
 * only then comes a taste of the words. Sections with no data are not
 * rendered at all.
 */
export function EpisodePreview() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });

  function load() {
    if (!episodeId) return;
    setState({ status: "loading" });
    getEpisodeContent(episodeId)
      .then((episode) => setState({ status: "ready", episode }))
      .catch(() => setState({ status: "error" }));
  }

  useEffect(load, [episodeId]);

  if (state.status === "loading") {
    return (
      <section className="stack-lg">
        <TopBar title="Ситуация" onBack={() => navigate("/course")} />
        <SkeletonList rows={1} height={176} />
        <SkeletonList rows={3} height={44} />
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="stack-lg">
        <TopBar title="Ситуация" onBack={() => navigate("/course")} />
        <ErrorState
          title="Не открылось"
          message="Попробуй ещё раз или вернись к курсу."
          onRetry={load}
        />
      </section>
    );
  }

  const { episode } = state;
  const items = episode.content.filter(
    (entry) => entry.contentType === "learning_item",
  );
  const patterns = episode.content.filter(
    (entry) => entry.contentType === "grammar_pattern",
  );
  const kicker = resolveStartCtaKicker(episode.progressStatus);

  return (
    <section className="stack-lg">
      <TopBar onBack={() => navigate("/course")} />

      <header className="cover">
        <div className="cover__art" aria-hidden="true">
          <LessonCoverArt type={episode.type} />
        </div>
        <span className="cover__eyebrow">{episode.moduleTitle}</span>
        <h1 className="cover__title">
          {episode.situationTitle ?? episode.title}
        </h1>
        <div className="cover__meta">
          {episode.content.length > 0 ? (
            <span className="tag">
              <IconStack size={13} />
              &nbsp;{episode.content.length} тем
            </span>
          ) : null}
          {episode.estimatedMinutes ? (
            <span className="tag">
              <IconClock size={13} />
              &nbsp;{episode.estimatedMinutes} мин
            </span>
          ) : null}
        </div>
      </header>

      {episode.scene ? <p className="body">{episode.scene}</p> : null}

      {episode.capability ? (
        <div className="panel-blush stack-sm">
          <span className="caption" style={{ color: "var(--accent-ink)" }}>
            После этой ситуации
          </span>
          <p className="body" style={{ color: "var(--ink-900)" }}>
            {episode.capability}
          </p>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="stack-sm">
          <span className="eyebrow muted">Что будешь говорить</span>
          <div>
            {items.slice(0, 4).map((entry, idx) =>
              entry.contentType === "learning_item" ? (
                <div className="preview-word" key={`${entry.item.id}-${idx}`}>
                  <span className="preview-word__en">
                    {entry.item.displayForm}
                  </span>
                  <span className="preview-word__ru">
                    {entry.item.translation}
                  </span>
                </div>
              ) : null,
            )}
          </div>
          {items.length > 4 ? (
            <span className="caption muted">
              …и ещё {items.length - 4} в ситуации
            </span>
          ) : null}
        </div>
      ) : null}

      {patterns.length > 0 ? (
        <div className="stack-sm">
          <span className="eyebrow muted">Грамматика ситуации</span>
          {patterns.map((entry, idx) =>
            entry.contentType === "grammar_pattern" ? (
              <div className="outcome" key={`${entry.pattern.id}-${idx}`}>
                <span className="outcome__bullet" aria-hidden="true">
                  ✓
                </span>
                <span className="small">
                  <strong>{entry.pattern.title}</strong>
                  {entry.pattern.formula ? ` · ${entry.pattern.formula}` : ""}
                </span>
              </div>
            ) : null,
          )}
        </div>
      ) : null}

      <div className="preview-cta stack-sm">
        {kicker ? (
          <span className="caption muted" style={{ textAlign: "center" }}>
            {kicker}
          </span>
        ) : null}
        <Button onClick={() => navigate(`/course/${episode.id}/session`)}>
          {resolveStartCtaLabel(episode.progressStatus)}
        </Button>
      </div>
    </section>
  );
}
