/* board-prb-blocks.js — ratio blocks ("2x and 3x"): every row is a number of equal blocks; the learner sets how much one
   block is worth and reads the amounts, the difference, the total and the ratio off the drawing.
   A row may also carry an extra piece that is NOT a block: a fixed amount ("+6") or an amount the learner sets.
   cfg: { type:"prb-blocks", W (block width), rows:[{label, n, extra?:"fixed"|"adj"}], x:{min,max,start,label},
          extra?:{fixed:6} | {min,max,start,label}, afterLabel, unit?,
          lines:[ text templates ] with {r0} {r1} (amounts incl. extras) {b0} {b1} (blocks only) {sum} {bsum} {diff} {ratio} {times} {x} {e},
          tip, compare:{ x:[block value per option], e?:[extra per option], cap: template }, notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, R = 620, SX0 = 60, SX1 = 400, H = 44, ROW = 96;
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const exact = v => Math.abs(v * 100 - Math.round(v * 100)) < 1e-9 || Math.abs(v * 3 - Math.round(v * 3)) < 1e-9;
  const num = v => ltr((exact(v) ? "" : "≈") + pf(v));
  const fresh = cfg => ({ init: true, x: cfg.x.start, e: cfg.extra && cfg.extra.fixed === undefined ? cfg.extra.start : 0 });
  const ev = (cfg, st) => !cfg.extra ? 0 : cfg.extra.fixed !== undefined ? cfg.extra.fixed : st.e;
  function vals(cfg, st) {
    const e = ev(cfg, st), b = cfg.rows.map(r => r.n * st.x), r = cfg.rows.map((q, i) => b[i] + (q.extra ? e : 0));
    const int = r.every(Number.isInteger), g = int ? gcd(r[0], r[1]) : 1;
    return { x: num(st.x), e: num(e), b0: num(b[0]), b1: num(b[1]), r0: num(r[0]), r1: num(r[1]), sum: num(r[0] + r[1]), bsum: num(b[0] + b[1]), diff: num(Math.abs(r[1] - r[0])),
      ratio: ltr(int && g > 1 ? `${r[0]}:${r[1]} = ${r[0] / g}:${r[1] / g}` : `${pf(r[0])}:${pf(r[1])}`), times: num(Math.max(r[0], r[1]) / Math.min(r[0], r[1])) };
  }
  const tpl = (t, v) => t.replace(/\{(\w+)\}/g, (m, k) => v[k]);
  function drawRows(cfg, st, y0, cls) {
    const e = ev(cfg, st), W = cfg.W; let h = "";
    cfg.rows.forEach((r, i) => {
      const y = y0 + i * ROW, has = r.extra && e > 0;
      h += G.he(R, y, `${r.label}: ${num(r.n * st.x)}${cfg.unit ? " " + cfg.unit : ""}` + (has ? ` · ${cfg.afterLabel}: ${num(r.n * st.x + e)}` : ""), "b", "right");
      for (let k = 0; k < r.n; k++) h += G.rect(R - (k + 1) * W, y + 12, W, H, cls || "fsoft") + G.t(R - (k + .5) * W, y + 40, num(st.x), "m");
      if (has) {
        const w = e / st.x * W, x = R - r.n * W - w;
        h += G.rect(x, y + 12, w, H, "fok-soft");
        h += w >= 50 ? G.t(x + w / 2, y + 40, "+" + num(e), "ok") : G.t(x - 8, y + 40, "+" + num(e), "ok", "end");
      }
    });
    return h;
  }
  const sx = (a, t) => SX0 + (SX1 - SX0) * (t - a.min) / (a.max - a.min);
  function slider(a, val, y, key) {
    let h = G.line(SX0, y, SX1, y, "mut");
    for (let t = a.min; t <= a.max; t++) h += G.line(sx(a, t), y - 4, sx(a, t), y + 4, "thin");
    return h + G.t(SX0 - 26, y + 6, a.min, "m") + G.t(SX1 + 28, y + 6, a.max, "m") + G.he(R, y + 7, `${a.label}: ${val}`, "b", "right") + G.knob(sx(a, val), y, key, 15);
  }

  Boards["prb-blocks"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const adj = cfg.extra && cfg.extra.fixed === undefined, ys = {};
      const render = () => {
        let h = drawRows(cfg, st, 26), y = 26 + cfg.rows.length * ROW + 8; const v = vals(cfg, st);
        cfg.lines.forEach(t => { h += G.he(R, y, tpl(t, v), "a", "right"); y += 32; });
        y += 14; ys.x = y; h += slider(cfg.x, st.x, y, "sx");
        if (adj) { y += 46; ys.e = y; h += slider(cfg.extra, st.e, y, "se"); }
        ui.set({ height: y + 30, svg: h, tools: [{ label: "↺ מההתחלה", op: "reset", quiet: true }] });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "משבצות יחס",
        onDrag(key, pt) { const a = key === "sx" ? cfg.x : cfg.extra; st[key[1]] = Math.max(a.min, Math.min(a.max, Math.round(a.min + (pt.x - SX0) / (SX1 - SX0) * (a.max - a.min)))); render(); },
        dragFrom(pt) { if (pt.x < SX0 - 20 || pt.x > SX1 + 20) return null; return Math.abs(pt.y - ys.x) < 20 ? "sx" : adj && Math.abs(pt.y - ys.e) < 20 ? "se" : null; },
        onOp() { kit.reset(st, fresh(cfg)); render(); },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const rh = cfg.rows.length * ROW + 62; let h = "";
      [[chosen, "chosen", "fwarn"], [correct, "correct", "fok-soft"]].forEach(([j, kind, cls], i) => {
        const y = 24 + i * rh, s = { x: C.x[j], e: C.e ? C.e[j] : 0 };
        h += kit.rowTitle(R, y, kind) + drawRows(cfg, s, y + 32, cls) + G.he(R, y + 32 + cfg.rows.length * ROW, tpl(C.cap, vals(cfg, s)), "m", "right");
      });
      kit.compare(host, { height: 2 * rh - 4, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה על המשבצות" });
    },
  };
})();
