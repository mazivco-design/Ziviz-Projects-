/* board-eq-rows.js — equation rows for systems: pick rows and add / subtract / multiply them, or divide one row by a number.
   Every result is a new row drawn as tiles; a row that equals the requested expression lights up.
   cfg: { type:"eq-rows", tip, vars:["a","b"], rows:[{e:{a:1,b:-1}, r:5}, ...]   (e: monomial -> coefficient; monomials: "a","b","aa","ab","bb"),
          target:{e, t:"a² − b²"}, div:[2,5],
          compare:{ rows:[ per option: {e, r, lab, cap} ] }, notes } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, ROW = 52, TOP = 34, MAX = 7, NP = { "pointer-events": "none" };
  const nf = v => (v < 0 ? "−" : "") + pf(Math.abs(v));
  const mono = k => k.replace(/(.)\1/g, "$1²");
  const keys = e => Object.keys(e).filter(k => e[k]).sort((a, b) => b.length - a.length || (a < b ? -1 : 1));
  const text = e => { const ks = keys(e); if (!ks.length) return "0"; return ks.map((k, i) => { const c = e[k], a = Math.abs(c); return (i ? (c < 0 ? " − " : " + ") : c < 0 ? "−" : "") + (a === 1 ? "" : a) + mono(k); }).join(""); };
  const comb = (a, b, s) => { const o = { ...a }; for (const k in b) o[k] = (o[k] || 0) + s * b[k]; for (const k in o) if (!o[k]) delete o[k]; return o; };
  const mul = (a, b) => { const o = {}; for (const i in a) for (const j in b) { const k = (i + j).split("").sort().join(""); o[k] = (o[k] || 0) + a[i] * b[j]; } for (const k in o) if (!o[k]) delete o[k]; return o; };
  const deg = e => Math.max(0, ...keys(e).map(k => k.length));
  const same = (a, b) => keys(comb(a, b, -1)).length === 0;
  const fresh = cfg => ({ init: 1, rows: cfg.rows.map(r => ({ e: { ...r.e }, r: r.r, lab: "" })), sel: [], msg: "" });

  // one equation as tiles inside a band starting at y
  function rowSvg(cfg, R, y, cls, num, key) {
    let h = G.rect(20, y, 600, 44, cls, { rx: 10 }), x = 66;
    if (num) h += G.t(42, y + 28, "(" + num + ")", "b", "middle", NP);
    const ks = keys(R.e), cnt = ks.reduce((s, k) => s + Math.abs(R.e[k]), 0);
    if (cnt > 14 || !cnt) { h += G.t(x, y + 28, text(R.e) + " = " + nf(R.r), "b", "start", NP); }
    else {
      ks.forEach(k => {
        const c = R.e[k], vi = cfg.vars.indexOf(k), tc = c < 0 ? "ghost" : k.length > 1 ? "box" : ["fblue-soft", "fok-soft", "fsoft"][vi % 3];
        const tw = k.length > 1 ? 40 : c < 0 ? 32 : 26;
        for (let i = 0; i < Math.abs(c); i++) { h += G.rect(x, y + 8, tw, 28, tc, { rx: 4 }) + G.t(x + tw / 2, y + 27, (c < 0 ? "−" : "") + mono(k), c < 0 ? "m" : "b", "middle", NP); x += tw + 2; }
        x += 6;
      });
      h += G.t(x + 4, y + 28, "= " + nf(R.r), "b", "start", NP);
    }
    if (R.lab) h += G.t(606, y + 27, R.lab, "m", "end", NP);
    return key ? G.tap(G.rect(20, y, 600, 44, "hot", { rx: 10, style: "fill:transparent" }), key).replace(/^/, h) : h;
  }

  Boards["eq-rows"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const isT = R => cfg.target && same(R.e, cfg.target.e);
      const render = () => {
        let h = cfg.target ? G.he(612, 22, "מחפשים: " + ltr(cfg.target.t), "a", "right") : "";
        st.rows.forEach((R, i) => { h += rowSvg(cfg, R, TOP + i * ROW, isT(R) ? "fok-soft" : st.sel.includes(i) ? "fsoft" : "bg", i + 1, "r" + i); });
        const [i, j] = st.sel, full = st.rows.length >= MAX, two = st.sel.length === 2, one = st.sel.length === 1;
        const tools = two ? [
          { label: ltr(`(${i + 1}) + (${j + 1})`), op: "add", disabled: full },
          { label: ltr(`(${i + 1}) − (${j + 1})`), op: "sub", n: 0, disabled: full }, { label: ltr(`(${j + 1}) − (${i + 1})`), op: "sub", n: 1, disabled: full },
          { label: ltr(`(${i + 1}) · (${j + 1})`), op: "mul", disabled: full || deg(st.rows[i].e) + deg(st.rows[j].e) > 2 },
        ] : [{ label: "חבר שורות", op: "add", disabled: true }, { label: "חסר שורות", op: "sub", n: 0, disabled: true }, { label: "כפול שורות", op: "mul", disabled: true }];
        (cfg.div || []).forEach(n => tools.push({ label: one ? ltr(`(${i + 1}) : ${n}`) : "חלק ב־" + n, op: "div", n, disabled: !one || full || [st.rows[i].r, ...Object.values(st.rows[i].e)].some(v => v % n) }));
        if (st.rows.length > cfg.rows.length) tools.push({ label: "בטל שורה אחרונה", op: "undo", quiet: true });
        tools.push({ label: "↺ מההתחלה", op: "reset", quiet: true });
        const msg = st.msg || (st.sel.length ? "" : "");
        h += G.he(320, TOP + st.rows.length * ROW + 14, full ? "הלוח מלא. אפשר לבטל שורה או להתחיל מחדש" : two ? "בחר פעולה על שתי השורות המסומנות" : one ? "סמן שורה נוספת, או חלק את השורה המסומנת" : "לחץ על שורה כדי לסמן אותה", "m");
        ui.set({ height: TOP + st.rows.length * ROW + 26, svg: h, tools, msg });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "שורות המשוואות",
        onTap(key) { const i = +key.slice(1), p = st.sel.indexOf(i); if (p >= 0) st.sel.splice(p, 1); else { st.sel.push(i); if (st.sel.length > 2) st.sel.shift(); } render(); },
        onOp(op, el) {
          if (op === "reset") kit.reset(st, fresh(cfg));
          else if (op === "undo") { st.rows.pop(); st.sel = []; st.msg = ""; }
          else {
            let [i, j] = st.sel; const n = +el.dataset.n; if (op === "sub" && n === 1) [i, j] = [j, i];
            const A = st.rows[i], B = st.rows[j];
            const N = op === "add" ? { e: comb(A.e, B.e, 1), r: A.r + B.r, lab: `(${i + 1}) + (${j + 1})` } : op === "sub" ? { e: comb(A.e, B.e, -1), r: A.r - B.r, lab: `(${i + 1}) − (${j + 1})` }
              : op === "mul" ? { e: mul(A.e, B.e), r: A.r * B.r, lab: `(${i + 1}) · (${j + 1})` } : { e: Object.fromEntries(Object.entries(A.e).map(([k, v]) => [k, v / n])), r: A.r / n, lab: `(${i + 1}) : ${n}` };
            st.rows.push(N); st.sel = [];
            st.msg = isT(N) ? `קיבלת את הביטוי שמחפשים: ${text(N.e)} = ${nf(N.r)}` : "";
          }
          render();
        },
      });
      render();
    },
    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      let h = "";
      [[chosen, "chosen", "fwarn"], [correct, "correct", "fok-soft"]].forEach(([j, kind, cls], i) => {
        const y = 26 + i * 108, R = C.rows[j];
        h += kit.rowTitle(612, y, kind) + rowSvg(cfg, R, y + 10, cls, 0, null) + G.he(612, y + 76, R.cap, "m", "right");
      });
      kit.compare(host, { height: 226, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה בשורות" });
    },
  };
})();
