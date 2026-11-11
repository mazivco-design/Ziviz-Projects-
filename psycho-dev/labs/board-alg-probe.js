/* board-alg-probe.js — "הצבת מספרים" on a number line (topics alg-number-line, alg-inequalities-abs).
   The learner drags the variable knob(s); every expression lands live on its own lane above the axis.
   cfg: { type:"alg-probe", tip, mode:"pick"|"stmt"|"region", range:[lo,hi], step, tick?,
          vars:[{n, init, given?[lo|null, hi|null]}],
          exprs:[{id, lab, f, of, k?, lane?(false = no lane)}]   f: id sq cu rt inv abs xabs lin abslin mul div add absadd addabs
          conds:[S]        the givens, checked live            S = {lab, chain:[term..], op?|ops?}  term = number | var name | expr id
          pick:   opts:[term per option], cmp:{at:{var:value}}
          stmt:   stmts:[S per option] (truth shown live, an option is marked "נפסל" once a valid substitution breaks it),
                  cmp:{at, atFor?{optionIndex: assignment}}
          region: test:S (each visited value is marked on the axis), refs?[values marked on the lanes], marks?[axis separators],
                  opts:[{lo,hi}|{pts:[..]} per option]
          notes:{optionIndex: text} } */
(function () {
  "use strict";
  const { kit } = Boards, { G } = kit, XL = 34, XR = 606, EPS = 1e-9;
  const HALO = { style: "paint-order:stroke;stroke:var(--sheet);stroke-width:6px;stroke-linejoin:round", "pointer-events": "none" };
  const NP = { "pointer-events": "none" };
  const num = v => { if (v === null || v === undefined) return "?"; const r = Math.round(Math.abs(v) * 1000) / 1000; return (v < 0 && r ? "−" : "") + r; };
  const F = {
    id: a => a, sq: a => a * a, cu: a => a * a * a, rt: a => a < 0 ? null : Math.sqrt(a), inv: a => a === 0 ? null : 1 / a,
    abs: a => Math.abs(a), xabs: a => a * Math.abs(a), lin: (a, b, k) => k[0] * a + k[1], abslin: (a, b, k) => Math.abs(k[0] * a + k[1]),
    mul: (a, b) => a * b, div: (a, b) => b === 0 ? null : a / b, add: (a, b) => a + b,
    absadd: (a, b) => Math.abs(a + b), addabs: (a, b) => Math.abs(a) + Math.abs(b),
  };
  const CMP = { "<": (a, b) => a < b - EPS, ">": (a, b) => a > b + EPS, "≤": (a, b) => a <= b + EPS, "≥": (a, b) => a >= b - EPS, "=": (a, b) => Math.abs(a - b) < EPS };

  // values of all variables and expressions for an assignment {name: value}
  function evalAll(cfg, asg) {
    const V = Object.assign({}, asg);
    for (const e of cfg.exprs || []) {
      const of = [].concat(e.of), a = V[of[0]], b = of.length > 1 ? V[of[1]] : undefined;
      V[e.id] = a === null || b === null ? null : F[e.f](a, b, e.k);
    }
    return V;
  }
  const asgOf = (cfg, st) => { const a = {}; cfg.vars.forEach((v, i) => a[v.n] = st.v[i]); return a; };
  const tv = (t, V) => typeof t === "number" ? t : V[t];
  const tlab = (cfg, t) => typeof t === "number" ? num(t) : ((cfg.exprs || []).find(e => e.id === t) || { lab: t }).lab;
  const opsOf = S => S.ops || S.chain.slice(1).map(() => S.op || "<");
  function truth(S, V) {
    const vals = S.chain.map(t => tv(t, V)), ops = opsOf(S);
    if (vals.some(v => v === null || v === undefined)) return null;
    return ops.every((o, i) => CMP[o](vals[i], vals[i + 1]));
  }
  const subst = (S, V) => { const ops = opsOf(S); return S.chain.map((t, i) => (i ? " " + ops[i - 1] + " " : "") + num(tv(t, V))).join(""); };
  const asgText = (cfg, asg) => cfg.vars.map(v => v.n + " = " + num(asg[v.n])).join(", ");

  function geom(cfg) { const [lo, hi] = cfg.range, U = (XR - XL) / (hi - lo); return { lo, hi, U, P: v => XL + (v - lo) * U }; }
  function axis(g, y, cfg) {
    let h = G.line(XL - 16, y, XR + 16, y, "ink");
    const every = cfg.tick || (g.U >= 40 ? 1 : g.U >= 20 ? 2 : 5);
    for (let k = Math.ceil(g.lo); k <= g.hi + EPS; k++) {
      const z = k === 0, lab = k % every === 0;
      h += G.line(g.P(k), y - (z ? 9 : lab ? 6 : 4), g.P(k), y + (z ? 9 : lab ? 6 : 4), z ? "ink" : "thin");
      if (lab) h += G.t(g.P(k), y + 24, num(k), z ? "b" : "m", "middle", HALO);
    }
    if (cfg.step < 1 && g.U * cfg.step >= 14) for (let v = Math.ceil(g.lo / cfg.step) * cfg.step; v <= g.hi + EPS; v += cfg.step) if (Math.abs(v - Math.round(v)) > EPS) h += G.line(g.P(v), y - 3, g.P(v), y + 3, "thin");
    return h;
  }
  // one expression lane: returns [background markup, foreground markup]
  function lane(g, y, ax, lab, v, k, isVar) {
    const dc = isVar ? "fa" : k % 2 ? "dot" : "fblue", tc = isVar ? "a" : k % 2 ? "b" : "blue";
    if (v === null || v === undefined) return ["", G.t(316, y + 5, lab, tc, "end", HALO) + G.he(326, y + 5, "לא מוגדר", "m", "left", HALO)];
    const out = v > g.hi + EPS ? 1 : v < g.lo - EPS ? -1 : 0, txt = lab + " = " + num(v);
    if (out) { const ex = out > 0 ? XR + 12 : XL - 12; return ["", G.arrow(ex - out * 24, y, ex, y, "thin") + G.t(ex - out * 32, y + 5, txt, tc, out > 0 ? "end" : "start", HALO)]; }
    const px = g.P(v), right = px > 380;
    return [G.line(px, y + 7, px, ax, "dash", NP) + G.circle(px, ax, 4, dc, NP), G.circle(px, y, 7, dc, NP) + G.t(right ? px - 14 : px + 14, y + 5, txt, tc, right ? "end" : "start", HALO)];
  }
  const okMark = (x, y) => G.circle(x, y, 6, "fok", NP);
  const noMark = (x, y) => G.line(x - 5, y - 5, x + 5, y + 5, "mut", NP) + G.line(x - 5, y + 5, x + 5, y - 5, "mut", NP);

  function layout(cfg) {
    const lanes = (cfg.exprs || []).filter(e => e.lane !== false), n = lanes.length, reg = cfg.mode === "region";
    const LY = i => 56 + i * 28, AX = 56 + n * 28 + 6, TR = AX + 46, KY = i => AX + (reg ? 82 : 56) + i * 44;
    const bottom = KY(cfg.vars.length - 1) + 28, SY = j => bottom + 26 + j * 28;
    const height = cfg.mode === "stmt" ? SY(cfg.stmts.length - 1) + 14 : reg ? bottom + 36 : bottom + 4;
    return { lanes, LY, AX, TR, KY, bottom, SY, height };
  }
  const fresh = cfg => ({ init: true, v: cfg.vars.map(v => v.init), touched: false, trail: {}, seen: [], fail: {} });

  function record(st, cfg) {
    const V = evalAll(cfg, asgOf(cfg, st));
    if (cfg.mode === "region") st.trail[String(st.v[0])] = truth(cfg.test, V) === true ? 1 : 0;
    if (cfg.mode === "stmt" && (cfg.conds || []).every(c => truth(c, V) === true)) {
      const key = st.v.join(",");
      if (!st.seen.includes(key)) st.seen.push(key);
      cfg.stmts.forEach((S, j) => { if (truth(S, V) !== true && !st.fail[j]) st.fail[j] = asgText(cfg, asgOf(cfg, st)); });
    }
  }

  function draw(st, cfg) {
    const g = geom(cfg), L = layout(cfg), V = evalAll(cfg, asgOf(cfg, st)), conds = cfg.conds || [];
    let h = "", back = "", front = "";
    // header: the givens (or the tested condition) with live status
    if (cfg.mode === "region") {
      h += G.he(610, 24, "בודקים:", "m", "right") + G.t(546, 24, cfg.test.lab, "b", "end");
      if (st.touched) {
        const t = truth(cfg.test, V);
        h += t === null ? G.he(30, 24, "לא מוגדר כאן ✗", "w", "left") : G.t(30, 24, subst(cfg.test, V) + (t ? "  ✓" : "  ✗"), t ? "ok" : "w", "start");
      }
    } else if (conds.length) {
      h += G.he(610, 24, "נתון:", "m", "right");
      let x = 556;
      conds.forEach(c => { const t = truth(c, V) === true; h += G.t(x, 24, c.lab + (t ? "  ✓" : "  ✗"), t ? "ok" : "w", "end"); x -= (c.lab.length + 3) * 11.5 + 22; });
    }
    const condsOk = conds.every(c => truth(c, V) === true);
    // reference values on the lanes
    (cfg.refs || []).forEach(r => { h += G.line(g.P(r), L.AX - 13, g.P(r), L.AX + 13, "sblue"); });
    // lanes
    if (st.touched) L.lanes.forEach((e, i) => { const [b, f] = lane(g, L.LY(i), L.AX, e.lab, V[e.id], i, e.f === "id"); back += b; front += f; });
    else h += G.he(320, (L.LY(0) + L.LY(L.lanes.length - 1)) / 2 + 5, "גרור את העיגול שמתחת לציר כדי להציב מספר", "m", "middle");
    // knob stems first, then the axis (tick labels have a halo), then lanes
    cfg.vars.forEach((v, i) => { const x = g.P(st.v[i]); h += G.line(x, L.AX, x, L.KY(i), "sa", NP); });
    h += axis(g, L.AX, cfg) + back + front;
    // trail of tested values (region mode)
    if (cfg.mode === "region") {
      (cfg.marks || []).forEach(m => { h += G.line(g.P(m), L.TR - 14, g.P(m), L.TR + 14, "dash"); });
      let ok = 0, no = 0;
      Object.keys(st.trail).forEach(k => { const x = g.P(+k); if (st.trail[k]) { ok++; h += okMark(x, L.TR); } else { no++; h += noMark(x, L.TR); } });
      h += G.he(610, L.bottom + 22, "מקיימים (עיגול ירוק): " + ok, "ok", "right") + G.he(30, L.bottom + 22, "לא מקיימים (×): " + no, "m", "left");
    }
    // knobs
    cfg.vars.forEach((v, i) => {
      const x = g.P(st.v[i]), y = L.KY(i), r = x > 470;
      if (v.given) { const a = v.given[0] === null ? XL - 16 : g.P(v.given[0]), b = v.given[1] === null ? XR + 16 : g.P(v.given[1]); h += G.rect(a, y + 19, b - a, 7, "fsoft", { rx: 3.5 }); }
      h += G.circle(x, L.AX, 5, "fa", NP) + G.knob(x, y, "v" + i, 15) + G.t(r ? x - 24 : x + 24, y + 6, v.n + " = " + num(st.v[i]), "a", r ? "end" : "start", HALO);
    });
    // statements with live truth
    if (cfg.mode === "stmt") cfg.stmts.forEach((S, j) => {
      const y = L.SY(j), t = truth(S, V);
      h += G.t(610, y, S.lab, "b", "end");
      if (!st.touched || !condsOk) h += G.t(270, y, "—", "m", "middle");
      else h += G.t(452, y, t === null ? "?" : subst(S, V), "m", "end") + G.he(292, y, t ? "נכון ✓" : "לא נכון ✗", t ? "ok" : "w", "right");
      if (st.fail[j]) h += G.he(30, y, "נפסל ✗", "w", "left");
      else if (st.seen.length) h += G.he(30, y, "עמד ב־" + st.seen.length + " הצבות", "m", "left");
    });
    return { svg: h, height: L.height };
  }

  // ----- compare panels -----
  function cmpRows(cfg, chosen, correct) {
    const g = geom(cfg), C = cfg.cmp || {}, asg = (C.atFor || {})[chosen] || C.at, V = evalAll(cfg, asg), stmt = cfg.mode === "stmt";
    let h = "", y = 26;
    [[chosen, "chosen"], [correct, "correct"]].forEach(([j, kind]) => {
      const terms = stmt ? [...new Set(cfg.stmts[j].chain.filter(t => typeof t !== "number"))] : [cfg.opts[j]];
      h += kit.rowTitle(610, y, kind) + G.t(30, y, asgText(cfg, asg), "m", "start");
      const ax = y + 22 + terms.length * 26 + 4; let back = "", front = "";
      terms.forEach((t, i) => { const [b, f] = lane(g, y + 26 + i * 26, ax, tlab(cfg, t), V[t], i, cfg.vars.some(v => v.n === t)); back += b; front += f; });
      h += axis(g, ax, cfg) + back + front; y = ax + 34;
      if (stmt) { const S = cfg.stmts[j], t = truth(S, V) === true; h += G.t(610, y + 16, S.lab, "b", "end") + G.t(452, y + 16, subst(S, V), "m", "end") + G.he(292, y + 16, t ? "נכון ✓" : "לא נכון ✗", t ? "ok" : "w", "right"); y += 30; }
      y += 34;
    });
    return { svg: h, height: y - 34 };
  }
  function cmpRegion(cfg, chosen, correct) {
    const g = geom(cfg), n = cfg.vars[0].n; let h = "", y = 26;
    [[chosen, "chosen", "fwarn"], [correct, "correct", "fok-soft"]].forEach(([j, kind, fc]) => {
      const o = cfg.opts[j], ax = y + 46;
      h += kit.rowTitle(610, y, kind);
      if (o.pts) {
        if (!o.pts.length) h += G.he(30, y, "אף נקודה לא מסומנת", "m", "left");
        o.pts.forEach(p => { h += G.circle(g.P(p), ax, 13, fc); });
      } else {
        const a = o.lo === null ? XL - 16 : g.P(o.lo), b = o.hi === null ? XR + 16 : g.P(o.hi);
        h += G.rect(a, ax - 11, b - a, 22, fc, { rx: 4 });
      }
      h += axis(g, ax, cfg);
      for (let v = Math.ceil(g.lo / cfg.step) * cfg.step; v <= g.hi + EPS; v += cfg.step) {
        const V = evalAll(cfg, { [n]: v });
        h += truth(cfg.test, V) === true ? okMark(g.P(v), ax) : noMark(g.P(v), ax);
      }
      y = ax + 58;
    });
    h += G.he(610, y - 12, "עיגול ירוק: הערך מקיים את " + kit.ltr(cfg.test.lab) + ". סימן ×: לא מקיים.", "m", "right");
    return { svg: h, height: y };
  }

  Boards["alg-probe"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const g = geom(cfg), L = layout(cfg);
      const render = () => { const d = draw(st, cfg); ui.set({ height: d.height, svg: d.svg, tools: [{ label: "↺ מההתחלה", op: "reset", quiet: true }] }); };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "ציר מספרים להצבת מספרים",
        onDrag(key, pt) {
          const i = +key.slice(1), v = Math.max(g.lo, Math.min(g.hi, Math.round(((pt.x - XL) / g.U + g.lo) / cfg.step) * cfg.step));
          if (st.v[i] !== v || !st.touched) { st.v[i] = v; st.touched = true; record(st, cfg); }
          render();
        },
        dragFrom(pt) { for (let i = 0; i < cfg.vars.length; i++) if (Math.abs(pt.y - L.KY(i)) <= 18) return "v" + i; return null; },
        onOp(op) { if (op === "reset") kit.reset(st, fresh(cfg)); render(); },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      if (chosen === correct || chosen === undefined || chosen === null || isNaN(chosen)) { host.innerHTML = ""; return; }
      const d = cfg.mode === "region" ? cmpRegion(cfg, chosen, correct) : cmpRows(cfg, chosen, correct);
      kit.compare(host, { height: d.height, svg: d.svg, note: (cfg.notes || {})[chosen], title: "ככה זה נראה על הציר" });
    },
  };
})();
