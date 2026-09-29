import { SegmentConfig } from "../types";

const FPS = 30;

export const askingForDirections: SegmentConfig = {
  id: "asking-for-directions",
  title: "How Would You Say This? — Situation 1: Asking for Directions",
  background: "backgrounds/directions.jpg",
  voiceover: "audio/directions.mp3",
  fps: FPS,
  durationInSeconds: 86.83,
  hostCharacter: "host",
  guestCharacter: "blondeGuy",
  guestAppearsAtSeconds: 20.23,
  intro: {
    text: "Same Situation. Six English Levels.",
    startSeconds: 0,
    durationSeconds: 17.76,
  },
  situationLabel: {
    text: "Situation 1: Asking for Directions",
    startSeconds: 17.76,
    durationSeconds: 2.47,
  },
  beats: [
    {
      level: "A1",
      quote: "“Excuse me. Where is the bank?”",
      observation: "At A1, you say exactly what you need — direct and clear.",
      quoteStartSeconds: 22.7,
      quoteDurationSeconds: 2.53,
      observationStartSeconds: 25.23,
      observationDurationSeconds: 2.9,
      badgeStartSeconds: 22.7,
      badgeDurationSeconds: 5.43,
    },
    {
      level: "A2",
      quote: "“Excuse me, where is the nearest bank, please?”",
      observation:
        "A2 adds one more precise detail — “nearest” — and a small politeness word.",
      quoteStartSeconds: 28.13,
      quoteDurationSeconds: 4.44,
      observationStartSeconds: 32.57,
      observationDurationSeconds: 6.41,
      badgeStartSeconds: 28.13,
      badgeDurationSeconds: 10.85,
    },
    {
      level: "B1",
      quote: "“Excuse me, could you tell me how to get to the bank?”",
      observation:
        "B1 turns the question inward — asking indirectly feels more natural in conversation.",
      quoteStartSeconds: 38.98,
      quoteDurationSeconds: 4.93,
      observationStartSeconds: 43.91,
      observationDurationSeconds: 6.41,
      badgeStartSeconds: 38.98,
      badgeDurationSeconds: 11.34,
    },
    {
      level: "B2",
      quote: "“Sorry to bother you — do you know if there's a bank nearby?”",
      observation: "B2 softens the approach before even asking — that's flexibility in action.",
      quoteStartSeconds: 50.32,
      quoteDurationSeconds: 5.43,
      observationStartSeconds: 55.75,
      observationDurationSeconds: 5.43,
      badgeStartSeconds: 50.32,
      badgeDurationSeconds: 10.86,
    },
    {
      level: "C1",
      quote:
        "“Sorry to stop you — I don't suppose you know where the nearest bank is?”",
      observation: "C1 hedges the question itself, so it feels less like an imposition.",
      quoteStartSeconds: 61.18,
      quoteDurationSeconds: 6.42,
      observationStartSeconds: 67.6,
      observationDurationSeconds: 5.92,
      badgeStartSeconds: 61.18,
      badgeDurationSeconds: 12.34,
    },
    {
      level: "C2",
      quote:
        "“Sorry to catch you like this — you wouldn't happen to know where the nearest bank is, would you?”",
      observation: "C2 keeps adjusting tone in real time — checking in as much as asking.",
      quoteStartSeconds: 73.52,
      quoteDurationSeconds: 7.89,
      observationStartSeconds: 81.41,
      observationDurationSeconds: 5.42,
      badgeStartSeconds: 73.52,
      badgeDurationSeconds: 13.31,
    },
  ],
};
