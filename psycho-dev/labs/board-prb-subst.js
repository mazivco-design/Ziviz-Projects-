/* board-prb-subst.js — "substitute numbers" board for questions whose options are expressions with letters.
   The learner picks numbers for the letters with sliders; the drawing builds the story with those numbers (so the real
   result can be read off it) and every option's value is shown live next to it.
   cfg: { type:"prb-subst", model:"weeks"|"price", vars:[{name, min, max, start}], opts:[display strings, same order as the options],
          tip, compare:{ at:{name:value}, cap }, notes }
   models: weeks — first week a, each week +3 more, week n.   price — x pencils cost y; how many for z. */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, R = 620, SX0 = 60, SX1 = 420;
  const exact = v => Math.abs(v * 100 - Math.round(v * 100)) < 1e-9 || (Math.abs(v * 3 - Math.round(v * 3)) < 1e-9);
  const eq = v => (exact(v) ? "= " : "≈ ") + pf(v);
  const MODELS = {
    weeks: { real: v => v.a + 3 * (v.n - 1), f: [v => v.a + 3 * v.n, v => 3 * v.a + v.n, v => 3 * (v.a + v.n - 1), v => v.a + 3 * (v.n - 1)] },
    price: { real: v => v.z * v.x / v.y, f: [v => v.x * v.y / v.z, v => v.y * v.z / v.x, v => v.z * v.x / v.y, v => v.z / (v.x * v.y)] },
  };
  const fresh = cfg => { const s = { init: true, v: {} }; cfg.vars.forEach(a => s.v[a.name] = a.start); return s; };
  const sx = (a, t) => SX0 + (SX1 - SX0) * (t - a.min) / (a.max - a.min);
  function slider(a, val, y) {
    let h = G.line(SX0, y, SX1, y, "mut");
    for (let t = a.min; t <= a.max; t++) h += G.line(sx(a, t), y - 4, sx(a, t), y + 4, "thin");
    return h + G.t(SX0 - 24, y + 6, a.min, "m") + G.t(SX1 + 28, y + 6, a.max, "m") + G.he(R, y + 7, ltr(a.name + " = " + val), "b", "right") + G.knob(sx(a, val), y, "s" + a.name, 15);
  }

  // the story drawn with the chosen numbers; returns { svg, height }
  function story(cfg, v, y0) {
    let h = "";
    if (cfg.model === "weeks") {
      const maxV = 10 + 3 * 5, u = 96 / maxV, base = y0 + 132, sp = 62;
      for (let k = 1; k <= v.n; k++) {
        const val = v.a + 3 * (k - 1), x = R - 40 - (k - 1) * sp, last = k === v.n;
        h += G.rect(x - 20, base - val * u, 40, val * u, last ? "fa" : "fsoft", { rx: 3 }) + G.t(x, base - val * u - 8, val, last ? "a" : "m") + G.t(x, base + 22, k, "m");
        if (k > 1) h += G.t(x + sp / 2, base - 4 - Math.min(val, 12) * u, "+3", "m");
      }
      h += G.line(R - 40 - 5 * sp - 30, base, R, base, "ink") + G.he(R - 40 - 5 * sp - 40, base + 22, "שבוע", "m", "right");
      h += G.he(24, y0 + 22, `בשבוע ${v.n}: ${MODELS.weeks.real(v)} ₪`, "b", "left");
      return { svg: h, height: 164 };
    }
    const u = 27, p = v.y / v.x, n = v.z / p;
    const tape = (y, len, pieces, cls) => {
      let o = G.rect(R - len * u, y, len * u, 30, "bg", { rx: 3 });
      for (let k = 0; k < Math.ceil(pieces - 1e-9); k++) { const w = Math.min(1, pieces - k) * p * u; o += G.rect(R - k * p * u - w, y, w, 30, k + 1 > pieces + 1e-9 ? "fwarn" : cls); }
      for (let k = 1; k < pieces - 1e-9; k++) o += G.line(R - k * p * u, y, R - k * p * u, y + 30, "thin");
      for (let s = 0; s <= len; s++) o += G.line(R - s * u, y + 30, R - s * u, y + 36, "thin");
      return o;
    };
    h += G.he(R, y0 + 20, `${v.x} עפרונות עולים ${v.y} ₪ (כל משבצת צבועה היא עיפרון)`, "m", "right") + tape(y0 + 30, v.y, v.x, "fsoft");
    h += G.he(R, y0 + 96, `ב־${v.z} ₪ נכנסים ${ltr((exact(n) ? "" : "≈") + pf(n))} עפרונות`, "b", "right") + tape(y0 + 106, v.z, n, "fa");
    return { svg: h, height: 150 };
  }
  function optLines(cfg, v, y0, mark) {
    const F = MODELS[cfg.model].f; let h = "";
    cfg.opts.forEach((s, j) => {
      const col = j % 2, row = Math.floor(j / 2), x = col ? 330 : 30, y = y0 + row * 34;
      h += G.t(x, y, s + "  " + eq(F[j](v)), mark && mark[j] ? mark[j] : "", "start");
    });
    return h;
  }

  Boards["prb-subst"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const ys = {};
      const render = () => {
        const d = story(cfg, st.v, 6); let h = d.svg, y = d.height + 40;
        h += G.he(R, y, "כמה יוצא כל ביטוי עם המספרים שבחרת:", "m", "right"); y += 34;
        h += optLines(cfg, st.v, y); y += 34 + 44;
        cfg.vars.forEach(a => { ys[a.name] = y; h += slider(a, st.v[a.name], y); y += 46; });
        ui.set({ height: y - 16, svg: h, tools: [{ label: "↺ מההתחלה", op: "reset", quiet: true }] });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "הצבת מספרים",
        onDrag(key, pt) { const a = cfg.vars.find(q => "s" + q.name === key); st.v[a.name] = Math.max(a.min, Math.min(a.max, Math.round(a.min + (pt.x - SX0) / (SX1 - SX0) * (a.max - a.min)))); render(); },
        dragFrom(pt) { if (pt.x < SX0 - 20 || pt.x > SX1 + 20) return null; const a = cfg.vars.find(q => Math.abs(pt.y - ys[q.name]) < 20); return a ? "s" + a.name : null; },
        onOp() { kit.reset(st, fresh(cfg)); render(); },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const F = MODELS[cfg.model].f, v = C.at, d = story(cfg, v, 30);
      let h = G.he(R, 22, "מציבים " + ltr(cfg.vars.map(a => a.name + " = " + v[a.name]).join(", ")), "b", "right") + d.svg, y = d.height + 64;
      h += kit.rowTitle(R, y, "chosen") + G.t(30, y, cfg.opts[chosen] + "  " + eq(F[chosen](v)), "w", "start"); y += 36;
      h += kit.rowTitle(R, y, "correct") + G.t(30, y, cfg.opts[correct] + "  " + eq(F[correct](v)), "ok", "start");
      kit.compare(host, { height: y + 18, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה בהצבה" });
    },
  };
})();
