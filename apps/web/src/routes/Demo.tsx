import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SceneStage, type DialogueLine } from "../scene/SceneStage.tsx";
import type { CastState } from "../brand/cast.tsx";
import { Button, IconButton } from "../ui/Button.tsx";
import { IconArrowLeft } from "../ui/icons.tsx";
import { track } from "../lib/analytics.ts";

/**
 * The 48-second demo: one real situation, before any account, any
 * placement test and any question about goals.
 *
 * Everything here is deliberately local and unsaved. It is a taste of the
 * product, not a session — so it touches no endpoint, writes no progress
 * and works for someone who has not signed in yet. The real learning
 * engine takes over from the very next screen.
 */

type Step =
  | {
      kind: "choice";
      /** Russian question — we are checking understanding, not vocabulary. */
      prompt: string;
      hint: string;
      options: { id: string; text: string; because?: string }[];
      correctId: string;
    }
  | {
      kind: "build";
      prompt: string;
      context: string;
      /** The gap the learner completes, shown inside their own bubble. */
      stem: string;
      bank: string[];
      correct: string;
    };

const STEPS: Step[] = [
  {
    kind: "choice",
    prompt: "Что она спрашивает?",
    hint: "Посмотри на чашки.",
    options: [
      {
        id: "here",
        text: "Здесь или с собой?",
        because: "Да. Кружка — остаться, стаканчик — унести.",
      },
      { id: "size", text: "Какой размер?" },
      { id: "done", text: "Вы уже заказали?" },
    ],
    correctId: "here",
  },
  {
    kind: "build",
    prompt: "Закончи ответ",
    context: "Ты спешишь. Кофе нужен с собой.",
    stem: "To go,",
    bank: ["please.", "here", "for", "coffee", "a"],
    correct: "please.",
  },
];

export function Demo() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const step = STEPS[index];
  const finished = index >= STEPS.length;

  useEffect(() => {
    track("demo_started");
  }, []);

  useEffect(() => {
    if (finished) track("demo_completed");
    // Fires once, the moment the demo actually finishes — not on every
    // re-render while `finished` stays true.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  // The conversation so far. It only ever grows — the backdrop, Maya and
  // her first line stay exactly where they were.
  const dialogue: DialogueLine[] = [
    { id: "d1", from: "them", text: "For here or to go?" },
  ];
  let castState: CastState = "speaking";

  if (index === 1 || finished) {
    dialogue.push({
      id: "d2",
      from: "you",
      text: answered || finished ? "To go, please." : "To go, …",
      pending: index === 1 && !answered,
    });
    castState = index === 1 && !answered ? "listening" : "smiling";
  }
  if (finished) {
    dialogue.push({ id: "d3", from: "them", text: "Sure! One moment." });
    castState = "showing";
  }

  function submit() {
    if (!step || picked === null) return;
    setAnswered(true);
  }

  function next() {
    setPicked(null);
    setAnswered(false);
    setIndex((i) => i + 1);
  }

  const kvoHint = finished
    ? "Получилось."
    : !answered && step?.kind === "choice"
      ? step.hint
      : null;

  return (
    <div className="lesson-screen">
      <div className="lesson-top">
        <IconButton label="Назад" onClick={() => navigate("/welcome")}>
          <IconArrowLeft size={19} />
        </IconButton>
        <div className="seg-progress">
          {[0, 1, 2].map((i) => (
            <span key={i} className={i <= index ? "seg is-on" : "seg"} />
          ))}
        </div>
        <button
          type="button"
          className="lesson-top__skip"
          onClick={() => {
            track("demo_skipped");
            navigate("/demo/result");
          }}
        >
          Пропустить
        </button>
      </div>

      <SceneStage
        scene="cafe"
        cast="maya"
        castState={castState}
        dialogue={dialogue}
        kvoHint={kvoHint}
        kvoState={finished ? "happy" : "idle"}
      />

      <div className="task-sheet">
        {finished ? (
          <DemoDone onNext={() => navigate("/demo/result")} />
        ) : step?.kind === "choice" ? (
          <>
            <h2 className="task-sheet__title">{step.prompt}</h2>
            <div className="stack-sm">
              {step.options.map((option) => {
                const isPicked = picked === option.id;
                const revealed = answered && option.id === step.correctId;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={
                      "answer" + (isPicked || revealed ? " answer--picked" : "")
                    }
                    disabled={answered}
                    onClick={() => setPicked(option.id)}
                  >
                    <span className="answer__body">
                      <span className="answer__text">{option.text}</span>
                      {revealed && option.because ? (
                        <span className="answer__because">
                          {option.because}
                        </span>
                      ) : null}
                    </span>
                    <span className="answer__mark" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </>
        ) : step ? (
          <>
            <p className="context-chip">{step.context}</p>
            <span className="overline">{step.prompt}</span>
            <div className="word-bank">
              {step.bank.map((word) => (
                <button
                  key={word}
                  type="button"
                  className={"word" + (picked === word ? " word--picked" : "")}
                  disabled={answered}
                  onClick={() => setPicked(word)}
                >
                  <span className="en">{word}</span>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {!finished ? (
          <div className="task-sheet__cta">
            {answered ? (
              <Button onClick={next}>Дальше</Button>
            ) : (
              <Button disabled={picked === null} onClick={submit}>
                Ответить
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DemoDone({ onNext }: { onNext: () => void }) {
  return (
    <>
      <h2 className="h1">Кофе уже у тебя в руках.</h2>
      <p className="body muted">
        Ты понял вопрос по ситуации и ответил сам — без перевода и правил.
      </p>
      <div className="cast-note">
        <span className="cast-note__avatar" aria-hidden="true">
          М
        </span>
        <p className="small">
          <b>Это Майя.</b> Она работает в кофейне у дома — и ещё не раз тебя
          встретит.
        </p>
      </div>
      <div className="task-sheet__cta">
        <Button onClick={onNext}>Дальше</Button>
      </div>
    </>
  );
}
