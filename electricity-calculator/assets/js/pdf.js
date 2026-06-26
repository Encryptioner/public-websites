/**
 * pdf.js — build and download a printable report.
 *
 * html2pdf is loaded lazily from a CDN the first time the user exports, so the
 * rest of the app stays fully offline. The report is rendered as a standalone
 * white document (independent of the app's theme) for clean printing.
 *
 * app.js passes already-localized strings in `report` — this module only lays
 * them out and triggers the download.
 */
(function () {
  "use strict";

  const CDN =
    "https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js";
  let loading = null;

  function loadLib() {
    if (window.html2pdf) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = CDN;
      s.onload = () => resolve();
      s.onerror = () => {
        loading = null;
        reject(new Error("Could not load PDF library (needs internet)."));
      };
      document.head.appendChild(s);
    });
    return loading;
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

  function sanitizeFilename(name) {
    return (
      String(name || "electricity-report")
        .replace(/[\\/:*?"<>|]+/g, " ")
        .replace(/\s+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "electricity-report"
    );
  }

  function buildReportHtml(r) {
    const rows = r.rows
      .map(
        (row) =>
          "<tr>" +
          '<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb">' +
          esc(row.name) +
          "</td>" +
          '<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right">' +
          esc(row.watts) +
          "</td>" +
          '<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right">' +
          esc(row.usage) +
          "</td>" +
          '<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">' +
          esc(row.kwh) +
          "</td>" +
          "</tr>"
      )
      .join("");

    return (
      '<div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;background:#fff;padding:28px 30px;width:720px;box-sizing:border-box">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #10b981;padding-bottom:14px;margin-bottom:18px">' +
      "<div>" +
      '<div style="font-size:22px;font-weight:800;color:#0f766e">⚡ ' +
      esc(r.appName) +
      "</div>" +
      '<div style="font-size:13px;color:#475569;margin-top:2px">' +
      esc(r.subtitle) +
      "</div>" +
      "</div>" +
      '<div style="text-align:right;font-size:12px;color:#64748b">' +
      esc(r.generatedLabel) +
      "<br><b>" +
      esc(r.generatedAt) +
      "</b></div>" +
      "</div>" +
      '<h1 style="font-size:18px;margin:0 0 4px">' +
      esc(r.title) +
      "</h1>" +
      '<div style="font-size:13px;color:#475569;margin-bottom:16px">' +
      esc(r.periodLabel) +
      ": <b>" +
      esc(r.periodText) +
      "</b></div>" +
      '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
      '<thead><tr style="background:#f0fdfa">' +
      '<th style="padding:8px 10px;text-align:left;border-bottom:2px solid #99f6e4">' +
      esc(r.cols.device) +
      "</th>" +
      '<th style="padding:8px 10px;text-align:right;border-bottom:2px solid #99f6e4">' +
      esc(r.cols.watts) +
      "</th>" +
      '<th style="padding:8px 10px;text-align:right;border-bottom:2px solid #99f6e4">' +
      esc(r.cols.usage) +
      "</th>" +
      '<th style="padding:8px 10px;text-align:right;border-bottom:2px solid #99f6e4">' +
      esc(r.cols.kwh) +
      "</th>" +
      "</tr></thead><tbody>" +
      rows +
      "</tbody></table>" +
      '<div style="margin-top:18px;display:flex;justify-content:flex-end">' +
      '<div style="background:#0f766e;color:#fff;padding:12px 18px;border-radius:10px;text-align:right">' +
      '<div style="font-size:12px;opacity:.85">' +
      esc(r.totalLabel) +
      "</div>" +
      '<div style="font-size:24px;font-weight:800">' +
      esc(r.totalKwh) +
      ' <span style="font-size:13px;font-weight:500">' +
      esc(r.unit) +
      "</span></div>" +
      "</div></div>" +
      '<div style="margin-top:24px;font-size:11px;color:#94a3b8;border-top:1px solid #e5e7eb;padding-top:8px">' +
      esc(r.footer) +
      "</div>" +
      "</div>"
    );
  }

  async function exportPdf(report) {
    await loadLib();
    const holder = document.createElement("div");
    holder.style.position = "fixed";
    holder.style.left = "-9999px";
    holder.style.top = "0";
    holder.innerHTML = buildReportHtml(report);
    document.body.appendChild(holder);

    const filename =
      sanitizeFilename(report.title) + "_" + report.fileStamp + ".pdf";

    try {
      await window
        .html2pdf()
        .set({
          margin: 10,
          filename: filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(holder.firstChild)
        .save();
    } finally {
      document.body.removeChild(holder);
    }
  }

  window.ECPdf = { exportPdf };
})();
