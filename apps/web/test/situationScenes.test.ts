import test from "node:test";
import assert from "node:assert/strict";
import {
  FALLBACK_SCENE,
  openingLine,
  sceneForSituation,
} from "../src/brand/situationScenes.ts";

test("a situation always resolves to one place and one person", () => {
  const cafe = sceneForSituation("les_sie_a1_e2");
  assert.equal(cafe.scene, "cafe");
  assert.equal(cafe.cast, "maya");
});

test("the same person returns in the same place across situations", () => {
  // Ordering coffee, and later an order that went wrong — same café,
  // same barista. That continuity is the product, not decoration.
  const first = sceneForSituation("les_sie_a1_e2");
  const later = sceneForSituation("les_sie_a1_e5");
  assert.deepEqual(later, first);

  const meeting = sceneForSituation("les_sie_a1_e1");
  const dayAfter = sceneForSituation("les_sie_a1_e3");
  assert.deepEqual(dayAfter, meeting);
});

test("A1.1 practice stays with Alex in the same café scene", () => {
  assert.deepEqual(sceneForSituation("les_sie_a1_e1"), {
    scene: "meeting",
    cast: "alex",
  });
  assert.match(openingLine("les_sie_a1_e1"), /Alex/);
});

test("A2 Batch 1 uses its authored recurring cast, scene, and dialogue opener", () => {
  assert.deepEqual(sceneForSituation("sit_a2_people_01"), {
    scene: "meeting",
    cast: "alex",
  });
  assert.deepEqual(sceneForSituation("sit_a2_people_02"), {
    scene: "meeting",
    cast: "daniel",
  });
  assert.deepEqual(sceneForSituation("sit_a2_cafe_01"), {
    scene: "cafe",
    cast: "maya",
  });
  assert.match(openingLine("sit_a2_people_01"), /Good to see you again/);
  assert.match(openingLine("sit_a2_people_02"), /party.*How do you know Alex/);
  assert.match(openingLine("sit_a2_cafe_01"), /small coffee.*before you pay/);
});

test("A2 Batch 2 maps restaurant and station conversations to Leo and Rosa", () => {
  assert.deepEqual(sceneForSituation("sit_a2_restaurant_01"), {
    scene: "restaurant",
    cast: "leo",
  });
  assert.deepEqual(sceneForSituation("sit_a2_restaurant_02"), {
    scene: "restaurant",
    cast: "leo",
  });
  assert.deepEqual(sceneForSituation("sit_a2_travel_01"), {
    scene: "street",
    cast: "rosa",
  });
  assert.match(openingLine("sit_a2_restaurant_01"), /book a table/i);
  assert.match(openingLine("sit_a2_restaurant_02"), /ready to order/i);
  assert.match(openingLine("sit_a2_travel_01"), /near the station/i);
});

test("A2 Batch 3 maps route and daily-life dialogues to Rosa and Alex", () => {
  assert.deepEqual(sceneForSituation("sit_a2_travel_02"), {
    scene: "street",
    cast: "rosa",
  });
  assert.deepEqual(sceneForSituation("sit_a2_daily_01"), {
    scene: "meeting",
    cast: "alex",
  });
  assert.deepEqual(sceneForSituation("sit_a2_daily_02"), {
    scene: "cafe",
    cast: "alex",
  });
  assert.match(openingLine("sit_a2_travel_02"), /King Street.*left.*bridge/i);
  assert.match(openingLine("sit_a2_daily_01"), /How was your weekend/i);
  assert.match(openingLine("sit_a2_daily_02"), /free next week/i);
});


test("A2 Batch 4 maps shopping and work conversations to Emma and Daniel", () => {
  assert.deepEqual(sceneForSituation("sit_a2_shop_01"), { scene: "shop", cast: "emma" });
  assert.deepEqual(sceneForSituation("sit_a2_shop_02"), { scene: "shop", cast: "emma" });
  assert.deepEqual(sceneForSituation("sit_a2_work_01"), { scene: "office", cast: "daniel" });
  assert.match(openingLine("sit_a2_shop_01"), /help you with today/i);
  assert.match(openingLine("sit_a2_shop_02"), /offers on/i);
  assert.match(openingLine("sit_a2_work_01"), /What do you do at work/i);
});

test("A2 Batch 5 maps workplace, social, and lost-item situations to their authored cast", () => {
  assert.deepEqual(sceneForSituation("sit_a2_work_02"), { scene: "office", cast: "daniel" });
  assert.deepEqual(sceneForSituation("sit_a2_social_01"), { scene: "cafe", cast: "alex" });
  assert.deepEqual(sceneForSituation("sit_a2_problems_01"), { scene: "street", cast: "rosa" });
  assert.match(openingLine("sit_a2_work_02"), /team this week.*working on/i);
  assert.match(openingLine("sit_a2_social_01"), /free this weekend.*do together/i);
  assert.match(openingLine("sit_a2_problems_01"), /checking your pockets.*lose something/i);
});

test("A2 Batch 6 maps the bill error to Leo and OTC shopping to Emma", () => {
  assert.deepEqual(sceneForSituation("sit_a2_problems_02"), { scene: "restaurant", cast: "leo" });
  assert.deepEqual(sceneForSituation("sit_a2_health_01"), { scene: "shop", cast: "emma" });
  assert.match(openingLine("sit_a2_problems_02"), /itemised bill.*check them/i);
  assert.match(openingLine("sit_a2_health_01"), /simple remedies.*on this shelf/i);
});

test("B1 complete level maps each dialogue to its authored cast and scene", () => {
  assert.deepEqual(sceneForSituation("sit_b1_people_01"), { scene: "cafe", cast: "alex" });
  assert.deepEqual(sceneForSituation("sit_b1_people_02"), { scene: "cafe", cast: "alex" });
  assert.deepEqual(sceneForSituation("sit_b1_cafe_01"), { scene: "cafe", cast: "maya" });
  assert.deepEqual(sceneForSituation("sit_b1_restaurant_01"), { scene: "restaurant", cast: "leo" });
  assert.deepEqual(sceneForSituation("sit_b1_restaurant_02"), { scene: "restaurant", cast: "leo" });
  assert.deepEqual(sceneForSituation("sit_b1_travel_01"), { scene: "street", cast: "rosa" });
  assert.deepEqual(sceneForSituation("sit_b1_travel_02"), { scene: "street", cast: "rosa" });
  assert.deepEqual(sceneForSituation("sit_b1_daily_01"), { scene: "meeting", cast: "alex" });
  assert.deepEqual(sceneForSituation("sit_b1_daily_02"), { scene: "meeting", cast: "alex" });
  assert.deepEqual(sceneForSituation("sit_b1_shop_01"), { scene: "shop", cast: "emma" });
  assert.deepEqual(sceneForSituation("sit_b1_shop_02"), { scene: "shop", cast: "emma" });
  assert.deepEqual(sceneForSituation("sit_b1_health_01"), { scene: "clinic", cast: "drkim" });
  assert.deepEqual(sceneForSituation("sit_b1_work_01"), { scene: "office", cast: "daniel" });
  assert.deepEqual(sceneForSituation("sit_b1_work_02"), { scene: "office", cast: "daniel" });
  assert.deepEqual(sceneForSituation("sit_b1_work_03"), { scene: "office", cast: "daniel" });
  assert.deepEqual(sceneForSituation("sit_b1_social_01"), { scene: "cafe", cast: "alex" });
  assert.deepEqual(sceneForSituation("sit_b1_social_02"), { scene: "cafe", cast: "alex" });
  assert.deepEqual(sceneForSituation("sit_b1_problems_01"), { scene: "shop", cast: "emma" });
  assert.deepEqual(sceneForSituation("sit_b1_problems_02"), { scene: "restaurant", cast: "leo" });
  assert.match(openingLine("sit_b1_people_01"), /Maya.*bookshop/i);
  assert.match(openingLine("sit_b1_people_02"), /evening market.*music/i);
  assert.match(openingLine("sit_b1_cafe_01"), /drinks board.*two new drinks/i);
  assert.match(openingLine("sit_b1_restaurant_01"), /menu carefully.*check an ingredient/i);
  assert.match(openingLine("sit_b1_restaurant_02"), /keep you waiting.*main course/i);
  assert.match(openingLine("sit_b1_travel_01"), /checking the Northbridge trains.*wrong with your service/i);
  assert.match(openingLine("sit_b1_travel_02"), /before your train.*stop worthwhile/i);
  assert.match(openingLine("sit_b1_daily_01"), /Have you ever had a trip/i);
  assert.match(openingLine("sit_b1_daily_02"), /Last year brought a big change.*everyday life now/i);
  assert.match(openingLine("sit_b1_shop_01"), /account today.*wrong with the bill/i);
  assert.match(openingLine("sit_b1_shop_02"), /two tablets.*matters most/i);
  assert.match(openingLine("sit_b1_health_01"), /Dr\. Kim.*bothering you/i);
  assert.match(openingLine("sit_b1_work_01"), /event project.*handle/i);
  assert.match(openingLine("sit_b1_work_02"), /event schedule.*What do you need/i);
  assert.match(openingLine("sit_b1_work_03"), /team coordinator role.*recent experience/i);
  assert.match(openingLine("sit_b1_social_01"), /Maya and Daniel.*schedules are different/i);
  assert.match(openingLine("sit_b1_social_02"), /housewarming dinner.*like to come/i);
  assert.match(openingLine("sit_b1_problems_01"), /Customer service.*order record.*went wrong/i);
  assert.match(openingLine("sit_b1_problems_02"), /deposit.*non-refundable.*review/i);
});

test("B2 Batch 1 keeps Alex in the café and Leo in the restaurant", () => {
  assert.deepEqual(sceneForSituation("sit_b2_people_01"), { scene: "cafe", cast: "alex" });
  assert.deepEqual(sceneForSituation("sit_b2_restaurant_01"), { scene: "restaurant", cast: "leo" });
  assert.deepEqual(sceneForSituation("sit_b2_restaurant_02"), { scene: "restaurant", cast: "leo" });
  assert.match(openingLine("sit_b2_people_01"), /council.*car-free/i);
  assert.match(openingLine("sit_b2_restaurant_01"), /group.*order.*dietary/i);
  assert.match(openingLine("sit_b2_restaurant_02"), /revised bill.*reflects what happened/i);
});

test("B2 Batch 2 maps travel reasoning to Rosa and lifestyle balance to Alex", () => {
  assert.deepEqual(sceneForSituation("sit_b2_travel_01"), { scene: "street", cast: "rosa" });
  assert.deepEqual(sceneForSituation("sit_b2_travel_02"), { scene: "street", cast: "rosa" });
  assert.deepEqual(sceneForSituation("sit_b2_daily_01"), { scene: "cafe", cast: "alex" });
  assert.match(openingLine("sit_b2_travel_01"), /overnight train.*cancelled.*rebook/i);
  assert.match(openingLine("sit_b2_travel_02"), /Hillview.*twenty-five pounds.*heavy rain/i);
  assert.match(openingLine("sit_b2_daily_01"), /four-day working week.*lower pay/i);
});

test("B2 Batch 3 maps service terms to Emma and workplace discussion to Daniel", () => {
  assert.deepEqual(sceneForSituation("sit_b2_shop_01"), {
    scene: "shop",
    cast: "emma",
  });
  for (const id of ["sit_b2_work_01", "sit_b2_work_02"]) {
    assert.deepEqual(sceneForSituation(id), {
      scene: "meeting",
      cast: "daniel",
    });
    assert.ok(openingLine(id).length > 30);
  }
  assert.match(openingLine("sit_b2_shop_01"), /renewal.*minimum term/i);
});

test("B2 Batch 4 maps deadline and feedback to Daniel and repair to Alex", () => {
  for (const id of ["sit_b2_work_03", "sit_b2_work_04"]) {
    assert.deepEqual(sceneForSituation(id), {
      scene: "meeting",
      cast: "daniel",
    });
  }
  assert.deepEqual(sceneForSituation("sit_b2_social_01"), {
    scene: "cafe",
    cast: "alex",
  });
  assert.match(openingLine("sit_b2_work_03"), /supplier figures.*delivery plan/i);
  assert.match(openingLine("sit_b2_social_01"), /dinner plan.*understand/i);
});

test("one chapter needs only a handful of places and people", () => {
  const episodes = [
    "les_sie_a1_e1",
    "les_sie_a1_e2",
    "les_sie_a1_e3",
    "les_sie_a1_e4",
    "les_sie_a1_e5",
  ].map(sceneForSituation);

  assert.equal(new Set(episodes.map((e) => e.scene)).size, 3);
  assert.equal(new Set(episodes.map((e) => e.cast)).size, 3);
});

test("content without artwork still gets a scene instead of nothing", () => {
  assert.deepEqual(sceneForSituation("les_does_not_exist"), FALLBACK_SCENE);
  assert.equal(openingLine("les_does_not_exist"), "Hello!");
});

test("every situation opens mid-conversation, in English", () => {
  for (const id of [
    "les_sie_a1_e1",
    "les_sie_a1_e2",
    "les_sie_a1_e4",
    "sit_a1_people_02",
    "sit_a1_shop_01",
    "sit_a1_travel_02",
    "sit_a1_social_01",
    "sit_a1_daily_02",
    "sit_a1_health_01",
    "sit_a2_people_01",
    "sit_a2_people_02",
    "sit_a2_cafe_01",
    "sit_a2_restaurant_01",
    "sit_a2_restaurant_02",
    "sit_a2_travel_01",
    "sit_a2_travel_02",
    "sit_a2_daily_01",
    "sit_a2_daily_02",
    "sit_b1_people_01",
    "sit_b1_people_02",
    "sit_b1_cafe_01",
    "sit_b1_restaurant_01",
    "sit_b1_restaurant_02",
    "sit_b1_travel_01",
    "sit_b1_travel_02",
    "sit_b1_daily_01",
    "sit_b1_daily_02",
    "sit_b1_shop_01",
    "sit_b1_shop_02",
    "sit_b1_health_01",
    "sit_b1_work_01",
    "sit_b1_work_02",
    "sit_b1_work_03",
    "sit_b1_social_01",
    "sit_b1_social_02",
    "sit_b1_problems_01",
    "sit_b1_problems_02",
  ]) {
    const line = openingLine(id);
    assert.ok(line.length > 0);
    assert.ok(
      !/[а-яё]/i.test(line),
      `the opening line for ${id} must be English, got "${line}"`,
    );
  }
});

test("Batch 1 situations use the authored place, cast, and opener", () => {
  assert.deepEqual(sceneForSituation("sit_a1_people_02"), {
    scene: "meeting",
    cast: "rosa",
  });
  assert.deepEqual(sceneForSituation("sit_a1_shop_01"), {
    scene: "shop",
    cast: "emma",
  });
  assert.deepEqual(sceneForSituation("sit_a1_travel_02"), {
    scene: "street",
    cast: "rosa",
  });
  assert.equal(openingLine("sit_a1_people_02").includes("Rosa"), true);
  assert.equal(
    openingLine("sit_a1_shop_01"),
    "Hi! Are you looking for something?",
  );
  assert.equal(
    openingLine("sit_a1_travel_02").includes("ticket machine"),
    true,
  );
  assert.deepEqual(sceneForSituation("sit_a1_social_01"), {
    scene: "cafe",
    cast: "alex",
  });
  assert.deepEqual(sceneForSituation("sit_a1_daily_02"), {
    scene: "cafe",
    cast: "maya",
  });
  assert.deepEqual(sceneForSituation("sit_a1_health_01"), {
    scene: "meeting",
    cast: "alex",
  });
});
