/* board-alg-fr-defs.js — two small tools for the "definitions" questions (natural / even / prime / reciprocal).
   mode "inspect": pick a number on the line; its dots can be arranged in groups of any size (tap a chip) to test divisors and parity.
     cfg: { type:"alg-fr-defs", mode:"inspect", n (the question's number), max, tip,
            cmp:{ views:[{ kind:"line"|"pairs"|"text"|"divs", n?, f?, cap } per option] }, notes }
   mode "sieve": a grid of numbers; tap to cross a number out (or cross out all multiples of 2/3/5); the count of what is left is live.
     cfg: { type:"alg-fr-defs", mode:"sieve", from, to, tip, cmp:{ sets:[[numbers kept] per option] }, notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr } = kit, T0 = 40, T1 = 600, NP = { "pointer-events": "none" };
  const fresh = cfg => cfg.mode === "sieve" ? { init: true, out: {} } : { init: true, n: cfg.n, g: 0, tested: {}, rec: false };
  const divs = n => { const o = []; for (let d = 1; d <= n; d++) if (n % d === 0) o.push(d); return o; };
  const cntHe = k => k === 1 ? "מחלק אחד" : k === 2 ? "שני מחלקים" : k + " מחלקים";

  // n dots in groups of g, starting at x; full groups framed, leftovers in warning color
  function dots(x, y, n, g, r = 11) {
    let h = "", X = x; const step = r * 2 + 12, full = g ? Math.floor(n / g) : 0;
    for (let k = 0; k < n; k++) {
      const grp = g ? Math.floor(k / g) : -1, left = g && grp >= full;
      if (g && k % g === 0 && !left) h += G.rect(X - r - 5, y - r - 5, g * step - 12 + 10, r * 2 + 10, "fok-soft", { rx: r + 5 });
      h += G.circle(X, y, r, left ? "fwarn" : "fa");
      X += step + (g && (k + 1) % g === 0 ? 12 : 0);
    }
    return h;
  }

  function drawInspect(st, cfg) {
    const n = st.n, max = cfg.max, X = v => T0 + v / max * (T1 - T0), g = st.g; let h = "";
    h += G.he(612, 22, "המספר שבודקים: " + ltr(String(n)), "b", "right") + G.line(T0 - 14, 56, T1 + 14, 56, "ink");
    for (let k = 0; k <= max; k++) h += G.line(X(k), 49, X(k), 63, "ink") + G.t(X(k), 86, k, "m");
    h += G.knob(X(n), 56, "n", 15);
    const r = n > 9 ? 9 : 11; h += dots(40, 128, n, g, r);
    const q = g ? Math.floor(n / g) : 0, rem = g ? n % g : 0;
    h += G.he(612, 172, !g ? "לחץ על מספר בשורה למטה כדי לסדר את העיגולים בקבוצות" : rem ? `קבוצות של ${g}: נשאר ${rem} בחוץ, ולכן ${n} לא מתחלק ב־${g}` : `קבוצות של ${g}: יוצא בדיוק, ולכן ${n} מתחלק ב־${g}`, g ? (rem ? "w" : "ok") : "m", "right");
    h += G.he(612, 206, "קבוצות של:", "m", "right");
    const m = Math.max(n, 2), cw = 40;
    for (let d = 1; d <= m; d++) {
      const x = T0 + (d - 1) * 46, t = st.tested[d], ok = n % d === 0;
      h += G.tap(G.rect(x, 216, cw, 36, (t ? (ok ? "fok-soft" : "ghost") : "box") + " hot", { rx: 8 }), "d" + d) + G.t(x + cw / 2, 240, d, d === g ? "b" : t && !ok ? "m" : "", "middle", NP);
      if (t && !ok) h += G.line(x + 6, 246, x + cw - 6, 222, "mut", NP);
    }
    const found = divs(n).filter(d => st.tested[d]), all = Object.keys(st.tested).length >= m;
    h += G.he(612, 284, found.length ? "מחלקים שמצאת: " + ltr(found.join(", ")) + (all ? " · בדקת הכול: ל־" + n + " יש " + cntHe(found.length) : "") : "עדיין לא מצאת מחלקים", "b", "right");
    let H = 298;
    if (st.rec) { h += G.he(612, 318, `ההופכי של ${n} הוא ` + ltr("1/" + n) + (n === 1 ? ", כלומר 1 עצמו" : "") + ", כי " + ltr(`${n} · 1/${n} = 1`), "blue", "right"); H = 332; }
    return { svg: h, height: H };
  }

  const CW = 54, CH = 44;
  function drawSieve(st, cfg) {
    let h = "", left = 0; const cols = 10;
    for (let v = cfg.from; v <= cfg.to; v++) {
      const k = v - cfg.from, x = 50 + (k % cols) * CW, y = 14 + Math.floor(k / cols) * (CH + 6), out = st.out[v];
      if (!out) left++;
      h += G.tap(G.rect(x, y, CW - 6, CH, (out ? "ghost" : "fsoft") + " hot", { rx: 6 }), "c" + v) + G.t(x + (CW - 6) / 2, y + 28, v, out ? "m" : "b", "middle", NP);
      if (out) h += G.line(x + 8, y + CH - 8, x + CW - 14, y + 8, "mut", NP);
    }
    const rows = Math.ceil((cfg.to - cfg.from + 1) / cols), y = 14 + rows * (CH + 6) + 22;
    h += G.he(612, y, "לחץ על מספר כדי למחוק אותו (לחיצה נוספת מחזירה)", "m", "right") + G.he(612, y + 32, "נשארו: " + left + " מספרים", "a", "right");
    return { svg: h, height: y + 46 };
  }

  Boards["alg-fr-defs"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const sieve = cfg.mode === "sieve";
      const render = () => {
        const d = sieve ? drawSieve(st, cfg) : drawInspect(st, cfg);
        const tools = sieve ? [2, 3, 5].map(n => ({ label: "מחק כפולות של " + n, op: "mult", n })) : [{ label: st.rec ? "הסתר הופכי" : "הראה את ההופכי", op: "rec", active: st.rec }];
        ui.set({ height: d.height, svg: d.svg, msg: "", tools: [...tools, { label: "↺ מההתחלה", op: "reset", quiet: true }] });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: sieve ? "לוח מספרים לסינון" : "בדיקת תכונות של מספר",
        onTap(key) {
          const v = +key.slice(1);
          if (key[0] === "c") st.out[v] = !st.out[v]; else { st.g = v; st.tested[v] = true; }
          render();
        },
        onDrag(key, pt) { const n = Math.max(1, Math.min(cfg.max, Math.round((pt.x - T0) / (T1 - T0) * cfg.max))); if (n !== st.n) { st.n = n; st.g = 0; st.tested = {}; } render(); },
        onOp(op, el) {
          if (op === "mult") { const m = +el.dataset.n; for (let v = 2 * m; v <= cfg.to; v += m) if (v >= cfg.from) st.out[v] = true; }
          else if (op === "rec") st.rec = !st.rec; else kit.reset(st, fresh(cfg));
          render();
        },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      const C = cfg.cmp; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const sides = [[chosen, "chosen", "fwarn"], [correct, "correct", "fok"]]; let h = "", H;
      if (cfg.mode === "sieve") {
        const w = 27;
        sides.forEach(([j, kind, fc], i) => {
          const y = 30 + i * 96, set = C.sets[j];
          h += kit.rowTitle(612, y - 8, kind);
          for (let v = cfg.from; v <= cfg.to; v++) { const x = 40 + (v - cfg.from) * (w + 1.6), on = set.includes(v); h += G.rect(x, y, w, 30, on ? fc : "ghost", { rx: 4 }) + G.t(x + w / 2, y + 20, v, on ? "b" : "m", "middle", { style: "font-size:13px" }); }
          h += G.he(612, y + 54, "נשארו " + set.length + " מספרים", "m", "right");
        });
        H = 196;
      } else {
        sides.forEach(([j, kind, fc], i) => {
          const y = 30 + i * 128, V = C.views[j];
          h += kit.rowTitle(612, y - 8, kind);
          if (V.kind === "line") { const X = v => 60 + v * 70; h += G.line(46, y + 34, 494, y + 34, "ink"); for (let k = 0; k <= 6; k++) h += G.line(X(k), y + 28, X(k), y + 40, "ink") + G.t(X(k), y + 62, k, "m") + (k >= 1 ? G.circle(X(k), y + 34, k === V.n ? 11 : 6, k === V.n ? fc : "fblue-soft") : ""); }
          else if (V.kind === "pairs") h += dots(60, y + 34, V.n, 2);
          else if (V.kind === "text") h += G.t(60, y + 42, V.f, "big", "start");
          else V.ns.forEach((n, k) => { const x = 60 + k * 200; h += G.t(x, y + 42, n + ":", "big", "start"); divs(n).forEach((d, q) => { h += G.rect(x + 44 + q * 46, y + 18, 38, 34, n === cfg.n ? fc : "fblue-soft", { rx: 8 }) + G.t(x + 63 + q * 46, y + 41, d, "b"); }); h += G.he(x + 20, y + 76, cntHe(divs(n).length), "m", "left"); });
          h += G.he(612, y + (V.kind === "divs" ? 100 : 86), V.cap, "m", "right");
        });
        H = 274;
      }
      kit.compare(host, { height: H, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה על הציור" });
    },
  };
})();
