import type {
  ModuleSeed,
  LessonSeed,
  LearningItemSeed,
  ItemRelationSeed,
  GrammarPatternSeed,
  GrammarRelationSeed,
  LessonItemSeed,
} from "./schemas.ts";

/**
 * A fully validated, cross-referenced set of curriculum content. Split
 * into its own file (no Node-specific imports) so `buildSeedStatements.ts`
 * — which must stay resolvable under the Workers tsconfig — can depend on
 * this type without pulling in `loadSeedContent.ts`'s `node:fs`/`node:url`
 * usage.
 */
export interface ContentBundle {
  modules: ModuleSeed[];
  lessons: LessonSeed[];
  learningItems: LearningItemSeed[];
  itemRelations: ItemRelationSeed[];
  grammarPatterns: GrammarPatternSeed[];
  grammarRelations: GrammarRelationSeed[];
  lessonItems: LessonItemSeed[];
}
