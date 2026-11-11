/* board-prb-comb-pick.js — "pick into slots" board for counting questions (multiplication principle).
   The learner taps chips from a pool into slots; under every filled slot the board shows how many options there were
   at that step, and multiplies them. Several cases ("או") are summed / subtracted; an unordered pick can be divided
   by the number of inner orderings.
   cfg: { type:"prb-comb-pick", tip, dir?:"ltr" (slot/pool order; default right-to-left),
          cases:[{ label?, repeat?, pools:[{label, items:[str]}], slots:[{label?, pool, ban?:[itemIdx], banMsg?}] }],
          combine?:{ op:"+"|"−", label }, unordered?:{ btn, cap, label },
          compare:{ rows:{ optionIndex:{ expr:[tokens], val, cap } } }, notes:{optionIndex:text} } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, R = 610, NP = { "pointer-events": "none" };
  const isHe = s => /[֐-׿]/.test(s);
  const txt = (x, y, s, cls) => isHe(s) ? G.he(x, y, s, cls, "middle", NP) : G.t(x, y, s, cls, "middle", NP);
  const chipW = s => Math.max(40, 20 + [...s].length * 11);
  const fresh = cfg => ({ init: true, picks: cfg.cases.map(c => c.slots.map(() => null)), hist: [], un: false, warn: {}, msg: "" });
  const avail = (cs, picks, k, i) => {
    const s = cs.slots[k]; if ((s.ban || []).includes(i)) return false;
    if (!cs.repeat) for (let j = 0; j < k; j++) if (cs.slots[j].pool === s.pool && picks[j] === i) return false;
    return true;
  };
  const count = (cs, picks, k) => cs.pools[cs.slots[k].pool].items.filter((_, i) => avail(cs, picks, k, i)).length;
  const nextSlot = (cs, picks, p) => cs.slots.findIndex((s, k) => s.pool === p && picks[k] === null);
  const full = picks => picks.every(v => v !== null);
  const prod = (cs, picks) => cs.slots.reduce((a, _, k) => a * count(cs, picks, k), 1);
  const perms = a => a.length < 2 ? [a] : a.flatMap((v, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [v, ...p]));
  const fact = n => n < 2 ? 1 : n * fact(n - 1);

  function layout(cs, dirLtr) {
    const GAP = 6, blocks = []; let cur = R;
    cs.pools.forEach(p => {
      const ws = p.items.map(chipW), w = ws.reduce((a, b) => a + b, 0) + GAP * (ws.length - 1), x0 = cur - w, xs = []; let x = dirLtr ? x0 : cur;
      ws.forEach(cw => { if (dirLtr) { xs.push(x); x += cw + GAP; } else { x -= cw; xs.push(x); x -= GAP; } });
      blocks.push({ x0, w, ws, xs, maxW: Math.max(...ws) }); cur = x0 - 28;
    });
    const aligned = cs.slots.length === cs.pools.length && cs.slots.every((s, k) => s.pool === k), slots = [];
    if (aligned) cs.slots.forEach((s, k) => { const b = blocks[k], w = Math.max(56, b.maxW + 4); slots.push({ x: b.x0 + b.w / 2 - w / 2, w }); });
    else {
      const ws = cs.slots.map(s => Math.max(56, blocks[s.pool].maxW + 4)), tot = ws.reduce((a, b) => a + b, 0) + 26 * (ws.length - 1); let x = dirLtr ? R - tot : R;
      ws.forEach(w => { if (dirLtr) { slots.push({ x, w }); x += w + 26; } else { x -= w; slots.push({ x, w }); x -= 26; } });
    }
    return { blocks, slots };
  }

  function draw(st, cfg) {
    const dirLtr = cfg.dir === "ltr"; let h = "", y = 4;
    cfg.cases.forEach((cs, c) => {
      const picks = st.picks[c], L = layout(cs, dirLtr), done = full(picks);
      if (cs.label) { h += G.he(R, y + 18, cs.label, "b", "right"); y += 26; }
      cs.pools.forEach((p, pi) => {
        const b = L.blocks[pi], k = nextSlot(cs, picks, pi);
        h += G.he(b.x0 + b.w, y + 14, p.label, "m", "right");
        p.items.forEach((it, i) => {
          const used = !cs.repeat && cs.slots.some((s, j) => s.pool === pi && picks[j] === i), warned = st.warn[c + "_" + pi + "_" + i] && k >= 0 && (cs.slots[k].ban || []).includes(i);
          const cls = used ? "ghost" : warned ? "fwarn hot" : k < 0 ? "box" : "box hot";
          h += G.tap(G.rect(b.xs[i], y + 22, b.ws[i], 38, cls, { rx: 19 }), "k" + c + "_" + pi + "_" + i) + txt(b.xs[i] + b.ws[i] / 2, y + 47, it, used ? "m" : "b");
        });
      });
      cs.slots.forEach((s, k) => {
        const sl = L.slots[k], v = picks[k], cx = sl.x + sl.w / 2;
        h += G.rect(sl.x, y + 74, sl.w, 42, v === null ? "bg" : "fsoft", { rx: 6 });
        if (v !== null) h += txt(cx, y + 101, cs.pools[s.pool].items[v], "b") + G.t(cx, y + 142, String(count(cs, picks, k)), "a big");
        else if (s.label) h += txt(cx, y + 100, s.label, "m");
        if (k > 0 && v !== null && picks[k - 1] !== null) { const pv = L.slots[k - 1]; h += G.t((pv.x + pv.w / 2 + cx) / 2, y + 141, "×", "a"); }
      });
      y += 150;
      if (done) h += G.he(R, y + 16, "אפשרויות: " + ltr(cs.slots.map((_, k) => count(cs, picks, k)).join(" × ") + " = " + pf(prod(cs, picks))), "a", "right");
      else h += G.he(R, y + 16, picks.some(v => v !== null) ? "המספר מתחת לכל תא: כמה אפשרויות היו בשלב הזה" : "לחץ על פריט כדי להכניס אותו לתא", "m", "right");
      y += 30;
      if (c === 0 && cfg.unordered && st.un && done) {
        const names = picks.map((v, k) => cs.pools[cs.slots[k].pool].items[v]), ps = perms(names), w = Math.min(92, 580 / ps.length - 6);
        h += G.he(R, y + 16, cfg.unordered.cap, "m", "right");
        ps.forEach((p, i) => { const x = R - (i + 1) * (w + 6) + 6; h += G.rect(x, y + 26, w, 32, "fblue-soft", { rx: 6 }) + G.he(x + w / 2, y + 48, p.join(" "), "", "middle"); });
        h += G.he(R, y + 84, cfg.unordered.label + ": " + ltr(pf(prod(cs, picks)) + " ÷ " + ps.length + " = " + pf(prod(cs, picks) / ps.length)), "a", "right");
        y += 100;
      }
    });
    if (cfg.combine && st.picks.every(full)) {
      const vs = cfg.cases.map((cs, c) => prod(cs, st.picks[c])), tot = cfg.combine.op === "+" ? vs.reduce((a, b) => a + b, 0) : vs[0] - vs.slice(1).reduce((a, b) => a + b, 0);
      h += G.line(30, y, R, y, "dash") + G.he(R, y + 26, cfg.combine.label + ": " + ltr(vs.map(pf).join(" " + cfg.combine.op + " ") + " = " + pf(tot)), "a", "right"); y += 34;
    }
    return { svg: h, height: y + 6 };
  }

  Boards["prb-comb-pick"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const render = () => {
        const d = draw(st, cfg);
        ui.set({
          height: d.height, svg: d.svg, msg: st.msg,
          tools: [
            ...(cfg.unordered ? [{ label: cfg.unordered.btn, op: "un", active: st.un, disabled: !full(st.picks[0]) }] : []),
            { label: "בטל בחירה אחרונה", op: "undo", quiet: true, disabled: !st.hist.length }, { label: "↺ מההתחלה", op: "reset", quiet: true },
          ],
        });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "תאים ומאגר לספירת אפשרויות",
        onTap(key) {
          const [c, p, i] = key.slice(1).split("_").map(Number), cs = cfg.cases[c], picks = st.picks[c], k = nextSlot(cs, picks, p);
          st.msg = "";
          if (k < 0) { render(); return; }
          if ((cs.slots[k].ban || []).includes(i)) { st.warn[key.slice(1)] = 1; st.msg = cs.slots[k].banMsg || ""; render(); return; }
          if (!avail(cs, picks, k, i)) { render(); return; }
          picks[k] = i; st.hist.push([c, k]); render();
        },
        onOp(op) {
          if (op === "reset") kit.reset(st, fresh(cfg));
          else if (op === "undo") { const [c, k] = st.hist.pop(); st.picks[c][k] = null; st.msg = ""; if (!full(st.picks[0])) st.un = false; }
          else if (op === "un") st.un = !st.un;
          render();
        },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen) || !C.rows[chosen]) { host.innerHTML = ""; return; }
      let h = "";
      [[C.rows[chosen], "chosen", "fwarn", "w"], [C.rows[correct], "correct", "fok-soft", "ok"]].forEach(([r, kind, box, tc], i) => {
        const y = 28 + i * 112, toks = [...r.expr, "=", String(r.val)], ws = toks.map(t => /^[\d,]+$/.test(t) ? Math.max(46, 22 + t.length * 13) : 26);
        let x = R - ws.reduce((a, b) => a + b, 0) - 4 * (toks.length - 1);
        h += kit.rowTitle(R, y - 6, kind);
        toks.forEach((t, j) => {
          const num = /^[\d,]+$/.test(t), last = j === toks.length - 1;
          if (num && !last) h += G.rect(x, y + 6, ws[j], 40, box, { rx: 6 });
          h += G.t(x + ws[j] / 2, y + 33, t, last ? tc + " big" : num ? "b" : "big"); x += ws[j] + 4;
        });
        h += G.he(R, y + 72, r.cap, "m", "right");
      });
      kit.compare(host, { height: 236, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה בתאים" });
    },
  };
})();
