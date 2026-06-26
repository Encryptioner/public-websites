/**
 * app.js — controller. Wires the UI, state, comboboxes, results, history and PDF.
 *
 * State shape (also what we persist):
 *   { title, mode:'days'|'range', periodDays, startDate, endDate,
 *     items: [ { id, name, watts, hours, split, segments:[{hours,days}] } ] }
 *
 * A non-split item uses a single span of `hours`/day over the global period.
 * A split item carries its own list of { hours, days } spans and ignores the
 * global period — this is how "6h for 6 days, then 3h for 24 days" is modelled.
 */
(function () {
  "use strict";

  const { CATEGORIES, DEVICES, WATT_PRESETS, SAMPLE } = window.ECData;
  const i18n = window.ECi18n;
  const calc = window.ECCalc;
  const store = window.ECStore;
  const $ = (id) => document.getElementById(id);

  let state = blankState();
  let deviceCb, wattCb;
  let saveTimer = null;

  function blankState() {
    return {
      title: "",
      mode: "days",
      periodDays: 30,
      startDate: "",
      endDate: "",
      items: [],
    };
  }

  let nextId = 1;
  function makeItem(name, watts, hours) {
    return {
      id: nextId++,
      name: name,
      watts: calc.num(watts),
      hours: calc.num(hours),
      split: false,
      segments: [],
    };
  }

  // ---------- i18n plumbing ----------
  function t(k) {
    return i18n.t(k);
  }
  function applyStaticI18n() {
    document.documentElement.lang = i18n.getLang();
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      el.placeholder = t(el.dataset.i18nPh);
    });
    document.querySelectorAll(".lang-btn").forEach((b) => {
      b.classList.toggle("is-on", b.dataset.lang === i18n.getLang());
    });
    if (deviceCb) deviceCb.input.placeholder = t("devicePlaceholder");
    if (wattCb) wattCb.input.placeholder = t("wattPlaceholder");
  }
  function deviceLabel(d) {
    return i18n.getLang() === "bn" && d.bn ? d.bn : d.name;
  }
  // Localized display name for a stored (canonical English) device name.
  // Custom devices keep whatever the user typed.
  function displayName(name) {
    const d = DEVICES.find((x) => x.name === name);
    return d ? deviceLabel(d) : name;
  }

  // ---------- comboboxes ----------
  function deviceOptions() {
    return DEVICES.map((d) => ({
      value: d.name, // canonical English name (stable across languages)
      label: deviceLabel(d),
      sublabel: t("categories")[d.cat],
      group: t("categories")[d.cat],
      search: d.name + " " + d.bn + " " + d.watts,
    }));
  }
  function wattOptions() {
    return WATT_PRESETS.map((w) => ({
      value: w,
      label: w + " " + t("wattShort"),
      search: String(w),
    }));
  }

  function buildComboboxes() {
    deviceCb = new ECCombobox($("deviceCb"), {
      placeholder: t("devicePlaceholder"),
      allowAdd: true,
      getOptions: deviceOptions,
      formatAdd: (q) => i18n.fmt(t("addCustomLabel"), { q }),
      onSelect: (value, label, isNew) => {
        if (!isNew) {
          const d = DEVICES.find((x) => x.name === value);
          if (d) wattCb.setValue(d.watts, d.watts + " " + t("wattShort"));
        }
        $("hoursInput").focus();
      },
    });

    wattCb = new ECCombobox($("wattCb"), {
      placeholder: t("wattPlaceholder"),
      allowAdd: true,
      getOptions: wattOptions,
      validateAdd: (q) => {
        const n = Number(q);
        return Number.isFinite(n) && n > 0;
      },
      formatAdd: (q) => i18n.fmt(t("addCustomWatt"), { q }),
      onSelect: (value) => {
        // normalize an added value to a number
        if (typeof value !== "number") wattCb.value = Number(value);
      },
    });
  }

  // ---------- period ----------
  function effectivePeriodDays() {
    if (state.mode === "range") return calc.daysBetween(state.startDate, state.endDate);
    return calc.num(state.periodDays);
  }

  // Build a calc-ready item (fills .segments from the model).
  function effItem(it) {
    if (it.split) {
      return {
        name: it.name,
        watts: it.watts,
        segments: it.segments.length ? it.segments : [{ hours: 0, days: 0 }],
      };
    }
    return {
      name: it.name,
      watts: it.watts,
      segments: [{ hours: it.hours, days: effectivePeriodDays() }],
    };
  }
  function effItems() {
    return state.items.map(effItem);
  }

  // ---------- rendering ----------
  function render() {
    applyStaticI18n();
    renderItems();
    updateResults();
    renderHistory();
    renderFaq();
    syncPeriodInputs();
  }

  function syncPeriodInputs() {
    $("titleInput").value = state.title;
    $("daysInput").value = state.periodDays;
    $("startInput").value = state.startDate;
    $("endInput").value = state.endDate;
    const days = state.mode === "days";
    $("modeDaysBtn").classList.toggle("is-on", days);
    $("modeRangeBtn").classList.toggle("is-on", !days);
    $("daysWrap").hidden = !days;
    $("rangeWrap").hidden = days;
    if (!days) {
      const n = calc.daysBetween(state.startDate, state.endDate);
      $("daysComputed").textContent = i18n.fmt(t("daysComputed"), { n });
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

  function renderItems() {
    const list = $("itemsList");
    const empty = $("emptyState");
    if (!state.items.length) {
      list.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    list.innerHTML = state.items.map(itemCardHtml).join("");
  }

  function itemCardHtml(it) {
    const w = t("wattShort");
    let segHtml = "";
    if (it.split) {
      const rows = (it.segments.length ? it.segments : [{ hours: 0, days: 0 }])
        .map(
          (s, i) =>
            '<div class="seg-row" data-sid="' + i + '">' +
            '<label class="seg-field"><span>' + esc(t("segHours")) + "</span>" +
            '<input type="number" class="text-input seg-hours" min="0" max="24" step="0.5" value="' + esc(s.hours) + '" inputmode="decimal"></label>' +
            '<label class="seg-field"><span>' + esc(t("segDays")) + "</span>" +
            '<input type="number" class="text-input seg-days" min="0" step="1" value="' + esc(s.days) + '" inputmode="numeric"></label>' +
            '<button type="button" class="icon-btn seg-remove" title="' + esc(t("removeSegment")) + '" aria-label="' + esc(t("removeSegment")) + '">✕</button>' +
            "</div>"
        )
        .join("");
      const totDays = it.segments.reduce((a, s) => a + calc.num(s.days), 0);
      const totHours = it.segments.reduce((a, s) => a + calc.num(s.hours) * calc.num(s.days), 0);
      segHtml =
        '<div class="segments">' +
        rows +
        '<button type="button" class="btn btn-ghost btn-sm seg-add">' + esc(t("addSegment")) + "</button>" +
        '<div class="seg-note">' + esc(i18n.fmt(t("segSumNote"), { d: totDays, h: calc.round(totHours, 1) })) + "</div>" +
        "</div>";
    } else {
      segHtml =
        '<label class="field it-hours-field"><span class="field-label">' + esc(t("hoursLabel")) + "</span>" +
        '<input type="number" class="text-input it-hours" min="0" max="24" step="0.5" value="' + esc(it.hours) + '" inputmode="decimal"></label>';
    }

    return (
      '<article class="item" data-id="' + it.id + '">' +
      '<div class="item-top">' +
      '<div class="item-name" title="' + esc(displayName(it.name)) + '">' + esc(displayName(it.name)) + "</div>" +
      '<div class="item-tools">' +
      '<button type="button" class="icon-btn it-dup" title="' + esc(t("duplicate")) + '" aria-label="' + esc(t("duplicate")) + '">⧉</button>' +
      '<button type="button" class="icon-btn it-remove" title="' + esc(t("remove")) + '" aria-label="' + esc(t("remove")) + '">🗑</button>' +
      "</div></div>" +
      '<div class="item-body">' +
      '<label class="field it-watt-field"><span class="field-label">' + esc(t("wattLabel")) + "</span>" +
      '<div class="watt-edit"><input type="number" class="text-input it-watt" min="0" step="1" value="' + esc(it.watts) + '" inputmode="numeric"><span class="watt-suffix">' + esc(w) + "</span></div></label>" +
      segHtml +
      "</div>" +
      '<label class="split-toggle"><input type="checkbox" class="it-split"' + (it.split ? " checked" : "") + "> <span>" + esc(t("segmentsToggle")) + "</span></label>" +
      "</article>"
    );
  }

  function findItem(id) {
    return state.items.find((x) => x.id === Number(id));
  }

  // ---------- results ----------
  function updateResults() {
    const items = effItems();
    const total = calc.totalKwh(items);
    const totalR = calc.round(total, 2);
    $("totalKwh").textContent = totalR;
    $("mobileKwh").textContent = totalR;

    const rows = calc.breakdown(items);
    const bdEl = $("breakdown");
    const noRes = $("noResult");
    if (!rows.length || total <= 0) {
      bdEl.innerHTML = "";
      noRes.hidden = false;
    } else {
      noRes.hidden = true;
      bdEl.innerHTML = rows
        .map((r) => {
          const pct = calc.round(r.percent, 0);
          return (
            '<div class="bd-row">' +
            '<div class="bd-main"><span class="bd-name">' + esc(displayName(r.name)) + "</span>" +
            '<span class="bd-kwh">' + calc.round(r.kwh, 2) + " " + esc(t("unit").split(" ")[0]) + "</span></div>" +
            '<div class="bd-bar"><span style="width:' + Math.max(2, pct) + '%"></span></div>' +
            '<div class="bd-meta">' + r.watts + " " + esc(t("wattShort")) + " · " + calc.round(r.hours, 1) + " h · " + pct + "% " + esc(t("ofTotal")) + "</div>" +
            "</div>"
          );
        })
        .join("");
    }
    renderFormula(rows, total);
    $("mobileTotal").classList.toggle("show", total > 0);
    scheduleSave();
  }

  function renderFormula(rows, total) {
    const body = $("formulaBody");
    if (!rows.length || total <= 0) {
      body.innerHTML = "";
      return;
    }
    const lines = rows.map((r) => {
      return (
        '<div class="fline"><b>' + esc(displayName(r.name)) + "</b>: " +
        r.watts + " W × " + calc.round(r.hours, 1) + " h ÷ 1000 = <b>" +
        calc.round(r.kwh, 2) + " kWh</b></div>"
      );
    });
    lines.push(
      '<div class="fline ftotal">Σ = <b>' + calc.round(total, 2) + " kWh</b></div>"
    );
    body.innerHTML = lines.join("");
  }

  // ---------- history ----------
  function renderHistory() {
    const el = $("historyList");
    const items = store.getHistory();
    if (!items.length) {
      el.innerHTML = '<p class="muted">' + esc(t("historyEmpty")) + "</p>";
      return;
    }
    el.innerHTML = items
      .map((e) => {
        let when = e.savedAt;
        try {
          when = new Date(e.savedAt).toLocaleString();
        } catch (_) {}
        return (
          '<div class="hist-row" data-hid="' + e.id + '">' +
          '<div class="hist-info"><span class="hist-title">' + esc(e.title) + "</span>" +
          '<span class="hist-when">' + esc(i18n.fmt(t("savedAt"), { when })) + "</span></div>" +
          '<div class="hist-tools">' +
          '<button type="button" class="btn btn-ghost btn-sm hist-load">' + esc(t("load")) + "</button>" +
          '<button type="button" class="icon-btn hist-del" title="' + esc(t("delete")) + '" aria-label="' + esc(t("delete")) + '">🗑</button>' +
          "</div></div>"
        );
      })
      .join("");
  }

  // ---------- FAQ ----------
  function renderFaq() {
    const el = $("faqList");
    const faqs = i18n.dict().faq || [];
    el.innerHTML = faqs
      .map(
        (f) =>
          "<details class=\"faq-item\"><summary>" + esc(f.q) + "</summary><div class=\"faq-a\">" + f.a + "</div></details>"
      )
      .join("");
  }

  // ---------- state <-> UI ----------
  function currentState() {
    return {
      title: $("titleInput").value.trim(),
      mode: state.mode,
      periodDays: calc.num($("daysInput").value),
      startDate: $("startInput").value,
      endDate: $("endInput").value,
      items: state.items.map((it) => ({
        name: it.name,
        watts: it.watts,
        hours: it.hours,
        split: it.split,
        segments: it.segments,
      })),
    };
  }

  // Convert sample/saved data into the live model.
  function adoptState(raw) {
    const s = blankState();
    if (!raw) return s;
    s.title = raw.title || "";
    s.mode = raw.mode === "range" ? "range" : "days";
    s.periodDays = calc.num(raw.periodDays) || (raw.periodDays === 0 ? 0 : 30);
    s.startDate = raw.startDate || "";
    s.endDate = raw.endDate || "";
    s.items = (raw.items || []).map((it) => {
      const segs = Array.isArray(it.segments) ? it.segments : [];
      const split = it.split != null ? !!it.split : segs.length > 1;
      const hours =
        it.hours != null ? it.hours : segs.length === 1 ? segs[0].hours : 0;
      return {
        id: nextId++,
        name: it.name,
        watts: calc.num(it.watts),
        hours: calc.num(hours),
        split: split,
        segments: split ? segs.map((x) => ({ hours: calc.num(x.hours), days: calc.num(x.days) })) : [],
      };
    });
    return s;
  }

  function loadSample() {
    state = adoptState(SAMPLE);
    render();
  }

  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => store.saveState(currentState()), 400);
  }

  // ---------- add device ----------
  function addDevice() {
    const name = (deviceCb.getValue() || deviceCb.getText()).toString().trim();
    let watts = wattCb.getValue();
    if (watts == null) watts = Number(wattCb.getText());
    const hours = Number($("hoursInput").value);

    if (!name) return flashInvalid($("deviceCb"));
    if (!Number.isFinite(watts) || watts <= 0) return flashInvalid($("wattCb"));

    state.items.push(makeItem(name, watts, Number.isFinite(hours) ? hours : 0));
    deviceCb.clear();
    wattCb.clear();
    $("hoursInput").value = "1";
    deviceCb.focus();
    renderItems();
    updateResults();
  }

  function flashInvalid(el) {
    el.classList.remove("shake");
    void el.offsetWidth; // reflow to restart animation
    el.classList.add("shake");
  }

  // ---------- PDF ----------
  async function downloadPdf() {
    const items = effItems();
    const rows = calc.breakdown(items);
    const total = calc.totalKwh(items);
    const periodDays = effectivePeriodDays();
    const now = new Date();
    const stamp =
      now.getFullYear() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      "-" +
      pad(now.getHours()) +
      pad(now.getMinutes());

    const report = {
      appName: t("appName"),
      subtitle: t("tagline"),
      title: ($("titleInput").value.trim() || t("appName")),
      generatedLabel: t("pdfGenerated"),
      generatedAt: now.toLocaleString(),
      periodLabel: t("pdfPeriod"),
      periodText: periodDays + " " + t("days"),
      cols: {
        device: t("pdfDevice"),
        watts: t("pdfWatts"),
        usage: t("pdfUsage"),
        kwh: t("pdfKwh"),
      },
      rows: rows.map((r) => ({
        name: displayName(r.name),
        watts: r.watts + " " + t("wattShort"),
        usage: calc.round(r.hours, 1) + " h",
        kwh: calc.round(r.kwh, 2),
      })),
      totalLabel: t("pdfTotal"),
      totalKwh: calc.round(total, 2),
      unit: t("unit"),
      footer: t("pdfFooter") + " · " + location.origin + location.pathname,
      fileStamp: stamp,
    };

    const btn = $("pdfBtn");
    btn.disabled = true;
    try {
      await window.ECPdf.exportPdf(report);
    } catch (err) {
      alert(err.message || "PDF export failed.");
    } finally {
      btn.disabled = false;
    }
  }
  function pad(n) {
    return n < 10 ? "0" + n : "" + n;
  }

  // ---------- events ----------
  function bind() {
    // language
    document.querySelectorAll(".lang-btn").forEach((b) => {
      b.addEventListener("click", () => {
        i18n.setLang(b.dataset.lang);
        store.setLang(b.dataset.lang);
        render();
      });
    });

    // title
    $("titleInput").addEventListener("input", () => {
      state.title = $("titleInput").value;
      scheduleSave();
    });

    // period mode
    $("modeDaysBtn").addEventListener("click", () => setMode("days"));
    $("modeRangeBtn").addEventListener("click", () => setMode("range"));
    $("daysInput").addEventListener("input", () => {
      state.periodDays = calc.num($("daysInput").value);
      updateResults();
    });
    $("startInput").addEventListener("input", () => {
      state.startDate = $("startInput").value;
      syncPeriodInputs();
      updateResults();
    });
    $("endInput").addEventListener("input", () => {
      state.endDate = $("endInput").value;
      syncPeriodInputs();
      updateResults();
    });

    // add
    $("addBtn").addEventListener("click", addDevice);
    $("hoursInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") addDevice();
    });

    // items (event delegation)
    $("itemsList").addEventListener("input", onItemInput);
    $("itemsList").addEventListener("change", onItemChange);
    $("itemsList").addEventListener("click", onItemClick);

    // toolbar
    $("sampleBtn").addEventListener("click", loadSample);
    $("resetBtn").addEventListener("click", () => {
      if (state.items.length && !confirm(t("confirmReset"))) return;
      state = blankState();
      $("titleInput").value = "";
      render();
    });

    // results actions
    $("saveBtn").addEventListener("click", () => {
      const s = currentState();
      if (!s.title) s.title = t("appName");
      store.addToHistory(s);
      renderHistory();
      flashSaved();
    });
    $("pdfBtn").addEventListener("click", downloadPdf);

    // history (delegation)
    $("historyList").addEventListener("click", (e) => {
      const row = e.target.closest(".hist-row");
      if (!row) return;
      const id = row.dataset.hid;
      const entry = store.getHistory().find((x) => x.id === id);
      if (e.target.closest(".hist-load") && entry) {
        state = adoptState(entry.state);
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (e.target.closest(".hist-del")) {
        if (confirm(t("confirmDelete"))) {
          store.deleteHistory(id);
          renderHistory();
        }
      }
    });
  }

  function setMode(mode) {
    state.mode = mode;
    syncPeriodInputs();
    updateResults();
  }

  function onItemInput(e) {
    const card = e.target.closest(".item");
    if (!card) return;
    const it = findItem(card.dataset.id);
    if (!it) return;
    if (e.target.classList.contains("it-watt")) {
      it.watts = calc.num(e.target.value);
    } else if (e.target.classList.contains("it-hours")) {
      it.hours = calc.num(e.target.value);
    } else if (e.target.classList.contains("seg-hours") || e.target.classList.contains("seg-days")) {
      const segRow = e.target.closest(".seg-row");
      const seg = it.segments[Number(segRow.dataset.sid)];
      if (seg) {
        if (e.target.classList.contains("seg-hours")) seg.hours = calc.num(e.target.value);
        else seg.days = calc.num(e.target.value);
        // live-update the spans note without losing input focus
        const note = card.querySelector(".seg-note");
        if (note) {
          const totDays = it.segments.reduce((a, s) => a + calc.num(s.days), 0);
          const totHours = it.segments.reduce((a, s) => a + calc.num(s.hours) * calc.num(s.days), 0);
          note.textContent = i18n.fmt(t("segSumNote"), { d: totDays, h: calc.round(totHours, 1) });
        }
      }
    }
    updateResults();
  }

  function onItemChange(e) {
    if (!e.target.classList.contains("it-split")) return;
    const card = e.target.closest(".item");
    const it = findItem(card.dataset.id);
    if (!it) return;
    it.split = e.target.checked;
    if (it.split && !it.segments.length) {
      // seed first span from the simple hours + current period
      it.segments = [{ hours: it.hours, days: effectivePeriodDays() }];
    }
    renderItems();
    updateResults();
  }

  function onItemClick(e) {
    const card = e.target.closest(".item");
    if (!card) return;
    const it = findItem(card.dataset.id);
    if (!it) return;
    if (e.target.closest(".it-remove")) {
      state.items = state.items.filter((x) => x.id !== it.id);
      renderItems();
      updateResults();
    } else if (e.target.closest(".it-dup")) {
      const copy = JSON.parse(JSON.stringify(it));
      copy.id = nextId++;
      const idx = state.items.indexOf(it);
      state.items.splice(idx + 1, 0, copy);
      renderItems();
      updateResults();
    } else if (e.target.closest(".seg-add")) {
      it.segments.push({ hours: 0, days: 0 });
      renderItems();
      updateResults();
    } else if (e.target.closest(".seg-remove")) {
      const segRow = e.target.closest(".seg-row");
      it.segments.splice(Number(segRow.dataset.sid), 1);
      if (!it.segments.length) it.segments.push({ hours: 0, days: 0 });
      renderItems();
      updateResults();
    }
  }

  function flashSaved() {
    const btn = $("saveBtn");
    const old = btn.textContent;
    btn.textContent = t("saved");
    btn.classList.add("ok");
    setTimeout(() => {
      btn.textContent = old;
      btn.classList.remove("ok");
    }, 1400);
  }

  // ---------- init ----------
  function init() {
    const savedLang = store.getLang();
    const browserBn = (navigator.language || "").toLowerCase().startsWith("bn");
    i18n.setLang(savedLang || (browserBn ? "bn" : "en"));

    buildComboboxes();
    bind();

    const restored = store.loadState();
    state = restored ? adoptState(restored) : blankState();
    // default a title so first PDF has a sensible name
    if (!state.title) state.title = "";
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
