// Data-integrity self-check for highlights.json. Run: node highlights.test.mjs
import { readFileSync } from "node:fs";

const data = JSON.parse(
  readFileSync(new URL("./highlights.json", import.meta.url), "utf8")
);
const items = Array.isArray(data.items) ? data.items : [];
const groups = new Set(
  (Array.isArray(data.groups) ? data.groups : []).map((g) => g.id)
);

const REQUIRED = [
  "id", "title", "group", "category", "details", "description", "image", "link",
];
const EXCLUDED = new Set([
  "project-highlights-in-ND", "yearwise-highlights-in-ND", "biddaan-platform",
  "ai-mate-platform", "ft-education-platform", "bd-gas", "ai-mate-chatbot",
  "order-genie-shopify", "pixels-craft", "second-line", "daency",
  "daily-stocks", "bikribatta",
]);
const EXPECTED = { highlights: 4, projects: 19, articles: 11 };
const isHttp = (s) => typeof s === "string" && /^https?:\/\//.test(s);

let failed = 0;
const fail = (m) => {
  console.error("FAIL:", m);
  failed++;
};
const seen = new Set();

for (const it of items) {
  for (const k of REQUIRED) if (!it[k]) fail(`item "${it.id || "?"}" missing "${k}"`);
  if (!groups.has(it.group)) fail(`item "${it.id}" unknown group "${it.group}"`);
  if (EXCLUDED.has(it.id)) fail(`excluded id present: ${it.id}`);
  if (!isHttp(it.link)) fail(`item "${it.id}" link not http(s): ${it.link}`);
  if (!isHttp(it.image) && !String(it.image).startsWith("/"))
    fail(`item "${it.id}" image not http/relative: ${it.image}`);
  if (seen.has(it.id)) fail(`duplicate id: ${it.id}`);
  seen.add(it.id);
}
for (const g of data.groups || []) {
  if (!items.some((i) => i.group === g.id)) fail(`group "${g.id}" has no items`);
}
for (const [g, n] of Object.entries(EXPECTED)) {
  const got = items.filter((i) => i.group === g).length;
  if (got !== n) fail(`group "${g}" expected ${n} items, got ${got}`);
}

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
console.log(`OK — ${items.length} items across ${data.groups.length} groups`);
