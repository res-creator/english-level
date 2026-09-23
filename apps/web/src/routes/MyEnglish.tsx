import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  FriendStateResponse,
  MyEnglishResponse,
} from "@english-level/contracts";
import {
  acceptFriendInvite,
  createFriendInvite,
  getFriendState,
  getMyEnglish,
} from "../api/productClient.ts";
import { useAuth } from "../auth/useAuth.ts";
import { PreviewResetPanel } from "../components/PreviewResetPanel.tsx";
import { Button } from "../ui/Button.tsx";
import { ProgressBar } from "../ui/ProgressBar.tsx";
import { SkeletonList, ErrorState, EmptyState } from "../ui/states.tsx";
import { levelTitle } from "../ui/labels.tsx";

type State =
  | { status: "loading" }
  | { status: "ready"; data: MyEnglishResponse }
  | { status: "error" };

/**
 * Proof, not a score. Every line is something the learner actually did:
 * a capability proven in a Mission, a phrase met in a real situation.
 * There is no level percentage, no XP and nothing projected.
 */
export function MyEnglish() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });
  const [friend, setFriend] = useState<FriendStateResponse | null>(null);

  function load() {
    setState({ status: "loading" });
    getMyEnglish()
      .then((data) => setState({ status: "ready", data }))
      .catch(() => setState({ status: "error" }));
    getFriendState()
      .then(setFriend)
      .catch(() => setFriend(null));
  }

  useEffect(load, []);

  if (state.status === "loading") {
    return (
      <section className="stack-lg">
        <h1 className="h1">Мой английский</h1>
        <SkeletonList rows={3} height={64} />
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="stack-lg">
        <h1 className="h1">Мой английский</h1>
        <ErrorState
          title="Не загрузилось"
          message="Проверь связь и попробуй ещё раз."
          onRetry={load}
        />
      </section>
    );
  }

  const { data } = state;
  const level = data.level ?? auth.user?.currentCefrLevel ?? null;

  return (
    <section className="stack-lg">
      <header className="stack-sm">
        <span className="eyebrow muted">Что ты уже умеешь</span>
        <div className="row-between">
          <h1 className="h1">Мой английский</h1>
          {level ? <span className="pill">{levelTitle(level)}</span> : null}
        </div>
      </header>

      <div className="stat-strip">
        <div className="stat-strip__item">
          <span className="stat-strip__value num">{data.stats.phrasesMet}</span>
          <span className="stat-strip__label">Фраз встречено</span>
        </div>
        <div className="stat-strip__item">
          <span className="stat-strip__value num">
            {data.stats.phrasesConsolidated}
          </span>
          <span className="stat-strip__label">Закреплено</span>
        </div>
        <div className="stat-strip__item">
          <span className="stat-strip__value num">
            {data.stats.activeDaysThisWeek}
          </span>
          <span className="stat-strip__label">Дней на неделе</span>
        </div>
      </div>

      <button
        type="button"
        className="row-card"
        onClick={() => navigate("/my/space")}
      >
        <span className="row-card__body">
          <span className="row-card__title">Мой уголок</span>
          <span className="row-card__meta">
            Предметы, которые помнят, что ты выучила
          </span>
        </span>
        <span className="row-card__chevron" aria-hidden="true">
          →
        </span>
      </button>

      <div className="stack-sm">
        <span className="eyebrow muted">Я могу</span>
        {data.capabilities.length === 0 ? (
          <EmptyState
            title="Пока пусто"
            message="Пройди первую миссию — и здесь появится первое «Я могу»."
          />
        ) : (
          data.capabilities.map((capability) => (
            <div className="capability-row" key={capability.episodeId}>
              <span className="capability-row__mark" aria-hidden="true">
                {capability.state === "consolidated" ? "★" : "✓"}
              </span>
              <span className="capability-row__body">
                <span className="capability-row__text">
                  {capability.capability}
                </span>
                <span className="capability-row__meta">
                  {capability.situationTitle}
                  {capability.state === "consolidated"
                    ? " · закреплено"
                    : " · могу"}
                </span>
              </span>
            </div>
          ))
        )}
      </div>

      {data.phrases.length > 0 ? (
        <div className="stack-sm">
          <span className="eyebrow muted">
            Мои фразы ({data.phrases.length})
          </span>
          {data.phrases.slice(0, 12).map((phrase) => (
            <div className="preview-word" key={phrase.id}>
              <span className="preview-word__en">{phrase.text}</span>
              <span className="preview-word__ru">
                {phrase.translation}
                {phrase.consolidated ? " · закреплено" : ""}
              </span>
            </div>
          ))}
          {data.phrases.length > 12 ? (
            <span className="caption muted">
              …и ещё {data.phrases.length - 12}
            </span>
          ) : null}
        </div>
      ) : null}

      <FriendPanel state={friend} onChanged={setFriend} />

      <PreviewResetPanel />
    </section>
  );
}

/**
 * One friend, one shared goal. No comparison of who did more, because
 * the moment it becomes a contest it stops helping the person who is
 * behind.
 */
function FriendPanel({
  state,
  onChanged,
}: {
  state: FriendStateResponse | null;
  onChanged: (next: FriendStateResponse) => void;
}) {
  const [code, setCode] = useState("");
  const [invite, setInvite] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setInvite(state?.inviteCode ?? null);
  }, [state?.inviteCode]);

  if (!state) return null;

  if (state.friend) {
    const percent = Math.min(
      100,
      Math.round((100 * state.goal.total) / state.goal.target),
    );
    return (
      <div className="panel stack-sm">
        <div className="row-between">
          <span className="caption">Вместе с {state.friend.firstName}</span>
          <span className="caption num">
            {state.goal.total} / {state.goal.target}
          </span>
        </div>
        <ProgressBar percent={percent} thin />
        <p className="small muted">
          {state.goal.completed
            ? "Цель недели закрыта. Общее растение теперь в уголке."
            : "Занятия обоих складываются в одну цель на неделю."}
        </p>
      </div>
    );
  }

  async function handleInvite() {
    setBusy(true);
    setError(null);
    try {
      const res = await createFriendInvite();
      setInvite(res.code);
    } catch {
      setError("Не получилось создать код");
    } finally {
      setBusy(false);
    }
  }

  async function handleAccept() {
    setBusy(true);
    setError(null);
    try {
      onChanged(await acceptFriendInvite(code));
    } catch {
      setError("Код не подошёл");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel-blush stack-sm">
      <span className="caption" style={{ color: "var(--accent-ink)" }}>
        Учиться вдвоём
      </span>
      <p className="small" style={{ color: "var(--ink-700)" }}>
        Один друг и одна общая цель на неделю. Без рейтингов и сравнений.
      </p>

      {invite ? (
        <div className="invite-code">{invite}</div>
      ) : (
        <Button onClick={handleInvite} disabled={busy}>
          Пригласить друга
        </Button>
      )}

      <div className="invite-accept">
        <input
          className="input"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Код друга"
          maxLength={6}
          aria-label="Код приглашения"
        />
        <button
          type="button"
          className="btn btn-ghost"
          disabled={busy || code.trim().length === 0}
          onClick={handleAccept}
        >
          Принять
        </button>
      </div>

      {error ? (
        <span className="caption" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
