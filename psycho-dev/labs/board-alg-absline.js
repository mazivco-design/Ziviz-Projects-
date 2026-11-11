/* board-alg-absline.js — absolute value as a distance on the number line (topic alg-inequalities-abs).
   Draggable points; each one shows a bracket with its distance from the centre. A readout combines them.
   cfg: { type:"alg-absline", tip, range:[lo,hi], center, pts:["A","B"], init:[..], target? (distance that makes a point a solution),
          readout:"sum" (A + B) | "absdiff" (|A| − |B|),
          cmp:{ kind:"pts"|"hops", opts:{optionIndex:{pts:[..] | hops:[..], cap}} }, notes:{optionIndex: text} } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr } = kit, XL = 34, XR = 606;
  const HALO = { style: "paint-order:stroke;stroke:var(--sheet);stroke-width:6px;stroke-linejoin:round", "pointer-events": "none" };
  const NP = { "pointer-events": "none" };
  const num = v => (v < 0 ? "−" : "") + Math.abs(v), par = v => v < 0 ? "(" + num(v) + ")" : num(v);
  const geom = cfg => { const [lo, hi] = cfg.range, U = (XR - XL) / (hi - lo); return { lo, hi, U, P: v => XL + (v - lo) * U }; };
  const absLab = (n, c) => c === 0 ? "|" + n + "|" : "|" + n + (c > 0 ? " − " + c : " + " + (-c)) + "|";
  function axis(g, y, c) {
    let h = G.line(XL - 16, y, XR + 16, y, "ink");
    for (let k = g.lo; k <= g.hi; k++) { const z = k === 0 || k === c; h += G.line(g.P(k), y - (z ? 9 : 5), g.P(k), y + (z ? 9 : 5), z ? "ink" : "thin"); if (k % 2 === 0 || k === c) h += G.t(g.P(k), y + 24, num(k), z ? "b" : "m", "middle", HALO); }
    return h;
  }
  // distance bracket between the centre and v, drawn at height y
  function bracket(g, y, ax, c, v, label, cls, tc) {
    const a = g.P(c), b = g.P(v), mid = Math.max(100, Math.min(540, (a + b) / 2));
    return G.line(a, y, a, ax, "dash", NP) + G.line(b, y, b, ax, "dash", NP) + (a !== b ? G.line(a, y, b, y, cls, NP) : "") +
      G.line(a, y - 6, a, y + 6, cls, NP) + G.line(b, y - 6, b, y + 6, cls, NP) + G.t(mid, y - 10, label, tc, "middle", HALO);
  }
  const fresh = cfg => ({ init: true, v: cfg.init.slice(), t: cfg.pts.map(() => false) });
  const layout = cfg => { const n = cfg.pts.length, BY = i => 44 + i * 36, AX = 44 + n * 36, KY = i => AX + 56 + i * 38; return { BY, AX, KY, RY: KY(n - 1) + 52, height: KY(n - 1) + 68 }; };

  function draw(st, cfg) {
    const g = geom(cfg), L = layout(cfg), c = cfg.center; let h = "";
    cfg.pts.forEach((n, i) => { const x = g.P(st.v[i]); h += G.line(x, L.AX, x, L.KY(i), "sa", NP); });
    h += axis(g, L.AX, c);
    cfg.pts.forEach((n, i) => {
      const d = Math.abs(st.v[i] - c), hit = cfg.target !== undefined && d === cfg.target;
      h += bracket(g, L.BY(i), L.AX, c, st.v[i], absLab(n, c) + " = " + d + (hit ? "  ✓" : ""), hit ? "sok" : "sblue", hit ? "ok" : "blue");
    });
    h += G.circle(g.P(c), L.AX, 5, "dot", NP);
    cfg.pts.forEach((n, i) => { const x = g.P(st.v[i]), r = x > 470; h += G.circle(x, L.AX, 5, "fa", NP) + G.knob(x, L.KY(i), "p" + i, 15) + G.t(r ? x - 24 : x + 24, L.KY(i) + 6, n + " = " + num(st.v[i]), "a", r ? "end" : "start", HALO); });
    const [a, b] = st.v, [A, B] = cfg.pts;
    if (!st.t.every(Boolean)) h += G.he(320, L.RY, "הזז את שתי הנקודות כדי לראות את החישוב", "m", "middle");
    else if (cfg.target !== undefined && a === b) h += G.he(320, L.RY, "שתי הנקודות על אותו מקום. הפרד ביניהן.", "m", "middle");
    else if (cfg.readout === "sum") h += G.t(320, L.RY, A + " + " + B + " = " + num(a) + " + " + par(b) + " = " + num(a + b), "big", "middle");
    else h += G.t(320, L.RY, absLab(A, c) + " − " + absLab(B, c) + " = " + Math.abs(a - c) + " − " + Math.abs(b - c) + " = " + num(Math.abs(a - c) - Math.abs(b - c)), "big", "middle");
    return { svg: h, height: L.height };
  }

  Boards["alg-absline"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const g = geom(cfg), L = layout(cfg);
      const render = () => { const d = draw(st, cfg); ui.set({ height: d.height, svg: d.svg, tools: [{ label: "↺ מההתחלה", op: "reset", quiet: true }] }); };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "ציר מספרים עם מרחקים",
        onDrag(key, pt) { const i = +key.slice(1); st.v[i] = Math.max(g.lo, Math.min(g.hi, Math.round((pt.x - XL) / g.U + g.lo))); st.t[i] = true; render(); },
        dragFrom(pt) { for (let i = 0; i < cfg.pts.length; i++) if (Math.abs(pt.y - L.KY(i)) <= 18) return "p" + i; return null; },
        onOp(op) { if (op === "reset") kit.reset(st, fresh(cfg)); render(); },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      const C = cfg.cmp; if (!C || chosen === correct || chosen === undefined || chosen === null || isNaN(chosen)) { host.innerHTML = ""; return; }
      const g = geom(cfg), c = cfg.center; let h = "", y = 26;
      [[chosen, "chosen"], [correct, "correct"]].forEach(([j, kind]) => {
        const o = C.opts[j], items = o.pts || o.hops, ax = y + 30 + items.length * 34, warn = kind === "chosen";
        h += kit.rowTitle(610, y, kind);
        let body = "";
        if (o.pts) o.pts.forEach((p, i) => {
          const d = Math.abs(p - c), good = cfg.target === undefined || d === cfg.target;
          body += bracket(g, y + 40 + i * 34, ax, c, p, "x = " + num(p) + ":  " + absLab("x", c) + " = " + d, good ? "sok" : "sa", good ? "ok" : "w") + G.circle(g.P(p), ax, 6, good ? "fok" : "fwarn");
        });
        else {
          let pos = 0;
          o.hops.forEach((d, i) => { const yy = y + 40 + i * 34, a = g.P(pos), b = g.P(pos + d); body += G.line(a, yy, a, ax, "dash") + G.arrow(a, yy, b, yy, warn ? "sa" : "sok") + G.t((a + b) / 2, yy - 10, (d > 0 ? "+" : "−") + Math.abs(d), warn ? "w" : "ok", "middle", HALO); pos += d; });
          body += G.line(g.P(pos), y + 40 + (o.hops.length - 1) * 34, g.P(pos), ax, "dash") + G.circle(g.P(pos), ax, 7, warn ? "fwarn" : "fok");
        }
        h += axis(g, ax, c) + body + G.circle(g.P(c), ax, 4, "dot") + G.he(610, ax + 52, o.cap, "m", "right");
        y = ax + 90;
      });
      kit.compare(host, { height: y - 28, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה על הציר" });
    },
  };
})();
