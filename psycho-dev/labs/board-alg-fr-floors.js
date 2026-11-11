/* board-alg-fr-floors.js — a compound ("multi-storey") fraction as nested boxes. Tap the innermost open box to work it out;
   each solved floor collapses into its value and gets a strip picture underneath.
   cfg: { type:"alg-fr-floors", tip, floors:[ innermost first: { pre (text before the inner box, "" for the innermost), full (the floor written
          with the inner value, e.g. "1 ÷ 3/2"), res, cells:[css class per strip cell], cap (Hebrew) } ],
          cmp:{ stop:[how many floors were solved to get each option] }, notes }  */
(function () {
  "use strict";
  const { kit } = Boards, { G } = kit, NP = { "pointer-events": "none" };
  const fresh = () => ({ init: true, done: 0, warn: false });

  // nested boxes at vertical band [y, y+H]; `done` floors are collapsed into a value chip of class cls
  function nest(y, H, floors, done, cls, tap) {
    const N = floors.length; let h = "", x = 16;
    for (let lv = N - 1; lv >= done; lv--) {
      const d = N - 1 - lv, by = y + d * 9, bh = H - d * 18, active = lv === done, f = floors[lv];
      const r = G.rect(x, by, 624 - d * 8 - x, bh, (active ? "fsoft" : "box") + (tap ? " hot" : ""), { rx: 10 });
      h += tap ? G.tap(r, "f" + lv) : r;
      if (lv === 0) h += G.t((x + 624 - d * 8) / 2, y + H / 2 + 8, f.full, "big", "middle", NP);
      else { h += G.t(x + 14, y + H / 2 + 8, f.pre, "big", "start", NP); x += 96; }
    }
    if (done > 0 && done < N) { const d = N - done; h += G.rect(x, y + d * 9, 110, H - d * 18, cls, { rx: 10, "pointer-events": "none" }) + G.t(x + 55, y + H / 2 + 8, floors[done - 1].res, "big", "middle", NP); }
    if (done === N) h += G.rect(16, y, 608, H, cls, { rx: 10 }) + G.t(320, y + H / 2 + 8, "= " + floors[N - 1].res, "big", "middle", NP);
    return h;
  }

  Boards["alg-fr-floors"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh());
      const F = cfg.floors;
      const render = () => {
        let h = nest(10, 104, F, st.done, "fok-soft", true), y = 150;
        for (let k = 0; k < st.done; k++) {
          const f = F[k];
          h += G.t(22, y + 6, f.full + " = " + f.res, "b", "start");
          f.cells.forEach((c, q) => { h += G.rect(214 + q * 38, y - 16, 34, 30, c, { rx: 3 }); });
          h += G.he(612, y + 6, f.cap, "m", "right");
          y += 46;
        }
        if (!st.done) { h += G.he(612, y + 4, "לחץ על קומה כדי לחשב אותה", "m", "right"); y += 30; }
        ui.set({
          height: y - 10, svg: h, msg: st.warn ? "הקומה הזאת עדיין מחכה לתוצאה של הקומה שבתוכה. מתחילים מהקומה הפנימית ביותר (הוורודה)." : "",
          tools: [...(st.done ? [{ label: "בטל צעד אחרון", op: "undo", quiet: true }] : []), { label: "↺ מההתחלה", op: "reset", quiet: true }],
        });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "שבר מורכב כקומות",
        onTap(key) { const lv = +key.slice(1); if (lv === st.done) { st.done++; st.warn = false; } else st.warn = true; render(); },
        onOp(op) { if (op === "undo") { st.done--; st.warn = false; } else kit.reset(st, fresh()); render(); },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      const C = cfg.cmp; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const F = cfg.floors, N = F.length; let h = "";
      [[chosen, "chosen", "fwarn"], [correct, "correct", "fok-soft"]].forEach(([j, kind, fc], i) => {
        const y = 34 + i * 150, k = C.stop[j];
        h += kit.rowTitle(612, y - 10, kind) + nest(y, 84, F, k, fc, false);
        h += G.he(612, y + 108, k === N ? "כל הקומות חושבו" : k === N - 1 ? "נשארה עוד קומה אחת לחשב" : `נשארו עוד ${N - k} קומות לחשב`, "m", "right");
      });
      kit.compare(host, { height: 300, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה בקומות" });
    },
  };
})();
