/* board-prb-rate.js — constant-rate board (work / motion).
   mode "line" (default): a time axis with the given block (given.t time units = given.w work). Drag the end of the bar to a new time;
     split the given block into equal parts to measure times that are not whole blocks.
     cfg: { type:"prb-rate", given:{t,w}, tUnit, wUnit, max, step, lab?, splits:[..], tip,
            compare:{ kind:"w"|"t", vals:[one per option] }, notes }
   mode "ladder": unit conversion of a speed, built step by step: per second -> per minute (x60) -> per hour (x60), metres -> km.
     cfg: { type:"prb-rate", mode:"ladder", v (metres per second), tip, compare:{ vals:[km/h per option] }, notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, X0 = 40, X1 = 600, BY = 58, BH = 46, AY = BY + BH + 14;
  const fresh = cfg => cfg.mode === "ladder" ? { init: 1, lvl: 0, km: false } : { init: 1, t: cfg.given.t, split: 1 };
  const known = (st, cfg) => Math.abs((st.t * st.split / cfg.given.t) - Math.round(st.t * st.split / cfg.given.t)) < 1e-9;
  const num = x => x >= 1 || x === 0 ? pf(x) : String(+x.toFixed(3));

  function drawLine(st, cfg) {
    const T = cfg.given.t, W = cfg.given.w, c = T / st.split, cv = W / st.split, ok = known(st, cfg), X = t => X0 + (X1 - X0) * t / cfg.max, np = { "pointer-events": "none" };
    let h = G.he(610, 26, `ב־${pf(st.t)} ${cfg.tUnit}: ${ok ? pf(W * st.t / T) : "?"} ${cfg.wUnit}`, ok ? "a" : "b", "right");
    h += G.he(30, 26, `נתון: ${pf(W)} ${cfg.wUnit} ב־${pf(T)} ${cfg.tUnit}`, "m", "left");
    h += G.rect(X0, BY, X1 - X0, BH, "bg", { rx: 4 });
    const n = Math.floor(st.t / c + 1e-9), cw = X(c) - X0;
    for (let k = 0; k < n; k++) {
      h += G.rect(X(k * c), BY, cw, BH, (k + 1) * c <= T + 1e-9 ? "fsoft" : "fblue-soft");
      if (cw >= 34) h += G.t(X(k * c) + cw / 2, BY + 29, pf(cv), "", "middle", np);
    }
    if (st.t - n * c > 1e-9) { const a = X(n * c), b = X(st.t); h += G.rect(a, BY, b - a, BH, "fwarn") + (b - a >= 20 ? G.t((a + b) / 2, BY + 29, "?", "w", "middle", np) : ""); }
    if (st.t < T) h += G.rect(X0, BY, X(T) - X0, BH, "ghost");
    h += G.line(X0, AY, X1, AY, "ink");
    const lab = cfg.lab || cfg.step;
    for (let v = 0; v <= cfg.max + 1e-9; v += cfg.step) { const big = Math.abs(v / lab - Math.round(v / lab)) < 1e-9; h += G.line(X(v), AY, X(v), AY + (big ? 7 : 4), "thin"); if (big) h += G.t(X(v), AY + 22, pf(v), "m"); }
    h += G.line(X(st.t), BY - 6, X(st.t), AY + 30, "sa") + G.knob(X(st.t), AY + 46, "t", 15);
    return { svg: h, height: AY + 68 };
  }

  const LR = [52, 128, 204], LH = 30, LX = 50, LC = 9;
  function drawLadder(st, cfg) {
    const v = cfg.v, vals = [v, v * 60, v * 3600], names = ["בשנייה אחת", "בדקה (60 שניות)", "בשעה (60 דקות)"];
    let h = "";
    for (let i = 0; i <= st.lvl; i++) {
      const y = LR[i], last = i === st.lvl;
      h += G.he(610, y - 9, `${names[i]}: ${pf(vals[i])} מטרים` + (last && st.km ? ` = ${num(vals[i] / 1000)} ק"מ` : ""), last ? "a" : "b", "right");
      if (i === 0) h += G.rect(LX, y, 40, LH, "fa");
      else {
        h += G.rect(LX, y, 60 * LC, LH, "box");
        for (let k = 1; k < 60; k++) h += G.line(LX + k * LC, y, LX + k * LC, y + LH, "thin", { opacity: k % 10 ? .25 : .8 });
        h += G.rect(LX, y, LC, LH, i === 1 ? "fa" : "fblue");
        const pw = i === 1 ? 40 : 60 * LC, py = LR[i - 1] + LH;
        h += G.line(LX, py, LX, y, "dash") + (i === 1 ? G.line(LX + pw, py, LX + LC, y, "dash") : "");
      }
      if (i === 1 && st.lvl === 2) h += G.rect(LX, y, 60 * LC, LH, "sblue");
    }
    return { svg: h, height: LR[st.lvl] + LH + 14 };
  }

  function bars(rows, ref) {
    const R = 610, L = 30, max = Math.max(ref || 0, ...rows.map(r => r.len)) * 1.02, u = (R - L) / max;
    let h = "";
    rows.forEach((r, i) => {
      const y = 30 + i * 96;
      h += kit.rowTitle(R, y - 10, r.kind) + G.rect(L, y, R - L, 40, "bg", { rx: 4 }) + G.rect(L, y, r.len * u, 40, r.kind === "chosen" ? "fwarn" : "fok");
      if (ref) h += G.line(L + ref * u, y - 6, L + ref * u, y + 46, "dash");
      h += G.he(R, y + 62, r.cap, "m", "right");
    });
    return h;
  }

  Boards["prb-rate"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const ladder = cfg.mode === "ladder";
      const render = () => {
        if (ladder) {
          const d = drawLadder(st, cfg);
          ui.set({ height: d.height, svg: d.svg, tools: [
            { label: st.lvl === 0 ? "כמה בדקה? (×60)" : "כמה בשעה? (×60)", op: "up", disabled: st.lvl === 2 },
            { label: 'מטרים ← ק"מ (÷1000)', op: "km", active: st.km },
            ...(st.lvl ? [{ label: "בטל שלב", op: "down", quiet: true }] : []),
            { label: "↺ מההתחלה", op: "reset", quiet: true }] });
        } else {
          const d = drawLine(st, cfg);
          ui.set({ height: d.height, svg: d.svg, tools: [
            ...cfg.splits.map(n => ({ label: "חלק את הנתון ל־" + n, op: "split", n, active: st.split === n })),
            { label: "↺ מההתחלה", op: "reset", quiet: true }] });
        }
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: ladder ? "סולם המרת יחידות" : "ציר זמן ועבודה",
        dragFrom: pt => !ladder && pt.y > BY - 8 ? "t" : null,
        onDrag(key, pt) { const s = cfg.step, v = Math.round((pt.x - X0) / (X1 - X0) * cfg.max / s) * s; st.t = Math.max(s, Math.min(cfg.max, v)); render(); },
        onOp(op, el) {
          if (op === "reset") kit.reset(st, fresh(cfg));
          else if (op === "split") st.split = st.split === +el.dataset.n ? 1 : +el.dataset.n;
          else if (op === "up") st.lvl = Math.min(2, st.lvl + 1);
          else if (op === "down") st.lvl = Math.max(0, st.lvl - 1);
          else if (op === "km") st.km = !st.km;
          render();
        },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      let rows, ref;
      if (cfg.mode === "ladder") {
        const row = (j, kind) => { const v = C.vals[j], ms = v / 3.6, exact = Math.abs(ms * 100 - Math.round(ms * 100)) < 1e-9; return { kind, len: ms, cap: `${pf(v)} קמ"ש = ${pf(v * 1000)} מטרים בשעה = ${exact ? "" : "כ־"}${pf(ms)} מטרים בשנייה` }; };
        rows = [row(chosen, "chosen"), row(correct, "correct")]; ref = cfg.v;
      } else {
        const rate = cfg.given.w / cfg.given.t;
        const row = (j, kind) => { const t = C.kind === "w" ? C.vals[j] / rate : C.vals[j]; return { kind, len: t, cap: `ב־${pf(t)} ${cfg.tUnit}: ${pf(t * rate)} ${cfg.wUnit}` }; };
        rows = [row(chosen, "chosen"), row(correct, "correct")]; ref = rows[1].len;
      }
      kit.compare(host, { height: 208, svg: bars(rows, ref), note: (cfg.notes || {})[chosen], title: cfg.mode === "ladder" ? "ככה זה נראה במטרים בשנייה" : "ככה זה נראה על ציר הזמן" });
    },
  };
})();
