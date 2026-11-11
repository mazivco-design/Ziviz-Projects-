/* board-prb-team.js — area board: rows × columns = amount (workers × days = work-days, speed × time = distance).
   mode "rect" (default): the given rectangle next to "yours" (drag the corner). match:true compares the areas; out:{total,unit,verb}
     adds a "what does one cell make" tool.
   mode "vars": letters question — the given is x × d (steppers), the target work is `times` × the given, the new team needs
     `wk`·x workers; each option's value is shown live.   cfg.vars:{x,d,times,wk,opts:[{label,k}]}  (option value = k·d)
   mode "pour": blocks of work-days are poured (tap) into one worker's calendar.
   cfg: { type:"prb-team", mode?, given:[{w,d}], rows, cols, cw, ch, wUnit, dUnit, aUnit, wScale?, cellVal?, dSnap?, titles?:[given,mine],
          match?, words?{same,more,less}, out?, vars?, tip, compare:{ w, d:[per option], target? } | { days:[per option] } (pour), notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, T = 44, MX = 44, GR = 600;
  const fresh = cfg => cfg.mode === "pour" ? { init: 1, order: [] }
    : cfg.mode === "vars" ? { init: 1, x: cfg.vars.x, gd: cfg.vars.d, w: cfg.vars.x, d: cfg.vars.d }
      : { init: 1, w: cfg.given[0].w, d: cfg.given[0].d, unit: false };
  const np = { "pointer-events": "none" };
  function grid(x, base, w, d, cw, ch, cls) {
    let h = G.rect(x, base - w * ch, d * cw, w * ch, cls);
    if (cw >= 6 && ch >= 6) {
      for (let i = 1; i < w; i++) h += G.line(x, base - i * ch, x + d * cw, base - i * ch, "thin", { opacity: .45, ...np });
      for (let j = 1; j < d; j++) h += G.line(x + j * cw, base, x + j * cw, base - w * ch, "thin", { opacity: .45, ...np });
    }
    return h;
  }
  const dims = (cfg, w, d) => `${pf(w * (cfg.wScale || 1))} ${cfg.wUnit} × ${pf(d)} ${cfg.dUnit}`;
  const area = (cfg, w, d) => w * d * (cfg.cellVal || 1);

  function drawRect(st, cfg) {
    const { rows, cols, cw, ch } = cfg, base = T + rows * ch, V = cfg.mode === "vars", titles = cfg.titles || ["הנתון", "הצוות שלך"];
    const gw = V ? st.x : cfg.given[0].w, gd = V ? st.gd : cfg.given[0].d, gA = area(cfg, gw, gd), mA = area(cfg, st.w, st.d);
    let h = "";
    // yours (left)
    h += G.he(MX, 20, titles[1], "a", "left") + G.rect(MX, T, cols * cw, rows * ch, "ghost");
    for (let i = 1; i < rows; i++) h += G.line(MX, T + i * ch, MX + cols * cw, T + i * ch, "thin", { opacity: .15 });
    for (let j = 1; j < cols; j++) h += G.line(MX + j * cw, T, MX + j * cw, base, "thin", { opacity: .15 });
    h += grid(MX, base, st.w, st.d, cw, ch, "fsoft") + G.knob(MX + st.d * cw, base - st.w * ch, "c", 14);
    h += G.he(320, base + 26, dims(cfg, st.w, st.d), "b", "right") + G.he(320, base + 48, `= ${pf(mA)} ${cfg.aUnit}`, "a", "right");
    // given (right)
    h += G.he(GR, 20, titles[0], "blue", "right") + grid(GR - gd * cw, base, gw, gd, cw, ch, "fblue-soft");
    h += G.he(612, base + 26, V ? `${ltr("x = " + gw)} ${cfg.wUnit}, ${ltr("d = " + gd)} ${cfg.dUnit}` : dims(cfg, gw, gd), "b", "right");
    h += G.he(612, base + 48, `= ${pf(gA)} ${cfg.aUnit}`, "blue", "right");
    let height = base + 82;
    const status = target => { const W = cfg.words; return mA === target ? G.he(320, base + 70, W.same, "ok", "right") : G.he(320, base + 70, mA > target ? W.more : W.less, "w", "right"); };
    if (cfg.out) {
      const per = cfg.out.total / gA;
      h += G.he(612, base + 70, st.unit ? `כל משבצת: ${ltr(pf(cfg.out.total) + " ÷ " + pf(gA) + " = " + pf(per))} ${cfg.out.unit}` : `${cfg.out.verb} ${pf(cfg.out.total)} ${cfg.out.unit}`, "m", "right");
      h += G.he(320, base + 70, st.unit ? `${ltr(pf(mA) + " × " + pf(per) + " = " + pf(mA * per))} ${cfg.out.unit}` : `? ${cfg.out.unit}`, st.unit ? "ok" : "m", "right");
    } else if (V) {
      const tg = cfg.vars.times * gA, need = cfg.vars.wk * st.x;
      h += G.he(612, base + 70, `עבודה פי ${cfg.vars.times}: ${pf(tg)} ${cfg.aUnit}`, "a", "right");
      h += st.w !== need ? G.he(320, base + 70, `צריך ${ltr(cfg.vars.wk + "x = " + need)} ${cfg.wUnit}`, "w", "right") : status(tg);
      h += G.he(612, base + 100, "התשובות:", "m", "right") + cfg.vars.opts.map((o, i) => G.t(100 + i * 128, base + 100, `${o.label} = ${pf(o.k * st.gd)}`, "b")).join("");
      height = base + 112;
    } else if (cfg.match) h += status(gA);
    return { svg: h, height };
  }

  const PC = 14, PX = 40, PY = 44, PER = 20;
  function drawPour(st, cfg) {
    const totD = cfg.given.reduce((s, b) => s + b.d, 0), maxW = Math.max(...cfg.given.map(b => b.w)), base = PY + maxW * PC, cls = ["fa", "fblue"];
    let h = G.he(GR, 20, "העבודה שנעשתה", "b", "right") + G.he(PX, 20, "פועל אחד לבדו (20 ימים בשורה)", "b", "left"), x = GR - totD * PC;
    cfg.given.forEach((b, i) => {
      const done = st.order.includes(i);
      h += G.tap(G.rect(x, base - b.w * PC, b.d * PC, b.w * PC, (done ? "ghost" : cls[i]) + " hot", { "pointer-events": "all" }), "b" + i);
      if (!done) h += grid(x, base, b.w, b.d, PC, PC, "ghost").replace(/^<rect[^>]*>/, "");
      h += G.t(x + b.d * PC / 2, base + 20, `${b.w} × ${b.d}`, done ? "m" : "b", "middle", np);
      x += b.d * PC;
    });
    h += G.he(GR, base + 42, "פועלים × ימים", "m", "right");
    const rowsN = 4; h += G.rect(PX, PY, PER * PC, rowsN * PC, "ghost");
    for (let i = 1; i < rowsN; i++) h += G.line(PX, PY + i * PC, PX + PER * PC, PY + i * PC, "thin", { opacity: .15 });
    for (let j = 1; j < PER; j++) h += G.line(PX + j * PC, PY, PX + j * PC, PY + rowsN * PC, "thin", { opacity: j % 10 ? .15 : .5 });
    let n = 0;
    st.order.forEach(i => { const b = cfg.given[i]; for (let k = 0; k < b.w * b.d; k++, n++) h += G.rect(PX + (n % PER) * PC, PY + Math.floor(n / PER) * PC, PC, PC, cls[i]); });
    h += G.he(PX + PER * PC, PY + rowsN * PC + 28, n ? `פועל אחד לבדו: ${n} ימים` : "עוד לא הועברו ימי עבודה", n ? "a" : "m", "right");
    return { svg: h, height: Math.max(base + 54, PY + rowsN * PC + 44) };
  }

  Boards["prb-team"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const pour = cfg.mode === "pour", V = cfg.mode === "vars";
      const render = () => {
        const d = pour ? drawPour(st, cfg) : drawRect(st, cfg), tools = [];
        if (cfg.out) tools.push({ label: "כמה מייצרת משבצת אחת?", op: "unit", active: st.unit });
        if (V) tools.push({ label: "x + 1", op: "x+", disabled: st.x >= cfg.vars.xMax }, { label: "x − 1", op: "x-", disabled: st.x <= 1 },
          { label: "d + 1", op: "d+", disabled: st.gd >= cfg.vars.dMax }, { label: "d − 1", op: "d-", disabled: st.gd <= 2 });
        tools.push({ label: "↺ מההתחלה", op: "reset", quiet: true });
        ui.set({ height: d.height, svg: d.svg, tools });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "מלבן של שורות כפול עמודות",
        onTap(key) { const i = +key.slice(1), at = st.order.indexOf(i); if (at < 0) st.order.push(i); else st.order.splice(at, 1); render(); },
        onDrag(key, pt) {
          const s = cfg.dSnap || 1, base = T + cfg.rows * cfg.ch;
          st.d = Math.max(s, Math.min(cfg.cols, Math.round((pt.x - MX) / cfg.cw / s) * s));
          st.w = Math.max(1, Math.min(cfg.rows, Math.round((base - pt.y) / cfg.ch)));
          render();
        },
        onOp(op) {
          if (op === "reset") kit.reset(st, fresh(cfg));
          else if (op === "unit") st.unit = !st.unit;
          else if (op === "x+") st.x++; else if (op === "x-") st.x--; else if (op === "d+") st.gd++; else if (op === "d-") st.gd--;
          render();
        },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const note = (cfg.notes || {})[chosen]; let h = "";
      if (cfg.mode === "pour") {
        const c = 12, x0 = 610 - PER * c, sum = cfg.given.map(b => b.w * b.d);
        [[chosen, "chosen"], [correct, "correct"]].forEach(([j, kind], i) => {
          const y = 30 + i * 104, n = C.days[j];
          h += kit.rowTitle(610, y - 10, kind) + G.rect(x0, y, PER * c, 4 * c, "ghost");
          for (let k = 0; k < n; k++) h += G.rect(x0 + (k % PER) * c, y + Math.floor(k / PER) * c, c, c, kind === "chosen" ? "fwarn" : k < sum[0] ? "fok" : "fok-soft");
          h += G.he(x0 - 14, y + 30, `${n} ימי עבודה` + (kind === "correct" ? `: ${ltr(sum.join(" + ") + " = " + n)}` : ""), "m", "right");
        });
        return kit.compare(host, { height: 196, svg: h, note, title: "ככה זה נראה בימי עבודה של פועל אחד" });
      }
      const maxD = Math.max(C.d[chosen], C.d[correct]), cw = Math.min(250 / maxD, 40), ch = Math.min(110 / C.w, 30), base = 150;
      [[chosen, "chosen", 340], [correct, "correct", 30]].forEach(([j, kind, x]) => {
        const d = C.d[j], a = area(cfg, C.w, d);
        h += kit.rowTitle(x + 270, 20, kind) + grid(x + 270 - d * cw, base, C.w, d, cw, ch, kind === "chosen" ? "fwarn" : "fok-soft");
        h += G.he(x + 270, base + 24, dims(cfg, C.w, d), "m", "right");
        h += G.he(x + 270, base + 46, `= ${pf(a)} ${cfg.aUnit}` + (cfg.out ? ` ← ${pf(a * cfg.out.total / area(cfg, cfg.given[0].w, cfg.given[0].d))} ${cfg.out.unit}` : kind === "chosen" && C.target ? ` (צריך ${pf(C.target)})` : ""), "m", "right");
      });
      if (C.sub) h += G.he(320, base + 74, C.sub, "m");
      kit.compare(host, { height: base + (C.sub ? 86 : 60), svg: h, note, title: "ככה זה נראה על המלבן" });
    },
  };
})();
