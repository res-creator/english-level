import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DailyMinutes } from "@english-level/contracts";
import { DAILY_MINUTES_OPTIONS } from "@english-level/contracts";
import {
  deleteAccount,
  getMySettings,
  updateMySettings,
} from "../api/productClient.ts";
import { Button } from "../ui/Button.tsx";

type LoadState =
  | { status: "loading" }
  | {
      status: "ready";
      dailyMinutes: DailyMinutes;
      dailyReminderEnabled: boolean;
    }
  | { status: "error" };

type DeleteState = { status: "idle" | "confirming" | "working" | "failed" };

/**
 * The only two things a learner can change after onboarding, plus the
 * one thing that has to exist for a public product: a real way to leave.
 * Not a full settings screen — see `MySettingsResponseSchema` for why
 * it's deliberately just these two fields.
 */
export function AccountSettingsPanel() {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [saving, setSaving] = useState(false);
  const [deleteState, setDeleteState] = useState<DeleteState>({
    status: "idle",
  });

  useEffect(() => {
    let cancelled = false;
    getMySettings()
      .then((settings) => {
        if (!cancelled) setState({ status: "ready", ...settings });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") return null;
  if (state.status === "error") return null;

  async function saveMinutes(minutes: DailyMinutes) {
    if (state.status !== "ready" || saving) return;
    const previous = state.dailyMinutes;
    setState({ ...state, dailyMinutes: minutes });
    setSaving(true);
    try {
      await updateMySettings({ dailyMinutes: minutes });
    } catch {
      setState((s) =>
        s.status === "ready" ? { ...s, dailyMinutes: previous } : s,
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleReminder(enabled: boolean) {
    if (state.status !== "ready" || saving) return;
    setState({ ...state, dailyReminderEnabled: enabled });
    setSaving(true);
    try {
      await updateMySettings({ dailyReminderEnabled: enabled });
    } catch {
      setState((s) =>
        s.status === "ready" ? { ...s, dailyReminderEnabled: !enabled } : s,
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setDeleteState({ status: "working" });
    try {
      await deleteAccount();
      // The session is gone the moment the account is — a full reload,
      // not a route change, so nothing tries to keep using state that
      // belongs to an account which no longer exists.
      window.location.replace("/");
    } catch {
      setDeleteState({ status: "failed" });
    }
  }

  return (
    <div className="panel stack-sm">
      <span className="caption">Настройки</span>

      <div className="stack-sm">
        <span className="small muted">Сколько минут в день</span>
        <div className="goal-grid">
          {DAILY_MINUTES_OPTIONS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              className={
                state.dailyMinutes === minutes
                  ? "goal-chip is-picked"
                  : "goal-chip"
              }
              disabled={saving}
              onClick={() => saveMinutes(minutes)}
            >
              {minutes} минут
            </button>
          ))}
        </div>
      </div>

      <div className="stack-sm">
        <span className="small muted">Напоминание раз в день</span>
        <div className="goal-grid">
          <button
            type="button"
            className={
              state.dailyReminderEnabled ? "goal-chip is-picked" : "goal-chip"
            }
            disabled={saving}
            onClick={() => toggleReminder(true)}
          >
            Включено
          </button>
          <button
            type="button"
            className={
              !state.dailyReminderEnabled ? "goal-chip is-picked" : "goal-chip"
            }
            disabled={saving}
            onClick={() => toggleReminder(false)}
          >
            Выключено
          </button>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => navigate("/my/privacy")}
      >
        О приватности
      </button>

      <div className="stack-sm" style={{ paddingTop: "var(--s2)" }}>
        <span className="small muted">Аккаунт</span>
        {deleteState.status === "confirming" ? (
          <div className="stack-sm">
            <p className="small" style={{ color: "var(--danger)" }}>
              Аккаунт и весь прогресс будут удалены навсегда. Отменить нельзя.
            </p>
            <Button variant="secondary" onClick={confirmDelete}>
              Да, удалить аккаунт
            </Button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setDeleteState({ status: "idle" })}
            >
              Отмена
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ color: "var(--danger)" }}
            disabled={deleteState.status === "working"}
            onClick={() => setDeleteState({ status: "confirming" })}
          >
            {deleteState.status === "working" ? "Удаляем…" : "Удалить аккаунт"}
          </button>
        )}
        {deleteState.status === "failed" ? (
          <span className="caption" style={{ color: "var(--danger)" }}>
            Не получилось удалить. Попробуй ещё раз.
          </span>
        ) : null}
      </div>
    </div>
  );
}
