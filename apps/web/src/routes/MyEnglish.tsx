import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  FriendStateResponse,
  MyEnglishResponse,
  MySpaceResponse,
} from "@english-level/contracts";
import {
  acceptFriendInvite,
  createFriendInvite,
  getFriendState,
  getMyEnglish,
  getMySpace,
} from "../api/productClient.ts";
import { Kvo } from "../brand/Kvo.tsx";
import { Button } from "../ui/Button.tsx";
import { ProgressBar } from "../ui/ProgressBar.tsx";
import { SkeletonList, ErrorState, EmptyState } from "../ui/states.tsx";
import { IconCheck, IconRefresh, IconSparkle } from "../ui/icons.tsx";
import { PreviewResetPanel } from "../components/PreviewResetPanel.tsx";
import { AccountSettingsPanel } from "../components/AccountSettingsPanel.tsx";
import { useTelegram } from "../telegram/useTelegram.ts";
import {
  INVITE_SHARE_TEXT,
  buildInviteShareUrl,
  buildTelegramShareLink,
} from "../friend/inviteShare.ts";
import { consumePendingInvite } from "../lib/pendingInvite.ts";

type State =
  | { status: "loading" }
  | { status: "ready"; data: MyEnglishResponse }
  | { status: "error" };

/**
 * Proof, not a score.
 *
 * The newest capability gets a card of its own, because the moment it was
 * earned is what the learner came back for. Older ones settle into rows.
 * Phrases that have survived spaced review are listed as "уже приходят
 * сами" — the honest wording for what consolidation actually means.
 */
export function MyEnglish() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });
  const [friend, setFriend] = useState<FriendStateResponse | null>(null);
  const [space, setSpace] = useState<MySpaceResponse | null>(null);

  function load() {
    setState({ status: "loading" });
    getMyEnglish()
      .then((data) => setState({ status: "ready", data }))
      .catch(() => setState({ status: "error" }));
    getFriendState()
      .then(setFriend)
      .catch(() => setFriend(null));
    getMySpace()
      .then(setSpace)
      .catch(() => setSpace(null));
  }

  useEffect(load, []);

  if (state.status === "loading") {
    return (
      <section className="stack-lg">
        <h1 className="h1">Мой английский</h1>
        <SkeletonList rows={3} height={84} />
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
  const [newest, ...rest] = data.capabilities.slice().reverse();
  const consolidated = data.phrases.filter((p) => p.consolidated);

  return (
    <section className="stack-lg">
      <header className="stack-sm">
        <h1 className="h1">Мой английский</h1>
        {data.level ? <span className="pill">{data.level}</span> : null}
      </header>

      <div className="skill-stats">
        <div className="skill-stat">
          <span className="skill-stat__icon">
            <IconSparkle size={16} />
          </span>
          <span className="skill-stat__value">{data.stats.phrasesMet}</span>
          <span className="skill-stat__label">фраз встречено</span>
        </div>
        <div className="skill-stat">
          <span className="skill-stat__icon">
            <IconRefresh size={16} />
          </span>
          <span className="skill-stat__value">
            {data.stats.phrasesConsolidated}
          </span>
          <span className="skill-stat__label">закреплено</span>
        </div>
        <div className="skill-stat">
          <span className="skill-stat__icon">
            <IconCheck size={16} />
          </span>
          <span className="skill-stat__value">{data.stats.episodesDone}</span>
          <span className="skill-stat__label">ситуаций пройдено</span>
        </div>
      </div>

      <div className="stack-sm">
        <span className="section-title">Я могу…</span>

        {!newest ? (
          <EmptyState
            title="Пока пусто"
            message="Пройди первую миссию — и здесь появится первое «Я могу»."
          />
        ) : (
          <>
            <article className="cap-card">
              <span className="cap-card__chip">новое</span>
              <h2 className="cap-card__title">{newest.capability}</h2>
              {newest.situationTitle ? (
                <p className="cap-card__from">
                  из ситуации «{newest.situationTitle}»
                </p>
              ) : null}
              <span className="cap-card__kvo" aria-hidden="true">
                <Kvo size={92} state="happy" />
              </span>
            </article>

            {rest.length > 0 ? (
              <div className="skill-grid">
                {rest.map((capability) => (
                  <div
                    key={capability.episodeId}
                    className={
                      capability.state === "consolidated"
                        ? "skill-card is-consolidated"
                        : "skill-card is-fresh"
                    }
                  >
                    <span className="skill-card__badge">
                      {capability.state === "consolidated"
                        ? "Закреплено"
                        : "Могу"}
                    </span>
                    <span className="skill-card__text">
                      {capability.capability}
                    </span>
                    {capability.situationTitle ? (
                      <span className="skill-card__meta">
                        {capability.situationTitle}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>

      {consolidated.length > 0 ? (
        <div className="stack-sm">
          <span className="section-title">Уже приходят сами</span>
          <p className="phrase-flow">
            {consolidated.slice(0, 8).map((phrase, index) => (
              <span key={phrase.id}>
                {index > 0 ? <i aria-hidden="true">·</i> : null}
                <span className="en">{phrase.text}</span>
              </span>
            ))}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        className="space-card"
        onClick={() => navigate("/my/space")}
      >
        <span className="space-card__body">
          <span className="space-card__title">Моё место</span>
          <span className="space-card__meta">
            {space
              ? `${space.unlockedCount} ${plural(space.unlockedCount)}`
              : "Твои воспоминания"}
          </span>
          <span className="space-card__link">Зайти →</span>
        </span>
        <span className="space-card__kvo" aria-hidden="true">
          <Kvo size={92} state="idle" />
        </span>
      </button>

      <FriendPanel state={friend} onChanged={setFriend} />

      <AccountSettingsPanel />

      <PreviewResetPanel />
    </section>
  );
}

function plural(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "воспоминание";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return "воспоминания";
  return "воспоминаний";
}

/**
 * One friend, one shared goal. Neither side sees the other's mistakes and
 * nothing ranks them — the only shared number is how much the two of them
 * did together this week.
 */
function FriendPanel({
  state,
  onChanged,
}: {
  state: FriendStateResponse | null;
  onChanged: (next: FriendStateResponse) => void;
}) {
  const { webApp } = useTelegram();
  const [code, setCode] = useState("");
  const [invite, setInvite] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAccept, setShowAccept] = useState(false);

  useEffect(() => {
    setInvite(state?.inviteCode ?? null);
  }, [state?.inviteCode]);

  // A code carried in from a shared link — pre-filled, not auto-
  // submitted, so accepting is still a real choice.
  useEffect(() => {
    const pending = consumePendingInvite();
    if (pending) {
      setCode(pending);
      setShowAccept(true);
    }
  }, []);

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
            ? "Цель недели закрыта. Общее растение теперь в «Моём месте»."
            : "Занятия обоих складываются в одну цель на неделю."}
        </p>
      </div>
    );
  }

  async function ensureInviteCode(): Promise<string | null> {
    if (invite) return invite;
    setBusy(true);
    setError(null);
    try {
      const res = await createFriendInvite();
      setInvite(res.code);
      return res.code;
    } catch {
      setError("Не получилось создать код");
      return null;
    } finally {
      setBusy(false);
    }
  }

  /**
   * Telegram's own share chooser when it's available (a real Telegram
   * session), the Web Share API when it isn't (dev/desktop browser),
   * and a clipboard copy as the last resort — either way the raw code
   * stays visible below as a backup that always works.
   */
  async function handleInvite() {
    const inviteCode = await ensureInviteCode();
    if (!inviteCode) return;
    setCopied(false);

    const shareUrl = buildInviteShareUrl(window.location.origin, inviteCode);

    if (webApp.openTelegramLink) {
      webApp.openTelegramLink(
        buildTelegramShareLink(shareUrl, INVITE_SHARE_TEXT),
      );
      return;
    }
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text: INVITE_SHARE_TEXT, url: shareUrl });
      } catch {
        // Cancelled, or unsupported mid-call — the code below still works.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${INVITE_SHARE_TEXT}\n${shareUrl}`);
      setCopied(true);
    } catch {
      // Nothing more to do — the raw code is still there to read out.
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
    <div className="panel stack-sm">
      <span className="caption">Учиться вдвоём</span>
      <p className="small muted">
        Один друг и одна общая цель на неделю. Без рейтингов и сравнений.
      </p>

      <Button variant="secondary" onClick={handleInvite} disabled={busy}>
        Пригласить друга
      </Button>

      {invite ? (
        <div className="row-between">
          <div className="invite-code">{invite}</div>
          {copied ? (
            <span className="caption" style={{ color: "var(--green-700)" }}>
              Ссылка скопирована
            </span>
          ) : null}
        </div>
      ) : null}

      {showAccept ? (
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
      ) : (
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setShowAccept(true)}
        >
          У меня есть код друга
        </button>
      )}

      {error ? (
        <span className="caption" style={{ color: "var(--danger)" }}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
