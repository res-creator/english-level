import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Kvo, KvoBadge } from "../brand/Kvo.tsx";
import { Art, ArtLayer } from "../brand/Art.tsx";
import { artName } from "../brand/artRegistry.ts";
import { Button } from "../ui/Button.tsx";
import { markWelcomeSeen } from "../rootRedirectLogic.ts";
import { track } from "../lib/analytics.ts";

/**
 * The hook.
 *
 * It names a feeling the learner already knows — you have the words, the
 * answer just doesn't come — instead of promising that they will learn
 * English. A promise that large gets filtered out; a recognised moment
 * does not.
 *
 * One headline, one action. No skip, no step dots, no second door.
 */
export function Welcome() {
  const navigate = useNavigate();

  useEffect(() => {
    track("welcome_viewed");
  }, []);

  return (
    <div className="hero-screen">
      <div className="hero-screen__stage">
        <ArtLayer name={artName.heroBackdrop("welcome")} priority />

        <div className="brand-lockup">
          <KvoBadge size={34} />
          <span className="brand-lockup__name">
            <b>Speak</b> in English
          </span>
        </div>

        {/* The unfinished phrases that hang in the air in a real
            conversation — the thing the product is actually about. */}
        <span className="float-phrase float-phrase--a en">Could I…</span>
        <span className="float-phrase float-phrase--b en">Sorry?</span>
        <span className="float-phrase float-phrase--c en">um…</span>
        <span className="float-phrase float-phrase--d en">I'd like a…</span>

        <div className="hero-screen__kvo">
          <Art
            name={artName.heroSubject("welcome")}
            className="hero-art"
            priority
            fallback={<Kvo size={220} state="thinking" title="Кво" />}
          />
        </div>
      </div>

      <div className="hero-screen__sheet">
        <div className="sheet-grabber" aria-hidden="true" />
        <h1 className="display">
          Ты знаешь слова.
          <br />
          Но ответ <span className="accent-text">почему-то не приходит.</span>
        </h1>
        <p className="body muted">
          Мы учим через жизненные ситуации — кафе, знакомства, город. Сначала
          ситуация. Потом слова.
        </p>

        <div className="hero-screen__actions">
          <Button
            onClick={() => {
              markWelcomeSeen();
              navigate("/demo");
            }}
          >
            Попробовать иначе
          </Button>
          <p className="caption muted" style={{ textAlign: "center" }}>
            Меньше минуты, без регистрации
          </p>
        </div>
      </div>
    </div>
  );
}
