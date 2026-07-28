// Data-integrity self-check for blog.json. Run: node blog.test.mjs
import { readFileSync } from "node:fs";

const data = JSON.parse(
  readFileSync(new URL("./blog.json", import.meta.url), "utf8")
);
const items = Array.isArray(data.items) ? data.items : [];
const groups = Array.isArray(data.groups) ? data.groups : [];

const REQUIRED = [
  "id", "title", "group", "category", "details", "description", "image", "link",
];
const isHttp = (s) => typeof s === "string" && /^https?:\/\//.test(s);
const groupIds = new Set(groups.map((g) => g.id));

let failed = 0;
const fail = (m) => {
  console.error("FAIL:", m);
  failed++;
};
const seen = new Set();
const seenImg = new Set();

for (const it of items) {
  for (const k of REQUIRED) if (!it[k]) fail(`item "${it.id || "?"}" missing "${k}"`);
  if (!isHttp(it.link)) fail(`item "${it.id}" link not http(s): ${it.link}`);
  if (!isHttp(it.image) && !String(it.image).startsWith("/"))
    fail(`item "${it.id}" image not http/relative: ${it.image}`);
  if (seen.has(it.id)) fail(`duplicate id: ${it.id}`);
  // No two posts should share a banner image.
  if (seenImg.has(it.image)) fail(`duplicate image: ${it.image} (on ${it.id})`);
  if (!groupIds.has(it.group)) fail(`item "${it.id}" group "${it.group}" not in groups`);
  seen.add(it.id);
  seenImg.add(it.image);
}

// Section must offer both filters, and the chip counts must match the items.
const EXPECTED_GROUPS = ["blog", "presentation"];
for (const id of EXPECTED_GROUPS) {
  if (!groupIds.has(id)) fail(`missing group: ${id}`);
  const n = items.filter((i) => i.group === id).length;
  if (n === 0) fail(`group "${id}" has no items`);
}

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
const tally = [...groupIds].map((g) => `${g}:${items.filter((i) => i.group === g).length}`).join(", ");
console.log(`OK — ${items.length} items (${tally}), all images unique`);
