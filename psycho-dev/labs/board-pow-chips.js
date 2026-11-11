/* board-pow-chips.js — factor chips for powers and roots. Tap a number to break it into prime chips. Three modes:
   frac: chips above and below a fraction line; tap a prime chip to cancel it against the same prime on the other side.
   eq:   two sides that depend on n; choose n, split to the common base and compare how many chips each side has.
   root: chips under root signs; tap a prime that has a pair (index 3: a triple) to take it out of the root as ONE chip;
         roots that are multiplied can be merged under one sign.
   cfg: { type:"pow-chips", tip, mode,
          frac: head, num:[..], den:[..]
          eq:   var:"n", vals:[0,1,2,3], base:3, L:{t:"9ⁿ · 3⁴", parts:[{v:9,k:[1,0]},{v:3,k:[0,4]}]}, R:{...}   (count of chips v = k[0]·n + k[1])
          root: idx:2, join:"·"|"+", groups:[[50],[2]], power?:2
          compare:{ rows:[ per option: {kind:"frac"|"root"|"eq"|"flat", a:[..], b:[..], cap} ] }, notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, NP = { "pointer-events": "none" };
  const SUP = s => String(s).replace(/./g, c => "⁰¹²³⁴⁵⁶⁷⁸⁹"["0123456789".indexOf(c)] || c);
  const primes = v => { const o = []; for (let p = 2; v > 1; p++) while (v % p === 0) { o.push(p); v /= p; } return o; };
  const isP = v => primes(v).length <= 1;
  const prod = a => a.reduce((s, v) => s * v, 1);
  const CLS = v => v === 2 ? "fblue-soft" : v === 3 ? "fok-soft" : isP(v) ? "box" : "fsoft";
  function chip(x, y, v, key, dead, r = 17) {
    const el = G.circle(x, y, r, (dead ? "ghost" : CLS(v)) + (key && !dead ? " hot" : ""));
    return (key && !dead ? G.tap(G.circle(x, y, r + 2, "hot", { style: "fill:transparent;stroke:none" }), key).replace(/^/, el) : el) + G.t(x, y + 5, v, dead ? "m" : "b", "middle", NP) + (dead ? G.line(x - r + 5, y + r - 5, x + r - 5, y - r + 5, "mut") : "");
  }
  const rowX = (n, i, P, cx = 320) => cx - (n - 1) * P / 2 + i * P;
  const rootPath = (x, y, w, r = 17) => G.path(`M${x - 18},${y + 2} L${x - 12},${y - 3} L${x - 4},${y + r + 6} L${x + 6},${y - r - 9} L${x + w},${y - r - 9}`, "ink");
  const powText = (b, e) => e === 0 ? "1" : e === 1 ? String(b) : b + SUP(e);
  const one = a => a.length > 0 && a.every(v => v === a[0]);

  const fresh = cfg => cfg.mode === "frac" ? { init: 1, num: cfg.num.map(v => ({ v })), den: cfg.den.map(v => ({ v })), msg: "" }
    : cfg.mode === "eq" ? { init: 1, n: null, split: false, msg: "" }
      : { init: 1, groups: cfg.groups.map(g => ({ in: [...g], out: [] })), msg: "" };

  // ---------- frac ----------
  function drawFrac(st, cfg) {
    const P = 38, w = Math.max(st.num.length, st.den.length) * P + 12;
    let h = G.t(320, 28, cfg.head, "big") + G.line(320 - w / 2, 110, 320 + w / 2, 110, "ink");
    st.num.forEach((c, i) => { h += chip(rowX(st.num.length, i, P), 80, c.v, "n" + i, c.x); });
    st.den.forEach((c, i) => { h += chip(rowX(st.den.length, i, P), 140, c.v, "d" + i, c.x); });
    const n = st.num.filter(c => !c.x).map(c => c.v), d = st.den.filter(c => !c.x).map(c => c.v), all = [...n, ...d];
    const stuck = all.every(isP) && !n.some(v => d.includes(v));
    let res = "לחץ על מספר כדי לפרק אותו, ועל גורם ראשוני כדי לצמצם אותו מול אותו גורם בצד השני", cls = "m";
    if (stuck) {
      const N = prod(n), D = prod(d); cls = "ok big";
      res = ltr("= " + (!all.length ? "1" : one(n) && !d.length && n.length > 1 ? powText(n[0], n.length) + " = " + pf(N) : one(d) && !n.length && d.length > 1 ? "1/" + powText(d[0], d.length) + " = 1/" + pf(D) : D === 1 ? pf(N) : pf(N) + "/" + pf(D)));
    }
    h += stuck ? G.t(320, 200, res, cls) : G.he(320, 196, res, cls);
    return { svg: h, height: 216 };
  }
  // ---------- eq ----------
  const sideChips = (S, n, split) => { const o = []; S.parts.forEach(p => { const k = p.k[0] * n + p.k[1]; for (let i = 0; i < k; i++) if (split) o.push(...primes(p.v)); else o.push(p.v); }); return o; };
  function drawEq(st, cfg) {
    let h = "", stat = "";
    const cnt = {};
    [["L", 56], ["R", 150]].forEach(([k, y]) => {
      const S = cfg[k]; h += G.t(20, y + 6, S.t, "b", "start");
      if (st.n === null) { h += G.he(360, y + 5, "בחר ערך ל־" + cfg.var + " כדי לראות את הגורמים", "m"); return; }
      const ch = sideChips(S, st.n, st.split); h += G.t(134, y + 6, "=", "b");
      ch.forEach((v, i) => { h += chip(170 + i * 35, y, v, isP(v) ? null : "x" + k + i, false, 15); });
      if (ch.every(v => v === cfg.base)) { cnt[k] = ch.length; h += G.he(612, y + 42, "הגורם " + cfg.base + " מופיע " + ch.length + " פעמים:  " + ltr(S.t + " = " + powText(cfg.base, ch.length)), "a", "right"); }
      else h += G.he(612, y + 42, "לחץ על מספר כדי לפרק אותו לגורמי " + cfg.base, "m", "right");
    });
    if (cnt.L !== undefined && cnt.R !== undefined) stat = cnt.L === cnt.R ? G.he(320, 232, "אותו מספר גורמים בשני האגפים: שווים", "ok") : G.he(320, 232, "מספר הגורמים שונה: האגפים לא שווים", "w");
    return { svg: h + stat, height: 246 };
  }
  // ---------- root ----------
  const gText = (g, idx) => { const c = prod(g.out), r = prod(g.in); return r === 1 ? pf(c) : (c === 1 ? "" : pf(c)) + (idx === 3 ? "³" : "") + "√" + pf(r); };
  const simple = (g, idx) => { const f = primes(prod(g.in)); return !f.some(p => f.filter(q => q === p).length >= idx); };
  function rootRow(groups, cfg, y, P, r, keyed) {
    const idx = cfg.idx || 2, pw = cfg.power ? 26 : 0;
    const hasIn = g => g.in.length || !g.out.length, W = g => g.out.length * P + (hasIn(g) ? 36 + Math.max(1, g.in.length) * P : 6), total = groups.reduce((s, g) => s + W(g) + pw * 2, 0) + (groups.length - 1) * 34;
    let x = 320 - total / 2, h = "";
    groups.forEach((g, gi) => {
      if (gi) { h += G.t(x + 17, y + 8, cfg.join, "big"); x += 34; }
      if (pw) { h += G.t(x + 10, y + 12, "(", "big"); x += pw; }
      g.out.forEach((v, i) => { h += chip(x + P / 2 + i * P, y, v, null, false, r); });
      x += g.out.length * P + (hasIn(g) ? 24 : 6);
      const iw = Math.max(1, g.in.length) * P;
      if (hasIn(g)) {
        h += rootPath(x, y, iw + 6, r) + (idx === 3 ? G.t(x - 15, y - 8, "3", "m") : "");
        g.in.forEach((v, i) => { h += chip(x + 6 + P / 2 + i * P, y, v, keyed ? "g" + gi + "i" + i : null, false, r); });
        if (!g.in.length) h += G.t(x + 6 + P / 2, y + 6, "1", "m");
        x += iw + 12;
      }
      if (pw) { h += G.t(x + 8, y + 12, ")", "big") + G.t(x + 22, y - 6, cfg.power, "b"); x += pw; }
    });
    return h;
  }
  function drawRoot(st, cfg) {
    const idx = cfg.idx || 2, gs = st.groups;
    let h = rootRow(gs, cfg, 74, 40, 17, true);
    let txt = gs.map(g => (cfg.power ? "(" : "") + gText(g, idx) + (cfg.power ? ")" + SUP(cfg.power) : "")).join(" " + cfg.join + " "), fin = false;
    if (gs.every(g => simple(g, idx) && g.in.every(isP))) {
      if (gs.length === 1) {
        const c = prod(gs[0].out), r = prod(gs[0].in);
        if (cfg.power && r === 1) { txt += " = " + pf(Math.pow(c, cfg.power)); fin = true; }
        else if (!cfg.power && gs[0].out.length > 1) { txt = gs[0].out.join(" · ") + (r > 1 ? " · " + (idx === 3 ? "³" : "") + "√" + pf(r) : "") + " = " + gText(gs[0], idx); fin = true; }
        else fin = !cfg.power;
      } else if (cfg.join === "+" && gs.every(g => prod(g.in) === prod(gs[0].in)) && prod(gs[0].in) > 1) { txt += " = " + gText({ out: [gs.reduce((s, g) => s + prod(g.out), 0)], in: gs[0].in }, idx); fin = true; }
    }
    h += G.t(320, 146, "= " + txt, fin ? "big ok" : "big");
    h += G.he(320, 178, "לחץ על מספר כדי לפרק אותו. גורם שיש לו " + (idx === 3 ? "שלישייה" : "זוג") + " מתחת לשורש: לחץ עליו והוא יוצא החוצה", "m");
    return { svg: h, height: 194 };
  }

  const cancelPair = (st, a, b, i) => { const c = st[a][i]; if (!isP(c.v)) { st[a].splice(i, 1, ...primes(c.v).map(v => ({ v }))); st.msg = ""; return; } const o = st[b].find(q => !q.x && q.v === c.v); if (o) { c.x = o.x = 1; st.msg = ""; } else st.msg = `אין ${c.v} בצד השני, אז אין מול מה לצמצם אותו.`; };

  Boards["pow-chips"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const idx = cfg.idx || 2;
      const render = () => {
        const d = cfg.mode === "frac" ? drawFrac(st, cfg) : cfg.mode === "eq" ? drawEq(st, cfg) : drawRoot(st, cfg);
        const tools = cfg.mode === "eq" ? [...cfg.vals.map(v => ({ label: ltr(cfg.var + " = " + v), op: "n", n: v, active: st.n === v })), { label: "פרק הכול לגורמי " + cfg.base, op: "split", disabled: st.n === null || st.split }]
          : cfg.mode === "root" && cfg.join === "·" && cfg.groups.length > 1 ? [{ label: "אחד לשורש אחד", op: "merge", disabled: st.groups.length < 2 }] : [];
        ui.set({ height: d.height, svg: d.svg, msg: st.msg, tools: [...tools, { label: "↺ מההתחלה", op: "reset", quiet: true }] });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "גורמים לפירוק ולצמצום",
        onTap(key) {
          if (cfg.mode === "frac") cancelPair(st, key[0] === "n" ? "num" : "den", key[0] === "n" ? "den" : "num", +key.slice(1));
          else if (cfg.mode === "eq") st.split = true;
          else {
            const [, gi, i] = key.match(/g(\d+)i(\d+)/).map(Number), g = st.groups[gi], v = g.in[i]; st.msg = "";
            if (!isP(v)) g.in.splice(i, 1, ...primes(v));
            else if (g.in.filter(q => q === v).length >= idx) { for (let k = 0; k < idx; k++) g.in.splice(g.in.indexOf(v), 1); g.out.push(v); }
            else st.msg = `מתחת לשורש הזה אין ${idx === 3 ? "שלישייה" : "זוג"} של ${v}, אז הוא נשאר בפנים.`;
          }
          render();
        },
        onOp(op, el) {
          if (op === "reset") kit.reset(st, fresh(cfg));
          else if (op === "n") st.n = +el.dataset.n;
          else if (op === "split") st.split = true;
          else if (op === "merge") { st.groups = [{ in: [].concat(...st.groups.map(g => g.in)), out: [].concat(...st.groups.map(g => g.out)) }]; st.msg = ""; }
          render();
        },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const P = 31, r = 13; let h = "";
      [[chosen, "chosen"], [correct, "correct"]].forEach(([j, kind], i) => {
        const y = 22 + i * 128, R = C.rows[j], a = R.a || [], b = R.b || [];
        h += kit.rowTitle(612, y, kind);
        const line = (arr, yy, cx = 320) => arr.map((v, q) => chip(rowX(arr.length, q, P, cx), yy, v, null, false, r)).join("");
        if (R.kind === "frac") { const w = Math.max(a.length, b.length, 1) * P + 10; h += (a.length ? line(a, y + 28) : G.t(320, y + 34, "1", "b")) + G.line(320 - w / 2, y + 46, 320 + w / 2, y + 46, "ink") + (b.length ? line(b, y + 64) : G.t(320, y + 68, "1", "b")); }
        else if (R.kind === "eq") h += line(a, y + 26, 300) + line(b, y + 62, 300) + G.t(40, y + 31, cfg.L.t, "b", "start") + G.t(40, y + 67, cfg.R.t, "b", "start") + G.t(580, y + 50, a.length === b.length ? "=" : "≠", a.length === b.length ? "big ok" : "big w");
        else if (R.kind === "root") h += rootRow([{ out: a, in: b }], { idx: R.idx || cfg.idx, join: "" }, y + 44, P, r, false);
        else h += line(a, y + 44);
        h += G.he(612, y + 100, R.cap, "m", "right");
      });
      kit.compare(host, { height: 262, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה בגורמים" });
    },
  };
})();
