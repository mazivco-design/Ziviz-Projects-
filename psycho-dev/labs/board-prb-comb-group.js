/* board-prb-comb-group.js — choose k of n by toggling chips; every distinct full group the learner forms is logged.
   cfg: { type:"prb-comb-group", n, k, item:"שחקן", tip, doneMsg?, compare:{ rows:{ optionIndex:{ cap:[lines] } } }, notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, R = 610, NP = { "pointer-events": "none" };
  const fresh = cfg => ({ init: true, on: Array(cfg.n).fill(0), found: [], msg: "" });
  const sum = a => a.reduce((s, v) => s + v, 0);
  const choose = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
  const miniRow = (bits, xr, y, s, hot) => { let h = ""; [...bits].forEach((b, i) => { h += G.rect(xr - (i + 1) * (s + 3) + 3, y, s, s, b === "1" ? (hot ? "fa" : "fblue") : "box", { rx: 2 }); }); return h; };

  function draw(st, cfg) {
    const n = cfg.n, step = Math.min(70, 580 / n), w = step - 12, cnt = sum(st.on), cur = st.on.join("");
    let h = "";
    for (let i = 0; i < n; i++) { const x = R - (i + 1) * step + 12; h += G.tap(G.rect(x, 14, w, 46, (st.on[i] ? "fa" : "box") + " hot", { rx: 10 }), "p" + i) + G.t(x + w / 2, 44, String(i + 1), st.on[i] ? "inv" : "b", "middle", NP); }
    h += G.he(R, 88, "נבחרו " + cnt + " מתוך " + cfg.k + " הדרושים" + (cnt === cfg.k - 0 && cfg.n - cfg.k === 1 ? " · בחוץ: " + cfg.item + " " + (st.on.indexOf(0) + 1) : ""), cnt === cfg.k ? "a" : "m", "right");
    h += G.he(R, 120, "קבוצות שונות שמצאת: " + st.found.length, "b", "right");
    const s = 13, mw = n * (s + 3) + 30, per = Math.max(1, Math.floor(580 / mw));
    st.found.slice(0, 40).forEach((f, j) => { const xr = R - (j % per) * mw, y = 136 + Math.floor(j / per) * 26; h += miniRow(f, xr, y, s, f === cur); });
    return { svg: h, height: 140 + Math.ceil(Math.max(1, Math.min(40, st.found.length)) / per) * 26 + 8 };
  }

  Boards["prb-comb-group"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const render = () => { const d = draw(st, cfg); ui.set({ height: d.height, svg: d.svg, msg: st.msg, tools: [{ label: "↺ מההתחלה", op: "reset", quiet: true }] }); };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "בחירת קבוצה מתוך פריטים",
        onTap(key) {
          const i = +key.slice(1); st.msg = "";
          if (!st.on[i] && sum(st.on) >= cfg.k) { st.msg = `כבר בחרת ${cfg.k}. לחץ על ${cfg.item} צבוע כדי להוציא אותו, ואז בחר אחר במקומו.`; render(); return; }
          st.on[i] = st.on[i] ? 0 : 1;
          const cur = st.on.join("");
          if (sum(st.on) === cfg.k && !st.found.includes(cur)) { st.found.push(cur); if (st.found.length === choose(cfg.n, cfg.k) && cfg.doneMsg) st.msg = cfg.doneMsg; }
          render();
        },
        onOp() { kit.reset(st, fresh(cfg)); render(); },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen) || !C.rows[chosen]) { host.innerHTML = ""; return; }
      const n = cfg.n, all = []; for (let m = 0; m < (1 << n); m++) { const b = [...Array(n)].map((_, i) => (m >> i) & 1); if (sum(b) === cfg.k) all.push(b.join("")); }
      let h = kit.rowTitle(R, 24, "chosen");
      C.rows[chosen].cap.forEach((c, k) => { h += G.he(R, 54 + k * 28, c, k ? "m" : "b", "right"); });
      h += G.line(30, 100, R, 100, "dash") + kit.rowTitle(R, 128, "correct");
      const s = 11, mw = n * (s + 3) + 26, per = Math.max(1, Math.floor(580 / mw));
      all.slice(0, 30).forEach((f, j) => { h += miniRow(f, R - (j % per) * mw, 142 + Math.floor(j / per) * 24, s, false); });
      const y = 142 + Math.ceil(Math.min(30, all.length) / per) * 24 + 18;
      C.rows[correct].cap.forEach((c, k) => { h += G.he(R, y + k * 28, c, k ? "m" : "b", "right"); });
      kit.compare(host, { height: y + C.rows[correct].cap.length * 28 - 10, svg: h, note: (cfg.notes || {})[chosen] });
    },
  };
})();
