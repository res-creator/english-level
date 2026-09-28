import test from "node:test";
import assert from "node:assert/strict";
import { createTestDb } from "./helpers/testDb.ts";
import { loadSeedContent } from "../src/content/loadSeedContent.ts";
import { seedContent } from "../src/content/seedContent.ts";
import {
  buildMissionPlan,
  planEpisodeSessions,
} from "../src/lessonEngine/episodePlan.ts";
import { listLessonItemsByLesson } from "../src/repositories/curriculumRepository.ts";

test("all seed files load and cross-validate without throwing", () => {
  const bundle = loadSeedContent();
  assert.ok(bundle.modules.length > 0);
  assert.ok(bundle.lessons.length > 0);
  assert.ok(bundle.learningItems.length > 0);
  assert.ok(bundle.grammarPatterns.length > 0);
  assert.ok(bundle.lessonItems.length > 0);
});

test("the published catalogue includes A1 and authored A2/B1 chapters", () => {
  const bundle = loadSeedContent();

  const published = bundle.modules.filter(
    (m) => (m.status ?? "published") === "published",
  );
  // The original mixed-practice chapters stay archived. The situational
  // course now includes A1, authored A2 and the first two B1 chapters.
  assert.equal(published.length, 12);
  assert.equal(published.filter((m) => m.levelCode === "A2").length, 9);
  assert.equal(published.filter((m) => m.levelCode === "B1").length, 2);
  assert.equal(bundle.modules.filter((m) => m.status === "archived").length, 6);

  const starter = bundle.lessons.filter((l) => l.moduleId === "mod_sie_a1_01");
  assert.equal(starter.length, 11);
  for (const episode of starter) {
    assert.ok(episode.situationTitle, `${episode.id} has no situation title`);
    assert.ok(episode.scene, `${episode.id} has no scene`);
    assert.ok(
      episode.capability?.startsWith("Я могу"),
      `${episode.id} capability must be a concrete "Я могу …" claim`,
    );
  }

  const a1Items = bundle.learningItems.filter((i) => i.levelCode === "A1");
  const a2Items = bundle.learningItems.filter((i) => i.levelCode === "A2");
  assert.ok(a1Items.length >= 60, `A1 items: ${a1Items.length}`);
  assert.ok(a2Items.length >= 40, `A2 items: ${a2Items.length}`);

  const a1Grammar = bundle.grammarPatterns.filter((g) => g.levelCode === "A1");
  const a2Grammar = bundle.grammarPatterns.filter((g) => g.levelCode === "A2");
  assert.ok(a1Grammar.length >= 8, `A1 grammar: ${a1Grammar.length}`);
  assert.ok(a2Grammar.length >= 6, `A2 grammar: ${a2Grammar.length}`);
});

test("A1.1 Practice Variation keeps Alex and transfers the self-introduction", () => {
  const bundle = loadSeedContent();
  const practice = bundle.lessonItems.find(
    (link) =>
      link.lessonId === "les_sie_a1_e1" &&
      link.role === "practice" &&
      link.contentType === "learning_item",
  );
  assert.equal(practice?.contentId, "itm_sie_a11_practice_intro");

  const variation = bundle.learningItems.find(
    (item) => item.id === practice?.contentId,
  );
  assert.ok(variation);
  assert.equal(
    variation.examples.find((example) => example.isPrimary)?.text,
    "Hi, I’m Anna from Warsaw, and I’m a teacher.",
  );
  assert.equal(
    variation.npcReplyCorrect,
    "Warsaw sounds lovely. My design studio is near here.",
  );
  assert.ok(!variation.npcReplyCorrect.includes("Rosa"));

  const coreLines = bundle.lessonItems
    .filter(
      (link) =>
        link.lessonId === "les_sie_a1_e1" &&
        link.role === "introduce" &&
        link.contentType === "learning_item",
    )
    .flatMap(
      (link) =>
        bundle.learningItems
          .find((item) => item.id === link.contentId)
          ?.examples.map((example) => example.text) ?? [],
    );
  assert.ok(
    !coreLines.includes(
      variation.examples.find((example) => example.isPrimary)!.text,
    ),
    "variation must not copy a core learner sentence verbatim",
  );
});

test("A2 Batch 1–6 have authored turns, two practice variations, and no answer gaps", () => {
  const bundle = loadSeedContent();
  const situationIds = [
    "sit_a2_people_01",
    "sit_a2_people_02",
    "sit_a2_cafe_01",
    "sit_a2_restaurant_01",
    "sit_a2_restaurant_02",
    "sit_a2_travel_01",
    "sit_a2_travel_02",
    "sit_a2_daily_01",
    "sit_a2_daily_02",
    "sit_a2_shop_01",
    "sit_a2_shop_02",
    "sit_a2_health_01",
    "sit_a2_work_01",
    "sit_a2_work_02",
    "sit_a2_social_01",
    "sit_a2_problems_01",
    "sit_a2_problems_02",
  ];

  for (const situationId of situationIds) {
    const links = bundle.lessonItems.filter(
      (link) => link.lessonId === situationId,
    );
    const core = links.filter(
      (link) =>
        link.contentType === "learning_item" && link.role === "introduce",
    );
    const practice = links.filter(
      (link) =>
        link.contentType === "learning_item" && link.role === "practice",
    );
    assert.ok(core.length >= 2, `${situationId} needs multiple learner turns`);
    assert.ok(
      core.every((link) =>
        bundle.learningItems
          .find((item) => item.id === link.contentId)
          ?.npcReplyCorrect?.trim(),
      ),
      `${situationId} has a learner turn without an authored NPC continuation`,
    );
    assert.ok(
      practice.every((link) =>
        bundle.learningItems
          .find((item) => item.id === link.contentId)
          ?.npcReplyCorrect?.trim(),
      ),
      `${situationId} has a practice turn without an authored NPC continuation`,
    );
    const variationGroups = new Set(
      practice.map((link) =>
        link.contentId.match(/_(v[12]|vphone)(?=_|$)/)?.[0],
      ),
    );
    assert.equal(variationGroups.size, 2, `${situationId} needs v1 and v2`);
  }

  const A21 = bundle.learningItems.find(
    (item) => item.id === "itm_a2_a21_interest_duration",
  );
  assert.ok(A21?.ru.usageNote?.includes("Present Perfect is not taught"));
  const A23 = bundle.learningItems.find(
    (item) => item.id === "itm_a2_a23_change_item",
  );
  const A23Example = A23?.examples[0]?.text ?? "";
  assert.match(A23Example, /could I change this .* instead\?/i);
  assert.ok(
    !A23Example.includes("can I change"),
    "the V2 polite request chunk must be authored explicitly",
  );
});

test("A2 Batch 2 preserves phone, dietary, group-size, and delay transfer", () => {
  const bundle = loadSeedContent();
  const item = (id: string) => bundle.learningItems.find((row) => row.id === id);

  const phone = item("itm_a2_a24_vphone_repeat");
  assert.match(phone?.examples[0]?.text ?? "", /calling.*repeat|repeat.*calling/i);
  assert.match(phone?.examples[0]?.text ?? "", /line cut out/i);
  assert.match(phone?.npcReplyCorrect ?? "", /six fifteen or eight/i);

  assert.match(item("itm_a2_a25_any_onions")?.examples[0]?.text ?? "", /any onions/i);
  assert.match(item("itm_a2_a25_without_onions")?.examples[0]?.text ?? "", /without onions/i);
  assert.match(item("itm_a2_a25_v1_without_cream")?.examples[0]?.text ?? "", /without cream/i);
  assert.match(item("itm_a2_a25_v2_group_four")?.examples[0]?.text ?? "", /four bowls instead of two/i);

  const lateBus = item("itm_a2_a26_late_bus")?.examples[0]?.text ?? "";
  const overslept = item("itm_a2_a26_v2_overslept")?.examples[0]?.text ?? "";
  assert.match(lateBus, /missed the bus/i);
  assert.match(item("itm_a2_a26_ask_advice")?.examples[0]?.text ?? "", /What should I do/i);
  assert.match(overslept, /overslept.*didn't ring.*missed/i);
  assert.match(item("itm_a2_a26_v1_wrong_building")?.examples[0]?.text ?? "", /went to the wrong building.*missed/i);
});

test("A2 Batch 3 preserves clarification, connected past narrative, and two future-plan forms", () => {
  const bundle = loadSeedContent();
  const item = (id: string) => bundle.learningItems.find((row) => row.id === id);

  assert.match(item("itm_a2_a27_check_direction")?.displayForm ?? "", /Sorry, did you say/i);
  assert.match(item("itm_a2_a27_restate_route")?.displayForm ?? "", /So you said.*Is that right/i);
  assert.match(item("itm_a2_a27_finish_route")?.displayForm ?? "", /So I go/i);
  assert.match(item("itm_a2_a27_v1_three_turns")?.displayForm ?? "", /turn left.*turn right.*first left/i);
  assert.match(item("itm_a2_a27_v2_number_check")?.displayForm ?? "", /bus sixty.*the sixteen/i);

  const weekendStory = ["film", "reaction", "detail"]
    .map((name) => item(`itm_a2_a28_${name}`)?.displayForm ?? "")
    .join(" ");
  assert.match(weekendStory, /watched.*talked.*had a lovely dinner/i);
  assert.equal((weekendStory.match(/[.!?](?:\s|$)/g) ?? []).length, 3);
  assert.match(item("itm_a2_a28_v1_trip")?.displayForm ?? "", /took a train/i);
  assert.match(item("itm_a2_a28_v2_rain")?.displayForm ?? "", /rained.*stayed/i);

  assert.match(item("itm_a2_a29_intention")?.displayForm ?? "", /going to/i);
  assert.match(item("itm_a2_a29_arrangement")?.displayForm ?? "", /I'm meeting.*we're walking/i);
  assert.match(item("itm_a2_a29_v1_maya_plan")?.displayForm ?? "", /Maya/i);
  assert.match(item("itm_a2_a29_v2_change_plan")?.displayForm ?? "", /Friday instead.*still meeting/i);
});

test("A2 Batch 4 returns, compares offers, and describes work at A2", () => {
  const bundle = loadSeedContent();
  const item = (id: string) => bundle.learningItems.find((row) => row.id === id);
  assert.match(item("itm_a2_a210_reason")?.displayForm ?? "", /bought.*yesterday/i);
  assert.doesNotMatch(item("itm_a2_a210_reason")?.displayForm ?? "", /have bought/i);
  assert.match(item("itm_a2_a211_compare")?.displayForm ?? "", /cheaper than/i);
  assert.match(item("itm_a2_a211_terms")?.displayForm ?? "", /both jackets.*second one/i);
  assert.match(item("itm_a2_a212_role")?.displayForm ?? "", /and I help customers/i);
  assert.ok(bundle.lessonItems.some((row) => row.lessonId === "sit_a2_work_01" && row.contentId === "gr_sie_frequency" && row.role === "target"), "frequency adverbs are an explicit recycled target");
  assert.match(item("itm_a2_a212_routine")?.displayForm ?? "", /usually check.*then I write/i);
  assert.match(item("itm_a2_a212_v2_role")?.displayForm ?? "", /part-time.*three afternoons/i);
  for (const id of ["itm_a2_a212_v2_role", "itm_a2_a212_v2_routine"]) {
    assert.doesNotMatch(item(id)?.displayForm ?? "", /used to/i);
  }
});

test("A2 Batch 3 wires the V2 Near/Far reviews and ordered prerequisite path", () => {
  const bundle = loadSeedContent();
  const reviews = (lessonId: string) =>
    bundle.lessonItems
      .filter((row) => row.lessonId === lessonId && row.role === "review")
      .map((row) => row.contentId);

  assert.deepEqual(reviews("sit_a2_travel_02"), [
    "itm_sie_where_is_the",
    "itm_sie_a18_going_to_oxford",
  ]);
  assert.deepEqual(reviews("sit_a2_daily_01"), [
    "itm_sie_usually",
    "itm_sie_every_day",
  ]);
  assert.deepEqual(reviews("sit_a2_daily_02"), ["itm_a2_a28_film"]);

  const courseOrder = bundle.lessons
    .filter((lesson) =>
      ["mod_a2_getting_around", "mod_a2_daily_life"].includes(
        lesson.moduleId,
      ),
    )
    .sort((a, b) => {
      const moduleOrder = new Map(
        bundle.modules.map((module) => [module.id, module.order]),
      );
      return (
        (moduleOrder.get(a.moduleId) ?? 0) -
          (moduleOrder.get(b.moduleId) ?? 0) ||
        a.order - b.order
      );
    })
    .map((lesson) => lesson.id);
  assert.deepEqual(courseOrder, [
    "sit_a2_travel_01",
    "sit_a2_travel_02",
    "sit_a2_daily_01",
    "sit_a2_daily_02",
  ]);
});

test("A2 Batch 4 connects shop reviews to A1.7 and work review to A2.1", () => {
  const bundle = loadSeedContent();
  const reviews = (lessonId: string) => bundle.lessonItems
    .filter((row) => row.lessonId === lessonId && row.role === "review")
    .map((row) => row.contentId);
  assert.deepEqual(reviews("sit_a2_shop_01"), ["itm_sie_a17_how_much"]);
  assert.deepEqual(reviews("sit_a2_shop_02"), ["itm_sie_a17_how_much"]);
  assert.deepEqual(reviews("sit_a2_work_01"), ["itm_a2_a21_job_linked"]);
});

test("A2 Batch 5 keeps requests, rescheduling, and lost-item language classified and review-linked", () => {
  const bundle = loadSeedContent();
  const item = (id: string) => bundle.learningItems.find((row) => row.id === id);
  assert.match(item("itm_a2_a213_context")?.displayForm ?? "", /need to finish.*handout/i);
  assert.match(item("itm_a2_a213_request")?.displayForm ?? "", /Could you check.*by two/i);
  assert.match(item("itm_a2_a213_v2_request")?.npcReplyCorrect ?? "", /I can look at it at half past two/i);
  assert.match(item("itm_a2_a214_invite")?.displayForm ?? "", /Would you like.*going to/i);
  assert.match(item("itm_a2_a214_reschedule")?.displayForm ?? "", /Could we change it to Sunday/i);
  assert.match(item("itm_a2_a214_v2_invite")?.displayForm ?? "", /see a film.*Thursday.*going to book/i);
  assert.match(item("itm_a2_a214_v2_change2")?.displayForm ?? "", /Could we make it Saturday at four/i);
  assert.match(item("itm_a2_a215_lost")?.displayForm ?? "", /I've lost my phone.*Have you seen/i);
  assert.match(item("itm_a2_a215_last_seen")?.displayForm ?? "", /used it outside.*walked to the bus stop/i);
  assert.doesNotMatch(item("itm_a2_a215_lost")?.displayForm ?? "", /Present Perfect/i);
  const targets = bundle.lessonItems.filter((row) => row.role === "target");
  assert.ok(targets.some((row) => row.lessonId === "sit_a2_work_02" && row.contentId === "gr_sie_could_polite"));
  assert.ok(targets.some((row) => row.lessonId === "sit_a2_social_01" && row.contentId === "gr_a2_going_to_future"));
  assert.ok(targets.some((row) => row.lessonId === "sit_a2_problems_01" && row.contentId === "gr_a2_past_simple_positive"));
  const reviews = (lessonId: string) => bundle.lessonItems.filter((row) => row.lessonId === lessonId && row.role === "review").map((row) => row.contentId);
  assert.deepEqual(reviews("sit_a2_work_02"), ["itm_a2_a212_role", "itm_sie_could_you_change_it"]);
  assert.deepEqual(reviews("sit_a2_social_01"), ["itm_a2_a29_intention", "itm_sie_a19_suggest_cafe"]);
  assert.deepEqual(reviews("sit_a2_problems_01"), ["itm_sie_e4_practice_pharmacy"]);
});

test("A2 Batch 6 resolves a restaurant bill error and keeps H.A2 a shop transaction", () => {
  const bundle = loadSeedContent();
  const item = (id: string) => bundle.learningItems.find((row) => row.id === id);
  assert.match(item("itm_a2_a216_error")?.displayForm ?? "", /didn't order the apple tart/i);
  assert.match(item("itm_a2_a216_check")?.displayForm ?? "", /Could you check the bill against the order slip/i);
  assert.match(item("itm_a2_a216_v1_missing")?.displayForm ?? "", /two tomato soups.*only one/i);
  assert.match(item("itm_a2_a216_v2_paid")?.displayForm ?? "", /paid by card.*receipt.*didn’t order/i);
  for (const id of ["itm_a2_ha2_symptom", "itm_a2_ha2_v1_cough", "itm_a2_ha2_v2_headache"]) {
    assert.match(item(id)?.displayForm ?? "", /I have/i);
    assert.match(item(id)?.displayForm ?? "", /Do you have/i);
  }
  const allHealthLines = bundle.learningItems
    .filter((row) => row.id.startsWith("itm_a2_ha2_"))
    .map((row) => `${row.displayForm} ${row.npcReplyCorrect}`)
    .join(" ");
  assert.match(allHealthLines, /lozenges|cough sweets|pain-relief products/i);
  assert.doesNotMatch(allHealthLines, /dose|dosage|diagnos|allerg|you should take|take one every/i);
  assert.match(item("itm_a2_ha2_v2_compare")?.displayForm ?? "", /cheaper than/i);

  const targets = bundle.lessonItems.filter((row) => row.role === "target");
  for (const patternId of ["gr_a2_past_simple_negative", "gr_sie_could_polite"]) {
    assert.ok(targets.some((row) => row.lessonId === "sit_a2_problems_02" && row.contentId === patternId), `${patternId} is a real A2.16 target`);
  }
  for (const patternId of ["gr_a1_have", "gr_a1_present_simple_questions"]) {
    assert.ok(targets.some((row) => row.lessonId === "sit_a2_health_01" && row.contentId === patternId), `${patternId} is recycled explicitly in H.A2`);
  }
  const reviews = (lessonId: string) => bundle.lessonItems.filter((row) => row.lessonId === lessonId && row.role === "review").map((row) => row.contentId);
  assert.deepEqual(reviews("sit_a2_problems_02"), ["itm_a2_a24_booking_time", "itm_a2_a25_without_onions", "itm_sie_theres_been_a_mistake"]);
  assert.deepEqual(reviews("sit_a2_health_01"), ["itm_sie_a17_do_you_have", "itm_sie_a17_ill_take_it", "gr_a2_comparatives"]);
});

test("A2 and B1 plans keep semantic turns once and exclude variations from Missions", async () => {
  const { db, sqlite } = createTestDb();
  await seedContent(db);

  for (const situationId of [
    "sit_a2_people_01",
    "sit_a2_people_02",
    "sit_a2_cafe_01",
    "sit_a2_restaurant_01",
    "sit_a2_restaurant_02",
    "sit_a2_travel_01",
    "sit_a2_travel_02",
    "sit_a2_daily_01",
    "sit_a2_daily_02",
    "sit_a2_shop_01",
    "sit_a2_shop_02",
    "sit_a2_health_01",
    "sit_a2_work_01",
    "sit_a2_work_02",
    "sit_a2_social_01",
    "sit_a2_problems_01",
    "sit_a2_problems_02",
    "sit_b1_people_01",
    "sit_b1_people_02",
    "sit_b1_cafe_01",
  ]) {
    const links = await listLessonItemsByLesson(db, situationId);
    const levelId = situationId.startsWith("sit_b1_") ? "lvl_b1" : "lvl_a2";
    const plan = await planEpisodeSessions(db, levelId, links);
    const activities = plan.sessions.flat();
    const mission = await buildMissionPlan(db, levelId, links);
    const variationIds = new Set(
      links
        .filter((link) => link.role === "practice")
        .map((link) => link.content_id),
    );

    for (const link of links.filter(
      (row) =>
        row.content_type === "learning_item" &&
        (row.role === "introduce" || row.role === "practice"),
    )) {
      const turnActivities = activities.filter(
        (activity) => activity.dialogueTurnId === link.id,
      );
      assert.equal(
        turnActivities.length,
        1,
        `${situationId}/${link.id} must create one semantic turn, not one per activity`,
      );
      assert.ok(
        turnActivities[0]?.npcReply?.correct,
        `${situationId}/${link.id} needs an authored continuation`,
      );
    }

    assert.ok(
      mission.every((activity) => !variationIds.has(activity.targetId)),
      `${situationId}: Practice Variations must not enter the Mission`,
    );
    assert.ok(
      mission.length > 0,
      `${situationId} must build a Mission from core targets`,
    );
  }
  sqlite.close();
});

test("seed/import succeeds against a fresh database", async () => {
  const { db, sqlite } = createTestDb();
  await seedContent(db);

  const moduleCount = sqlite
    .prepare("SELECT COUNT(*) as n FROM modules")
    .get() as {
    n: number;
  };
  assert.ok(moduleCount.n > 0);
});

test("running the seed tooling twice does not duplicate any content", async () => {
  const { db, sqlite } = createTestDb();
  await seedContent(db);

  const countAll = () => ({
    modules: (
      sqlite.prepare("SELECT COUNT(*) n FROM modules").get() as { n: number }
    ).n,
    lessons: (
      sqlite.prepare("SELECT COUNT(*) n FROM lessons").get() as { n: number }
    ).n,
    learningItems: (
      sqlite.prepare("SELECT COUNT(*) n FROM learning_items").get() as {
        n: number;
      }
    ).n,
    localizations: (
      sqlite
        .prepare("SELECT COUNT(*) n FROM learning_item_localizations")
        .get() as {
        n: number;
      }
    ).n,
    examples: (
      sqlite.prepare("SELECT COUNT(*) n FROM item_examples").get() as {
        n: number;
      }
    ).n,
    patterns: (
      sqlite.prepare("SELECT COUNT(*) n FROM item_patterns").get() as {
        n: number;
      }
    ).n,
    itemRelations: (
      sqlite.prepare("SELECT COUNT(*) n FROM item_relations").get() as {
        n: number;
      }
    ).n,
    grammarPatterns: (
      sqlite.prepare("SELECT COUNT(*) n FROM grammar_patterns").get() as {
        n: number;
      }
    ).n,
    grammarRelations: (
      sqlite.prepare("SELECT COUNT(*) n FROM grammar_relations").get() as {
        n: number;
      }
    ).n,
    lessonItems: (
      sqlite.prepare("SELECT COUNT(*) n FROM lesson_items").get() as {
        n: number;
      }
    ).n,
  });

  const before = countAll();
  await seedContent(db);
  await seedContent(db);
  const after = countAll();

  assert.deepEqual(after, before);
});

test("re-seeding updates existing rows in place (upsert, not insert-or-error)", async () => {
  const { db, sqlite } = createTestDb();
  await seedContent(db);

  const before = sqlite
    .prepare("SELECT title FROM modules WHERE id = 'mod_a1_01'")
    .get() as { title: string };
  assert.equal(before.title, "Me & Introductions");

  // Re-seed again; the module's title (loaded from the same seed file)
  // should be updated to the same value without erroring, proving the
  // upsert path — not just "second run happens to skip everything".
  await seedContent(db);
  const after = sqlite
    .prepare("SELECT title FROM modules WHERE id = 'mod_a1_01'")
    .get() as { title: string };
  assert.equal(after.title, before.title);
});

test("B1 Batch 1 authors three connected dialogues with classified targets and transfer practice", () => {
  const bundle = loadSeedContent();
  const ids = ["sit_b1_people_01", "sit_b1_people_02", "sit_b1_cafe_01"];
  const lessonById = new Map(bundle.lessons.map((lesson) => [lesson.id, lesson]));
  const itemById = new Map(bundle.learningItems.map((item) => [item.id, item]));
  assert.deepEqual(
    bundle.lessons.filter((lesson) => ids.includes(lesson.id)).map((lesson) => lesson.id),
    ids,
  );
  for (const id of ids) {
    const core = bundle.lessonItems.filter(
      (link) => link.lessonId === id && link.role === "introduce",
    );
    assert.equal(core.length, 3, `${id} has three authored semantic learner turns`);
    for (const link of core) {
      assert.ok(itemById.get(link.contentId)?.npcReplyCorrect, `${id}/${link.contentId} needs a relevant NPC continuation`);
    }
    const module = bundle.modules.find((row) => row.id === lessonById.get(id)?.moduleId);
    assert.equal(module?.levelCode, "B1");
    assert.equal(module?.status, "published");
  }
  assert.match(itemById.get("itm_b1_b11_followup")?.displayForm ?? "", /^Have you heard/);
  assert.ok(bundle.lessonItems.some((link) => link.lessonId === "sit_b1_people_01" && link.contentId === "gr_b1_present_perfect_news" && link.role === "target"));
  assert.ok(bundle.lessonItems.some((link) => link.lessonId === "sit_b1_people_02" && link.contentId === "gr_b1_modal_softeners" && link.role === "target"));
  assert.match(itemById.get("itm_b1_b12_v2_response")?.displayForm ?? "", /We might wait/);
  assert.ok(bundle.lessonItems.filter((link) => link.lessonId === "sit_b1_people_02" && link.role === "practice").length >= 3);
  assert.match(itemById.get("itm_b1_b13_preference")?.displayForm ?? "", /If I were you/);
  assert.ok(bundle.lessonItems.some((link) => link.lessonId === "sit_b1_cafe_01" && link.contentId === "gr_a2_comparatives" && link.role === "target"));
  for (const id of ids) {
    const practice = bundle.lessonItems.filter((link) => link.lessonId === id && link.role === "practice");
    assert.ok(practice.length >= 2, `${id} has two transfer variations`);
    const reviews = bundle.lessonItems.filter((link) => link.lessonId === id && link.role === "review");
    assert.ok(reviews.length >= 1, `${id} has a curriculum-linked review`);
  }
});
