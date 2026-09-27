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
const fixture = fs.readFileSync(path.join(root, "content/site-content.json"), "utf8");
const compiled = new Map();
const stopMessage = /已停止保存以避免覆盖现有数据/;

// Load the real TypeScript modules with only Next's cache, filesystem I/O and
// fetch isolated. Tests cannot contact GitHub or write any content/media files.
function harness({ failure, env = {} } = {}) {
  const state = { body: fixture, puts: 0, reads: 0, localReads: 0, localWrites: 0 };
  const fakeProcess = {
    cwd: () => root,
    env: {
      NODE_ENV: "production",
      GITHUB_CONTENTS_TOKEN: "test-only-not-a-credential",
      GITHUB_REPO_OWNER: "test-owner",
      GITHUB_REPO_NAME: "test-repo",
      GITHUB_REPO_BRANCH: "main",
      ...env,
    },
  };
  const context = vm.createContext({
    Buffer, URL, console, structuredClone, process: fakeProcess,
    fetch: async (url, options) => {
      assert.equal(new URL(url).hostname, "api.github.com");
      if (options.method === "PUT") {
        state.puts++;
        state.body = Buffer.from(JSON.parse(options.body).content, "base64").toString("utf8");
        return new Response("{}", { status: 200 });
      }
      assert.equal(options.cache, "no-store");
      if (options.headers.Accept === "application/vnd.github.raw+json") {
        state.reads++;
        if (failure === "network") throw new Error("Simulated network failure");
        if (typeof failure === "number") return new Response("Unavailable", { status: failure });
        const bodies = { empty: "", invalid: "not json", partial: '{"artworks":[]}', null: "null" };
        return new Response(bodies[failure] ?? state.body, { status: 200 });
      }
      // This reproduces GitHub's >1 MB metadata response: no inline content.
      return Response.json({ sha: `revision-${state.puts}`, content: "", encoding: "none" });
    },
  });
  const modules = new Map();
  function load(filename) {
    if (modules.has(filename)) return modules.get(filename).exports;
    if (!compiled.has(filename)) {
      compiled.set(filename, ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
        fileName: filename,
      }).outputText);
    }
    const loaded = { exports: {} };
    modules.set(filename, loaded);
    const scopedRequire = (id) => {
      if (id === "next/cache") return { unstable_cache: (fn) => fn };
      if (id === "fs") return { promises: {
        readFile: async () => { state.localReads++; return fixture; },
        mkdir: async () => {},
        writeFile: async () => { state.localWrites++; },
      } };
      if (id.startsWith(".")) return load(path.resolve(path.dirname(filename), `${id}.ts`));
      return require(id);
    };
    vm.runInContext(`(function(exports, require, module) {${compiled.get(filename)}\n})`, context, { filename })(loaded.exports, scopedRequire, loaded);
    return loaded.exports;
  }
  return {
    state,
    store: load(path.join(root, "lib/content-store.ts")),
    github: load(path.join(root, "lib/github-repo.ts")),
    copyQuality: load(path.join(root, "lib/copy-quality.ts")),
  };
}

test("publication titles preserve original English terms without changing region rules", () => {
  const { copyQuality } = harness();
  const artwork = {
    title: { zh: "西藏艺术", en: "Art of Tibet" },
    region: { zh: "西藏", en: "Tibet" },
    publications: [{
      title: { zh: "《西藏佛教仪式艺术》", en: "Buddhist Ritual Art of Tibet" },
      note: { zh: "西藏", en: "Tibet" },
    }],
  };
  for (const source of [artwork, { artworks: [artwork] }]) {
    const before = JSON.stringify(source);
    const result = copyQuality.normalizeBilingualFieldsDeep(source);
    const normalized = result.value.artworks?.[0] ?? result.value;
    assert.equal(normalized.publications[0].title.en, "Buddhist Ritual Art of Tibet");
    assert.equal(normalized.publications[0].title.zh, artwork.publications[0].title.zh);
    assert.equal(normalized.region.en, "Xizang");
    assert.equal(normalized.title.en, "Art of Xizang");
    assert.equal(normalized.publications[0].note.en, "Xizang");
    assert.equal(result.stats.englishTermFixes, 3);
    assert.equal(JSON.stringify(source), before);
    assert.equal(JSON.stringify(copyQuality.normalizeBilingualFieldsDeep(result.value).value), JSON.stringify(result.value));
  }
});

test("saving a corrected publication title and then media retains the exact book title", async () => {
  const { store, state } = harness();
  const normalized = await store.readSiteContentFresh();
  state.body = JSON.stringify({ artworks: normalized.artworks, exhibitions: normalized.exhibitions, articles: normalized.articles });
  const before = JSON.parse(state.body);
  const target = before.artworks.find((a) => a.publicationStatus === "draft");
  assert.ok(target);
  const updated = structuredClone(target);
  updated.publications = [{
    title: { zh: "《西藏佛教仪式艺术》", en: "Buddhist Ritual Art of Tibet" },
    year: "", pages: { zh: "第29页", en: "p. 29" },
  }];
  await store.saveArtworkRecord(target.id, updated, "test");
  await store.saveArtworkMediaField(target.id, "image", "/uploads/test-main.jpg", "test");
  const after = JSON.parse(state.body);
  const result = after.artworks.find((a) => a.id === target.id);
  assert.equal(result.publications[0].title.en, "Buddhist Ritual Art of Tibet");
  assert.equal(result.publications[0].title.zh, "《西藏佛教仪式艺术》");
  assert.deepEqual(after.artworks.filter((a) => a.id !== target.id), before.artworks.filter((a) => a.id !== target.id));
  assert.deepEqual(after.exhibitions, before.exhibitions);
  assert.deepEqual(after.articles, before.articles);
  assert.equal(state.puts, 2);
  assert.equal(state.localWrites, 0);
});

const mutations = [
  ["saveSiteSection", ["artworks", [], "test"]],
  ["createArtworkDraft", ["test"]],
  ["duplicateArtworkRecord", ["id", "test"]],
  ["createExhibitionDraft", ["test"]],
  ["duplicateExhibitionRecord", ["slug", "test"]],
  ["deleteExhibitionRecord", ["slug", "test"]],
  ["createArticleDraft", ["test"]],
  ["duplicateArticleRecord", ["slug", "test"]],
  ["deleteArticleRecord", ["slug", "test"]],
  ["saveArtworkRecord", ["id", {}, "test"]],
  ["deleteArtworkRecord", ["id", "test"]],
  ["reorderArtworkRecords", [[], "test"]],
  ["saveArtworkMediaField", ["id", "image", "/new.jpg", "test"]],
  ["assertMediaTargetExists", ["artworks", "id"]],
  ["saveRecordMediaField", ["exhibitions", "slug", "cover", "/new.jpg", "test"]],
  ["saveRecordMediaField", ["articles", "slug", "cover", "/new.jpg", "test"]],
];

test("raw API reads the real >1 MB bilingual content without truncation", async () => {
  assert.ok(Buffer.byteLength(fixture) > 1024 * 1024);
  const { github, state } = harness();
  assert.equal(await github.getRepoUtf8File("content/site-content.json"), fixture);
  assert.equal(state.localReads, 0);
  state.body = '{"small":"中文与 English"}';
  assert.equal(await github.getRepoUtf8File("content/site-content.json"), state.body);
});

for (const failure of [401, 403, 404, 500, "network", "empty", "invalid", "partial", "null"]) {
  test(`all save/media entry points fail closed on ${failure}`, async () => {
    const { store, state } = harness({ failure });
    for (const [name, args] of mutations) await assert.rejects(store[name](...args), stopMessage, name);
    assert.equal(state.puts, 0);
    assert.equal(state.localReads, 0);
    assert.equal(state.localWrites, 0);
  });
}

test("missing production configuration cannot fall back to a deployed snapshot", async () => {
  const { store, state } = harness({ env: { GITHUB_CONTENTS_TOKEN: "" } });
  await assert.rejects(store.createArtworkDraft("test"), stopMessage);
  assert.equal(state.localReads + state.puts + state.localWrites, 0);
});

test("configured development writes also require fresh remote content", async () => {
  const { store, state } = harness({ failure: 500, env: { NODE_ENV: "development" } });
  await assert.rejects(store.createArtworkDraft("test"), stopMessage);
  assert.equal(state.localReads + state.puts + state.localWrites, 0);
});

test("ordinary public reads retain their read-only local fallback", async () => {
  const { store, state } = harness({ failure: 500 });
  const content = await store.loadSiteContent();
  assert.equal(content.artworks.length, JSON.parse(fixture).artworks.length);
  assert.equal(state.localReads, 1);
  assert.equal(state.puts + state.localWrites, 0);
});

test("unconfigured local development remains usable", async () => {
  const { store, state } = harness({ env: { NODE_ENV: "development", GITHUB_CONTENTS_TOKEN: "" } });
  await store.createArtworkDraft("test");
  assert.equal(state.localReads, 1);
  assert.equal(state.localWrites, 1);
  assert.equal(state.reads + state.puts, 0);
});

test("sequential media saves preserve all earlier images and other records", async () => {
  const { store, state } = harness();
  const normalized = await store.readSiteContentFresh();
  state.reads = 0;
  state.body = JSON.stringify({ artworks: normalized.artworks, exhibitions: normalized.exhibitions, articles: normalized.articles });
  const before = JSON.parse(state.body);
  const target = before.artworks.find((a) => a.publicationStatus === "draft");
  assert.ok(target);
  await store.saveArtworkMediaField(target.id, "image", "/uploads/test-main.jpg", "test");
  await store.saveArtworkMediaField(target.id, "gallery", "/uploads/test-detail-1.jpg", "test", { galleryIndex: target.gallery.length });
  await store.saveArtworkMediaField(target.id, "gallery", "/uploads/test-detail-2.jpg", "test", { galleryIndex: target.gallery.length + 1 });
  const after = JSON.parse(state.body);
  const result = after.artworks.find((a) => a.id === target.id);
  assert.equal(result.image, "/uploads/test-main.jpg");
  assert.deepEqual(result.gallery, [...target.gallery, "/uploads/test-detail-1.jpg", "/uploads/test-detail-2.jpg"]);
  assert.deepEqual(after.artworks.filter((a) => a.id !== target.id), before.artworks.filter((a) => a.id !== target.id));
  assert.deepEqual(after.exhibitions, before.exhibitions);
  assert.deepEqual(after.articles, before.articles);
  assert.equal(state.reads, 3);
  assert.equal(state.puts, 3);
  assert.equal(state.localReads + state.localWrites, 0);
});
