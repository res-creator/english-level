/**
 * Minimal runtime-agnostic database interface. Repositories depend only on
 * this, never on `D1Database` directly, so they can run unmodified against
 * either a real D1 binding or a `node:sqlite` instance in tests.
 */
export interface DbStatement {
  sql: string;
  params?: unknown[];
}

export interface Db {
  run(sql: string, params?: unknown[]): Promise<void>;
  all<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  first<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>;
  /**
   * Executes multiple statements as a single atomic transaction — all
   * succeed or all fail together. Used where two related tables must
   * change in lockstep (e.g. placement completion: the attempt row and
   * the user row). Backed by D1's real `batch()` (a genuine transaction)
   * against a live binding, and `BEGIN`/`COMMIT`/`ROLLBACK` against
   * `node:sqlite` in tests.
   */
  batch(statements: DbStatement[]): Promise<void>;
}

export type UserStatus = "active" | "archived";

/** Phase 3 onboarding progress. Stops at "placement_required" until a
 * future phase implements placement and sets "completed". */
export type OnboardingStageRow =
  "goals" | "daily_time" | "level_choice" | "placement_required" | "completed";

export interface UserRow {
  id: string;
  telegram_user_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  interface_language: string;
  timezone: string | null;
  current_cefr_level: string | null;
  onboarding_completed: number;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_active_at: string | null;
  /** Self-assessment collected during onboarding — never a verified level.
   * Distinct from `current_cefr_level`, which stays null until placement. */
  self_reported_cefr_level: string | null;
  onboarding_stage: OnboardingStageRow;
}

export interface UserSettingsRow {
  user_id: string;
  daily_minutes: number;
  learning_goals_json: string;
  preferred_accent: string;
  interface_language: string;
  daily_reminder_enabled: number;
  daily_reminder_period: string | null;
  review_notifications: number;
  streak_notifications: number;
  duo_notifications: number;
  weekly_report_notifications: number;
  quiet_hours_enabled: number;
  quiet_start: string | null;
  quiet_end: string | null;
  show_level_to_duo: number;
  created_at: string;
  updated_at: string;
}

export interface UserAcquisitionRow {
  user_id: string;
  source: string | null;
  campaign: string | null;
  content: string | null;
  referrer_user_id: string | null;
  first_touch_at: string;
}

export interface LevelRow {
  id: string;
  code: string;
  name: string;
  order_index: number;
  description: string | null;
  is_active: number;
}

export interface SessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  created_at: string;
  expires_at: string;
  last_used_at: string | null;
}

// ---------------------------------------------------------------------------
// Phase 4: placement test
// ---------------------------------------------------------------------------

export type PlacementSkillRow =
  "vocabulary" | "grammar" | "reading" | "active_english";

export type CefrLevelRow = "A1" | "A2" | "B1" | "B2";

export type PlacementQuestionTypeRow =
  | "multiple_choice"
  | "fill_gap_choice"
  | "reading_multiple_choice"
  | "typed_short_answer";

export interface PlacementPassageRow {
  id: string;
  cefr_level: CefrLevelRow;
  title: string | null;
  body: string;
}

export interface PlacementQuestionRow {
  id: string;
  test_version: string;
  skill: PlacementSkillRow;
  cefr_level: CefrLevelRow;
  question_type: PlacementQuestionTypeRow;
  prompt: string;
  passage_id: string | null;
  /** JSON array of option strings; null for typed_short_answer. */
  options_json: string | null;
  /** JSON array — the correct option (choice types) or accepted normalized
   * answer variants (typed_short_answer). Never sent to the client. */
  accepted_answers_json: string;
  status: "active" | "archived";
  created_at: string;
}

export type PlacementAttemptStatusRow =
  "in_progress" | "completed" | "abandoned";

export interface PlacementAttemptRow {
  id: string;
  user_id: string;
  test_version: string;
  status: PlacementAttemptStatusRow;
  started_at: string;
  completed_at: string | null;
  result_level: CefrLevelRow | null;
  vocabulary_score: number | null;
  grammar_score: number | null;
  reading_score: number | null;
  active_english_score: number | null;
  strongest_skill: PlacementSkillRow | null;
  weakest_skill: PlacementSkillRow | null;
  /** Adaptive engine's internal sampling state — see docs/placement-test.md. */
  current_level_pointer: CefrLevelRow;
  consecutive_correct: number;
  consecutive_incorrect: number;
  answers_since_level_change: number;
  current_question_id: string | null;
}

export interface PlacementAnswerRow {
  id: string;
  attempt_id: string;
  question_id: string;
  answer: string;
  is_correct: number;
  response_time_ms: number | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Phase 5: curriculum & content
// ---------------------------------------------------------------------------

export type ContentStatusRow = "draft" | "published" | "archived";

export interface ModuleRow {
  id: string;
  level_id: string;
  title: string;
  slug: string;
  description: string | null;
  order_index: number;
  status: ContentStatusRow;
  content_version: number;
  created_at: string;
  updated_at: string;
}

export type LessonTypeRow =
  "vocabulary" | "grammar" | "mixed" | "reading" | "practice" | "checkpoint";

export interface LessonRow {
  id: string;
  module_id: string;
  title: string;
  lesson_type: LessonTypeRow;
  order_index: number;
  estimated_minutes: number | null;
  status: ContentStatusRow;
  content_version: number;
  created_at: string;
  updated_at: string;
  /** Episode framing (Speak in English V1) — null for legacy lessons. */
  situation_title: string | null;
  scene: string | null;
  capability: string | null;
  teaser: string | null;
}

export type LearningItemTypeRow =
  | "word"
  | "phrase"
  | "collocation"
  | "phrasal_verb"
  | "functional_phrase"
  | "contrast";

export interface LearningItemRow {
  id: string;
  item_type: LearningItemTypeRow;
  lemma: string;
  display_form: string;
  part_of_speech: string | null;
  level_id: string;
  frequency_band: string | null;
  difficulty: number | null;
  is_core: number;
  topic: string | null;
  subtopic: string | null;
  pronunciation_ipa: string | null;
  audio_key: string | null;
  provenance: "original" | "derived_open_data";
  status: ContentStatusRow;
  content_version: number;
  npc_reply_correct: string | null;
  npc_reply_incorrect: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearningItemLocalizationRow {
  item_id: string;
  language: string;
  translation: string;
  simple_explanation: string | null;
  usage_note: string | null;
  common_error_explanation: string | null;
  status: ContentStatusRow;
  content_version: number;
}

export interface ItemExampleRow {
  id: string;
  item_id: string;
  example_text: string;
  level_id: string | null;
  is_primary: number;
  status: ContentStatusRow;
  content_version: number;
}

export interface ItemPatternRow {
  id: string;
  item_id: string;
  pattern_text: string;
  correct_example: string | null;
  incorrect_example: string | null;
  order_index: number;
}

export interface GrammarPatternRow {
  id: string;
  level_id: string;
  title: string;
  pattern_key: string;
  formula: string | null;
  explanation_en: string;
  difficulty: number | null;
  order_index: number;
  status: ContentStatusRow;
  content_version: number;
  created_at: string;
  updated_at: string;
}

export interface GrammarPatternLocalizationRow {
  grammar_pattern_id: string;
  language: string;
  explanation: string;
  usage_note: string | null;
  common_mistake: string | null;
}

export type LessonItemContentTypeRow = "learning_item" | "grammar_pattern";
export type LessonItemRoleRow = "introduce" | "practice" | "review" | "target";

export interface LessonItemRow {
  id: string;
  lesson_id: string;
  content_type: LessonItemContentTypeRow;
  content_id: string;
  role: LessonItemRoleRow;
  order_index: number;
  required: number;
}

// ---------------------------------------------------------------------------
// Phase 6: lesson execution engine
// ---------------------------------------------------------------------------

export type LearningSessionStatusRow =
  "in_progress" | "completed" | "abandoned";

export type SessionKindRow = "lesson" | "mission";

export interface LearningSessionRow {
  id: string;
  user_id: string;
  lesson_id: string;
  session_type: "lesson";
  /** Ordinary daily session vs the episode's Mission. */
  session_kind: SessionKindRow;
  /** Which slice of the episode this run covers (1-based). */
  session_index: number;
  status: LearningSessionStatusRow;
  started_at: string;
  completed_at: string | null;
  current_position: number;
  correct_count: number;
  wrong_count: number;
  /** JSON-serialized StoredActivity[] — see lessonEngine/activityTypes.ts. */
  activities_json: string;
  created_at: string;
  updated_at: string;
}

export type ExerciseTypeRow =
  | "info_card"
  | "grammar_card"
  | "multiple_choice"
  | "fill_gap_choice"
  | "typed_recall"
  | "sentence_build";

export interface ExerciseAttemptRow {
  id: string;
  user_id: string;
  session_id: string;
  activity_id: string;
  activity_index: number;
  target_type: LessonItemContentTypeRow;
  target_id: string;
  exercise_type: ExerciseTypeRow;
  answer: string;
  is_correct: number;
  response_time_ms: number | null;
  attempt_key: string;
  created_at: string;
}

export type UserLessonProgressStatusRow =
  "not_started" | "in_progress" | "completed";

export interface UserLessonProgressRow {
  user_id: string;
  lesson_id: string;
  status: UserLessonProgressStatusRow;
  started_at: string | null;
  completed_at: string | null;
  attempt_count: number;
  last_session_id: string | null;
  accuracy: number | null;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Speak in English V1: capabilities, spaced review, companion, rewards,
// friends. See migrations/0007_product_v1.sql.
// ---------------------------------------------------------------------------

export type CapabilityStateRow = "learning" | "can_do" | "consolidated";

/** Episode-level progression — the source of truth for "what can I do". */
export interface UserCapabilityRow {
  user_id: string;
  lesson_id: string;
  state: CapabilityStateRow;
  sessions_done: number;
  sessions_total: number;
  mission_attempts: number;
  can_do_at: string | null;
  consolidated_at: string | null;
  started_at: string;
  updated_at: string;
}

export interface UserItemMemoryRow {
  user_id: string;
  target_type: LessonItemContentTypeRow;
  target_id: string;
  lesson_id: string | null;
  /** 1..5 — drives the interval (1 day, 3, 7, 16, 35). */
  box: number;
  due_at: string;
  last_result: "correct" | "wrong" | null;
  correct_streak: number;
  reviews: number;
  first_seen_at: string;
  updated_at: string;
}

export interface ReviewSessionRow {
  id: string;
  user_id: string;
  status: LearningSessionStatusRow;
  started_at: string;
  completed_at: string | null;
  current_position: number;
  correct_count: number;
  wrong_count: number;
  activities_json: string;
  created_at: string;
  updated_at: string;
}

export interface UserCompanionRow {
  user_id: string;
  companion_id: string;
  selected_at: string;
}

export type RewardSourceKindRow =
  "episode" | "mission" | "consolidated" | "chapter" | "milestone" | "shared";

export interface UserRewardRow {
  user_id: string;
  reward_id: string;
  source_kind: RewardSourceKindRow;
  source_id: string | null;
  unlocked_at: string;
}

export interface FriendInviteRow {
  code: string;
  inviter_user_id: string;
  accepted_by_user_id: string | null;
  created_at: string;
  accepted_at: string | null;
}

export interface FriendshipRow {
  user_id: string;
  friend_user_id: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Pilot analytics
// ---------------------------------------------------------------------------

export interface AnalyticsEventRow {
  id: string;
  user_id: string | null;
  anonymous_id: string | null;
  event_name: string;
  properties_json: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Pilot error visibility
// ---------------------------------------------------------------------------

export interface ErrorLogRow {
  id: string;
  user_id: string | null;
  source: string;
  path: string | null;
  message: string;
  stack: string | null;
  created_at: string;
}
