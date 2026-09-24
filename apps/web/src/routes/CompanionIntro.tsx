import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CompanionDTO } from "@english-level/contracts";
import { chooseCompanion, getMySpace } from "../api/productClient.ts";
import { Kvo } from "../brand/Kvo.tsx";
import { ArtLayer } from "../brand/Art.tsx";
import { artName } from "../brand/artRegistry.ts";
import { Button } from "../ui/Button.tsx";
import { LoadingScreen } from "../ui/states.tsx";
import { track } from "../lib/analytics.ts";

/**
 * Meeting Kvo.
 *
 * The others lean in from the edges, cropped by the screen — they are
 * peeking, not lined up for inspection. That is the difference between a
 * moment and a picker.
 *
 * Nothing here is required: "Выберу позже" is a real exit, and the choice
 * can be changed at any time from My Space. A companion you were forced
 * to pick before you understood the app is not a companion.
 */
const FALLBACK_COMPANIONS: CompanionDTO[] = [
  {
    id: "cmp_fox",
    name: "Кво",
    tagline: "Уши-кавычки ловят то, что ты хочешь сказать. Никогда не торопит.",
    tone: "green",
  },
];

export function CompanionIntro() {
  const navigate = useNavigate();
  const [choices, setChoices] = useState<CompanionDTO[] | null>(null);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMySpace()
      .then((space) => {
        if (!cancelled) setChoices(space.companionChoices);
      })
      .catch(() => {
        if (!cancelled) setChoices(FALLBACK_COMPANIONS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!choices) return <LoadingScreen />;

  const current = choices[index] ?? FALLBACK_COMPANIONS[0]!;

  async function keep() {
    setBusy(true);
    try {
      await chooseCompanion(current.id);
    } catch {
      // Choosing is a convenience, never a gate: if it fails the learner
      // still moves on, and can pick later from My Space.
    } finally {
      navigate("/onboarding", { replace: true });
    }
  }

  return (
    <div className="pick-screen">
      <ArtLayer name={artName.heroBackdrop("companion")} />

      <header className="pick-screen__head">
        <h1 className="display">Кто пойдёт с тобой?</h1>
        <p className="body muted">
          Будет рядом в каждой ситуации. Без кормления и без давления.
        </p>
      </header>

      <div className="pick-stage">
        {/* Cropped by the screen edge on purpose. */}
        <span className="pick-peek pick-peek--left" aria-hidden="true">
          <Kvo size={150} state="happy" />
        </span>
        <span className="pick-peek pick-peek--right" aria-hidden="true">
          <Kvo size={140} state="thinking" flip />
        </span>

        <div className="pick-stage__disc">
          <Kvo size={190} state="idle" title={current.name} />
        </div>

        {choices.length > 1 ? (
          <div className="pick-dots">
            {choices.map((companion, i) => (
              <button
                key={companion.id}
                type="button"
                aria-label={companion.name}
                className={i === index ? "pick-dot is-on" : "pick-dot"}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="pick-screen__foot">
        <h2 className="h2" style={{ textAlign: "center" }}>
          {current.name}
        </h2>
        <p className="body muted" style={{ textAlign: "center" }}>
          {current.tagline}
        </p>
        <Button disabled={busy} onClick={keep}>
          Оставить {current.name}
        </Button>
        <div className="pick-screen__alt">
          {choices.length > 1 ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIndex((i) => (i + 1) % choices.length)}
            >
              Посмотреть других
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              track("companion_deferred");
              navigate("/onboarding", { replace: true });
            }}
          >
            Выберу позже
          </button>
        </div>
      </div>
    </div>
  );
}
