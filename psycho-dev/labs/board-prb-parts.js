/* board-prb-parts.js — "cut into equal units and count" board.
   view "groups": one fixed total cut into g equal groups (planned) and into g+delta groups (actual); slider for g.
   view "tariff": a time line with a draggable end-of-parking marker; every tariff track is cut into its paying units,
                  and every unit that was started is colored and counted.
   cfg groups: { type:"prb-parts", view:"groups", total, delta, g:{min,max,start,label}, labels:[planned, actual], item:"תלמידים", group:"קבוצות",
                 compare:{ g:[per option] }, notes }
   cfg tariff: { view:"tariff", hours, snap (minutes), tracks:[{label, unit (minutes), price}], compare:{ t:[minutes per option], caps:[..] }, notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, R = 620, L = 40, SX0 = 60, SX1 = 400;
  const exact = v => Math.abs(v * 100 - Math.round(v * 100)) < 1e-9 || Math.abs(v * 3 - Math.round(v * 3)) < 1e-9;
  const num = v => ltr((exact(v) ? "" : "≈") + pf(v));
  const fresh = cfg => cfg.view === "tariff" ? { init: true, t: 0 } : { init: true, g: cfg.g.start };

  // ---------- groups ----------
  function tape(cfg, g, y, label, cls) {
    const w = (R - L) / g, s = cfg.total / g, ok = Number.isInteger(s); let h = "";
    h += G.he(R, y, `${label}: ${g} ${cfg.group}, ${num(s)} ${cfg.item} בכל אחת`, "b", "right");
    for (let k = 0; k < g; k++) h += G.rect(R - (k + 1) * w, y + 12, w, 42, ok ? cls : "fwarn") + (w >= 56 || ok ? G.t(R - (k + .5) * w, y + 40, num(s), ok ? "m" : "w") : "");
    return h;
  }
  function groups(cfg, g, y, cls) {
    const g2 = g + cfg.delta, a = cfg.total / g, b = cfg.total / g2;
    let h = tape(cfg, g, y, cfg.labels[0], cls[0]) + tape(cfg, g2, y + 84, cfg.labels[1], cls[1]);
    const bad = !Number.isInteger(a) || !Number.isInteger(b);
    h += G.he(R, y + 172, bad ? `${cfg.total} לא מתחלק כאן לקבוצות שלמות` : "ההפרש בגודל הקבוצה: " + ltr(`${b} − ${a} = ${b - a}`), bad ? "w" : "a", "right");
    return h;
  }
  const sx = (a, t) => SX0 + (SX1 - SX0) * (t - a.min) / (a.max - a.min);

  // ---------- tariff ----------
  const hm = t => Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0");
  function tracks(cfg, t, y0, knob, cls) {
    const X = m => L + (R - L) * m / (cfg.hours * 60); let h = "", y = y0;
    cfg.tracks.forEach(tr => {
      const n = Math.ceil(t / tr.unit - 1e-9);
      h += G.he(R, y, `${tr.label}: ` + ltr(`${n} × ${tr.price} = ${n * tr.price}`) + " ₪", "b", "right");
      for (let m = 0; m < cfg.hours * 60; m += tr.unit) h += G.rect(X(m), y + 12, X(m + tr.unit) - X(m), 34, m < t ? cls : "box");
      for (let m = tr.unit; m < cfg.hours * 60; m += tr.unit) h += G.line(X(m), y + 12, X(m), y + 46, "thin");
      h += G.line(X(t), y + 4, X(t), y + 54, "sa");
      y += 84;
    });
    return h;
  }

  Boards["prb-parts"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const tariff = cfg.view === "tariff", AY = 64, SY = 260;
      const X = m => L + (R - L) * m / (cfg.hours * 60);
      const render = () => {
        let h = "", height;
        if (tariff) {
          h += G.he(R, 24, `זמן החניה: ${hm(st.t)} שעות`, "a", "right") + G.line(L, AY, R, AY, "ink");
          for (let m = 0; m <= cfg.hours * 60; m += 30) h += G.line(X(m), AY - (m % 60 ? 4 : 8), X(m), AY + (m % 60 ? 4 : 8), "thin") + (m % 60 ? "" : G.t(X(m), AY + 30, m / 60, "m"));
          h += tracks(cfg, st.t, 128, true, "fa") + G.knob(X(st.t), AY, "t", 16);
          height = 128 + cfg.tracks.length * 84 - 24;
        } else {
          h += groups(cfg, st.g, 26, ["fsoft", "fblue-soft"]);
          h += G.line(SX0, SY, SX1, SY, "mut");
          for (let t = cfg.g.min; t <= cfg.g.max; t++) h += G.line(sx(cfg.g, t), SY - 4, sx(cfg.g, t), SY + 4, "thin");
          h += G.t(SX0 - 26, SY + 6, cfg.g.min, "m") + G.t(SX1 + 28, SY + 6, cfg.g.max, "m") + G.he(R, SY + 7, `${cfg.g.label}: ${st.g}`, "b", "right") + G.knob(sx(cfg.g, st.g), SY, "g", 15);
          height = SY + 30;
        }
        ui.set({ height, svg: h, tools: [{ label: "↺ מההתחלה", op: "reset", quiet: true }] });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: tariff ? "ציר זמן ותעריפים" : "חלוקה לקבוצות",
        onDrag(key, pt) {
          if (tariff) st.t = Math.max(0, Math.min(cfg.hours * 60, Math.round((pt.x - L) / (R - L) * cfg.hours * 60 / cfg.snap) * cfg.snap));
          else st.g = Math.max(cfg.g.min, Math.min(cfg.g.max, Math.round(cfg.g.min + (pt.x - SX0) / (SX1 - SX0) * (cfg.g.max - cfg.g.min))));
          render();
        },
        dragFrom(pt) { return tariff ? (Math.abs(pt.y - AY) < 24 ? "t" : null) : (Math.abs(pt.y - SY) < 20 && pt.x > SX0 - 20 && pt.x < SX1 + 20 ? "g" : null); },
        onOp() { kit.reset(st, fresh(cfg)); render(); },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      let h = "", height;
      if (cfg.view === "tariff") {
        const rh = cfg.tracks.length * 84 + 76;
        [[chosen, "chosen", "fwarn"], [correct, "correct", "fok"]].forEach(([j, kind, cls], i) => {
          const y = 24 + i * rh;
          h += kit.rowTitle(R, y, kind) + G.he(L, y, `זמן: ${hm(C.t[j])}`, "m", "left") + tracks(cfg, C.t[j], y + 40, false, cls) + G.he(R, y + 30 + cfg.tracks.length * 84, C.caps[j], "m", "right");
        });
        height = 2 * rh - 20;
      } else {
        [[chosen, "chosen", ["fwarn", "fwarn"]], [correct, "correct", ["fok-soft", "fok-soft"]]].forEach(([j, kind, cls], i) => {
          const y = 24 + i * 250; h += kit.rowTitle(R, y, kind) + groups(cfg, C.g[j], y + 36, cls);
        });
        height = 500;
      }
      kit.compare(host, { height, svg: h, note: (cfg.notes || {})[chosen] });
    },
  };
})();
