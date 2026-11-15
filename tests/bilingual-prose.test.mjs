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

test("the 2025 exhibition preface separates its opening sentence from the body", () => {
  const content = JSON.parse(fs.readFileSync(path.join(root, "content/site-content.json"), "utf8"));
  const preface = content.exhibitions.find((item) => item.slug === "silent-radiance").description;
  const paragraphs = getParagraphsByLocale(preface, "en", "soft", { ...options, englishLeadSentence: true });
  assert.equal(paragraphs[0], "We often find ourselves pausing before the silent sculptures and paintings within the exhibition halls.");
  assert.ok(paragraphs[1].startsWith("These lines—whether fluid or rugged—"));
  assert.equal(compact(paragraphs.join("")), compact(preface.map((item) => item.en).join("")));
  assert.notEqual(getParagraphsByLocale(preface, "en", "soft", options)[0], paragraphs[0]);
});

test("exhibition lead formatting preserves all bilingual text and the 2026 lead", () => {
  const content = JSON.parse(fs.readFileSync(path.join(root, "content/site-content.json"), "utf8"));
  for (const exhibition of content.exhibitions) {
    for (const locale of ["zh", "en"]) {
      const original = getParagraphsByLocale(exhibition.description, locale, "soft", options);
      const formatted = getParagraphsByLocale(exhibition.description, locale, "soft", { ...options, englishLeadSentence: true });
      assert.equal(compact(formatted.join("")), compact(original.join("")), `${exhibition.slug}:${locale}`);
      if (locale === "zh" || exhibition.slug === "himalayan-art-2026") {
        assert.deepEqual(formatted, original, `${exhibition.slug}:${locale} keeps existing paragraphs`);
      }
    }
  }
});
