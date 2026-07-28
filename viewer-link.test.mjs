// Round-trip check for the Any Page link format. No deps, no test runner:
//   node viewer-link.test.mjs
// (This repo has no package.json on purpose — this file is the whole test suite.)
import assert from "node:assert/strict";

globalThis.location = { href: "https://encryptioner.github.io/public-websites/any-page/", search: "", hash: "" };
const { buildViewerLink, readViewerTarget, linkFormat } = await import("./viewer-link.js");

const at = (href) => {
  const u = new URL(href);
  return { href, search: u.search, hash: u.hash };
};

// https target → fragment form, and it round-trips
const https = "https://raw.githubusercontent.com/user/repo/main/index.html";
assert.equal(linkFormat(https), "hash");
assert.equal(
  buildViewerLink(https),
  "https://encryptioner.github.io/public-websites/any-page/#raw.githubusercontent.com/user/repo/main/index.html"
);
assert.deepEqual(readViewerTarget(at(buildViewerLink(https))), { target: https, format: "hash" });

// non-https target → query form, and it round-trips
const http = "http://localhost:5500/deck/index.html";
assert.equal(linkFormat(http), "query");
assert.deepEqual(readViewerTarget(at(buildViewerLink(http))), { target: http, format: "query" });

// nasty characters survive the fragment escape (space, %, ?query, #-free)
const nasty = "https://example.com/a b/100%25 done/index.html?x=1&y=2";
assert.deepEqual(readViewerTarget(at(buildViewerLink(nasty))), { target: nasty, format: "hash" });

// homepage builds links into ./any-page/
globalThis.location = { href: "https://encryptioner.github.io/public-websites/", search: "", hash: "" };
assert.equal(
  buildViewerLink(https, "./any-page/"),
  "https://encryptioner.github.io/public-websites/any-page/#raw.githubusercontent.com/user/repo/main/index.html"
);

// hand-typed shorthand (no escaping at all) still parses
assert.deepEqual(readViewerTarget(at("https://x.io/any-page/#example.com/deck/index.html")), {
  target: "https://example.com/deck/index.html",
  format: "hash",
});

// nothing to render
assert.deepEqual(readViewerTarget(at("https://x.io/any-page/")), { target: null, format: null });

console.log("viewer-link: all checks passed");
