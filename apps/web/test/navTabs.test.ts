import test from "node:test";
import assert from "node:assert/strict";
import { NAV_TABS } from "../src/components/navTabs.ts";

test("the product has exactly four daily destinations", () => {
  assert.equal(NAV_TABS.length, 4);
  assert.deepEqual(
    NAV_TABS.map((t) => t.to),
    ["/today", "/course", "/my", "/my/space"],
  );
});

test("review is not a permanent tab — it is brought to you, not owed", () => {
  assert.ok(!NAV_TABS.some((t) => t.to.startsWith("/review")));
  assert.ok(!NAV_TABS.some((t) => t.label.toLowerCase().includes("повтор")));
});

test("no tab carries a count, so nothing on the bar can read as debt", () => {
  for (const tab of NAV_TABS) {
    assert.ok(
      !/\d/.test(tab.label),
      `tab "${tab.label}" must not show a number`,
    );
  }
});

test("My English does not stay lit while My Space is open", () => {
  const mine = NAV_TABS.find((t) => t.to === "/my");
  assert.equal(mine?.end, true);
});
