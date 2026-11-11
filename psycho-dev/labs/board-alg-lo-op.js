/* board-alg-lo-op.js — "defined operation" board (הגדרת פעולה).
   The exercise is shown as an expression. The learner taps what he computes next; the board computes that step,
   rewrites the expression and logs the step. Conditional operations: he sends the value through the door whose
   condition it meets. Two-variable operations: he drags each number into its slot in the formula.
   cfg: { type:"alg-lo-op", tip, sym:"$", form:"pre"|"br"|"in", vars:["x"],
          cases:[{ c?:"x%2==0", ct?:"x זוגי", f:"x/2", ft:"x / 2" }, ...],   (one case without c = plain definition)
          expr: tree — number | {o:1,a:[..]} (the defined operation) | {b:"*"|"+"|"-",a:[l,r]},
          cmp:{ optionIndex:{ lines:[...ltr formula lines], v:"final value" } } (also for the correct option), notes:{} } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit;
  const NP = { "pointer-events": "none" }, clone = o => JSON.parse(JSON.stringify(o));
  const fresh = cfg => ({ init: true, tree: clone(cfg.expr), lines: [], hist: [], slot: [null, null], sel: null, dp: null, last: null, bad: null, msg: "" });

  // tiny arithmetic evaluator: numbers, variables, + - * / % ^, parentheses, comparisons
  function ev(src, env) {
    const tk = src.match(/\d+(?:\.\d+)?|[a-z]|<=|>=|==|!=|[-+*/%^()<>]/g) || []; let i = 0;
    const atom = () => { const t = tk[i++]; if (t === "(") { const v = cmp(); i++; return v; } if (t === "-") return -atom(); return /[a-z]/.test(t) ? env[t] : +t; };
    const pow = () => { const a = atom(); if (tk[i] === "^") { i++; return Math.pow(a, pow()); } return a; };
    const term = () => { let a = pow(); while ("*/%".includes(tk[i]) && tk[i]) { const o = tk[i++], b = pow(); a = o === "*" ? a * b : o === "/" ? a / b : ((a % b) + b) % b; } return a; };
    const sum = () => { let a = term(); while (tk[i] === "+" || tk[i] === "-") { const o = tk[i++], b = term(); a = o === "+" ? a + b : a - b; } return a; };
    const cmp = () => { const a = sum(), o = tk[i]; if (!/^(<|>|<=|>=|==|!=)$/.test(o || "")) return a; i++; const b = sum(); return o === "<" ? a < b : o === ">" ? a > b : o === "<=" ? a <= b : o === ">=" ? a >= b : o === "==" ? a === b : a !== b; };
    return cmp();
  }
  const isN = n => typeof n === "number", ready = n => !isN(n) && n.a.every(isN);
  const get = (t, p) => p === "" ? t : p.split(".").reduce((n, k) => n.a[+k], t);
  const put = (st, p, v) => { if (p === "") st.tree = v; else { const ks = p.split("."), last = ks.pop(); ks.reduce((n, k) => n.a[+k], st.tree).a[+last] = v; } };
  const hasOp = n => !isN(n) && (n.o ? true : n.a.some(hasOp));
  const BS = { "*": "·", "+": "+", "-": "−" };
  const nt = v => v < 0 ? "(−" + pf(-v) + ")" : pf(v);
  const subst = (ft, cfg, vals) => ft.replace(/[a-z]/g, m => { const k = cfg.vars.indexOf(m); return k < 0 ? m : nt(vals[k]); });
  const opText = (cfg, a) => cfg.form === "br" ? "[" + a[0] + "]" : cfg.form === "in" ? a[0] + " " + cfg.sym + " " + a[1] : cfg.sym + a[0];
  const exprText = (cfg, t, top = true) => {
    if (isN(t)) return nt(t);
    if (t.o) { const a = t.a.map(c => exprText(cfg, c, false)); return cfg.form === "br" ? "[" + a[0] + "]" : cfg.form === "in" ? a[0] + " " + cfg.sym + " " + a[1] : cfg.sym + (isN(t.a[0]) ? a[0] : "(" + a[0] + ")"); }
    return exprText(cfg, t.a[0], false) + " " + BS[t.b] + " " + exprText(cfg, t.a[1], false);
  };
  const panel = cfg => cfg.cases.length > 1 || cfg.vars.length > 1;
  function paths(t, p, out) { if (isN(t)) return out; if (t.o && ready(t)) out.push(p); t.a.forEach((c, k) => paths(c, p === "" ? "" + k : p + "." + k, out)); return out; }
  const active = (st, cfg) => { if (!panel(cfg)) return null; const ps = paths(st.tree, "", []); return ps.includes(st.act) ? st.act : ps.length ? ps[0] : null; };

  // flatten a tree into drawable tokens
  function tokens(cfg, t, p, act, out, given) {
    const sub = k => p === "" ? "" + k : p + "." + k;
    if (isN(t)) { const s = nt(t); out.push({ k: "num", s, w: 16 * s.length + 14, p, computed: !given }); return out; }
    const par = (c, k, need) => { if (need) out.push({ k: "par", s: "(", w: 14 }); tokens(cfg, c, sub(k), act, out, given); if (need) out.push({ k: "par", s: ")", w: 14 }); };
    if (t.o) {
      const on = p === act;
      if (cfg.form === "br") {
        if (isN(t.a[0])) out.push({ k: "op", s: "[" + nt(t.a[0]) + "]", w: 16 * nt(t.a[0]).length + 40, p, on });
        else { out.push({ k: "op", s: "[", w: 36, p, on }); tokens(cfg, t.a[0], sub(0), act, out, given); out.push({ k: "op", s: "]", w: 36, p, on }); }
      } else if (cfg.form === "in") { par(t.a[0], 0, !isN(t.a[0])); out.push({ k: "op", s: cfg.sym, w: 40, p, on }); par(t.a[1], 1, !isN(t.a[1])); }
      else { out.push({ k: "op", s: cfg.sym, w: 40, p, on }); par(t.a[0], 0, !isN(t.a[0])); }
      if (on && cfg.vars.length > 1) out.forEach(o => { if (o.k === "num" && (o.p === sub(0) || o.p === sub(1))) o.chip = +o.p.split(".").pop(); });
    } else {
      const low = c => !isN(c) && c.b && c.b !== "*" && t.b === "*";
      par(t.a[0], 0, low(t.a[0])); out.push({ k: "ar", s: BS[t.b], w: 40, p }); par(t.a[1], 1, low(t.a[1]));
    }
    return out;
  }
  function exprSvg(toks, cx, y, st, live) {
    const W = toks.reduce((s, t) => s + t.w, 0) + (toks.length - 1) * 4; let x = cx - W / 2, h = "";
    toks.forEach(t => {
      const mid = x + t.w / 2;
      if (live && (t.k === "op" || t.k === "ar")) h += G.tap(G.rect(x, y - 22, t.w, 44, (t.on ? "fa" : t.k === "op" ? "fsoft" : "box") + " hot", { rx: 8 }), "n:" + t.p) + G.t(mid, y + 8, t.s, t.on ? "inv big" : "big", "middle", NP);
      else if (live && t.chip !== undefined) {
        const placed = st.slot.includes(t.chip), sel = st.sel === t.chip;
        h += G.rect(x, y - 22, t.w, 44, placed ? "ghost" : sel ? "fsoft" : "knob", { rx: 8, "data-drag": "c" + t.chip, style: "cursor:grab" }) + G.t(mid, y + 8, t.s, placed ? "m" : "big", "middle", NP);
      } else h += G.t(mid, y + 8, t.s, live ? (t.k === "num" && t.computed ? "big ok" : "big") : "b", "middle", NP);
      x += t.w + 4;
    });
    return { svg: h, left: cx - W / 2, right: cx + W / 2 };
  }
  const condText = ct => "אם " + ct.replace(/[A-Za-z0-9][A-Za-z0-9 <>≤≥=·+−]*[A-Za-z0-9]|[A-Za-z0-9]/g, m => ltr(m));
  const defHead = cfg => opText(cfg, cfg.vars) + " = ";

  function draw(st, cfg, geo) {
    let h = ""; const act = active(st, cfg), node = act === null ? null : get(st.tree, act);
    geo.slots = [];
    // --- definition panel ---
    if (cfg.cases.length > 1) cfg.cases.forEach((c, i) => {
      const x = i === 0 ? 330 : 20, cls = st.bad === i ? "fwarn hot" : "box hot";
      h += G.tap(G.rect(x, 12, 290, 72, cls, { rx: 10 }), "d" + i) + G.he(x + 145, 40, condText(c.ct), "", "middle", NP) + G.t(x + 145, 68, defHead(cfg) + c.ft, "b", "middle", NP);
    });
    else if (cfg.vars.length === 1) h += G.rect(150, 12, 340, 72, "box", { rx: 10 }) + G.t(320, 56, defHead(cfg) + cfg.cases[0].ft, "big");
    else {
      // formula with slots
      const parts = (defHead(cfg) + cfg.cases[0].ft).split(/([a-z])/).filter(s => s !== ""), head = defHead(cfg).length;
      let pos = 0; const items = parts.map(s => { const isVar = /^[a-z]$/.test(s) && pos >= head; pos += s.length; return isVar ? { v: cfg.vars.indexOf(s), w: 54 } : { s, w: 15 * s.length }; });
      // merge the head (x @ y =) pieces: variables before "=" stay plain text
      const W = items.reduce((s, t) => s + t.w, 0); let x = 320 - W / 2;
      h += G.rect(x - 24, 12, W + 48, 72, "box", { rx: 10 });
      items.forEach(t => {
        if (t.v === undefined) h += G.t(x + t.w / 2, 56, t.s.trim() === "" ? "" : t.s, "big");
        else {
          const filled = st.slot[t.v] !== null && node ? node.a[st.slot[t.v]] : (!node && st.last ? st.last[t.v] : null);
          geo.slots[t.v] = { x: x + 3, y: 24, w: 48, h: 48 };
          h += G.tap(G.rect(x + 3, 24, 48, 48, (filled === null ? "fsoft" : "fok-soft") + " hot", { rx: 8 }), "s" + t.v);
          h += G.t(x + 27, 56, filled === null ? "" : nt(filled), "big", "middle", NP) + G.t(x + 12, 38, cfg.vars[t.v], "m", "middle", NP);
        }
        x += t.w;
      });
    }
    // --- expression ---
    const done = isN(st.tree), Y = 128;
    if (done) {
      const txt = exprText(cfg, cfg.expr), w = 14 * txt.length, v = nt(st.tree), bw = 22 + 16 * v.length, x0 = 320 - (w + 34 + bw) / 2;
      h += G.t(x0 + w / 2, Y + 8, txt, "big") + G.t(x0 + w + 17, Y + 8, "=", "big") + G.rect(x0 + w + 34, Y - 22, bw, 44, "fok-soft", { rx: 8 }) + G.t(x0 + w + 34 + bw / 2, Y + 8, v, "big ok");
    } else {
      const giv = JSON.stringify(cfg.expr) === JSON.stringify(st.tree);
      h += exprSvg(tokens(cfg, st.tree, "", act, [], giv), 320, Y, st, true).svg;
    }
    // --- steps log ---
    let y = 186;
    st.lines.forEach(l => { h += G.t(320, y, l, "b"); y += 26; });
    if (st.dp && st.sel !== null && node) h += G.rect(st.dp.x - 24, st.dp.y - 22, 48, 44, "fsoft", { rx: 8, "pointer-events": "none" }) + G.t(st.dp.x, st.dp.y + 8, nt(node.a[st.sel]), "big", "middle", NP);
    return { svg: h, height: Math.max(170, y - 8) };
  }

  Boards["alg-lo-op"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const geo = { slots: [] };
      const snap = () => st.hist.push(JSON.stringify({ tree: st.tree, lines: st.lines, last: st.last }));
      const finish = (p, val, line, last) => { snap(); put(st, p, val); st.lines.push(line); st.slot = [null, null]; st.sel = null; st.act = null; st.bad = null; st.msg = ""; st.last = last || null; };
      const applyCase = (p, c, vals) => {
        const env = {}; cfg.vars.forEach((v, k) => env[v] = vals[k]);
        const val = ev(c.f, env), calc = subst(c.ft, cfg, vals) + " = " + nt(val);
        finish(p, val, cfg.vars.length > 1 ? cfg.vars.map((v, k) => v + " = " + nt(vals[k])).join(", ") + ":   " + calc : opText(cfg, vals.map(nt)) + " = " + calc, cfg.vars.length > 1 ? vals : null);
      };
      const place = (chip, slot) => {
        const p = active(st, cfg); if (p === null) return;
        st.slot = st.slot.map(c => c === chip ? null : c); st.slot[slot] = chip; st.sel = null;
        if (st.slot.every(c => c !== null)) { const n = get(st.tree, p); applyCase(p, cfg.cases[0], st.slot.map(c => n.a[c])); }
      };
      const render = () => {
        const d = draw(st, cfg, geo);
        ui.set({ height: d.height, svg: d.svg, msg: st.msg, tools: [...(st.hist.length ? [{ label: "בטל צעד", op: "undo", quiet: true }] : []), { label: "↺ מההתחלה", op: "reset", quiet: true }] });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "לוח לחישוב פעולה מוגדרת",
        onTap(key) {
          st.msg = ""; st.bad = null;
          if (key[0] === "d") {
            const i = +key.slice(1), p = active(st, cfg);
            if (p === null) st.msg = isN(st.tree) ? "החישוב הסתיים. הפעולה הופעלה כמספר הפעמים שמופיע בתרגיל." : "אין כרגע מספר שמוכן להיכנס לפעולה.";
            else {
              const n = get(st.tree, p), env = {}; cfg.vars.forEach((v, k) => env[v] = n.a[k]);
              if (ev(cfg.cases[i].c, env)) applyCase(p, cfg.cases[i], n.a.slice());
              else { st.bad = i; st.msg = `המספר ${nt(n.a[0])} לא מקיים את התנאי של הדלת הזאת.`; }
            }
          } else if (key[0] === "s") {
            const k = +key.slice(1);
            if (st.sel !== null) place(st.sel, k); else if (st.slot[k] !== null) st.slot[k] = null; else if (active(st, cfg) !== null) st.msg = "קודם בחר מספר מהתרגיל, ואז לחץ על המשבצת שלו.";
          } else {
            const p = key.slice(2), n = get(st.tree, p);
            if (!ready(n)) st.msg = n.o ? "קודם מחשבים את מה שבפנים, ורק אחר כך את הפעולה שבחוץ." : n.a.some(hasOp) ? `הפעולה ${ltr(cfg.form === "br" ? "[ ]" : cfg.sym)} קודמת לכפל ולחיבור. חשב קודם אותה.` : "כפל קודם לחיבור. חשב קודם את הכפל.";
            else if (n.o) {
              if (!panel(cfg)) applyCase(p, cfg.cases[0], n.a.slice()); else { st.act = p; st.msg = cfg.cases.length > 1 ? "לאיזו דלת המספר הזה מתאים? לחץ עליה." : ""; }
            } else { const [a, b] = n.a, val = n.b === "*" ? a * b : n.b === "+" ? a + b : a - b; finish(p, val, nt(a) + " " + BS[n.b] + " " + nt(b) + " = " + nt(val)); }
          }
          render();
        },
        onDrag(key, pt, phase) {
          const chip = +key.slice(1);
          if (phase === "start") { st.sel = chip; st.dp = null; st.msg = ""; }
          else if (phase === "move") st.dp = { x: Math.round(pt.x), y: Math.round(pt.y) };
          else {
            st.dp = null;
            const k = geo.slots.findIndex(s => s && pt.x >= s.x - 12 && pt.x <= s.x + s.w + 12 && pt.y >= s.y - 12 && pt.y <= s.y + s.h + 12);
            if (k >= 0) place(chip, k);
          }
          render();
        },
        onOp(op) {
          if (op === "reset") kit.reset(st, fresh(cfg));
          else if (op === "undo" && st.hist.length) { Object.assign(st, JSON.parse(st.hist.pop())); st.slot = [null, null]; st.sel = null; st.act = null; st.bad = null; st.msg = ""; }
          render();
        },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      const C = cfg.cmp; if (!C || chosen === correct || chosen === undefined || isNaN(chosen) || !C[chosen]) { host.innerHTML = ""; return; }
      const n = Math.max(C[chosen].lines.length, C[correct].lines.length), by = 44 + n * 26; let h = "";
      [[chosen, "chosen", 620, "fwarn"], [correct, "correct", 300, "fok-soft"]].forEach(([j, kind, R, cls]) => {
        const c = C[j], cx = R - 140;
        h += kit.rowTitle(R, 22, kind);
        c.lines.forEach((l, i) => { h += G.t(cx, 54 + i * 26, l, i >= C[kind === "chosen" ? correct : chosen].lines.length ? (kind === "chosen" ? "w" : "ok") : "b"); });
        h += G.rect(cx - 40, by, 80, 40, cls, { rx: 8 }) + G.t(cx, by + 27, c.v, "big");
      });
      h += G.line(320, 12, 320, by + 44, "dash");
      kit.compare(host, { height: by + 52, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה בחישוב" });
    },
  };
})();
