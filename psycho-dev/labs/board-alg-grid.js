/* board-alg-grid.js — number-tile grid for primes / multiples questions.
   mode "sieve":  buttons strike the multiples of k; tap the tiles that survive to collect them into a sum.
   mode "pick":   buttons color the multiples of each k; tap a tile to choose n and see n : d for every d in cfg.checks.
   mode "triple": tap a tile to choose p; p, p+step, p+2·step light up and each one is tested for primality.
   cfg: { type:"alg-grid", mode, lo, hi, cols, ks:[..], checks?:[..], step?, tip,
          cmp:{ j: { tiles:[{t, s:"on"|"bad"|"", sub?} | null], cap } }, notes:{ j: text } } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, np = { "pointer-events": "none" };
  const fresh = cfg => ({ init: 1, on: {}, picks: [], n: null, tried: [], fail: {}, found: [], msg: "" });
  const spf = v => { for (let d = 2; d * d <= v; d++) if (v % d === 0) return d; return v; };
  const isPrime = v => v > 1 && spf(v) === v;

  function draw(st, cfg) {
    const { lo, hi, cols, mode } = cfg, n = hi - lo + 1, rows = Math.ceil(n / cols), tw = Math.min(80, 600 / cols), th = mode === "sieve" ? 54 : 40;
    const x0 = 320 - cols * tw / 2, y0 = 10, step = cfg.step || 10, ks = cfg.ks.filter(k => st.on[k]);
    let h = "";
    for (let v = lo; v <= hi; v++) {
      const i = v - lo, x = x0 + (i % cols) * tw, y = y0 + Math.floor(i / cols) * th, cx = x + tw / 2;
      if (mode === "sieve") {
        const k = ks.find(k => v % k === 0 && v !== k), picked = st.picks.includes(v);
        h += G.tap(G.rect(x + 2, y + 2, tw - 4, th - 4, (k ? "ghost" : picked ? "fsoft" : "box") + " hot", { rx: 6 }), "t" + v);
        h += G.t(cx, y + (k ? 24 : 33), v, k ? "m" : picked ? "a" : "b", "middle", np);
        if (k) h += G.t(cx, y + 44, k + "·" + v / k, "m", "middle", np) + G.line(x + 10, y + th - 10, x + tw - 10, y + 10, "mut", np);
      } else {
        const hot = mode === "pick" || v + 2 * step <= hi;
        let r = G.rect(x + 2, y + 2, tw - 4, th - 4, "box" + (hot ? " hot" : ""), { rx: 6 });
        h += hot ? G.tap(r, "t" + v) : r;
        if (mode === "pick") { const hit = cfg.ks.map(k => st.on[k] && v % k === 0); if (hit[0] || hit[1]) h += G.rect(x + 3, y + 3, tw - 6, th - 6, hit[0] && hit[1] ? "fa" : hit[1] ? "fok-soft" : "fblue-soft", { rx: 5, ...np }); }
        else if (ks.some(k => v % k === 0)) h += G.rect(x + 3, y + 3, tw - 6, th - 6, "fblue-soft", { rx: 5, ...np });
        const sel = mode === "pick" ? st.n === v : st.n !== null && [0, step, 2 * step].includes(v - st.n);
        if (sel) h += G.rect(x + 1, y + 1, tw - 2, th - 2, mode === "pick" ? "ink" : "sa", { rx: 6, "stroke-width": 4, ...np });
        h += G.t(cx, y + 26, v, mode === "pick" && cfg.ks.every(k => st.on[k] && v % k === 0) ? "inv" : sel ? "a" : "b", "middle", np);
      }
    }
    let y = y0 + rows * th + 30;
    if (mode === "sieve") {
      const p = st.picks.slice().sort((a, b) => a - b);
      h += p.length ? G.he(620, y, "אספת:", "b", "right") + G.t(560, y, p.join(" + ") + " = " + p.reduce((a, b) => a + b, 0), "big", "end")
        : G.he(620, y, "לחץ על מספר שנשאר כדי לאסוף אותו לסכום", "m", "right");
      return { svg: h, height: y + 14 };
    }
    if (mode === "pick") {
      if (cfg.ks.some(k => st.on[k])) {
        h += G.he(620, y, "כחול: כפולה של " + cfg.ks[0] + " · ירוק: כפולה של " + cfg.ks[1] + " · מלא: כפולה של שניהם", "m", "right"); y += 30;
      }
      if (st.n === null) { h += G.he(620, y, "לחץ על מספר כדי לבדוק אותו בתור n", "m", "right"); return { svg: h, height: y + 14 }; }
      const bad = cfg.ks.find(k => st.n % k);
      if (bad) { h += G.he(620, y, ltr("n = " + st.n) + " לא מתחלק ב־" + bad + ", אז הוא לא מתאים לנתון. בחר מספר אחר.", "w", "right"); return { svg: h, height: y + 14 }; }
      const bw = 600 / cfg.checks.length;
      cfg.checks.forEach((d, i) => {
        const x = 20 + i * bw, okk = st.n % d === 0, f = st.fail[d];
        h += G.rect(x + 4, y - 20, bw - 8, 62, okk ? "fok-soft" : "fwarn", { rx: 8 });
        h += G.t(x + bw / 2, y + 2, st.n + " : " + d + " = " + pf(st.n / d), okk ? "b" : "w");
        h += G.he(x + bw / 2, y + 28, f ? "נכשל ב־" + f : "עד עכשיו תמיד", "m", "middle");
      });
      return { svg: h, height: y + 54 };
    }
    // triple
    if (st.n === null) h += G.he(620, y, "לחץ על מספר כדי לבדוק אותו בתור p", "m", "right");
    else {
      const bw = 200;
      [0, 1, 2].forEach(i => {
        const v = st.n + i * step, pr = isPrime(v), x = 20 + i * bw;
        h += G.rect(x + 4, y - 22, bw - 8, 38, pr ? "fok-soft" : "fwarn", { rx: 8 });
        h += pr ? G.he(x + bw / 2, y + 3, v + " ראשוני", "ok", "middle") : G.he(x + bw / 2, y + 3, v === 1 ? "1 אינו ראשוני" : ltr(v + " = " + spf(v) + "·" + v / spf(v)) + " לא ראשוני", "w", "middle");
      });
    }
    y += 44;
    h += G.he(620, y, st.found.length ? "ערכי p שעבדו עד עכשיו: " + ltr(st.found.join(", ")) : st.tried.length ? "עדיין לא נמצא p שבו שלושתם ראשוניים" : "", st.found.length ? "ok" : "m", "right");
    if (st.tried.length) h += G.he(620, y + 24, "ניסית: " + ltr(st.tried.join(", ")), "m", "right");
    return { svg: h, height: y + 36 };
  }

  function tileRow(row, y, onCls) {
    const n = row.tiles.length, tw = Math.min(130, 600 / n), x0 = 620 - n * tw; let h = "";
    row.tiles.forEach((t, i) => {
      if (!t) return; const x = x0 + i * tw;
      if (t.s === "op") { h += G.t(x + tw / 2, y + 27, t.t, "big"); return; }
      h += G.rect(x + 3, y, tw - 6, 40, t.s === "on" ? onCls : t.s === "bad" ? "ghost" : "box", { rx: 6 }) + G.t(x + tw / 2, y + 26, t.t, t.s === "bad" ? "w" : "b");
      if (t.sub) h += G.t(x + tw / 2, y + 58, t.sub, "m");
    });
    return h;
  }

  Boards["alg-grid"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const render = () => {
        const d = draw(st, cfg);
        const lab = k => cfg.mode === "sieve" ? "מחק כפולות של " + k : "צבע כפולות של " + k;
        ui.set({ height: d.height, svg: d.svg, msg: st.msg, tools: [...cfg.ks.map(k => ({ label: lab(k), op: "k", n: k, active: !!st.on[k] })), { label: "↺ מההתחלה", op: "reset", quiet: true }] });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "לוח מספרים לפתרון השאלה",
        onTap(key) {
          const v = +key.slice(1); st.msg = "";
          if (cfg.mode === "sieve") {
            const k = cfg.ks.find(k => st.on[k] && v % k === 0 && v !== k);
            if (k) st.msg = `${v} מחוק: ${v} = ${k}·${v / k}, ולכן הוא לא ראשוני.`;
            else if (st.picks.includes(v)) st.picks = st.picks.filter(x => x !== v); else st.picks.push(v);
          } else if (cfg.mode === "pick") {
            st.n = v;
            if (!cfg.ks.some(k => v % k)) { if (!st.tried.includes(v)) st.tried.push(v); cfg.checks.forEach(d => { if (v % d && !st.fail[d]) st.fail[d] = v; }); }
          } else {
            st.n = v; const s = cfg.step || 10;
            if (!st.tried.includes(v)) st.tried.push(v);
            if ([v, v + s, v + 2 * s].every(isPrime) && !st.found.includes(v)) st.found.push(v);
          }
          render();
        },
        onOp(op, el) {
          if (op === "reset") kit.reset(st, fresh(cfg));
          else { const k = +el.dataset.n; st.on[k] = !st.on[k]; st.msg = ""; if (cfg.mode === "sieve" && st.on[k]) st.picks = st.picks.filter(v => v % k || v === k); }
          render();
        },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      const C = cfg.cmp; if (!C || chosen === correct || chosen === undefined || isNaN(chosen) || !C[chosen]) { host.innerHTML = ""; return; }
      let h = "", y = 24;
      [[chosen, "chosen", "fwarn"], [correct, "correct", "fok-soft"]].forEach(([j, kind, cls]) => {
        const row = C[j], sub = row.tiles.some(t => t && t.sub);
        h += kit.rowTitle(620, y, kind) + tileRow(row, y + 12, cls);
        y += 12 + 40 + (sub ? 22 : 0) + 24; h += G.he(620, y, row.cap, "m", "right"); y += 44;
      });
      kit.compare(host, { height: y - 30, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה על לוח המספרים" });
    },
  };
})();
