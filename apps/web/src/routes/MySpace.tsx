import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MySpaceResponse, RoomItemDTO } from "@english-level/contracts";
import { getMySpace } from "../api/productClient.ts";
import { CompanionPicker } from "../components/CompanionPicker.tsx";
import { TopBar } from "../ui/TopBar.tsx";
import { Button } from "../ui/Button.tsx";
import { SkeletonList, ErrorState } from "../ui/states.tsx";

type State =
  | { status: "loading" }
  | { status: "ready"; data: MySpaceResponse }
  | { status: "error" };

/**
 * A quiet room, not a game board. Objects sit in fixed places, nothing
 * can be bought or moved, and tapping one shows the English it came from
 * — that is the whole point of it existing.
 */
export function MySpace() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });
  const [open, setOpen] = useState<RoomItemDTO | null>(null);

  function load() {
    setState({ status: "loading" });
    getMySpace()
      .then((data) => setState({ status: "ready", data }))
      .catch(() => setState({ status: "error" }));
  }

  useEffect(load, []);

  if (state.status === "loading") {
    return (
      <section className="stack-lg">
        <TopBar title="Мой уголок" onBack={() => navigate("/my")} />
        <SkeletonList rows={3} height={72} />
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="stack-lg">
        <TopBar title="Мой уголок" onBack={() => navigate("/my")} />
        <ErrorState
          title="Уголок не открылся"
          message="Проверь связь и попробуй ещё раз."
          onRetry={load}
        />
      </section>
    );
  }

  const { data } = state;

  return (
    <section className="stack-lg">
      <TopBar onBack={() => navigate("/my")} />

      <header className="stack-sm">
        <span className="eyebrow muted">
          {data.unlockedCount} из {data.totalCount} предметов
        </span>
        <h1 className="h1">Мой уголок</h1>
        {data.companion ? (
          <p className="small muted">
            {data.companion.name} · {data.companion.tagline}
          </p>
        ) : null}
      </header>

      {!data.companion ? (
        <CompanionPicker choices={data.companionChoices} onChosen={load} />
      ) : null}

      <div className="room-grid">
        {data.items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.unlocked ? "room-item" : "room-item is-locked"}
            onClick={() => (item.unlocked ? setOpen(item) : undefined)}
            aria-disabled={!item.unlocked}
          >
            <span className="room-item__glyph" aria-hidden="true">
              {item.unlocked ? item.glyph : "·"}
            </span>
            <span className="room-item__title">
              {item.unlocked ? item.title : "Ещё впереди"}
            </span>
          </button>
        ))}
      </div>

      <p className="caption muted" style={{ textAlign: "center" }}>
        Предметы появляются только за настоящую учёбу. Купить их нельзя.
      </p>

      {open ? <MemorySheet item={open} onClose={() => setOpen(null)} /> : null}
    </section>
  );
}

/** What this object remembers — the language behind it. */
function MemorySheet({
  item,
  onClose,
}: {
  item: RoomItemDTO;
  onClose: () => void;
}) {
  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={item.title}
      >
        <span className="sheet__glyph" aria-hidden="true">
          {item.glyph}
        </span>
        <h2 className="h2">{item.title}</h2>
        <p className="small muted">{item.reason}</p>

        {item.memory?.capability ? (
          <div className="capability-card">
            <span className="capability-card__label">Помнит о том, что</span>
            <p className="capability-card__text">{item.memory.capability}</p>
          </div>
        ) : null}

        {item.memory && item.memory.phrases.length > 0 ? (
          <div className="stack-sm">
            <span className="eyebrow muted">Язык отсюда</span>
            {item.memory.phrases.map((phrase) => (
              <div className="preview-word" key={phrase.text}>
                <span className="preview-word__en">{phrase.text}</span>
                <span className="preview-word__ru">{phrase.translation}</span>
              </div>
            ))}
          </div>
        ) : null}

        <Button onClick={onClose}>Закрыть</Button>
      </div>
    </div>
  );
}
