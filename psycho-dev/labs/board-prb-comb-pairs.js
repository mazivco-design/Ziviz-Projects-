/* board-prb-comb-pairs.js — points on a circle; tapping a point draws all of its lines (games / diagonals).
   The board lists, per tapped point, how many lines leave it and how many of them are new, and counts the distinct lines.
   cfg: { type:"prb-comb-pairs", n, names?:[..], mode:"all"|"diag" (diag: polygon sides are pre-drawn and not counted),
          node:"קבוצה", unit:"משחקים", tip,
          compare:{ rows:{ optionIndex:{ set:"full"|"diag"|"sides"|"short"|"none", double?, self?, cap:[lines] } } }, notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, R = 610, NP = { "pointer-events": "none" };
  const fresh = () => ({ init: true, order: [] });
  const pos = (n, i, cx, cy, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const adj = (n, i, j) => (i - j + n) % n === 1 || (j - i + n) % n === 1;
  const linked = (cfg, i, j) => i !== j && (cfg.mode !== "diag" || !adj(cfg.n, i, j));
  const name = (cfg, i) => (cfg.names || [])[i] || String(i + 1);
  const label = (x, y, s, cls) => /[֐-׿]/.test(s) ? G.he(x, y, s, cls, "middle", NP) : G.t(x, y, s, cls, "middle", NP);

  function draw(st, cfg) {
    const n = cfg.n, cx = 150, cy = 150, r = 108, P = i => pos(n, i, cx, cy, r), last = st.order[st.order.length - 1];
    let h = "", total = 0; const rows = [];
    if (cfg.mode === "diag") h += G.poly([...Array(n)].map((_, i) => P(i)), "ink");
    st.order.forEach((v, t) => {
      let all = 0, fresh = 0;
      for (let j = 0; j < n; j++) if (linked(cfg, v, j)) {
        all++;
        if (st.order.indexOf(j) < 0 || st.order.indexOf(j) > t) { fresh++; const a = P(v), b = P(j); h += G.line(a[0], a[1], b[0], b[1], v === last ? "sa" : "mut"); }
      }
      total += fresh; rows.push([v, all, fresh]);
    });
    for (let i = 0; i < n; i++) { const p = P(i), on = st.order.includes(i); h += G.tap(G.circle(p[0], p[1], 19, (on ? (i === last ? "fa" : "fsoft") : "box") + " hot"), "p" + i) + label(p[0], p[1] + 6, name(cfg, i), i === last ? "inv" : "b"); }
    if (!rows.length) h += G.he(R, 40, "לחץ על " + cfg.node + " בציור", "m", "right");
    rows.forEach(([v, all, fr], t) => { h += G.he(R, 34 + t * 28, cfg.node + " " + name(cfg, v) + ": " + all + " " + cfg.unit + ", חדשים: " + fr, v === last ? "a" : "", "right"); });
    const H = Math.max(300, 34 + rows.length * 28 + 30);
    h += G.he(R, H - 12, cfg.unit + " שונים על הציור: " + total, "b", "right");
    return { svg: h, height: H };
  }

  function mini(cfg, spec, cx, cy, r, cls) {
    const n = cfg.n, P = i => pos(n, i, cx, cy, r); let h = "";
    if (cfg.mode === "diag") h += G.poly([...Array(n)].map((_, i) => P(i)), spec.set === "sides" || spec.set === "full" ? "mut" : "thin");
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const d = Math.min(j - i, n - j + i), ok = spec.set === "full" ? true : spec.set === "diag" ? d > 1 : spec.set === "sides" ? d === 1 : spec.set === "short" ? d === 2 : false;
      if (!ok) continue;
      const a = P(i), b = P(j), L = Math.hypot(b[0] - a[0], b[1] - a[1]), ox = -(b[1] - a[1]) / L * 2.2, oy = (b[0] - a[0]) / L * 2.2;
      const c = cfg.mode === "diag" && spec.set === "full" && d === 1 ? "sa" : cls;
      if (spec.double) h += G.line(a[0] + ox, a[1] + oy, b[0] + ox, b[1] + oy, c, { "stroke-width": 1.6 }) + G.line(a[0] - ox, a[1] - oy, b[0] - ox, b[1] - oy, c, { "stroke-width": 1.6 });
      else h += G.line(a[0], a[1], b[0], b[1], c, { "stroke-width": 2 });
    }
    for (let i = 0; i < n; i++) {
      const p = P(i), q = pos(n, i, cx, cy, r + 13);
      if (spec.self) h += G.circle(q[0], q[1], 9, cls, { "stroke-width": 1.6 });
      h += G.circle(p[0], p[1], 5, "dot");
    }
    return h;
  }

  Boards["prb-comb-pairs"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh());
      const render = () => { const d = draw(st, cfg); ui.set({ height: d.height, svg: d.svg, tools: [{ label: "↺ מההתחלה", op: "reset", quiet: true }] }); };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "נקודות על מעגל וקווים ביניהן",
        onTap(key) { const i = +key.slice(1), k = st.order.indexOf(i); if (k >= 0) st.order.splice(k, 1); else st.order.push(i); render(); },
        onOp() { kit.reset(st, fresh()); render(); },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen) || !C.rows[chosen]) { host.innerHTML = ""; return; }
      let h = "";
      [[C.rows[chosen], "chosen", "sa"], [C.rows[correct], "correct", "sok"]].forEach(([r, kind, cls], i) => {
        const y = i * 186;
        h += kit.rowTitle(R, y + 24, kind) + mini(cfg, r, 520, y + 110, r.self ? 46 : 62, kind === "chosen" ? "mut" : cls);
        r.cap.forEach((c, k) => { h += G.he(410, y + 84 + k * 28, c, k ? "m" : "b", "right"); });
        if (!i) h += G.line(30, 186, R, 186, "dash");
      });
      kit.compare(host, { height: 372, svg: h, note: (cfg.notes || {})[chosen] });
    },
  };
})();
