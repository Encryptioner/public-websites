/**
 * calc.js — pure electricity math. No DOM, no i18n (so it's easy to reason about).
 *
 * Model: each device has watts + a list of usage segments { hours, days }.
 *   device device-hours = Σ (segment.hours × segment.days)
 *   device kWh          = watts × device-hours ÷ 1000
 * A simple device just has one segment using the global period days.
 */
(function () {
  "use strict";

  function num(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback || 0;
  }

  // Total device-hours across all segments (hours/day × days, summed).
  function deviceHours(item) {
    if (!item.segments || !item.segments.length) return 0;
    return item.segments.reduce(
      (sum, s) => sum + num(s.hours) * num(s.days),
      0
    );
  }

  function deviceKwh(item) {
    return (num(item.watts) * deviceHours(item)) / 1000;
  }

  function totalKwh(items) {
    return items.reduce((sum, it) => sum + deviceKwh(it), 0);
  }

  // Sorted breakdown (highest consumer first) with share-of-total percent.
  function breakdown(items) {
    const total = totalKwh(items);
    return items
      .map((it) => {
        const kwh = deviceKwh(it);
        return {
          name: it.name,
          watts: num(it.watts),
          hours: deviceHours(it),
          segments: it.segments || [],
          kwh,
          percent: total > 0 ? (kwh / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.kwh - a.kwh);
  }

  // Round to a sensible number of decimals for display.
  function round(n, dp) {
    const f = Math.pow(10, dp == null ? 2 : dp);
    return Math.round((n + Number.EPSILON) * f) / f;
  }

  // Whole days between two YYYY-MM-DD dates, inclusive of both ends.
  function daysBetween(startStr, endStr) {
    if (!startStr || !endStr) return 0;
    const a = new Date(startStr + "T00:00:00");
    const b = new Date(endStr + "T00:00:00");
    if (isNaN(a) || isNaN(b)) return 0;
    const diff = Math.round((b - a) / 86400000) + 1;
    return diff > 0 ? diff : 0;
  }

  window.ECCalc = {
    num,
    deviceHours,
    deviceKwh,
    totalKwh,
    breakdown,
    round,
    daysBetween,
  };
})();
