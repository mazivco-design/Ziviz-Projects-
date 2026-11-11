/* board-prb-seesaw.js — seesaw for weighted averages. Blocks sit on a number line at their group's average;
   the triangle (fulcrum) is the combined average. Either the fulcrum is draggable (find the average), or it is fixed and
   the learner adds/removes blocks (find the ratio between the groups). Moments (amount × distance) are shown live.
   cfg: { type:"prb-seesaw", lo, hi, step (tick labels), groups:[{v,n,per?,label,unit,cls?}] (smaller v first), f0, fDrag?, adjust?, maxN?,
          share?(index of group whose share of the blocks is shown), tip,
          compare:{f:[per option]} | {n:[[n0,n1] per option]}, notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, SX0 = 70, SX1 = 570;
  const fresh = cfg => ({ init: 1, f: cfg.f0, n: cfg.groups.map(g => g.n) });
  const torque = (cfg, f, n) => cfg.groups.reduce((s, g, i) => s + n[i] * (g.v - f), 0);
  const mom = (cfg, f, n, i) => ltr(`\u200e${pf(n[i])} × ${pf(Math.abs(cfg.groups[i].v - f))} = ${pf(n[i] * Math.abs(cfg.groups[i].v - f))}`);

  // o: { py, stack (max stack height), knob, small, labels(i) }
  function saw(cfg, f, n, o) {
    const vx = v => SX0 + (SX1 - SX0) * (v - cfg.lo) / (cfg.hi - cfg.lo), fx = vx(f), py = o.py, tq = torque(cfg, f, n);
    const norm = tq / (n.reduce((s, x) => s + x, 0) * (cfg.hi - cfg.lo)), ang = tq === 0 ? 0 : Math.sign(tq) * Math.min(5, 1.5 + Math.abs(norm) * 30);
    const blocks = cfg.groups.map((g, i) => n[i] / (g.per || 1)), bh = Math.min(22, o.stack / Math.max(...blocks, cfg.adjust && !o.small ? cfg.maxN : 1));
    let g = G.line(SX0 - 14, py, SX1 + 14, py, "ink", { style: "stroke-width:5" });
    for (let v = cfg.lo; v <= cfg.hi; v++) {
      const x = vx(v), big = v % cfg.step === 0, at = cfg.groups.some(q => q.v === v);
      if (!o.small || big) g += G.line(x, py + 3, x, py + (big ? 12 : 7), "thin");
      if ((big || at) && Math.abs(x - fx) >= 34 && (!o.small || at)) g += G.t(x, py + 28, v, at ? "b" : "m");
    }
    cfg.groups.forEach((q, i) => {
      const x = vx(q.v), bw = 46;
      for (let k = 0; k < blocks[i]; k++) { const y = py - 3 - (k + 1) * bh; g += G.rect(x - bw / 2, y, bw, bh > 8 ? bh - 2 : bh, q.cls || (i ? "fa" : "fblue"), bh > 8 ? { rx: 3 } : { style: "stroke:none" }); if (q.per > 1 && bh >= 16) g += G.t(x, y + bh / 2 + 4, pf(q.per), "inv"); }
      g += G.he(x, py - 12 - blocks[i] * bh, o.labels(i), "b");
    });
    let h = `<g transform="rotate(${ang} ${fx} ${py})">${g}</g>`;
    const th = o.small ? 26 : 40;
    h += G.poly([[fx, py + 3], [fx - th / 2, py + 3 + th], [fx + th / 2, py + 3 + th]], "fsoft");
    if (o.knob) h += G.knob(fx, py + 62, "f", 15);
    h += G.t(fx, py + (o.knob ? 102 : o.small ? 50 : 68), pf(f), "a big");
    return h;
  }
  const status = (cfg, f, n) => { const tq = torque(cfg, f, n); if (tq === 0) return ["מאוזן ✓", "ok"]; const side = cfg.groups.map((g, i) => [n[i] * (g.v - f) * Math.sign(tq), g.label]).sort((a, b) => b[0] - a[0])[0][1]; return ["נוטה לצד של " + side, "m"]; };

  Boards["prb-seesaw"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const maxN = cfg.maxN || 12, PY = 92 + Math.min(112, 22 * (cfg.adjust ? maxN : Math.max(...cfg.groups.map(g => g.n / (g.per || 1)))));
      const render = () => {
        const [txt, cls] = status(cfg, st.f, st.n); let h = G.he(320, 22, txt, cls === "ok" ? "ok" : "b");
        if (cfg.share !== undefined) h += G.he(320, 44, `${cfg.groups[cfg.share].label}: ${st.n[cfg.share]} מתוך ${st.n[0] + st.n[1]} קוביות`, "m");
        h += saw(cfg, st.f, st.n, { py: PY, stack: PY - 92, knob: cfg.fDrag, labels: i => `${cfg.groups[i].label}: ${pf(st.n[i])} ${cfg.groups[i].unit}` });
        const yc = PY + (cfg.fDrag ? 134 : 104);
        cfg.groups.forEach((g, i) => { const x = i ? 470 : 170; h += G.t(x, yc, mom(cfg, st.f, st.n, i), i ? "a" : "blue") + G.he(x, yc + 20, g.label + ": כמות × מרחק", "m"); });
        const tools = [];
        if (cfg.adjust) cfg.groups.forEach((g, i) => tools.push({ label: "+ " + g.label, op: "inc", n: i, disabled: st.n[i] >= maxN }, { label: "− " + g.label, op: "dec", n: i, disabled: st.n[i] <= 1 }));
        tools.push({ label: "↺ מההתחלה", op: "reset", quiet: true });
        ui.set({ height: yc + 32, svg: h, tools });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "נדנדה לפתרון שאלת הממוצע",
        onOp(op, el) { if (op === "reset") kit.reset(st, fresh(cfg)); else { const i = +el.dataset.n; st.n[i] = Math.max(1, Math.min(maxN, st.n[i] + (op === "inc" ? 1 : -1))); } render(); },
        onDrag(key, pt) { st.f = Math.max(cfg.lo, Math.min(cfg.hi, Math.round(cfg.lo + (pt.x - SX0) / (SX1 - SX0) * (cfg.hi - cfg.lo)))); render(); },
        dragFrom(pt) { return cfg.fDrag && pt.y > PY && pt.y < PY + 110 ? "f" : null; },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      let h = "";
      [[chosen, "chosen"], [correct, "correct"]].forEach(([j, kind], r) => {
        const f = C.f ? C.f[j] : cfg.f0, n = C.n ? C.n[j] : cfg.groups.map(g => g.n), y = r * 186, bal = torque(cfg, f, n) === 0;
        h += kit.rowTitle(620, y + 20, kind);
        h += `<g transform="translate(0 ${y})">` + saw(cfg, f, n, { py: 100, stack: 46, small: true, labels: i => cfg.groups[i].label }) + "</g>";
        h += G.he(320, y + 176, cfg.groups.map((g, i) => `${g.label}: ${mom(cfg, f, n, i)}`).join(" · ") + (bal ? " · מאוזן" : " · לא מאוזן"), bal ? "ok" : "w");
      });
      kit.compare(host, { height: 372, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה על הנדנדה" });
    },
  };
})();
