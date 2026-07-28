// Shared media-card renderer for the Showcase and Blog sections.
// Both render identical cards, so the template lives here once — change the
// card design in one place and both sections pick it up.

export function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}
export const escapeAttr = escapeHtml;

export function mediaCardHtml(it) {
  return `
    <li>
      <a class="card card--media" href="${escapeAttr(it.link)}" target="_blank"
         rel="noopener" data-id="${escapeAttr(it.id)}" data-group="${escapeAttr(it.group || "")}">
        <div class="card-media">
          <img src="${escapeAttr(it.image)}" alt="" loading="lazy" decoding="async"
               width="400" height="300"
               onerror="this.parentElement.classList.add('is-noimg')" />
        </div>
        <div class="card-body">
          <div class="card-top">
            <h3 class="card-title">${escapeHtml(it.title)}</h3>
            <span class="card-cat">${escapeHtml(it.category)}</span>
          </div>
          <p class="card-tagline">${escapeHtml(it.description)}</p>
          <div class="card-foot">
            <span>${escapeHtml(it.details)}</span>
            <span class="card-cta">Visit ↗</span>
          </div>
        </div>
      </a>
    </li>`;
}
