// Blog & Presentations section — articles and slide decks as a chip-filterable
// card grid. Filter logic + analytics are shared via grid-filter.js; config only.
import { wireFilterableGrid } from "./grid-filter.js";

export function initBlog() {
  return wireFilterableGrid({
    grid: document.getElementById("blog-grid"),
    chipsEl: document.getElementById("blog-chips"),
    empty: document.getElementById("blog-empty"),
    countEl: document.querySelector(".blog .sec-count"),
    detailsEl: document.querySelector(".blog details"),
    jsonPath: "./blog.json",
    events: {
      loaded: "blog_loaded",
      filtered: "blog_filtered",
      cardClicked: "blog_card_clicked",
      toggled: "section_toggled",
      section: "blog",
    },
  }).init();
}
