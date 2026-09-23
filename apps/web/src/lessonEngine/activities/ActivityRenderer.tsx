import type { ActivityDTO, AnswerFeedback } from "@english-level/contracts";
import { InfoCard } from "./InfoCard.tsx";
import { GrammarCard } from "./GrammarCard.tsx";
import { ChoiceActivity } from "./ChoiceActivity.tsx";
import { TypedRecall } from "./TypedRecall.tsx";
import { SentenceBuild } from "./SentenceBuild.tsx";

export interface ActivityViewProps {
  answer: string;
  onAnswerChange: (value: string) => void;
  feedback: AnswerFeedback | null;
  disabled: boolean;
}

interface Props extends ActivityViewProps {
  activity: ActivityDTO;
}

/**
 * ActivityDTO.kind -> presentation. The only place that knows about every
 * activity kind. The lesson engine decides what to show; this decides how
 * it looks.
 */
export function ActivityRenderer({ activity, ...view }: Props) {
  switch (activity.kind) {
    case "info_card":
      return <InfoCard content={activity.content} />;
    case "grammar_card":
      return <GrammarCard content={activity.content} />;
    case "multiple_choice":
      return (
        <ChoiceActivity
          kicker="Выбери ответ"
          prompt={activity.prompt}
          context={activity.content.text}
          options={activity.options}
          {...view}
        />
      );
    case "fill_gap_choice":
      return (
        <ChoiceActivity
          kicker="Заполни пропуск"
          prompt={activity.prompt}
          sentence={activity.content.sentence}
          options={activity.options}
          {...view}
        />
      );
    case "typed_recall":
      return (
        <TypedRecall
          prompt={activity.prompt}
          content={activity.content}
          {...view}
        />
      );
    case "sentence_build":
      return <SentenceBuild content={activity.content} {...view} />;
  }
}
