/* board-eq-grid.js — two unknowns: a board of (x, y) points. Tap (or sweep over) points to substitute them;
   points that satisfy the equation stay green, so the SHAPE of the solution set appears.
   cfg: { type:"eq-grid", tip, xr:[lo,hi], yr:[lo,hi], L:{t:"xy", m:{xy:1}}, R:{t:"3y", m:{y:3}}   (m: monomial "xy"|"x"|"y"|"1" -> coefficient),
          compare:{ sets:[ per option: {x?, y?, and?} ], caps:[per option] }, notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, C = 40, GX = 64, GY = 26, NP = { "pointer-events": "none" };
  const nf = v => (v < 0 ? "−" : "") + pf(Math.abs(v));
  const ev = (s, x, y) => (s.m.xy || 0) * x * y + (s.m.x || 0) * x + (s.m.y || 0) * y + (s.m["1"] || 0);
  const fresh = () => ({ init: 1, seen: {}, cur: null });
  const inSet = (s, x, y) => { const t = []; if (s.x !== undefined) t.push(x === s.x); if (s.y !== undefined) t.push(y === s.y); return s.and ? t.every(Boolean) : t.some(Boolean); };

  function grid(cfg, gx, gy, c, cell, labels) {
    const [x0, x1] = cfg.xr, [y0, y1] = cfg.yr; let h = "";
    for (let y = y1; y >= y0; y--) for (let x = x0; x <= x1; x++) h += cell(x, y, gx + (x - x0) * c, gy + (y1 - y) * c);
    if (labels) {
      for (let x = x0; x <= x1; x++) h += G.t(gx + (x - x0 + .5) * c, gy + (y1 - y0 + 1) * c + 20, nf(x), "m");
      for (let y = y0; y <= y1; y++) h += G.t(gx - 10, gy + (y1 - y + .5) * c + 5, nf(y), "m", "end");
      h += G.t(gx + (x1 - x0 + 1) * c + 14, gy + (y1 - y0 + 1) * c + 20, "x", "b") + G.t(gx - 14, gy - 8, "y", "b");
    }
    return h;
  }

  Boards["eq-grid"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh());
      const [x0, x1] = cfg.xr, [y0, y1] = cfg.yr, H = (y1 - y0 + 1) * C;
      const render = () => {
        let n = 0;
        let h = grid(cfg, GX, GY, C, (x, y, px, py) => {
          const k = x + "," + y, seen = st.seen[k], ok = ev(cfg.L, x, y) === ev(cfg.R, x, y), cur = st.cur && st.cur[0] === x && st.cur[1] === y; if (seen && ok) n++;
          return G.tap(G.rect(px, py, C, C, (seen ? (ok ? "fok" : "bg") : "box") + " hot"), k) + (seen ? G.t(px + C / 2, py + C / 2 + 6, ok ? "✓" : "×", ok ? "inv" : "m", "middle", NP) : "")
            + (cur ? G.rect(px + 2, py + 2, C - 4, C - 4, "sa", { rx: 3, "pointer-events": "none" }) : "");
        }, true);
        const px = 500;
        if (!st.cur) h += G.he(px, 90, "לחץ על נקודה בלוח", "m") + G.he(px, 114, "כדי להציב אותה במשוואה", "m");
        else {
          const [x, y] = st.cur, l = ev(cfg.L, x, y), r = ev(cfg.R, x, y);
          h += G.t(px, 58, `x = ${nf(x)} ,  y = ${nf(y)}`, "big") + G.t(px, 100, `${cfg.L.t} = ${nf(l)}`, "blue") + G.t(px, 130, `${cfg.R.t} = ${nf(r)}`, "a")
            + (l === r ? G.he(px, 170, "שווים: הנקודה מקיימת", "ok") : G.he(px, 170, "לא שווים", "w"));
        }
        h += G.he(px, GY + H + 2, n ? "נקודות ירוקות: " + n : "", "m");
        ui.set({ height: GY + H + 36, svg: h, tools: [{ label: "↺ מההתחלה", op: "reset", quiet: true }] });
      };
      const hit = pt => { const x = Math.floor((pt.x - GX) / C) + x0, y = y1 - Math.floor((pt.y - GY) / C); return x >= x0 && x <= x1 && y >= y0 && y <= y1 ? [x, y] : null; };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "לוח נקודות להצבת x ו־y",
        dragFrom(pt) { return hit(pt) ? "paint" : null; },
        onDrag(key, pt) { const p = hit(pt); if (p) { st.cur = p; st.seen[p[0] + "," + p[1]] = 1; render(); } },
        onOp() { kit.reset(st, fresh()); render(); },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      const K = cfg.compare; if (!K || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const c = 28, w = (cfg.xr[1] - cfg.xr[0] + 1) * c, hh = (cfg.yr[1] - cfg.yr[0] + 1) * c; let h = "";
      [[chosen, "chosen", "fwarn", 380], [correct, "correct", "fok", 60]].forEach(([j, kind, fc, gx]) => {
        h += kit.rowTitle(gx + w, 22, kind) + grid(cfg, gx, 36, c, (x, y, px, py) => G.rect(px, py, c, c, inSet(K.sets[j], x, y) ? fc : "box"), true);
        h += G.he(gx + w / 2, 36 + hh + 50, K.caps[j], "m");
      });
      kit.compare(host, { height: 36 + hh + 66, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה על הלוח" });
    },
  };
})();
