import type { ReactNode } from "react";
import { IconButton } from "../ui/Button.tsx";
import { IconArrowLeft } from "../ui/icons.tsx";
import { useTelegramBackButton } from "../telegram/useTelegramBackButton.ts";

const TOTAL_STEPS = 3;

/**
 * One shared frame for every onboarding question — the same top-bar
 * plus one-sheet composition as a session or the placement test
 * (lesson-screen / lesson-top / task-sheet), because onboarding asks
 * exactly one thing at a time in the same rhythm those do. No separate
 * "form" look: a question is a question everywhere in this product.
 */
export function OnboardingStep({
  step,
  title,
  subtitle,
  onBack,
  children,
  footer,
}: {
  step: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  useTelegramBackButton(onBack);

  return (
    <div className="lesson-screen">
      <div className="lesson-top">
        {onBack ? (
          <IconButton label="Назад" onClick={onBack}>
            <IconArrowLeft size={19} />
          </IconButton>
        ) : (
          <span style={{ width: 40 }} />
        )}
        <div className="seg-progress">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span key={i} className={i < step ? "seg is-on" : "seg"} />
          ))}
        </div>
        <span className="lesson-top__label">
          {step} / {TOTAL_STEPS}
        </span>
      </div>

      {/* No scene above this — a question, not a situation — so the
          sheet sits directly under the top bar. */}
      <div className="task-sheet" style={{ marginTop: 0 }}>
        <h1 className="task-sheet__title">{title}</h1>
        {subtitle ? <p className="body muted">{subtitle}</p> : null}

        {children}

        <div className="task-sheet__cta">{footer}</div>
      </div>
    </div>
  );
}
