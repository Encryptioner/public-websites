/**
 * pdf.js — build and download a printable report.
 *
 * We load html2canvas + jsPDF directly (not the html2pdf wrapper, whose window
 * simulation clipped tall/wide reports) and do the capture + pagination
 * ourselves. The report is rendered as a standalone white document in a brief
 * full-screen overlay so html2canvas can measure it on-screen.
 *
 * app.js passes already-localized strings in `report`.
 */
(function () {
  "use strict";

  const LIBS = [
    "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  ];
  let loading = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Could not load PDF library (needs internet)."));
      document.head.appendChild(s);
    });
  }
  function loadLibs() {
    if (window.html2canvas && window.jspdf) return Promise.resolve();
    if (loading) return loading;
    loading = Promise.all(LIBS.map(loadScript)).catch((e) => {
      loading = null;
      throw e;
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
          '<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb">' + esc(row.name) + "</td>" +
          '<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right">' + esc(row.watts) + "</td>" +
          '<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right">' + esc(row.usage) + "</td>" +
          '<td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">' + esc(row.kwh) + "</td>" +
          "</tr>"
      )
      .join("");

    return (
      '<div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;background:#fff;padding:28px 30px;width:760px;box-sizing:border-box">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #10b981;padding-bottom:14px;margin-bottom:18px">' +
      "<div>" +
      '<div style="font-size:22px;font-weight:800;color:#0f766e">⚡ ' + esc(r.appName) + "</div>" +
      '<div style="font-size:13px;color:#475569;margin-top:2px">' + esc(r.subtitle) + "</div>" +
      "</div>" +
      '<div style="text-align:right;font-size:12px;color:#64748b">' + esc(r.generatedLabel) + "<br><b>" + esc(r.generatedAt) + "</b></div>" +
      "</div>" +
      '<h1 style="font-size:18px;margin:0 0 4px">' + esc(r.title) + "</h1>" +
      '<div style="font-size:13px;color:#475569;margin-bottom:16px">' + esc(r.periodLabel) + ": <b>" + esc(r.periodText) + "</b></div>" +
      '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
      '<thead><tr style="background:#f0fdfa">' +
      '<th style="padding:8px 10px;text-align:left;border-bottom:2px solid #99f6e4">' + esc(r.cols.device) + "</th>" +
      '<th style="padding:8px 10px;text-align:right;border-bottom:2px solid #99f6e4">' + esc(r.cols.watts) + "</th>" +
      '<th style="padding:8px 10px;text-align:right;border-bottom:2px solid #99f6e4">' + esc(r.cols.usage) + "</th>" +
      '<th style="padding:8px 10px;text-align:right;border-bottom:2px solid #99f6e4">' + esc(r.cols.kwh) + "</th>" +
      "</tr></thead><tbody>" + rows + "</tbody></table>" +
      '<div style="margin-top:18px;display:flex;justify-content:flex-end">' +
      '<div style="background:#0f766e;color:#fff;padding:12px 18px;border-radius:10px;text-align:right">' +
      '<div style="font-size:12px;opacity:.85">' + esc(r.totalLabel) + "</div>" +
      '<div style="font-size:24px;font-weight:800">' + esc(r.totalKwh) + ' <span style="font-size:13px;font-weight:500">' + esc(r.unit) + "</span></div>" +
      "</div></div>" +
      '<div style="margin-top:24px;font-size:11px;color:#94a3b8;border-top:1px solid #e5e7eb;padding-top:8px">' + esc(r.footer) + "</div>" +
      "</div>"
    );
  }

  async function exportPdf(report) {
    await loadLibs();

    // Render the report on-screen (html2canvas needs a laid-out element) inside
    // a fixed white overlay so the page underneath isn't visible during capture.
    const holder = document.createElement("div");
    holder.style.cssText =
      "position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483647;background:#fff;overflow:auto;";
    holder.innerHTML = buildReportHtml(report);
    const target = holder.firstChild;
    document.body.appendChild(holder);

    try {
      const canvas = await window.html2canvas(target, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: target.scrollWidth,
        windowHeight: target.scrollHeight,
      });

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height * imgW) / canvas.width; // full image height in mm
      const img = canvas.toDataURL("image/jpeg", 0.95);

      const pageContentH = pageH - margin * 2;
      let heightLeft = imgH;
      let position = margin;
      pdf.addImage(img, "JPEG", margin, position, imgW, imgH);
      heightLeft -= pageContentH;
      // Add more pages, shifting the same tall image up by one page each time.
      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - (imgH - heightLeft);
        pdf.addImage(img, "JPEG", margin, position, imgW, imgH);
        heightLeft -= pageContentH;
      }

      pdf.save(sanitizeFilename(report.title) + "_" + report.fileStamp + ".pdf");
    } finally {
      document.body.removeChild(holder);
    }
  }

  window.ECPdf = { exportPdf };
})();
