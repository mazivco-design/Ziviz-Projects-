/* board-alg-subst.js — "substitute numbers" board for letters-only questions about parity / sign / divisibility.
   The learner taps a value for every variable; every expression shows its substituted form, its value, a small picture
   (dots in pairs for parity, a signed bar for sign) and what was seen so far over all the substitutions he tried.
   cfg: { type:"alg-subst", view:"parity"|"sign"|"truth"|"whole",
          vars:[{name, vals:[..], note?}],
          conds?:[{label, show, f}]          boolean givens that the substitution must satisfy (shown with ✓/✗)
          head?:[{label, show, f}]           informative rows (value only)
          exprs:[{label, show, f}]           f: JS expression over the variable names; show: template with {x} placeholders
          tip, cmp:{ j: { e?: expr index, subs:[[values]], cap } }, notes:{ j: text } }
   view: parity -> זוגי / אי־זוגי / שבר · sign -> שלילי / חיובי / אפס · truth -> f is boolean · whole -> מתחלק (integer) / לא מתחלק */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, np = { "pointer-events": "none" };
  const num = v => (v < 0 ? "−" : "") + pf(Math.abs(v));
  const fresh = cfg => ({ init: 1, v: cfg.vars.map(() => null), seen: cfg.exprs.map(() => ({})), tries: 0 });
  const fn = (cfg, f) => new Function(...cfg.vars.map(v => v.name), "return (" + f + ")");
  const ev = (cfg, f, vals) => fn(cfg, f)(...vals);
  const subst = (cfg, show, vals) => show.replace(/\{(\w+)(!?)\}/g, (m, n, raw) => { const v = vals[cfg.vars.findIndex(q => q.name === n)]; return v < 0 && !raw ? "(" + num(v) + ")" : num(v); });
  const isInt = v => Math.abs(v - Math.round(v)) < 1e-9;
  const OUT = {
    parity: v => !isInt(v) ? ["frac", "שבר", "w"] : Math.round(v) % 2 === 0 ? ["even", "זוגי", "blue"] : ["odd", "אי־זוגי", "a"],
    sign: v => v < 0 ? ["neg", "שלילי", "w"] : v > 0 ? ["pos", "חיובי", "ok"] : ["zero", "אפס", "m"],
    truth: v => v ? ["t", "נכון", "ok"] : ["f", "לא נכון", "w"],
    whole: v => isInt(v) ? ["t", "מתחלק", "ok"] : ["f", "לא מתחלק", "w"],
  };
  const NAMES = { frac: "שבר", even: "זוגי", odd: "אי־זוגי", neg: "שלילי", pos: "חיובי", zero: "אפס" };
  const ready = st => st.v.every(v => v !== null);
  const condsOk = (st, cfg) => (cfg.conds || []).every(c => ev(cfg, c.f, st.v));

  // small pictures
  function pairs(x, y, v) {           // v dots in columns of two; a lonely dot is highlighted
    if (!isInt(v) || v < 0 || v > 50) return "";
    v = Math.round(v); let h = "";
    if (v === 0) return G.he(x, y + 5, "אפס נקודות: אין נקודה בודדת", "m", "left");
    for (let k = 0; k < Math.floor(v / 2); k++) h += G.rect(x + k * 11, y - 11, 9, 22, "fblue-soft", { rx: 4.5 }) + G.circle(x + k * 11 + 4.5, y - 5, 2.6, "dot") + G.circle(x + k * 11 + 4.5, y + 5, 2.6, "dot");
    if (v % 2) { const k = Math.floor(v / 2); h += G.circle(x + k * 11 + 6, y - 5, 6.5, "fa") ; }
    return h;
  }
  function bar(x, y, v) {             // signed bar around a zero mark
    const cx = x + 150, u = Math.min(7, 140 / Math.max(1, Math.abs(v))), w = Math.abs(v) * u;
    let h = G.line(x, y, x + 300, y, "mut");
    if (v) h += G.rect(v < 0 ? cx - w : cx, y - 7, w, 14, v < 0 ? "fwarn" : "fok");
    return h + G.line(cx, y - 11, cx, y + 11, "ink");
  }
  const picture = (view, x, y, v) => view === "parity" ? pairs(x, y, v) : view === "sign" ? bar(x, y - 4, v) : "";
  const exprLine = (cfg, e, vals) => {
    if (cfg.view === "truth") return e.label + "  →  " + subst(cfg, e.show, vals);
    return e.label + " = " + subst(cfg, e.show, vals) + " = " + num(ev(cfg, e.f, vals));
  };

  function draw(st, cfg) {
    let h = "", y = 12; const view = cfg.view, rdy = ready(st);
    cfg.vars.forEach((v, i) => {
      const tw = Math.min(56, 400 / v.vals.length);
      h += G.t(20, y + 28, v.name + " =", "big", "start");
      v.vals.forEach((val, k) => {
        const x = 84 + k * tw, on = st.v[i] === val;
        h += G.tap(G.rect(x + 2, y, tw - 4, 40, (on ? "fa" : "box") + " hot", { rx: 8 }), "v" + i + "_" + k) + G.t(x + tw / 2, y + 26, num(val), on ? "inv" : "b", "middle", np);
      });
      if (v.note) h += G.he(620, y + 26, v.note, "m", "right");
      y += 48;
    });
    y += 4; h += G.line(20, y, 620, y, "dash"); y += 26;
    const row = (text, tag, cls) => G.t(20, y, text, "b", "start") + (tag ? G.he(620, y, tag, cls, "right") : "");
    if (cfg.conds) {
      cfg.conds.forEach(c => {
        if (!rdy) h += row(c.label) + G.he(620, y, "נתון", "m", "right");
        else { const ok = ev(cfg, c.f, st.v); h += row(c.label + "  →  " + subst(cfg, c.show, st.v), ok ? "הנתון מתקיים" : "הנתון לא מתקיים", ok ? "ok" : "w"); }
        y += 30;
      });
      y -= 12; h += G.line(20, y, 620, y, "dash"); y += 26;
    }
    (cfg.head || []).forEach(e => { h += rdy ? row(e.label + " = " + subst(cfg, e.show, st.v) + " = " + num(ev(cfg, e.f, st.v))) : row(e.label); y += 30; });
    const valid = rdy && condsOk(st, cfg), pitch = view === "parity" || view === "sign" ? 64 : 48;
    cfg.exprs.forEach((e, i) => {
      if (!rdy) h += row(e.label) + (i === 0 ? G.he(620, y, "בחר ערכים למעלה", "m", "right") : "");
      else if (!valid) h += row(e.label) + (i === 0 ? G.he(620, y, "ההצבה לא מקיימת את הנתונים", "w", "right") : "");
      else {
        const val = ev(cfg, e.f, st.v), o = OUT[view](val);
        h += row(exprLine(cfg, e, st.v), o[1], o[2]) + picture(view, 20, y + 24, val);
      }
      const keys = Object.keys(st.seen[i]);
      if (keys.length) {
        const t = view === "truth" || view === "whole" ? (keys.length > 1 ? (view === "truth" ? "לא תמיד נכון" : "לא תמיד מתחלק") : keys[0] === "t" ? (view === "truth" ? "עד עכשיו: תמיד נכון" : "עד עכשיו: תמיד מתחלק") : (view === "truth" ? "עד עכשיו: אף פעם לא נכון" : "עד עכשיו: לא מתחלק"))
          : keys.length > 1 ? "ראינו גם " + keys.map(k => NAMES[k]).join(" וגם ") : "עד עכשיו: תמיד " + NAMES[keys[0]];
        h += G.he(620, y + (pitch === 64 ? 28 : 22), t, "m", "right");
      }
      y += pitch;
    });
    if (st.tries) h += G.he(620, y - 4, "הצבות שניסית: " + st.tries, "m", "right"), y += 20;
    return { svg: h, height: y - 12 };
  }

  Boards["alg-subst"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const render = () => { const d = draw(st, cfg); ui.set({ height: d.height, svg: d.svg, tools: [{ label: "↺ מההתחלה", op: "reset", quiet: true }] }); };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "הצבת מספרים לפתרון השאלה",
        onTap(key) {
          const [i, k] = key.slice(1).split("_").map(Number), val = cfg.vars[i].vals[k];
          if (st.v[i] === val) return;
          st.v[i] = val;
          if (ready(st) && condsOk(st, cfg)) { st.tries++; cfg.exprs.forEach((e, j) => { st.seen[j][OUT[cfg.view](ev(cfg, e.f, st.v))[0]] = 1; }); }
          render();
        },
        onOp(op) { if (op === "reset") kit.reset(st, fresh(cfg)); render(); },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      const C = cfg.cmp; if (!C || chosen === correct || chosen === undefined || isNaN(chosen) || !C[chosen]) { host.innerHTML = ""; return; }
      const view = cfg.view, pic = view === "parity" || view === "sign";
      let h = "", y = 24;
      [[chosen, "chosen"], [correct, "correct"]].forEach(([j, kind]) => {
        const row = C[j], e = cfg.exprs[row.e === undefined ? j : row.e];
        h += kit.rowTitle(620, y, kind); y += 30;
        row.subs.forEach(vals => {
          const val = ev(cfg, e.f, vals), o = OUT[view](val);
          h += G.he(620, y, "כש־" + ltr(cfg.vars.map((v, i) => v.name + " = " + num(vals[i])).join(", ")) + ":", "m", "right");
          h += G.t(20, y, exprLine(cfg, e, vals), "b", "start"); y += 26;
          h += G.he(620, y, o[1], o[2], "right") + picture(view, 20, y - 4, val); y += pic ? 40 : 30;
        });
        h += G.he(620, y, row.cap, "m", "right"); y += 44;
      });
      kit.compare(host, { height: y - 30, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה בהצבה" });
    },
  };
})();
