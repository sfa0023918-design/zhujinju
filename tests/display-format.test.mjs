import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../lib/display-format.ts", import.meta.url), "utf8");
const loaded = { exports: {} };
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
vm.runInNewContext(`(function(exports,module){${code}\n})`)(loaded.exports, loaded);
const { formatDimensions, formatExhibitionPeriod, getExhibitionStatus, getExhibitionMetadataTitle } = loaded.exports;

test("dimension formatting preserves values, axes and non-unit words", () => {
  assert.equal(formatDimensions("高：24cm；宽 18.5 cm"), "高：24 cm；宽 18.5 cm");
  assert.equal(formatDimensions("60cm × 52cm"), "60 cm × 52 cm");
  assert.equal(formatDimensions("Height: 8.3 cm"), "Height: 8.3 cm");
  assert.equal(formatDimensions("12th century; 15mm; 3 marks"), "12th century; 15 mm; 3 marks");
});

test("exhibition period display preserves cross-month dates", () => {
  const value = formatExhibitionPeriod({ zh: "2024.10.29-2024.11.3", en: "October 29 – November 3, 2024" });
  assert.equal(value.zh, "2024.10.29–2024.11.3");
  assert.equal(value.en, "October 29–November 3, 2024");
});

test("past status starts after the closing day in China, unknown dates stay unknown", () => {
  const e = { current: false, period: { zh: "2026.10.20 - 2026.10.25", en: "" } };
  assert.equal(getExhibitionStatus(e, new Date("2026-10-25T15:59:58Z")), null);
  assert.equal(getExhibitionStatus(e, new Date("2026-10-25T16:00:00Z")).en, "Past");
  assert.equal(getExhibitionStatus({ period: { zh: "待定", en: "To be announced" } }), null);
});

test("share title removes only the repeated gallery prefix", () => {
  const value = getExhibitionMetadataTitle({ zh: "竹瑾居｜喜马拉雅艺术 2026", en: "Zhu Jin Ju | Himalayan Art 2026" });
  assert.equal(value.zh, "喜马拉雅艺术 2026");
  assert.equal(value.en, "Himalayan Art 2026");
  assert.equal(getExhibitionMetadataTitle({ zh: "寂静之光", en: "Silent Radiance" }).en, "Silent Radiance");
});

test("deferred font styles preserve every original face, glyph range and weight", () => {
  const root = new URL("../", import.meta.url);
  const read = (path) => readFileSync(new URL(path, root), "utf8");
  const faces = (css) => (css.match(/@font-face\s*\{[^}]+\}/g) ?? []).map((face) => face.replace(/\s+/g, " ")).sort();
  const manifest = JSON.parse(read("lib/data/reading-fallback-stylesheet.json"));
  assert.deepEqual(faces(read("app/(site)/reading-fonts.css")), faces(read("app/(site)/reading-critical-fonts.css") + read(`public${manifest.href}`)));
});
