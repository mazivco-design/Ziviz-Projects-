/* board-prb-share.js — "who gets how much" board.
   view "cols": draggable columns (one per player/box/number); readouts: sum, what is left, the largest, rule violations.
   view "kinds": two kinds of items, each worth a fixed number of units (bicycles with 2 wheels...), added with + / −.
   cfg cols:  { type:"prb-share", view:"cols", n, total|null, min, step, max, who:"שחקן", distinct:true, showMax:true, words:{sum, low, dup},
                compare:{ vals:[array per option], caps:[text per option] }, notes }
   cfg kinds: { view:"kinds", kinds:[{name, w, unit}], start:[..], maxCount, sumLabel, lowMsg,
                compare:{ counts:[array per option], caps:[..] }, notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, R = 620, BASE = 262, TOPY = 52, CX0 = 30, CX1 = 392;
  const fresh = cfg => cfg.view === "kinds" ? { init: true, c: cfg.start.slice() } : { init: true, h: Array(cfg.n).fill(0), sel: 0 };
  const sum = a => a.reduce((s, v) => s + v, 0);
  const stats = (cfg, h) => { const cnt = {}; h.forEach(v => cnt[v] = (cnt[v] || 0) + 1); return { sum: sum(h), cnt, dup: cfg.distinct !== false && h.some(v => v > 0 && cnt[v] > 1), low: h.some(v => v < cfg.min), max: Math.max(...h) }; };
  const geo = cfg => { const sp = (CX1 - CX0) / cfg.n, w = Math.min(46, sp - 12); return { sp, w, x: k => CX1 - sp * (k + .5), u: (BASE - TOPY) / cfg.max }; };

  function drawCols(cfg, h, opt = {}) {
    const g = geo(cfg), s = stats(cfg, h), any = s.sum > 0, base = opt.base || BASE, u = opt.u || g.u;
    let o = "";
    h.forEach((v, k) => {
      const x = g.x(k), top = base - v * u, bad = any && (v < cfg.min || (cfg.distinct !== false && s.cnt[v] > 1));
      if (v > 0) o += G.rect(x - g.w / 2, top, g.w, v * u, bad ? "fwarn" : opt.cls || "fa", { rx: 3 });
      if (opt.sel === k) o += G.rect(x - g.w / 2 - 5, base + 4, g.w + 10, 4, "fa", { rx: 2 });
      o += G.t(x, top - (opt.knobs ? 36 : 8), v, bad ? "w" : "b");
      if (opt.knobs) o += G.knob(x, top - 14, "c" + k, 15);
    });
    o += G.line(CX0 - 8, base, CX1 + 8, base, "ink");
    return o;
  }
  function readout(cfg, h, y0, cmp) {
    const s = stats(cfg, h), W = cfg.words || {}; let o = "", y = y0;
    const line = (t, cls) => { o += G.he(R, y, t, cls, "right"); y += 32; };
    if (cfg.total) {
      line(`${W.sum || "חולקו"} ${s.sum} מתוך ${cfg.total}`, "b");
      const left = cfg.total - s.sum; line(left > 0 ? `נשארו ${left}` : left < 0 ? `חריגה של ${-left}` : "הכול חולק", left === 0 ? "ok" : "w");
    } else line(`${W.sum || "הסכום"}: ${s.sum}`, "b");
    if (cfg.showMax && s.sum > 0) line(`${W.max || "הגדול ביותר"}: ${s.max}`, "a");
    if (s.sum > 0 && s.dup) line(W.dup || "יש שני מספרים שווים", "w");
    if (s.sum > 0 && s.low && !cmp) line(W.low || `יש מי שקיבל פחות מ־${cfg.min}`, "w");
    return o;
  }

  // ---------- kinds ----------
  const item = (x, y, w, cls) => { let o = G.rect(x - (w * 22 + 8), y, w * 22 + 8, 30, cls || "box", { rx: 15 }); for (let j = 0; j < w; j++) o += G.circle(x - 15 - j * 22, y + 15, 8, "dot"); return o; };
  function kindsLine(cfg, c, y, x0) { let x = x0, o = ""; cfg.kinds.forEach((kd, i) => { for (let j = 0; j < c[i]; j++) { o += item(x, y, kd.w, i ? "fblue-soft" : "fsoft"); x -= kd.w * 22 + 16; } }); return o; }
  const wheels = (cfg, c) => sum(cfg.kinds.map((kd, i) => kd.w * c[i]));

  Boards["prb-share"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const kinds = cfg.view === "kinds", step = cfg.step || 1, g = kinds ? null : geo(cfg);
      const snap = v => { v = Math.max(0, Math.min(cfg.max, v)); if (step === 1) return Math.round(v); return v < cfg.min / 2 ? 0 : Math.max(cfg.min, cfg.min + step * Math.round((v - cfg.min) / step)); };
      const render = () => {
        if (kinds) {
          let o = "";
          cfg.kinds.forEach((kd, i) => {
            const y = 26 + i * 108;
            o += G.he(R, y + 6, `${kd.name}: ${st.c[i]}`, "b", "right") + G.he(R, y + 34, `${kd.w} ${kd.unit} בכל אחד`, "m", "right");
            o += G.tap(G.rect(R - 40, y + 44, 40, 38, "box hot", { rx: 8 }), "p" + i) + G.t(R - 20, y + 70, "+", "a big", "middle", { "pointer-events": "none" });
            o += G.tap(G.rect(R - 90, y + 44, 40, 38, "box hot", { rx: 8 }), "m" + i) + G.t(R - 70, y + 70, "−", "a big", "middle", { "pointer-events": "none" });
            let x = 440; for (let j = 0; j < st.c[i]; j++) { o += item(x, y + 20, kd.w, i ? "fblue-soft" : "fsoft"); x -= kd.w * 22 + 16; }
            if (!st.c[i]) o += G.he(440, y + 42, "אין", "m", "right");
          });
          const parts = cfg.kinds.map((kd, i) => kd.w * st.c[i]);
          o += G.line(20, 234, R, 234, "thin", { opacity: .3 });
          o += G.he(R, 266, `${cfg.sumLabel}: ` + ltr(parts.join(" + ") + " = " + sum(parts)), "b", "right");
          if (st.c.some(v => v < 1)) o += G.he(R, 296, cfg.lowMsg, "w", "right");
          ui.set({ height: 310, svg: o, tools: [{ label: "↺ מההתחלה", op: "reset", quiet: true }] });
          return;
        }
        const s = stats(cfg, st.h), left = cfg.total ? cfg.total - s.sum : 0;
        let o = drawCols(cfg, st.h, { knobs: true, sel: st.sel }) + readout(cfg, st.h, 44);
        for (let k = 0; k < cfg.n; k++) o += G.t(g.x(k), BASE + 30, k + 1, "m");
        o += G.he(CX1 + 8, BASE + 56, cfg.who, "m", "right");
        if (!s.sum) o += G.he((CX0 + CX1) / 2, 150, "גרור את העיגולים למעלה", "m");
        ui.set({
          height: BASE + 68, svg: o,
          tools: [
            { label: step > 1 ? "הקטן" : ltr("−1"), op: "dec", disabled: st.h[st.sel] <= 0 }, { label: step > 1 ? "הגדל" : ltr("+1"), op: "inc", disabled: st.h[st.sel] >= cfg.max },
            ...(cfg.total ? [{ label: "כל היתרה לעמודה המסומנת", op: "rest", disabled: left <= 0 || st.h[st.sel] + left > cfg.max }] : []),
            { label: "↺ מההתחלה", op: "reset", quiet: true },
          ],
        });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "לוח חלוקה",
        onTap(key) { const i = +key.slice(1), d = key[0] === "p" ? 1 : -1; st.c[i] = Math.max(0, Math.min(cfg.maxCount, st.c[i] + d)); render(); },
        onDrag(key, pt) { const k = +key.slice(1); st.sel = k; st.h[k] = snap((BASE - 14 - pt.y) / g.u); render(); },
        dragFrom(pt) { if (kinds || pt.x < CX0 || pt.x > CX1 || pt.y > BASE + 40) return null; return "c" + Math.max(0, Math.min(cfg.n - 1, Math.floor((CX1 - pt.x) / g.sp))); },
        onOp(op) {
          if (op === "reset") kit.reset(st, fresh(cfg));
          else if (op === "rest") st.h[st.sel] += cfg.total - sum(st.h);
          else { const v = st.h[st.sel]; st.h[st.sel] = Math.min(cfg.max, op === "inc" ? (step > 1 && v < cfg.min ? cfg.min : v + step) : (step > 1 && v <= cfg.min ? 0 : Math.max(0, v - step))); }
          render();
        },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const note = (cfg.notes || {})[chosen]; let h = "";
      if (cfg.view === "kinds") {
        [[chosen, "chosen"], [correct, "correct"]].forEach(([j, kind], i) => {
          const y = 26 + i * 104; h += kit.rowTitle(R, y, kind) + kindsLine(cfg, C.counts[j], y + 14, R) + G.he(R, y + 72, C.caps[j], "m", "right");
        });
        kit.compare(host, { height: 216, svg: h, note });
        return;
      }
      const all = C.vals[chosen].concat(C.vals[correct]), u = 96 / Math.max(...all);
      [[chosen, "chosen", "fwarn"], [correct, "correct", "fok"]].forEach(([j, kind, cls], i) => {
        const y = 26 + i * 196, v = C.vals[j];
        h += kit.rowTitle(R, y, kind) + drawCols(cfg, v, { base: y + 126, u, cls }) + G.he(R, y + 40, (cfg.total ? "הסכום: " : "הסכום: ") + sum(v), "b", "right");
        const s = stats(cfg, v); if (s.dup) h += G.he(R, y + 70, (cfg.words || {}).dup || "יש שני מספרים שווים", "w", "right");
        h += G.he(R, y + 154, C.caps[j], "m", "right");
      });
      kit.compare(host, { height: 388, svg: h, note, title: "ככה זה נראה על העמודות" });
    },
  };
})();
