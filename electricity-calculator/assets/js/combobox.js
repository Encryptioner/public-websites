/**
 * combobox.js — a reusable "search + select + add new" widget.
 *
 * One control covers three jobs the user previously needed separate UIs for:
 *   1. SELECT  — open it and pick from a list (no typing required)
 *   2. SEARCH  — type to filter the same list
 *   3. ADD     — if nothing matches, add the typed value as a new entry
 *
 * Used for both the Device picker and the Watt picker, so the same keyboard
 * and touch behaviour applies everywhere.
 *
 * Usage:
 *   const cb = new ECCombobox(rootEl, {
 *     placeholder: "Search…",
 *     allowAdd: true,
 *     getOptions: () => [{ value, label, sublabel, group }],
 *     formatAdd: (q) => `Add "${q}"`,
 *     validateAdd: (q) => true,          // optional: reject bad add queries
 *     onSelect: (value, label, isNew) => {},
 *   });
 *   cb.setValue(value, label);  cb.clear();  cb.focus();
 */
(function () {
  "use strict";

  let uid = 0;

  class ECCombobox {
    constructor(root, opts) {
      this.root = root;
      this.opts = opts;
      this.open = false;
      this.activeIndex = -1;
      this.value = null;
      this.flat = []; // current visible rows: { type:'option'|'add', value, label }
      this.id = "cb" + ++uid;
      this._build();
      this._bind();
    }

    _build() {
      this.root.classList.add("cb");
      this.root.innerHTML = "";

      this.input = document.createElement("input");
      this.input.type = "text";
      this.input.className = "cb-input";
      this.input.autocomplete = "off";
      this.input.spellcheck = false;
      this.input.placeholder = this.opts.placeholder || "";
      this.input.setAttribute("role", "combobox");
      this.input.setAttribute("aria-expanded", "false");
      this.input.setAttribute("aria-autocomplete", "list");
      this.input.setAttribute("aria-controls", this.id + "-list");

      this.caret = document.createElement("button");
      this.caret.type = "button";
      this.caret.className = "cb-caret";
      this.caret.tabIndex = -1;
      this.caret.setAttribute("aria-label", "Toggle list");
      this.caret.innerHTML = "▾";

      this.panel = document.createElement("ul");
      this.panel.className = "cb-panel";
      this.panel.id = this.id + "-list";
      this.panel.setAttribute("role", "listbox");
      this.panel.hidden = true;

      this.root.append(this.input, this.caret, this.panel);
    }

    _bind() {
      this.input.addEventListener("focus", () => this._openPanel());
      this.input.addEventListener("input", () => {
        this.value = null; // typing invalidates a prior selection
        this._render();
        this._openPanel();
      });
      this.input.addEventListener("keydown", (e) => this._onKey(e));
      this.caret.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.open ? this._closePanel() : (this.input.focus(), this._openPanel());
      });
      // Clicks inside panel
      this.panel.addEventListener("mousedown", (e) => {
        const li = e.target.closest("li[data-i]");
        if (!li) return;
        e.preventDefault();
        this._choose(Number(li.dataset.i));
      });
      // Close on outside click
      this._outside = (e) => {
        if (!this.root.contains(e.target)) this._closePanel();
      };
      document.addEventListener("mousedown", this._outside);
    }

    _openPanel() {
      if (this.open) return;
      this.open = true;
      this.input.setAttribute("aria-expanded", "true");
      this._render();
    }

    _closePanel() {
      if (!this.open) return;
      this.open = false;
      this.activeIndex = -1;
      this.input.setAttribute("aria-expanded", "false");
      this.panel.hidden = true;
    }

    _query() {
      return this.input.value.trim();
    }

    // Build the flat list of visible rows from current query.
    _compute() {
      const q = this._query().toLowerCase();
      const all = this.opts.getOptions() || [];
      const filtered = q
        ? all.filter(
            (o) =>
              o.label.toLowerCase().includes(q) ||
              (o.sublabel && o.sublabel.toLowerCase().includes(q)) ||
              (o.search && o.search.toLowerCase().includes(q))
          )
        : all;

      const rows = filtered.map((o) => ({ type: "option", ...o }));

      // Offer an "add" row when the typed text doesn't exactly match a label.
      const exact = all.some((o) => o.label.toLowerCase() === q);
      const canAdd =
        this.opts.allowAdd &&
        q.length > 0 &&
        !exact &&
        (!this.opts.validateAdd || this.opts.validateAdd(this._query()));
      if (canAdd) {
        rows.push({
          type: "add",
          value: this._query(),
          label: this.opts.formatAdd
            ? this.opts.formatAdd(this._query())
            : 'Add "' + this._query() + '"',
        });
      }
      return { rows, empty: rows.length === 0 };
    }

    _render() {
      if (!this.open) return;
      const { rows, empty } = this._compute();
      this.flat = rows;
      this.panel.hidden = false;

      if (empty) {
        this.panel.innerHTML =
          '<li class="cb-empty" aria-disabled="true">' +
          (window.ECi18n ? ECi18n.t("noMatches") : "No matches") +
          "</li>";
        this.activeIndex = -1;
        return;
      }

      let html = "";
      let lastGroup = null;
      rows.forEach((r, i) => {
        if (r.type === "option" && r.group && r.group !== lastGroup) {
          html += '<li class="cb-group" aria-disabled="true">' + esc(r.group) + "</li>";
          lastGroup = r.group;
        }
        const active = i === this.activeIndex ? " is-active" : "";
        const addCls = r.type === "add" ? " cb-add" : "";
        const sub = r.sublabel
          ? '<span class="cb-sub">' + esc(r.sublabel) + "</span>"
          : "";
        html +=
          '<li class="cb-opt' +
          addCls +
          active +
          '" role="option" data-i="' +
          i +
          '"><span class="cb-label">' +
          (r.type === "add" ? "＋ " : "") +
          esc(r.label) +
          "</span>" +
          sub +
          "</li>";
      });
      this.panel.innerHTML = html;
      this._scrollActive();
    }

    _scrollActive() {
      const el = this.panel.querySelector(".is-active");
      if (el) el.scrollIntoView({ block: "nearest" });
    }

    _move(delta) {
      if (!this.open) return this._openPanel();
      const n = this.flat.length;
      if (!n) return;
      let i = this.activeIndex;
      do {
        i = (i + delta + n) % n;
      } while (false);
      this.activeIndex = i;
      // mark
      this.panel.querySelectorAll(".cb-opt").forEach((el) => {
        el.classList.toggle("is-active", Number(el.dataset.i) === i);
      });
      this._scrollActive();
    }

    _onKey(e) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          this._move(1);
          break;
        case "ArrowUp":
          e.preventDefault();
          this._move(-1);
          break;
        case "Enter":
          if (this.open && this.activeIndex >= 0) {
            e.preventDefault();
            this._choose(this.activeIndex);
          } else if (this.open && this.flat.length) {
            // default to first row on Enter when nothing highlighted
            e.preventDefault();
            this._choose(0);
          }
          break;
        case "Escape":
          if (this.open) {
            e.preventDefault();
            this._closePanel();
          }
          break;
        case "Tab":
          this._closePanel();
          break;
      }
    }

    _choose(i) {
      const r = this.flat[i];
      if (!r) return;
      const isNew = r.type === "add";
      this.value = r.value;
      this.input.value = isNew ? r.value : r.label;
      this._closePanel();
      if (this.opts.onSelect) this.opts.onSelect(r.value, this.input.value, isNew);
    }

    // ---- public API ----
    setValue(value, label) {
      this.value = value;
      this.input.value = label != null ? label : value == null ? "" : String(value);
    }
    getValue() {
      return this.value;
    }
    getText() {
      return this._query();
    }
    clear() {
      this.value = null;
      this.input.value = "";
    }
    focus() {
      this.input.focus();
    }
    destroy() {
      document.removeEventListener("mousedown", this._outside);
    }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  window.ECCombobox = ECCombobox;
})();
