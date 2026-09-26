-- ---------------------------------------------------------------------------
-- NPC dialogue continuation.
--
-- Audit finding (A1_FULL_LEARNING_QA.md): after the opening line, no NPC
-- ever speaks again in a session or Mission — the transcript degrades
-- into a stack of the learner's own lines. The fix needs a real, authored
-- reply per conversational beat, not a generated one — see
-- apps/web/src/routes/Session.tsx and apps/api/src/content/schemas.ts's
-- SieLearningItemSeedSchema doc comment for the full design.
--
-- Nullable at the table level (learning_items is shared by the a1/a2
-- tracks too, which don't have this "one continuous situation" framing
-- and aren't required to carry it) — the requirement that the sie-a1
-- track always has npc_reply_correct is enforced at seed-content
-- validation time, not by a DB constraint.
-- ---------------------------------------------------------------------------

ALTER TABLE learning_items ADD COLUMN npc_reply_correct TEXT;
ALTER TABLE learning_items ADD COLUMN npc_reply_incorrect TEXT;
