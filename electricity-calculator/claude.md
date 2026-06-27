# electricity-calculator — Agent Guide

**Last Updated:** June 2026  
**Status:** Production  
**Live:** `https://encryptioner.github.io/public-websites/electricity-calculator/`

---

## Architecture

No build step. Static files served as-is. No package.json, no bundler.

```
electricity-calculator/
├── index.html                   — single HTML shell; all IDs are here
├── favicon.svg
└── assets/
    ├── css/styles.css           — all styling; CSS variables in :root
    └── js/
        ├── data.js              — CATEGORIES, DEVICES, WATT_PRESETS, SCENARIOS → window.ECData
        ├── i18n.js              — STR.en / STR.bn, t(), applyStaticI18n() → window.ECi18n
        ├── calc.js              — pure math, no DOM; breakdown(), round() → window.ECCalc
        ├── combobox.js          — accessible combobox widget → window.ECCombobox
        ├── storage.js           — localStorage save/load for history → window.ECStorage
        ├── pdf.js               — html2canvas + jsPDF report builder → window.ECPdf
        └── app.js               — all state, rendering, event wiring
```

Load order matters: scripts at bottom of `<body>` in the order above.

---

## State Model

```javascript
// Global `state` object in app.js
{
  title: "",
  mode: "days",         // "days" | "range"
  days: 30,
  startDate: "",
  endDate: "",
  occupied: "",         // days-present (optional)
  items: [ Item, ... ]
}

// Item shape
{
  id: number,
  name: string,
  watts: number,
  hours: number,        // raw user value — NOT normalized; unit stored in hoursUnit
  hoursUnit: "h/day" | "min/day" | "h/week" | "min/week",
  daysMode: "all" | "present" | "custom",
  days: number,         // only used when daysMode === "custom"
  split: boolean,       // true → custom segment array
  segments: [...],      // only when split === true
  note: string,
  noteOpen: boolean,
}
```

**Critical:** `hours` is always the value in `hoursUnit`, never pre-converted. Conversion to h/day happens only in `hoursPerDay(it)` inside `effItem()` before calc. Never store converted values.

---

## Key Functions in app.js

| Function | Purpose |
|---|---|
| `makeItem()` | Creates a new item with defaults |
| `hoursPerDay(it)` | Converts hours+unit → h/day for calc |
| `hoursUnitAttrs(unit)` | Returns `{max, step}` for the hours input |
| `effItem(it)` | Converts item to calc-ready format (calls hoursPerDay) |
| `itemDays(it)` | Resolves effective days for an item |
| `effectivePeriodDays()` | Total period days (from days or date range) |
| `effectiveOccupiedDays()` | Present days (occupied field, capped to period) |
| `renderItems()` | Full re-render of #itemsList; updates device count badge |
| `itemCardHtml(it, idx)` | Builds HTML string for one device card |
| `renderSummary()` | 5-column summary table (name, watt, usage h, kWh, % total) |
| `updateResults()` | Runs calc, updates breakdown + summary + formula |
| `render()` | Full page re-render (called on load + lang switch) |
| `populateScenarioSelect()` | Fills #scenarioSelect from SCENARIOS; called in render() |
| `loadScenario(key)` | Loads a scenario into state, calls render() |
| `adoptState(obj)` | Merges a plain object (scenario/history entry) into state |
| `currentState()` | Snapshots state for history save |
| `downloadPdf()` | Builds pdfRows with percent, calls window.ECPdf.exportPdf() |

---

## i18n Rules

- All user-visible strings live in `i18n.js` under `STR.en` and `STR.bn`.
- `t("key")` returns the string in current language.
- `applyStaticI18n()` sets `el.textContent = t(el.dataset.i18n)` — **never put child nodes inside `[data-i18n]` elements** (they get wiped).
- `[data-i18n-ph]` sets `placeholder`.
- Always add new strings to **both** language blocks. Bengali uses full words (not abbreviations) for labels.
- `render()` is called on language switch, which calls `populateScenarioSelect()` — so scenario placeholder text auto-updates.

### Hours field label keys (unit-aware)
| Unit | i18n key |
|---|---|
| h/day | `hoursLabel` |
| min/day | `hoursLabelMinDay` |
| h/week | `hoursLabelHWeek` |
| min/week | `hoursLabelMinWeek` |

---

## Rendering Pattern

`renderItems()` does a full `innerHTML` replace of `#itemsList` — no virtual DOM, no diffing. This means:
- Every state change triggers `renderItems()` + `updateResults()`.
- The hours field label updates automatically when unit changes because the card is re-rendered.
- Event delegation on `#itemsList` for all item interactions.
- Do not attach per-element event listeners inside `itemCardHtml` — they would be lost on next render.

---

## calc.js (pure, never modify)

```javascript
// window.ECCalc
calc.breakdown(items)  // → [{name, watts, hours, kwh, percent}, ...]
calc.total(items)      // → number (kWh)
calc.round(n, dp)      // → number
```

`items` passed to calc must be already-normalized (h/day), which `effItem()` handles.  
`breakdown()` already returns `percent` — use it, don't recalculate.

---

## data.js

```javascript
// window.ECData
{ CATEGORIES, DEVICES, WATT_PRESETS, SCENARIOS }

// SCENARIOS shape
[{
  key: string,         // e.g. "flat2"
  title: string,       // display name (already localized per scenario)
  periodDays: number,
  occupiedDays: number | "",
  items: [{
    name, watts, hours, hoursUnit, daysMode,
    days?,             // only for daysMode "custom"
    note?
  }]
}]
```

Currently 5 scenarios: `flat2`, `flat4`, `flatGuest`, `building`, `office`.  
`building` and `office` use `occupiedDays: ""`.  
Scenario items use real-world units (min/day for kettle, h/week for washer, etc.).

---

## pdf.js

`window.ECPdf.exportPdf(report)` — takes a fully-assembled `report` object from app.js.  
Uses html2canvas + jsPDF (loaded from CDN on demand). The report HTML is built by `buildReportHtml(r)` inside pdf.js.  
Table has 5 columns: Device | Watt | Usage | kWh | % of total.  
Note rows use `colspan="5"`.

---

## CSS Layout

- `.wrap` — max-width 1400px, centered, padding
- `.layout` — CSS grid, two columns on desktop (`col-input` + `col-result`)
- `.panel` — card with white background, rounded corners
- `.panel-head` — flex row: `.panel-head-left` (title + badge) + `.panel-actions` (buttons)
- `.device-count-badge` — teal pill next to "Your devices"
- `.item-card` — each device row; `.item-num` is serial number on left
- `.hours-wrap` — flex container: hours input + unit `<select>`
- `.it-hoursunit` — the unit selector inside hours-wrap
- `.scenario-select` — ghost-button styled `<select>` (max-width 170px)

---

## Event Wiring (bind() in app.js)

All item interactions use event delegation on `#itemsList`:
- `.it-hours` → update hours, re-render + recalc
- `.it-hoursunit` → update hoursUnit, `renderItems()` + `updateResults()` (label re-renders automatically)
- `.it-watt` → update watts
- `.it-daysmode` → update daysMode
- `.it-days` → update custom days
- `.it-note` → update note text
- `.it-del` → remove item
- `.it-split-toggle` → toggle split mode

`#scenarioSelect` change → load scenario (with confirm if items exist, reset select on cancel).  
`#clearAllBtn` click → clear items only (title + billing period kept).  
`#resetBtn` click → full state reset.

---

## Adding / Changing Features

### Add a new string
1. Add to `STR.en` in i18n.js
2. Add to `STR.bn` in i18n.js  
3. Use `t("yourKey")` in app.js or `data-i18n="yourKey"` in index.html

### Add a new scenario
1. Push to `SCENARIOS` array in data.js
2. Each item must include `hoursUnit` (default `"h/day"`)
3. No other changes needed — `populateScenarioSelect()` picks it up automatically

### Add a new hours unit
1. Add unit string to `STR.en` and `STR.bn` (e.g. `unitHBiweek`)
2. Add label key for the field (e.g. `hoursLabelHBiweek`) to both languages
3. Add conversion case to `hoursPerDay(it)` in app.js
4. Add `{max, step}` case to `hoursUnitAttrs(unit)` in app.js
5. Add `[val, t("...")]` entry to the unitOpts array in `itemCardHtml`
6. Add to `hoursFieldLabel` ternary in `itemCardHtml`

### Modify PDF layout
Edit `buildReportHtml(r)` in pdf.js. The `r` object is assembled in `downloadPdf()` in app.js — add new fields there first.

---

## What NOT To Do

- **No build system** — no npm, no bundler, no package.json
- **No frameworks** — vanilla HTML/CSS/JS only
- **Don't convert `hours` at rest** — always store raw user value; convert only in `hoursPerDay()`
- **Don't modify calc.js** — it's pure math, treat as read-only
- **Don't attach event listeners inside `itemCardHtml`** — use delegation on `#itemsList`
- **Don't put child nodes inside `[data-i18n]` elements** — `applyStaticI18n()` overwrites innerHTML
- **Don't skip Bengali strings** — every new string needs both `en` and `bn` entries

---

## Local Preview

```bash
python3 -m http.server 8080
# open http://localhost:8080/electricity-calculator/
```
