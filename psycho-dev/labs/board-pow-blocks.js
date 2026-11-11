/* board-pow-blocks.js — a sum / difference of powers as BLOCKS of one common unit (3ˣ⁺² = nine blocks of 3ˣ; 2¹⁰ + 2¹⁰ = two blocks of 2¹⁰).
   Tap a big block to split it into unit blocks, combine the terms, and (optionally) substitute the exponent to see every block's value.
   cfg: { type:"pow-blocks", tip, unit:"3ˣ", cw:44, terms:[{t:"3ˣ⁺²", n:9}, {t:"3ˣ", n:1, neg:true}],
          xs?:{name:"x", vals:[1,2,3,4], unit:[3,9,27,81]}, target?:72,
          chain?:{base:2, exp:10, sup:"2¹¹", count:11}   (after combining: the count as a chip that joins the chain of factors),
          compare:{ cw, rows:[ per option: {n, lab, cap} ] }, notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, X = 40, Y = 44, BH = 50, NP = { "pointer-events": "none" };
  const fresh = () => ({ init: 1, split: {}, done: false, x: null, joined: false });

  function draw(st, cfg) {
    const cw = cfg.cw || 44, uv = cfg.xs && st.x !== null ? cfg.xs.unit[cfg.xs.vals.indexOf(st.x)] : null, lab = uv !== null ? pf(uv) : cfg.unit;
    const pos = cfg.terms.filter(t => !t.neg).reduce((s, t) => s + t.n, 0), neg = cfg.terms.filter(t => t.neg).reduce((s, t) => s + t.n, 0), N = pos - neg;
    let h = "", x = X;
    if (st.done) {
      for (let i = 0; i < pos; i++) { const gone = i >= N; h += G.rect(x, Y, cw, BH, gone ? "ghost" : "fsoft", { rx: 5 }) + (gone ? G.line(x + 6, Y + BH - 6, x + cw - 6, Y + 6, "mut") : G.t(x + cw / 2, Y + 31, lab, "b")); x += cw; }
    } else cfg.terms.forEach((T, ti) => {
      if (ti) { h += G.t(x + 16, Y + 33, T.neg ? "−" : "+", "big"); x += 32; }
      if (T.n > 1 && !st.split[ti]) {
        h += G.tap(G.rect(x, Y, T.n * cw, BH, "fsoft hot", { rx: 5 }), "s" + ti) + G.t(x + T.n * cw / 2, Y + 32, T.t + (uv !== null ? " = " + pf(uv * T.n) : ""), "big", "middle", NP);
        h += G.he(x + T.n * cw / 2, Y + BH + 20, "לחץ על הבלוק כדי לפרק אותו לבלוקים של " + ltr(cfg.unit), "m");
      } else for (let i = 0; i < T.n; i++) h += G.rect(x + i * cw, Y, cw, BH, T.neg ? "ghost" : "fsoft", { rx: 5 }) + G.t(x + (i + .5) * cw, Y + 31, lab, T.neg ? "m" : "b");
      if (T.n > 1 && st.split[ti]) h += G.t(x + T.n * cw / 2, Y - 10, T.t + " = " + T.n + " · " + cfg.unit, "m");
      x += T.n * cw;
    });
    let y = Y + BH + 30;
    if (st.done) { h += G.he(612, y, (neg ? "נשארו " : "יש כאן ") + N + " בלוקים של " + ltr(cfg.unit) + ":  " + ltr(N + " · " + cfg.unit + (cfg.target && uv === null ? " = " + pf(cfg.target) : "")), "a", "right"); y += 28; }
    else if (!cfg.terms.some((T, ti) => T.n > 1 && !st.split[ti])) y -= 4; else y += 14;
    if (uv !== null) {
      const tot = N * uv, expr = cfg.terms.map((T, ti) => (ti ? (T.neg ? " − " : " + ") : "") + pf(T.n * uv)).join("");
      h += G.t(X, y + 4, `${cfg.xs.name} = ${st.x}:   ` + (st.done ? `${N} · ${pf(uv)}` : expr) + " = " + pf(tot), "b", "start");
      if (cfg.target) h += tot === cfg.target ? G.he(612, y + 4, "בדיוק " + pf(cfg.target), "ok", "right") : G.he(612, y + 4, "צריך " + pf(cfg.target), "w", "right");
      y += 28;
    }
    if (st.done && cfg.chain) {
      const c = cfg.chain, cy = y + 34, P = 36; let cx = 60;
      const chip = (x, cls, key) => { const el = G.circle(x, cy, 16, cls + (key ? " hot" : "")); return (key ? G.tap(el, key) : el) + G.t(x, cy + 6, c.base, cls === "fa" ? "inv" : "b", "middle", NP); };
      if (!st.joined) {
        h += chip(cx, "fa", null) + G.tap(G.rect(cx - 24, cy - 24, 48, 48, "hot", { style: "fill:transparent" }), "join") + G.t(cx + 34, cy + 7, "·", "big"); cx += 68;
        h += G.he(60, cy + 44, "מספר הבלוקים", "m") + G.he(cx + (c.exp - 1) * P / 2, cy + 44, ltr(cfg.unit) + ": " + c.exp + " גורמים של " + c.base, "m");
        for (let i = 0; i < c.exp; i++) h += chip(cx + i * P, "fblue-soft", null);
        h += G.he(612, cy + 72, "לחץ על העיגול הוורוד כדי לצרף אותו לשרשרת", "m", "right");
      } else {
        for (let i = 0; i < c.count; i++) h += chip(cx + i * P, i ? "fblue-soft" : "fa", null);
        h += G.he(320, cy + 46, c.count + " גורמים של " + c.base + ":  " + ltr(N + " · " + cfg.unit + " = " + c.sup), "ok");
      }
      y = cy + 76;
    }
    return { svg: h, height: y + 8 };
  }

  Boards["pow-blocks"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh());
      const render = () => {
        const d = draw(st, cfg), need = cfg.terms.some((T, ti) => T.n > 1 && !st.split[ti]), neg = cfg.terms.some(T => T.neg);
        ui.set({
          height: d.height, svg: d.svg,
          tools: [{ label: neg ? "בצע את החיסור" : "חבר את הבלוקים", op: "combine", disabled: need || st.done },
            ...(cfg.xs ? cfg.xs.vals.map(v => ({ label: ltr(cfg.xs.name + " = " + v), op: "x", n: v, active: st.x === v })) : []),
            { label: "↺ מההתחלה", op: "reset", quiet: true }],
        });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "בלוקים של חזקות",
        onTap(key) { if (key === "join") st.joined = true; else st.split[+key.slice(1)] = 1; render(); },
        onOp(op, el) { if (op === "reset") kit.reset(st, fresh()); else if (op === "combine") st.done = true; else st.x = st.x === +el.dataset.n ? null : +el.dataset.n; render(); },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const cw = C.cw || 52; let h = "";
      [[chosen, "chosen", "fwarn"], [correct, "correct", "fok-soft"]].forEach(([j, kind, cls], i) => {
        const y = 34 + i * 112, R = C.rows[j], many = R.n > 9, n = many ? 6 : R.n;
        h += kit.rowTitle(612, y - 10, kind);
        for (let q = 0; q < n; q++) h += G.rect(X + q * cw, y, cw, 40, cls, { rx: 5 }) + G.t(X + (q + .5) * cw, y + 26, R.lab, "b");
        if (many) h += G.t(X + n * cw + 12, y + 28, "…   × " + pf(R.n), "big", "start");
        h += G.he(612, y + 64, R.cap, "m", "right");
      });
      kit.compare(host, { height: 232, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה בבלוקים" });
    },
  };
})();
