/* board-alg-rem.js — chips arranged in rows of a fixed width: full rows + what is left over (division with remainder).
   Normal mode: one or two panels, each shows  mul·var  chips in rows of `div`; the variables are set with sliders / ±1.
     panel: { var, mul?, div, title }                       -> remainder panel
            { var | from, div, take, title, takeLabel }     -> "equal columns" panel: `take` of the `div` columns are colored;
                                                               `from: i` uses the colored chips of panel i (story questions)
     cfg.sum: { names:[..] } shows the sum of the remainders (and the best seen so far).
   Digits mode (cfg.digits:[strings], cfg.div): pick a number, tap its digits to pour them as chips into rows of `div`.
   cfg: { type:"alg-rem", vars:[{name, lo, hi, init}], panels:[..], sum?, digits?, div?, tip,
          cmp:{ j: { arrs:[{n, div, take?, raw?, label}], cap } }, notes:{ j: text } } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr } = kit, np = { "pointer-events": "none" };
  const SX0 = 150, SX1 = 596;
  const fresh = cfg => cfg.digits ? { init: 1, sel: null, pour: cfg.digits.map(d => [...d].map(() => false)), msg: "" }
    : { init: 1, v: cfg.vars.map(v => v.init), best: null, msg: "" };

  // n chips in rows of `div`, drawn left-to-right from (x, y) with cell size s
  function arr(x, y, n, div, s, o = {}) {
    const full = Math.floor(n / div), r = n % div, rad = Math.max(2.5, s * .34); let h = "";
    if (o.raw) { h += G.rect(x - 3, y - 3, n * s + 6, s + 6, "fwarn", { rx: 6 }); for (let i = 0; i < n; i++) h += G.circle(x + i * s + s / 2, y + s / 2, rad, "dot"); return { h, w: n * s, ht: s }; }
    if (full) h += G.rect(x - 3, y - 3, div * s + 6, full * s + 6, "fsoft", { rx: 6 });
    if (r) h += G.rect(x - 3, y + full * s + (full ? 6 : -3), r * s + 6, s + 6, "fwarn", { rx: 6 });
    for (let i = 0; i < n; i++) {
      const c = i % div, row = Math.floor(i / div), left = row >= full;
      h += G.circle(x + c * s + s / 2, y + row * s + s / 2 + (left && full ? 9 : 0), rad, !left && o.take && c < o.take && !r ? "fa" : "dot");
    }
    return { h, w: div * s, ht: (full + (r ? 1 : 0)) * s + (r && full ? 9 : 0) };
  }
  const count = (st, cfg, i) => {
    const p = cfg.panels[i];
    if (p.from === undefined) return (p.mul || 1) * st.v[p.var];
    const q = cfg.panels[p.from], c = count(st, cfg, p.from); return c === null || c % q.div ? null : c / q.div * q.take;
  };

  const maxCount = (cfg, i) => { const p = cfg.panels[i]; if (p.from === undefined) return (p.mul || 1) * cfg.vars[p.var].hi; const q = cfg.panels[p.from]; return Math.floor(maxCount(cfg, p.from) / q.div) * q.take; };

  function draw(st, cfg) {
    const P = cfg.panels, two = P.length > 1, AH = cfg.arrH || 180; let h = "";
    P.forEach((p, i) => {
      const x0 = two ? (i ? 20 : 330) : 170, pw = 290, cx = x0 + pw / 2, n = count(st, cfg, i);
      const maxN = maxCount(cfg, i);
      const s = Math.min(26, 270 / p.div, AH / Math.ceil(maxN / p.div));
      h += G.he(cx, 22, p.title, "b", "middle");
      if (n === null) { h += G.he(cx, 36 + AH / 2, p.blocked || "אי אפשר לחלק לטורים שווים", "w", "middle"); return; }
      const q = Math.floor(n / p.div), r = n % p.div;
      h += arr(cx - p.div * s / 2, 36, n, p.div, s, { take: p.take }).h;
      const y = 36 + AH + 30;
      if (p.take) {
        h += r ? G.he(cx, y, n + ": נשארו " + r + " מחוץ לטורים", "w", "middle") : G.he(cx, y, n + " ב־" + p.div + " טורים: " + q + " בכל טור", "ok", "middle");
        if (!r) h += G.he(cx, y + 26, p.takeLabel + " (" + p.take + " טורים): " + q * p.take, "a", "middle");
      } else {
        h += G.t(cx, y, n + " = " + q + "·" + p.div + " + " + r, "big");
        h += G.he(cx, y + 26, p.rname ? "השארית: " + ltr(p.rname + " = " + r) : "שארית " + r, r ? "w" : "ok", "middle");
      }
    });
    let y = 36 + AH + 30 + 26 + 34;
    if (cfg.sum) {
      const rs = P.map((p, i) => count(st, cfg, i) % p.div), tot = rs.reduce((a, b) => a + b, 0);
      h += G.t(20, y, cfg.sum.names.join(" + ") + " = " + rs.join(" + ") + " = " + tot, "big", "start");
      h += G.he(620, y, "הסכום הכי גבוה שראית: " + st.best, "m", "right"); y += 34;
    }
    cfg.vars.forEach((v, i) => {
      const val = st.v[i], x = SX0 + (val - v.lo) / (v.hi - v.lo) * (SX1 - SX0);
      h += G.t(20, y + 7, v.name + " = " + val, "big", "start") + G.line(SX0, y, SX1, y, "mut");
      const every = v.hi - v.lo <= 30 ? 1 : 5;
      for (let k = v.lo; k <= v.hi; k++) if (k % every === 0 || every === 1) h += G.line(SX0 + (k - v.lo) / (v.hi - v.lo) * (SX1 - SX0), y - 4, SX0 + (k - v.lo) / (v.hi - v.lo) * (SX1 - SX0), y + 4, "mut");
      h += G.knob(x, y, "v" + i, 16); y += 50;
    });
    return { svg: h, height: y - 16 };
  }

  function drawDigits(st, cfg) {
    const N = cfg.digits, div = cfg.div, tw = 140, x0 = 320 - N.length * (tw + 12) / 2 + 6; let h = "";
    N.forEach((d, i) => {
      const x = x0 + i * (tw + 12), done = st.pour[i].every(Boolean), sum = [...d].reduce((a, c, k) => a + (st.pour[i][k] ? +c : 0), 0);
      h += G.tap(G.rect(x, 10, tw, 44, (st.sel === i ? "fsoft" : "box") + " hot", { rx: 10 }), "n" + i) + G.t(x + tw / 2, 39, G.fmt(+d), st.sel === i ? "a big" : "big", "middle", np);
      if (done) h += G.he(x + tw / 2, 76, "סכום ספרות " + sum, sum % div ? "w" : "ok", "middle");
    });
    if (st.sel === null) { h += G.he(620, 120, "בחר מספר, ואז לחץ על כל ספרה כדי לשפוך אותה כעיגולים", "m", "right"); return { svg: h, height: 136 }; }
    const d = [...N[st.sel]], pr = st.pour[st.sel], dw = 60, dx = 320 - d.length * dw / 2;
    d.forEach((c, k) => {
      const x = dx + k * dw;
      h += pr[k] ? G.rect(x + 4, 96, dw - 8, 46, "ghost", { rx: 8 }) + G.t(x + dw / 2, 127, c, "m") : G.tap(G.rect(x + 4, 96, dw - 8, 46, "box hot", { rx: 8 }), "d" + k) + G.t(x + dw / 2, 128, c, "big", "middle", np);
    });
    const used = d.filter((c, k) => pr[k]).map(Number), sum = used.reduce((a, b) => a + b, 0), s = 24;
    h += G.he(620, 172, "שורות של " + div, "m", "right");
    const A = arr(320 - div * s / 2, 160, sum, div, s); h += A.h;
    if (!sum) h += G.rect(320 - div * s / 2 - 3, 157, div * s + 6, s + 6, "ghost", { rx: 6 });
    const y = 160 + Math.max(s, A.ht) + 38;
    if (used.length) {
      h += G.t(320, y, (used.length > 1 ? used.join(" + ") + " = " : "") + sum + " = " + Math.floor(sum / div) + "·" + div + " + " + sum % div, "big");
      h += G.he(320, y + 26, (pr.every(Boolean) ? "כל הספרות בפנים: " : "") + "שארית " + sum % div, pr.every(Boolean) ? (sum % div ? "w" : "ok") : "m", "middle");
    }
    return { svg: h, height: y + 40 };
  }

  Boards["alg-rem"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const dig = !!cfg.digits;
      const track = () => { if (cfg.sum) { const t = cfg.panels.reduce((a, p, i) => a + count(st, cfg, i) % p.div, 0); st.best = Math.max(st.best === null ? 0 : st.best, t); } };
      const render = () => {
        const d = dig ? drawDigits(st, cfg) : draw(st, cfg), tools = [];
        if (!dig) cfg.vars.forEach((v, i) => tools.push({ label: `<span dir="ltr">${v.name} − 1</span>`, op: "dec", n: i, disabled: st.v[i] <= v.lo }, { label: `<span dir="ltr">${v.name} + 1</span>`, op: "inc", n: i, disabled: st.v[i] >= v.hi }));
        tools.push({ label: "↺ מההתחלה", op: "reset", quiet: true });
        ui.set({ height: d.height, svg: d.svg, tools, msg: st.msg });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "עיגולים בשורות לפתרון השאלה",
        onTap(key) {
          if (key[0] === "n") st.sel = +key.slice(1); else if (key[0] === "d") st.pour[st.sel][+key.slice(1)] = true;
          render();
        },
        onDrag(key, pt) {
          const i = +key.slice(1), v = cfg.vars[i];
          st.v[i] = Math.max(v.lo, Math.min(v.hi, Math.round(v.lo + (pt.x - SX0) / (SX1 - SX0) * (v.hi - v.lo)))); track(); render();
        },
        onOp(op, el) {
          if (op === "reset") kit.reset(st, fresh(cfg));
          else { const i = +el.dataset.n, v = cfg.vars[i]; st.v[i] = Math.max(v.lo, Math.min(v.hi, st.v[i] + (op === "inc" ? 1 : -1))); }
          if (!dig) track(); render();
        },
      });
      if (!dig) track();
      render();
    },

    compare(host, cfg, chosen, correct) {
      const C = cfg.cmp; if (!C || chosen === correct || chosen === undefined || isNaN(chosen) || !C[chosen]) { host.innerHTML = ""; return; }
      let h = "", y = 24;
      [[chosen, "chosen"], [correct, "correct"]].forEach(([j, kind]) => {
        const row = C[j], n = row.arrs.length, sw = 600 / n; let mh = 0;
        h += kit.rowTitle(620, y, kind); y += 16;
        row.arrs.forEach((a, i) => {
          const rows = a.raw ? 1 : Math.ceil(a.n / a.div), wide = a.raw ? a.n : a.div, s = Math.min(18, sw * .8 / wide, 96 / rows), cx = 620 - sw * (i + .5);
          const A = arr(cx - wide * s / 2, y, a.n, a.div, s, { take: a.take, raw: a.raw }); h += A.h; mh = Math.max(mh, A.ht);
          a._cx = cx;
        });
        row.arrs.forEach(a => { h += G.he(a._cx, y + mh + 26, a.label, "b", "middle"); delete a._cx; });
        y += mh + 26 + 26; h += G.he(620, y, row.cap, "m", "right"); y += 44;
      });
      kit.compare(host, { height: y - 30, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה בשורות" });
    },
  };
})();
