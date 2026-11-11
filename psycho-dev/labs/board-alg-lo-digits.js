/* board-alg-lo-digits.js — letter-arithmetic board (תרגילים באותיות).
   The exercise is written vertically; the learner picks a digit for every letter and the board computes the result
   live and marks, digit by digit, whether it fits the given result pattern.
   cfg: { type:"alg-lo-digits", tip, rows:["AB","BA"], op:"+"|"−"|"×", target:"1C5",
          letters:["A","B"] (letters the learner sets), min?:{A:1,...} (default 0),
          ask:{label:"A + B", terms:{A:1,B:1}},
          cmp:[ per option: {A:..,B:..,(C:..)} the digits to draw for that option ], notes:{optionIndex:text} } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr } = kit;
  const NP = { "pointer-events": "none" };
  const fresh = cfg => ({ init: true, v: {} });
  const isL = ch => /[A-Z]/.test(ch);
  const num = (pat, v) => { let s = ""; for (const ch of pat) { if (isL(ch)) { if (v[ch] == null) return null; s += v[ch]; } else s += ch; } return +s; };
  function calc(cfg, v) {
    const ns = cfg.rows.map(r => num(r, v)); if (ns.some(n => n === null)) return null;
    return cfg.op === "+" ? ns.reduce((a, b) => a + b, 0) : cfg.op === "×" ? ns.reduce((a, b) => a * b, 1) : ns.slice(1).reduce((a, b) => a - b, ns[0]);
  }
  // compare result with the target pattern. returns { ok, marks[] aligned to target, wild:{letter:digit} }
  function fit(cfg, v, res) {
    const t = cfg.target, out = { ok: false, marks: [], wild: {} };
    if (res === null) return out;
    const s = res < 0 ? "" : String(res), off = t.length - s.length; let ok = res >= 0 && off === 0; const w = {};
    for (let i = 0; i < t.length; i++) {
      const d = i - off >= 0 ? s[i - off] : undefined, ch = t[i]; let m;
      if (d === undefined) m = false;
      else if (!isL(ch)) m = d === ch;
      else if (v[ch] != null) m = +d === v[ch];
      else if (w[ch] !== undefined) m = w[ch] === +d;
      else { w[ch] = +d; m = true; }
      out.marks.push(m); if (!m) ok = false;
    }
    out.ok = ok; if (ok) out.wild = w; return out;
  }
  function askVal(cfg, v, wild) {
    let s = 0; for (const [ch, k] of Object.entries(cfg.ask.terms)) { const x = v[ch] != null ? v[ch] : wild[ch]; if (x == null) return null; s += k * x; } return s;
  }
  // vertical exercise. x: right edge of the units column, bw/bh box size, pitch row distance. returns { svg, bottom }
  function column(cfg, v, x, y0, bw, bh, pitch, showTarget) {
    const cols = Math.max(cfg.target.length, ...cfg.rows.map(r => r.length)), gap = 6, cx = k => x - bw / 2 - k * (bw + gap); // k = 0 units
    const ty = bh / 2 + 8; let h = "";
    cfg.rows.forEach((r, i) => {
      const y = y0 + i * pitch;
      [...r].reverse().forEach((ch, k) => {
        const L = isL(ch), val = L ? v[ch] : ch;
        h += G.rect(cx(k) - bw / 2, y, bw, bh, L ? (val == null ? "fsoft" : "box") : "bg", { rx: 6 });
        h += G.t(cx(k), y + ty, val == null ? ch : val, "big", "middle", NP);
        if (L && val != null) h += G.t(cx(k) - bw / 2 + 8, y + 13, ch, "m", "middle", NP);
      });
      if (i === cfg.rows.length - 1) h += G.t(cx(cols - 1) - bw - 4, y + ty, cfg.op, "big");
    });
    const ly = y0 + cfg.rows.length * pitch - (pitch - bh) / 2 + 3, xl = cx(cols - 1) - bw * 1.5 - 8;
    h += G.line(xl, ly, x + 6, ly, "ink");
    const res = calc(cfg, v), f = fit(cfg, v, res), ry = ly + 9, t = cfg.target;
    const s = res === null ? null : String(Math.abs(res)), n = Math.max(t.length, s ? s.length : 0);
    for (let k = 0; k < n; k++) {
      const d = s ? s[s.length - 1 - k] : (k < t.length ? "?" : undefined); if (d === undefined) continue;
      const ti = t.length - 1 - k, m = s && ti >= 0 ? f.marks[ti] : null;
      h += G.rect(cx(k) - bw / 2, ry, bw, bh, s === null ? "ghost" : m ? "fok-soft" : "fwarn", { rx: 6 }) + G.t(cx(k), ry + ty, d, s === null ? "m" : "big", "middle", NP);
    }
    if (res !== null && res < 0) h += G.t(cx(s.length) + 4, ry + ty, "−", "big");
    let bottom = ry + bh;
    if (showTarget) {
      const y = ry + pitch;
      [...t].reverse().forEach((ch, k) => {
        const L = isL(ch), val = L ? (v[ch] != null ? v[ch] : f.wild[ch]) : ch;
        h += G.rect(cx(k) - bw / 2, y, bw, bh, L ? "fsoft" : "bg", { rx: 6 }) + G.t(cx(k), y + ty, val == null ? ch : val, "big", "middle", NP);
        if (L && val != null) h += G.t(cx(k) - bw / 2 + 8, y + 13, ch, "m", "middle", NP);
      });
      bottom = y + bh;
    }
    return { svg: h, bottom, ry, ty, res, f, left: xl };
  }

  function draw(st, cfg) {
    const X = 290, c = column(cfg, st.v, X, 14, 46, 40, 46, true); let h = c.svg;
    h += G.he(X + 18, c.ry + c.ty - 2, "יצא", "m", "left") + G.he(X + 18, c.ry + 46 + c.ty - 2, "צריך לצאת", "m", "left");
    // readouts on the right
    const a = askVal(cfg, st.v, c.f.wild);
    h += G.t(610, 44, cfg.ask.label + " = " + (a === null ? "?" : a), "big" + (c.f.ok ? " ok" : ""), "end");
    if (c.res !== null) h += G.he(610, 76, c.f.ok ? "✓ מתאים לנתון" : "עדיין לא מתאים לנתון", c.f.ok ? "ok" : "w", "right");
    else h += G.he(610, 76, "בחר ספרה לכל אות", "m", "right");
    // digit pickers
    let y = c.bottom + 20;
    cfg.letters.forEach(ch => {
      const lo = (cfg.min || {})[ch] || 0;
      h += G.t(604, y + 27, ch + " =", "big", "end");
      for (let d = 0; d <= 9; d++) {
        const x = 26 + d * 52, on = st.v[ch] === d, dis = d < lo;
        const r = G.rect(x, y, 46, 40, dis ? "ghost" : on ? "fa hot" : "box hot", { rx: 8 });
        h += (dis ? r : G.tap(r, ch + d)) + G.t(x + 23, y + 27, d, dis ? "m" : on ? "inv big" : "b", "middle", NP);
      }
      y += 50;
    });
    return { svg: h, height: y + 2 };
  }

  Boards["alg-lo-digits"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const render = () => { const d = draw(st, cfg); ui.set({ height: d.height, svg: d.svg, tools: [{ label: "↺ מההתחלה", op: "reset", quiet: true }] }); };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "תרגיל באותיות: בחירת ספרות",
        onTap(key) { const ch = key[0], d = +key.slice(1); st.v[ch] = st.v[ch] === d ? null : d; render(); },
        onOp(op) { if (op === "reset") kit.reset(st, fresh(cfg)); render(); },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      const C = cfg.cmp; if (!C || chosen === correct || chosen === undefined || isNaN(chosen) || !C[chosen]) { host.innerHTML = ""; return; }
      let h = "", bottom = 0;
      [[chosen, "chosen", 620], [correct, "correct", 300]].forEach(([j, kind, R]) => {
        const v = C[j], c = column(cfg, v, R - 60, 40, 40, 36, 42, true); bottom = c.bottom;
        h += kit.rowTitle(R, 22, kind) + c.svg;
        const a = askVal(cfg, v, c.f.wild), tgt = [...cfg.target].map(ch => isL(ch) && v[ch] != null ? v[ch] : ch).join("");
        h += G.t(R - 20, c.bottom + 30, cfg.ask.label + " = " + (a === null ? "?" : a), kind === "chosen" ? "w" : "ok", "end");
        h += G.he(R - 20, c.bottom + 54, c.f.ok ? "יוצא " + ltr(String(c.res)) + " ✓" : "יוצא " + ltr(String(c.res)) + ", ולא " + ltr(tgt), "m", "right");
      });
      h += G.line(320, 12, 320, bottom + 60, "dash");
      kit.compare(host, { height: bottom + 68, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה בתרגיל" });
    },
  };
})();
