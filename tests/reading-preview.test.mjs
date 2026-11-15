import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const readingModule = { exports: {} };
const code = ts.transpileModule(fs.readFileSync(new URL("../lib/reading-preview.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(`(function(exports,module){${code}\n})`)(readingModule.exports, readingModule);
const { getReadingPreview } = readingModule.exports;
const content = JSON.parse(fs.readFileSync(new URL("../content/site-content.json", import.meta.url), "utf8"));

test("the long Hevajra passage folds without losing source or cutting a sentence", () => {
  const note = content.artworks.find(a => a.slug === "artwork-1773202689559").viewingNote;
  const original = { zh: [note.zh.trim()], en: [note.en.trim()] };
  const copy = JSON.stringify(original);
  for (const columns of [{ zh: 20, en: 45 }, { zh: 42, en: 90 }]) {
    const excerpt = getReadingPreview(original, columns);
    for (const locale of ["zh", "en"]) {
      const text = excerpt[locale].join("");
      assert.ok(text.length < original[locale][0].length);
      assert.ok(original[locale][0].startsWith(text));
      assert.match(text, /[。！？.!?][”’"')\]]*$/);
    }
  }
  assert.equal(JSON.stringify(original), copy);
});

test("both languages use the same line budget and smaller screens reveal less text", () => {
  const original = {
    zh: Array.from({ length: 8 }, () => "我们观看这件作品的形态。雕塑的细节映现出不同的光线。"),
    en: Array.from({ length: 8 }, () => "We look at the form of this sculpture. Its details reflect light in different ways."),
  };
  const small = getReadingPreview(original, { zh: 20, en: 45 });
  const wide = getReadingPreview(original, { zh: 40, en: 90 });
  for (const locale of ["zh", "en"]) {
    assert.ok(original[locale].join("").startsWith(small[locale].join("")));
    assert.ok(original[locale].join("").startsWith(wide[locale].join("")));
  }
  assert.ok(wide.zh.join("").length > small.zh.join("").length);
  assert.ok(wide.en.join("").length > small.en.join("").length);
});

test("quotes, names and short text retain source punctuation", () => {
  const text = 'Dr. A. Smith called the sculpture “quiet and composed.” ';
  const original = { zh: [], en: [text.repeat(30).trim()] };
  const excerpt = getReadingPreview(original, { zh: 20, en: 45 }).en[0];
  assert.ok(excerpt.startsWith(text.trim()));
  assert.ok(excerpt.endsWith('composed.”'));
  assert.ok(original.en[0].startsWith(excerpt));
  const short = { zh: ["第一段。", "第二段。", "第三段。", "第四段。"], en: ["One.", "Two.", "Three.", "Four."] };
  assert.equal(JSON.stringify(getReadingPreview(short)), JSON.stringify(short));
});
