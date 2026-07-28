// Shared chip-filtered media-grid controller for the Showcase and Blog sections.
// Both render the same media cards (card.js) behind an All / <group> chip filter,
// so the filter state machine, chip rendering, and analytics wiring live here once.
// Each section shrinks to a config object (see showcase.js / blog.js).

import { mediaCardHtml, escapeHtml, escapeAttr } from "./card.js";
import { track, hostOf } from "./analytics.js";

export function wireFilterableGrid({
  grid,
  chipsEl,
  empty,
  countEl,
  detailsEl,
  jsonPath,
  events, // { loaded, filtered, cardClicked, toggled, section }
}) {
  let allItems = [];
  let groupMeta = [];
  let activeGroup = "all";

  function render(items) {
    if (items.length === 0) {
      grid.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    grid.innerHTML = items.map(mediaCardHtml).join("");
  }

  function chipsHtmlStr() {
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

  function applyFilter() {
    render(
      activeGroup === "all"
        ? allItems
        : allItems.filter((i) => i.group === activeGroup)
    );
    for (const c of chipsEl.querySelectorAll(".chip")) {
      c.setAttribute("aria-selected", String(c.dataset.group === activeGroup));
    }
  }

  async function init() {
    if (!grid) return;
    try {
      const res = await fetch(jsonPath, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      allItems = Array.isArray(data.items) ? data.items : [];
      groupMeta = Array.isArray(data.groups) ? data.groups : [];
      activeGroup = "all";
      chipsEl.innerHTML = chipsHtmlStr();
      applyFilter();
      if (countEl) {
        countEl.textContent = String(allItems.length);
        countEl.hidden = false;
      }
      track(events.loaded, {
        count: allItems.length,
        ...(groupMeta.length ? { groups: groupMeta.map((g) => g.id) } : {}),
      });
    } catch (err) {
      grid.innerHTML = "";
      empty.hidden = false;
      empty.textContent = `Failed to load ${jsonPath.split("/").pop()}: ${err.message}`;
    }
  }

  // Chip filter — delegation.
  chipsEl?.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip[data-group]");
    if (!chip) return;
    activeGroup = chip.dataset.group;
    applyFilter();
    track(events.filtered, { group: activeGroup });
  });

  // Card clicks — delegation; position is index within currently-rendered grid.
  grid?.addEventListener("click", (e) => {
    const card = e.target.closest("a.card--media[data-id]");
    if (!card) return;
    track(events.cardClicked, {
      id: card.dataset.id,
      group: card.dataset.group,
      position: [...grid.querySelectorAll("a.card--media")].indexOf(card) + 1,
      host: hostOf(card.href),
    });
  });

  // Section expand/collapse — native <details> toggle event.
  detailsEl?.addEventListener("toggle", () => {
    track(events.toggled, { section: events.section, expanded: detailsEl.open });
  });

  return { init };
}
