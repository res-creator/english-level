import test from "node:test";
import assert from "node:assert/strict";
import {
  ART_SLOTS,
  REQUIRED_SLOTS,
  type ArtSlot,
} from "../src/brand/artManifest.ts";

test("every slot has a unique filename, so two pictures can never collide", () => {
  const names = ART_SLOTS.map((slot) => slot.name);
  assert.equal(new Set(names).size, names.length);
});

test("filenames are safe to drop into a folder on any machine", () => {
  for (const slot of ART_SLOTS) {
    assert.match(
      slot.name,
      /^[a-z0-9]+(-[a-z0-9_]+)*$/,
      `"${slot.name}" must be lowercase, ASCII and hyphenated`,
    );
  }
});

test("anything drawn over something else is transparent", () => {
  const overlaid = ART_SLOTS.filter(
    (slot) =>
      slot.name.startsWith("kvo-") ||
      slot.name.startsWith("cast-") ||
      slot.name.endsWith("-fg") ||
      slot.name.startsWith("space-object-") ||
      slot.name === "space-fg" ||
      slot.name.endsWith("-art"),
  );
  assert.ok(overlaid.length > 0);
  for (const slot of overlaid) {
    assert.equal(
      slot.background,
      "transparent",
      `${slot.name} sits over other art and must be transparent`,
    );
  }
});

test("backdrops are opaque — a see-through backdrop is a bug, not a style", () => {
  for (const slot of ART_SLOTS.filter(
    (s) => s.name.endsWith("-bg") || s.name.startsWith("space-stage-"),
  )) {
    assert.equal(slot.background, "opaque", `${slot.name} must be opaque`);
  }
});

test("each cast member has all four states a scene needs", () => {
  const cast = ["maya", "alex", "emma", "daniel", "leo", "rosa"];
  const states = ["speaking", "listening", "smiling", "showing"];
  for (const person of cast) {
    for (const state of states) {
      assert.ok(
        ART_SLOTS.some((slot) => slot.name === `cast-${person}-${state}`),
        `missing cast-${person}-${state}`,
      );
    }
  }
});

test("Kvo covers both approved variants and all three states", () => {
  for (const state of ["idle", "thinking", "happy"]) {
    assert.ok(ART_SLOTS.some((s) => s.name === `kvo-full-${state}`));
  }
  assert.ok(ART_SLOTS.some((s) => s.name === "kvo-glyph-idle"));
});

test("the room has one environment per chapter stage", () => {
  for (const stage of [1, 2, 3, 4]) {
    assert.ok(ART_SLOTS.some((s) => s.name === `space-stage-${stage}`));
  }
});

test("every memory object the backend can award has a picture slot", () => {
  const rewards = [
    "rw_frame",
    "rw_mug",
    "rw_lamp",
    "rw_map",
    "rw_window",
    "rw_plant",
    "rw_shelf",
    "rw_blanket",
    "rw_shared_plant",
  ];
  for (const reward of rewards) {
    assert.ok(
      ART_SLOTS.some((slot) => slot.name === `space-object-${reward}`),
      `missing space-object-${reward}`,
    );
  }
});

test("every slot states its size, aspect and where it is used", () => {
  for (const slot of ART_SLOTS) {
    assert.match(slot.size, /^\d+×\d+$/, `${slot.name} has no pixel size`);
    assert.ok(slot.aspect.length > 0, `${slot.name} has no aspect`);
    assert.ok(slot.purpose.length > 0, `${slot.name} has no purpose`);
    assert.ok(slot.appearsIn.length > 0, `${slot.name} has no screen`);
  }
});

test("optional slots add depth, never meaning — the product ships without them", () => {
  const optional: ArtSlot[] = ART_SLOTS.filter(
    (slot) => slot.optional === true,
  );
  assert.ok(optional.length > 0);
  assert.ok(REQUIRED_SLOTS.length < ART_SLOTS.length);
  for (const slot of optional) {
    assert.ok(
      slot.name.endsWith("-fg") || slot.name.endsWith("-bg"),
      `${slot.name} is optional, so it must be a decorative layer`,
    );
  }
});
