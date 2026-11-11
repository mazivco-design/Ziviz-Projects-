/* board-pow-table.js — value tables for powers. Two uses:
   (1) a power LADDER (chain:true): cells for consecutive exponents; some are known, and every tap on a neighbouring cell
       reveals it (one step = × or ÷ the base), so 5⁰, negative exponents etc. are reached by walking the pattern;
   (2) a SUBSTITUTION table (chain:false): tap a column to substitute that value; option rows that match the target row light up.
   cfg: { type:"pow-table", tip,
          tracks:[{ head:"n", cols:["3","2",..], open:[col,...], chain:true|false, step?:"÷ (−2)", goal?:col,
                    rows:[{ t:"(−2)ⁿ", v:[display strings], target?:true, opt?:true }] }],
          sum?:{ t:"5⁰ + 0⁵ + 1⁷", parts:[[track,col],...], total:"2" },
          compare:{ head, cols:[..], ref?:{t,v}, opts:[ per option: {t, v:[..], mark:[cols]} ] }, notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr } = kit, LX = 150, RX = 624, HH = 28, RH = 36, NP = { "pointer-events": "none" };
  const fresh = cfg => ({ init: 1, open: cfg.tracks.map(t => { const o = {}; (t.open || []).forEach(c => { o[c] = 1; }); return o; }), msg: "" });
  const cw = n => Math.min(96, (RX - LX) / n);
  const trackH = t => HH + t.rows.length * RH + (t.step ? 26 : 8);

  function trackSvg(T, y, open, ti) {
    const w = cw(T.cols.length); let h = G.t(LX - 14, y + 20, T.head ? T.head + " =" : "", "m", "end");
    const tgt = T.rows.find(r => r.target);
    T.cols.forEach((c, i) => { h += G.rect(LX + i * w, y, w, HH, "bg") + G.t(LX + (i + .5) * w, y + 20, c, "b", "middle", NP); });
    T.rows.forEach((R, ri) => {
      const ry = y + HH + ri * RH, fail = R.opt && tgt && T.cols.some((c, i) => open[i] && R.v[i] !== tgt.v[i]);
      h += G.t(LX - 14, ry + 24, R.t, fail ? "m" : R.target ? "a" : "b", "end");
      T.cols.forEach((c, i) => {
        const on = open[i], hit = on && R.opt && tgt && R.v[i] === tgt.v[i], goal = T.goal === i && ri === 0;
        h += G.rect(LX + i * w, ry, w, RH, hit || (goal && on) ? "fok-soft" : R.target && on ? "fsoft" : "box");
        h += G.t(LX + (i + .5) * w, ry + 24, on ? R.v[i] : "?", on ? (goal ? "ok" : R.opt && !hit ? "m" : "b") : "m", "middle", NP);
        if (goal && !on) h += G.rect(LX + i * w + 3, ry + 3, w - 6, RH - 6, "sa", { rx: 4, "pointer-events": "none" });
      });
    });
    if (T.step) h += G.he(RX, y + HH + T.rows.length * RH + 19, "כל צעד ימינה: " + ltr(T.step), "m", "right");
    if (ti !== null) T.cols.forEach((c, i) => { h += G.tap(G.rect(LX + i * w, y, w, HH + T.rows.length * RH, "hot", { style: "fill:transparent" }), "t" + ti + "c" + i); });
    return h;
  }

  Boards["pow-table"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const render = () => {
        let h = "", y = 10;
        cfg.tracks.forEach((T, ti) => { h += trackSvg(T, y, st.open[ti], ti); y += trackH(T) + 8; });
        if (cfg.sum) {
          const parts = cfg.sum.parts.map(([t, c]) => st.open[t][c] ? cfg.tracks[t].rows[0].v[c] : "?"), all = !parts.includes("?");
          h += G.t(320, y + 22, cfg.sum.t + " = " + parts.join(" + ") + (all ? " = " + cfg.sum.total : ""), all ? "big ok" : "big"); y += 36;
        }
        ui.set({ height: y + 4, svg: h, msg: st.msg, tools: [{ label: "↺ מההתחלה", op: "reset", quiet: true }] });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "טבלת ערכים",
        onTap(key) {
          const [, ti, c] = key.match(/t(\d+)c(\d+)/).map(Number), T = cfg.tracks[ti], o = st.open[ti];
          if (T.chain && !o[c] && !o[c - 1] && !o[c + 1]) st.msg = "מתקדמים צעד אחד בכל פעם: לחץ על משבצת שצמודה למשבצת שכבר ידועה.";
          else { o[c] = 1; st.msg = ""; }
          render();
        },
        onOp() { kit.reset(st, fresh(cfg)); render(); },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const w = cw(C.cols.length); let y = 8;
      let h = G.t(LX - 14, y + 20, C.head ? C.head + " =" : "", "m", "end");
      C.cols.forEach((c, i) => { h += G.rect(LX + i * w, y, w, HH, "bg") + G.t(LX + (i + .5) * w, y + 20, c, "b"); });
      y += HH;
      const row = (R, cls, tc) => { let s = G.t(LX - 14, y + 24, R.t, tc, "end"); R.v.forEach((v, i) => { const m = (R.mark || []).includes(i); s += G.rect(LX + i * w, y, w, RH, m ? cls : "box") + G.t(LX + (i + .5) * w, y + 24, v, m ? "b" : "m"); }); y += RH; return s; };
      if (C.ref) h += row(C.ref, "fsoft", "a");
      [[chosen, "chosen", "fwarn", "w"], [correct, "correct", "fok-soft", "ok"]].forEach(([j, kind, cls, tc]) => { y += 30; h += kit.rowTitle(RX, y - 8, kind); h += row(C.opts[j], cls, tc); });
      kit.compare(host, { height: y + 10, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה בטבלה" });
    },
  };
})();
