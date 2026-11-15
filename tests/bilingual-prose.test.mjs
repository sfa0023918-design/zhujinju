import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const filename = path.join(root, "components/bilingual-prose.tsx");
const source = fs.readFileSync(filename, "utf8");
const loaded = { exports: {} };
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  fileName: filename,
}).outputText;
vm.runInNewContext(`(function(exports, require, module) {${compiled}\n})`, { console })
  (loaded.exports, (id) => id === "./bilingual-text" ? {} : require(id), loaded);

const { getParagraphsByLocale } = loaded.exports;
const options = { manualParagraphMode: "split-long", manualSplitThresholdZh: 260, manualSplitThresholdEn: 420 };
const compact = (text) => text.replace(/\s/g, "");

test("the Five-Pronged Vajra passage keeps its quoted art term", () => {
  const content = JSON.parse(fs.readFileSync(path.join(root, "content/site-content.json"), "utf8"));
  const text = content.artworks.find((artwork) => artwork.slug === "artwork-1790510831618").viewingNote.en;
  const paragraphs = getParagraphsByLocale({ zh: "", en: text }, "en", "soft", options);
  assert.ok(paragraphs.length > 1);
  assert.ok(paragraphs.join("").includes("“Pala style,”"));
  assert.equal(compact(paragraphs.join("")), compact(text));
});

test("all existing artwork scholarly texts survive paragraph splitting", () => {
  const content = JSON.parse(fs.readFileSync(path.join(root, "content/site-content.json"), "utf8"));
  const losses = [];
  for (const artwork of content.artworks) {
    for (const locale of ["zh", "en"]) {
      const text = artwork.viewingNote?.[locale] ?? "";
      if (!text.trim()) continue;
      const rendered = getParagraphsByLocale({ zh: text, en: text }, locale, "soft", options).join("");
      if (compact(rendered) !== compact(text.trim())) losses.push(`${artwork.slug}:${locale}`);
    }
  }
  assert.deepEqual(losses, []);
});

const readingOptions = {
  manualParagraphMode: "preserve",
  autoSplitLongSingleParagraph: false,
  repairWrappedLines: true,
};

test("printed Chinese prefaces reflow into complete paragraphs", () => {
  const content = JSON.parse(fs.readFileSync(path.join(root, "content/site-content.json"), "utf8"));
  const preface = content.exhibitions.find((item) => item.slug === "exhibition-1773394358822").description;
  const paragraphs = getParagraphsByLocale(preface, "zh", "paragraph", readingOptions);
  assert.equal(paragraphs[0], "2024 年 8 月 15 日，又一个星期四，成都又一个雨天，又一次在雨声中找到了灵感，又一次为展览图录撰写序言。");
  assert.ok(paragraphs[1].includes("图录也是第三本了"));
  assert.ok(paragraphs[1].endsWith("我们却依旧乐此不疲。"));
  assert.ok(paragraphs.length < preface[0].zh.split(/\n+/).length);
});

test("authored English paragraphs are not split into a decorative first sentence", () => {
  const content = JSON.parse(fs.readFileSync(path.join(root, "content/site-content.json"), "utf8"));
  const preface = content.exhibitions.find((item) => item.slug === "silent-radiance").description;
  const paragraphs = getParagraphsByLocale(preface, "en", "paragraph", readingOptions);
  assert.equal(paragraphs[0], preface[0].en.split(/\n\s*\n/)[0]);
  assert.ok(paragraphs[0].includes("These lines—whether fluid or rugged—"));
});

test("site reading normalization preserves every word and intentional 2026 paragraph", () => {
  const content = JSON.parse(fs.readFileSync(path.join(root, "content/site-content.json"), "utf8"));
  const passages = [
    ...content.exhibitions.map((e) => e.description),
    ...content.artworks.flatMap((a) => [a.viewingNote, a.comparisonNote]).filter(Boolean),
    ...content.articles.flatMap((a) => a.contentBlocks.filter((b) => b.type === "paragraph").map((b) => b.content)),
  ];
  for (const passage of passages) {
    for (const locale of ["zh", "en"]) {
      const original = getParagraphsByLocale(passage, locale, "paragraph", { autoSplitLongSingleParagraph: false });
      const formatted = getParagraphsByLocale(passage, locale, "paragraph", readingOptions);
      assert.equal(compact(formatted.join("")), compact(original.join("")));
    }
  }
  const contemporary = content.exhibitions.find((e) => e.slug === "himalayan-art-2026").description;
  for (const locale of ["zh", "en"]) {
    assert.deepEqual(
      getParagraphsByLocale(contemporary, locale, "paragraph", readingOptions),
      getParagraphsByLocale(contemporary, locale, "paragraph", { autoSplitLongSingleParagraph: false }),
    );
  }
});

test("prose repair preserves headings, lists, quotations and English names", () => {
  const content = {
    zh: "观看与记忆\n\n这段文字讲的是雕塑的面容与身体，\n\n以及观看时的感受。\n\n一、材质\n\n二、工艺",
    en: "A viewing note\n\nDr. A. Smith described the sculpture as\n\n“quiet and composed.”\n\n1. Material\n\n2. Technique",
  };
  assert.deepEqual(Array.from(getParagraphsByLocale(content, "zh", "paragraph", readingOptions)), [
    "观看与记忆", "这段文字讲的是雕塑的面容与身体，以及观看时的感受。", "一、材质", "二、工艺",
  ]);
  assert.deepEqual(Array.from(getParagraphsByLocale(content, "en", "paragraph", readingOptions)), [
    "A viewing note", "Dr. A. Smith described the sculpture as “quiet and composed.”", "1. Material", "2. Technique",
  ]);
});

test("collapsed reading exposes whole paragraphs instead of cutting off a sentence", () => {
  const { createElement } = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const paragraphs = ["First complete paragraph.", "Second complete paragraph.", "Third complete paragraph.", "Fourth complete paragraph."];
  const markup = renderToStaticMarkup(createElement(loaded.exports.BilingualReadingPanel, {
    sections: [{ key: "note", content: paragraphs.map((en) => ({ zh: "", en })), expandable: true }],
    locale: "en", showToggle: false,
  }));
  for (const paragraph of paragraphs.slice(0, 3)) assert.ok(markup.includes(paragraph));
  assert.ok(!markup.includes(paragraphs[3]));
  assert.ok(markup.includes('aria-expanded="false"'));
  assert.ok(markup.includes("View more"));
});
