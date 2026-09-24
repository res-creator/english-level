import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { LessonContentDTO } from "@english-level/contracts";
import { getEpisodeContent } from "../api/productClient.ts";
import { SceneBackdrop } from "../brand/scenes.tsx";
import { ArtLayer } from "../brand/Art.tsx";
import { artName } from "../brand/artRegistry.ts";
import { sceneForSituation } from "../brand/situationScenes.ts";
import { CastMember } from "../brand/cast.tsx";
import { Button, IconButton } from "../ui/Button.tsx";
import { SkeletonList, ErrorState } from "../ui/states.tsx";
import { IconArrowLeft, IconCheck, IconClock } from "../ui/icons.tsx";
import { resolveStartCtaLabel } from "./lessonPreviewCta.ts";

type State =
  | { status: "loading" }
  | { status: "ready"; episode: LessonContentDTO }
  | { status: "error" };

/**
 * The situation before the language.
 *
 * The scene sets up where you are and who is waiting; the capability says
 * what you will be able to do afterwards. There is deliberately no word
 * list and no grammar syllabus here — a preview that shows the vocabulary
 * turns a situation back into a lesson.
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
        <SkeletonList rows={1} height={240} />
        <SkeletonList rows={3} height={44} />
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="stack-lg">
        <ErrorState
          title="Ситуация не открылась"
          message="Попробуй ещё раз или вернись к курсу."
          onRetry={load}
        />
        <Button variant="secondary" onClick={() => navigate("/course")}>
          К курсу
        </Button>
      </section>
    );
  }

  const { episode } = state;
  const { scene, cast } = sceneForSituation(episode.id);

  return (
    <div className="preview-screen">
      <div className="preview-screen__scene">
        <ArtLayer
          name={artName.sceneBackground(scene)}
          priority
          fallback={<SceneBackdrop scene={scene} />}
        />
        <div className="preview-screen__back">
          <IconButton label="Назад" onClick={() => navigate("/course")}>
            <IconArrowLeft size={19} />
          </IconButton>
        </div>
        <div className="preview-screen__person">
          <CastMember cast={cast} state="smiling" width={210} />
        </div>
        <ArtLayer
          name={artName.sceneForeground(scene)}
          className="scene__foreground"
        />
      </div>

      <div className="preview-screen__sheet">
        <span className="small muted">{episode.moduleTitle}</span>
        <h1 className="h1">{episode.situationTitle ?? episode.title}</h1>

        {episode.scene ? <p className="body muted">{episode.scene}</p> : null}

        {episode.capability ? (
          <div className="stack-sm">
            <h2 className="h3">После этой ситуации ты сможешь…</h2>
            <div className="can-row">
              <span className="can-row__mark" aria-hidden="true">
                <IconCheck size={15} />
              </span>
              <span className="can-row__text">{episode.capability}</span>
            </div>
          </div>
        ) : null}

        <div className="preview-screen__cta">
          {episode.estimatedMinutes ? (
            <span className="duration-chip">
              <IconClock size={15} />~{episode.estimatedMinutes} мин
            </span>
          ) : null}
          <Button onClick={() => navigate(`/course/${episode.id}/session`)}>
            {resolveStartCtaLabel(episode.progressStatus)}
          </Button>
        </div>
      </div>
    </div>
  );
}
