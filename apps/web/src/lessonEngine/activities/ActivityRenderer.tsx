import type { ActivityDTO } from "@english-level/contracts";
import { InfoCard } from "./InfoCard.tsx";
import { GrammarCard } from "./GrammarCard.tsx";
import { MultipleChoice } from "./MultipleChoice.tsx";
import { FillGapChoice } from "./FillGapChoice.tsx";
import { TypedRecall } from "./TypedRecall.tsx";
import { SentenceBuild } from "./SentenceBuild.tsx";

interface Props {
  activity: ActivityDTO;
  disabled: boolean;
  onSubmit: (answer: string) => void;
}

/** ActivityDTO.kind -> component. The only place that needs to know about
 * every activity kind — nothing else in the lesson session screen does. */
export function ActivityRenderer({ activity, disabled, onSubmit }: Props) {
  switch (activity.kind) {
    case "info_card":
      return (
        <InfoCard
          content={activity.content}
          disabled={disabled}
          onContinue={() => onSubmit("")}
        />
      );
    case "grammar_card":
      return (
        <GrammarCard
          content={activity.content}
          disabled={disabled}
          onContinue={() => onSubmit("")}
        />
      );
    case "multiple_choice":
      return (
        <MultipleChoice
          prompt={activity.prompt}
          content={activity.content}
          options={activity.options}
          disabled={disabled}
          onSubmit={onSubmit}
        />
      );
    case "fill_gap_choice":
      return (
        <FillGapChoice
          prompt={activity.prompt}
          content={activity.content}
          options={activity.options}
          disabled={disabled}
          onSubmit={onSubmit}
        />
      );
    case "typed_recall":
      return (
        <TypedRecall
          prompt={activity.prompt}
          content={activity.content}
          disabled={disabled}
          onSubmit={onSubmit}
        />
      );
    case "sentence_build":
      return (
        <SentenceBuild
          prompt={activity.prompt}
          content={activity.content}
          disabled={disabled}
          onSubmit={onSubmit}
        />
      );
  }
}
