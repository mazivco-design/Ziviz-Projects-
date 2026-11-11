/* board-prb-steps.js — "step after step" board: apply the rule one step at a time and watch the trail.
   Views: "chain" (boxes joined by operation arrows), "graph" (sawtooth position graph), "ring" (a cycle of named places).
   cfg: { type:"prb-steps", view, start, ops:[{label, k:"mul"|"add", v}], cycle:[op indices of one period], maxOps, tip,
          chain: label:"יום {n}", labelFrom:1, startLabel?, offMsg
          graph: yMax, yStep, target, unit:"מ'", countWord:"קפיצות", offMsg
          ring:  names:[..], startAt, target, units:"ימים"
          compare: chain → rows:{optionIndex:{ops:[..], claim?, cap}}, correct:{ops, cap}
                   graph → counts:[per option]      ring → days:[per option], caps:{optionIndex: text}, correctCap
          notes:{optionIndex:text} } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, R = 620;
  const fresh = () => ({ init: true, ops: [] });
  const apply = (v, o) => o.k === "mul" ? v * o.v : v + o.v;
  const trail = (cfg, ops) => { const t = [cfg.start]; ops.forEach(i => t.push(apply(t[t.length - 1], cfg.ops[i]))); return t; };
  const onPat = (cfg, ops, upto) => { const c = cfg.cycle; if (!c) return true; for (let j = 0; j < upto; j++) if (ops[j] !== c[j % c.length]) return false; return true; };

  // ---------- chain ----------
  const PER = 7, SP = 86, NW = 62, NH = 40, RH = 104;
  function drawChain(cfg, ops, y0, opt = {}) {
    const t = trail(cfg, ops), c = cfg.cycle || [0];
    let h = "";
    t.forEach((v, i) => {
      const row = Math.floor(i / PER), col = i % PER, cx = R - NW / 2 - col * SP, y = y0 + row * RH;
      const full = i % c.length === 0 && onPat(cfg, ops, i), last = i === t.length - 1;
      let cls = full ? "bg" : "box";
      if (last && opt.endCls) cls = opt.endCls;
      const shown = last && opt.claim !== undefined ? opt.claim : v;
      h += G.rect(cx - NW / 2, y, NW, NH, cls, { rx: 8 }) + G.t(cx, y + 27, pf(shown), full || last ? "b" : "m");
      if (full) { const p = i / c.length; h += G.he(cx, y + NH + 24, p === 0 && cfg.startLabel ? cfg.startLabel : cfg.label.replace("{n}", p + (cfg.labelFrom || 0)), "m"); }
      if (i > 0) {
        const lab = ltr(cfg.ops[ops[i - 1]].label);
        if (col > 0) { h += G.arrow(cx + NW / 2 + SP - NW - 3, y + NH / 2, cx + NW / 2 + 5, y + NH / 2, "thin") + G.t(cx + SP / 2, y - 6, lab, "a"); }
        else h += G.t(cx + NW / 2 - 6, y - 6, lab + " ↵", "a", "end");
      }
    });
    return { svg: h, rows: Math.floor((t.length - 1) / PER) + 1 };
  }

  // ---------- graph ----------
  const GX0 = 56, GX1 = 606, GY0 = 262, GY1 = 34;
  function drawGraph(cfg, ops, marks) {
    const t = trail(cfg, ops), n = cfg.maxOps, X = i => GX0 + (GX1 - GX0) * i / n, Y = v => GY0 - (GY0 - GY1) * v / cfg.yMax;
    let h = "";
    for (let v = 0; v <= cfg.yMax; v += cfg.yStep) h += G.line(GX0, Y(v), GX1, Y(v), "thin", { opacity: v ? .15 : 1 }) + G.t(GX0 - 10, Y(v) + 6, v, "m", "end");
    for (let i = 0; i <= n; i++) h += G.line(X(i), GY0, X(i), GY0 + 5, "thin") + G.t(X(i), GY0 + 26, i, "m");
    h += G.line(GX0, GY1 - 10, GX0, GY0, "ink");
    h += G.line(GX0, Y(cfg.target), GX1, Y(cfg.target), "sok") + G.he(GX0 + 10, Y(cfg.target) - 9, "היעד: " + cfg.target, "ok", "left");
    if (t.length > 1) h += G.path(t.map((v, i) => (i ? "L" : "M") + X(i) + "," + Y(v)).join(" "), "sa");
    t.forEach((v, i) => { h += G.circle(X(i), Y(v), 4, "dot"); });
    if (marks) marks.forEach(m => { h += G.circle(X(m.i), Y(t[m.i]), 11, m.cls) + G.t(X(m.i), Y(t[m.i]) + (m.below ? 32 : -18), t[m.i], m.txt); });
    else { const i = t.length - 1; h += G.circle(X(i), Y(t[i]), 10, "fa") + G.t(X(i) + (i > n - 1 ? -20 : 0), Y(t[i]) - 16, pf(t[i]), "a"); }
    h += G.he(GX1, GY0 + 56, cfg.axisLabel || "מספר הקפיצות", "m", "right");
    return h;
  }

  // ---------- ring ----------
  const RC = [172, 158], RR = 108, NR = 33;
  function ringPos(k, n) { const a = -Math.PI / 2 + 2 * Math.PI * k / n; return [RC[0] + RR * Math.cos(a), RC[1] + RR * Math.sin(a)]; }
  function drawRing(cfg, fills) {
    const n = cfg.names.length; let h = "";
    h += G.angleArc(RC[0], RC[1], 52, 2.2, .9, "mut") + G.poly([[RC[0] + 38, RC[1] - 38], [RC[0] + 24, RC[1] - 44], [RC[0] + 34, RC[1] - 30]], "dot");
    cfg.names.forEach((nm, k) => {
      const [x, y] = ringPos(k, n), f = fills[k];
      h += G.circle(x, y, NR, f || "box") + G.he(x, y + 6, nm, f === "fa" || f === "fok" ? "inv" : "m");
    });
    return h;
  }

  Boards["prb-steps"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh());
      const max = cfg.maxOps || 13;
      const render = () => {
        const t = trail(cfg, st.ops), cur = t[t.length - 1], off = !onPat(cfg, st.ops, st.ops.length);
        let svg = "", height = 0;
        if (cfg.view === "chain") {
          const d = drawChain(cfg, st.ops, 34); svg = d.svg; height = 34 + d.rows * RH - 4;
          if (off && cfg.offMsg) { svg += G.he(R, height + 14, cfg.offMsg, "w", "right"); height += 30; }
        } else if (cfg.view === "graph") {
          svg = drawGraph(cfg, st.ops); height = GY0 + 104;
          svg += G.he(GX1, GY0 + 90, st.ops.length ? `אחרי ${st.ops.length} ${cfg.countWord}: ${pf(cur)} ${cfg.unit}` : `התחלה: ${pf(cur)} ${cfg.unit}`, "b", "right");
          if (off && cfg.offMsg) { svg += G.he(GX1, GY0 + 122, cfg.offMsg, "w", "right"); height += 32; }
        } else {
          const n = cfg.names.length, fills = {}; fills[cfg.startAt] = "fsoft"; fills[(cfg.startAt + cur) % n] = "fa";
          svg = drawRing(cfg, fills); height = 316;
          const [sx, sy] = ringPos(cfg.startAt, n);
          svg += G.he(sx, sy - NR - 8, "היום", "a");
          svg += G.he(R, 70, `עברו ${pf(cur)} ${cfg.units}`, "b", "right") + G.he(R, 104, `מתוך ${cfg.target}`, "m", "right");
          svg += G.he(R, 150, cur < cfg.target ? `נשארו עוד ${cfg.target - cur}` : "הגעת!", cur < cfg.target ? "w" : "ok", "right");
          svg += G.he(R, 196, "הסימון המלא: היום שהגעת אליו", "m", "right");
        }
        ui.set({
          height, svg,
          tools: [
            ...cfg.ops.map((o, i) => ({ label: /[א-ת]/.test(o.label) ? o.label : ltr(o.label), op: "o" + i, disabled: st.ops.length >= max || (cfg.view === "ring" && cur + o.v > cfg.target) || (cfg.view === "graph" && (apply(cur, o) > cfg.yMax || apply(cur, o) < 0)) })),
            { label: "בטל צעד", op: "undo", quiet: true, disabled: !st.ops.length }, { label: "↺ מההתחלה", op: "reset", quiet: true },
          ],
        });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "צעד אחרי צעד",
        onOp(op) {
          if (op === "reset") kit.reset(st, fresh());
          else if (op === "undo") st.ops.pop();
          else if (st.ops.length < max) st.ops.push(+op.slice(1));
          render();
        },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const note = (cfg.notes || {})[chosen];
      if (cfg.view === "chain") {
        const a = C.rows[chosen], b = C.correct;
        let h = kit.rowTitle(R, 22, "chosen");
        const d1 = drawChain(cfg, a.ops, 58, { endCls: "fwarn", claim: a.claim }); h += d1.svg;
        let y = 58 + d1.rows * RH - 12; h += G.he(R, y + 8, a.cap, "m", "right"); y += 50;
        h += kit.rowTitle(R, y, "correct");
        const d2 = drawChain(cfg, b.ops, y + 36, { endCls: "fok-soft" }); h += d2.svg;
        y = y + 36 + d2.rows * RH - 12; h += G.he(R, y + 8, b.cap, "m", "right");
        kit.compare(host, { height: y + 22, svg: h, note, title: "ככה זה נראה על השרשרת" });
      } else if (cfg.view === "graph") {
        const c = cfg.cycle, n1 = C.counts[chosen], n2 = C.counts[correct], ops = [];
        for (let i = 0; i < Math.max(n1, n2); i++) ops.push(c[i % c.length]);
        const t = trail(cfg, ops);
        let h = drawGraph(cfg, ops, [{ i: n1, cls: "fwarn", txt: "w" }, { i: n2, cls: "fok", txt: "ok" }]);
        h += G.he(GX1, GY0 + 92, `מה שבחרת: אחרי ${n1} ${cfg.countWord} הצפרדע בנקודה ${t[n1]}`, "w", "right");
        h += G.he(GX1, GY0 + 124, `התשובה הנכונה: אחרי ${n2} ${cfg.countWord} היא בנקודה ${t[n2]}`, "ok", "right");
        kit.compare(host, { height: GY0 + 140, svg: h, note, title: "ככה זה נראה על הגרף" });
      } else {
        const n = cfg.names.length, fills = {}; fills[cfg.startAt] = "fsoft";
        fills[(cfg.startAt + C.days[chosen]) % n] = "fwarn"; fills[(cfg.startAt + C.days[correct]) % n] = "fok";
        const [sx, sy] = ringPos(cfg.startAt, n);
        let h = drawRing(cfg, fills) + G.he(sx, sy - NR - 8, "היום", "a");
        h += kit.rowTitle(R, 70, "chosen") + G.he(R, 100, C.caps[chosen], "m", "right");
        h += kit.rowTitle(R, 160, "correct") + G.he(R, 190, C.correctCap, "m", "right");
        kit.compare(host, { height: 316, svg: h, note, title: "ככה זה נראה על המעגל" });
      }
    },
  };
})();
