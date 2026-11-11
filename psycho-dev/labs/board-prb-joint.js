/* board-prb-joint.js — "compare times" board for joint work: every worker has a row of job-cells on a shared time axis
   (a cell is as wide as the time that worker needs for one whole job). Drag the clock; each row shows how much it did, and the sum.
   cfg: { type:"prb-joint", rows:[{label, verb, p (time per job), sign? (-1 = drains), cls:"fa"|"fblue"|"fwarn", stop? (leaves at this time), gone?}],
          H (axis length), den (snap = 1/den), tUnit, sum:{label, one, part, many}, alone? (label for "time after the stop"), tip,
          compare:{ den, ks:[total time per option, in 1/den] }, notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, X0 = 40, X1 = 470, RY = 74, RS = 64, RH = 44;
  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a), lcm = (a, b) => a / gcd(a, b) * b;
  const GLY = { "1/2": "½", "1/3": "⅓", "2/3": "⅔", "1/4": "¼", "3/4": "¾" };
  const fr = (n, d) => { const g = gcd(n, d) || 1; n /= g; d /= g; if (d === 1) return String(n); const w = Math.floor(n / d), r = n - w * d, f = GLY[r + "/" + d]; return w ? (f ? w + f : w + " " + r + "/" + d) : (f || r + "/" + d); };
  const fresh = () => ({ init: 1, k: 0 });
  // amounts done after k/den time units: [{n,d} per row], total {n,d}
  function done(cfg, k, den) {
    const parts = cfg.rows.map(r => { const ke = r.stop !== undefined ? Math.min(k, r.stop * den) : k; return { n: ke, d: den * r.p }; });
    const L = parts.reduce((a, p) => lcm(a, p.d), 1), n = parts.reduce((s, p, i) => s + (cfg.rows[i].sign || 1) * p.n * (L / p.d), 0);
    return { parts, total: { n, d: L } };
  }
  const soft = { fa: "fsoft", fblue: "fblue-soft", fwarn: "fwarn" };

  function draw(st, cfg) {
    const t = st.k / cfg.den, D = done(cfg, st.k, cfg.den), X = v => X0 + (X1 - X0) * v / cfg.H, ay = RY + cfg.rows.length * RS;
    let h = G.he(30, 24, `זמן: ${pf(t)} ${cfg.tUnit}`, "b", "left");
    const tn = D.total.n, td = D.total.d, S = cfg.sum;
    h += G.he(612, 24, `${S.label}: ` + (tn === td ? S.one : tn < td ? `${ltr(fr(tn, td))} ${S.part}` : `${ltr(fr(tn, td))} ${S.many}`), tn === td ? "ok" : "b", "right");
    cfg.rows.forEach((r, i) => {
      const y = RY + i * RS, end = r.stop !== undefined ? r.stop : cfg.H, te = Math.min(t, end);
      for (let k = 0; k * r.p < end - 1e-9; k++) {
        const a = k * r.p, b = Math.min(end, (k + 1) * r.p), full = te >= (k + 1) * r.p - 1e-9;
        h += G.rect(X(a), y, X(b) - X(a), RH, "ghost");
        if (te > a) h += G.rect(X(a), y, X(Math.min(te, b)) - X(a), RH, full ? r.cls : soft[r.cls]);
        if (full && X(b) - X(a) >= 26) h += G.t((X(a) + X(b)) / 2, y + 28, k + 1, r.cls === "fwarn" ? "w" : "inv");
      }
      if (r.stop !== undefined) h += G.line(X(end), y - 6, X(end), y + RH + 6, "ink") + G.he(X(end) + 10, y + 28, r.gone, "m", "left");
      h += G.he(612, y + 18, r.label, "b", "right") + G.he(612, y + 40, `${r.verb}: ${ltr(fr(D.parts[i].n, D.parts[i].d))}`, r.cls === "fa" ? "a" : r.cls === "fblue" ? "blue" : "w", "right");
    });
    const st0 = cfg.rows.find(r => r.stop !== undefined);
    if (st0 && t > st0.stop) h += G.he(30, 50, `${cfg.alone}: ${pf(t - st0.stop)} ${cfg.tUnit}`, "a", "left");
    h += G.line(X0, ay, X1, ay, "ink");
    for (let v = 0; v <= cfg.H; v++) h += G.line(X(v), ay, X(v), ay + 7, "thin") + G.t(X(v), ay + 22, v, "m");
    h += G.he(612, ay + 22, cfg.tUnit, "m", "right");
    h += G.line(X(t), RY - 8, X(t), ay + 30, "sa") + G.knob(X(t), ay + 46, "t", 15);
    return { svg: h, height: ay + 68 };
  }

  Boards["prb-joint"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh());
      const render = () => { const d = draw(st, cfg); ui.set({ height: d.height, svg: d.svg, tools: [{ label: "↺ מההתחלה", op: "reset", quiet: true }] }); };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "פסי עבודה על ציר זמן",
        dragFrom: pt => pt.y > RY - 10 ? "t" : null,
        onDrag(key, pt) { st.k = Math.max(0, Math.min(cfg.H * cfg.den, Math.round((pt.x - X0) / (X1 - X0) * cfg.H * cfg.den))); render(); },
        onOp() { kit.reset(st, fresh()); render(); },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const R = 610, L = 30, val = p => p.n / p.d, st0 = cfg.rows.find(r => r.stop !== undefined);
      const rows = [[chosen, "chosen"], [correct, "correct"]].map(([j, kind]) => ({ kind, k: C.ks[j], D: done(cfg, C.ks[j], C.den) }));
      const pos = r => r.D.parts.reduce((s, p, i) => s + ((cfg.rows[i].sign || 1) > 0 ? val(p) : 0), 0), u = (R - L) / (Math.max(1, ...rows.map(pos)) * 1.03);
      let h = "";
      rows.forEach((r, i) => {
        const y = 30 + i * 100, t = r.k / C.den; let x = L, cap = [];
        h += kit.rowTitle(R, y - 10, r.kind) + G.rect(L, y, R - L, 40, "bg", { rx: 4 });
        r.D.parts.forEach((p, q) => {
          const row = cfg.rows[q], w = val(p) * u, neg = (row.sign || 1) < 0;
          if (neg) h += G.rect(x - w, y, w, 40, "fwarn"); else { h += G.rect(x, y, w, 40, row.cls); x += w; }
          cap.push((q ? (neg ? " − " : " + ") : "") + `${row.short || row.label} ${ltr(fr(p.n, p.d))}`);
        });
        h += G.line(L + u, y - 6, L + u, y + 46, "dash");
        const pre = st0 ? `${cfg.alone} ${pf(t - st0.stop)} ${cfg.tUnit}` : `ב־${pf(t)} ${cfg.tUnit}`;
        h += G.he(R, y + 64, `${pre}: ${cap.join("")} = ${ltr(fr(r.D.total.n, r.D.total.d))}`, "m", "right");
      });
      kit.compare(host, { height: 204, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה: כמה עבודה נעשתה (הקו המקווקו = עבודה שלמה)" });
    },
  };
})();
