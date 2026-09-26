const M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],n="#16283b",L="#c9d2cf",T="#e8a13d",W="#c4453b",_="#2e9e6b",E="#cf8a25",R="#4c5f6e",H=["reeling in","hauling up","hooking","netting","landing"],P=316,J=524,X=64,Q=238,U=212,h="\xA0\xB7\xA0";let l=null,O=null,$=null,g=null,A=0,f=0,a=0,u=null,x=null;const K=e=>`${M[e.month-1]} ${String(e.year).slice(2)}`,N=e=>`${M[e.month-1]} ${e.year}`,C=e=>Math.abs(Math.sin(e*2.399+.7));function j(){return`<svg class="scene" viewBox="0 0 560 240" role="img" aria-label="a stick figure fishing bills off DPDC's line while the months load">
    <!-- pond -->
    <line x1="30" y1="216" x2="530" y2="216" stroke="${L}" stroke-dasharray="3 7" opacity=".8"/>
    <!-- angler -->
    <line x1="44" y1="200" x2="190" y2="200" stroke="${n}" stroke-width="2"/>
    <g class="ld-man" fill="none" stroke="${n}" stroke-width="2.4" stroke-linecap="round">
      <circle cx="110" cy="92" r="9" fill="#fff"/>
      <line x1="110" y1="101" x2="110" y2="148"/>
      <line x1="110" y1="148" x2="92" y2="196"/>
      <line x1="110" y1="148" x2="128" y2="196"/>
      <line x1="110" y1="116" x2="144" y2="102"/>
      <line x1="110" y1="122" x2="136" y2="130"/>
    </g>
    <!-- rod + line + hook: bob is the inner loop, tug (per catch) the wrapper
         so the two transforms stack instead of fighting over one element -->
    <g class="ld-rodwrap"><g class="ld-rod">
      <path d="M144,102 Q190,72 216,50" fill="none" stroke="${n}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="150" cy="104" r="3.5" fill="${T}" stroke="${n}" stroke-width="1.5"/>
      <line x1="216" y1="50" x2="238" y2="212" stroke="${n}" stroke-width="1"/>
      <path class="ld-hook" d="M238,212 q0,10 7,10 q6,0 6,-6" fill="none" stroke="${n}" stroke-width="1.6" stroke-linecap="round"/>
    </g></g>
    <ellipse class="ld-ripple" cx="240" cy="216" rx="11" ry="2.5" fill="none" stroke="${n}" stroke-width="1" opacity="0"/>
    <!-- stringer: the catch accumulates here, one slot per walked month -->
    <line x1="300" y1="56" x2="300" y2="72" stroke="${n}" stroke-width="2"/>
    <line x1="540" y1="56" x2="540" y2="72" stroke="${n}" stroke-width="2"/>
    <line x1="300" y1="64" x2="540" y2="64" stroke="${n}" stroke-width="1.5"/>
    <g class="ld-stringer"></g>
  </svg>`}function z(e){const m=660/e.length,y=e.map((d,r)=>44+m*(r+.5)),F=Math.min(m*.72,72),w=Math.min(m*.32,30),q=[0,1/3,2/3,1].map(d=>`<line x1="44" y1="${(176-d*162).toFixed(1)}" x2="704" y2="${(176-d*162).toFixed(1)}" stroke="#e3e9e7"/>`).join(""),B=e.map((d,r)=>{const S=162*(.45+.4*C(r*2+1)),v=162*(.3+.45*C(r));return`<g class="ld-ghost-bar" style="animation-delay:${(-r*.13).toFixed(2)}s">
      <rect x="${(y[r]-F/2).toFixed(1)}" y="${(176-S).toFixed(1)}" width="${F.toFixed(1)}" height="${S.toFixed(1)}" rx="2" fill="${E}" fill-opacity=".16"/>
      <rect x="${(y[r]-w/2).toFixed(1)}" y="${(176-v).toFixed(1)}" width="${w.toFixed(1)}" height="${v.toFixed(1)}" rx="2" fill="${_}" fill-opacity=".22"/>
    </g>`}).join(""),D=e.length<=30?e.map((d,r)=>r%Math.ceil(e.length/18)===0?`<text x="${y[r].toFixed(1)}" y="184" text-anchor="end" font-size="9.5" fill="${R}" opacity=".7" transform="rotate(-90 ${y[r].toFixed(1)} 184)">${K(d)}</text>`:"").join(""):"";return`<svg viewBox="0 0 720 230" role="img" aria-label="preview of the combined units-and-taka chart, one ghost bar per requested month">
    ${q}${B}${D}
    <line x1="44" y1="176" x2="704" y2="176" stroke="${L}"/>
  </svg>`}function I(e,t){const o=a>1?208/(a-1):0,s=316+o*e,b=`--dx:${(238-s).toFixed(1)}px;--dy:148px`;if(t==="ok"){const c=Math.min(Math.max(o*.72,3),24),k=c*1.35;return`<g class="ld-catch" style="${b}">
      <circle cx="${s.toFixed(1)}" cy="64" r="2" fill="${n}"/>
      <rect x="${(s-c/2).toFixed(1)}" y="66" width="${c.toFixed(1)}" height="${k.toFixed(1)}" rx="2" fill="#fff" stroke="${n}" stroke-width="1.2"/>
      ${c>=10?`<text x="${s.toFixed(1)}" y="${(66+k*.62).toFixed(1)}" text-anchor="middle" font-size="${(c*.55).toFixed(1)}" fill="${T}" font-weight="600">\u09F3</text>`:""}
    </g>`}const p=t==="fetch_error"?W:n,i=Math.min(Math.max(o*.7,3),20);return`<g class="ld-catch" style="${b}" stroke="${p}" stroke-width="1.3" stroke-linecap="round" opacity="${t==="fetch_error"?1:.5}">
    <circle cx="${s.toFixed(1)}" cy="64" r="2" fill="${p}" stroke="none"/>
    <g transform="translate(${s.toFixed(1)} 72)">
      <line x1="${(-i/2).toFixed(1)}" y1="0" x2="${(i/2-2).toFixed(1)}" y2="0"/>
      <line x1="${(-i/2).toFixed(1)}" y1="0" x2="${(i/2).toFixed(1)}" y2="-5"/>
      <line x1="${(-i/2).toFixed(1)}" y1="0" x2="${(i/2).toFixed(1)}" y2="5"/>
      <line x1="${(-i/6).toFixed(1)}" y1="0" x2="${(i/3).toFixed(1)}" y2="-5"/>
      <line x1="${(-i/6).toFixed(1)}" y1="0" x2="${(i/3).toFixed(1)}" y2="5"/>
      <path d="M${(i/2-2).toFixed(1)},0 l5,-4 v8 z" fill="${p}" stroke="none"/>
    </g>
  </g>`}function Y(e,t,o){a=t.length,A=0,f=0,u=null,l=document.createElement("div"),l.className="loader",l.innerHTML=j()+`<p class="progress ld-status" aria-hidden="true">${o}</p><figure class="chart">
      <h3>What the wait buys you \u2014 every month, twice</h3>
      <div class="chart-scroll">${z(t)}</div>
      <figcaption>A ghost of the combined chart \u2014 green units in front, pale taka behind,
      your real months on the axis. And each paper on the stringer above is a real
      catch: the full original DPDC bill PDF for that month, kept for you \u2014 download
      one by one from the table, or all of them as a single zip. The living chart,
      numbers on every bar, appears the moment the catch is in.</figcaption>
    </figure>`,e.replaceChildren(l),O=l.querySelector(".ld-stringer"),$=l.querySelector(".ld-status"),g=l.querySelector(".ld-rodwrap")}function V(e,t,o=!1){!o&&x&&x!=="idle"||(x="idle",Y(e,t,"the pond is calm \u2014 press Fetch bills to cast"))}function G(e,t){x="walk",e.hidden=!1,Y(e,t,`casting the line \u2014 ${t.length} month${t.length===1?"":"s"} to fish\u2026`)}function Z(e,t){if(!(!l||!l.isConnected)){if(e.stopped){u=e.label,$.textContent=`the pond went quiet \u2014 stopped early at ${e.label}`;return}O.insertAdjacentHTML("beforeend",I(A++,e.status)),e.status==="ok"&&f++,g.classList.remove("ld-tug"),g.getBoundingClientRect(),g.classList.add("ld-tug"),$.textContent=`${H[(t-1)%H.length]} ${N(e)}\u2026 ${t}/${a} months${h}${f} bill${f===1?"":"s"}`}}function ee(e,t,o=0){if(!l||!l.isConnected)return;x="done",l.classList.add("done"),$.classList.toggle("fail",o>0);const s=`${e} bill${e===1?"":"s"} on the line`;$.textContent=u?`the pond went quiet \u2014 stopped early at ${u}${h}${s}${o?`, ${o} got away (retry below)`:""}`:o===a?`the line came back empty \u2014 nothing landed, all ${a} month${a===1?"":"s"} failed (retry below)`:o?`${s}${h}${t-o}/${a} months clean${h}${o} got away (retry below)`:`\u2713 the catch is in \u2014 ${s}${h}${t}/${a} months`}export{ee as loaderDone,Z as loaderTick,V as renderIdle,G as renderLoader};
