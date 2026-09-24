import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MySpaceResponse, RoomItemDTO } from "@english-level/contracts";
import { getMySpace, startReview } from "../api/productClient.ts";
import { Kvo } from "../brand/Kvo.tsx";
import { Art, ArtLayer } from "../brand/Art.tsx";
import { artName } from "../brand/artRegistry.ts";
import { CompanionPicker } from "../components/CompanionPicker.tsx";
import { Button, IconButton } from "../ui/Button.tsx";
import { SkeletonList, ErrorState } from "../ui/states.tsx";
import { IconArrowLeft, IconRefresh } from "../ui/icons.tsx";

type State =
  | { status: "loading" }
  | { status: "ready"; data: MySpaceResponse }
  | { status: "error" };

/**
 * The room grows only from real situations.
 *
 * No shop, no currency, no pet to look after. A situation leaves an
 * object, a chapter changes the space itself, and Kvo starts using the
 * things that are there. Tapping an object shows the English it came from
 * — and offers to bring that language back, which is the one place review
 * belongs outside Today.
 */
export function MySpace() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: "loading" });
  const [open, setOpen] = useState<RoomItemDTO | null>(null);
  const [reviewing, setReviewing] = useState(false);

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
        <h1 className="h1">Моё место</h1>
        <SkeletonList rows={1} height={300} />
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="stack-lg">
        <h1 className="h1">Моё место</h1>
        <ErrorState
          title="Не открылось"
          message="Проверь связь и попробуй ещё раз."
          onRetry={load}
        />
      </section>
    );
  }

  const { data } = state;
  const unlocked = data.items.filter((item) => item.unlocked);
  // The room changes with the chapters: an empty corner, then a shelf,
  // then a window onto the city. Derived from what is actually earned.
  const stage = Math.min(4, Math.max(1, Math.ceil(unlocked.length / 2) + 1));

  async function recall() {
    setReviewing(true);
    try {
      await startReview({ extraPractice: true });
      navigate("/review?extra=1");
    } catch {
      navigate("/review");
    } finally {
      setReviewing(false);
    }
  }

  return (
    <section className="stack-lg">
      <header className="space-head">
        <IconButton label="Назад" onClick={() => navigate("/my")}>
          <IconArrowLeft size={19} />
        </IconButton>
        <div>
          <h1 className="h2">Моё место</h1>
          <p className="small muted">растёт вместе с твоим английским</p>
        </div>
      </header>

      <div className={`room room--stage-${stage} ambient-stage`}>
        <span className="ambient-glow" aria-hidden="true" />

        {/* The environment itself: one painting per stage, so the room
            visibly grows as chapters are finished. */}
        <ArtLayer
          name={artName.spaceStage(stage)}
          className="room__art"
          position="center"
          priority
        />

        <span className="room__chip">Комната {stage} из 4</span>

        {/* Coded placeholders, shown only until the environment art
            lands. */}
        <div className="room__shelf" aria-hidden="true" />
        <div className="room__window" aria-hidden="true">
          <i />
        </div>

        <div className="room__objects">
          {unlocked.map((item) => (
            <button
              key={item.id}
              type="button"
              className="room-slot"
              onClick={() => setOpen(item)}
              aria-label={item.title}
            >
              <Art
                name={artName.spaceObject(item.id)}
                fallback={<span aria-hidden="true">{item.glyph}</span>}
              />
            </button>
          ))}
          {/* The rest of the room is only softly implied — one warm hint
              of how much is still ahead, not an empty slot per locked
              item. That grid read as a wireframe inventory, not a room
              that's still growing. */}
          {data.items.length > unlocked.length ? (
            <span className="room-slot room-slot--more" aria-hidden="true">
              <span className="room-slot__count">
                +{data.items.length - unlocked.length}
              </span>
            </span>
          ) : null}
        </div>

        <span className="room__kvo">
          <Kvo size={104} state={unlocked.length > 0 ? "happy" : "idle"} />
        </span>

        {/* Anything that belongs in front of Kvo and the objects. */}
        <ArtLayer
          name={artName.spaceForeground()}
          className="room__foreground"
        />

        {data.companion ? (
          <span className="room__saying">
            {unlocked.length > 0
              ? `${data.companion.name} пользуется твоими вещами`
              : `${data.companion.name} только пришёл`}
          </span>
        ) : null}
      </div>

      <p className="caption muted" style={{ textAlign: "center" }}>
        Предметы появляются только за настоящие ситуации. Купить их нельзя.
      </p>

      {!data.companion ? (
        <CompanionPicker choices={data.companionChoices} onChosen={load} />
      ) : null}

      {open ? (
        <div
          className="sheet-backdrop"
          onClick={() => setOpen(null)}
          role="presentation"
        >
          <div
            className="sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={open.title}
          >
            <div className="row" style={{ gap: "var(--s3)" }}>
              <span className="sheet__glyph" aria-hidden="true">
                <Art
                  name={artName.spaceObject(open.id)}
                  style={{ width: 56, height: 56 }}
                  fallback={<span>{open.glyph}</span>}
                />
              </span>
              <div>
                <h2 className="h2">{open.title}</h2>
                {open.memory?.episodeTitle ? (
                  <p className="small muted">
                    из ситуации «{open.memory.episodeTitle}»
                  </p>
                ) : null}
              </div>
            </div>

            <p className="body muted">{open.reason}</p>

            {open.memory && open.memory.phrases.length > 0 ? (
              <div className="stack-sm">
                <span className="overline">Здесь ты впервые сказал</span>
                {open.memory.phrases.map((phrase) => (
                  <div className="preview-word" key={phrase.text}>
                    <span className="preview-word__en en">{phrase.text}</span>
                    <span className="preview-word__ru">
                      {phrase.translation}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            <Button disabled={reviewing} onClick={recall}>
              <IconRefresh size={17} /> Вспомнить ситуацию
            </Button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setOpen(null)}
            >
              Закрыть
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
