/* board-prb-miss3.js — "who is missing it" rows for a three-group minimum-overlap question.
   Each row is the whole population; the empty (dashed) part is those who do NOT have the item and can be dragged.
   Bottom row: who has all of them (columns covered by no empty part), counted live.
   cfg: { type:"prb-miss3", N, step, groups:[{n,label}], p0:[start of each empty part, from the right], all (label), tip,
          compare:[per option {p:[..], cap}] (cap token {free}), notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G } = kit, X0 = 30, X1 = 610, TOP = 30, ROW = 60, BH = 26, CLS = ["fsoft", "fblue-soft", "fok-soft"];
  const fresh = cfg => ({ init: 1, p: cfg.p0.slice() });
  const hole = (cfg, i) => cfg.N - cfg.groups[i].n;
  const isFree = (cfg, p, a) => cfg.groups.every((g, i) => !(a >= p[i] && a < p[i] + hole(cfg, i)));
  const free = (cfg, p) => { let n = 0; for (let a = 0; a < cfg.N; a += cfg.step) if (isFree(cfg, p, a)) n += cfg.step; return n; };

  function draw(st, cfg) {
    const u = (X1 - X0) / cfg.N, K = cfg.groups.length; let h = "";
    cfg.groups.forEach((g, i) => {
      const y = TOP + i * ROW, hw = hole(cfg, i) * u, hx = X1 - (st.p[i] + hole(cfg, i)) * u;
      h += G.he(X1, y - 8, `${g.label}: ל־${g.n} יש, ל־${cfg.N - g.n} אין`, "b", "right");
      h += G.rect(X0, y, X1 - X0, BH, CLS[i % 3]) + G.rect(hx, y, hw, BH, "box", { style: "stroke:none" }) + G.rect(hx, y, hw, BH, "ghost");
      h += G.he(hx + hw / 2 - 40, y + 18, "אין", "m") + G.knob(hx + hw / 2, y + BH / 2, "h" + i, 15);
    });
    const yb = TOP + K * ROW + 8, f = free(cfg, st.p);
    h += G.he(X1, yb - 8, cfg.all + ": " + f, "a", "right");
    for (let a = 0; a < cfg.N; a += cfg.step) h += G.rect(X1 - (a + cfg.step) * u, yb, cfg.step * u, BH, isFree(cfg, st.p, a) ? "fa" : "box", { style: "stroke:none" });
    h += G.rect(X0, yb, X1 - X0, BH, "ink");
    for (let a = cfg.step; a < cfg.N; a += cfg.step) { const x = X1 - a * u; h += G.line(x, TOP, x, yb + BH, "mut", { opacity: .25, "pointer-events": "none" }); }
    return { svg: h, height: yb + BH + 12 };
  }

  Boards["prb-miss3"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const u = (X1 - X0) / cfg.N;
      const render = () => { const d = draw(st, cfg); ui.set({ height: d.height, svg: d.svg, tools: [{ label: "↺ מההתחלה", op: "reset", quiet: true }] }); };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "שורות לפתרון שאלת החפיפה",
        onOp(op) { if (op === "reset") kit.reset(st, fresh(cfg)); render(); },
        onDrag(key, pt) { const i = +key.slice(1), len = hole(cfg, i); st.p[i] = Math.max(0, Math.min(cfg.N - len, Math.round(((X1 - pt.x) / u - len / 2) / cfg.step) * cfg.step)); render(); },
        dragFrom(pt) { const i = Math.floor((pt.y - TOP + 6) / ROW); return i >= 0 && i < cfg.groups.length && pt.y < TOP + i * ROW + BH + 8 && pt.x > X0 && pt.x < X1 ? "h" + i : null; },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen) || !C[chosen] || !C[correct]) { host.innerHTML = ""; return; }
      const u = (X1 - X0) / cfg.N, K = cfg.groups.length; let h = "";
      [[C[chosen], "chosen", "fwarn"], [C[correct], "correct", "fok"]].forEach(([sp, kind, fc], r) => {
        const y = 30 + r * 128;
        h += kit.rowTitle(X1, y - 10, kind);
        cfg.groups.forEach((g, i) => {
          const yy = y + i * 17, hw = hole(cfg, i) * u, hx = X1 - (sp.p[i] + hole(cfg, i)) * u;
          h += G.rect(X0, yy, X1 - X0, 13, CLS[i % 3]) + G.rect(hx, yy, hw, 13, "box", { style: "stroke:none" }) + G.rect(hx, yy, hw, 13, "ghost");
        });
        const yb = y + K * 17 + 6;
        for (let a = 0; a < cfg.N; a += cfg.step) h += G.rect(X1 - (a + cfg.step) * u, yb, cfg.step * u, 20, isFree(cfg, sp.p, a) ? fc : "box", { style: "stroke:none" });
        h += G.rect(X0, yb, X1 - X0, 20, "ink");
        h += G.he(X1, yb + 42, (sp.cap || "").replace("{free}", free(cfg, sp.p)), "m", "right");
      });
      kit.compare(host, { height: 262, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה על השורות" });
    },
  };
})();
