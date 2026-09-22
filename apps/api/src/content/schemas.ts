import { z } from "zod";

/**
 * Zod schemas for the *seed file* shape (what lives under seeds/content/)
 * — distinct from both the DB row shape (apps/api/src/db/types.ts) and the
 * public API DTOs (packages/contracts). This is the authoring/import
 * format content authors actually write.
 */

export const CefrLevelCodeSchema = z.enum(["A1", "A2", "B1", "B2"]);

export const ModuleSeedSchema = z.object({
  id: z.string().min(1),
  levelCode: CefrLevelCodeSchema,
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1).optional(),
  order: z.number().int().positive(),
});
export type ModuleSeed = z.infer<typeof ModuleSeedSchema>;

export const LessonTypeSchema = z.enum([
  "vocabulary",
  "grammar",
  "mixed",
  "reading",
  "practice",
  "checkpoint",
]);

export const LessonSeedSchema = z.object({
  id: z.string().min(1),
  moduleId: z.string().min(1),
  title: z.string().min(1),
  lessonType: LessonTypeSchema,
  order: z.number().int().positive(),
  estimatedMinutes: z.number().int().positive().optional(),
});
export type LessonSeed = z.infer<typeof LessonSeedSchema>;

export const ItemTypeSchema = z.enum([
  "word",
  "phrase",
  "collocation",
  "phrasal_verb",
  "functional_phrase",
  "contrast",
]);

const ItemExampleSeedSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  levelCode: CefrLevelCodeSchema.optional(),
  isPrimary: z.boolean(),
});

const ItemPatternSeedSchema = z.object({
  id: z.string().min(1),
  patternText: z.string().min(1),
  correctExample: z.string().min(1).optional(),
  incorrectExample: z.string().min(1).optional(),
  order: z.number().int().positive(),
});

const ItemLocalizationSeedSchema = z.object({
  translation: z.string().min(1),
  simpleExplanation: z.string().min(1).nullable().optional(),
  usageNote: z.string().min(1).nullable().optional(),
  commonErrorExplanation: z.string().min(1).nullable().optional(),
});

export const LearningItemSeedSchema = z
  .object({
    id: z.string().min(1),
    itemType: ItemTypeSchema,
    lemma: z.string().min(1),
    displayForm: z.string().min(1),
    partOfSpeech: z.string().min(1).nullable().optional(),
    levelCode: CefrLevelCodeSchema,
    frequencyBand: z.string().min(1).nullable().optional(),
    difficulty: z.number().int().nullable().optional(),
    isCore: z.boolean().optional(),
    topic: z.string().min(1).nullable().optional(),
    subtopic: z.string().min(1).nullable().optional(),
    pronunciationIpa: z.string().min(1).nullable().optional(),
    audioKey: z.string().min(1).nullable().optional(),
    ru: ItemLocalizationSeedSchema,
    examples: z
      .array(ItemExampleSeedSchema)
      .min(1, "at least one example is required"),
    patterns: z.array(ItemPatternSeedSchema).optional(),
  })
  .refine((item) => item.examples.filter((e) => e.isPrimary).length === 1, {
    message: "an item must have exactly one primary example",
    path: ["examples"],
  });
export type LearningItemSeed = z.infer<typeof LearningItemSeedSchema>;

export const ItemRelationTypeSchema = z.enum([
  "confused_with",
  "word_family",
  "synonym",
  "antonym",
  "related",
]);

export const ItemRelationSeedSchema = z.object({
  fromItemId: z.string().min(1),
  toItemId: z.string().min(1),
  relationType: ItemRelationTypeSchema,
});
export type ItemRelationSeed = z.infer<typeof ItemRelationSeedSchema>;

export const GrammarPatternSeedSchema = z.object({
  id: z.string().min(1),
  levelCode: CefrLevelCodeSchema,
  title: z.string().min(1),
  patternKey: z.string().min(1),
  formula: z.string().min(1).optional(),
  explanationEn: z.string().min(1),
  difficulty: z.number().int().optional(),
  order: z.number().int().positive(),
  ru: z.object({
    explanation: z.string().min(1),
    usageNote: z.string().min(1).optional(),
    commonMistake: z.string().min(1).optional(),
  }),
});
export type GrammarPatternSeed = z.infer<typeof GrammarPatternSeedSchema>;

export const GrammarRelationTypeSchema = z.enum([
  "prerequisite",
  "confused_with",
  "related",
]);

export const GrammarRelationSeedSchema = z.object({
  fromPatternId: z.string().min(1),
  toPatternId: z.string().min(1),
  relationType: GrammarRelationTypeSchema,
});
export type GrammarRelationSeed = z.infer<typeof GrammarRelationSeedSchema>;

export const LessonItemRoleSchema = z.enum([
  "introduce",
  "practice",
  "review",
  "target",
]);

export const LessonItemContentTypeSchema = z.enum([
  "learning_item",
  "grammar_pattern",
]);

export const LessonItemSeedSchema = z.object({
  id: z.string().min(1),
  lessonId: z.string().min(1),
  contentType: LessonItemContentTypeSchema,
  contentId: z.string().min(1),
  role: LessonItemRoleSchema,
  order: z.number().int().positive(),
  required: z.boolean().optional(),
});
export type LessonItemSeed = z.infer<typeof LessonItemSeedSchema>;
