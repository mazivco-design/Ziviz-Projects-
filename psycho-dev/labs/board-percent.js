/* board-percent.js — bar board for percent questions (REFERENCE IMPLEMENTATION for board authors).
   Split the bar, color parts, remove/add the colored part to get a new bar underneath.
   cfg: { type:"percent", start:[{total,label}], tip, unit?, splits?[4,5,10], labels?[..per bar index], ref?(false hides the
          "% of first bar" marks), unknown?{pct,val} (whole is hidden until the given part is colored), alt?{total,label,btn,msg},
          compare:{kind:"part"|"pct"|"cut"|"cutpct"|"value", base, vals:[one per option], target?, ref?{label,val}, label?}, notes:{optionIndex: text} } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, R = 610, X0 = 30, H = 46, ROW = 112, TOP = 36;
  const cnt = a => (a || []).reduce((s, v) => s + (v || 0), 0);
  const fresh = cfg => ({ bars: cfg.start.map(b => ({ total: b.total, label: b.label, split: 0, sel: [] })), revealed: !cfg.unknown, msg: "" });
  const unit = cfg => cfg.unit ? " " + cfg.unit : "";

  function draw(st, cfg) {
    const bars = st.bars, first = bars[0].total, max = Math.max(...bars.map(b => b.total), first * 1.3), u = (R - X0) / max;
    let h = "";
    bars.forEach((b, i) => {
      const y = TOP + i * ROW, w = b.total * u, x0 = R - w, last = i === bars.length - 1;
      h += G.he(R, y - 12, b.label + ": " + (st.revealed ? pf(b.total) + unit(cfg) : "?"), "b", "right");
      if (i > 0 && cfg.ref !== false) {
        h += G.he(X0, y - 12, ltr(pf(b.total / first * 100) + "%") + " מ" + bars[0].label, "m", "left");
        const rx = R - first * u; h += G.line(rx, y - 6, rx, y + H + 6, "dash");
      }
      h += G.rect(x0, y, w, H, "bg", { rx: 4 });
      if (b.split) {
        const cw = w / b.split, cv = b.total / b.split, np = { "pointer-events": "none" };
        for (let k = 0; k < b.split; k++) {
          const cx = R - (k + 1) * cw, s = b.sel[k] || 0;
          const cls = !last && s && b.op === "cut" ? "ghost" : !last && s && b.op === "add" ? "fok" : s === 1 ? "fa" : "box";
          const cell = G.rect(cx, y, cw, H, cls + (last ? " hot" : ""), s === .5 ? { style: "fill:url(#brd-half)" } : {});
          h += last ? G.tap(cell, "c" + k) : cell;
          if (s === .5) h += G.line(cx + cw / 2, y, cx + cw / 2, y + H, "thin");
          if (cw >= 44 && st.revealed && s === .5) h += G.t(cx + cw * .75, y + 29, pf(cv / 2), "inv", "middle", np) + G.t(cx + cw * .25, y + 29, pf(cv / 2), "m", "middle", np);
          if (cw >= 30 && st.revealed && s !== .5) h += G.t(cx + cw / 2, y + 29, pf(cv), s === 1 && (last || b.op === "add") ? "inv" : "m", "middle", np);
        }
      }
      const c = cnt(b.sel);
      if (c > 0 && b.split) {
        const val = st.revealed ? pf(b.total * c / b.split) + unit(cfg) : "?", verb = last ? "צבוע" : b.op === "cut" ? "הורדנו" : "הוספנו";
        h += G.he(R, y + H + 22, verb + ": " + ltr(pf(c / b.split * 100) + "% = " + val), last ? "a" : b.op === "cut" ? "w" : "ok", "right");
      } else if (last && !b.split) h += G.he(R, y + H + 22, "חלק את הפס כדי לצבוע חלקים ממנו", "m", "right");
      else if (last) h += G.he(R, y + H + 22, "לחץ על משבצות כדי לצבוע. לחיצה שנייה: חצי משבצת", "m", "right");
    });
    return { svg: h, height: TOP + bars.length * ROW - 14 };
  }

  Boards.percent = {
    mount(host, st, cfg) {
      if (!st.bars) Object.assign(st, fresh(cfg));
      const L = () => st.bars[st.bars.length - 1];
      const render = () => {
        const d = draw(st, cfg), b = L(), can = cnt(b.sel) > 0 && st.revealed && st.bars.length < 4;
        ui.set({
          height: d.height, svg: d.svg, msg: st.msg,
          tools: [
            ...(cfg.splits || [4, 5, 10]).map(n => ({ label: "חלק ל־" + n, op: "split", n, active: b.split === n })),
            { label: "הורד את הצבוע ↓", op: "cut", disabled: !can }, { label: "הוסף את הצבוע ↓", op: "add", disabled: !can },
            ...(cfg.alt && !st.alt ? [{ label: cfg.alt.btn, op: "alt" }] : []),
            ...(st.bars.length > cfg.start.length ? [{ label: "בטל פס אחרון", op: "undo", quiet: true }] : []),
            { label: "↺ מההתחלה", op: "reset", quiet: true },
          ],
        });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "פס לפתרון השאלה",
        onTap(key) {
          const b = L(), k = +key.slice(1); b.sel[k] = b.sel[k] === 1 ? .5 : b.sel[k] === .5 ? 0 : 1;
          if (!st.revealed && cfg.unknown && Math.abs(cnt(b.sel) / b.split * 100 - cfg.unknown.pct) < 1e-6) {
            st.revealed = true;
            st.msg = `צבעת ${pf(cfg.unknown.pct)}%, ולפי השאלה החלק הזה שווה ${pf(cfg.unknown.val)}. לכן כל משבצת שווה ${pf(b.total / b.split)}, והפס כולו ${pf(b.total)}. עכשיו אפשר לנקות ולצבוע את מה שמבקשים.`;
          }
          render();
        },
        onOp(op, el) {
          const b = L();
          if (op === "split") { b.split = +el.dataset.n; b.sel = []; }
          else if (op === "cut" || op === "add") {
            const part = b.total * cnt(b.sel) / b.split; b.op = op;
            st.bars.push({ total: op === "cut" ? b.total - part : b.total + part, label: (cfg.labels || [])[st.bars.length] || "הפס החדש", split: 0, sel: [] });
          }
          else if (op === "undo") { st.bars.pop(); L().op = null; }
          else if (op === "reset") kit.reset(st, fresh(cfg));
          else if (op === "alt") { st.alt = true; st.bars = [{ total: cfg.alt.total, label: cfg.alt.label, split: 0, sel: [] }]; st.msg = cfg.alt.msg || ""; }
          render();
        },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const B = C.base, un = unit(cfg);
      const row = j => {
        const v = C.vals[j];
        if (C.kind === "part") return { len: B, fill: [0, v], cap: `${pf(v)}${un} הם ${ltr(pf(v / B * 100) + "%")} מ־${pf(B)}` };
        if (C.kind === "pct") return { len: B, fill: [0, B * v / 100], cap: `${ltr(pf(v) + "%")} מ־${pf(B)} הם ${pf(B * v / 100)}${un}` };
        if (C.kind === "cut") return { len: B, fill: [v, B], cap: `מ־${pf(B)} ל־${pf(v)}: ירידה של ${pf(B - v)}${un}, שהם ${ltr(pf((B - v) / B * 100) + "%")} מ־${pf(B)}` };
        if (C.kind === "cutpct") { const x = B * v / 100; return { len: B, fill: [B - x, B], ref: C.target, cap: `ירידה של ${ltr(pf(v) + "%")} מ־${pf(B)} היא ${pf(x)}, ומגיעים ל־${pf(B - x)}` }; }
        return { len: v, fill: [0, v], ref: C.ref.val, cap: `${C.label}: ${pf(v)}${un} · ${C.ref.label}: ${pf(C.ref.val)}${un}` };
      };
      const rows = [[row(chosen), "chosen", "fwarn"], [row(correct), "correct", "fok"]];
      const max = Math.max(...rows.map(r => Math.max(r[0].len, r[0].ref || 0))), u = (R - X0) / max;
      let h = "";
      rows.forEach(([r, kind, fc], i) => {
        const y = 30 + i * 96, w = r.len * u;
        h += kit.rowTitle(R, y - 10, kind) + G.rect(R - w, y, w, 40, "bg", { rx: 4 });
        h += G.rect(R - r.fill[1] * u, y, (r.fill[1] - r.fill[0]) * u, 40, fc);
        if (r.ref) { const rx = R - r.ref * u; h += G.line(rx, y - 6, rx, y + 46, "dash"); }
        h += G.he(R, y + 62, r.cap, "m", "right");
      });
      kit.compare(host, { height: 208, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה על הפס" });
    },
  };
})();
