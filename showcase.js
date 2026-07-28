import { track, hostOf } from "./analytics.js";
import { mediaCardHtml, escapeHtml, escapeAttr } from "./card.js";

const grid = document.getElementById("showcase-grid");
const chipsEl = document.getElementById("showcase-chips");
const empty = document.getElementById("showcase-empty");

let allItems = [];
let activeGroup = "all";
let groupMeta = [];

function render(items) {
  if (items.length === 0) {
    grid.innerHTML = "";
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  grid.innerHTML = items.map(mediaCardHtml).join("");
}

function chipsHtml() {
  const all = [{ id: "all", label: "All" }, ...groupMeta];
  return all
    .map((g) => {
      const n =
        g.id === "all"
          ? allItems.length
          : allItems.filter((i) => i.group === g.id).length;
      return `<button class="chip" role="tab" aria-selected="${g.id === activeGroup}"
              data-group="${escapeAttr(g.id)}">${escapeHtml(g.label)}
              <span class="chip-count">${n}</span></button>`;
    })
    .join("");
}

function syncChips() {
  for (const c of chipsEl.querySelectorAll(".chip")) {
    c.setAttribute("aria-selected", String(c.dataset.group === activeGroup));
  }
}

function applyFilter() {
  const items =
    activeGroup === "all"
      ? allItems
      : allItems.filter((i) => i.group === activeGroup);
  render(items);
  syncChips();
}

export async function initShowcase() {
  if (!grid) return;
  try {
    const res = await fetch("./highlights.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allItems = Array.isArray(data.items) ? data.items : [];
    groupMeta = Array.isArray(data.groups) ? data.groups : [];
    activeGroup = "all";
    chipsEl.innerHTML = chipsHtml();
    applyFilter();
    track("showcase_loaded", {
      count: allItems.length,
      groups: groupMeta.map((g) => g.id),
    });
  } catch (err) {
    grid.innerHTML = "";
    empty.hidden = false;
    empty.textContent = `Failed to load highlights.json: ${err.message}`;
  }
}

// Chip filter — delegation.
chipsEl?.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip[data-group]");
  if (!chip) return;
  activeGroup = chip.dataset.group;
  applyFilter();
  track("showcase_filtered", { group: activeGroup });
});

// Card clicks — delegation; position is index within currently-rendered grid.
grid?.addEventListener("click", (e) => {
  const card = e.target.closest("a.card--media[data-id]");
  if (!card) return;
  track("showcase_card_clicked", {
    id: card.dataset.id,
    group: card.dataset.group,
    position: [...grid.querySelectorAll("a.card--media")].indexOf(card) + 1,
    host: hostOf(card.href),
  });
});
