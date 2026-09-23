import type { ReactNode } from "react";
import { FocusShell } from "../components/Layout.tsx";
import { StepProgress } from "../ui/ProgressBar.tsx";
import { IconButton } from "../ui/Button.tsx";
import { IconArrowLeft } from "../ui/icons.tsx";
import { useTelegramBackButton } from "../telegram/useTelegramBackButton.ts";

const TOTAL_STEPS = 3;

/**
 * One shared frame for every onboarding question: progress, one large
 * question, short supporting line, the answer area, and a sticky action.
 * Onboarding is a conversation, not a form — each step asks exactly one
 * thing.
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
    <FocusShell footer={footer}>
      <div className="stack-sm">
        <div className="row" style={{ minHeight: 40 }}>
          {onBack ? (
            <IconButton label="Назад" onClick={onBack}>
              <IconArrowLeft size={20} />
            </IconButton>
          ) : (
            <span className="brand">
              <span className="brand__dot" aria-hidden="true">
                S
              </span>
              Speak in English
            </span>
          )}
          <span className="grow" />
          <span className="caption muted num">
            {step} / {TOTAL_STEPS}
          </span>
        </div>
        <StepProgress filled={step} total={TOTAL_STEPS} />
      </div>

      <div className="stack-sm" style={{ paddingTop: "var(--s2)" }}>
        <h1 className="h1">{title}</h1>
        {subtitle ? <p className="small muted">{subtitle}</p> : null}
      </div>

      {children}
    </FocusShell>
  );
}
