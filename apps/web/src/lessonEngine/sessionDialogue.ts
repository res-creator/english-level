import type {
  ActivityDTO,
  AnswerFeedback,
  EpisodeSessionDTO,
} from "@english-level/contracts";
import type { DialogueLine } from "../scene/dialogueTypes.ts";
import { openingLine } from "../brand/situationScenes.ts";

/** The opener belongs to the situation, not to every slice or resume. */
export function initialSessionDialogue(
  session: Pick<EpisodeSessionDTO, "kind" | "sessionIndex" | "currentActivity">,
  episodeId: string,
): DialogueLine[] {
  if (session.kind !== "lesson" || session.sessionIndex !== 1) return [];
  return [{ id: "open", from: "them", text: openingLine(episodeId) }];
}

/** A submitted exercise is not necessarily a completed spoken turn.
 * Incorrect attempts stay in exercise feedback; they do not put a corrected
 * answer in the learner's mouth or trigger an NPC continuation. */
export function appendCompletedTurn(
  dialogue: DialogueLine[],
  activity: ActivityDTO,
  answer: string,
  feedback: AnswerFeedback,
): DialogueLine[] {
  if (
    !feedback.correct ||
    !("dialogueTurnId" in activity) ||
    !activity.dialogueTurnId
  )
    return dialogue;
  const id = `turn:${activity.dialogueTurnId}`;
  if (dialogue.some((line) => line.id === `${id}:learner`)) return dialogue;

  let text: string;
  switch (activity.kind) {
    case "fill_gap_choice": {
      const option = activity.options.find((o) => o.id === answer);
      if (!option) return dialogue;
      text = activity.content.sentence.replace("___", () => option.text);
      break;
    }
    case "sentence_build":
    case "typed_recall":
      text = answer.trim();
      break;
    default:
      return dialogue;
  }
  if (!text) return dialogue;
  const lines: DialogueLine[] = [
    ...dialogue,
    { id: `${id}:learner`, from: "you", text },
  ];
  if (activity.npcReply) {
    lines.push({
      id: `${id}:npc`,
      from: "them",
      text: activity.npcReply.correct,
    });
  }
  return lines;
}
