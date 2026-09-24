import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { LessonContentDTO } from "@english-level/contracts";
import { getEpisodeContent } from "../api/productClient.ts";
import { SceneStage, sceneChip } from "../scene/SceneStage.tsx";
import { openingLine, sceneForSituation } from "../brand/situationScenes.ts";
import { Button, IconButton } from "../ui/Button.tsx";
import { SkeletonList, ErrorState } from "../ui/states.tsx";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconStack,
} from "../ui/icons.tsx";
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
  const stepCount = episode.content.length;

  return (
    <div className="preview-screen">
      <div className="preview-screen__stage">
        <div className="preview-screen__back">
          <IconButton label="Назад" onClick={() => navigate("/course")}>
            <IconArrowLeft size={19} />
          </IconButton>
        </div>
        <SceneStage
          scene={scene}
          cast={cast}
          castState="smiling"
          dialogue={[
            { id: "open", from: "them", text: openingLine(episode.id) },
          ]}
          label={sceneChip(scene)}
        />
      </div>

      <div className="preview-screen__sheet">
        <div className="sheet-grabber" aria-hidden="true" />
        <h1 className="h1">{episode.situationTitle ?? episode.title}</h1>

        {episode.scene ? <p className="body muted">{episode.scene}</p> : null}

        <div className="preview-screen__meta">
          {episode.estimatedMinutes ? (
            <span className="duration-chip">
              <IconClock size={15} />~{episode.estimatedMinutes} мин
            </span>
          ) : null}
          {stepCount ? (
            <span className="duration-chip">
              <IconStack size={15} />
              {stepCount} {stepsWord(stepCount)}
            </span>
          ) : null}
        </div>

        {episode.capability ? (
          <div className="stack-sm">
            <span className="overline">После этой ситуации ты сможешь</span>
            <div className="can-row">
              <span className="can-row__mark" aria-hidden="true">
                <IconCheck size={15} />
              </span>
              <span className="can-row__text">{episode.capability}</span>
            </div>
          </div>
        ) : null}

        <div className="preview-screen__cta">
          <Button onClick={() => navigate(`/course/${episode.id}/session`)}>
            {resolveStartCtaLabel(episode.progressStatus)}{" "}
            <IconArrowRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function stepsWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "шаг";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100))
    return "шага";
  return "шагов";
}
