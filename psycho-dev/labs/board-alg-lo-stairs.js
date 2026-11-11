/* board-alg-lo-stairs.js — staircase for a recursive ("circular") operation: f(n) = mul·f(n−1) + add.
   The bottom step is given. Tapping a step computes it from the step below it; tapping a step whose lower
   neighbour is still unknown shows what it is waiting for (the "descent").
   cfg: { type:"alg-lo-stairs", tip, name:"f", base:3 (value of f(1)), mul:2, add:-1, rule:"f(n) = 2·f(n − 1) − 1",
          ask:4, max:5, cmp:{ optionIndex:{ n:3 } | { off:"15" } } (correct option too), notes:{} } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit;
  const NP = { "pointer-events": "none" }, BW = 104, BH = 44;
  const fresh = cfg => ({ init: true, v: [cfg.base], wait: [], msg: "" });
  const X = i => 24 + i * 118, Y = (i, cfg) => 54 + (cfg.max - 1 - i) * 44;
  const tail = cfg => cfg.add < 0 ? " − " + pf(-cfg.add) : cfg.add > 0 ? " + " + pf(cfg.add) : "";
  const fn = (cfg, n) => cfg.name + "(" + n + ")";
  const next = (cfg, v) => cfg.mul * v + cfg.add;
  const calc = (cfg, v) => pf(cfg.mul) + "·" + pf(v) + tail(cfg);

  function stairs(cfg, vals, wait, live, mark) {
    let h = G.t(24, 34, cfg.rule, "big", "start");
    for (let i = 0; i < cfg.max; i++) {
      const x = X(i), y = Y(i, cfg), n = i + 1, known = vals[i] !== undefined, w = !known && wait[i];
      const cls = mark && mark[i] ? mark[i] : known ? (i === 0 ? "bg" : "fok-soft") : w ? "fwarn" : n === cfg.ask ? "fsoft" : "box";
      const r = G.rect(x, y, BW, BH, cls + (live && !known ? " hot" : ""), { rx: 8 });
      h += live && !known ? G.tap(r, "s" + i) : r;
      h += known ? G.t(x + BW / 2, y + 30, pf(vals[i]), "big", "middle", NP) : G.t(x + BW / 2, y + 28, w ? pf(cfg.mul) + "·" + fn(cfg, n - 1) + tail(cfg).replace(/ /g, "") : "?", w ? "m" : "big", "middle", NP);
      h += G.t(x + BW / 2, y + BH + 23, fn(cfg, n), n === cfg.ask ? "a" : "b");
      if (i === 0) h += G.he(x + BW / 2, y + BH + 44, "נתון", "m");
      else if (known) h += G.t(x + BW / 2, y + BH + 44, calc(cfg, vals[i - 1]), "m");
      if (i > 0 && known) h += G.arrow(X(i - 1) + BW - 16, Y(i - 1, cfg) - 4, x - 5, y + BH - 10, "thin");
    }
    return h;
  }
  const height = cfg => Y(0, cfg) + BH + 56;

  Boards["alg-lo-stairs"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const render = () => ui.set({ height: height(cfg), svg: stairs(cfg, st.v, st.wait, true), msg: st.msg, tools: [...(st.v.length > 1 ? [{ label: "בטל צעד", op: "undo", quiet: true }] : []), { label: "↺ מההתחלה", op: "reset", quiet: true }] });
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "מדרגות לחישוב פעולה מעגלית",
        onTap(key) {
          const i = +key.slice(1); st.msg = "";
          if (st.v.length === i) { st.v.push(next(cfg, st.v[i - 1])); st.wait[i] = false; }
          else if (i > st.v.length) { st.wait[i] = true; st.msg = `כדי לחשב את ${fn(cfg, i + 1)} צריך קודם את ${fn(cfg, i)}. רד עד למדרגה שכבר ידועה, וטפס ממנה.`; }
          render();
        },
        onOp(op) { if (op === "reset") kit.reset(st, fresh(cfg)); else if (op === "undo" && st.v.length > 1) { st.v.pop(); st.msg = ""; } render(); },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      const C = cfg.cmp; if (!C || chosen === correct || chosen === undefined || isNaN(chosen) || !C[chosen]) { host.innerHTML = ""; return; }
      const vals = [cfg.base]; for (let i = 1; i < cfg.max; i++) vals.push(next(cfg, vals[i - 1]));
      const mark = [], ch = C[chosen], ok = C[correct];
      mark[ok.n - 1] = "fok"; if (ch.n) mark[ch.n - 1] = "fwarn";
      let h = stairs(cfg, vals, [], false, mark);
      // white digits on the solid green step
      h += G.t(X(ok.n - 1) + BW / 2, Y(ok.n - 1, cfg) + 30, pf(vals[ok.n - 1]), "inv big");
      h += kit.rowTitle(X(ok.n - 1) + BW - 34, Y(ok.n - 1, cfg) - 10, "correct");
      if (ch.n) h += kit.rowTitle(X(ch.n - 1) + BW - 34, Y(ch.n - 1, cfg) - 10, "chosen");
      else {
        const x = 440, y = height(cfg) - 84;
        h += kit.rowTitle(x + 120, y - 10, "chosen") + G.rect(x, y, 120, BH, "fwarn", { rx: 8 }) + G.t(x + 60, y + 30, ch.off, "big") + G.he(x + 120, y + BH + 22, "לא מופיע במדרגות", "m", "right");
      }
      kit.compare(host, { height: height(cfg), svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה על המדרגות" });
    },
  };
})();
