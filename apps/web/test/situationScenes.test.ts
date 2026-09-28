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
