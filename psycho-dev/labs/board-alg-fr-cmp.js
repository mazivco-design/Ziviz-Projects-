/* board-alg-fr-cmp.js — fraction strips for "which fraction is the largest/smallest".
   Tap a strip to cut it and color the fraction; "זום" magnifies the window where the fractions differ;
   tap two fraction chips to compare them by cross-multiplication (the products are written above their numerators).
   cfg: { type:"alg-fr-cmp", tip, rows:[{ n, d, from?:[n,d] (strip starts as this fraction; tap applies the change), cap? (Hebrew caption) }],
          zoom:[lo,hi], comp?:true (label the part missing to 1), notes:{ optionIndex: text } }  — rows are aligned with the options. */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr } = kit, B0 = 112, B1 = 612, NP = { "pointer-events": "none" };
  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  const fresh = cfg => ({ init: true, open: cfg.rows.map(() => false), zoom: false, pair: [] });
  const cur = (r, open) => r.from && !open ? r.from : [r.n, r.d];
  const dn = x => String(Math.round(x * 1000) / 1000);

  // one strip: window [lo,hi] mapped on B0..B1, colored up to n/d
  function strip(y, n, d, lo, hi, cls, cells) {
    const X = v => B0 + (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo) * (B1 - B0), v = n / d; let h = G.rect(B0, y, B1 - B0, 30, "bg", { rx: 3 });
    if (v > lo) h += G.rect(B0, y, X(v) - B0, 30, cls);
    if (cells) for (let k = 1; k < d; k++) if (k / d > lo + 1e-9 && k / d < hi - 1e-9) h += G.line(X(k / d), y, X(k / d), y + 30, "thin", NP);
    if (lo > 0) h += G.path(`M${B0},${y - 3} l-5,6 l5,6 l-5,6 l5,6 l-5,6 l5,6`, "mut");
    if (hi < 1) h += G.path(`M${B1},${y - 3} l5,6 l-5,6 l5,6 l-5,6 l5,6 l-5,6`, "mut");
    return h;
  }
  const win = (st, cfg) => st.zoom ? cfg.zoom : [0, 1];
  const stack = (x, y, n, d, cls = "big") => G.t(x, y, n, cls) + G.line(x - 22, y + 8, x + 22, y + 8, "ink") + G.t(x, y + 32, d, cls);

  function draw(st, cfg) {
    const [lo, hi] = win(st, cfg), hasCap = cfg.rows.some(r => r.cap), RH = hasCap ? 68 : 48; let h = "", y = 10;
    cfg.rows.forEach((r, i) => {
      const [n, d] = cur(r, st.open[i]), by = y + (hasCap ? 24 : 0), shown = st.open[i] || !!r.from, sel = st.pair.includes(i);
      if (r.cap) h += G.he(B1, y + 14, r.cap, st.open[i] ? "b" : "", "right");
      h += G.tap(G.rect(10, by - 3, 90, 36, (sel ? "fsoft" : "box") + " hot", { rx: 8 }), "p" + i) + G.t(55, by + 21, n + "/" + d, "b", "middle", NP);
      if (shown) {
        const X = v => B0 + (v - lo) / (hi - lo) * (B1 - B0), gap = B1 - X(n / d), g = gcd(d - n, d);
        h += G.tap(G.group(strip(by, n, d, lo, hi, "fa", true), { class: "hot" }), "r" + i);
        if (cfg.comp && hi === 1 && gap >= 120) h += G.he((X(n / d) + B1) / 2, by + 20, "חסר " + ltr((d - n) / g + "/" + d / g), "a", "middle", NP);
      } else h += G.tap(G.rect(B0, by, B1 - B0, 30, "bg hot", { rx: 3 }), "r" + i) + G.he((B0 + B1) / 2, by + 20, "לחץ כדי לחתוך ולצבוע", "m", "middle", NP);
      y += RH;
    });
    h += G.t(B0, y + 8, dn(lo), "m") + G.t(B1, y + 8, dn(hi), "m") + (st.zoom ? G.he((B0 + B1) / 2, y + 8, "זום: רואים רק את הקטע שבו השברים נבדלים", "m", "middle") : "");
    y += 28;
    h += G.line(10, y, 630, y, "dash"); y += 10;
    if (st.pair.length < 2) { h += G.he(320, y + 22, "לחץ על שני שברים (מצד שמאל) כדי להשוות אותם בכפל באלכסון", "m", "middle"); y += 40; }
    else {
      const [i, j] = st.pair, [a, b] = cur(cfg.rows[i], st.open[i]), [c, e] = cur(cfg.rows[j], st.open[j]), p = a * e, q = c * b;
      h += G.t(210, y + 22, `${a}·${e} = ${p}`, p > q ? "ok" : "a") + G.t(430, y + 22, `${c}·${b} = ${q}`, q > p ? "ok" : "a");
      h += stack(210, y + 58, a, b) + stack(430, y + 58, c, e) + G.t(320, y + 24, p > q ? ">" : p < q ? "<" : "=", "big");
      h += G.line(240, y + 84, 400, y + 54, "dash") + G.line(400, y + 84, 240, y + 54, "dash");
      h += G.he(320, y + 118, "המכפלה נכתבת מעל המונה שלה. המכפלה הגדולה שייכת לשבר הגדול", "m", "middle");
      y += 130;
    }
    return { svg: h, height: y };
  }

  Boards["alg-fr-cmp"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const render = () => {
        const d = draw(st, cfg);
        ui.set({
          height: d.height, svg: d.svg, msg: "",
          tools: [{ label: st.zoom ? "חזרה לפס המלא" : "זום", op: "zoom", active: st.zoom }, { label: "צבע את כולם", op: "all", disabled: st.open.every(Boolean) },
          ...(st.pair.length ? [{ label: "נקה השוואה", op: "unpair", quiet: true }] : []), { label: "↺ מההתחלה", op: "reset", quiet: true }],
        });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "פסי שברים להשוואה",
        onTap(key) {
          const i = +key.slice(1);
          if (key[0] === "r") st.open[i] = !st.open[i];
          else if (st.pair.includes(i)) st.pair = st.pair.filter(k => k !== i);
          else st.pair = st.pair.length >= 2 ? [i] : st.pair.concat(i);
          render();
        },
        onOp(op) {
          if (op === "zoom") st.zoom = !st.zoom; else if (op === "all") st.open = st.open.map(() => true); else if (op === "unpair") st.pair = []; else kit.reset(st, fresh(cfg));
          render();
        },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      if (chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const [lo, hi] = cfg.zoom, A = cfg.rows[chosen], C = cfg.rows[correct], p = A.n * C.d, q = C.n * A.d; let h = "";
      const X = v => B0 + (v - lo) / (hi - lo) * (B1 - B0);
      [[A, "chosen", "fwarn"], [C, "correct", "fok"]].forEach(([r, kind, fc], i) => {
        const y = 30 + i * 70;
        h += kit.rowTitle(B1, y - 8, kind) + G.t(55, y + 21, r.n + "/" + r.d, "b") + strip(y, r.n, r.d, lo, hi, fc, false);
      });
      h += G.line(X(C.n / C.d), 22, X(C.n / C.d), 138, "dash") + G.t(B0, 152, dn(lo), "m") + G.t(B1, 152, dn(hi), "m") + G.he((B0 + B1) / 2, 152, "זום על הקטע שבו השברים נבדלים", "m", "middle");
      h += G.he(B1, 182, "כפל באלכסון: " + ltr(`${A.n}·${C.d} = ${p}`) + (p < q ? " קטן מ־" : " גדול מ־") + ltr(`${C.n}·${A.d} = ${q}`) + ", ולכן " + ltr(`${A.n}/${A.d} ${p < q ? "<" : ">"} ${C.n}/${C.d}`), "b", "right");
      kit.compare(host, { height: 196, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה על הפסים" });
    },
  };
})();
