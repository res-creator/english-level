export type CharacterId = "host" | "blondeGuy" | "mustacheMan" | "purpleWoman";

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

/** Normalized rect (0-1) locating a facial feature inside a character's full-body image. */
export interface FaceRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Three whole-character frames used for real lip-sync once art is available. */
export interface MouthVariants {
  closed: string;
  mid: string;
  open: string;
}

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  /** Fallback single image (public/ path) used when mouthVariants are not yet provided. */
  image: string;
  /** Optional: swap the whole body image per mouth state instead of the procedural jaw-flap fallback. */
  mouthVariants?: MouthVariants;
  eyeRegion: FaceRegion;
  mouthRegion: FaceRegion;
  /** Natural aspect ratio (width / height) of the source art, used to size the character box. */
  aspectRatio: number;
}

export interface DialogueBeat {
  level: CEFRLevel;
  quote: string;
  observation: string;
  /** Seconds from segment start. */
  quoteStartSeconds: number;
  quoteDurationSeconds: number;
  observationStartSeconds: number;
  observationDurationSeconds: number;
  /** The level pill spans the whole beat (quote + observation). */
  badgeStartSeconds: number;
  badgeDurationSeconds: number;
}

export interface TimedCaption {
  text: string;
  startSeconds: number;
  durationSeconds: number;
}

export interface SegmentConfig {
  id: string;
  title: string;
  /** public/ path to the 16:9 background artwork. */
  background: string;
  /** public/ path to the voiceover mp3. */
  voiceover: string;
  fps: number;
  durationInSeconds: number;
  intro: TimedCaption;
  situationLabel: TimedCaption;
  hostCharacter: CharacterId;
  guestCharacter: CharacterId;
  guestAppearsAtSeconds: number;
  beats: DialogueBeat[];
}
