/* board-eq-scan.js — "substitute and look": an x slider on a number line, the two sides of the equation as live columns.
   Every x where the columns are equal stays marked on the line, so solutions can be counted / summed / checked against a condition.
   cfg: { type:"eq-scan", tip, lo, hi, start, L:{t, p:[poly,...], d?:poly}, R:{...}   (side value = product of polys / d; poly = [c0,c1,c2..]),
          span?:[min,max] (clip the column scale), cond?:{lt|gt:number, t:"x < 0"}, sum?:true,
          compare:{ sets:[ per option: [x,...] | "all" ], caps:[per option] }, notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, X0 = 50, X1 = 590, LY = 306, TOP = 62, AH = 150;
  const ev = (p, x) => p.reduce((s, c, i) => s + c * Math.pow(x, i), 0);
  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
  const val = (s, x) => { let n = s.p.reduce((a, p) => a * ev(p, x), 1), d = s.d ? ev(s.d, x) : 1; if (!d) return null; if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return { n: n / g, d: d / g, v: n / d }; };
  const nf = v => (v < 0 ? "−" : "") + pf(Math.abs(v));
  const show = r => (r.n < 0 ? "−" : "") + (r.d === 1 ? pf(Math.abs(r.n)) : Math.abs(r.n) + "/" + r.d);
  const same = (a, b) => !!a && !!b && a.n === b.n && a.d === b.d;
  const fresh = cfg => ({ init: 1, x: cfg.start, seen: { [cfg.start]: 1 } });
  const okc = (cfg, v) => !cfg.cond || (cfg.cond.lt !== undefined ? v < cfg.cond.lt : v > cfg.cond.gt);
  const PX = (cfg, v) => X0 + (v - cfg.lo) * (X1 - X0) / (cfg.hi - cfg.lo);
  const sols = cfg => { const a = []; for (let v = cfg.lo; v <= cfg.hi; v++) if (same(val(cfg.L, v), val(cfg.R, v))) a.push(v); return a; };

  function axis(cfg, y, labels) {
    let h = "";
    if (cfg.cond) {
      const b = cfg.cond.lt !== undefined ? cfg.cond.lt : cfg.cond.gt, xa = cfg.cond.lt !== undefined ? X0 - 22 : PX(cfg, b), xb = cfg.cond.lt !== undefined ? PX(cfg, b) : X1 + 22;
      h += G.rect(xa, y - 20, xb - xa, 40, "fsoft", { rx: 8, "stroke-width": 0 }) + G.he((xa + xb) / 2, y - 28, "התנאי: " + ltr(cfg.cond.t), "a");
    }
    h += G.line(X0 - 22, y, X1 + 22, y, "mut");
    for (let v = cfg.lo; v <= cfg.hi; v++) h += G.line(PX(cfg, v), y - 6, PX(cfg, v), y + 6, "mut") + (labels ? G.t(PX(cfg, v), y + 34, nf(v), "m") : "");
    return h;
  }

  function draw(st, cfg) {
    const l = val(cfg.L, st.x), r = val(cfg.R, st.x), eq = same(l, r);
    let lo = 0, hi = 0;
    if (cfg.span) [lo, hi] = cfg.span; else for (let v = cfg.lo; v <= cfg.hi; v++) for (const s of [cfg.L, cfg.R]) { const q = val(s, v); if (q) { lo = Math.min(lo, q.v); hi = Math.max(hi, q.v); } }
    const k = AH / (hi - lo || 1), base = TOP + hi * k;
    let h = G.t(320, 30, cfg.L.t + " = " + cfg.R.t, "big") + G.line(190, base, 450, base, "ink");
    [[l, 215, cfg.L.t, "fblue", "blue"], [r, 335, cfg.R.t, "fa", "a"]].forEach(([q, x, t, cls, tc]) => {
      h += G.t(x + 45, TOP + AH + 40, t, tc);
      if (!q) { h += G.he(x + 45, base - 10, "לא מוגדר", "w"); return; }
      const v = Math.max(lo, Math.min(hi, q.v)), top = v >= 0 ? base - v * k : base, hh = Math.abs(v) * k;
      h += G.rect(x, top, 90, hh, cls) + G.t(x + 45, v >= 0 ? top - 8 : base + hh + 20, show(q), "b");
    });
    h += G.t(100, 130, "x = " + nf(st.x), "big") + (eq ? G.he(540, 130, "שווים!", "ok big") : G.t(540, 132, "≠", "big"));
    h += axis(cfg, LY, true);
    const found = [];
    for (let v = cfg.lo; v <= cfg.hi; v++) if (st.seen[v]) {
      const hit = same(val(cfg.L, v), val(cfg.R, v)); if (hit) found.push(v);
      h += hit ? G.circle(PX(cfg, v), LY, 11, okc(cfg, v) ? "fok" : "fwarn") : G.circle(PX(cfg, v), LY, 4, "mut");
    }
    h += G.knob(PX(cfg, st.x), LY, "x", 15);
    let msg = "גרור את הנקודה ובדוק מתי שני העמודים שווים", cls = "m";
    if (found.length) {
      cls = "ok"; msg = "פתרונות שמצאת: " + ltr(found.map(nf).join(" , "));
      if (cfg.sum) msg += " · סכומם: " + ltr(nf(found.reduce((a, b) => a + b, 0)));
      if (cfg.cond) { const g = found.filter(v => okc(cfg, v)); msg += " · מקיימים את התנאי: " + (g.length ? ltr(g.map(nf).join(" , ")) : "אף אחד עדיין"); }
    }
    h += G.he(612, LY + 66, msg, cls, "right");
    return { svg: h, height: LY + 82 };
  }

  Boards["eq-scan"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const go = v => { st.x = Math.max(cfg.lo, Math.min(cfg.hi, v)); st.seen[st.x] = 1; };
      const render = () => {
        const d = draw(st, cfg);
        ui.set({ height: d.height, svg: d.svg, tools: [{ label: ltr("x − 1"), op: "dec", disabled: st.x <= cfg.lo }, { label: ltr("x + 1"), op: "inc", disabled: st.x >= cfg.hi }, { label: "↺ מההתחלה", op: "reset", quiet: true }] });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "ציר מספרים להצבת x ושני עמודים לשני האגפים",
        onDrag(key, pt) { go(Math.round((pt.x - X0) / ((X1 - X0) / (cfg.hi - cfg.lo))) + cfg.lo); render(); },
        dragFrom(pt) { return Math.abs(pt.y - LY) < 34 ? "x" : null; },
        onOp(op) { if (op === "reset") kit.reset(st, fresh(cfg)); else go(st.x + (op === "inc" ? 1 : -1)); render(); },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      let h = "";
      [[chosen, "chosen", "fwarn", "w"], [correct, "correct", "fok", "ok"]].forEach(([j, kind, fc, tc], i) => {
        const y = 62 + i * 138, set = C.sets[j];
        h += kit.rowTitle(612, y - 38, kind) + axis(cfg, y, true);
        if (set === "all") h += G.rect(X0 - 22, y - 8, X1 - X0 + 44, 16, fc, { rx: 8 });
        else set.forEach(v => { h += G.circle(PX(cfg, v), y, 11, fc); });
        h += G.he(612, y + 62, C.caps[j], "m", "right");
      });
      kit.compare(host, { height: 280, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה על הציר" });
    },
  };
})();
