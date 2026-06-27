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

  const { CATEGORIES, DEVICES, WATT_PRESETS, SCENARIOS } = window.ECData;
  const i18n = window.ECi18n;
  const calc = window.ECCalc;
  const store = window.ECStore;
  const $ = (id) => document.getElementById(id);

  let state = blankState();
  let deviceCb, wattCb;
  let saveTimer = null;

  // ── custom confirm dialog ──────────────────────────────────────────────────
  let _confirmResolve = null;
  function confirmDialog(msg) {
    return new Promise((resolve) => {
      _confirmResolve = resolve;
      const overlay = $("confirmOverlay");
      $("confirmMsg").textContent = msg;
      $("confirmOkBtn").textContent = i18n.t("dialogConfirm");
      $("confirmCancelBtn").textContent = i18n.t("dialogCancel");
      overlay.hidden = false;
      $("confirmOkBtn").focus();
    });
  }
  function _bindConfirmDialog() {
    $("confirmOkBtn").addEventListener("click", () => {
      $("confirmOverlay").hidden = true;
      if (_confirmResolve) { _confirmResolve(true); _confirmResolve = null; }
    });
    $("confirmCancelBtn").addEventListener("click", () => {
      $("confirmOverlay").hidden = true;
      if (_confirmResolve) { _confirmResolve(false); _confirmResolve = null; }
    });
    $("confirmOverlay").addEventListener("click", (e) => {
      if (e.target === $("confirmOverlay")) {
        $("confirmOverlay").hidden = true;
        if (_confirmResolve) { _confirmResolve(false); _confirmResolve = null; }
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("confirmOverlay").hidden) {
        $("confirmOverlay").hidden = true;
        if (_confirmResolve) { _confirmResolve(false); _confirmResolve = null; }
      }
    });
  }

  // ── toast ──────────────────────────────────────────────────────────────────
  let _toastTimer = null;
  function showToast(msg, durationMs) {
    const el = $("toastEl");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove("show"), durationMs || 2000);
  }

  function blankState() {
    return {
      title: "",
      mode: "days",
      periodDays: 30,
      startDate: "",
      endDate: "",
      occupiedDays: "", // optional global "days someone was present"
      items: [],
    };
  }

  let nextId = 1;
  let lastSavedSig = null; // signature of the last state pushed to history
  // daysMode: 'all' = whole billing period (constant, e.g. fridge),
  //           'present' = the global "days present" value (flexible),
  //           'custom' = this device's own days field.
  function makeItem(name, watts, hours) {
    return {
      id: nextId++,
      name: name,
      watts: calc.num(watts),
      hours: calc.num(hours),
      hoursUnit: "h/day",
      days: effectivePeriodDays(),
      daysMode: "all",
      split: false,
      segments: [],
      note: "",
      noteOpen: false,
    };
  }

  // Normalize any hoursUnit to hours-per-day for calc.
  function hoursPerDay(it) {
    const h = it.hours;
    const u = it.hoursUnit || "h/day";
    if (u === "min/day") return h / 60;
    if (u === "h/week") return h / 7;
    if (u === "min/week") return h / (60 * 7);
    return h;
  }

  // Returns max and step attrs for the hours input based on unit.
  function hoursUnitAttrs(unit) {
    if (unit === "min/day") return { max: 1440, step: 1 };
    if (unit === "h/week") return { max: 168, step: 0.5 };
    if (unit === "min/week") return { max: 10080, step: 1 };
    return { max: 24, step: 0.5 };
  }

  // Returns "Name (2)", "Name (3)" etc. for duplicate device items.
  function nextCopyName(name) {
    const base = name.replace(/ \(\d+\)$/, "");
    let max = 0;
    state.items.forEach((it) => {
      const itBase = it.name.replace(/ \(\d+\)$/, "");
      if (itBase === base) {
        const m = it.name.match(/ \((\d+)\)$/);
        max = Math.max(max, m ? parseInt(m[1], 10) : 1);
      }
    });
    return base + " (" + (max + 1) + ")";
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
      numericOnly: true, // only digits typeable; the unit "W" only shows in labels
      getOptions: wattOptions,
      validateAdd: (q) => {
        const n = Number(q);
        return Number.isFinite(n) && n > 0;
      },
      formatAdd: (q) => i18n.fmt(t("addCustomWatt"), { q }),
      onSelect: (value, label, isNew) => {
        // normalize an added value to a number and show it as "<n> W"
        if (isNew) {
          const n = Number(value);
          wattCb.setValue(n, n + " " + t("wattShort"));
        }
      },
    });
  }

  // ---------- period ----------
  function effectivePeriodDays() {
    if (state.mode === "range") return calc.daysBetween(state.startDate, state.endDate);
    return calc.num(state.periodDays);
  }
  // "Days present" — falls back to the full period when not set.
  function effectiveOccupiedDays() {
    const o = calc.num(state.occupiedDays);
    return o > 0 ? o : effectivePeriodDays();
  }
  // Resolve a non-split device's days from its daysMode.
  function itemDays(it) {
    if (it.daysMode === "all") return effectivePeriodDays();
    if (it.daysMode === "present") return effectiveOccupiedDays();
    return calc.num(it.days);
  }

  // Build a calc-ready item (fills .segments from the model).
  // hoursPerDay() converts any unit to h/day before the calc engine sees it.
  function effItem(it) {
    if (it.split) {
      return {
        name: it.name,
        watts: it.watts,
        note: it.note || "",
        segments: it.segments.length ? it.segments : [{ hours: 0, days: 0 }],
      };
    }
    return {
      name: it.name,
      watts: it.watts,
      note: it.note || "",
      segments: [{ hours: hoursPerDay(it), days: itemDays(it) }],
    };
  }
  function effItems() {
    return state.items.map(effItem);
  }

  // ---------- rendering ----------
  function render() {
    applyStaticI18n();
    populateScenarioSelect();
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
    $("occupiedInput").value = state.occupiedDays === "" ? "" : state.occupiedDays;
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
    const badge = $("deviceCount");
    const hasItems = state.items.length > 0;
    $("clearAllBtn").hidden = !hasItems;
    $("resetBtn").hidden = !hasItems;
    if (!hasItems) {
      list.innerHTML = "";
      empty.hidden = false;
      badge.hidden = true;
      return;
    }
    empty.hidden = true;
    badge.textContent = state.items.length;
    badge.hidden = false;
    list.innerHTML = state.items.map((it, idx) => itemCardHtml(it, idx)).join("");
  }

  function itemCardHtml(it, index) {
    const w = t("wattShort");
    let segHtml = "";
    if (it.split) {
      const segArr = it.segments.length ? it.segments : [{ hours: 0, days: 0 }];
      const onlyOne = segArr.length <= 1; // can't remove the last remaining span
      const rows = segArr
        .map(
          (s, i) =>
            '<div class="seg-row" data-sid="' + i + '">' +
            '<label class="seg-field"><span>' + esc(t("segHours")) + "</span>" +
            '<input type="number" class="text-input seg-hours" min="0" max="24" step="0.5" value="' + esc(s.hours) + '" inputmode="decimal"></label>' +
            '<label class="seg-field"><span>' + esc(t("segDays")) + "</span>" +
            '<input type="number" class="text-input seg-days" min="0" step="1" value="' + esc(s.days) + '" inputmode="numeric"></label>' +
            '<button type="button" class="icon-btn seg-remove" ' + (onlyOne ? "disabled " : "") + 'title="' + esc(t("removeSegment")) + '" aria-label="' + esc(t("removeSegment")) + '">✕</button>' +
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
    }

    const wattField =
      '<label class="field it-watt-field"><span class="field-label">' + esc(t("wattLabel")) + "</span>" +
      '<div class="watt-edit"><input type="number" class="text-input it-watt" min="0" step="1" value="' + esc(it.watts) + '" inputmode="numeric"><span class="watt-suffix">' + esc(w) + "</span></div></label>";

    let bodyHtml;
    if (it.split) {
      bodyHtml = '<div class="item-fields one">' + wattField + "</div>" + segHtml;
    } else {
      const custom = it.daysMode === "custom";
      const shownDays = itemDays(it);
      const hoursUnit = it.hoursUnit || "h/day";
      const unitA = hoursUnitAttrs(hoursUnit);
      const hoursFieldLabel = hoursUnit === "min/day" ? t("hoursLabelMinDay")
        : hoursUnit === "h/week" ? t("hoursLabelHWeek")
        : hoursUnit === "min/week" ? t("hoursLabelMinWeek")
        : t("hoursLabel");
      const unitOpts = [
        ["h/day", t("unitHDay")],
        ["min/day", t("unitMinDay")],
        ["h/week", t("unitHWeek")],
        ["min/week", t("unitMinWeek")],
      ].map(([val, label]) =>
        '<option value="' + val + '"' + (hoursUnit === val ? " selected" : "") + ">" + esc(label) + "</option>"
      ).join("");
      const opt = (val, label) =>
        '<option value="' + val + '"' + (it.daysMode === val ? " selected" : "") + ">" + esc(label) + "</option>";
      const daysSelect =
        '<select class="text-input it-daysmode">' +
        opt("all", t("srcAll") + " (" + effectivePeriodDays() + ")") +
        opt("present", t("srcPresent") + " (" + effectiveOccupiedDays() + ")") +
        opt("custom", t("srcCustom")) +
        "</select>";
      bodyHtml =
        '<div class="item-fields three">' +
        wattField +
        '<label class="field"><span class="field-label">' + esc(hoursFieldLabel) + "</span>" +
        '<div class="hours-wrap">' +
        '<input type="number" class="text-input it-hours" min="0" max="' + unitA.max + '" step="' + unitA.step + '" value="' + esc(it.hours) + '" inputmode="decimal">' +
        '<select class="text-input it-hoursunit">' + unitOpts + "</select>" +
        "</div></label>" +
        '<label class="field"><span class="field-label">' + esc(t("daysUsedLabel")) + "</span>" +
        daysSelect + "</label>" +
        "</div>" +
        (custom
          ? '<label class="field it-customdays"><span class="field-label">' + esc(t("srcCustom")) + " — " + esc(t("segDays")) +
            '</span><input type="number" class="text-input it-days" min="0" step="1" value="' + esc(it.days) + '" inputmode="numeric"></label>'
          : '<div class="days-resolved">' + esc(t("daysUsedLabel")) + ": <b>" + shownDays + " " + esc(t("days")) + "</b></div>");
    }

    const noteHtml = it.noteOpen
      ? '<div class="it-note-wrap">' +
        '<textarea class="it-note text-input" rows="2" placeholder="' + esc(t("notePlaceholder")) + '">' + esc(it.note) + "</textarea>" +
        '<button type="button" class="it-note-hide btn-link">' + esc(t("hideNote")) + "</button>" +
        "</div>"
      : '<button type="button" class="it-note-add btn-link">' + esc(t("addNote")) + "</button>";

    return (
      '<article class="item" data-id="' + it.id + '">' +
      '<div class="item-top">' +
      '<span class="item-num">' + esc(String(index + 1) + ".") + "</span>" +
      '<div class="item-name" title="' + esc(displayName(it.name)) + '">' + esc(displayName(it.name)) + "</div>" +
      '<div class="item-tools">' +
      '<button type="button" class="icon-btn it-dup" title="' + esc(t("duplicate")) + '" aria-label="' + esc(t("duplicate")) + '">⧉</button>' +
      '<button type="button" class="icon-btn it-remove" title="' + esc(t("remove")) + '" aria-label="' + esc(t("remove")) + '">🗑</button>' +
      "</div></div>" +
      bodyHtml +
      '<label class="chk-row split-toggle"><input type="checkbox" class="it-split"' + (it.split ? " checked" : "") + "> <span>" + esc(t("segmentsToggle")) + "</span></label>" +
      '<div class="it-note-row">' + noteHtml + "</div>" +
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
    renderSummary(rows, total);
    $("mobileTotal").classList.toggle("show", total > 0);
    updateSaveButton();
    scheduleSave();
  }

  // A clean table that doubles as the PDF preview.
  function renderSummary(rows, total) {
    const wrap = $("summaryWrap");
    if (!rows.length || total <= 0) {
      wrap.hidden = true;
      wrap.innerHTML = "";
      return;
    }
    wrap.hidden = false;

    // Period meta
    const periodDays = effectivePeriodDays();
    const occupiedDays = calc.num(state.occupiedDays);
    let periodMeta = "";
    if (state.mode === "range" && state.startDate && state.endDate) {
      periodMeta += '<span class="summary-meta-item"><b>' + esc(t("startLabel")) + ":</b> " + esc(state.startDate) + "</span>" +
        '<span class="summary-meta-item"><b>' + esc(t("endLabel")) + ":</b> " + esc(state.endDate) + "</span>";
    }
    periodMeta += '<span class="summary-meta-item"><b>' + esc(t("daysLabel")) + ":</b> " + periodDays + " " + esc(t("days")) + "</span>";
    if (occupiedDays > 0 && occupiedDays < periodDays) {
      periodMeta += '<span class="summary-meta-item"><b>' + esc(t("pdfPresentDays")) + ":</b> " + occupiedDays + " " + esc(t("days")) + "</span>";
    }

    const head =
      "<thead><tr><th>" + esc(t("pdfDevice")) + "</th><th>" + esc(t("pdfWatts")) +
      "</th><th>" + esc(t("pdfUsage")) + "</th><th>" + esc(t("pdfKwh")) + "</th><th>" + esc(t("pdfPercent")) + "</th></tr></thead>";
    // Build noteMap once to avoid repeated linear search and handle duplicate names.
    const noteMap = {};
    state.items.forEach((it) => { if (it.note && !noteMap[it.name]) noteMap[it.name] = it.note; });
    const body = rows
      .map((r) => {
        const note = noteMap[r.name];
        const noteRow = note
          ? '<tr class="summary-note-row"><td colspan="5">' + esc(note) + "</td></tr>"
          : "";
        return "<tr><td>" + esc(displayName(r.name)) + "</td><td>" + r.watts +
          "</td><td>" + calc.round(r.hours, 1) + " h</td><td><b>" + calc.round(r.kwh, 2) + "</b></td><td>" + calc.round(r.percent, 0) + "%</td></tr>" + noteRow;
      })
      .join("");
    const foot =
      '<tfoot><tr><td colspan="3">' + esc(t("pdfTotal")) + "</td><td><b>" +
      calc.round(total, 2) + "</b></td><td>100%</td></tr></tfoot>";
    wrap.innerHTML =
      '<div class="summary-head"><h3 class="sub-title">' + esc(t("summaryHeading")) +
      '</h3><div class="summary-head-right"><span class="muted summary-hint">' + esc(t("summaryHint")) + '</span>' +
      '<button type="button" class="btn btn-primary btn-sm summary-pdf-btn">' + esc(t("downloadPdf")) + "</button></div></div>" +
      '<div class="summary-meta">' + periodMeta + "</div>" +
      '<div class="table-scroll"><table class="summary-table">' + head + "<tbody>" + body + "</tbody>" + foot + "</table></div>";
  }

  // Show "Save" only when the current calculation differs from the last saved
  // snapshot (and has devices) — so the button never invites a no-op click.
  function stateSignature() {
    return JSON.stringify(currentState());
  }
  function updateSaveButton() {
    const dirty = state.items.length > 0 && stateSignature() !== lastSavedSig;
    $("saveBtn").hidden = !dirty;
  }

  function renderFormula(rows, total) {
    const section = $("formulaSection");
    const body = $("formulaBody");
    if (!rows.length || total <= 0) {
      body.innerHTML = "";
      section.hidden = true;
      return;
    }
    section.hidden = false;
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
      occupiedDays: $("occupiedInput").value === "" ? "" : calc.num($("occupiedInput").value),
      items: state.items.map((it) => ({
        name: it.name,
        watts: it.watts,
        hours: it.hours,
        hoursUnit: it.hoursUnit || "h/day",
        days: it.days,
        daysMode: it.daysMode,
        split: it.split,
        segments: it.segments,
        note: it.note || "",
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
    s.occupiedDays = raw.occupiedDays == null || raw.occupiedDays === "" ? "" : calc.num(raw.occupiedDays);
    const periodDays = s.mode === "range" ? calc.daysBetween(s.startDate, s.endDate) : s.periodDays;
    s.items = (raw.items || []).map((it) => {
      const segs = Array.isArray(it.segments) ? it.segments : [];
      const split = it.split != null ? !!it.split : segs.length > 1;
      const hours =
        it.hours != null ? it.hours : segs.length === 1 ? segs[0].hours : 0;
      // days: explicit field wins; else a single span's days; else the period
      const days =
        it.days != null ? it.days : segs.length === 1 ? segs[0].days : periodDays;
      // daysMode: explicit wins; else infer from legacy linkPeriod / days match
      let daysMode = it.daysMode;
      if (!daysMode) {
        if (it.linkPeriod === true) daysMode = "all";
        else if (it.linkPeriod === false) daysMode = "custom";
        else daysMode = !split && calc.num(days) === calc.num(periodDays) ? "all" : "custom";
      }
      return {
        id: nextId++,
        name: it.name,
        watts: calc.num(it.watts),
        hours: calc.num(hours),
        hoursUnit: it.hoursUnit || "h/day",
        days: calc.num(days),
        daysMode: daysMode,
        split: split,
        segments: split ? segs.map((x) => ({ hours: calc.num(x.hours), days: calc.num(x.days) })) : [],
        note: it.note || "",
        noteOpen: !!(it.note),
      };
    });
    return s;
  }

  function populateScenarioSelect() {
    const sel = $("scenarioSelect");
    sel.innerHTML = '<option value="">' + esc(t("loadScenario")) + "</option>";
    SCENARIOS.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.key;
      opt.textContent = s.title;
      sel.appendChild(opt);
    });
  }

  function loadScenario(key) {
    const scenario = SCENARIOS.find((s) => s.key === key);
    if (!scenario) return;
    state = adoptState(scenario);
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

    const occupiedDays = calc.num(state.occupiedDays);
    // Use breakdown() so percent is available; already sorted by consumption desc.
    const bdRows = calc.breakdown(items);
    const noteMap = {};
    items.forEach((it) => { if (it.note && !noteMap[it.name]) noteMap[it.name] = it.note; });
    const pdfRows = bdRows.map((r) => ({
      name: displayName(r.name),
      note: noteMap[r.name] || "",
      watts: r.watts + " " + t("wattShort"),
      usage: calc.round(r.hours, 1) + " h",
      kwh: calc.round(r.kwh, 2),
      percent: calc.round(r.percent, 0),
    }));

    const report = {
      appName: t("appName"),
      subtitle: t("tagline"),
      title: ($("titleInput").value.trim() || t("appName")),
      generatedLabel: t("pdfGenerated"),
      generatedAt: now.toLocaleString(),
      // Period — show date range when in range mode
      periodLabel: state.mode === "range" && state.startDate && state.endDate
        ? i18n.fmt(t("pdfPeriodRange"), { start: state.startDate, end: state.endDate })
        : t("pdfPeriod"),
      periodText: periodDays + " " + t("days"),
      presentDays: occupiedDays > 0 && occupiedDays < periodDays ? occupiedDays : 0,
      presentDaysLabel: t("pdfPresentDays"),
      daysUnit: t("days"),
      cols: {
        device: t("pdfDevice"),
        watts: t("pdfWatts"),
        usage: t("pdfUsage"),
        kwh: t("pdfKwh"),
        percent: t("pdfPercent"),
      },
      rows: pdfRows,
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
      updateSaveButton();
      scheduleSave();
    });

    // period mode — re-render items so "every billing day" devices show the new days
    $("modeDaysBtn").addEventListener("click", () => setMode("days"));
    $("modeRangeBtn").addEventListener("click", () => setMode("range"));
    $("daysInput").addEventListener("input", () => {
      state.periodDays = calc.num($("daysInput").value);
      renderItems();
      updateResults();
    });
    $("startInput").addEventListener("input", () => {
      state.startDate = $("startInput").value;
      syncPeriodInputs();
      renderItems();
      updateResults();
    });
    $("endInput").addEventListener("input", () => {
      state.endDate = $("endInput").value;
      syncPeriodInputs();
      renderItems();
      updateResults();
    });
    // "days present" affects every device set to follow it
    $("occupiedInput").addEventListener("input", () => {
      const raw = $("occupiedInput").value;
      const val = raw === "" ? "" : calc.num(raw);
      const max = effectivePeriodDays();
      const errEl = $("occupiedError");
      if (val !== "" && val > max) {
        errEl.textContent = i18n.fmt(t("occupiedExceedsError"), { n: max });
        errEl.hidden = false;
        $("occupiedInput").classList.add("input-error");
        return; // don't apply invalid value
      }
      errEl.hidden = true;
      $("occupiedInput").classList.remove("input-error");
      state.occupiedDays = val;
      renderItems();
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
    $("scenarioSelect").addEventListener("change", async (e) => {
      const key = e.target.value;
      if (!key) return;
      if (state.items.length && !await confirmDialog(t("confirmReset"))) {
        e.target.value = "";
        return;
      }
      loadScenario(key);
    });
    $("clearAllBtn").addEventListener("click", async () => {
      if (!state.items.length) return;
      if (!await confirmDialog(t("confirmClearDevices"))) return;
      state.items = [];
      renderItems();
      updateResults();
    });
    $("resetBtn").addEventListener("click", async () => {
      if (state.items.length && !await confirmDialog(t("confirmReset"))) return;
      state = blankState();
      $("titleInput").value = "";
      render();
    });

    // results actions
    $("saveBtn").addEventListener("click", () => {
      const s = currentState();
      if (!s.title) s.title = t("appName");
      store.addToHistory(s);
      lastSavedSig = stateSignature(); // mark current state as saved (button hides)
      renderHistory();
      updateSaveButton();
      flashSaved();
    });
    $("pdfBtn").addEventListener("click", downloadPdf);

    // summary PDF button (delegation — button is recreated on each renderSummary)
    $("summaryWrap").addEventListener("click", (e) => {
      if (e.target.closest(".summary-pdf-btn")) downloadPdf();
    });

    // history (delegation)
    $("historyList").addEventListener("click", (e) => {
      const row = e.target.closest(".hist-row");
      if (!row) return;
      const id = row.dataset.hid;
      const entry = store.getHistory().find((x) => x.id === id);
      if (e.target.closest(".hist-load") && entry) {
        state = adoptState(entry.state);
        render();
        lastSavedSig = stateSignature(); // a freshly loaded saved entry isn't dirty
        updateSaveButton();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (e.target.closest(".hist-del")) {
        confirmDialog(t("confirmDelete")).then((ok) => {
          if (ok) { store.deleteHistory(id); renderHistory(); }
        });
      }
    });

    // mobile sticky total → scroll to result column
    const mt = $("mobileTotal");
    mt.addEventListener("click", scrollToResults);
    mt.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") scrollToResults(); });

    _bindConfirmDialog();
  }

  function scrollToResults() {
    const target = document.querySelector(".col-result");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      showToast(t("scrolledToResults"), 1800);
    }
  }

  function isoDate(d) {
    const pad = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function setMode(mode) {
    state.mode = mode;
    if (mode === "range" && !state.startDate && !state.endDate) {
      const today = new Date();
      const prior = new Date(today);
      prior.setDate(prior.getDate() - 30);
      state.endDate = isoDate(today);
      state.startDate = isoDate(prior);
    }
    syncPeriodInputs();
    renderItems();
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
    } else if (e.target.classList.contains("it-days")) {
      it.days = calc.num(e.target.value);
    } else if (e.target.classList.contains("it-note")) {
      it.note = e.target.value;
      scheduleSave();
      return; // no need to recalculate
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
    const card = e.target.closest(".item");
    if (!card) return;
    const it = findItem(card.dataset.id);
    if (!it) return;
    if (e.target.classList.contains("it-split")) {
      it.split = e.target.checked;
      if (it.split && !it.segments.length) {
        // seed first span from the simple hours + its current resolved days
        it.segments = [{ hours: it.hours, days: itemDays(it) }];
      }
      renderItems();
      updateResults();
    } else if (e.target.classList.contains("it-daysmode")) {
      it.daysMode = e.target.value;
      if (it.daysMode === "custom" && !calc.num(it.days)) {
        it.days = itemDays(it) || effectivePeriodDays();
      }
      renderItems(); // show/hide the custom days field + resolved value
      updateResults();
    } else if (e.target.classList.contains("it-hoursunit")) {
      it.hoursUnit = e.target.value;
      renderItems(); // update max/step attrs on the number input
      updateResults();
    }
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
      copy.noteOpen = false;
      copy.name = nextCopyName(it.name);
      const idx = state.items.indexOf(it);
      state.items.splice(idx + 1, 0, copy);
      renderItems();
      updateResults();
    } else if (e.target.closest(".it-note-add")) {
      it.noteOpen = true;
      renderItems();
    } else if (e.target.closest(".it-note-hide")) {
      it.noteOpen = false;
      it.note = "";
      scheduleSave();
      renderItems();
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
