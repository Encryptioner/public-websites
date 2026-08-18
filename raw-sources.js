// Shared "where do I get a raw file link?" helper for the homepage bonus panel
// and the any-page landing panel — same collapsed list of paste services on
// both. PrivateBin is deliberately absent: its pastes are encrypted client-side,
// so no URL can serve the plaintext without the fragment key.

import { track, hostOf } from "./analytics.js";

const RAW_SOURCES = [
  {
    name: "Pastebin",
    url: "https://pastebin.com/",
    meta: "No account · never (or your choice)",
    raw: "Raw button above the paste, or pastebin.com/raw/ID",
  },
  {
    name: "GitHub Gist",
    url: "https://gist.github.com/",
    meta: "Free account · never expires",
    raw: "Raw button on the file — CORS-friendly, loads directly in Any Page",
  },
  {
    name: "Rentry",
    url: "https://rentry.co/",
    meta: "No account · never (until deleted)",
    raw: "Raw link at the bottom of the page",
  },
  {
    name: "dpaste",
    url: "https://dpaste.com/",
    meta: "No account · auto-expires, you pick when",
    raw: "Append .txt to the paste URL",
  },
  {
    name: "0x0.st",
    url: "https://0x0.st/",
    meta: "No account · 30 days minimum",
    raw: "curl -F'file=@index.html' https://0x0.st — the URL it prints IS the raw file",
  },
];

// Fills `el` with the collapsed <details> and wires its analytics. Native
// <details> handles the collapse — no open/close state in JS. `context` labels
// events ("home" | "any_page") like wireUrlField does.
export function mountRawSources(el, context) {
  if (!el) return;
  el.innerHTML = `
    <details class="raw-sources">
      <summary>Where do I get a raw file link?</summary>
      <ul>
        ${RAW_SOURCES.map(
          (s) => `
        <li>
          <a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>
          <span class="meta">${s.meta}</span>
          <span class="meta">${s.raw}</span>
        </li>`
        ).join("")}
      </ul>
    </details>`;
  const details = el.querySelector("details");
  details.addEventListener("toggle", () =>
    track("section_toggled", { section: "raw_sources", expanded: details.open, context })
  );
  details.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (a)
      track("raw_source_clicked", {
        context,
        service: a.textContent.trim(),
        host: hostOf(a.href),
      });
  });
}
