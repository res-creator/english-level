import { artName } from "./artNames.ts";

/**
 * Every illustration slot in the product, with what it is for and what it
 * has to be.
 *
 * This is the brief an illustrator works from and the list the code reads
 * — the same list, so the two can never drift. Adding a slot here does
 * not make it appear; a slot exists because a component asks for it by
 * name, and this records what that component needs.
 */
export type ArtBackground = "transparent" | "opaque";

export interface ArtSlot {
  /** Drop `<name>.png` (plus optional @2x/@3x) into `src/brand/art/`. */
  name: string;
  purpose: string;
  /** Where the learner sees it. */
  appearsIn: string;
  /** Recommended pixel size at 1x; ship 2x/3x for retina. */
  size: `${number}×${number}`;
  aspect: string;
  background: ArtBackground;
  /** Slots the product can live without — they add depth, not meaning. */
  optional?: boolean;
}

const CAST = [
  ["maya", "Майя, бариста"],
  ["alex", "Алекс, новый знакомый"],
  ["emma", "Эмма, продавщица"],
  ["daniel", "Дэниел, коллега"],
  ["leo", "Лео, официант"],
  ["rosa", "Роза, соседка"],
] as const;

const CAST_STATES = [
  ["speaking", "говорит"],
  ["listening", "слушает"],
  ["smiling", "улыбается"],
  ["showing", "протягивает предмет"],
] as const;

const SCENES = [
  ["cafe", "кофейня у дома"],
  ["street", "улица в городе"],
  ["meeting", "место знакомства"],
  ["shop", "магазин на углу"],
  ["restaurant", "ресторан"],
] as const;

const KVO_STATES = [
  ["idle", "рядом"],
  ["thinking", "думает"],
  ["happy", "радуется"],
] as const;

const REWARDS = [
  ["rw_frame", "фоторамка"],
  ["rw_mug", "кружка"],
  ["rw_lamp", "настольная лампа"],
  ["rw_map", "карта города"],
  ["rw_window", "окно с видом"],
  ["rw_plant", "растение"],
  ["rw_shelf", "полка"],
  ["rw_blanket", "плед и кресло"],
  ["rw_shared_plant", "общее растение"],
] as const;

/** Phone-sized full-bleed art: 390×844 at 1x. */
const PHONE = "390×844" as const;

export const ART_SLOTS: ArtSlot[] = [
  // --- Kvo -----------------------------------------------------------
  ...KVO_STATES.map(([state, ru]): ArtSlot => ({
    name: artName.kvo("full", state),
    purpose: `Кво, вариант B — ${ru}`,
    appearsIn: "Сегодня, Курс, Повторение, результат, Моё место, знакомство",
    size: "512×512",
    aspect: "1:1",
    background: "transparent",
  })),
  {
    name: artName.kvo("glyph", "idle"),
    purpose: "Кво, вариант C — плоский, для мелких размеров",
    appearsIn: "логотип-локап на приветствии, иконка",
    size: "256×256",
    aspect: "1:1",
    background: "transparent",
  },

  // --- the recurring cast --------------------------------------------
  ...CAST.flatMap(([id, who]) =>
    CAST_STATES.map(([state, ru]): ArtSlot => ({
      name: artName.cast(id, state),
      purpose: `${who} — ${ru}`,
      appearsIn: "сцена урока, превью ситуации",
      size: "640×672",
      aspect: "≈1:1.05, по грудь",
      background: "transparent",
    })),
  ),

  // --- places ---------------------------------------------------------
  ...SCENES.flatMap(([id, where]): ArtSlot[] => [
    {
      name: artName.sceneBackground(id),
      purpose: `${where} — фон за человеком`,
      appearsIn: "сцена урока, превью ситуации, карточка «Сегодня»",
      size: "1170×900",
      aspect: "1.3:1, обрезается по центру снизу",
      background: "opaque",
    },
    {
      name: artName.sceneForeground(id),
      purpose: `${where} — передний план (край стойки, растение, стол)`,
      appearsIn: "сцена урока, превью ситуации",
      size: "1170×900",
      aspect: "1.3:1",
      background: "transparent",
      optional: true,
    },
  ]),

  // --- hero screens ----------------------------------------------------
  {
    name: artName.heroBackdrop("welcome"),
    purpose: "Фон первого экрана: город, кофейня, вечерний свет",
    appearsIn: "Приветствие",
    size: PHONE,
    aspect: "9:19.5",
    background: "opaque",
  },
  {
    name: artName.heroSubject("welcome"),
    purpose: "Кво крупно, парит над фоном первого экрана",
    appearsIn: "Приветствие",
    size: "900×900",
    aspect: "1:1",
    background: "transparent",
  },
  {
    name: artName.heroBackdrop("demo-result"),
    purpose: "Фон итога демо",
    appearsIn: "Итог демо",
    size: PHONE,
    aspect: "9:19.5",
    background: "opaque",
    optional: true,
  },
  {
    name: artName.heroBackdrop("companion"),
    purpose: "Фон знакомства со спутником",
    appearsIn: "Кто пойдёт с тобой",
    size: PHONE,
    aspect: "9:19.5",
    background: "opaque",
    optional: true,
  },
  {
    name: artName.heroBackdrop("mission-result"),
    purpose: "Фон результата миссии — праздничный, но тихий",
    appearsIn: "Результат миссии и захода",
    size: PHONE,
    aspect: "9:19.5",
    background: "opaque",
    optional: true,
  },

  // --- My Space --------------------------------------------------------
  ...[1, 2, 3, 4].map((stage): ArtSlot => ({
    name: artName.spaceStage(stage),
    purpose: `Комната, стадия ${stage} из 4 — растёт по мере глав`,
    appearsIn: "Моё место",
    size: "1170×1020",
    aspect: "1.15:1",
    background: "opaque",
  })),
  {
    name: artName.spaceForeground(),
    purpose: "Передний план комнаты (ковёр, край стола)",
    appearsIn: "Моё место",
    size: "1170×1020",
    aspect: "1.15:1",
    background: "transparent",
    optional: true,
  },

  // --- memory objects ---------------------------------------------------
  ...REWARDS.map(([id, what]): ArtSlot => ({
    name: artName.spaceObject(id),
    purpose: `Предмет-воспоминание: ${what}`,
    appearsIn: "Моё место, результат миссии, карточка предмета",
    size: "512×512",
    aspect: "1:1",
    background: "transparent",
  })),
];

export const REQUIRED_SLOTS = ART_SLOTS.filter((slot) => !slot.optional);
