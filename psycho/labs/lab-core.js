/* lab-core.js — engine for interactive "labs" (Synthesis-Tutor-style lessons).
   A lab = a manipulable SVG stage + a tutor column that asks the learner to DO things on the stage,
   checks what they actually did, and responds. Every lab file registers itself with Lab.register({...}).
   See /home/claude/psy-build/LABS.md for the lab-authoring contract. */
(function () {
  "use strict";
  const LABS = {};
  const CSS = `
.lab{--a:#C8417B;--a-soft:#F7E3EC;--ok:#1E8E5A;--ok-soft:#DFF2E8;--warn:#B7791F;--warn-soft:#FBF0DA;
  --paper:#F2F4F7;--sheet:#FFFFFF;--ink:#18233D;--muted:#5B6478;--line:#D8DCE5;--blue:#2F6FB2;--blue-soft:#E1ECF8;
  font-family:"Assistant","Segoe UI",Arial,sans-serif;color:var(--ink)}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .lab{--a:#EE7AA9;--a-soft:#3A2233;--ok:#4CC58A;--ok-soft:#173528;--warn:#E3B04B;--warn-soft:#3A2F17;
  --paper:#111726;--sheet:#1A2236;--ink:#E7EAF2;--muted:#9AA3B8;--line:#2E3850;--blue:#7DB3EE;--blue-soft:#1C2C44}}
:root[data-theme="dark"] .lab{--a:#EE7AA9;--a-soft:#3A2233;--ok:#4CC58A;--ok-soft:#173528;--warn:#E3B04B;--warn-soft:#3A2F17;
  --paper:#111726;--sheet:#1A2236;--ink:#E7EAF2;--muted:#9AA3B8;--line:#2E3850;--blue:#7DB3EE;--blue-soft:#1C2C44}
.lab .lab-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:10px}
.lab .lab-head h2{font-family:"Frank Ruhl Libre","Times New Roman",serif;font-weight:900;font-size:1.6rem;margin:0}
.lab .chapters{display:flex;gap:6px;flex-wrap:wrap}
.lab .chapters span{font-size:.8rem;padding:3px 10px;border-radius:999px;border:1.5px solid var(--line);color:var(--muted)}
.lab .chapters span.on{border-color:var(--ink);color:var(--ink);font-weight:700}
.lab .chapters span.done{border-color:var(--a);color:var(--a)}
.lab .bench{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px;align-items:start}
@media (max-width:900px){.lab .bench{grid-template-columns:1fr}}
.lab .stage{background:var(--sheet);border:1px solid var(--line);border-radius:14px;padding:10px;min-width:0}
.lab .stage svg{display:block;width:100%;height:auto;touch-action:none;user-select:none;-webkit-user-select:none;direction:ltr}
.lab .tools{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;min-height:40px}
.lab .tool{font:inherit;font-weight:700;font-size:.95rem;border:1.5px solid var(--a);color:var(--a);background:var(--sheet);border-radius:10px;padding:7px 14px;cursor:pointer}
.lab .tool.pulse{animation:labpulse 1.4s ease-in-out infinite}
@keyframes labpulse{50%{box-shadow:0 0 0 6px var(--a-soft)}}
.lab .tutor{display:flex;flex-direction:column;gap:10px;max-height:78vh;overflow:auto;padding:2px}
@media (max-width:900px){.lab .tutor{max-height:none}.lab .tutor .msg:not(:nth-last-child(-n+3)){display:none}}
.lab .msg{background:var(--sheet);border:1px solid var(--line);border-radius:14px 14px 14px 4px;padding:12px 14px;opacity:.55;font-size:1.02rem;line-height:1.5}
.lab .msg.now{opacity:1;border-color:var(--ink)}
.lab .msg.me{align-self:flex-start;background:var(--a-soft);border-color:transparent;border-radius:14px 14px 4px 14px;opacity:.9;font-size:.95rem}
.lab .msg.good{border-color:var(--ok);background:var(--ok-soft);opacity:1}
.lab .msg.hint{border-color:var(--warn);background:var(--warn-soft);opacity:1}
.lab .msg .who{font-size:.75rem;font-weight:800;letter-spacing:.06em;color:var(--a);margin-bottom:2px}
.lab .msg p{margin:0}
.lab .ltrfix{unicode-bidi:isolate;white-space:nowrap}
.lab .msg .task{margin-top:6px;font-weight:700}
.lab .choices{display:flex;flex-direction:column;gap:6px;margin-top:10px}
.lab .choice{font:inherit;text-align:start;border:1.5px solid var(--line);background:var(--sheet);color:var(--ink);border-radius:10px;padding:8px 12px;cursor:pointer}
.lab .choice:hover{border-color:var(--ink)}
.lab .next{font:inherit;font-weight:800;border:0;border-radius:10px;padding:9px 18px;background:var(--ink);color:var(--paper);cursor:pointer;margin-top:10px}
.lab button:focus-visible{outline:3px solid var(--a);outline-offset:2px}
@media (prefers-reduced-motion:no-preference){.lab .msg.now{animation:labin .35s ease-out}@keyframes labin{from{transform:translateY(6px);opacity:0}}}
/* svg vocabulary */
.lab .ink{stroke:var(--ink);stroke-width:2;fill:none}
.lab .thin{stroke:var(--ink);stroke-width:1.2;fill:none}
.lab .mut{stroke:var(--muted);stroke-width:1.5;fill:none}
.lab .dash{stroke:var(--muted);stroke-width:1.5;fill:none;stroke-dasharray:5 4}
.lab .box{fill:var(--sheet);stroke:var(--ink);stroke-width:1.5}
.lab .bg{fill:var(--paper);stroke:var(--ink);stroke-width:2}
.lab .fa{fill:var(--a);stroke:var(--a);stroke-width:1.5}
.lab .fsoft{fill:var(--a-soft);stroke:var(--a);stroke-width:1.5}
.lab .fok{fill:var(--ok);stroke:var(--ok);stroke-width:1.5;opacity:.9}
.lab .fok-soft{fill:var(--ok-soft);stroke:var(--ok);stroke-width:1.5}
.lab .fblue{fill:var(--blue);stroke:var(--blue);stroke-width:1.5;opacity:.9}
.lab .fblue-soft{fill:var(--blue-soft);stroke:var(--blue);stroke-width:1.5}
.lab .fwarn{fill:var(--warn-soft);stroke:var(--warn);stroke-width:2;stroke-dasharray:4 3}
.lab .ghost{fill:none;stroke:var(--muted);stroke-width:1.5;stroke-dasharray:5 4}
.lab .sa{stroke:var(--a);stroke-width:3;fill:none}
.lab .sok{stroke:var(--ok);stroke-width:3;fill:none}
.lab .sblue{stroke:var(--blue);stroke-width:3;fill:none}
.lab .knob{fill:var(--sheet);stroke:var(--a);stroke-width:3;cursor:grab}
.lab .hot{cursor:pointer}
.lab .dot{fill:var(--ink)}
.lab text{font-family:"Assistant","Segoe UI",Arial,sans-serif;font-size:16px;fill:var(--ink);direction:ltr;unicode-bidi:embed}
.lab text.b{font-weight:800}
.lab text.m{fill:var(--muted);font-size:14px}
.lab text.a{fill:var(--a);font-weight:800}
.lab text.ok{fill:var(--ok);font-weight:800}
.lab text.w{fill:var(--warn);font-weight:800}
.lab text.blue{fill:var(--blue);font-weight:800}
.lab text.inv{fill:#fff;font-weight:700;font-size:14px}
.lab text.big{font-size:22px;font-weight:800}
.lab text.he{direction:rtl;unicode-bidi:embed}
@media (max-width:600px){.lab text{font-size:22px}.lab text.m{font-size:19px}.lab text.inv{font-size:19px}.lab text.big{font-size:28px}}
`;
// wrap math runs (numbers/latin + operators) inside RTL text in LTR spans so they don't display reversed
function fixMath(root){
  if(!root)return;
  const RX=/[0-9A-Za-z√(\[|−-][0-9A-Za-z.,²³√()\[\]+\-−×÷=:\/·%≈<>≤≥|'^ ]*[0-9A-Za-z)\]²³%|]/g, OP=/[×÷=+−\-:\/<>≤≥·√|^]/;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;if(!p||p.closest('[dir="ltr"],svg,script,style,textarea,input,.ltrfix'))return NodeFilter.FILTER_REJECT;return /[֐-׿]/.test(n.data)&&OP.test(n.data)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}});
  const nodes=[];while(w.nextNode())nodes.push(w.currentNode);
  for(const n of nodes){const s=n.data;let last=0,m,frag=document.createDocumentFragment(),hit=false;RX.lastIndex=0;
    while((m=RX.exec(s))){const t=m[0].trim();if(!OP.test(t)||!/[0-9A-Za-z]/.test(t)||!/\s|[×÷=+<>≤≥·:\/−-]/.test(t)){continue}
      const st=m.index+m[0].indexOf(t);frag.append(s.slice(last,st));const sp=document.createElement("span");sp.dir="ltr";sp.className="ltrfix";sp.textContent=t;frag.append(sp);last=st+t.length;hit=true}
    if(hit){frag.append(s.slice(last));n.replaceWith(frag)}}
}

  function injectCss() { if (document.getElementById("lab-core-css")) return; const s = document.createElement("style"); s.id = "lab-core-css"; s.textContent = CSS; document.head.appendChild(s); }

  // ---------- svg helpers (all return strings) ----------
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = n => { if (typeof n !== "number") return String(n); const r = Math.round(n * 100) / 100; const s = Number.isInteger(r) ? String(r) : String(r); return s.replace(/\B(?=(\d{3})+(?!\d))/g, ","); };
  const A = o => Object.entries(o || {}).filter(([, v]) => v !== undefined && v !== null && v !== false).map(([k, v]) => `${k}="${esc(v)}"`).join(" ");
  const G = {
    esc, fmt,
    // text: anchor "middle" | "start" | "end" (LTR geometry). Hebrew text: G.he(...) which right-aligns at x when anchor="right".
    t: (x, y, s, cls = "", anchor = "middle", extra = {}) => `<text ${A({ x, y, class: cls, "text-anchor": anchor, ...extra })}>${esc(s)}</text>`,
    // Hebrew text. pos: "right" = text ends at x (right-aligned), "left" = starts at x, "middle".
    he: (x, y, s, cls = "", pos = "middle", extra = {}) => `<text ${A({ x, y, class: (cls + " he").trim(), "text-anchor": pos === "right" ? "start" : pos === "left" ? "end" : "middle", ...extra })}>${esc(s)}</text>`,
    rect: (x, y, w, h, cls = "box", extra = {}) => `<rect ${A({ x, y, width: Math.max(0, w), height: Math.max(0, h), class: cls, ...extra })}/>`,
    line: (x1, y1, x2, y2, cls = "ink", extra = {}) => `<line ${A({ x1, y1, x2, y2, class: cls, ...extra })}/>`,
    circle: (cx, cy, r, cls = "box", extra = {}) => `<circle ${A({ cx, cy, r, class: cls, ...extra })}/>`,
    poly: (pts, cls = "box", extra = {}) => `<polygon ${A({ points: pts.map(p => p.join(",")).join(" "), class: cls, ...extra })}/>`,
    path: (d, cls = "ink", extra = {}) => `<path ${A({ d, class: cls, ...extra })}/>`,
    arrow: (x1, y1, x2, y2, cls = "ink") => { const a = Math.atan2(y2 - y1, x2 - x1), h = 9; return `<line ${A({ x1, y1, x2, y2, class: cls })}/><polygon class="dot" points="${x2},${y2} ${x2 - h * Math.cos(a - .45)},${y2 - h * Math.sin(a - .45)} ${x2 - h * Math.cos(a + .45)},${y2 - h * Math.sin(a + .45)}"/>`; },
    // draggable handle: anything with data-drag=key is draggable
    knob: (cx, cy, key, r = 14) => `<circle ${A({ cx, cy, r, class: "knob", "data-drag": key })}/>`,
    // tappable region: data-tap=key
    tap: (svgEl, key) => svgEl.replace(/^<(\w+)/, `<$1 data-tap="${esc(key)}"`),
    group: (inner, extra = {}) => `<g ${A(extra)}>${inner}</g>`,
    angleArc: (cx, cy, r, a1, a2, cls = "sa") => { const p = a => [cx + r * Math.cos(a), cy - r * Math.sin(a)]; const [x1, y1] = p(a1), [x2, y2] = p(a2); const large = Math.abs(a2 - a1) > Math.PI ? 1 : 0; return `<path class="${cls}" d="M${x1},${y1} A${r},${r} 0 ${large} 0 ${x2},${y2}"/>`; },
    rightMark: (x, y, ux, uy, vx, vy, s = 12) => `<path class="thin" d="M${x + ux * s},${y + uy * s} L${x + ux * s + vx * s},${y + uy * s + vy * s} L${x + vx * s},${y + vy * s}"/>`,
  };

  // ---------- engine ----------
  function mount(container, def, opts = {}) {
    injectCss();
    container.innerHTML = `<div class="lab" dir="rtl" lang="he">
      <div class="lab-head"><h2>${esc(def.title)}</h2><div class="chapters"></div></div>
      <div class="bench"><div><div class="stage"><svg viewBox="${def.viewBox || "0 0 620 360"}" role="img" aria-label="${esc(def.title)}"><defs>
        <pattern id="lab-half" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="var(--sheet)"/><rect width="4" height="8" fill="var(--a)"/></pattern></defs><g class="scene"></g></svg></div>
        <div class="tools"></div></div><div class="tutor" aria-live="polite"></div></div></div>`;
    const root = container.firstElementChild, svg = root.querySelector("svg"), sceneG = root.querySelector(".scene"),
      tutor = root.querySelector(".tutor"), tools = root.querySelector(".tools"), chap = root.querySelector(".chapters");
    const L = { state: {}, memo: {}, svg, def, G, i: 0, cur: null, solved: false, dragging: null };
    L.render = () => { sceneG.innerHTML = def.draw(L); };
    L.say = (html, cls = "") => { const d = document.createElement("div"); d.className = "msg " + cls; d.innerHTML = html; fixMath(d); tutor.querySelectorAll(".msg.now").forEach(m => m.classList.remove("now")); tutor.appendChild(d); try { d.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) { } return d; };
    L.me = text => L.say(`<p>${text}</p>`, "me");
    L.setTools = list => { tools.innerHTML = ""; for (const [label, fn, pulse] of (list || [])) { const b = document.createElement("button"); b.className = "tool" + (pulse ? " pulse" : ""); b.textContent = label; b.onclick = () => { fn(L); L.render(); }; tools.appendChild(b); } };
    const val = (v) => typeof v === "function" ? v(L) : v;
    function chapters() { chap.innerHTML = (def.chapters || []).map((c, i) => `<span class="${i === L.cur.ch ? "on" : i < L.cur.ch ? "done" : ""}">${i + 1}. ${esc(c)}</span>`).join(""); }
    L.go = function (i) {
      if (i >= def.steps.length) { if (opts.onDone) opts.onDone(L); return; }
      L.i = i; L.cur = def.steps[i]; L.solved = false; chapters();
      if (L.cur.setup) L.cur.setup(L);
      L.render(); L.setTools(L.cur.tools ? L.cur.tools(L) : []);
      const task = val(L.cur.task);
      const d = L.say(`<div class="who">מורה</div><p>${val(L.cur.say) || ""}</p>${task ? `<p class="task">${task}</p>` : ""}`, "now");
      if (L.cur.choices) {
        const box = document.createElement("div"); box.className = "choices";
        val(L.cur.choices).forEach((c, j) => { const b = document.createElement("button"); b.className = "choice"; b.innerHTML = c; b.onclick = () => { box.querySelectorAll("button").forEach(x => x.disabled = true); L.me(c); L.act({ type: "choice", j }); }; box.appendChild(b); });
        d.appendChild(box);
      }
      if (L.cur.next) { const b = document.createElement("button"); b.className = "next"; b.textContent = val(L.cur.next); b.onclick = () => { b.remove(); L.go(i + 1); }; d.appendChild(b); }
    };
    L.act = function (e) {
      if (!L.cur || L.solved || !L.cur.check) return;
      const r = L.cur.check(L, e);
      if (r === true) {
        L.solved = true;
        const d = L.say(`<div class="who">מורה</div><p>${val(L.cur.ok) || "נכון."}</p>`, "good");
        const last = L.i === def.steps.length - 1;
        const b = document.createElement("button"); b.className = "next"; b.textContent = last ? "סיום המעבדה" : "המשך"; b.onclick = () => { b.remove(); L.go(L.i + 1); }; d.appendChild(b);
      } else if (typeof r === "string") {
        const lastMsg = tutor.lastElementChild; if (lastMsg && lastMsg.classList.contains("hint") && lastMsg.dataset.h === r) return;
        const d = L.say(`<p>${r}</p>`, "hint"); d.dataset.h = r;
        if (L.cur.demo && !L.cur.choices) { const b = document.createElement("button"); b.className = "tool"; b.style.marginTop = "8px"; b.textContent = "הראה לי"; b.onclick = () => { b.remove(); L.cur.demo(L); L.render(); }; d.appendChild(b); }
        if (e.type === "choice") setTimeout(() => tutor.querySelectorAll(".msg.now .choice, .choices .choice").forEach(x => x.disabled = false), 30);
      }
    };
    // pointer plumbing
    L.toSvg = ev => { const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const m = svg.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 }; };
    svg.addEventListener("pointerdown", ev => {
      const pt = L.toSvg(ev);
      let el = ev.target.closest("[data-drag]"), key = el && el.dataset.drag;
      if (!key && def.dragFrom) key = def.dragFrom(L, pt);          // optional: start a drag from anywhere (e.g. a whole bar)
      if (key && def.drag) { L.dragging = key; try { svg.setPointerCapture(ev.pointerId); } catch (e) { } def.drag(L, key, pt, "start"); L.render(); ev.preventDefault(); return; }
      const t = ev.target.closest("[data-tap]");
      if (t && def.tap) { const res = def.tap(L, t.dataset.tap, pt); L.render(); if (res !== false) L.act({ type: "tap", key: t.dataset.tap }); }
    });
    svg.addEventListener("pointermove", ev => { if (L.dragging) { def.drag(L, L.dragging, L.toSvg(ev), "move"); L.render(); L.act({ type: "move", key: L.dragging }); } });
    const end = ev => { if (L.dragging) { const k = L.dragging; L.dragging = null; def.drag(L, k, L.toSvg(ev), "end"); L.render(); L.act({ type: "drop", key: k }); } };
    svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", () => { L.dragging = null; });
    if (def.init) def.init(L);
    window.__lab = L;           // for automated tests
    L.go(0);
    return L;
  }
  window.Lab = { register: d => { LABS[d.id] = d; }, get: id => LABS[id], all: () => LABS, mount, G, fixMath };
})();
