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

test("the published catalogue includes A1 and authored A2/B1/B2 chapters", () => {
  const bundle = loadSeedContent();

  const published = bundle.modules.filter(
    (m) => (m.status ?? "published") === "published",
  );
  // The original mixed-practice chapters stay archived. The situational
  // course now includes A1, authored A2/B1, and all sixteen B2 modules.
  assert.equal(published.length, 35);
  assert.equal(published.filter((m) => m.levelCode === "A2").length, 9);
  assert.equal(published.filter((m) => m.levelCode === "B1").length, 9);
  assert.equal(published.filter((m) => m.levelCode === "B2").length, 16);
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

test("A2, B1 and B2 plans keep semantic turns once and exclude variations from Missions", async () => {
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
    "sit_b1_restaurant_01",
    "sit_b1_restaurant_02",
    "sit_b1_travel_01",
    "sit_b1_travel_02",
    "sit_b1_daily_01",
    "sit_b1_daily_02",
    "sit_b2_people_01",
    "sit_b2_restaurant_01",
    "sit_b2_restaurant_02",
    "sit_b2_travel_01",
    "sit_b2_travel_02",
    "sit_b2_daily_01",
    "sit_b2_shop_01",
    "sit_b2_work_01",
    "sit_b2_work_02",
    "sit_b2_work_03",
    "sit_b2_work_04",
    "sit_b2_social_01",
    "sit_b2_problems_01",
    "sit_b2_problems_02",
    "sit_b2_people_03",
    "sit_b2_work_05",
    "sit_b2_people_04",
    "sit_b2_social_02",
    "sit_b2_daily_02",
    "sit_b2_people_05",
    "sit_b2_work_06",
    "sit_b2_health_01",
  ]) {
    const links = await listLessonItemsByLesson(db, situationId);
    const levelId = situationId.startsWith("sit_b2_")
      ? "lvl_b2"
      : situationId.startsWith("sit_b1_")
        ? "lvl_b1"
        : "lvl_a2";
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

test("B1 authored situations keep coherent semantic turns, classifications, reviews and transfer practice", () => {
  const bundle = loadSeedContent();
  const ids = ["sit_b1_people_01", "sit_b1_people_02", "sit_b1_cafe_01", "sit_b1_restaurant_01", "sit_b1_restaurant_02", "sit_b1_travel_01", "sit_b1_travel_02", "sit_b1_daily_01", "sit_b1_daily_02", "sit_b1_shop_01", "sit_b1_shop_02", "sit_b1_work_01", "sit_b1_work_02", "sit_b1_work_03", "sit_b1_social_01", "sit_b1_social_02", "sit_b1_problems_01", "sit_b1_problems_02", "sit_b1_health_01"];
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
    assert.ok(core.length >= 3, `${id} has at least three authored semantic learner turns`);
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
  for (const id of ids.slice(3)) {
    assert.ok(bundle.lessonItems.filter((link) => link.lessonId === id && link.role === "practice").length >= 2);
    assert.ok(bundle.lessonItems.filter((link) => link.lessonId === id && link.role === "introduce").length >= 3);
  }
  assert.ok(bundle.lessonItems.some((link) => link.lessonId === "sit_b1_restaurant_01" && link.contentId === "gr_a1_present_simple_questions" && link.role === "target"));
  assert.match(itemById.get("itm_b1_b14_v1_vegetarian")?.displayForm ?? "", /preference rather than an allergy/);
  assert.match(itemById.get("itm_b1_b14_v2_two_dishes")?.displayForm ?? "", /both the flatbread and the dressing/);
  assert.match(itemById.get("itm_b1_b15_wait")?.ru.usageNote ?? "", /not a grammar target/);
  assert.match(itemById.get("itm_b1_b15_v2_hold_position")?.npcReplyCorrect ?? "", /kitchen has been very busy/);
  assert.match(itemById.get("itm_b1_b15_v2_response")?.displayForm ?? "", /we still waited.*meal was cold/);
  assert.match(itemById.get("itm_b1_b16_cancelled")?.ru.usageNote ?? "", /not a grammar target/);
  assert.match(itemById.get("itm_b1_b16_v2_options")?.displayForm ?? "", /take the bus because/);
  assert.ok(bundle.lessonItems.some((link) => link.lessonId === "sit_b1_travel_02" && link.contentId === "gr_b1_worth_ing_recommendations" && link.role === "target"));
  assert.match(itemById.get("itm_b1_b17_v1_food")?.displayForm ?? "", /market worth trying.*recommend/);
  assert.match(itemById.get("itm_b1_b17_v2_time")?.displayForm ?? "", /only two hours/);
  assert.ok(bundle.lessonItems.some((link) => link.lessonId === "sit_b1_daily_01" && link.contentId === "gr_b1_present_perfect_experience" && link.role === "target"));
  assert.ok(bundle.lessonItems.some((link) => link.lessonId === "sit_b1_daily_02" && link.contentId === "gr_b1_used_to_past_habits" && link.role === "target"));
  assert.match(itemById.get("itm_b1_b18_trip_experience")?.displayForm ?? "", /^I've had.*I went/);
  assert.match(itemById.get("itm_b1_b18_v2_two_events")?.displayForm ?? "", /first.*and then.*We moved/);
  assert.match(itemById.get("itm_b1_b19_v1_habit")?.displayForm ?? "", /used to read.*but now/);
  assert.match(itemById.get("itm_b1_b19_v2_gradual")?.displayForm ?? "", /used to drive.*gradual/);
  assert.match(
    itemById.get("itm_b1_b110_duplicate_charge")?.displayForm ?? "",
    /was charged twice/i,
  );
  assert.match(
    itemById.get("itm_b1_b110_v1_wrong_tier")?.displayForm ?? "",
    /basic plan.*charged for the premium/i,
  );
  assert.match(
    itemById.get("itm_b1_b110_v2_second_call")?.displayForm ?? "",
    /called on Monday.*still on my bill/i,
  );
  assert.ok(
    bundle.lessonItems.some(
      (link) =>
        link.lessonId === "sit_b1_shop_01" &&
        link.contentId === "gr_b1_past_passive_billing" &&
        link.role === "target",
    ),
  );
  assert.match(
    itemById.get("itm_b1_b111_weigh_tradeoff")?.displayForm ?? "",
    /cheaper.*best battery life.*rather/i,
  );
  assert.match(
    itemById.get("itm_b1_b111_v1_services")?.displayForm ?? "",
    /monthly service.*yearly service/i,
  );
  assert.match(
    itemById.get("itm_b1_b111_v2_three_options")?.displayForm ?? "",
    /cheapest.*stronger.*lightest/i,
  );
  for (const grammarId of [
    "gr_a2_comparatives",
    "gr_b1_superlatives_choice",
    "gr_b1_would_rather_preference",
  ]) {
    assert.ok(
      bundle.lessonItems.some(
        (link) =>
          link.lessonId === "sit_b1_shop_02" &&
          link.contentId === grammarId &&
          link.role === "target",
      ),
    );
  }
  assert.match(
    itemById.get("itm_b1_b112_task_result")?.displayForm ?? "",
    /What I need is.*guest list/i,
  );
  assert.match(
    itemById.get("itm_b1_b112_deadline")?.displayForm ?? "",
    /by the end of Thursday/i,
  );
  assert.match(
    itemById.get("itm_b1_b112_v1_document")?.displayForm ?? "",
    /two-page summary.*by the end of Wednesday/i,
  );
  assert.match(
    itemById.get("itm_b1_b112_vphone_remote")?.displayForm ?? "",
    /can't see the project board.*folder called June Launch/i,
  );
  assert.ok(
    bundle.lessonItems.some(
      (link) =>
        link.lessonId === "sit_b1_work_01" &&
        link.contentId === "gr_b1_need_task_requirements" &&
        link.role === "target",
    ),
  );
  assert.ok(
    bundle.lessonItems.some(
      (link) =>
        link.lessonId === "sit_b1_work_01" &&
        link.contentId === "gr_b1_by_end_deadline" &&
        link.role === "target",
    ),
  );
  assert.ok(bundle.lessonItems.some((link) => link.lessonId === "sit_b1_travel_02" && link.contentId === "gr_a2_comparatives" && link.role === "target"));
  assert.ok(bundle.lessonItems.some((link) => link.lessonId === "sit_b1_daily_01" && link.contentId === "gr_a2_past_simple_positive" && link.role === "target"));
  assert.ok(bundle.lessonItems.filter((link) => link.lessonId === "sit_b1_daily_01" && link.role === "practice").length >= 3);
  assert.match(itemById.get("itm_b1_b113_request")?.displayForm ?? "", /Would you mind checking the room bookings/i);
  assert.match(itemById.get("itm_b1_b113_v1_schedule")?.displayForm ?? "", /covering reception.*meet the supplier/i);
  assert.match(itemById.get("itm_b1_b113_v2_condition")?.displayForm ?? "", /one page.*before four/i);
  assert.ok(bundle.lessonItems.some((link) => link.lessonId === "sit_b1_work_02" && link.contentId === "gr_b1_would_mind_favour" && link.role === "target"));
  assert.match(itemById.get("itm_b1_b114_experience")?.displayForm ?? "", /^I've worked in this field for three years/i);
  assert.match(itemById.get("itm_b1_b114_strength")?.displayForm ?? "", /main strength.*organised.*priority list/i);
  assert.match(itemById.get("itm_b1_b114_v2_hire_reason")?.displayForm ?? "", /choose me because.*coordinated busy shifts/i);
  for (const grammarId of ["gr_b1_present_perfect_experience", "gr_b1_because_interview_reasons"]) {
    assert.ok(bundle.lessonItems.some((link) => link.lessonId === "sit_b1_work_03" && link.contentId === grammarId && link.role === "target"));
  }
  assert.match(itemById.get("itm_b1_b115_what_if")?.displayForm ?? "", /What if we meet at five/i);
  assert.match(itemById.get("itm_b1_b115_v1_trip")?.displayForm ?? "", /nine o'clock train.*station entrance/i);
  assert.match(itemById.get("itm_b1_b115_v2_replan")?.displayForm ?? "", /half past two.*if they agree/i);
  assert.ok(bundle.lessonItems.some((link) => link.lessonId === "sit_b1_social_01" && link.contentId === "gr_b1_what_if_coordination" && link.role === "target"));
  assert.match(itemById.get("itm_b1_b116_decline")?.displayForm ?? "", /I'd love to.*but/i);
  assert.match(itemById.get("itm_b1_b116_alternative")?.displayForm ?? "", /instead of the picnic/i);
  assert.match(itemById.get("itm_b1_b116_v1_work")?.displayForm ?? "", /studio talk.*presenting our project/i);
  assert.match(itemById.get("itm_b1_b116_v2_explain")?.displayForm ?? "", /promised to help my parents move.*outdoor concert/i);
  assert.ok(bundle.lessonItems.some((link) => link.lessonId === "sit_b1_social_02" && link.contentId === "gr_b1_would_love_but_refusal" && link.role === "target"));
  assert.match(itemById.get("itm_b1_b117_explain")?.displayForm ?? "", /from the start.*without the base.*another cable/i);
  assert.match(itemById.get("itm_b1_b117_confirm")?.displayForm ?? "", /So what you're saying is.*Is that right/i);
  assert.match(itemById.get("itm_b1_b117_v1_solution")?.displayForm ?? "", /First.*courier.*then.*replacement/i);
  assert.match(itemById.get("itm_b1_b117_vvoicemail")?.displayForm ?? "", /this is Anna Kowalski.*order L-4821.*call me back/i);
  assert.ok(bundle.lessonItems.some((link) => link.lessonId === "sit_b1_problems_01" && link.contentId === "gr_b1_reported_confirmation_problem" && link.role === "target"));
  assert.match(itemById.get("itm_b1_b118_position")?.displayForm ?? "", /I understand.*but I still/i);
  assert.match(itemById.get("itm_b1_b118_v1_table")?.displayForm ?? "", /grandfather.*bar seats/i);
  assert.match(itemById.get("itm_b1_b118_v1_alternative")?.displayForm ?? "", /covered terrace/i);
  assert.match(itemById.get("itm_b1_b118_v2_final")?.displayForm ?? "", /half the fee.*honour the written offer/i);
  assert.ok(bundle.lessonItems.some((link) => link.lessonId === "sit_b1_problems_02" && link.contentId === "gr_b1_concessive_persistence" && link.role === "target"));
  assert.match(itemById.get("itm_b1_hb1_symptoms")?.displayForm ?? "", /I've had.*for three days/i);
  assert.match(itemById.get("itm_b1_hb1_worse")?.displayForm ?? "", /gets worse when.*lie down/i);
  assert.match(itemById.get("itm_b1_hb1_tried")?.displayForm ?? "", /already tried.*lozenges/i);
  assert.match(itemById.get("itm_b1_hb1_v1_joint")?.displayForm ?? "", /right knee for two weeks.*downstairs/i);
  assert.match(itemById.get("itm_b1_hb1_v2_history")?.displayForm ?? "", /headaches for ten days.*another doctor/i);
  assert.ok(bundle.lessonItems.some((link) => link.lessonId === "sit_b1_health_01" && link.contentId === "gr_b1_present_perfect_duration" && link.role === "target"));
  const reviewIds = (id: string) => bundle.lessonItems.filter((link) => link.lessonId === id && link.role === "review").map((link) => link.contentId);
  assert.deepEqual(reviewIds("sit_b1_travel_02"), ["itm_b1_b16_cancelled", "itm_a2_a26_late_bus", "itm_a2_a27_restate_route"]);
  assert.deepEqual(reviewIds("sit_b1_daily_01"), ["itm_a2_a28_film", "itm_a2_a28_reaction", "itm_a1_have_breakfast"]);
  assert.deepEqual(reviewIds("sit_b1_daily_02"), ["itm_b1_b18_trip_experience", "itm_a2_a28_film"]);
  assert.deepEqual(reviewIds("sit_b1_shop_01"), ["itm_a2_a210_exchange"]);
  assert.deepEqual(reviewIds("sit_b1_shop_02"), ["itm_a2_a211_compare"]);
  assert.deepEqual(reviewIds("sit_b1_health_01"), ["itm_a2_ha2_symptom"]);
  assert.deepEqual(reviewIds("sit_b1_work_01"), ["itm_a2_a213_request"]);
  assert.deepEqual(reviewIds("sit_b1_work_02"), ["itm_b1_b112_task_result", "itm_a2_a213_request"]);
  assert.deepEqual(reviewIds("sit_b1_work_03"), ["itm_b1_b18_trip_experience", "itm_a2_a212_role"]);
  assert.deepEqual(reviewIds("sit_b1_social_01"), ["itm_a2_a214_reschedule"]);
  assert.deepEqual(reviewIds("sit_b1_social_02"), ["itm_b1_b115_what_if"]);
  assert.deepEqual(reviewIds("sit_b1_problems_01"), ["itm_b1_b110_duplicate_charge"]);
  assert.deepEqual(reviewIds("sit_b1_problems_02"), ["itm_b1_b117_solution", "itm_b1_b15_v2_response"]);
  for (const id of ids) {
    const practice = bundle.lessonItems.filter((link) => link.lessonId === id && link.role === "practice");
    assert.ok(practice.length >= 2, `${id} has two transfer variations`);
    const reviews = bundle.lessonItems.filter((link) => link.lessonId === id && link.role === "review");
    assert.ok(reviews.length >= 1, `${id} has a curriculum-linked review`);
  }
});

test("B2 Batch 1 adds nuanced viewpoints, group-order coordination, and proportionate compensation", () => {
  const bundle = loadSeedContent();
  const ids = [
    "sit_b2_people_01",
    "sit_b2_restaurant_01",
    "sit_b2_restaurant_02",
  ];
  const itemById = new Map(bundle.learningItems.map((item) => [item.id, item]));
  const links = (lessonId: string, role: string) =>
    bundle.lessonItems.filter(
      (link) => link.lessonId === lessonId && link.role === role,
    );

  for (const id of ids) {
    assert.equal(links(id, "introduce").length, 4, `${id} core turns`);
    assert.ok(links(id, "practice").length >= 5, `${id} transfer practice`);
    assert.ok(links(id, "review").length >= 1, `${id} Near/Far review`);
    for (const link of [...links(id, "introduce"), ...links(id, "practice")]) {
      assert.ok(
        itemById.get(link.contentId)?.npcReplyCorrect,
        `${id}/${link.contentId} has authored NPC continuation`,
      );
    }
  }

  assert.match(
    itemById.get("itm_b2_b21_position")?.displayForm ?? "",
    /Although.*people who cannot walk far/i,
  );
  assert.match(
    itemById.get("itm_b2_b21_probe")?.displayForm ?? "",
    /Even though.*What makes you think/i,
  );
  assert.match(
    itemById.get("itm_b2_b21_v1_work")?.displayForm ?? "",
    /shared office.*quiet room/i,
  );
  assert.match(
    itemById.get("itm_b2_b21_v2_persist")?.displayForm ?? "",
    /clinic.*permit/i,
  );
  assert.match(
    itemById.get("itm_b2_b21_v3_partial")?.displayForm ?? "",
    /market deliveries.*closed after/i,
  );

  assert.match(
    itemById.get("itm_b2_b22_collect")?.displayForm ?? "",
    /Maya said she wanted.*Daniel wants/i,
  );
  assert.match(
    itemById.get("itm_b2_b22_summary")?.displayForm ?? "",
    /To summarise.*without cheese/i,
  );
  assert.match(
    itemById.get("itm_b2_b22_v1_diet")?.displayForm ?? "",
    /sharing menu.*cannot eat gluten/i,
  );
  assert.match(
    itemById.get("itm_b2_b22_v2_change")?.displayForm ?? "",
    /changed his mind.*lentil pie/i,
  );
  assert.match(
    itemById.get("itm_b2_b22_v3_finish")?.displayForm ?? "",
    /quarter of the water.*each bill/i,
  );

  assert.match(
    itemById.get("itm_b2_b23_fairness")?.displayForm ?? "",
    /don't think it's fair.*eat at different times/i,
  );
  assert.match(
    itemById.get("itm_b2_b23_expect")?.displayForm ?? "",
    /What I'd expect.*both delayed main courses/i,
  );
  assert.match(
    itemById.get("itm_b2_b23_v1_missing")?.displayForm ?? "",
    /only three arrived/i,
  );
  assert.match(
    itemById.get("itm_b2_b23_v2_counter")?.displayForm ?? "",
    /twenty-five-percent reduction/i,
  );
  assert.match(
    itemById.get("itm_b2_b23_v3_history")?.displayForm ?? "",
    /previous visit.*booking was missing/i,
  );

  const targets = bundle.lessonItems.filter((link) => link.role === "target");
  for (const patternId of [
    "gr_b2_concession_clauses",
    "gr_b2_reported_speech_orders",
    "gr_b2_summarising_order",
    "gr_b2_fair_that",
    "gr_b2_expect_compensation",
  ]) {
    assert.ok(
      targets.some((link) => link.contentId === patternId),
      patternId,
    );
  }
  assert.deepEqual(
    links("sit_b2_people_01", "review").map((x) => x.contentId),
    ["itm_b1_b12_softener"],
  );
  assert.deepEqual(
    links("sit_b2_restaurant_01", "review").map((x) => x.contentId),
    ["itm_b1_b14_restriction", "itm_b1_b15_wait"],
  );
  assert.deepEqual(
    links("sit_b2_restaurant_02", "review").map((x) => x.contentId),
    ["itm_b1_b15_resolution", "itm_b1_b118_position"],
  );
});

test("B2 Batch 2 negotiates disruption, solves multi-constraint routes, and balances lifestyle choices", () => {
  const bundle = loadSeedContent();
  const ids = ["sit_b2_travel_01", "sit_b2_travel_02", "sit_b2_daily_01"];
  const itemById = new Map(bundle.learningItems.map((item) => [item.id, item]));
  const links = (lessonId: string, role: string) =>
    bundle.lessonItems.filter((link) => link.lessonId === lessonId && link.role === role);

  for (const id of ids) {
    assert.equal(links(id, "introduce").length, 4, `${id} core turns`);
    assert.equal(links(id, "practice").length, 6, `${id} three transfer variations`);
    assert.ok(links(id, "review").length >= 1, `${id} Near/Far review`);
    for (const link of [...links(id, "introduce"), ...links(id, "practice")]) {
      assert.ok(itemById.get(link.contentId)?.npcReplyCorrect, `${id}/${link.contentId} authored continuation`);
    }
  }

  assert.match(itemById.get("itm_b2_b24_impact")?.displayForm ?? "", /Given that.*last bus.*hotel/i);
  assert.match(itemById.get("itm_b2_b24_expect")?.displayForm ?? "", /receipt.*I'd expect.*replacement ticket/i);
  assert.match(itemById.get("itm_b2_b24_v1_hotel")?.displayForm ?? "", /accessible room.*taxi cost/i);
  assert.match(itemById.get("itm_b2_b24_v2_counter")?.displayForm ?? "", /supervisor.*sixty pounds.*accept/i);
  assert.match(itemById.get("itm_b2_b24_v3_consequence")?.displayForm ?? "", /missed the first day.*change my hotel booking/i);

  assert.match(itemById.get("itm_b2_b25_constraints")?.displayForm ?? "", /Taking into account.*rain.*deadline/i);
  assert.match(itemById.get("itm_b2_b25_evaluate")?.displayForm ?? "", /might be worth.*could use/i);
  assert.match(itemById.get("itm_b2_b25_v1_budget_weather")?.displayForm ?? "", /fifteen-pound budget.*storm/i);
  assert.match(itemById.get("itm_b2_b25_v2_pushback")?.displayForm ?? "", /heavy suitcase.*hill.*don't think.*practical/i);
  assert.match(itemById.get("itm_b2_b25_v3_four")?.displayForm ?? "", /wheelchair.*two suitcases.*twenty-five-pound.*five o'clock/i);

  assert.match(itemById.get("itm_b2_b26_advantage")?.displayForm ?? "", /advantage.*However.*lower salary/i);
  assert.match(itemById.get("itm_b2_b26_condition")?.displayForm ?? "", /depends on whether.*workload/i);
  assert.match(itemById.get("itm_b2_b26_v1_career")?.displayForm ?? "", /training role.*one-year contract/i);
  assert.match(itemById.get("itm_b2_b26_v2_balance")?.displayForm ?? "", /depends on whether.*events.*space/i);
  assert.match(itemById.get("itm_b2_b26_v3_anecdote")?.displayForm ?? "", /three months.*free Friday.*ten-hour day/i);

  const targetIds = new Set(bundle.lessonItems.filter((link) => link.role === "target").map((link) => link.contentId));
  for (const patternId of ["gr_b2_given_that_reason", "gr_b2_would_expect_compensation", "gr_b2_taking_into_account", "gr_b2_might_could_tradeoff", "gr_b2_contrast_connectors", "gr_b2_depends_whether"]) {
    assert.ok(targetIds.has(patternId), patternId);
  }
  assert.deepEqual(links("sit_b2_travel_01", "review").map((x) => x.contentId), ["itm_b1_b16_cancelled"]);
  assert.deepEqual(links("sit_b2_travel_02", "review").map((x) => x.contentId), ["itm_b2_b24_settlement", "itm_b1_b17_plan"]);
  assert.deepEqual(links("sit_b2_daily_01", "review").map((x) => x.contentId), ["itm_b1_b19_habit_change"]);
});

test("B2 Batch 3 disputes service terms, proposes change, and disagrees constructively", () => {
  const bundle = loadSeedContent();
  const ids = ["sit_b2_shop_01", "sit_b2_work_01", "sit_b2_work_02"];
  const itemById = new Map(bundle.learningItems.map((item) => [item.id, item]));
  const links = (lessonId: string, role: string) =>
    bundle.lessonItems.filter(
      (link) => link.lessonId === lessonId && link.role === role,
    );

  for (const id of ids) {
    assert.equal(links(id, "introduce").length, 4, `${id} core turns`);
    assert.equal(links(id, "practice").length, 6, `${id} three transfer variations`);
    assert.ok(links(id, "review").length >= 1, `${id} Near/Far review`);
    for (const link of [...links(id, "introduce"), ...links(id, "practice")]) {
      assert.ok(
        itemById.get(link.contentId)?.npcReplyCorrect,
        `${id}/${link.contentId} authored continuation`,
      );
    }
  }

  assert.match(itemById.get("itm_b2_b27_unclear")?.displayForm ?? "", /monthly plan.*six-month.*wasn't made clear/i);
  assert.match(itemById.get("itm_b2_b27_consequence")?.displayForm ?? "", /If this isn't resolved.*consider other providers/i);
  assert.match(itemById.get("itm_b2_b27_v1_gym")?.displayForm ?? "", /gym trial.*twelve-month membership/i);
  assert.match(itemById.get("itm_b2_b27_vcall_confirm")?.displayForm ?? "", /confirm that verbally.*leave at any time/i);
  assert.match(itemById.get("itm_b2_b27_v2_third_option")?.displayForm ?? "", /third option.*new minimum term/i);

  assert.match(itemById.get("itm_b2_b28_perspective")?.displayForm ?? "", /From my perspective.*I'd like to propose/i);
  assert.match(itemById.get("itm_b2_b28_v1_process")?.displayForm ?? "", /invoice approvals.*single intake form/i);
  assert.match(itemById.get("itm_b2_b28_v2_similar")?.displayForm ?? "", /Maya's weekly summary.*live decision log/i);
  assert.match(itemById.get("itm_b2_b28_v3_resistance")?.displayForm ?? "", /prepare the template myself.*clear exit point/i);

  assert.match(itemById.get("itm_b2_b29_difference")?.displayForm ?? "", /I see it differently.*rushed or incomplete/i);
  assert.match(itemById.get("itm_b2_b29_compromise")?.displayForm ?? "", /Would it help if.*same day/i);
  assert.match(itemById.get("itm_b2_b29_v1_balance")?.displayForm ?? "", /one designer.*accessibility checks/i);
  assert.match(itemById.get("itm_b2_b29_v2_middle")?.displayForm ?? "", /middle ground.*risk section/i);
  assert.match(itemById.get("itm_b2_b29_v3_changed")?.displayForm ?? "", /agreed to freeze.*client has since added/i);

  const targetIds = new Set(
    bundle.lessonItems
      .filter((link) => link.role === "target")
      .map((link) => link.contentId),
  );
  for (const patternId of [
    "gr_b2_passive_terms",
    "gr_b2_conditional_service_consequence",
    "gr_b2_perspective_proposal",
    "gr_b2_would_like_propose",
    "gr_b2_would_help_if",
    "gr_b2_lets_constructive_action",
  ]) {
    assert.ok(targetIds.has(patternId), patternId);
  }
  assert.deepEqual(links("sit_b2_shop_01", "review").map((x) => x.contentId), ["itm_b1_b110_resolution"]);
  assert.deepEqual(links("sit_b2_work_01", "review").map((x) => x.contentId), ["itm_b1_b112_check_understanding"]);
  assert.deepEqual(links("sit_b2_work_02", "review").map((x) => x.contentId), ["itm_b2_b28_measure"]);
});

test("B2 Batch 4 renegotiates deadlines, gives tactful feedback, and repairs misunderstandings", () => {
  const bundle = loadSeedContent();
  const ids = ["sit_b2_work_03", "sit_b2_work_04", "sit_b2_social_01"];
  const itemById = new Map(bundle.learningItems.map((item) => [item.id, item]));
  const links = (lessonId: string, role: string) =>
    bundle.lessonItems.filter((link) => link.lessonId === lessonId && link.role === role);
  for (const id of ids) {
    assert.equal(links(id, "introduce").length, 4);
    assert.equal(links(id, "practice").length, 6);
    assert.ok(links(id, "review").length >= 1);
    for (const link of [...links(id, "introduce"), ...links(id, "practice")])
      assert.ok(itemById.get(link.contentId)?.npcReplyCorrect, link.contentId);
  }
  assert.match(itemById.get("itm_b2_b210_split")?.displayForm ?? "", /Would it be possible.*verified sections.*Friday/i);
  assert.match(itemById.get("itm_b2_b210_vcall_confirm")?.displayForm ?? "", /Let me confirm.*Thursday.*Friday/i);
  assert.match(itemById.get("itm_b2_b210_v2_compromise")?.displayForm ?? "", /core participant guide.*Wednesday appendix/i);
  assert.match(itemById.get("itm_b2_b211_focus")?.displayForm ?? "", /One thing I'd suggest.*first section/i);
  assert.match(itemById.get("itm_b2_b211_v2_stay_tactful")?.displayForm ?? "", /full analysis should remain.*route into the evidence/i);
  assert.match(itemById.get("itm_b2_b212_clarify")?.displayForm ?? "", /misunderstanding.*What I meant was/i);
  assert.match(itemById.get("itm_b2_b212_v3_own")?.displayForm ?? "", /partly my fault.*didn't mean to assume/i);
  assert.deepEqual(links("sit_b2_work_03", "review").map((x) => x.contentId), ["itm_b1_b112_deadline", "itm_b2_b29_agreement"]);
  assert.deepEqual(links("sit_b2_work_04", "review").map((x) => x.contentId), ["itm_b2_b29_compromise"]);
  assert.deepEqual(links("sit_b2_social_01", "review").map((x) => x.contentId), ["itm_b1_b116_confirm"]);
});

test("B2 Batch 5 negotiates refunds, stays firm, and compares cultural viewpoints", () => {
  const bundle = loadSeedContent();
  const ids = ["sit_b2_problems_01", "sit_b2_problems_02", "sit_b2_people_03"];
  const itemById = new Map(bundle.learningItems.map((item) => [item.id, item]));
  const links = (lessonId: string, role: string) => bundle.lessonItems.filter((x) => x.lessonId === lessonId && x.role === role);
  for (const id of ids) {
    assert.equal(links(id, "introduce").length, 4);
    assert.equal(links(id, "practice").length, 6);
    assert.ok(links(id, "review").length >= 1);
    for (const link of [...links(id, "introduce"), ...links(id, "practice")]) assert.ok(itemById.get(link.contentId)?.npcReplyCorrect, link.contentId);
  }
  assert.match(itemById.get("itm_b2_b213_mutual")?.displayForm ?? "", /solution that works for both.*willing/i);
  assert.match(itemById.get("itm_b2_b213_v3_history")?.displayForm ?? "", /already reported.*twice.*final collection/i);
  assert.match(itemById.get("itm_b2_b214_position")?.displayForm ?? "", /I hear you.*have to insist.*six guests/i);
  assert.match(itemById.get("itm_b2_b214_v1_cake")?.displayForm ?? "", /outside cakes.*thirty-pound fee/i);
  assert.match(itemById.get("itm_b2_b214_v3_close")?.displayForm ?? "", /agree to disagree.*service charge/i);
  assert.match(itemById.get("itm_b2_b215_compare")?.displayForm ?? "", /Compared with the book.*more energetic/i);
  assert.match(itemById.get("itm_b2_b215_v3_creator")?.displayForm ?? "", /director's earlier film.*quieter style/i);
});

test("B2 Batch 6 discusses technology, weighs causes, and manages topic shifts", () => {
  const bundle = loadSeedContent();
  const ids = ["sit_b2_work_05", "sit_b2_people_04", "sit_b2_social_02"];
  const itemById = new Map(bundle.learningItems.map((item) => [item.id, item]));
  const links = (lessonId: string, role: string) => bundle.lessonItems.filter((x) => x.lessonId === lessonId && x.role === role);
  for (const id of ids) {
    assert.equal(links(id, "introduce").length, 4);
    assert.equal(links(id, "practice").length, 6);
    assert.ok(links(id, "review").length >= 1);
    for (const link of [...links(id, "introduce"), ...links(id, "practice")]) assert.ok(itemById.get(link.contentId)?.npcReplyCorrect, link.contentId);
  }
  assert.match(itemById.get("itm_b2_b216_explain")?.displayForm ?? "", /tool would create a first draft.*could mean/i);
  assert.match(itemById.get("itm_b2_b216_v2_skeptic")?.displayForm ?? "", /doubt the delay-prediction dashboard.*start a discussion/i);
  assert.match(itemById.get("itm_b2_b216_v3_risk")?.displayForm ?? "", /confidential detail.*specific risk/i);
  assert.match(itemById.get("itm_b2_b217_newsletter")?.displayForm ?? "", /I wonder whether.*newsletter/i);
  assert.match(itemById.get("itm_b2_b217_v2_compete")?.displayForm ?? "", /rain.*earlier start/i);
  assert.match(itemById.get("itm_b2_b217_v3_payoff")?.displayForm ?? "", /real reason was planned.*different/i);
  assert.match(itemById.get("itm_b2_b218_market")?.displayForm ?? "", /Speaking of which/i);
  assert.match(itemById.get("itm_b2_b218_v2_continue")?.displayForm ?? "", /That reminds me.*going back|before we plan another outing/i);
  assert.match(itemById.get("itm_b2_b218_v3_steer")?.displayForm ?? "", /going back to Maya/i);
  assert.deepEqual(links("sit_b2_work_05", "review").map((x) => x.contentId), ["itm_b2_b25_tradeoff"]);
  assert.deepEqual(links("sit_b2_people_04", "review").map((x) => x.contentId), ["itm_b2_b216_uncertainty"]);
  assert.deepEqual(links("sit_b2_social_02", "review").map((x) => x.contentId), ["itm_b1_b11_followup"]);
});

test("B2 Batch 7 persuades respectfully, tells nuanced stories, and traces consequences", () => {
  const bundle = loadSeedContent();
  const ids = ["sit_b2_daily_02", "sit_b2_people_05", "sit_b2_work_06"];
  const itemById = new Map(bundle.learningItems.map((item) => [item.id, item]));
  const links = (lessonId: string, role: string) => bundle.lessonItems.filter((x) => x.lessonId === lessonId && x.role === role);
  for (const id of ids) {
    assert.equal(links(id, "introduce").length, 4);
    assert.equal(links(id, "practice").length, 6);
    assert.ok(links(id, "review").length >= 1);
    for (const link of [...links(id, "introduce"), ...links(id, "practice")]) assert.ok(itemById.get(link.contentId)?.npcReplyCorrect, link.contentId);
  }
  assert.match(itemById.get("itm_b2_b219_consider")?.displayForm ?? "", /should really consider.*Think about it this way/i);
  assert.match(itemById.get("itm_b2_b219_v2_answer")?.displayForm ?? "", /real constraint.*Saturday drop-in/i);
  assert.match(itemById.get("itm_b2_b219_v3_compromise")?.displayForm ?? "", /only the first eight kilometres.*without committing/i);
  assert.match(itemById.get("itm_b2_b220_strange")?.displayForm ?? "", /What made it strange was/i);
  assert.match(itemById.get("itm_b2_b220_v2_unresolved")?.displayForm ?? "", /hotel.*still don't know if/i);
  assert.match(itemById.get("itm_b2_b220_v3_reconsider")?.displayForm ?? "", /question changes it.*surprise was the problem/i);
  assert.match(itemById.get("itm_b2_b221_scale")?.displayForm ?? "", /If we go ahead.*could lead to/i);
  assert.match(itemById.get("itm_b2_b221_v2_confident")?.displayForm ?? "", /less certain.*Silence could look like agreement/i);
  assert.match(itemById.get("itm_b2_b221_v3_revise")?.displayForm ?? "", /changes the consequence.*regional deadline/i);
  assert.deepEqual(links("sit_b2_daily_02", "review").map((x) => x.contentId), ["itm_b1_b113_request"]);
  assert.deepEqual(links("sit_b2_people_05", "review").map((x) => x.contentId), ["itm_b1_b18_ending"]);
  assert.deepEqual(links("sit_b2_work_06", "review").map((x) => x.contentId), ["itm_b2_b216_guardrail", "itm_b2_b26_balance"]);
});

test("H.B2 clarifies risks, alternatives, timing, and a reasoned choice", () => {
  const bundle = loadSeedContent();
  const itemById = new Map(bundle.learningItems.map((item) => [item.id, item]));
  const links = (role: string) =>
    bundle.lessonItems.filter(
      (row) => row.lessonId === "sit_b2_health_01" && row.role === role,
    );
  assert.equal(links("introduce").length, 4);
  assert.equal(links("practice").length, 6);
  assert.deepEqual(
    links("review").map((row) => row.contentId),
    ["itm_b1_hb1_tried", "itm_b1_b111_weigh_tradeoff"],
  );
  for (const link of [...links("introduce"), ...links("practice")]) {
    assert.ok(itemById.get(link.contentId)?.npcReplyCorrect, link.contentId);
  }
  assert.match(
    itemById.get("itm_b2_hb2_timing")?.displayForm ?? "",
    /How long will it take.*will I know within a week/i,
  );
  assert.match(
    itemById.get("itm_b2_hb2_v1_other_treatment")?.displayForm ?? "",
    /alternative to taking a tablet.*compare/i,
  );
  assert.match(
    itemById.get("itm_b2_hb2_v2_choice")?.displayForm ?? "",
    /tablet will probably.*spray may.*drive most days/i,
  );
  assert.match(
    itemById.get("itm_b2_hb2_v3_lifestyle")?.displayForm ?? "",
    /windows closed.*changing clothes.*alternative/i,
  );
});
