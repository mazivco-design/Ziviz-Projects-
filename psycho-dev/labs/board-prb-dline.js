/* board-prb-dline.js — double number line for "same ratio" questions (the ratio table, drawn).
   The given pair is marked on both lines. Tap a pair, then ×k / ÷k builds a new pair with the same ratio.
   cfg: { type:"prb-dline", top:{label, max, every}, bot:{label}, given:[topValue, botValue], ask:topValue,
          mul:[..], div:[..], tip, compare:{ vals:[bottom value per option], caps:[text per option] }, notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, R = 620, X0 = 44, X1 = 596, YT = 118, YB = 196;
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const fresh = () => ({ init: true, pairs: [[1, 1]], sel: 0, warn: "" });
  const exact = v => Math.abs(v * 100 - Math.round(v * 100)) < 1e-9 || Math.abs(v * 3 - Math.round(v * 3)) < 1e-9;
  const num = v => ltr((exact(v) ? "" : "≈") + pf(v));
  // place labels on up to 3 levels so neighbours never overlap
  function levels(xs, gap) { const last = [-1e9, -1e9, -1e9]; return xs.map(x => { let l = 0; while (l < 2 && x - last[l] < gap) l++; last[l] = x; return l; }); }

  // marks: [{top, bot, cls, tcls, sel, key, q}]
  function draw(cfg, marks) {
    const X = v => X0 + (X1 - X0) * v / cfg.top.max; let h = "";
    h += G.he(R, 26, cfg.top.label, "b", "right") + G.he(R, YB + 96, cfg.bot.label, "b", "right");
    h += G.line(X0, YT, X1, YT, "ink") + G.line(X0, YB, X1, YB, "ink");
    const taken = v => marks.some(m => Math.abs(X(m.top) - X(v)) < 30);
    for (let v = 0; v <= cfg.top.max; v++) { h += G.line(X(v), YT - 5, X(v), YT + 5, "thin"); if (v % (cfg.top.every || 1) === 0 && !taken(v)) h += G.t(X(v), YT - 14, v, "m"); }
    h += G.t(X0, YB + 28, "0", "m");
    const ms = marks.slice().sort((a, b) => a.top - b.top), lv = levels(ms.map(m => X(m.top)), 62);
    ms.forEach((m, i) => {
      const x = X(m.top), l = lv[i];
      h += G.line(x, YT, x, YB, m.dash ? "dash" : "thin");
      if (l) h += G.line(x, YT - 12, x, YT - 16 - l * 26, "thin", { opacity: .4 }) + G.line(x, YB + 10, x, YB + 10 + l * 26, "thin", { opacity: .4 });
      h += G.circle(x, YT, m.sel ? 9 : 6, m.cls) + G.circle(x, YB, m.sel ? 9 : 6, m.cls);
      h += G.t(x, YT - 14 - l * 26, num(m.top), m.tcls) + G.t(x, YB + 28 + l * 26, m.q ? "?" : num(m.bot), m.tcls);
      if (m.key) h += G.tap(G.rect(x - 22, YT - 20, 44, YB - YT + 40, "hot", { fill: "transparent", stroke: "none" }), m.key);
    });
    return h;
  }

  Boards["prb-dline"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh());
      const [gt, gb] = cfg.given, val = p => p[0] / p[1];
      const render = () => {
        const marks = st.pairs.map((p, i) => ({ top: gt * val(p), bot: gb * val(p), cls: i === 0 ? "fblue" : "fa", tcls: i === st.sel ? "a" : i === 0 ? "blue" : "b", sel: i === st.sel, key: "p" + i }));
        if (!st.pairs.some(p => Math.abs(gt * val(p) - cfg.ask) < 1e-9)) marks.push({ top: cfg.ask, bot: 0, q: true, cls: "box", tcls: "w", dash: true });
        let h = draw(cfg, marks);
        const p = st.pairs[st.sel];
        h += G.he(R, YB + 128, `הזוג המסומן: ${num(gt * val(p))} ${cfg.top.label} ↔ ${num(gb * val(p))} ${cfg.bot.label}`, "a", "right");
        if (st.warn) h += G.he(R, YB + 158, st.warn, "w", "right");
        ui.set({
          height: YB + 170, svg: h,
          tools: [
            ...cfg.mul.map(k => ({ label: ltr("×" + k), op: "mul", n: k })), ...cfg.div.map(k => ({ label: ltr("÷" + k), op: "div", n: k })),
            { label: "מחק זוג אחרון", op: "undo", quiet: true, disabled: st.pairs.length < 2 }, { label: "↺ מההתחלה", op: "reset", quiet: true },
          ],
        });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "ציר מספרים כפול",
        onTap(key) { st.sel = +key.slice(1); st.warn = ""; render(); },
        onOp(op, el) {
          st.warn = "";
          if (op === "reset") kit.reset(st, fresh());
          else if (op === "undo") { st.pairs.pop(); st.sel = Math.min(st.sel, st.pairs.length - 1); }
          else {
            const k = +el.dataset.n, p = st.pairs[st.sel]; let n = p[0] * (op === "mul" ? k : 1), d = p[1] * (op === "div" ? k : 1); const g = gcd(n, d); n /= g; d /= g;
            const at = st.pairs.findIndex(q => q[0] === n && q[1] === d);
            if (at >= 0) st.sel = at;
            else if (gt * n / d > cfg.top.max + 1e-9) st.warn = `${num(gt * n / d)} ${cfg.top.label} כבר מחוץ לציר`;
            else if (st.pairs.length >= 7) st.warn = "יש כבר הרבה זוגות. מחק זוג או התחל מההתחלה";
            else { st.pairs.push([n, d]); st.sel = st.pairs.length - 1; }
          }
          render();
        },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const [gt, gb] = cfg.given, r = gt / gb;
      const marks = [{ top: gt, bot: gb, cls: "fblue", tcls: "blue" }, { top: C.vals[chosen] * r, bot: C.vals[chosen], cls: "fwarn", tcls: "w", sel: true }, { top: C.vals[correct] * r, bot: C.vals[correct], cls: "fok", tcls: "ok", sel: true }];
      let h = draw(cfg, marks);
      h += G.he(R, YB + 130, "מה שבחרת: " + C.caps[chosen], "w", "right") + G.he(R, YB + 162, "התשובה הנכונה: " + C.caps[correct], "ok", "right");
      kit.compare(host, { height: YB + 178, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה על הציר הכפול" });
    },
  };
})();
