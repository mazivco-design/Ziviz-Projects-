/* board-alg-int.js — three small boards for whole-number questions.
   kind "cards":  factor cards with a "·" between them; tap a "·" to multiply the two neighbours (signs are colored).
       cfg: { cards:[..] }
   kind "stairs": `count` consecutive numbers as a staircase of columns; drag the smallest one and watch the sum.
       cfg: { count, target, lo, hi, init, tops:[largest number per option] }
   kind "square": a b×b square of tiles; move its top row to the side to turn it into (b−1)×(b+1) and see what is left over.
       cfg: { lo, hi, init }
   cfg (all): { type:"alg-int", kind, tip, cmp:{ j: {...} }, notes:{ j: text } }
       cmp for cards: { tiles:[{t, s:"on"|"bad"|"op"|"", sub?}], cap } · stairs: built from tops · square: { bs:[..], cap } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, np = { "pointer-events": "none" };
  const num = v => (v < 0 ? "−" : "") + pf(Math.abs(v)), par = v => v < 0 ? "(" + num(v) + ")" : num(v);
  const fresh = cfg => cfg.kind === "cards" ? { init: 1, cards: cfg.cards.slice(), hist: [], back: [] }
    : cfg.kind === "stairs" ? { init: 1, n: cfg.init } : { init: 1, b: cfg.init, moved: false };
  const SX0 = 170, SX1 = 590;

  /* ---------- cards ---------- */
  function drawCards(st) {
    const n = st.cards.length, cw = 84, gap = 52, tot = n * cw + (n - 1) * gap, x0 = 320 - tot / 2; let h = "";
    st.cards.forEach((v, i) => {
      const x = x0 + i * (cw + gap);
      h += G.rect(x, 16, cw, 60, v < 0 ? "fwarn" : "fok-soft", { rx: 10 }) + G.t(x + cw / 2, 55, num(v), v < 0 ? "w big" : "big");
      if (i < n - 1) h += G.tap(G.circle(x + cw + gap / 2, 46, 19, "box hot"), "m" + i) + G.t(x + cw + gap / 2, 53, "·", "big", "middle", np);
    });
    const neg = st.cards.filter(v => v < 0).length;
    let y = 108;
    h += G.he(620, y, n > 1 ? "קלפים שליליים על השולחן: " + neg : "התוצאה: " + ltr(num(st.cards[0])), n > 1 ? "m" : "b", "right");
    st.hist.forEach((t, i) => { h += G.t(20, y + i * 26, t, "b", "start"); });
    if (!st.hist.length) h += G.he(20, y, "לחץ על נקודת כפל כדי לכפול שני קלפים שכנים", "m", "left");
    return { svg: h, height: y + Math.max(1, st.hist.length) * 26 - 8 };
  }

  /* ---------- stairs ---------- */
  function stairs(x0, base, top, count, u, cw, big) {
    let h = ""; const n = top - count + 1;
    for (let i = 0; i < count; i++) {
      const x = x0 + i * (cw + 10), v = n + i;
      h += G.rect(x, base - n * u, cw, n * u, "fblue-soft");
      for (let k = 0; k < i; k++) h += G.rect(x, base - (n + k + 1) * u, cw, u, "fsoft");
      h += G.t(x + cw / 2, base - v * u - 8, v, big ? "big" : "b");
    }
    return h + G.line(x0 - 8, base, x0 + count * (cw + 10) - 2, base, "ink");
  }
  function drawStairs(st, cfg) {
    const c = cfg.count, u = 9, cw = 54, base = 40 + (cfg.hi + c - 1) * u, x0 = 30; let h = "";
    h += stairs(x0, base, st.n + c - 1, c, u, cw, true);
    h += G.he(x0 + cw / 2, base + 22, "הקטן", "m", "middle") + G.he(x0 + (c - 1) * (cw + 10) + cw / 2, base + 22, "הגדול", "m", "middle");
    const vals = Array.from({ length: c }, (_, i) => st.n + i), sum = vals.reduce((a, b) => a + b, 0), d = cfg.target - sum;
    h += G.he(620, 60, "הסכום עכשיו", "m", "right") + G.t(620, 92, vals.join(" + ") + " = " + sum, "b", "end");
    h += G.he(620, 126, d === 0 ? "בדיוק " + cfg.target + ", כמו בשאלה" : d > 0 ? "חסר " + d + " כדי להגיע ל־" + cfg.target : "עודף של " + -d + " מעל " + cfg.target, d === 0 ? "ok" : "w", "right");
    h += G.he(620, 160, "כחול: שווה בכולם · ורוד: התוספת", "m", "right");
    const y = base + 62, x = SX0 + (st.n - cfg.lo) / (cfg.hi - cfg.lo) * (SX1 - SX0);
    h += G.he(20, y + 6, "הקטן: " + st.n, "b", "left") + G.line(SX0, y, SX1, y, "mut");
    for (let k = cfg.lo; k <= cfg.hi; k++) { const tx = SX0 + (k - cfg.lo) / (cfg.hi - cfg.lo) * (SX1 - SX0); h += G.line(tx, y - 4, tx, y + 4, "mut"); }
    return { svg: h + G.knob(x, y, "n", 16), height: y + 28 };
  }

  /* ---------- square ---------- */
  // b×b square; when moved, its top row becomes a column on the right and one tile is left over
  function sq(x0, y0, b, s, moved) {
    let h = "";
    for (let r = 0; r < b; r++) for (let c = 0; c < b; c++) {
      const top = r === 0;
      h += G.rect(x0 + c * s, y0 + r * s, s, s, top ? (moved ? "ghost" : "fsoft") : "fblue-soft");
    }
    if (moved) {
      for (let r = 1; r < b; r++) h += G.rect(x0 + b * s, y0 + r * s, s, s, "fsoft");
      h += G.rect(x0 + (b + 1) * s + 10, y0, s, s, "fwarn");
    }
    return h;
  }
  function drawSquare(st, cfg) {
    const b = st.b, s = Math.min(34, 200 / cfg.hi), x0 = 40, y0 = 30, H = cfg.hi * s; let h = sq(x0, y0, b, s, st.moved);
    const a = b - 1, c = b + 1;
    if (st.moved) {
      h += G.t(x0 + c * s / 2, y0 + b * s + 22, "c = " + c, "b") + G.t(x0 - 8, y0 + s + a * s / 2 + 5, "a = " + a, "b", "end", { transform: `rotate(-90 ${x0 - 8} ${y0 + s + a * s / 2})`, "text-anchor": "middle" });
      h += G.he(x0 + (b + 1) * s + 10 + s / 2, y0 - 8, "נשאר", "w", "middle");
    } else h += G.t(x0 + b * s / 2, y0 + b * s + 22, "b = " + b, "b") + G.t(x0 - 8, y0 + b * s / 2, "b = " + b, "b", "middle", { transform: `rotate(-90 ${x0 - 8} ${y0 + b * s / 2})` });
    h += G.t(620, 50, "a, b, c = " + a + ", " + b + ", " + c, "big", "end");
    h += G.t(620, 88, "b² = " + b + "·" + b + " = " + b * b, "b", "end");
    if (st.moved) {
      h += G.t(620, 116, "a·c = " + a + "·" + c + " = " + a * c, "b", "end");
      h += G.t(620, 150, "a·c − b² = " + a * c + " − " + b * b + " = " + num(a * c - b * b), "big", "end");
      h += G.he(620, 180, "המלבן קטן מהריבוע במשבצת אחת", "m", "right");
    } else h += G.he(620, 116, "השורה הוורודה תעבור לצד", "m", "right");
    const y = y0 + H + 62, x = SX0 + (b - cfg.lo) / (cfg.hi - cfg.lo) * (SX1 - SX0);
    h += G.t(20, y + 6, "b = " + b, "big", "start") + G.line(SX0, y, SX1, y, "mut");
    for (let k = cfg.lo; k <= cfg.hi; k++) { const tx = SX0 + (k - cfg.lo) / (cfg.hi - cfg.lo) * (SX1 - SX0); h += G.line(tx, y - 4, tx, y + 4, "mut") + G.t(tx, y + 36, k, k === b ? "a" : "m"); }
    return { svg: h + G.knob(x, y, "b", 16), height: y + 46 };
  }

  function tileRow(row, y, onCls) {
    const n = row.tiles.length, tw = Math.min(110, 600 / n), x0 = 620 - n * tw; let h = "";
    row.tiles.forEach((t, i) => {
      if (!t) return; const x = x0 + i * tw;
      if (t.s === "op") { h += G.t(x + tw / 2, y + 27, t.t, "big"); return; }
      h += G.rect(x + 3, y, tw - 6, 40, t.s === "on" ? onCls : t.s === "bad" ? "fwarn" : "box", { rx: 6 }) + G.t(x + tw / 2, y + 26, t.t, t.s === "bad" ? "w" : "b");
      if (t.sub) h += G.he(x + tw / 2, y + 58, t.sub, "m", "middle");
    });
    return h;
  }

  Boards["alg-int"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const K = cfg.kind;
      const render = () => {
        const d = K === "cards" ? drawCards(st) : K === "stairs" ? drawStairs(st, cfg) : drawSquare(st, cfg), tools = [];
        if (K === "square") tools.push({ label: st.moved ? "החזר את השורה למקום" : "העבר את השורה העליונה לצד", op: "move", active: st.moved });
        if (K === "stairs") tools.push({ label: "הקטן − 1", op: "dec", disabled: st.n <= cfg.lo }, { label: "הקטן + 1", op: "inc", disabled: st.n >= cfg.hi });
        if (K === "cards") tools.push({ label: "בטל צעד", op: "undo", quiet: true, disabled: !st.back.length });
        tools.push({ label: "↺ מההתחלה", op: "reset", quiet: true });
        ui.set({ height: d.height, svg: d.svg, tools });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "ציור לפתרון השאלה",
        onTap(key) {
          const i = +key.slice(1), a = st.cards[i], b = st.cards[i + 1];
          st.back.push(st.cards.slice()); st.hist.push(par(a) + "·" + par(b) + " = " + num(a * b)); st.cards.splice(i, 2, a * b); render();
        },
        onDrag(key, pt) {
          const v = Math.max(cfg.lo, Math.min(cfg.hi, Math.round(cfg.lo + (pt.x - SX0) / (SX1 - SX0) * (cfg.hi - cfg.lo))));
          if (key === "n") st.n = v; else st.b = v; render();
        },
        onOp(op) {
          if (op === "reset") kit.reset(st, fresh(cfg));
          else if (op === "undo") { st.cards = st.back.pop(); st.hist.pop(); }
          else if (op === "move") st.moved = !st.moved;
          else st.n += op === "inc" ? 1 : -1;
          render();
        },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      if (chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const K = cfg.kind, C = cfg.cmp || {}; let h = "", y = 24;
      [[chosen, "chosen", "fwarn"], [correct, "correct", "fok-soft"]].forEach(([j, kind, cls]) => {
        h += kit.rowTitle(620, y, kind);
        if (K === "cards") {
          const row = C[j], sub = row.tiles.some(t => t && t.sub);
          h += tileRow(row, y + 12, cls); y += 12 + 40 + (sub ? 22 : 0) + 24; h += G.he(620, y, row.cap, "m", "right"); y += 44;
        } else if (K === "stairs") {
          const top = cfg.tops[j], c = cfg.count, u = 5, vals = Array.from({ length: c }, (_, i) => top - c + 1 + i), sum = vals.reduce((a, b) => a + b, 0);
          const base = y + 22 + Math.max(...cfg.tops) * u;
          h += stairs(60, base, top, c, u, 44, false);
          h += G.he(620, y + 44, "אם הגדול הוא " + top + ":", "m", "right") + G.t(620, y + 72, vals.join(" + ") + " = " + sum, "b", "end");
          h += G.he(620, y + 102, sum === cfg.target ? "בדיוק הסכום שבשאלה" : "זה לא " + cfg.target, sum === cfg.target ? "ok" : "w", "right");
          y = base + 44;
        } else {
          const row = C[j], s = 16; let x = 40, mh = 0;
          row.bs.forEach(b => {
            h += sq(x, y + 18, b, s, true) + G.t(x + (b + 1) * s / 2, y + 18 + b * s + 20, (b - 1) + "·" + (b + 1) + " = " + (b * b - 1), "b") ;
            h += G.t(x + (b + 1) * s / 2, y + 18 + b * s + 42, b + "·" + b + " = " + b * b, "m");
            x += (b + 2) * s + 70; mh = Math.max(mh, b * s);
          });
          y += 18 + mh + 42 + 28; h += G.he(620, y, row.cap, "m", "right"); y += 44;
        }
      });
      kit.compare(host, { height: y - 30, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה על הציור" });
    },
  };
})();
