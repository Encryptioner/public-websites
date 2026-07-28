// The ONE place that decides what an "Any Page" link looks like. Every producer
// (homepage bonus panel View/Copy link, any-page landing View/Copy link) and the
// single consumer (any-page's target lookup) go through here, so changing the
// format is a one-file change.
//
// Default = fragment form:  any-page/#example.com/slides/index.html
// A fragment is never sent to a server, so the link is just a request for
// any-page/index.html on ANY host (GH Pages, Netlify, Live Server, python
// -m http.server) — no server-side rewrite or 404 quirk needed. It also keeps
// the target readable in the address bar instead of one long percent-encoded blob.
//
// Fallback = query form:  any-page/?url=<encoded>
// The fragment form drops the scheme (https:// is assumed on read), so anything
// non-https (http://localhost:5500/index.html) has to use ?url= to round-trip.

const HTTPS = /^https:\/\//i;

// Escape only what would break a fragment or a later decodeURIComponent:
// a literal %, a second #, and whitespace. Everything else stays legible.
function escapeFragment(s) {
  return s.replace(/[%#\s]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function unescapeFragment(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s; // hand-typed link with a stray % — take it literally
  }
}

// "hash" | "query" — which form buildViewerLink() will produce for this target.
export function linkFormat(target) {
  return HTTPS.test(target) ? "hash" : "query";
}

// Build the shareable/openable Any Page link for `target`.
// `viewerBase` is where any-page/ lives relative to the current page:
// "./" from inside any-page/, "./any-page/" from the homepage.
export function buildViewerLink(target, viewerBase = "./") {
  const base = new URL(viewerBase, location.href);
  return linkFormat(target) === "hash"
    ? new URL("#" + escapeFragment(target.replace(HTTPS, "")), base).href
    : new URL("?url=" + encodeURIComponent(target), base).href;
}

// Read the target out of a location-like object. Accepts both forms so old
// ?url= links (and hand-typed fragments) keep working forever.
// Returns { target, format } — target is null when there is nothing to render.
export function readViewerTarget(loc = location) {
  const q = new URLSearchParams(loc.search).get("url");
  if (q) return { target: q, format: "query" };
  if (loc.hash.length > 1) return { target: "https://" + unescapeFragment(loc.hash.slice(1)), format: "hash" };
  return { target: null, format: null };
}
