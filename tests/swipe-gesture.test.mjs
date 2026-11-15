import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = fs.readFileSync(new URL("../lib/swipe-gesture.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const loaded = { exports: {} };
vm.runInNewContext(`(function(exports) {${compiled}\n})`)(loaded.exports);
const { swipeDirection: swipe } = loaded.exports;

test("vertical scrolling, diagonal movements and tap jitter do not change the image", () => {
  for (const [dx, dy, elapsed] of [[0, 200, 500], [90, 180, 200], [100, 90, 150], [9, 1, 10], [25, 0, 600]]) {
    assert.equal(swipe(dx, dy, elapsed, 390), 0);
  }
});
test("deliberate drags work in both directions at phone and tablet widths", () => {
  for (const width of [320, 390, 820, 1180, 1366]) {
    assert.equal(swipe(-140, 8, 800, width), 1);
    assert.equal(swipe(140, -8, 800, width), -1);
  }
});
test("short fast flicks advance without requiring a long tablet drag", () => {
  assert.equal(swipe(-32, 3, 60, 1180), 1);
  assert.equal(swipe(32, 3, 60, 1180), -1);
  assert.equal(swipe(-32, 3, 300, 1180), 0);
});
