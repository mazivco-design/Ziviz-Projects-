/* board-prb-strip.js — overlap strip: a strip of N units, group A fixed on the right (pink bracket), group B draggable
   (blue bracket). Four live boxes: only A | both | only B | neither.
   cfg: { type:"prb-strip", N, A, B, step?(1), s0 (start offset of B from the right), la, lb (bracket labels), sa, sb (short names
          for "רק ..."), unit?("%"), den?(values are k/den fractions), noTotal?(no "neither"; strip = union only), totalLabel?,
          given?{k:"oa"|"both"|"ob"|"nn", v}, tip,
          compare:[per option {s, hl:[keys], cap}] (cap tokens: {oa} {both} {ob} {nn} {over} {union} {hl}; [[..]] = keep LTR), notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, X0 = 40, X1 = 600, BY = 56, BH = 44;
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const val = (cfg, v) => { if (cfg.den) { if (!v) return "0"; const g = gcd(Math.abs(v), cfg.den); return cfg.den / g === 1 ? String(v / g) : (v / g) + "/" + (cfg.den / g); } return pf(v) + (cfg.unit || ""); };
  const fresh = cfg => ({ init: 1, s: cfg.s0 });
  const counts = (cfg, s) => { const both = Math.max(0, Math.min(cfg.A, s + cfg.B) - s), over = Math.max(0, s + cfg.B - cfg.N); return { both, oa: cfg.A - both, ob: cfg.B - both, nn: Math.max(0, cfg.N - cfg.A - cfg.B + both), over, union: cfg.A + cfg.B - both }; };
  const cat = (cfg, s, a) => { const inA = a < cfg.A, inB = a >= s && a < s + cfg.B; return a >= cfg.N ? "over" : inA && inB ? "both" : inA ? "oa" : inB ? "ob" : "nn"; };
  const FILL = { both: "fa", oa: "fsoft", ob: "fblue-soft", nn: "box" };
  const smax = cfg => cfg.noTotal ? Math.min(cfg.A, cfg.N - cfg.B) : cfg.N - cfg.B;
  const names = cfg => ({ oa: "רק " + cfg.sa, both: cfg.nb || "גם וגם", ob: "רק " + cfg.sb, nn: cfg.nn || "לא ולא" });

  function draw(st, cfg) {
    const u = (X1 - X0) / cfg.N, step = cfg.step || 1, c = counts(cfg, st.s), end = cfg.noTotal ? Math.max(cfg.A, st.s + cfg.B) : cfg.N;
    let h = "";
    for (let a = 0; a < end; a += step) h += G.rect(X1 - (a + step) * u, BY, step * u, BH, FILL[cat(cfg, st.s, a)], { style: "stroke:none" });
    for (let a = step; a < end; a += step) { const x = X1 - a * u; h += G.line(x, BY, x, BY + BH, "mut", { opacity: .35 }); }
    h += G.rect(X1 - end * u, BY, end * u, BH, "ink");
    if (!cfg.noTotal) h += G.he(X0, BY - 26, cfg.totalLabel || "סה״כ: " + ltr(val(cfg, cfg.N)), "m", "left");
    const ax = X1 - cfg.A * u;
    h += G.line(ax, BY - 14, X1, BY - 14, "sa") + G.line(ax, BY - 14, ax, BY - 5, "sa") + G.line(X1, BY - 14, X1, BY - 5, "sa");
    h += G.he((ax + X1) / 2, BY - 26, cfg.la + ": " + ltr(val(cfg, cfg.A)), "a");
    const bx1 = X1 - st.s * u, bx0 = X1 - (st.s + cfg.B) * u, by = BY + BH + 16, cx = (bx0 + bx1) / 2;
    h += G.line(bx0, by, bx1, by, "sblue") + G.line(bx0, by, bx0, by - 10, "sblue") + G.line(bx1, by, bx1, by - 10, "sblue");
    h += G.he(cx, by + 42, cfg.lb + ": " + ltr(val(cfg, cfg.B)), "blue") + G.knob(cx, by + 2, "B", 15);
    const nm = names(cfg), keys = cfg.noTotal ? ["oa", "both", "ob"] : ["oa", "both", "ob", "nn"], bw = 132, gap = 8, y0 = BY + BH + 78;
    keys.forEach((k, j) => {
      const x = X1 - (j + 1) * bw - j * gap;
      h += G.rect(x, y0, bw, 58, FILL[k], { rx: 8 }) + G.he(x + bw / 2, y0 + 21, nm[k], k === "both" ? "inv" : "m") + G.t(x + bw / 2, y0 + 48, val(cfg, c[k]), k === "both" ? "inv big" : "big");
      if (cfg.given && cfg.given.k === k) h += c[k] === cfg.given.v ? G.he(x + bw / 2, y0 + 78, "✓ כמו בשאלה", "ok") : G.he(x + bw / 2, y0 + 78, "לפי השאלה: " + ltr(val(cfg, cfg.given.v)), "m");
    });
    return { svg: h, height: y0 + (cfg.given ? 90 : 68) };
  }

  Boards["prb-strip"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const u = (X1 - X0) / cfg.N, step = cfg.step || 1;
      const render = () => { const d = draw(st, cfg); ui.set({ height: d.height, svg: d.svg, tools: [{ label: "↺ מההתחלה", op: "reset", quiet: true }] }); };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "פס חפיפה לפתרון השאלה",
        onOp(op) { if (op === "reset") kit.reset(st, fresh(cfg)); render(); },
        onDrag(key, pt) { st.s = Math.max(0, Math.min(smax(cfg), Math.round(((X1 - pt.x) / u - cfg.B / 2) / step) * step)); render(); },
        dragFrom(pt) { const bx1 = X1 - st.s * u, bx0 = X1 - (st.s + cfg.B) * u; return pt.y > BY && pt.y < BY + BH + 44 && pt.x > bx0 - 8 && pt.x < bx1 + 8 ? "B" : null; },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen) || !C[chosen] || !C[correct]) { host.innerHTML = ""; return; }
      const rows = [[C[chosen], "chosen", "fwarn"], [C[correct], "correct", "fok"]], step = cfg.step || 1, cx0 = 30, cx1 = 610;
      const max = Math.max(cfg.N, ...rows.map(r => r[0].s + cfg.B)), u = (cx1 - cx0) / max;
      let h = "";
      rows.forEach(([sp, kind, fc], i) => {
        const y = 26 + i * 126, ys = y + 22, c = counts(cfg, sp.s), hl = sp.hl || [], end = Math.max(cfg.noTotal ? Math.max(cfg.A, sp.s + cfg.B) : cfg.N, sp.s + cfg.B);
        h += kit.rowTitle(cx1, y - 6, kind);
        const segs = [];
        for (let a = 0; a < end; a += step) {
          const k = cat(cfg, sp.s, a), x = cx1 - (a + step) * u, on = hl.includes(k);
          if (cfg.noTotal && k === "nn") continue;
          h += G.rect(x, ys, step * u, 30, k === "over" ? "fwarn" : on ? fc : FILL[k], k === "both" && !on ? { style: "stroke:none", opacity: .45 } : { style: "stroke:none" });
          if (on) { const L = segs[segs.length - 1]; if (L && L.k === k && L.b === a) L.b = a + step; else segs.push({ k, a, b: a + step }); }
        }
        if (!cfg.noTotal) h += G.rect(cx1 - cfg.N * u, ys, cfg.N * u, 30, "ink");
        if (c.over) { const ox = cx1 - cfg.N * u; h += G.rect(cx1 - end * u, ys, c.over * u, 30, "fwarn") + G.line(ox, ys - 8, ox, ys + 38, "dash"); }
        segs.forEach(s => { const w = (s.b - s.a) * u; if (w >= 30) h += G.t(cx1 - (s.a + s.b) / 2 * u, ys + 20, val(cfg, s.b - s.a), kind === "correct" ? "inv" : "b"); });
        const ax = cx1 - cfg.A * u, bx1 = cx1 - sp.s * u, bx0 = cx1 - (sp.s + cfg.B) * u;
        h += G.line(ax, ys - 7, cx1, ys - 7, "sa") + G.line(bx0, ys + 37, bx1, ys + 37, "sblue");
        h += G.he(ax - 8, ys - 2, cfg.sa, "a", "right");
        h += bx0 - cx0 > 90 ? G.he(bx0 - 8, ys + 42, cfg.sb, "blue", "right") : G.he(bx1 + 8, ys + 42, cfg.sb, "blue", "left");
        const sum = hl.reduce((s, k) => s + c[k], 0);
        const cap = (sp.cap || "").replace(/\{(\w+)\}/g, (m, k) => val(cfg, k === "hl" ? sum : c[k])).replace(/\[\[(.+?)\]\]/g, (m, t) => ltr("\u200e" + t));
        h += G.he(cx1, ys + 72, cap, "m", "right");
      });
      kit.compare(host, { height: 264, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה על הפס" });
    },
  };
})();
