import{loadScript as g}from"./format-tools.js";const $="https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js",v="https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js",k="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&display=swap",S=t=>/[ঀ-৿]/.test(t),c=t=>String(t).replace(/[&<>"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[e]);function B(t){const e=t.split(`
`,1)[0],h=[",",";","	"].sort((r,o)=>e.split(o).length-e.split(r).length)[0],s=[];let n=[],a="",d=!1;for(let r=0;r<t.length;r++){const o=t[r];d?o==='"'?t[r+1]==='"'?(a+='"',r++):d=!1:a+=o:o==='"'?d=!0:o===h?(n.push(a),a=""):o===`
`||o==="\r"?(o==="\r"&&t[r+1]===`
`&&r++,n.push(a),s.push(n),n=[],a=""):a+=o}return(a||n.length)&&(n.push(a),s.push(n)),s.filter(r=>r.some(o=>o.trim()))}function j(t){const[e,...h]=B(t);if(!e)return{html:"",cols:0,extra:[]};const s=i=>i.reduce((l,p,y)=>p.trim()?y+1:l,0),n=h.map((i,l)=>s(i)>e.length?l+2:0).filter(Boolean),a=e.length+(n.length?1:0),d=i=>{const l=i.slice(0,e.length);for(;l.length<e.length;)l.push("");return n.length?[...l,i.slice(e.length).filter(p=>p.trim()).join(" , ")]:l},r=(i,l)=>`      <${l}>${c(i)}</${l}>`,o=(i,l)=>`    <tr>
${i.map(p=>r(p,l)).join(`
`)}
    </tr>`,u=i=>a>2&&i[0].trim()&&i.slice(1).every(l=>!l.trim()),x=i=>u(i)?`    <tr class="section">
      <td colspan="${a}">${c(i[0])}</td>
    </tr>`:o(d(i),"td"),w=n.length?[...e,"(extra cells)"]:e;return{html:`<table>
  <thead>
${o(w,"th")}
  </thead>
  <tbody>
${h.map(x).join(`
`)}
  </tbody>
</table>`,cols:a,extra:n}}const f=({landscape:t=!1}={})=>`@page {
  size: A4${t?" landscape":""};
  margin: ${t?"12mm 10mm 16mm":"16mm 14mm 18mm"};
  @top-left { content: ""; } @top-center { content: ""; } @top-right { content: ""; }
  @bottom-left { content: ""; } @bottom-right { content: ""; }
  @bottom-center { content: counter(page) " / " counter(pages); font: 10px system-ui, sans-serif; color: #667; }
}`,b=f(),N=`:root { color-scheme: light; }
html { background: #eceff4; }
body {
  font: 16px/1.65 system-ui, -apple-system, "Segoe UI", "Kohinoor Bangla", "Bangla Sangam MN", "Noto Sans Bengali", "Noto Sans Bangla", "Lohit Bengali", "Hind Siliguri", "Kalpurush", "Siyam Rupali", "Nirmala UI", Roboto, Arial, sans-serif;
  color: #1f2430; background: #fff;
  max-width: 900px; margin: 24px auto; padding: 36px 44px 56px;
  border-radius: 6px; box-shadow: 0 1px 6px rgba(20, 30, 50, .12);
  overflow-wrap: anywhere;
}
@media (max-width: 700px) { body { margin: 0; padding: 20px 16px 40px; border-radius: 0; box-shadow: none; } }
h1, h2, h3, h4 { line-height: 1.3; margin: 1.4em 0 .5em; }
h1 { font-size: 2em; border-bottom: 1px solid #e3e6ec; padding-bottom: .25em; }
h2 { font-size: 1.5em; border-bottom: 1px solid #eef0f4; padding-bottom: .2em; }
code, pre { font: 13.5px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
code { background: #f1f3f7; padding: .15em .35em; border-radius: 4px; }
pre { background: #f6f8fa; padding: 14px; border-radius: 8px; overflow: auto; white-space: pre-wrap; }
pre code { background: none; padding: 0; }
blockquote { margin: 1em 0; padding: .1em 1em; border-left: 4px solid #c9d1e0; color: #566; }
table { border-collapse: collapse; margin: 1em 0; max-width: 100%; }
th, td { border: 1px solid #d5dae3; padding: 6px 12px; text-align: left; }
th { background: #f3f5f9; font-weight: 600; }
td, th { vertical-align: top; }
tr.section td { background: #e8eef9; font-weight: 600; }
body.wide { max-width: none; margin: 16px; padding: 24px 28px 40px; }
body.wide table { width: 100%; font-size: 14px; line-height: 1.45; }
body.wide td, body.wide th { overflow-wrap: break-word; word-break: normal; }
body.wide td:first-child, body.wide th:first-child { white-space: nowrap; }
tbody tr:nth-child(even) td { background: #fafbfd; }
img, svg { max-width: 100%; height: auto; }
a { color: #1a6fe0; }
hr { border: 0; border-top: 1px solid #e3e6ec; }
@media print {
  html { background: #fff; }
  body { margin: 0; padding: 0; max-width: none; border-radius: 0; box-shadow: none; }
  pre, blockquote, img { break-inside: avoid; }
  tr { break-inside: avoid; }
  thead { display: table-header-group; }
  body.wide { margin: 0; padding: 0; }
  body.wide table { font-size: 9.5px; line-height: 1.35; }
  body.wide td, body.wide th { padding: 3px 5px; }
  h1, h2, h3 { break-after: avoid; }
}`,P=t=>{const e=/^#{1,3}\s+(.+?)\s*#*\s*$/m.exec(t)||/<title[^>]*>([^<]+)<\/title>/i.exec(t)||/<h1[^>]*>([^<]+)<\/h1>/i.exec(t);return c(e?e[1].trim().slice(0,80):"Preview")},m=(t,e,h="Preview",{landscape:s=!1,wide:n=!1}={})=>`<!doctype html>
<html${e?' lang="bn"':""}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${h}</title>${e?`
<link rel="stylesheet" href="${k}">`:""}
<style>
${N}

${f({landscape:s})}
</style>
</head>
<body${n?' class="wide"':""}>
${t}
</body>
</html>
`,C=t=>/<\/head>/i.test(t)?t.replace(/<\/head>/i,`<style>
${b}
</style>
</head>`):`<style>
${b}
</style>
`+t;async function z(t,e,{title:h}={}){const s=S(e),n=h?c(h):P(e);if(!e.trim())return{doc:m("",!1),html:""};if(t==="html")return{doc:/<html[\s>]/i.test(e)?C(e):m(e,s,n),html:e};if(t==="csv"){const{html:d,cols:r,extra:o}=j(e);return{doc:m(d,s,n,{landscape:r>=5,wide:!0}),html:d,note:o.length?`\u26A0 ${o.length} row(s) have more cells than the header (records ${o.slice(0,6).join(", ")}${o.length>6?"\u2026":""}) \u2014 probably an unquoted comma. Extra cells are shown in the last column.`:""}}if(t==="xml"){const d=/<svg[\s>]/i.test(e)?e:`<pre>${c(e)}</pre>`;return{doc:m(d,s,n),html:d}}await Promise.all([g($),g(v)]);const a=globalThis.DOMPurify.sanitize(globalThis.marked.parse(e,{gfm:!0}));return{doc:m(a,s,n),html:a}}export{b as PRINT_CSS,z as buildPreview,j as csvTable,c as esc,S as hasBangla,B as parseCsv,f as printCss};
