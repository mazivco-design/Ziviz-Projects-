/* board-prb-prob-urn.js — an urn whose composition the learner sets: tap balls to color them; the board shows
   the probability of drawing two colored balls in a row without replacement, next to the value the question gives.
   cfg: { type:"prb-prob-urn", n, color:"אדומים", one:"אדום", target:{num,den}, tip, compare:{ vals:[count per option] }, notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, R = 610, NP = { "pointer-events": "none" };
  const fresh = cfg => ({ init: true, on: Array(cfg.n).fill(0) });
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const red = (a, b) => { const g = gcd(a, b) || 1; return a === 0 ? "0" : a / g + "/" + b / g; };
  const prodText = (r, n) => r + "/" + n + " × " + (r - 1) + "/" + (n - 1) + " = " + r * (r - 1) + "/" + n * (n - 1) + (gcd(r * (r - 1), n * (n - 1)) > 1 || r * (r - 1) === 0 ? " = " + red(r * (r - 1), n * (n - 1)) : "");
  const balls = (n, r, y, rad, tap, on) => { const step = Math.min(48, 580 / n); let h = ""; for (let i = 0; i < n; i++) { const c = G.circle(R - 10 - i * step - step / 2 + 10, y, rad, ((on ? on[i] : i < r) ? "fa" : "fblue-soft") + (tap ? " hot" : "")); h += tap ? G.tap(c, "b" + i) : c; } return h; };

  function draw(st, cfg) {
    const n = cfg.n, r = st.on.reduce((a, b) => a + b, 0), T = cfg.target, hit = r * (r - 1) * T.den === T.num * n * (n - 1);
    let h = balls(n, r, 40, 19, true, st.on);
    h += G.he(R, 96, cfg.color + ": " + r + " מתוך " + n, "b", "right");
    h += G.he(R, 124, "ראשון " + cfg.one + ": " + ltr(r + "/" + n), "", "right");
    h += G.he(R, 152, "שני " + cfg.one + ", אחרי שיצא " + cfg.one + ": " + ltr(r ? (r - 1) + "/" + (n - 1) : "—"), "", "right");
    h += G.he(R, 184, "שניהם " + cfg.color + ": " + ltr(r ? prodText(r, n) : "0"), hit ? "ok" : "a", "right");
    h += G.he(R, 212, "לפי השאלה: " + ltr(T.num + "/" + T.den), "m", "right");
    return { svg: h, height: 226 };
  }

  Boards["prb-prob-urn"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const render = () => {
        const d = draw(st, cfg), r = st.on.reduce((a, b) => a + b, 0);
        ui.set({ height: d.height, svg: d.svg, tools: [{ label: "+ " + cfg.one, op: "inc", disabled: r >= cfg.n }, { label: "− " + cfg.one, op: "dec", disabled: r <= 0 }, { label: "↺ מההתחלה", op: "reset", quiet: true }] });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "כדורים בקופסה",
        onTap(key) { const i = +key.slice(1); st.on[i] = st.on[i] ? 0 : 1; render(); },
        onOp(op) {
          if (op === "reset") kit.reset(st, fresh(cfg));
          else if (op === "inc") st.on[st.on.indexOf(0)] = 1;
          else if (op === "dec") st.on[st.on.lastIndexOf(1)] = 0;
          render();
        },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      let h = "";
      [[C.vals[chosen], "chosen"], [C.vals[correct], "correct"]].forEach(([v, kind], i) => {
        const y = i * 104;
        h += kit.rowTitle(R, y + 24, kind) + balls(cfg.n, v, y + 50, 14, false);
        h += G.he(R, y + 90, v + " " + cfg.color + ": " + ltr(prodText(v, cfg.n)), kind === "chosen" ? "w" : "ok", "right");
      });
      kit.compare(host, { height: 208, svg: h, note: (cfg.notes || {})[chosen] });
    },
  };
})();
