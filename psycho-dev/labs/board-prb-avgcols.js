/* board-prb-avgcols.js — leveling columns for average questions. Columns = the numbers, a horizontal line = the average.
   Surplus above the line (pink) and deficit below it (dashed) are counted live; balanced = the line is the average.
   cfg: { type:"prb-avgcols", cols:[{v,label?,drag?}], line:{v,drag?}, min?(0), max, tick, sums?:[[i,j,target]], tip,
          compare:{col: index | "line", vals:[one per option], cols?:[preset values]}, notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, H = 180;
  const fresh = cfg => ({ init: 1, v: cfg.cols.map(c => c.v), line: cfg.line.v });
  const ed = (v, line) => { let ex = 0, de = 0; for (const x of v) { if (x > line) ex += x - line; else de += line - x; } return { ex, de }; };
  const geo = (cfg, x0, x1, base, hgt) => {
    const n = cfg.cols.length, gap = n > 6 ? 10 : 20, cw = Math.min(56, (x1 - x0 - (n - 1) * gap) / n), tw = n * cw + (n - 1) * gap, xs = x0 + (x1 - x0 - tw) / 2;
    const min = cfg.min || 0, U = hgt / (cfg.max - min);
    return { n, cw, x: j => xs + j * (cw + gap), y: v => base - (Math.max(min, Math.min(cfg.max, v)) - min) * U, val: y => Math.max(min, Math.min(cfg.max, Math.round(min + (base - y) / U))), min, base, x0, x1 };
  };
  function chart(cfg, g, v, line, o) {
    let h = "";
    if (o.axis) {
      h += G.line(g.x0 - 8, g.base, g.x0 - 8, g.y(cfg.max), "mut");
      for (let k = g.min; k <= cfg.max; k += cfg.tick) h += G.line(g.x0 - 13, g.y(k), g.x0 - 8, g.y(k), "mut") + G.t(g.x0 - 17, g.y(k) + 5, k, "m", "end");
    }
    h += G.line(g.x0 - 8, g.base, g.x1, g.base, "ink");
    v.forEach((x, j) => {
      const cx = g.x(j), y = g.y(x), yl = g.y(line), mark = o.mark === j || (o.axis && cfg.cols[j].drag);
      h += G.rect(cx, y, g.cw, g.base - y, mark ? "fok-soft" : "fblue-soft");
      if (x > line) h += G.rect(cx, y, g.cw, yl - y, "fa");
      if (x < line && y - yl > 4) h += G.rect(cx + 2, yl + 1, g.cw - 4, y - yl - 2, "fwarn");
      h += G.t(cx + g.cw / 2, g.base + 20, pf(x), mark ? "ok" : "b");
      if (o.axis && cfg.cols[j].label) h += G.he(cx + g.cw / 2, g.base + 39, cfg.cols[j].label, "m");
    });
    h += G.line(g.x0 - 8, g.y(line), g.x1 + (o.axis && cfg.line.drag ? 6 : 0), g.y(line), "sa", o.axis && cfg.line.drag ? {} : { "stroke-dasharray": "7 5" });
    if (o.axis) {
      v.forEach((x, j) => { if (cfg.cols[j].drag) h += G.knob(g.x(j) + g.cw / 2, g.y(x), "c" + j, 15); });
      if (cfg.line.drag) h += G.knob(g.x1 + 20, g.y(line), "line", 15);
    }
    return h;
  }
  const mainGeo = cfg => { const top = cfg.sums ? 112 : 68; return geo(cfg, 56, 584, top + H, H); };

  Boards["prb-avgcols"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const g = mainGeo(cfg);
      const render = () => {
        const { ex, de } = ed(st.v, st.line), y1 = cfg.sums ? 66 : 22; let h = "";
        if (cfg.sums) cfg.sums.forEach(([i, j, t], k) => {
          const s = st.v[i] + st.v[j], f = ltr(`${cfg.cols[i].label} + ${cfg.cols[j].label} = ${pf(s)}`);
          h += G.he(530 - k * 210, 22, f, s === t ? "ok" : "b") + G.he(530 - k * 210, 41, s === t ? "✓ כמו בשאלה" : "צריך " + pf(t), s === t ? "ok" : "m");
        });
        h += G.he(320, y1, `קו הממוצע: ${pf(st.line)} · עודף מעל הקו: ${pf(ex)} · חסר מתחת לקו: ${pf(de)}`, "b");
        h += G.he(320, y1 + 22, ex === de ? "מאוזן: העודף ממלא בדיוק את החסר" : ex > de ? "העודף גדול מהחסר" : "החסר גדול מהעודף", ex === de ? "ok" : "m");
        h += chart(cfg, g, st.v, st.line, { axis: true });
        ui.set({ height: g.base + 50, svg: h, tools: [{ label: "↺ מההתחלה", op: "reset", quiet: true }] });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "עמודות לפתרון שאלת הממוצע",
        onOp(op) { if (op === "reset") kit.reset(st, fresh(cfg)); render(); },
        onDrag(key, pt) { if (key === "line") st.line = g.val(pt.y); else st.v[+key.slice(1)] = g.val(pt.y); render(); },
        dragFrom(pt) {
          for (let j = 0; j < g.n; j++) if (cfg.cols[j].drag && pt.x > g.x(j) - 8 && pt.x < g.x(j) + g.cw + 8 && pt.y < g.base + 8) return "c" + j;
          return cfg.line.drag && Math.abs(pt.y - g.y(st.line)) < 18 ? "line" : null;
        },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      let h = G.line(320, 8, 320, 196, "dash");
      [[chosen, "chosen", 336, 620], [correct, "correct", 20, 304]].forEach(([j, kind, xa, xb]) => {
        const v = (C.cols || cfg.cols.map(c => c.v)).slice(); let line = cfg.line.v;
        if (C.col === "line") line = C.vals[j]; else v[C.col] = C.vals[j];
        const g = geo(cfg, xa + 14, xb - 6, 150, 112), { ex, de } = ed(v, line);
        h += kit.rowTitle(xb, 18, kind) + chart(cfg, g, v, line, { mark: C.col === "line" ? -1 : C.col });
        h += G.he((xa + xb) / 2, 194, `קו ${pf(line)} · עודף ${pf(ex)} · חסר ${pf(de)}` + (ex === de ? " · מאוזן" : ""), ex === de ? "ok" : "w");
      });
      kit.compare(host, { height: 206, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה על העמודות" });
    },
  };
})();
