// Google Analytics (GA4) for public-websites — the ONE place that owns the
// measurement ID, the gtag bootstrap, and the event vocabulary. Every page
// (index.html, any-page/, 404.html) imports from here; nothing else touches
// window.gtag or dataLayer.
//
// No build step in this repo, so there is no snippet to paste into each <head>:
// this module injects gtag.js itself on first import. Pushing to dataLayer works
// before the script finishes loading (that's how the official snippet works too),
// so track() never needs its own queue.

// Swap this for the real GA4 property ID. While it still contains XXXX, tracking
// self-disables — a placeholder ID would otherwise send invalid hits.
export const MEASUREMENT_ID = "G-52BWKLZ4D1";

export const ENABLED = !/X{4}/.test(MEASUREMENT_ID);

// Only the hostname of a target URL is ever reported — the full URL a visitor
// pastes into Any Page can be private (unlisted gist, internal preview), so the
// path never leaves the browser.
export function hostOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "invalid";
  }
}

if (ENABLED) {
  window.dataLayer = window.dataLayer || [];
  // Real `arguments` object, not (...a) — gtag requires the arguments shape.
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", MEASUREMENT_ID, {
    // Sub-sites live at /public-websites/<slug>/ and are separate apps with their
    // own properties; this hub only reports its own hand-authored pages.
    transport_type: "beacon",
  });

  const s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + MEASUREMENT_ID;
  document.head.appendChild(s);
}

// Fire a GA4 event. No-ops when disabled or when gtag is blocked (ad blockers,
// offline) — analytics must never break the page.
export function track(name, params) {
  if (!ENABLED || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}
