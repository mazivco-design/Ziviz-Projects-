/* board-alg-chips.js — prime-factor "chips" board (building blocks of a number).
   mode "div": a basket with x's prime chips + candidate numbers. Pick a candidate, break it with the ÷p buttons;
               every chip that comes out drops under a free matching chip of x, or stays outside when x has none left.
   mode "gcd": two baskets (x, y). Tap a chip: if the other basket has a free twin, the pair moves to the "common" row.
   cfg: { type:"alg-chips", mode, baskets:[{name, chips:[..]}], cands?:[numbers], primes?:[2,3,5,7],
          opts:[[chips of option j]], optLabels:[..], caps:{j: caption}, notes:{j: text}, tip } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr } = kit, np = { "pointer-events": "none" };
  const R = 19, STEP = 58;
  const fresh = cfg => cfg.mode === "gcd" ? { init: 1, pairs: [], msg: "" } : { init: 1, sel: null, fac: cfg.cands.map(() => []), msg: "" };
  const chip = (x, y, v, cls, tcls) => G.circle(x, y, R, cls) + G.t(x, y + 6, v, tcls || "b", "middle", np);
  // match the chips of a candidate against a basket: returns [{v, slot: index in basket | -1}]
  function match(basket, chips) {
    const used = basket.map(() => false);
    return chips.map(v => { const i = basket.findIndex((b, k) => b === v && !used[k]); if (i >= 0) used[i] = true; return { v, slot: i }; });
  }
  const rest = (n, fac) => fac.reduce((a, p) => a / p, n);
  const prod = a => a.join("·");

  /* ---------- mode: div ---------- */
  function drawDiv(st, cfg) {
    const B = cfg.baskets[0], n = B.chips.length, bx = 60, by = 64, outX = bx + n * STEP + 70;
    let h = G.he(620, 24, "אבני הבניין של " + ltr(B.name), "b", "right");
    h += G.rect(bx - 34, by - 30, n * STEP + 10, 60, "bg", { rx: 14 });
    const sel = st.sel, fac = sel === null ? [] : st.fac[sel], m = match(B.chips, fac);
    B.chips.forEach((v, i) => { h += chip(bx + i * STEP, by, v, m.some(c => c.slot === i) ? "fok-soft" : "box"); });
    // candidate chips: under their twin, or outside
    let out = 0;
    m.forEach(c => {
      if (c.slot >= 0) { const x = bx + c.slot * STEP; h += G.line(x, by + R, x, by + 62 - R, "sok") + chip(x, by + 62, c.v, "fok-soft"); }
      else { h += chip(outX + out * 46, by + 62, c.v, "fwarn", "w"); out++; }
    });
    if (out) h += G.he(outX - 24 + (out * 46) / 2 + 4, by + 30, "אין מקום", "w", "middle");
    // candidates
    const cy = 176, cw = 120, x0 = 320 - cfg.cands.length * (cw + 14) / 2 + 7;
    h += G.line(20, cy - 16, 620, cy - 16, "dash");
    cfg.cands.forEach((c, i) => {
      const x = x0 + i * (cw + 14), f = st.fac[i], done = rest(c, f) === 1, fits = match(B.chips, f).every(q => q.slot >= 0);
      h += G.tap(G.rect(x, cy, cw, 44, (i === sel ? "fsoft" : "box") + " hot", { rx: 10 }), "c" + i);
      h += G.t(x + cw / 2, cy + 29, c, i === sel ? "a big" : "big", "middle", np);
      if (f.length) h += G.he(x + cw / 2, cy + 64, done ? (fits ? "נכנס כולו" : "לא נכנס") : "באמצע פירוק", done ? (fits ? "ok" : "w") : "m", "middle");
    });
    // readout
    const ry = cy + 96;
    if (sel === null) h += G.he(620, ry, "בחר מספר, ופרק אותו בעזרת הכפתורים שלמטה", "m", "right");
    else {
      const c = cfg.cands[sel], r = rest(c, fac);
      const eq = fac.length ? c + " = " + prod(fac) + (r > 1 ? "·" + r : "") : String(c);
      h += G.t(20, ry, eq, "big", "start");
      h += G.he(620, ry, r === 1 ? (out ? "פורק עד הסוף: " + out + " בלי מקום ב־" + ltr(B.name) : "פורק עד הסוף: כל האבנים מצאו מקום") : "נשאר לפרק: " + r, r === 1 ? (out ? "w" : "ok") : "m", "right");
    }
    return { svg: h, height: ry + 16 };
  }

  /* ---------- mode: gcd ---------- */
  function drawGcd(st, cfg) {
    const [X, Y] = cfg.baskets, rows = [46, 196], mid = 121, bx = 136;
    let h = "";
    [X, Y].forEach((B, bi) => {
      const y = rows[bi], n = B.chips.length;
      h += G.rect(bx - 34, y - 30, Math.max(X.chips.length, Y.chips.length) * STEP + 10, 60, "bg", { rx: 14 }) + G.t(50, y + 8, B.name + " =", "big", "middle");
      B.chips.forEach((v, i) => {
        const x = bx + i * STEP, paired = st.pairs.some(p => p[bi] === i);
        h += paired ? G.circle(x, y, R, "ghost") : G.tap(G.circle(x, y, R, "box hot"), "k" + bi + "_" + i) + G.t(x, y + 6, v, "b", "middle", np);
      });
    });
    const w = Math.max(X.chips.length, Y.chips.length) * STEP + 10;
    h += G.rect(bx - 34, mid - 28, w, 56, "fok-soft", { rx: 14 }) + G.he(50, mid + 6, "משותף", "ok", "middle");
    st.pairs.forEach((p, i) => {
      const x = bx + i * STEP, v = X.chips[p[0]];
      h += G.tap(G.circle(x, mid, R, "fok hot"), "u" + i) + G.t(x, mid + 6, v, "inv", "middle", np);
    });
    if (!st.pairs.length) h += G.he(bx - 34 + w / 2, mid + 6, "לחץ על אבן שנמצאת בשני המספרים", "m", "middle");
    const free = bi => cfg.baskets[bi].chips.filter((v, i) => !st.pairs.some(p => p[bi] === i));
    const fx = free(0), fy = free(1), more = fx.some(v => fy.includes(v));
    const ry = 262;
    h += G.he(620, ry, "האבנים המשותפות שאספת: " + ltr(st.pairs.length ? prod(st.pairs.map(p => X.chips[p[0]])) : "—"), "b", "right");
    h += G.he(620, ry + 26, st.pairs.length ? (more ? "יש עוד אבן שנמצאת גם למעלה וגם למטה" : "אין עוד אבן שנמצאת בשניהם") : "", more ? "m" : "ok", "right");
    return { svg: h, height: ry + 40 };
  }

  Boards["alg-chips"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const gcd = cfg.mode === "gcd";
      const render = () => {
        const d = gcd ? drawGcd(st, cfg) : drawDiv(st, cfg);
        const tools = gcd ? [] : (cfg.primes || [2, 3, 5, 7]).map(p => ({ label: "÷ " + p, op: "div", n: p, disabled: st.sel === null || rest(cfg.cands[st.sel], st.fac[st.sel]) === 1 }));
        if (!gcd) tools.push({ label: "בטל פירוק אחרון", op: "undo", quiet: true, disabled: st.sel === null || !st.fac[st.sel].length });
        tools.push({ label: "↺ מההתחלה", op: "reset", quiet: true });
        ui.set({ height: d.height, svg: d.svg, tools, msg: st.msg });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "אבני בניין ראשוניות לפתרון השאלה",
        onTap(key) {
          st.msg = "";
          if (key[0] === "c") st.sel = +key.slice(1);
          else if (key[0] === "u") st.pairs.splice(+key.slice(1), 1);
          else if (key[0] === "k") {
            const [bi, i] = key.slice(1).split("_").map(Number), oi = 1 - bi, A = cfg.baskets[bi], O = cfg.baskets[oi], v = A.chips[i];
            const j = O.chips.findIndex((q, k) => q === v && !st.pairs.some(p => p[oi] === k));
            if (j >= 0) { const p = []; p[bi] = i; p[oi] = j; st.pairs.push(p); }
            else st.msg = O.chips.includes(v) ? `ב־${O.name} אין עוד ${v} פנוי: כל ה־${v} שלו כבר נלקחו.` : `ב־${O.name} אין ${v} בכלל, ולכן ${v} לא משותף.`;
          }
          render();
        },
        onOp(op, el) {
          st.msg = "";
          if (op === "reset") kit.reset(st, fresh(cfg));
          else if (op === "undo") st.fac[st.sel].pop();
          else if (op === "div") {
            const p = +el.dataset.n, r = rest(cfg.cands[st.sel], st.fac[st.sel]);
            if (r % p === 0) st.fac[st.sel].push(p); else st.msg = `${r} לא מתחלק ב־${p}. נסה ראשוני אחר.`;
          }
          render();
        },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      if (chosen === correct || chosen === undefined || isNaN(chosen) || !cfg.opts) { host.innerHTML = ""; return; }
      const r = 15, step = 40, bx = 170;
      let h = "", y = 26;
      [[chosen, "chosen", "fwarn"], [correct, "correct", "fok-soft"]].forEach(([j, kind]) => {
        h += kit.rowTitle(620, y, kind) + G.t(20, y, cfg.optLabels[j], "b", "start"); y += 14;
        cfg.baskets.forEach(B => {
          const m = match(B.chips, cfg.opts[j]), cy = y + 24;
          h += G.t(120, cy + 6, B.name + " =", "b", "middle");
          h += G.rect(bx - 24, cy - 21, B.chips.length * step + 8, 42, "bg", { rx: 12 });
          B.chips.forEach((v, i) => { const on = m.some(c => c.slot === i); h += G.circle(bx + i * step, cy, r, on ? "fok-soft" : "box") + G.t(bx + i * step, cy + 5, v, on ? "b" : "m"); });
          const miss = m.filter(c => c.slot < 0), mx = bx + B.chips.length * step + 60;
          miss.forEach((c, i) => { h += G.circle(mx + i * step, cy, r, "fwarn") + G.t(mx + i * step, cy + 5, c.v, "w"); });
          h += G.he(620, cy + 5, miss.length ? "חסר" : "נכנס", miss.length ? "w" : "ok", "right");
          y += 50;
        });
        h += G.he(620, y + 16, cfg.caps[j], "m", "right"); y += 54;
      });
      kit.compare(host, { height: y - 24, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה באבני הבניין" });
    },
  };
})();
