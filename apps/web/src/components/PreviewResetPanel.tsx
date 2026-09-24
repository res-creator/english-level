import { useState } from "react";
import { resetPreviewAccount } from "../api/productClient.ts";
import { clearWelcomeSeen } from "../rootRedirectLogic.ts";
import { IS_PREVIEW_BUILD } from "../lib/previewMode.ts";
import { Button } from "../ui/Button.tsx";

type State =
  | { status: "idle" }
  | { status: "confirming" }
  | { status: "working" }
  | { status: "failed" };

/**
 * Preview-only: wipes this account so the first-run experience can be
 * tested again without a second Telegram account.
 *
 * It renders nothing at all outside the preview build, and it asks twice
 * before doing anything — the action is irreversible, and everything the
 * account has learned is really gone. On success the app is reloaded from
 * the root so authentication re-resolves and lands on onboarding, exactly
 * as it would for a genuinely new account.
 */
export function PreviewResetPanel() {
  const [state, setState] = useState<State>({ status: "idle" });

  if (!IS_PREVIEW_BUILD) return null;

  async function confirmReset() {
    setState({ status: "working" });
    try {
      await resetPreviewAccount();
      // The backend account is wiped, but "seen Welcome" is a per-device
      // flag the backend never touches — without clearing it here, a
      // reset on the same device would skip straight past Welcome and
      // the demo, exactly the screens this reset exists to re-test.
      clearWelcomeSeen();
      // A full reload, not a route change: every screen's loaded state
      // belongs to the account that no longer exists.
      window.location.replace("/");
    } catch {
      setState({ status: "failed" });
    }
  }

  return (
    <div className="preview-tools stack-sm">
      <span className="preview-tools__badge">Только preview</span>
      <span className="caption">Сбросить тестовый аккаунт</span>
      <p className="small muted">
        Удалит весь прогресс этого аккаунта: онбординг, уровень, тест, занятия,
        повторение, «Я могу», компаньона и уголок. Приложение откроется как у
        нового пользователя. Отменить нельзя.
      </p>

      {state.status === "confirming" ? (
        <div className="stack-sm">
          <p className="small" style={{ color: "var(--danger)" }}>
            Точно сбросить? Весь прогресс будет потерян навсегда.
          </p>
          <Button onClick={confirmReset}>Да, сбросить всё</Button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setState({ status: "idle" })}
          >
            Отмена
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-ghost"
          disabled={state.status === "working"}
          onClick={() => setState({ status: "confirming" })}
        >
          {state.status === "working" ? "Сбрасываем…" : "Сбросить аккаунт"}
        </button>
      )}

      {state.status === "failed" ? (
        <span className="caption" style={{ color: "var(--danger)" }}>
          Не получилось сбросить. Попробуй ещё раз.
        </span>
      ) : null}
    </div>
  );
}
