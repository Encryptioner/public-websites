// Shared "URL field" behavior for the homepage bonus panel and the any-page
// landing panel — same input + clear/copy-in-field buttons + disabled
// View/Copy-link buttons + "why disabled" note on both.

import { buildViewerLink, linkFormat } from "./viewer-link.js";
import { track, hostOf } from "./analytics.js";

export const DISABLED_REASON = "Enter a valid http(s) URL to enable View and Copy link.";
// No service names beyond GitHub raw (verified CORS-open) — naming more invites
// staleness; "CORS-friendly" is the actual rule the viewer applies.
export const TIP =
  "Tip: any public http(s) URL works. CORS-friendly links like GitHub raw load directly; others go via a public proxy that can see the URL. Need a raw link? See the list below.";

export function isHttpUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const CHECK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

// Wires an <input> + clear/copy-in-field buttons + View/Copy-link buttons +
// disabled-reason note into one working URL field. The shareable link comes from
// buildViewerLink() (see viewer-link.js — the single place the link format lives),
// resolved against `viewerBase`: "./" inside any-page/, "./any-page/" on the
// homepage. `context` labels this field's events in GA ("home" | "any_page").
// The caller still owns its own form-submit handler.
export function wireUrlField({ input, viewBtn, copyBtn, fieldNote, copyInputBtn, clearBtn, viewerBase = "./", context }) {
  const idleIcon = copyInputBtn.innerHTML;
  let touched = false;

  const sync = () => {
    const v = input.value.trim();
    const valid = isHttpUrl(v);
    viewBtn.disabled = !valid;
    copyBtn.disabled = !valid;
    fieldNote.hidden = !(touched && !valid);
    copyInputBtn.classList.toggle("show", v.length > 0);
    clearBtn.classList.toggle("show", v.length > 0);
    return valid;
  };
  input.addEventListener("focus", () => {
    // Fires once per page load, not on every refocus — enough to measure
    // "someone started using the panel" without flooding the property.
    if (!touched) track("url_field_engaged", { context });
    touched = true;
    sync();
  });
  input.addEventListener("input", sync);
  sync();

  clearBtn.addEventListener("click", () => {
    input.value = "";
    input.focus();
    sync();
    track("url_field_cleared", { context });
  });

  copyInputBtn.addEventListener("click", async () => {
    const v = input.value.trim();
    if (!v) return;
    await navigator.clipboard.writeText(v);
    track("url_field_copied", { context, host: hostOf(v) });
    copyInputBtn.innerHTML = CHECK_ICON;
    copyInputBtn.setAttribute("data-tip", "Copied!");
    setTimeout(() => {
      copyInputBtn.innerHTML = idleIcon;
      copyInputBtn.setAttribute("data-tip", "Copy");
    }, 1200);
  });

  copyBtn.addEventListener("click", async () => {
    const v = input.value.trim();
    if (!isHttpUrl(v)) return;
    await navigator.clipboard.writeText(buildViewerLink(v, viewerBase));
    track("viewer_link_copied", { context, host: hostOf(v), link_format: linkFormat(v) });
    const original = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    copyBtn.disabled = true;
    setTimeout(() => {
      copyBtn.textContent = original;
      sync();
    }, 1500);
  });

  return sync;
}
