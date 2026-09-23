import type { ReactNode } from "react";
import { Button } from "./Button.tsx";

/** Skeletons mirror the shape of the screen they stand in for, so the
 * layout doesn't jump when real data lands. */
export function SkeletonList({
  rows = 3,
  height = 72,
}: {
  rows?: number;
  height?: number;
}) {
  return (
    <div className="stack" role="status" aria-label="Загрузка">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}

export function SkeletonJourney() {
  return (
    <div className="stack-lg" role="status" aria-label="Загрузка курса">
      <div className="skeleton" style={{ height: 118 }} />
      <div className="stack">
        <div className="skeleton" style={{ height: 84 }} />
        <div className="skeleton" style={{ height: 52, width: "82%" }} />
        <div className="skeleton" style={{ height: 52, width: "72%" }} />
        <div className="skeleton" style={{ height: 52, width: "78%" }} />
      </div>
    </div>
  );
}

export function LoadingScreen({ note }: { note?: string }) {
  return (
    <div className="center-screen" role="status" aria-label="Загрузка">
      <div className="spinner" />
      {note ? <p className="small muted">{note}</p> : null}
    </div>
  );
}

/** Never renders a raw fetch/error string — only human copy. */
export function ErrorState({
  title = "Что-то пошло не так",
  message = "Попробуй ещё раз — обычно это временно.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state">
      <span className="pill pill-blush">Ошибка</span>
      <h2 className="h2">{title}</h2>
      <p className="small muted">{message}</p>
      {onRetry ? (
        <div style={{ width: "100%", maxWidth: 240, paddingTop: 8 }}>
          <Button variant="secondary" onClick={onRetry}>
            Повторить
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="state">
      <h2 className="h2">{title}</h2>
      {message ? <p className="small muted">{message}</p> : null}
      {action}
    </div>
  );
}
