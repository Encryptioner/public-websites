// Showcase section — renders highlights/projects as a chip-filterable card grid.
// Filter logic + analytics are shared via grid-filter.js; this file is config only.
import { wireFilterableGrid } from "./grid-filter.js";

export function initShowcase() {
  return wireFilterableGrid({
    grid: document.getElementById("showcase-grid"),
    chipsEl: document.getElementById("showcase-chips"),
    empty: document.getElementById("showcase-empty"),
    countEl: document.querySelector(".showcase .sec-count"),
    detailsEl: document.querySelector(".showcase details"),
    jsonPath: "./highlights.json",
    events: {
      loaded: "showcase_loaded",
      filtered: "showcase_filtered",
      cardClicked: "showcase_card_clicked",
      toggled: "section_toggled",
      section: "showcase",
    },
  }).init();
}
