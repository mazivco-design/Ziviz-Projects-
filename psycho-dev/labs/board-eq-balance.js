/* board-eq-balance.js — a balance for linear equations: x tiles and unit tiles on two pans.
   Tap a group of tiles to take it off BOTH pans (the legal move "do the same to both sides"); divide both pans; open brackets.
   cfg: { type:"eq-balance", tip, L:{x,u}, R:{x,u}, div:[2,3,5],
          pre?:{ side:"L", text:"4x − 2(x + 3)", x:4, k:-2, in:{x:1,u:3}, open:{x:2,u:-6}, msg }   (a side that still has brackets),
          compare:{ checks:[ per option: [x values] ], caps:[per option] }, notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, PY = 200, CX = { L: 170, R: 470 }, NP = { "pointer-events": "none" };
  const nf = v => (v < 0 ? "−" : "") + pf(Math.abs(v));
  const fresh = cfg => ({ init: 1, L: { ...(cfg.pre && cfg.pre.side === "L" ? cfg.pre.open : cfg.L) }, R: { ...(cfg.pre && cfg.pre.side === "R" ? cfg.pre.open : cfg.R) }, pre: !!cfg.pre, hist: [], msg: "" });
  const sideText = s => { const a = Math.abs(s.x), xs = s.x ? (s.x < 0 ? "−" : "") + (a === 1 ? "" : a) + "x" : ""; return !s.x ? nf(s.u) : xs + (s.u ? (s.u < 0 ? " − " : " + ") + Math.abs(s.u) : ""); };
  const xT = n => (Math.abs(n) === 1 ? "" : Math.abs(n)) + "x";

  function tile(x, y, kind, neg) {
    const lab = (neg ? "−" : "") + (kind === "x" ? "x" : "1");
    return (kind === "x" ? G.rect(x, y, 30, 30, neg ? "ghost" : "fblue-soft", { rx: 3 }) : G.circle(x + 15, y + 15, 15, neg ? "ghost" : "fsoft")) + G.t(x + 15, y + 20, lab, kind === "x" && !neg ? "b" : "m", "middle", NP);
  }
  // tiles of one pan; returns markup. groups: x tiles first (bottom rows), units above.
  function pan(cx, s, key, tappable) {
    let h = "", row = 0;
    if (!s.x && !s.u) return G.t(cx, PY - 14, "0", "big");
    for (const kind of ["x", "u"]) {
      const n = s[kind]; if (!n) continue;
      const a = Math.abs(n), big = a > 15, rows = big ? 1 : Math.ceil(a / 5), yTop = PY - 36 * (row + rows);
      if (big) h += G.rect(cx - 60, yTop + 2, 120, 32, n < 0 ? "ghost" : kind === "x" ? "fblue-soft" : "fsoft", { rx: 16 }) + G.t(cx, yTop + 24, (n < 0 ? "−" : "") + (kind === "x" ? xT(n) : a), "b", "middle", NP);
      else for (let i = 0; i < a; i++) { const r = Math.floor(i / 5), inRow = Math.min(5, a - r * 5); h += tile(cx - inRow * 17 + (i % 5) * 34 + 2, PY - 36 * (row + r + 1) + 3, kind, n < 0); }
      if (tappable) h += G.tap(G.rect(cx - 92, yTop, 184, rows * 36, "hot", { rx: 8, style: "fill:transparent" }), key + ":" + kind);
      row += rows;
    }
    return h;
  }
  function prePan(cx, P) {       // e.g. 4x − 2(x + 3): x tiles in the bottom row, and |k| dashed bundles above with a "− " mark
    let h = "";
    for (let i = 0; i < P.x; i++) h += tile(cx - P.x * 17 + i * 34 + 2, PY - 33, "x", false);
    const inner = [...Array(P.in.x).fill("x"), ...Array(P.in.u).fill("u")], w = inner.length * 34 + 8;
    for (let b = 0; b < Math.abs(P.k); b++) {
      const y = PY - 36 * (b + 2) - 6 * (b + 1);
      h += G.rect(cx - w / 2 + 12, y - 2, w, 36, "ghost", { rx: 8 }) + G.t(cx - w / 2 - 4, y + 22, P.k < 0 ? "−" : "+", "big");
      inner.forEach((t, i) => { h += tile(cx - w / 2 + 16 + i * 34, y + 1, t, false); });
    }
    return h + G.tap(G.rect(cx - 100, PY - 130, 200, 130, "hot", { style: "fill:transparent" }), "open");
  }
  function beam(cx, y, th, half) { const dx = half * Math.cos(th), dy = half * Math.sin(th); return { lx: cx - dx, ly: y + dy, rx: cx + dx, ry: y - dy }; }

  function draw(st, cfg) {
    let h = G.poly([[320, PY + 8], [296, PY + 44], [344, PY + 44]], "bg") + G.line(70, PY + 4, 570, PY + 4, "ink", { "stroke-width": 6, "stroke-linecap": "round" });
    const pre = st.pre && cfg.pre;
    for (const k of ["L", "R"]) h += pre && cfg.pre.side === k ? prePan(CX[k], cfg.pre) : pan(CX[k], st[k], k, !st.pre);
    h += G.t(320, PY - 40, "=", "big");
    const tL = pre && cfg.pre.side === "L" ? cfg.pre.text : sideText(st.L), tR = pre && cfg.pre.side === "R" ? cfg.pre.text : sideText(st.R);
    const noX = !st.pre && !st.L.x && !st.R.x, solved = !st.pre && ((st.L.x === 1 && !st.L.u && !st.R.x) || (st.R.x === 1 && !st.R.u && !st.L.x));
    h += G.t(320, PY + 78, tL + " = " + tR, "big" + (solved || (noX && st.L.u === st.R.u) ? " ok" : noX ? " w" : ""));
    const hint = st.pre ? ["קודם פותחים את הסוגריים", "m"] : noX ? (st.L.u === st.R.u ? ["x נעלם והשוויון נכון: הכפות מאוזנות בכל מקרה", "ok"] : ["x נעלם והשוויון לא נכון: הכפות לא יכולות להתאזן", "w"])
      : solved ? ["x נשאר לבד על הכף", "ok"] : ["לחץ על קבוצת אריחים כדי להוריד אותה משתי הכפות", "m"];
    h += G.he(320, PY + 106, hint[0], hint[1]);
    return { svg: h, height: PY + 120 };
  }

  Boards["eq-balance"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const all = () => [st.L.x, st.L.u, st.R.x, st.R.u];
      const save = () => st.hist.push(JSON.stringify({ L: st.L, R: st.R, pre: st.pre, msg: st.msg }));
      const open = () => { save(); st.pre = false; st.msg = cfg.pre.msg || ""; };
      const render = () => {
        const d = draw(st, cfg);
        ui.set({
          height: d.height, svg: d.svg, msg: st.msg,
          tools: [
            ...(st.pre ? [{ label: "פתח סוגריים", op: "open" }] : []),
            ...(cfg.div || [2, 3, 5]).map(n => ({ label: "חלק ב־" + n, op: "div", n, disabled: st.pre || all().some(v => v % n) || all().every(v => !v) })),
            { label: "הפוך סימנים", op: "flip", disabled: st.pre || all().every(v => !v) },
            ...(st.hist.length ? [{ label: "בטל צעד", op: "undo", quiet: true }] : []),
            { label: "↺ מההתחלה", op: "reset", quiet: true },
          ],
        });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "מאזניים לפתרון המשוואה",
        onTap(key) {
          if (key === "open") { if (st.pre) open(); render(); return; }
          const [side, kind] = key.split(":"), n = st[side][kind]; if (!n) return;
          save(); st.L[kind] -= n; st.R[kind] -= n;
          const what = kind === "x" ? ltr(xT(n)) : Math.abs(n);
          st.msg = (n > 0 ? `הורדת ${what} משתי הכפות.` : `הוספת ${what} לשתי הכפות, וכך התבטל ה־${ltr("−" + (kind === "x" ? xT(n) : Math.abs(n)))}.`) + ` עכשיו: ${sideText(st.L)} = ${sideText(st.R)}`;
          render();
        },
        onOp(op, el) {
          if (op === "reset") kit.reset(st, fresh(cfg));
          else if (op === "undo") Object.assign(st, JSON.parse(st.hist.pop()));
          else if (op === "open") open();
          else {
            save(); const n = op === "flip" ? -1 : +el.dataset.n;
            for (const s of ["L", "R"]) for (const k of ["x", "u"]) st[s][k] = st[s][k] / n || 0;
            st.msg = (op === "flip" ? "הפכת את הסימן בשתי הכפות (כפל ב־−1)." : `חילקת את שתי הכפות ב־${n}.`) + ` עכשיו: ${sideText(st.L)} = ${sideText(st.R)}`;
          }
          render();
        },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const side = k => cfg.pre && cfg.pre.side === k ? cfg.pre.open : cfg[k];
      let h = "";
      [[chosen, "chosen"], [correct, "correct"]].forEach(([j, kind], i) => {
        const y = 26 + i * 160, xs = C.checks[j];
        h += kit.rowTitle(612, y, kind);
        xs.forEach((c, q) => {
          const xv = Array.isArray(c) ? c[0] : c, xl = Array.isArray(c) ? c[1] : nf(c), wl = side("L").x * xv + side("L").u, wr = side("R").x * xv + side("R").u;
          const cx = 520 - q * 200 - (3 - xs.length) * 100, by = y + 62, b = beam(cx, by, Math.max(-.16, Math.min(.16, (wl - wr) * .04)), 68), bal = Math.abs(wl - wr) < 1e-9;
          h += G.poly([[cx, by + 3], [cx - 12, by + 24], [cx + 12, by + 24]], "bg") + G.line(b.lx, b.ly, b.rx, b.ry, "ink", { "stroke-width": 4, "stroke-linecap": "round" });
          [[b.lx, b.ly, wl, "fblue-soft"], [b.rx, b.ry, wr, "fsoft"]].forEach(([px, py, w, cls]) => { h += G.rect(px - 30, py - 30, 60, 26, cls, { rx: 8 }) + G.t(px, py - 11, nf(w), "b"); });
          h += G.t(cx, by + 44, "x = " + xl, bal ? "ok" : "w");
        });
        h += G.he(xs.length ? 612 : 320, xs.length ? y + 124 : y + 70, C.caps[j], "m", xs.length ? "right" : "middle");
      });
      kit.compare(host, { height: 330, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה על המאזניים" });
    },
  };
})();
