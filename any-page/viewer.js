// Sandboxed-iframe rendering for any-page/index.html, split out of index.html so the
// fetch/proxy/sandbox logic isn't buried in a large inline <script>. Corner-button hrefs
// are absolute (/public-websites/...) rather than relative to avoid any ambiguity about
// which directory the surrounding page is served from.

export const ICONS = {
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
  external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
};

// ponytail: single public proxy fallback. Swap/add proxies here if it rate-limits or dies.
function proxied(u) {
  return "https://corsproxy.io/?url=" + encodeURIComponent(u);
}

// Race a direct fetch (private, no third party) against the CORS proxy at the same time
// instead of waiting for the direct attempt to fail first — first one to succeed wins,
// the other is aborted. ponytail: always fires the proxy request too, trading a bit of
// proxy quota for lower latency on blocked sites.
//
// Resolves { html, finalUrl } — finalUrl is response.url (post-redirect) for the direct
// path, since relative asset paths must resolve against where the page actually landed,
// not the URL typed in (e.g. raw.github.com 301s to raw.githubusercontent.com/.../file).
// The proxy path can't report the target's real final URL (response.url is the proxy's),
// so it falls back to u.
function fetchHtml(u) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let failures = 0;
    const directCtrl = new AbortController();
    const proxyCtrl = new AbortController();

    const succeed = (result, otherCtrl) => {
      if (settled) return;
      settled = true;
      otherCtrl.abort();
      resolve(result);
    };
    const fail = (err) => {
      failures++;
      if (failures === 2 && !settled) {
        settled = true;
        reject(err);
      }
    };

    fetch(u, { redirect: "follow", signal: directCtrl.signal })
      .then((r) =>
        r.ok
          ? r.text().then((t) => ({ html: t, finalUrl: r.url || u }))
          : Promise.reject(new Error("HTTP " + r.status))
      )
      .then((res) => succeed(res, proxyCtrl))
      .catch(fail);

    fetch(proxied(u), { signal: proxyCtrl.signal })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error("HTTP " + r.status))))
      .then((t) => succeed({ html: t, finalUrl: u }, directCtrl))
      .catch(fail);
  });
}

// Inject a <base> so the page's relative CSS/JS/images resolve against the source.
function withBase(html, u) {
  if (/<base\b/i.test(html)) return html; // respect an existing base
  const baseHref = new URL(".", u).href;
  const tag = '<base href="' + baseHref + '">';
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head([^>]*)>/i, "<head$1>" + tag);
  return tag + html;
}

// Renders u in a sandboxed iframe. Calls onError(err) instead of throwing if the fetch fails.
export async function renderViewer(u, onError) {
  document.body.innerHTML = `
    <div id="viewerWrap">
      <iframe id="frame" title="Rendered page"></iframe>
      <div class="loading" id="loading">
        <div class="spinner"></div>
        <p>Loading page…</p>
      </div>
    </div>
    <div class="corner" id="corner">
      <a class="icon-btn extra" id="cornerOpen" target="_blank" rel="noopener" data-tip="Open source" aria-label="Open source">${ICONS.external}</a>
      <a class="icon-btn extra" id="cornerNew" href="/public-websites/any-page/" data-tip="New" aria-label="New">${ICONS.plus}</a>
      <a class="icon-btn extra" id="cornerHome" href="/public-websites/" data-tip="Public Websites" aria-label="Back to Public Websites">${ICONS.home}</a>
      <button class="icon-btn" id="cornerToggle" type="button" data-tip="Info" aria-label="Show info">${ICONS.info}</button>
    </div>`;

  // Set via property, not string interpolation — u comes from the ?url= query param or
  // the any-page/<host>/<path> passthrough, and splicing it into the HTML template above
  // would let a crafted link break out of the attribute and inject markup.
  document.getElementById("cornerOpen").href = u;

  const corner = document.getElementById("corner");
  const toggle = document.getElementById("cornerToggle");
  toggle.addEventListener("click", () => {
    const open = corner.classList.toggle("open");
    toggle.innerHTML = open ? ICONS.close : ICONS.info;
    toggle.setAttribute("aria-label", open ? "Hide info" : "Show info");
    toggle.setAttribute("data-tip", open ? "Hide info" : "Info");
  });

  try {
    const { html, finalUrl } = await fetchHtml(u);
    const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (m && m[1].trim()) document.title = m[1].trim() + " · Any Page";
    const frame = document.getElementById("frame");
    const loading = document.getElementById("loading");
    frame.addEventListener("load", () => {
      loading.style.opacity = "0";
      setTimeout(() => loading.remove(), 220);
    });
    // No allow-same-origin → rendered page runs in a null origin and cannot touch this site's storage/cookies.
    // ponytail: safe default. Some pages needing same-origin APIs (localStorage) will degrade — that's the tradeoff for isolation.
    frame.setAttribute(
      "sandbox",
      "allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals allow-presentation"
    );
    frame.srcdoc = withBase(html, finalUrl);
  } catch (err) {
    onError(err);
  }
}
