import { track, hostOf } from "./analytics.js";
import { mediaCardHtml } from "./card.js";

const grid = document.getElementById("blog-grid");
const empty = document.getElementById("blog-empty");

export async function initBlog() {
  if (!grid) return;
  try {
    const res = await fetch("./blog.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    if (!items.length) {
      grid.innerHTML = "";
      empty.hidden = false;
      empty.textContent = "No posts yet.";
      return;
    }
    empty.hidden = true;
    grid.innerHTML = items.map(mediaCardHtml).join("");
    track("blog_loaded", { count: items.length });
  } catch (err) {
    grid.innerHTML = "";
    empty.hidden = false;
    empty.textContent = `Failed to load blog.json: ${err.message}`;
  }
}

// Card clicks — delegation; position is index within the rendered grid.
grid?.addEventListener("click", (e) => {
  const card = e.target.closest("a.card--media[data-id]");
  if (!card) return;
  track("blog_card_clicked", {
    id: card.dataset.id,
    position: [...grid.querySelectorAll("a.card--media")].indexOf(card) + 1,
    host: hostOf(card.href),
  });
});
