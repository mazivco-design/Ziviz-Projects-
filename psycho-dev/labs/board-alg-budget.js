/* board-alg-budget.js — "enough / not enough" word inequality (topic alg-inequalities-abs).
   A price slider; rows of identical blocks (count × price) grow against a fixed budget line.
   cfg: { type:"alg-budget", tip, budget, counts:[6,7], enough:[true,false] (what the question says about each row),
          price:{min,max,step,init}, unit, item, vals:[price per option], notes:{optionIndex: text} } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, X0 = 30, X1 = 610, BH = 34, ROW = 78;
  const NP = { "pointer-events": "none" };
  const scale = cfg => (X1 - X0) / Math.max(cfg.budget * 1.3, Math.max(...cfg.counts) * cfg.price.max);
  const fresh = cfg => ({ init: true, p: cfg.price.init, touched: false });

  // the rows of blocks for one price, first row's title baseline at y; returns markup (height = counts.length * ROW)
  function rows(cfg, p, y, u, plain) {
    let h = "";
    const bx = X0 + cfg.budget * u, n = cfg.counts.length;
    cfg.counts.forEach((c, i) => {
      const yy = y + i * ROW, total = c * p, fits = total <= cfg.budget + 1e-9, match = fits === cfg.enough[i];
      h += G.he(X1, yy, c + " " + cfg.item + ": " + ltr(pf(total)) + " " + cfg.unit, "b", "right");
      h += G.he(X0, yy, (fits ? "מספיק" : "לא מספיק") + (match ? " · מתאים לשאלה ✓" : " · לא מתאים לשאלה ✗"), match ? "ok" : "w", "left");
      for (let k = 0; k < c; k++) {
        const x = X0 + k * p * u, over = (k + 1) * p > cfg.budget + 1e-9;
        h += G.rect(x, yy + 12, p * u, BH, over ? "fwarn" : plain ? "box" : "fsoft", { rx: 3 });
        if (p * u >= 46) h += G.t(x + p * u / 2, yy + 34, pf(p), "m", "middle", NP);
      }
    });
    cfg.counts.forEach((c, i) => { h += G.line(bx, y + i * ROW + 5, bx, y + i * ROW + 12 + BH + 7, "sblue"); });
    h += G.he(bx - 6, y + (n - 1) * ROW + 12 + BH + 26, "התקציב: " + ltr(pf(cfg.budget)) + " " + cfg.unit, "blue", "left");
    return h;
  }

  Boards["alg-budget"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const u = scale(cfg), P = cfg.price, n = cfg.counts.length, SY = 30 + n * ROW + 62, SL = 70, SR = 570, su = (SR - SL) / (P.max - P.min);
      const render = () => {
        let h = rows(cfg, st.p, 30, u);
        h += G.line(SL, SY, SR, SY, "ink");
        for (let v = P.min; v <= P.max + 1e-9; v += P.step) { const whole = Math.abs(v - Math.round(v)) < 1e-9, x = SL + (v - P.min) * su; h += G.line(x, SY - (whole ? 7 : 4), x, SY + (whole ? 7 : 4), "thin"); if (whole) h += G.t(x, SY + 40, pf(v), "m"); }
        const kx = SL + (st.p - P.min) * su;
        h += G.knob(kx, SY, "p", 16);
        h += G.he(X1, SY - 28, "מחיר " + cfg.single + ": " + ltr(pf(st.p)) + " " + cfg.unit, "a", "right");
        ui.set({ height: SY + 54, svg: h, tools: [{ label: "↺ מההתחלה", op: "reset", quiet: true }] });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "שורות של מחברות מול התקציב",
        onDrag(key, pt) { st.p = Math.max(P.min, Math.min(P.max, P.min + Math.round((pt.x - SL) / su / P.step) * P.step)); st.touched = true; render(); },
        dragFrom(pt) { return Math.abs(pt.y - SY) <= 24 ? "p" : null; },
        onOp(op) { if (op === "reset") kit.reset(st, fresh(cfg)); render(); },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      if (chosen === correct || chosen === undefined || chosen === null || isNaN(chosen)) { host.innerHTML = ""; return; }
      const u = scale(cfg), n = cfg.counts.length, block = n * ROW + 38; let h = "";
      [[chosen, "chosen"], [correct, "correct"]].forEach(([j, kind], i) => {
        const y = 26 + i * (block + 30);
        h += kit.rowTitle(X1, y, kind) + G.he(X0, y, "מחיר " + cfg.single + ": " + ltr(pf(cfg.vals[j])) + " " + cfg.unit, "m", "left");
        h += rows(cfg, cfg.vals[j], y + 34, u, true);
      });
      kit.compare(host, { height: 26 + 2 * (block + 30) - 14, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה על הציור" });
    },
  };
})();
