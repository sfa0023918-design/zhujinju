import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));
// Resolve the same PostCSS instance used by Next, including its override.
const nextRequire = createRequire(require.resolve("next/package.json"));
const postcss = nextRequire("postcss");

test("PostCSS prevents CSS text from closing an inline style element", () => {
  const css = 'a { content: "</style><script>test</script><style>"; }';
  assert.doesNotMatch(postcss.parse(css).toResult().css, /<\/style/i);
  const ordinary = "a { color: #333; margin: 0 20px; }";
  assert.equal(postcss.parse(ordinary).toResult().css, ordinary);
});

test("PostCSS does not read source maps outside the CSS directory or without from", async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "zhujinju-css-map-"));
  const cssDirectory = path.join(directory, "css");
  mkdirSync(cssDirectory);
  const marker = "SYNTHETIC_MAP_CONTENT_MUST_NOT_BE_DISCLOSED";
  const mapFile = path.join(directory, "outside.map");
  writeFileSync(mapFile, JSON.stringify({
    version: 3, sources: ["private.js"], sourcesContent: [marker],
    names: [], mappings: "AAAA",
  }));
  try {
    for (const [annotation, from] of [
      ["../outside.map", path.join(cssDirectory, "input.css")],
      [mapFile, undefined],
    ]) {
      const result = await postcss([]).process(
        `a { color: red; }\n/*# sourceMappingURL=${annotation} */`,
        { from, map: { inline: false } },
      );
      assert.ok(!`${result.css}\n${result.map?.toString() ?? ""}`.includes(marker));
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

// Bound hostile-input probes so a future dependency regression cannot hang CI.
function runIsolated(code) {
  execFileSync(process.execPath, ["--max-old-space-size=128", "--input-type=commonjs", "-e", code], {
    cwd: root, timeout: 5000, maxBuffer: 1024 * 1024, stdio: "pipe",
  });
}

test("Nano ID rejects overflow and completes zero or negative size calls", () => {
  runIsolated(`
    const assert = require("node:assert/strict");
    const { nanoid, customAlphabet } = require("nanoid");
    const nonSecure = require("nanoid/non-secure");
    assert.throws(() => nanoid(2147483648), RangeError);
    assert.match(nanoid(), /^[A-Za-z0-9_-]{21}$/);
    assert.notEqual(nanoid(), "u".repeat(21));
    assert.equal(customAlphabet("abc", 0)(), "");
    assert.equal(nonSecure.nanoid(-1), "");
    assert.equal(nonSecure.customAlphabet("abc", -1)(), "");
  `);
});

test("source-map-js bounds malicious offsets and handles maps beyond the input", () => {
  runIsolated(`
    const assert = require("node:assert/strict");
    const { SourceMapConsumer, SourceNode } = require("source-map-js");
    const input = "const x = 1;\\n";
    const indexedMap = line => ({ version: 3, sections: [{
      offset: { line, column: 0 },
      map: { version: 3, sources: ["input.js"], sourcesContent: [input], names: [], mappings: "AAAA" },
    }] });
    assert.throws(() => new SourceMapConsumer(indexedMap(1000000000)), /offset line/i);
    const consumer = new SourceMapConsumer(indexedMap(1000000));
    assert.equal(SourceNode.fromStringWithSourceMap(input, consumer).toString(), input);
  `);
});
