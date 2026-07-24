// Shared "URL field" behavior for the homepage bonus panel and the any-page
// landing panel — same input + clear/copy-in-field buttons + disabled
// View/Copy-link buttons + "why disabled" note on both.

export const DISABLED_REASON = "Enter a valid http(s) URL to enable View and Copy link.";
export const TIP = "Tip: GitHub raw, jsDelivr and CORS-friendly URLs load directly; others go via a public proxy.";

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
// disabled-reason note into one working URL field. `buildLink(v)` turns the
// validated URL into the shareable viewer link for the "Copy link" button;
// the caller still owns its own form-submit handler.
export function wireUrlField({ input, viewBtn, copyBtn, fieldNote, copyInputBtn, clearBtn, buildLink }) {
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
    touched = true;
    sync();
  });
  input.addEventListener("input", sync);
  sync();

  clearBtn.addEventListener("click", () => {
    input.value = "";
    input.focus();
    sync();
  });

  copyInputBtn.addEventListener("click", async () => {
    const v = input.value.trim();
    if (!v) return;
    await navigator.clipboard.writeText(v);
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
    await navigator.clipboard.writeText(buildLink(v));
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
