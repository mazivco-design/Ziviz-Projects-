/* board-core.js — shared base for "solve on the drawing" boards.
   A board is a small free tool shown above a question's answer options, loaded with that question's own numbers.
   Every board file registers  Boards[type] = { mount(host, state, cfg), compare(host, cfg, chosen, correct) }.
   Requires lab-core.js (CSS classes + G helpers). See /home/claude/psy-build/BOARDS.md. */
(function () {
  "use strict";
  const NS = window.Boards = window.Boards || {};
  const { G } = Lab;
  Lab.css();
  if (!document.getElementById("board-css")) {
    const s = document.createElement("style"); s.id = "board-css";
    s.textContent = `.lab.board{margin:0 0 14px}.lab.board .btip{margin:0 0 8px;font-size:.95rem;color:var(--muted)}
.lab.board .bmsg{margin:8px 0 0;padding:8px 12px;border-radius:10px;background:var(--ok-soft);border:1px solid var(--ok);font-size:.98rem}
.lab.board .tools{min-height:0}.lab.board .tool{padding:6px 12px;font-size:.9rem}
.lab.board .tool.act{background:var(--a);color:#fff}
.lab.cmp{margin-top:12px}.lab.cmp .stage{border-style:dashed}.lab.cmp .cnote{margin:8px 0 0;font-size:.98rem}
.lab.cmp h4{margin:0 0 6px;font-size:1rem}`;
    document.head.appendChild(s);
  }
  const esc = G.esc;
  const kit = NS.kit = {
    G,
    // keep a formula left-to-right inside a Hebrew label (works in SVG text and HTML)
    ltr: t => "⁦" + t + "⁩",
    // number formatting: thousands separators, 2 decimals max, thirds as ⅓ ⅔
    pf: x => { const r = Math.round(x * 3); if (Math.abs(x * 3 - r) < 1e-6 && r % 3) { const w = Math.trunc(r / 3), f = Math.abs(r % 3) === 1 ? "⅓" : "⅔"; return (r < 0 && !w ? "−" : "") + (w || "") + f; } return G.fmt(Math.round(x * 100) / 100); },

    /* Mount the board frame once and get a ui handle.
       opts: { tip, viewW=640, aria, defs (extra <defs> markup),
               onTap(key, pt), onOp(op, buttonEl), onDrag(key, pt, phase), dragFrom(pt) -> key|null }
       ui.set({ height, svg, tools, msg }) redraws. tools: [{ label, op, n?, active?, disabled?, quiet? }]
       (quiet tools are grouped at the far end, e.g. undo / reset). After each handler the board should call ui.set again. */
    mount(host, opts) {
      const W = opts.viewW || 640;
      host.innerHTML = `<div class="lab board" dir="rtl">${opts.tip ? `<p class="btip">${opts.tip}</p>` : ""}
        <div class="stage"><svg viewBox="0 0 ${W} 100" role="img" aria-label="${esc(opts.aria || "ציור לפתרון השאלה")}"><defs>
          <pattern id="brd-half" width="1" height="1" patternContentUnits="objectBoundingBox"><rect width="1" height="1" fill="var(--sheet)"/><rect x=".5" width=".5" height="1" fill="var(--a)"/></pattern>${opts.defs || ""}</defs><g class="scene"></g></svg></div>
        <div class="tools"></div><p class="bmsg" hidden></p></div>`;
      if (Lab.fixMath) Lab.fixMath(host.querySelector(".btip"));
      const svg = host.querySelector("svg"), scene = host.querySelector(".scene"), tools = host.querySelector(".tools"), msg = host.querySelector(".bmsg");
      const toSvg = ev => { const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY; const m = svg.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 }; };
      let dragging = null;
      svg.addEventListener("pointerdown", ev => {
        const pt = toSvg(ev); const el = ev.target.closest("[data-drag]"); let key = el && el.dataset.drag;
        if (!key && opts.dragFrom) key = opts.dragFrom(pt);
        if (key && opts.onDrag) { dragging = key; try { svg.setPointerCapture(ev.pointerId); } catch (e) { } opts.onDrag(key, pt, "start"); ev.preventDefault(); return; }
        const t = ev.target.closest("[data-tap]"); if (t && opts.onTap) opts.onTap(t.dataset.tap, pt);
      });
      svg.addEventListener("pointermove", ev => { if (dragging) opts.onDrag(dragging, toSvg(ev), "move"); });
      const end = ev => { if (dragging) { const k = dragging; dragging = null; opts.onDrag(k, toSvg(ev), "end"); } };
      svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", () => { dragging = null; });
      tools.addEventListener("click", ev => { const b = ev.target.closest("[data-op]"); if (b && !b.disabled && opts.onOp) opts.onOp(b.dataset.op, b); });
      return {
        svg,
        set({ height, svg: markup, tools: list, msg: text }) {
          svg.setAttribute("viewBox", `0 0 ${W} ${height}`); scene.innerHTML = markup;
          const btn = t => `<button class="tool${t.active ? " act" : ""}${t.quiet ? " quiet" : ""}" data-op="${esc(t.op)}"${t.n !== undefined ? ` data-n="${esc(t.n)}"` : ""}${t.disabled ? " disabled" : ""}>${t.label}</button>`;
          const main = (list || []).filter(t => !t.quiet), quiet = (list || []).filter(t => t.quiet);
          tools.innerHTML = main.map(btn).join("") + (quiet.length ? `<span class="navtools">${quiet.map(btn).join("")}</span>` : "");
          msg.hidden = !text; msg.innerHTML = text || "";
          if (Lab.fixMath) Lab.fixMath(msg);
        },
      };
    },

    /* The "this is how it looks" panel shown after a wrong answer.
       rows: [{ title, kind: "chosen" | "correct", svg(y) -> markup for that row, drawn in a band starting at y }]
       or pass a ready svg + height. note: one sentence naming the mistake behind the chosen option. */
    compare(host, { height, svg, note, viewW = 640, title = "ככה זה נראה על הציור" }) {
      host.innerHTML = `<div class="lab cmp" dir="rtl"><h4>${title}</h4><div class="stage"><svg viewBox="0 0 ${viewW} ${height}" role="img" aria-label="השוואה בין התשובה שבחרת לתשובה הנכונה">${svg}</svg></div>${note ? `<p class="cnote">${note}</p>` : ""}</div>`;
      if (Lab.fixMath) Lab.fixMath(host.querySelector(".cnote"));
    },
    // standard row titles for compare panels
    rowTitle: (x, y, kind) => G.he(x, y, kind === "chosen" ? "מה שבחרת" : "התשובה הנכונה", kind === "chosen" ? "w" : "ok", "right"),
    reset(state, fresh) { for (const k of Object.keys(state)) delete state[k]; Object.assign(state, fresh); },
  };
})();
