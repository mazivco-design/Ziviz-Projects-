/* board-prb-prob-space.js — the sample space as equally likely cells; tap the wanted ones, read "רצוי / מצוי".
   Row layout:  cells:[{t?, ball?:cls}], label?, pre?:{label, items:[str]}
   Grid layout: grid:{ rows:[{t?, ball?}], cols:[..], rowTitle, colTitle, show:"pair"|"sum"|"balls", noDiag? }
   tally?:[{sum, text}] (grid with sums: counts marked cells per sum, first in accent, second in blue)
   cfg: { type:"prb-prob-space", tip, ..., compare:{ single?, rows:{ optionIndex:{ cells:[ids], hot?:[ids], diag?, cap:[lines] } } }, notes }
   Cell ids: row layout "0","1",…; grid "r:c" (0-based). */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, R = 610, NP = { "pointer-events": "none" };
  const fresh = () => ({ init: true, sel: {} });
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const frac = (a, b) => { const g = gcd(a, b) || 1; return a + "/" + b + (a > 0 && g > 1 ? " = " + (b / g === 1 ? a / g : a / g + "/" + b / g) : ""); };
  const isHe = s => /[֐-׿]/.test(s);
  const txt = (x, y, s, cls) => isHe(s) ? G.he(x, y, s, cls, "middle", NP) : G.t(x, y, s, cls, "middle", NP);
  const total = cfg => cfg.grid ? cfg.grid.rows.length * cfg.grid.cols.length - (cfg.grid.noDiag ? cfg.grid.rows.length : 0) : cfg.cells.length;
  const tallyOf = (cfg, id) => { if (!cfg.tally) return -1; const [i, j] = id.split(":").map(Number); return cfg.tally.findIndex(t => t.sum === i + j + 2); };

  // one cell; mark: 0 none, 1 marked, 2 marked-blue, 3 marked-soft, 4 hot (warn)
  function cell(cfg, x, y, w, hgt, id, content, mark, tapKey, small) {
    const balls = content.balls, cls = mark === 4 ? "fwarn" : mark === 0 ? "box" : balls || mark === 3 ? "fsoft" : mark === 2 ? "fblue" : "fa";
    let h = G.rect(x, y, w, hgt, cls + (tapKey ? " hot" : ""), { rx: small ? 3 : 6 }); if (tapKey) h = G.tap(h, tapKey);
    if (balls) {
      const r = small ? 5.5 : balls.length > 1 ? 7 : Math.min(19, w / 2 - 5), cx = x + w / 2, cy = y + hgt / 2;
      balls.forEach((b, k) => { h += G.circle(balls.length > 1 ? cx + (k ? -1 : 1) * (r + 1.5) : cx, cy, r, b, { "stroke-dasharray": "none", ...NP }); });
      if (mark === 1) h += G.rect(x + 1.5, y + 1.5, w - 3, hgt - 3, "sa", { rx: small ? 3 : 6, ...NP });
    } else if (content.t !== undefined && !(small && content.dim)) {
      const c = mark === 1 || mark === 2 ? "inv" : mark ? "b" : small ? "m" : "b";
      h += small ? G.t(x + w / 2, y + hgt / 2 + 4.5, content.t, c, "middle", { style: "font-size:13px", ...NP }) : txt(x + w / 2, y + hgt / 2 + 6, content.t, c);
    }
    return h;
  }
  const gridContent = (g, i, j) => g.show === "balls" ? { balls: [g.rows[i].ball, g.cols[j].ball] } : g.show === "sum" ? { t: String(i + j + 2) } : { t: (i + 1) + "," + (j + 1) };

  function drawGrid(cfg, GR, GY, CW, markOf, tap, withDiag) {
    const g = cfg.grid, N = g.rows.length, M = g.cols.length, small = CW < 34; let h = "";
    const head = (o, cx, cy) => o.ball ? G.circle(cx, cy - 5, small ? 6 : 10, o.ball, { "stroke-dasharray": "none" }) : G.t(cx, cy, o.t, small ? "m" : "b");
    for (let j = 0; j < M; j++) h += head(g.cols[j], GR - j * CW - CW / 2, GY - 9);
    for (let i = 0; i < N; i++) {
      h += head(g.rows[i], GR + (small ? 13 : 18), GY + i * CW + CW / 2 + 6);
      for (let j = 0; j < M; j++) {
        const x = GR - (j + 1) * CW, y = GY + i * CW, id = i + ":" + j;
        if (g.noDiag && i === j && !withDiag) { h += G.rect(x, y, CW, CW, "ghost") + G.line(x + 8, y + 8, x + CW - 8, y + CW - 8, "mut") + G.line(x + CW - 8, y + 8, x + 8, y + CW - 8, "mut"); continue; }
        const c = gridContent(g, i, j); if (small && g.show === "pair") c.dim = true;
        h += cell(cfg, x, y, CW, CW, id, c, markOf(id), tap ? "c" + id : null, small);
      }
    }
    return h;
  }

  function draw(st, cfg) {
    const n = Object.keys(st.sel).length, T = total(cfg); let h = "";
    if (cfg.grid) {
      const g = cfg.grid, CW = 40, GR = 556, GY = 62, M = g.cols.length, N = g.rows.length;
      h += G.he(GR - M * CW / 2, 22, g.colTitle, "m", "middle") + G.he(R + 4, 22, g.rowTitle, "m", "right");
      h += drawGrid(cfg, GR, GY, CW, id => !st.sel[id] ? 0 : !cfg.tally ? 1 : [3, 1, 2][tallyOf(cfg, id) + 1], true);
      const X = GR - M * CW - 34;
      if (cfg.tally) {
        const ids = Object.keys(st.sel), other = ids.filter(id => tallyOf(cfg, id) < 0).length;
        cfg.tally.forEach((t, k) => { const c = ids.filter(id => tallyOf(cfg, id) === k).length; h += G.he(X, 96 + k * 62, t.text, k ? "blue" : "a", "right") + G.he(X, 122 + k * 62, "מסומנים: " + c + " מתוך " + T + " ← " + ltr(c + "/" + T), "", "right"); });
        if (other) h += G.he(X, 230, "תאים עם סכום אחר: " + other, "m", "right");
      } else {
        h += G.he(X, 96, "רצוי (מסומן): " + n, "a", "right") + G.he(X, 124, "מצוי (כל התאים): " + T, "m", "right") + G.t(X, 176, frac(n, T), "a big", "end");
      }
      return { svg: h, height: GY + N * CW + 14 };
    }
    let y = 12;
    if (cfg.pre) {
      h += G.he(R, y + 12, cfg.pre.label, "m", "right");
      cfg.pre.items.forEach((t, i) => { h += G.rect(R - (i + 1) * 62 + 6, y + 22, 56, 34, "ghost", { rx: 17 }) + G.he(R - (i + 1) * 62 + 34, y + 45, t, "m", "middle"); });
      y += 74;
    }
    if (cfg.label) { h += G.he(R, y + 12, cfg.label, "b", "right"); y += 22; }
    const m = cfg.cells.length, w = Math.min(72, Math.floor((580 - (m - 1) * 6) / m)), x0 = cfg.pre ? R - m * (w + 6) + 6 : 320 - (m * (w + 6) - 6) / 2;
    cfg.cells.forEach((c, i) => { const idx = cfg.pre ? m - 1 - i : i; h += cell(cfg, x0 + idx * (w + 6), y, w, 52, String(i), c.ball ? { balls: [c.ball] } : c, st.sel[i] ? 1 : 0, "c" + i); });
    y += 52;
    h += G.he(R, y + 30, "רצוי (מסומן): " + n + " · מצוי: " + T, "b", "right") + G.t(30, y + 32, frac(n, T), "a big", "start");
    return { svg: h, height: y + 46 };
  }

  Boards["prb-prob-space"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh());
      const render = () => { const d = draw(st, cfg); ui.set({ height: d.height, svg: d.svg, tools: [{ label: "↺ מההתחלה", op: "reset", quiet: true }] }); };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "כל התוצאות האפשריות",
        onTap(key) { const id = key.slice(1); if (st.sel[id]) delete st.sel[id]; else st.sel[id] = 1; render(); },
        onOp() { kit.reset(st, fresh()); render(); },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const list = C.single ? [[C.rows[correct], "correct"]] : [[C.rows[chosen] || { cells: [], cap: [] }, "chosen"], [C.rows[correct], "correct"]];
      let h = "", y = 0;
      list.forEach(([r, kind], i) => {
        const set = new Set(r.cells || []), hot = new Set(r.hot || []);
        const mk = id => hot.has(id) ? 4 : !set.has(id) ? 0 : cfg.tally ? [3, 1, 2][tallyOf(cfg, id) + 1] : kind === "chosen" ? 3 : 1;
        if (i) { h += G.line(30, y, R, y, "dash"); }
        h += kit.rowTitle(R, y + 24, kind);
        if (cfg.grid) {
          const CW = cfg.grid.show === "balls" ? 32 : 25, N = cfg.grid.rows.length, M = cfg.grid.cols.length, GR = 584, GY = y + 54;
          h += drawGrid(cfg, GR, GY, CW, mk, false, r.diag);
          r.cap.forEach((c, k) => { h += G.he(GR - M * CW - 24, GY + 30 + k * 30, c, k ? "m" : "b", "right"); });
          y = GY + N * CW + 14;
        } else {
          const m = cfg.cells.length, w = Math.min(60, Math.floor((580 - (m - 1) * 6) / m));
          cfg.cells.forEach((c, k) => { const idx = cfg.pre ? m - 1 - k : k, x0 = cfg.pre ? R - m * (w + 6) + 6 : 320 - (m * (w + 6) - 6) / 2; h += cell(cfg, x0 + idx * (w + 6), y + 36, w, 40, String(k), c.ball ? { balls: [c.ball] } : c, mk(String(k)), null); });
          r.cap.forEach((c, k) => { h += G.he(R, y + 100 + k * 26, c, k ? "m" : "b", "right"); });
          y += 100 + r.cap.length * 26 - 10;
        }
      });
      kit.compare(host, { height: y, svg: h, note: (cfg.notes || {})[chosen] });
    },
  };
})();
