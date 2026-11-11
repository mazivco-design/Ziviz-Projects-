/* board-percent.js — "solve on the drawing" workspace for percent questions.
   A free bar tool loaded with the question's own numbers: split the bar, color parts, remove/add the colored part
   to get a new bar. After a wrong answer, compare() draws the chosen answer next to the correct one.
   Requires lab-core.js (uses its CSS classes and G helpers). */
(function () {
  "use strict";
  const NS = window.Boards = window.Boards || {};
  const { G } = Lab, R = 610, X0 = 30, H = 46, ROW = 112, TOP = 36;
  const cnt = a => (a || []).reduce((s, v) => s + (v || 0), 0);
  const pf = x => { const r = Math.round(x * 3); if (Math.abs(x * 3 - r) < 1e-6 && r % 3) { const w = Math.floor(r / 3); return (w || "") + (r % 3 === 1 ? "⅓" : "⅔"); } return G.fmt(Math.round(x * 100) / 100); };
  const DEFS = `<defs><pattern id="brd-half" width="1" height="1" patternContentUnits="objectBoundingBox"><rect width="1" height="1" fill="var(--sheet)"/><rect x=".5" width=".5" height="1" fill="var(--a)"/></pattern></defs>`;
  const ltr = t => "\u2066" + t + "\u2069";   // keep formulas left-to-right inside Hebrew labels
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

  function init(cfg) { return { bars: cfg.start.map(b => ({ total: b.total, label: b.label, split: 0, sel: [] })), revealed: !cfg.unknown, msg: "" }; }
  const unit = cfg => cfg.unit ? " " + cfg.unit : "";

  function draw(st, cfg) {
    const bars = st.bars, first = bars[0].total, max = Math.max(...bars.map(b => b.total), first * 1.3), u = (R - X0) / max;
    let h = "";
    bars.forEach((b, i) => {
      const y = TOP + i * ROW, w = b.total * u, x0 = R - w, last = i === bars.length - 1;
      const shown = st.revealed ? pf(b.total) + unit(cfg) : "?";
      h += G.he(R, y - 12, b.label + ": " + shown, "b", "right");
      if (i > 0 && cfg.ref !== false) {
        h += G.he(X0, y - 12, ltr(pf(b.total / first * 100) + "%") + " מ" + bars[0].label, "m", "left");
        const rx = R - first * u; h += G.line(rx, y - 6, rx, y + H + 6, "dash");
      }
      h += G.rect(x0, y, w, H, "bg", { rx: 4 });
      if (b.split) {
        const cw = w / b.split, cv = b.total / b.split;
        for (let k = 0; k < b.split; k++) {
          const cx = R - (k + 1) * cw, s = b.sel[k] || 0;
          const cls = !last && s && b.op === "cut" ? "ghost" : !last && s && b.op === "add" ? "fok" : s === 1 ? "fa" : "box";
          let cell = G.rect(cx, y, cw, H, cls + (last ? " hot" : ""), s === .5 ? { style: "fill:url(#brd-half)" } : {});
          h += last ? G.tap(cell, "c" + k) : cell;
          if (s === .5) h += G.line(cx + cw / 2, y, cx + cw / 2, y + H, "thin");
          if (cw >= 44 && st.revealed && s === .5) h += G.t(cx + cw * .75, y + 29, pf(cv / 2), "inv", "middle", { "pointer-events": "none" }) + G.t(cx + cw * .25, y + 29, pf(cv / 2), "m", "middle", { "pointer-events": "none" });
          if (cw >= 30 && st.revealed && s !== .5) h += G.t(cx + cw / 2, y + 29, pf(cv), s === 1 && (last || b.op === "add") ? "inv" : "m", "middle", { "pointer-events": "none" });
        }
      }
      const c = cnt(b.sel);
      if (c > 0 && b.split) {
        const pct = c / b.split * 100, val = st.revealed ? pf(b.total * c / b.split) + unit(cfg) : "?";
        const verb = last ? "צבוע" : b.op === "cut" ? "הורדנו" : "הוספנו";
        h += G.he(R, y + H + 22, verb + ": " + ltr(pf(pct) + "% = " + val), last ? "a" : b.op === "cut" ? "w" : "ok", "right");
      } else if (last && !b.split) h += G.he(R, y + H + 22, "חלק את הפס כדי לצבוע חלקים ממנו", "m", "right");
      else if (last) h += G.he(R, y + H + 22, "לחץ על משבצות כדי לצבוע. לחיצה שנייה: חצי משבצת", "m", "right");
    });
    return { svg: h, height: TOP + bars.length * ROW - 14 };
  }

  NS.percent = {
    mount(host, st, cfg) {
      if (!st.bars) Object.assign(st, init(cfg));
      const lastBar = () => st.bars[st.bars.length - 1];
      const render = () => {
        const d = draw(st, cfg), L = lastBar(), c = cnt(L.sel), can = c > 0 && st.revealed && st.bars.length < 4;
        const splits = (cfg.splits || [4, 5, 10]).map(n => `<button class="tool${L.split === n ? " act" : ""}" data-op="split" data-n="${n}">חלק ל־${n}</button>`).join("");
        host.innerHTML = `<div class="lab board" dir="rtl">${cfg.tip ? `<p class="btip">${cfg.tip}</p>` : ""}
          <div class="stage"><svg viewBox="0 0 640 ${d.height}" role="img" aria-label="פס לפתרון השאלה">${DEFS}${d.svg}</svg></div>
          <div class="tools">${splits}
            <button class="tool" data-op="cut" ${can ? "" : "disabled"}>הורד את הצבוע ↓</button>
            <button class="tool" data-op="add" ${can ? "" : "disabled"}>הוסף את הצבוע ↓</button>
            ${cfg.alt && !st.alt ? `<button class="tool" data-op="alt">${cfg.alt.btn}</button>` : ""}
            <span class="navtools">${st.bars.length > cfg.start.length ? `<button class="tool quiet" data-op="undo">בטל פס אחרון</button>` : ""}<button class="tool quiet" data-op="reset">↺ מההתחלה</button></span></div>
          ${st.msg ? `<p class="bmsg">${st.msg}</p>` : ""}</div>`;
        if (Lab.fixMath) Lab.fixMath(host);
      };
      host.onclick = ev => {
        const cell = ev.target.closest("[data-tap]"), btn = ev.target.closest("[data-op]"), L = lastBar();
        if (cell) {
          const k = +cell.dataset.tap.slice(1); L.sel[k] = L.sel[k] === 1 ? .5 : L.sel[k] === .5 ? 0 : 1;
          if (!st.revealed && cfg.unknown && Math.abs(cnt(L.sel) / L.split * 100 - cfg.unknown.pct) < 1e-6) {
            st.revealed = true;
            st.msg = `צבעת ${pf(cfg.unknown.pct)}%, ולפי השאלה החלק הזה שווה ${pf(cfg.unknown.val)}. לכן כל משבצת שווה ${pf(L.total / L.split)}, והפס כולו ${pf(L.total)}. עכשיו אפשר לנקות ולצבוע את מה שמבקשים.`;
          }
        } else if (btn && !btn.disabled) {
          const op = btn.dataset.op;
          if (op === "split") { L.split = +btn.dataset.n; L.sel = []; }
          else if (op === "cut" || op === "add") {
            const part = L.total * cnt(L.sel) / L.split; L.op = op;
            st.bars.push({ total: op === "cut" ? L.total - part : L.total + part, label: (cfg.labels || [])[st.bars.length] || "הפס החדש", split: 0, sel: [] });
          }
          else if (op === "undo") { st.bars.pop(); const b = lastBar(); b.op = null; }
          else if (op === "reset") { for (const k of Object.keys(st)) delete st[k]; Object.assign(st, init(cfg)); }
          else if (op === "alt") { st.alt = true; st.bars = [{ total: cfg.alt.total, label: cfg.alt.label, split: 0, sel: [] }]; st.msg = cfg.alt.msg || ""; }
        } else return;
        render();
      };
      render();
    },

    // draw the chosen answer next to the correct one
    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined) { host.innerHTML = ""; return; }
      const B = C.base, un = unit(cfg);
      const row = j => {
        const v = C.vals[j];
        if (C.kind === "part") return { len: B, fill: [0, v], cap: `${pf(v)}${un} הם ${ltr(pf(v / B * 100) + "%")} מ־${pf(B)}` };
        if (C.kind === "pct") return { len: B, fill: [0, B * v / 100], cap: `${ltr(pf(v) + "%")} מ־${pf(B)} הם ${pf(B * v / 100)}${un}` };
        if (C.kind === "cut") return { len: B, fill: [v, B], cap: `מ־${pf(B)} ל־${pf(v)}: ירידה של ${pf(B - v)}${un}, שהם ${ltr(pf((B - v) / B * 100) + "%")} מ־${pf(B)}` };
        if (C.kind === "cutpct") { const x = B * v / 100; return { len: B, fill: [B - x, B], ref: C.target, cap: `ירידה של ${ltr(pf(v) + "%")} מ־${pf(B)} היא ${pf(x)}, ומגיעים ל־${pf(B - x)}` }; }
        return { len: v, fill: [0, v], ref: C.ref.val, cap: `${C.label}: ${pf(v)}${un} · ${C.ref.label}: ${pf(C.ref.val)}${un}` };
      };
      const rows = [[row(chosen), "מה שבחרת", "w", "fwarn"], [row(correct), "התשובה הנכונה", "ok", "fok"]];
      const max = Math.max(...rows.map(r => Math.max(r[0].len, r[0].ref || 0))), u = (R - X0) / max;
      let h = "";
      rows.forEach(([r, title, tc, fc], i) => {
        const y = 30 + i * 96, w = r.len * u;
        h += G.he(R, y - 10, title, tc, "right") + G.rect(R - w, y, w, 40, "bg", { rx: 4 });
        h += G.rect(R - r.fill[1] * u, y, (r.fill[1] - r.fill[0]) * u, 40, fc);
        if (r.ref) { const rx = R - r.ref * u; h += G.line(rx, y - 6, rx, y + 46, "dash"); }
        h += G.he(R, y + 62, r.cap, "m", "right");
      });
      const note = (cfg.notes || {})[chosen];
      host.innerHTML = `<div class="lab cmp" dir="rtl"><h4>ככה זה נראה על הפס</h4><div class="stage"><svg viewBox="0 0 640 208" role="img" aria-label="השוואה בין התשובה שבחרת לתשובה הנכונה">${h}</svg></div>${note ? `<p class="cnote">${note}</p>` : ""}</div>`;
      if (Lab.fixMath) Lab.fixMath(host);
    },
  };
})();
