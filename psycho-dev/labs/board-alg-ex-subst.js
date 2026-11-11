/* board-alg-ex-subst.js — "הצבת מספרים" with exact fractions: drag each variable onto its number line; every expression is computed live.
   (Used by alg-expressions and alg-fractions. Not related to board-alg-subst.js.)
   cfg: { type:"alg-ex-subst", tip, mode:"eq"|"max"|"rows", dec? (show terminating fractions as decimals),
     vars:[{ name, lo, hi (line range), min?, max?, step? | list?:[values], tick?, labels?:"all" }]   numbers are n or [n,d]
     marks?:[{ label, v, var? (index of the line it sits on) }]            fixed points given by the question
     cond?:{ e, text }                                                      e must be > 0, otherwise `text` is shown instead of values
     q?:{ label, e }  parts?:[{label,e}]  opts:[{label,e}]                  eq: question expression vs every option
     ref?:1  (max mode: dashed reference line)                              max: one bar per option
     rows?:[{ label, e, target? }], bars?:true, barMax?                     rows: free readouts (optionally with a target)
     cmp:{ vals:{x:1,..} } | { kind:"var", var, opts:[v per option], row, line:{lo,hi,tick} } | { kind:"bars", label, vals:[..], ref:{label,v}, max }
     notes:{ optionIndex: text } }
   Expression syntax: integers, variable names, + - * / ^ ( ).  */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr } = kit, T0 = 40, T1 = 600, VH = 74, NP = { "pointer-events": "none" };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const R = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return [n / g, d / g]; };
  const toR = v => Array.isArray(v) ? R(v[0], v[1]) : R(v, 1);
  const num = r => r[0] / r[1];
  const add = (a, b) => a && b && R(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
  const mul = (a, b) => a && b && R(a[0] * b[0], a[1] * b[1]);
  const div = (a, b) => a && b && b[0] ? R(a[0] * b[1], a[1] * b[0]) : null;
  const neg = a => a && [-a[0], a[1]];
  const same = (a, b) => !!a && !!b && a[0] === b[0] && a[1] === b[1];
  function ev(src, env) {
    const tk = src.match(/\d+|[a-z]+|[-+*/^()]/gi) || []; let i = 0;
    const E = () => { let v = T(); while (tk[i] === "+" || tk[i] === "-") { const o = tk[i++], r = T(); v = add(v, o === "+" ? r : neg(r)); } return v; };
    const T = () => { let v = U(); while (tk[i] === "*" || tk[i] === "/") { const o = tk[i++], r = U(); v = o === "*" ? mul(v, r) : div(v, r); } return v; };
    const U = () => { if (tk[i] === "-") { i++; return neg(U()); } return P(); };
    const P = () => { let v = A(); if (tk[i] === "^") { i++; const e = +tk[i++]; let p = R(1); for (let k = 0; k < e; k++) p = mul(p, v); v = p; } return v; };
    const A = () => { const t = tk[i++]; if (t === "(") { const v = E(); i++; return v; } return /\d/.test(t) ? R(+t) : (env[t] || null); };
    return E() || null;
  }
  const fr = (r, dec) => {
    if (!r) return null; const [n, d] = r, s = n < 0 ? "−" : "", a = Math.abs(n);
    if (d === 1) return s + a;
    if (dec) { let q = d; while (q % 2 === 0) q /= 2; while (q % 5 === 0) q /= 5; const x = a / d, t = String(Math.round(x * 1e4) / 1e4); if (q === 1 && Math.abs(+t - x) < 1e-9) return s + t; }
    return s + a + "/" + d;
  };
  const allowed = v => { if (v.list) return v.list.map(toR); const st = toR(v.step || 1), mx = toR(v.max !== undefined ? v.max : v.hi), out = []; let x = toR(v.min !== undefined ? v.min : v.lo); while (num(x) <= num(mx) + 1e-9) { out.push(x); x = add(x, st); } return out; };
  const fresh = cfg => ({ init: true, k: cfg.vars.map(() => null) });
  const envOf = (st, cfg) => { const env = {}; let all = true; cfg.vars.forEach((v, i) => { if (st.k[i] === null) all = false; else env[v.name] = allowed(v)[st.k[i]]; }); return all ? env : null; };
  const XV = (v, x) => T0 + (x - num(toR(v.lo))) / (num(toR(v.hi)) - num(toR(v.lo))) * (T1 - T0);
  const valT = (x, y, r, dec, cls = "") => r ? G.t(x, y, "= " + fr(r, dec), cls, "start") : G.he(x, y, "לא מוגדר", "w", "left");

  function axis(v, y) {
    const lo = num(toR(v.lo)), hi = num(toR(v.hi)), tk = num(toR(v.tick || v.step || 1)); let h = G.line(T0 - 14, y, T1 + 14, y, "ink");
    for (let k = 0; lo + k * tk <= hi + 1e-9; k++) {
      const x = lo + k * tk, X = XV(v, x), isInt = Math.abs(x - Math.round(x)) < 1e-9;
      h += G.line(X, y - (isInt ? 8 : 5), X, y + (isInt ? 8 : 5), isInt ? "ink" : "mut");
      if (isInt || v.labels === "all") h += G.t(X, y + 28, fr(R(Math.round(x * 60), 60)), "m");
    }
    return h;
  }
  const dotMark = (v, y, m) => { const X = XV(v, num(toR(m.v))); return G.circle(X, y, 6, "dot") + G.t(X, y - 14, m.label + " = " + fr(toR(m.v)), "blue"); };

  function draw(st, cfg) {
    const env = envOf(st, cfg), dec = cfg.dec; let h = "", y = 0;
    cfg.vars.forEach((v, i) => {
      const ty = i * VH + 52, set = st.k[i] !== null, al = allowed(v), val = set ? al[st.k[i]] : null;
      h += axis(v, ty);
      if (num(al[0]) > num(toR(v.lo)) + 1e-9 || num(al[al.length - 1]) < num(toR(v.hi)) - 1e-9) h += G.line(XV(v, num(al[0])), ty, XV(v, num(al[al.length - 1])), ty, "sa");
      (cfg.marks || []).filter(m => (m.var || 0) === i).forEach(m => { h += dotMark(v, ty, m); });
      h += G.t(12, ty - 26, v.name + " = " + (set ? fr(val, dec) : "?"), "a", "start");
      if (set) h += G.knob(XV(v, num(val)), ty, "v" + i, 15);
      else h += G.knob(130, ty - 31, "v" + i, 15) + G.t(130, ty - 26, "?", "a", "middle", NP) + G.he(612, ty - 26, "גרור את העיגול אל הציר", "m", "right");
    });
    y = cfg.vars.length * VH + 34;
    const bad = env && cfg.cond && !(num(ev(cfg.cond.e, env) || [0, 1]) > 0);
    if (bad) { h += G.he(612, y + 10, cfg.cond.text, "w", "right"); return { svg: h, height: y + 30 }; }
    const val = e => env ? ev(e, env) : undefined;
    const vt = (x, yy, e, cls) => env ? valT(x, yy, val(e), dec, cls) : G.t(x, yy, "= ?", "m", "start");
    if (cfg.mode === "eq") {
      (cfg.parts || []).forEach(p => { h += G.t(22, y + 6, p.label, "", "start") + vt(330, y + 6, p.e); y += 30; });
      if ((cfg.parts || []).length) y += 6;
      h += G.he(612, y + 4, "הביטוי שבשאלה", "m", "right") + G.rect(10, y + 12, 620, 42, "fblue-soft", { rx: 8 }) + G.t(22, y + 39, cfg.q.label, "", "start");
      const qv = val(cfg.q.e);
      h += env ? (qv ? G.t(618, y + 41, "= " + fr(qv, dec), "big", "end") : G.he(618, y + 39, "לא מוגדר", "w", "left")) : G.t(618, y + 41, "= ?", "big", "end");
      y += 82; h += G.he(612, y, "התשובות", "m", "right"); y += 26;
      cfg.opts.forEach(o => {
        const v = val(o.e);
        h += G.t(22, y, o.label, "b", "start") + vt(300, y, o.e);
        if (env && qv) h += same(v, qv) ? G.he(618, y, "שווה לביטוי ✓", "ok", "right") : G.he(618, y, "שונה", "m", "right");
        y += 32;
      });
      return { svg: h, height: y - 12 };
    }
    if (cfg.mode === "max") {
      const B0 = 330, B1 = 612, vs = cfg.opts.map(o => val(o.e)), mx = Math.max(cfg.ref || 0, ...vs.map(v => v ? num(v) : 0), 1e-9) * 1.02, u = (B1 - B0) / mx, top = y - 6;
      cfg.opts.forEach((o, j) => {
        h += G.t(22, y + 18, o.label, "b", "start") + vt(200, y + 18, o.e);
        h += env && vs[j] ? G.rect(B0, y + 2, Math.max(1, num(vs[j]) * u), 22, "fa") : G.rect(B0, y + 2, B1 - B0, 22, "ghost");
        y += 36;
      });
      if (env && cfg.ref) { const X = B0 + cfg.ref * u; h += G.line(X, top, X, y - 6, "dash") + G.t(X, y + 10, String(cfg.ref), "m"); y += 14; }
      return { svg: h, height: y };
    }
    const B0 = 390, B1 = 612, u = (B1 - B0) / (cfg.barMax || 1);
    cfg.rows.forEach(r => {
      const v = val(r.e);
      h += G.t(22, y + 18, r.label, "b", "start") + vt(cfg.bars ? 200 : 250, y + 18, r.e, "b");
      if (cfg.bars) h += env && v ? G.rect(B0, y + 2, Math.max(1, Math.min(B1 - B0, Math.abs(num(v)) * u)), 22, num(v) < 0 ? "fwarn" : "fa") : G.rect(B0, y + 2, B1 - B0, 22, "ghost");
      if (r.target !== undefined) h += env && same(v, toR(r.target)) ? G.he(612, y + 18, "הגעת ליעד ✓", "ok", "right") : G.he(612, y + 18, "היעד: " + ltr(fr(toR(r.target))), "m", "right");
      y += 36;
    });
    return { svg: h, height: y };
  }

  Boards["alg-ex-subst"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const place = (i, x) => { const v = cfg.vars[i], al = allowed(v), t = num(toR(v.lo)) + (x - T0) / (T1 - T0) * (num(toR(v.hi)) - num(toR(v.lo))); let best = 0; al.forEach((a, k) => { if (Math.abs(num(a) - t) < Math.abs(num(al[best]) - t)) best = k; }); st.k[i] = best; };
      const render = () => {
        const d = draw(st, cfg), tools = [];
        cfg.vars.forEach((v, i) => {
          const n = allowed(v).length, k = st.k[i];
          tools.push({ label: `<bdi dir="ltr">${v.name} ▸</bdi>`, op: "inc", n: i, disabled: k === null || k >= n - 1 }, { label: `<bdi dir="ltr">◂ ${v.name}</bdi>`, op: "dec", n: i, disabled: k === null || k <= 0 });
        });
        tools.push({ label: "↺ מההתחלה", op: "reset", quiet: true });
        ui.set({ height: d.height, svg: d.svg, tools, msg: "" });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "הצבת מספרים בביטויים",
        onDrag(key, pt) { place(+key.slice(1), pt.x); render(); },
        dragFrom(pt) { for (let i = 0; i < cfg.vars.length; i++) { const ty = i * VH + 52; if (Math.abs(pt.y - ty) <= 24 && pt.x >= T0 - 16 && pt.x <= T1 + 16) return "v" + i; } return null; },
        onOp(op, el) {
          if (op === "reset") kit.reset(st, fresh(cfg)); else { const i = +el.dataset.n; st.k[i] += op === "inc" ? 1 : -1; }
          render();
        },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      const C = cfg.cmp; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const dec = cfg.dec, note = (cfg.notes || {})[chosen]; let h = "", H = 0;
      const sides = [[chosen, "chosen", "fwarn"], [correct, "correct", "fok"]];
      if (C.kind === "var") {
        const v = { lo: C.line.lo, hi: C.line.hi, step: 1, tick: C.line.tick || 1 }, row = cfg.rows[C.row];
        sides.forEach(([j, kind, fc], i) => {
          const y = 26 + i * 124, b = toR(C.opts[j]), env = { [C.var]: b }, X = XV(v, num(b));
          h += kit.rowTitle(612, y, kind) + G.t(22, y, `${C.var} = ${fr(b)}   →   ${row.label} = ${fr(ev(row.e, env))}`, "b", "start");
          h += axis(v, y + 56); (cfg.marks || []).forEach(m => { h += dotMark(v, y + 56, m); });
          h += G.circle(X, y + 56, 10, fc) + G.line(X, y + 30, X, y + 46, "mut") + G.t(X, y + 26, C.var, kind === "chosen" ? "w" : "ok");
        });
        H = 250;
      } else if (C.kind === "bars") {
        const B0 = 250, u = (612 - B0) / C.max;
        sides.forEach(([j, kind, fc], i) => {
          const y = 26 + i * 104, v = C.vals[j];
          h += kit.rowTitle(612, y, kind);
          h += G.rect(B0, y + 12, C.ref.v * u, 22, "fblue-soft") + G.t(22, y + 29, C.ref.label + " = " + C.ref.v, "blue", "start");
          h += G.rect(B0, y + 44, v * u, 22, fc) + G.t(22, y + 61, C.label + " = " + v, kind === "chosen" ? "w" : "ok", "start");
          h += G.line(B0 + C.ref.v * u, y + 6, B0 + C.ref.v * u, y + 72, "dash");
        });
        H = 208;
      } else {
        const env = {}; Object.keys(C.vals).forEach(k => { env[k] = toR(C.vals[k]); });
        const sub = Object.keys(env).map(k => k + " = " + fr(env[k], dec)).join(",  ");
        const items = (cfg.mode === "eq" ? [[cfg.q, "q", "fblue"]] : []).concat(sides.map(([j, kind, fc]) => [cfg.opts[j], kind, fc]));
        const vals = items.map(([o]) => ev(o.e, env)), mx = Math.max(...vals.map(v => Math.abs(num(v))), cfg.ref || 0, 1e-9), hasNeg = vals.some(v => num(v) < 0);
        const Z = hasNeg ? 320 : 22, u = (hasNeg ? 290 : 590) / mx;
        h += G.he(612, 22, "מציבים " + ltr(sub), "b", "right");
        items.forEach(([o, kind, fc], i) => {
          const y = 58 + i * 62, v = num(vals[i]), w = Math.abs(v) * u;
          h += kind === "q" ? G.he(612, y, "הביטוי שבשאלה", "blue", "right") : kit.rowTitle(612, y, kind);
          h += G.t(22, y, o.label === fr(vals[i], dec) ? o.label : o.label + " = " + fr(vals[i], dec), kind === "q" ? "" : "b", "start");
          h += G.rect(v < 0 ? Z - w : Z, y + 10, Math.max(2, w), 18, fc);
        });
        const yb = 58 + items.length * 62 - 24;
        if (hasNeg) h += G.line(Z, 62, Z, yb, "thin") + G.t(Z, yb + 16, "0", "m");
        if (cfg.ref && cfg.mode === "max") { const X = Z + cfg.ref * u; h += G.line(X, 62, X, yb, "dash") + G.t(X, yb + 16, String(cfg.ref), "m"); }
        H = yb + (hasNeg || (cfg.ref && cfg.mode === "max") ? 24 : 8);
      }
      kit.compare(host, { height: H, svg: h, note, title: "ככה זה נראה בהצבת מספרים" });
    },
  };
})();
