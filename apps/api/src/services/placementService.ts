import { PlacementAnswerRequestSchema } from "@english-level/contracts";
import type {
  PlacementQuestionDTO,
  PlacementProgress,
  PlacementResultResponse,
} from "@english-level/contracts";
import type {
  Db,
  PlacementAttemptRow,
  PlacementQuestionRow,
  PlacementAnswerRow,
  PlacementSkillRow,
  CefrLevelRow,
} from "../db/types.ts";
import {
  findQuestionById,
  findPassageById,
  findCandidateQuestions,
} from "../repositories/placementQuestionsRepository.ts";
import {
  findActiveAttempt,
  findAttemptById,
  findLatestCompletedAttempt,
  createAttempt,
  advanceAttempt,
  completeAttemptStatement,
} from "../repositories/placementAttemptsRepository.ts";
import {
  findAnswer,
  listAnswersForAttempt,
  recordAnswer,
} from "../repositories/placementAnswersRepository.ts";
import {
  findUserById,
  completeOnboardingWithVerifiedLevel,
  completeOnboardingWithVerifiedLevelStatement,
} from "../repositories/usersRepository.ts";
import { eventStatement } from "./analyticsService.ts";

/**
 * V1 adaptive placement engine. See docs/placement-test.md for the full
 * write-up — summary:
 *  - one overall difficulty pointer per attempt, moved one CEFR band at a
 *    time, only after 2 consecutive same-direction answers (never on a
 *    single answer)
 *  - skill for the next question is whichever of the 4 has been asked
 *    least so far (even coverage, independent of the difficulty pointer)
 *  - stop at 25 questions regardless, or at >=15 once every skill has
 *    >=3 answered and the pointer has been stable for 4 answers
 *  - the *result* level is a separate, more conservative calculation over
 *    the full answer history (see computeResultLevel), not just wherever
 *    the sampling pointer happened to be when the test stopped
 */
export const TEST_VERSION = "placement_v1";

const LEVELS: CefrLevelRow[] = ["A1", "A2", "B1", "B2"];
const SKILLS: PlacementSkillRow[] = [
  "vocabulary",
  "grammar",
  "reading",
  "active_english",
];
const START_LEVEL: CefrLevelRow = "A2";
const STREAK_TO_MOVE = 2;
const MIN_QUESTIONS = 15;
const MAX_QUESTIONS = 25;
const MIN_PER_SKILL = 3;
const STABILITY_WINDOW = 4;
const PASS_THRESHOLD = 0.6;
const ESTIMATED_TOTAL = 20;

function levelIndex(level: CefrLevelRow): number {
  return LEVELS.indexOf(level);
}

function zeroSkillCounts(): Record<PlacementSkillRow, number> {
  return { vocabulary: 0, grammar: 0, reading: 0, active_english: 0 };
}

export type PlacementFailure =
  | { code: "not_eligible"; message: string }
  | { code: "not_found"; message: string }
  | { code: "attempt_not_active"; message: string }
  | { code: "question_not_issued"; message: string }
  | { code: "validation_error"; message: string };

async function toQuestionDTO(
  db: Db,
  row: PlacementQuestionRow,
): Promise<PlacementQuestionDTO> {
  const options: string[] | null = row.options_json
    ? JSON.parse(row.options_json)
    : null;
  let passage: string | null = null;
  if (row.passage_id) {
    const p = await findPassageById(db, row.passage_id);
    passage = p?.body ?? null;
  }
  return {
    id: row.id,
    type: row.question_type,
    skill: row.skill,
    prompt: row.prompt,
    passage,
    options,
  };
}

function computeProgress(answered: number): PlacementProgress {
  return { answered, estimatedTotal: ESTIMATED_TOTAL };
}

async function selectNextQuestion(
  db: Db,
  params: {
    testVersion: string;
    currentLevelPointer: CefrLevelRow;
    askedIds: string[];
    skillCounts: Record<PlacementSkillRow, number>;
  },
): Promise<PlacementQuestionRow | null> {
  const orderedSkills = [...SKILLS].sort((a, b) => {
    const diff = params.skillCounts[a] - params.skillCounts[b];
    if (diff !== 0) return diff;
    return SKILLS.indexOf(a) - SKILLS.indexOf(b);
  });

  const targetIndex = levelIndex(params.currentLevelPointer);
  const candidateLevels: CefrLevelRow[] = [];
  for (const offset of [0, 1, -1, 2, -2]) {
    const idx = targetIndex + offset;
    const level = LEVELS[idx];
    if (level && !candidateLevels.includes(level)) candidateLevels.push(level);
  }

  for (const skill of orderedSkills) {
    for (const level of candidateLevels) {
      const candidates = await findCandidateQuestions(db, {
        testVersion: params.testVersion,
        skill,
        cefrLevel: level,
        excludeIds: params.askedIds,
      });
      const first = candidates[0];
      if (first) return first;
    }
  }
  return null;
}

function normalizeTyped(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function gradeAnswer(
  question: PlacementQuestionRow,
  submitted: string,
): boolean {
  const accepted: string[] = JSON.parse(question.accepted_answers_json);
  if (question.question_type === "typed_short_answer") {
    const norm = normalizeTyped(submitted);
    return accepted.some((a) => normalizeTyped(a) === norm);
  }
  return accepted.includes(submitted.trim());
}

interface AdaptiveState {
  currentLevelPointer: CefrLevelRow;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  answersSinceLevelChange: number;
}

function updateAdaptiveState(
  attempt: PlacementAttemptRow,
  isCorrect: boolean,
): AdaptiveState {
  let idx = levelIndex(attempt.current_level_pointer);
  let consecutiveCorrect = attempt.consecutive_correct;
  let consecutiveIncorrect = attempt.consecutive_incorrect;
  let changed = false;

  if (isCorrect) {
    consecutiveCorrect += 1;
    consecutiveIncorrect = 0;
    if (consecutiveCorrect >= STREAK_TO_MOVE && idx < LEVELS.length - 1) {
      idx += 1;
      consecutiveCorrect = 0;
      changed = true;
    }
  } else {
    consecutiveIncorrect += 1;
    consecutiveCorrect = 0;
    if (consecutiveIncorrect >= STREAK_TO_MOVE && idx > 0) {
      idx -= 1;
      consecutiveIncorrect = 0;
      changed = true;
    }
  }

  const level = LEVELS[idx] ?? attempt.current_level_pointer;
  return {
    currentLevelPointer: level,
    consecutiveCorrect,
    consecutiveIncorrect,
    answersSinceLevelChange: changed
      ? 0
      : attempt.answers_since_level_change + 1,
  };
}

function shouldStop(
  totalAnswered: number,
  skillCounts: Record<PlacementSkillRow, number>,
  answersSinceLevelChange: number,
): boolean {
  if (totalAnswered >= MAX_QUESTIONS) return true;
  if (totalAnswered < MIN_QUESTIONS) return false;
  if (SKILLS.some((s) => skillCounts[s] < MIN_PER_SKILL)) return false;
  return answersSinceLevelChange >= STABILITY_WINDOW;
}

interface AnsweredWithQuestion {
  answer: PlacementAnswerRow;
  question: PlacementQuestionRow;
}

async function loadAttemptEvidence(db: Db, attemptId: string) {
  const answers = await listAnswersForAttempt(db, attemptId);
  const enriched: AnsweredWithQuestion[] = [];
  const skillCounts = zeroSkillCounts();
  for (const answer of answers) {
    const question = await findQuestionById(db, answer.question_id);
    if (!question) continue; // defensive; FK guarantees this shouldn't happen
    enriched.push({ answer, question });
    skillCounts[question.skill] += 1;
  }
  return {
    answers,
    enriched,
    askedIds: answers.map((a) => a.question_id),
    skillCounts,
  };
}

function computeSkillScores(
  enriched: AnsweredWithQuestion[],
): Record<PlacementSkillRow, number> {
  const totals = zeroSkillCounts();
  const corrects = zeroSkillCounts();
  for (const { answer, question } of enriched) {
    totals[question.skill] += 1;
    if (answer.is_correct) corrects[question.skill] += 1;
  }
  const scores = zeroSkillCounts();
  for (const skill of SKILLS) {
    scores[skill] =
      totals[skill] > 0
        ? Math.round((100 * corrects[skill]) / totals[skill])
        : 0;
  }
  return scores;
}

/** A single consistently-failing skill must be able to cap the result even
 * when the other 3 skills are strong enough to keep the *blended* accuracy
 * at a level above PASS_THRESHOLD — otherwise a mixed profile (e.g. strong
 * vocabulary/reading/active English, zero grammar) could be classified far
 * higher than the evidence supports. Lower than PASS_THRESHOLD on purpose:
 * this only needs to catch a skill that's *not being demonstrated at all*
 * at that level, not penalize a single unlucky miss. */
const MIN_SKILL_THRESHOLD = 0.4;

/**
 * Floors at A1. Walks A2 -> B1 -> B2: a level asked (>=1 question) is
 * accepted, and the walk continues, only if its blended accuracy is
 * >=60% AND no individual tested skill at that level falls below 40%.
 * Failing either check stops the walk immediately — higher levels are
 * never accepted without it. A level never asked is skipped (doesn't
 * block a strong learner who was never probed there).
 */
function computeResultLevel(enriched: AnsweredWithQuestion[]): CefrLevelRow {
  const levelTotals: Record<CefrLevelRow, number> = {
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
  };
  const levelCorrects: Record<CefrLevelRow, number> = {
    A1: 0,
    A2: 0,
    B1: 0,
    B2: 0,
  };
  const cellTotals = new Map<string, number>();
  const cellCorrects = new Map<string, number>();

  for (const { answer, question } of enriched) {
    levelTotals[question.cefr_level] += 1;
    if (answer.is_correct) levelCorrects[question.cefr_level] += 1;

    const key = `${question.cefr_level}|${question.skill}`;
    cellTotals.set(key, (cellTotals.get(key) ?? 0) + 1);
    if (answer.is_correct)
      cellCorrects.set(key, (cellCorrects.get(key) ?? 0) + 1);
  }

  function levelPasses(level: CefrLevelRow): boolean {
    const overallAccuracy = levelCorrects[level] / levelTotals[level];
    if (overallAccuracy < PASS_THRESHOLD) return false;
    for (const skill of SKILLS) {
      const total = cellTotals.get(`${level}|${skill}`) ?? 0;
      if (total === 0) continue; // this skill wasn't tested at this level
      const correct = cellCorrects.get(`${level}|${skill}`) ?? 0;
      if (correct / total < MIN_SKILL_THRESHOLD) return false;
    }
    return true;
  }

  let result: CefrLevelRow = "A1";
  for (const level of ["A2", "B1", "B2"] as CefrLevelRow[]) {
    if (levelTotals[level] === 0) continue;
    if (levelPasses(level)) {
      result = level;
    } else {
      break;
    }
  }
  return result;
}

function strongestWeakest(scores: Record<PlacementSkillRow, number>) {
  let strongest: PlacementSkillRow = "vocabulary";
  let weakest: PlacementSkillRow = "vocabulary";
  for (const skill of SKILLS) {
    if (scores[skill] > scores[strongest]) strongest = skill;
    if (scores[skill] < scores[weakest]) weakest = skill;
  }
  return { strongest, weakest };
}

async function issuedQuestionState(
  db: Db,
  attempt: PlacementAttemptRow,
): Promise<{
  question: PlacementQuestionDTO;
  progress: PlacementProgress;
} | null> {
  if (!attempt.current_question_id) return null;
  const question = await findQuestionById(db, attempt.current_question_id);
  if (!question) return null;
  const answered = (await listAnswersForAttempt(db, attempt.id)).length;
  return {
    question: await toQuestionDTO(db, question),
    progress: computeProgress(answered),
  };
}

/**
 * Completes an attempt and updates the user's verified level in one
 * atomic transaction (`Db.batch`) — the `placement_attempts` row and the
 * `users` row change together or not at all, so a crash or dropped
 * connection between them can't happen: there is no "between them".
 */
async function finalizeAttempt(
  db: Db,
  userId: string,
  attempt: PlacementAttemptRow,
): Promise<void> {
  const evidence = await loadAttemptEvidence(db, attempt.id);
  const scores = computeSkillScores(evidence.enriched);
  const level = computeResultLevel(evidence.enriched);
  const { strongest, weakest } = strongestWeakest(scores);
  const now = new Date().toISOString();

  await db.batch([
    completeAttemptStatement(
      attempt.id,
      {
        resultLevel: level,
        vocabularyScore: scores.vocabulary,
        grammarScore: scores.grammar,
        readingScore: scores.reading,
        activeEnglishScore: scores.active_english,
        strongestSkill: strongest,
        weakestSkill: weakest,
      },
      now,
    ),
    completeOnboardingWithVerifiedLevelStatement(userId, level, now),
    eventStatement(
      "placement_completed",
      {
        userId,
        properties: { level, strongestSkill: strongest, weakestSkill: weakest },
      },
      now,
    ),
  ]);
}

/**
 * Defense in depth beyond the atomic batch above: if a `placement_attempts`
 * row is ever found `completed` with a `result_level` but the owning
 * user's row doesn't reflect it (e.g. data from before this fix, or a
 * hypothetical partial failure of a non-batched write path), this makes
 * the mismatch self-heal the next time the attempt is read or the client
 * retries an answer for it — rather than requiring a manual repair.
 * Idempotent and cheap to call: a no-op whenever the two are already
 * consistent.
 */
async function repairUserStateIfNeeded(
  db: Db,
  userId: string,
  attempt: PlacementAttemptRow,
): Promise<void> {
  if (attempt.status !== "completed" || !attempt.result_level) return;

  const user = await findUserById(db, userId);
  if (!user) return;

  const consistent =
    user.current_cefr_level === attempt.result_level &&
    user.onboarding_stage === "completed" &&
    user.onboarding_completed === 1;
  if (consistent) return;

  await completeOnboardingWithVerifiedLevel(db, userId, attempt.result_level);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type PlacementStartResult =
  | {
      ok: true;
      attemptId: string;
      question: PlacementQuestionDTO;
      progress: PlacementProgress;
    }
  | { ok: false; error: PlacementFailure };

/** Idempotent: resumes an existing in_progress attempt rather than
 * creating a second one. Only starts a fresh attempt when the user is at
 * "placement_required" (no auto-retake — see docs/placement-test.md). */
export async function startPlacementAttempt(
  db: Db,
  userId: string,
): Promise<PlacementStartResult> {
  const active = await findActiveAttempt(db, userId, TEST_VERSION);
  if (active) {
    const state = await issuedQuestionState(db, active);
    if (!state) {
      return {
        ok: false,
        error: {
          code: "not_found",
          message: "active attempt has no issued question",
        },
      };
    }
    return { ok: true, attemptId: active.id, ...state };
  }

  const user = await findUserById(db, userId);
  if (!user) throw new Error(`User ${userId} not found`);

  if (user.onboarding_stage !== "placement_required") {
    return {
      ok: false,
      error: {
        code: "not_eligible",
        message: "placement is not currently available for this account",
      },
    };
  }

  const firstQuestion = await selectNextQuestion(db, {
    testVersion: TEST_VERSION,
    currentLevelPointer: START_LEVEL,
    askedIds: [],
    skillCounts: zeroSkillCounts(),
  });
  if (!firstQuestion) {
    return {
      ok: false,
      error: { code: "not_found", message: "no placement questions available" },
    };
  }

  const attempt = await createAttempt(
    db,
    userId,
    TEST_VERSION,
    START_LEVEL,
    firstQuestion.id,
  );

  return {
    ok: true,
    attemptId: attempt.id,
    question: await toQuestionDTO(db, firstQuestion),
    progress: computeProgress(0),
  };
}

export type PlacementCurrentResult =
  | { ok: true; status: "none" }
  | {
      ok: true;
      status: "in_progress";
      attemptId: string;
      question: PlacementQuestionDTO;
      progress: PlacementProgress;
    }
  | { ok: true; status: "completed"; attemptId: string };

export async function getCurrentPlacementAttempt(
  db: Db,
  userId: string,
): Promise<PlacementCurrentResult> {
  const active = await findActiveAttempt(db, userId, TEST_VERSION);
  if (active) {
    const state = await issuedQuestionState(db, active);
    if (state) {
      return {
        ok: true,
        status: "in_progress",
        attemptId: active.id,
        ...state,
      };
    }
  }

  const completed = await findLatestCompletedAttempt(db, userId, TEST_VERSION);
  if (completed) {
    await repairUserStateIfNeeded(db, userId, completed);
    return { ok: true, status: "completed", attemptId: completed.id };
  }

  return { ok: true, status: "none" };
}

export type PlacementAnswerResult =
  | {
      ok: true;
      status: "continue";
      question: PlacementQuestionDTO;
      progress: PlacementProgress;
    }
  | { ok: true; status: "completed"; attemptId: string }
  | { ok: false; error: PlacementFailure };

export async function submitPlacementAnswer(
  db: Db,
  userId: string,
  attemptId: string,
  input: unknown,
): Promise<PlacementAnswerResult> {
  const parsed = PlacementAnswerRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "validation_error",
        message: parsed.error.issues.map((i) => i.message).join("; "),
      },
    };
  }

  const attempt = await findAttemptById(db, attemptId);
  if (!attempt || attempt.user_id !== userId) {
    return {
      ok: false,
      error: { code: "not_found", message: "attempt not found" },
    };
  }

  // Idempotent retry: this exact question was already answered in this
  // attempt — return the current state instead of grading/scoring again.
  const existingAnswer = await findAnswer(
    db,
    attemptId,
    parsed.data.questionId,
  );
  if (existingAnswer) {
    if (attempt.status === "completed") {
      await repairUserStateIfNeeded(db, userId, attempt);
      return { ok: true, status: "completed", attemptId: attempt.id };
    }
    const state = await issuedQuestionState(db, attempt);
    if (state) return { ok: true, status: "continue", ...state };
    return { ok: true, status: "completed", attemptId: attempt.id };
  }

  if (attempt.status !== "in_progress") {
    return {
      ok: false,
      error: {
        code: "attempt_not_active",
        message: "this attempt is no longer active",
      },
    };
  }

  if (attempt.current_question_id !== parsed.data.questionId) {
    return {
      ok: false,
      error: {
        code: "question_not_issued",
        message: "this question was not issued for this attempt",
      },
    };
  }

  const question = await findQuestionById(db, parsed.data.questionId);
  if (!question) {
    return {
      ok: false,
      error: { code: "not_found", message: "question not found" },
    };
  }

  const isCorrect = gradeAnswer(question, parsed.data.answer);
  await recordAnswer(db, {
    attemptId,
    questionId: question.id,
    answer: parsed.data.answer,
    isCorrect,
    responseTimeMs: parsed.data.responseTimeMs,
  });

  const nextState = updateAdaptiveState(attempt, isCorrect);
  const evidence = await loadAttemptEvidence(db, attemptId);

  if (
    shouldStop(
      evidence.answers.length,
      evidence.skillCounts,
      nextState.answersSinceLevelChange,
    )
  ) {
    const finished = await advanceAttempt(db, attemptId, {
      ...nextState,
      currentQuestionId: null,
    });
    await finalizeAttempt(db, userId, finished);
    return { ok: true, status: "completed", attemptId };
  }

  const next = await selectNextQuestion(db, {
    testVersion: attempt.test_version,
    currentLevelPointer: nextState.currentLevelPointer,
    askedIds: evidence.askedIds,
    skillCounts: evidence.skillCounts,
  });

  if (!next) {
    // Bank exhausted for this attempt's exclusions — finish gracefully.
    const finished = await advanceAttempt(db, attemptId, {
      ...nextState,
      currentQuestionId: null,
    });
    await finalizeAttempt(db, userId, finished);
    return { ok: true, status: "completed", attemptId };
  }

  await advanceAttempt(db, attemptId, {
    ...nextState,
    currentQuestionId: next.id,
  });

  return {
    ok: true,
    status: "continue",
    question: await toQuestionDTO(db, next),
    progress: computeProgress(evidence.answers.length),
  };
}

export type PlacementResultResult =
  | { ok: true; result: PlacementResultResponse }
  | { ok: false; error: PlacementFailure };

export async function getPlacementResult(
  db: Db,
  userId: string,
  attemptId: string,
): Promise<PlacementResultResult> {
  const attempt = await findAttemptById(db, attemptId);
  if (!attempt || attempt.user_id !== userId) {
    return {
      ok: false,
      error: { code: "not_found", message: "attempt not found" },
    };
  }
  if (attempt.status !== "completed" || !attempt.result_level) {
    return {
      ok: false,
      error: {
        code: "attempt_not_active",
        message: "this attempt is not completed yet",
      },
    };
  }

  await repairUserStateIfNeeded(db, userId, attempt);
  const user = await findUserById(db, userId);

  return {
    ok: true,
    result: {
      level: attempt.result_level,
      scores: {
        vocabulary: attempt.vocabulary_score ?? 0,
        grammar: attempt.grammar_score ?? 0,
        reading: attempt.reading_score ?? 0,
        activeEnglish: attempt.active_english_score ?? 0,
      },
      strongestSkill: attempt.strongest_skill ?? "vocabulary",
      weakestSkill: attempt.weakest_skill ?? "vocabulary",
      selfReportedLevel:
        (user?.self_reported_cefr_level as PlacementResultResponse["selfReportedLevel"]) ??
        null,
    },
  };
}
