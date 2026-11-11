/* board-prb-road.js — motion board: a road with movers and a draggable clock.
   mode "line" (default): cfg { type:"prb-road", len | lens:[..]+lenDef, tick?, unit?, vUnit?, tUnit:"h"|"s", den (clock steps per time unit), tMax?, sTick?, clock0? (minutes),
       movers:[{name, cls:"a"|"blue", v | vk (× the chosen v) | legs:[{d,v,dir}] | halves:[v1,v2], start?, end? (starts at the far end), dir?, dep?, body? (train length)}],
       status?:"chase"|"toward"|"avg"|"train", words?, vars?{name,v,min,max}, bridge?[a,b], bridgeLabel?, legNote?, speedNote?, tip,
       compare:{kind:"scene", den, ks:[..], caps:[..]} | {kind:"bar", vals, caps, ref?} | {kind:"split", total, vals, caps, names}, notes }
   mode "cross": two movers leave one point, north and east; shows the right triangle.  cfg { mode:"cross", vn, ve, scale, den, tMax, ... } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, X0 = 50, X1 = 590, RY = 128;
  const dur = t => { const m = Math.round(t * 60), h = Math.floor(m / 60), mm = m % 60, hs = h === 1 ? "שעה" : h === 2 ? "שעתיים" : h + " שעות"; return h === 0 ? mm + " דקות" : mm === 0 ? hs : hs + " ו־" + mm + " דקות"; };
  const clock = mins => { mins = Math.round(mins); return Math.floor(mins / 60) + ":" + String(mins % 60).padStart(2, "0"); };
  const fresh = cfg => ({ init: 1, k: 0, v: cfg.vars ? cfg.vars.v : null, len: cfg.lens ? cfg.lens[cfg.lenDef || 0] : null });
  function scen(st, cfg) {
    const len = st.len || cfg.len;
    const movers = (cfg.movers || []).map(m => { const o = Object.assign({ start: 0, dir: 1, dep: 0 }, m); if (m.vk) o.v = m.vk * st.v; if (m.end) o.start = len; if (m.halves) o.legs = m.halves.map(v => ({ d: len / 2, v, dir: 1 })); return o; });
    const tMax = cfg.tMax || movers[0].legs.reduce((s, l) => s + l.d / l.v, 0);
    return { len, movers, tMax, tick: cfg.tick || len / 6, unit: cfg.unit || 'ק"מ', vUnit: cfg.vUnit || 'קמ"ש' };
  }
  function trav(m, t, len) {
    const tt = Math.max(0, t - m.dep);
    if (m.legs) { let left = tt, d = 0; for (const lg of m.legs) { const need = lg.d / lg.v; if (left >= need - 1e-9) { d += lg.d; left -= need; } else { d += lg.v * left; break; } } return d; }
    return Math.min(m.v * tt, m.dir > 0 ? len - m.start : m.start);
  }
  function pos(m, t, len) {
    if (!m.legs) return m.start + m.dir * trav(m, t, len);
    let d = trav(m, t, len), p = m.start; for (const lg of m.legs) { const s = Math.min(d, lg.d); p += lg.dir * s; d -= s; if (d <= 1e-9) break; } return p;
  }
  const two = cfg => cfg.movers.length > 1 || !!cfg.bridge;

  function scene(S, t, ry, cfg) {
    const X = v => X0 + (X1 - X0) * v / S.len; let h = G.rect(X0, ry, X1 - X0, 14, "bg", { rx: 3 });
    if (cfg.bridge) { const [a, b] = cfg.bridge; h += G.rect(X(a), ry, X(b) - X(a), 14, "fblue-soft") + G.he((X(a) + X(b)) / 2, ry + 60, cfg.bridgeLabel, "blue"); }
    for (let v = 0; v <= S.len + 1e-9; v += S.tick) h += G.line(X(v), ry + 14, X(v), ry + 20, "mut") + G.t(X(v), ry + 36, pf(v), "m");
    if (cfg.legNote) h += G.he(320, ry + 62, cfg.legNote, "m");
    if (cfg.movers[0].halves) h += G.line(X(S.len / 2), ry - 10, X(S.len / 2), ry + 22, "dash");
    S.movers.forEach((m, i) => {
      const p = pos(m, t, S.len), x = X(p), d = trav(m, t, S.len), wait = m.dep > 0 && t <= m.dep + 1e-9, up = i === 0, fill = m.cls === "a" ? "fa" : "fblue", stroke = m.cls === "a" ? "sa" : "sblue";
      if (m.body) {
        const xa = X(p - m.body);
        h += G.rect(xa, ry - 34, x - xa, 26, fill, { rx: 5 }) + G.he((xa + x) / 2, ry - 16, m.name, "inv") + G.line(x, ry - 8, x, ry, stroke);
        h += G.he(Math.max(120, Math.min(520, (xa + x) / 2)), ry - 44, `החזית עברה ${pf(d)} ${S.unit}`, m.cls, "middle");
        return;
      }
      if (m.legs) { let dd = d, pp = m.start; m.legs.forEach((lg, j) => { const s = Math.min(dd, lg.d); if (s > 0) h += G.line(X(pp), ry + 4 + j * 6, X(pp + lg.dir * s), ry + 4 + j * 6, j ? "sblue" : "sa"); pp += lg.dir * s; dd -= s; }); }
      else if (d > 0) h += G.line(X(m.start), ry + (up ? 4 : 10), x, ry + (up ? 4 : 10), stroke);
      const cy = up ? ry - 28 : ry + 58, bx = Math.max(31, Math.min(609, x));
      h += up ? G.line(x, cy + 11, x, ry, "thin") : G.line(x, ry + 14, x, ry + 21, stroke);
      h += G.rect(bx - 27, cy - 11, 54, 22, wait ? "ghost" : fill, { rx: 7 }) + G.he(bx, cy + 5, m.name, wait ? "m" : "inv");
      h += G.he(Math.max(60, Math.min(580, x)), up ? cy - 19 : cy + 30, wait ? "מחכה" : `${pf(d)} ${S.unit}`, wait ? "m" : m.cls, "middle");
    });
    return h;
  }

  function status(S, t, cfg) {
    const W = cfg.words || {}, P = S.movers.map(m => pos(m, t, S.len));
    if (cfg.status === "chase") { const g = P[0] - P[1], out = t > S.movers[1].dep + 1e-9; return Math.abs(g) < 1e-9 && out ? [W.meet, "ok"] : g < 0 ? [W.past, "w"] : [`הרווח: ${pf(g)} ${S.unit}`, "w"]; }
    if (cfg.status === "toward") { const g = P[1] - P[0]; return Math.abs(g) < 1e-9 ? ["נפגשו!", "ok"] : g < 0 ? ["כבר חלפו זה על פני זה", "w"] : [`המרחק ביניהם: ${pf(g)} ${S.unit}`, "w"]; }
    if (cfg.status === "train") { const m = S.movers[0], tail = P[0] - m.body, e = cfg.bridge[1]; return tail >= e - 1e-9 ? [Math.abs(tail - e) < 1e-9 ? "הסוף יצא מהגשר בדיוק עכשיו" : "כל הרכבת כבר אחרי הגשר", "ok"] : P[0] >= e - 1e-9 ? [`החזית יצאה, ${pf(e - tail)} ${S.unit} של רכבת עוד על הגשר`, "w"] : ["החזית עוד על הגשר", "w"]; }
    return null;
  }

  function drawLine(st, cfg) {
    const S = scen(st, cfg), t = st.k / cfg.den, SY = RY + (two(cfg) ? 130 : 104), xs = v => X0 + (X1 - X0) * v / S.tMax;
    let h = G.he(30, 24, cfg.clock0 != null ? `השעה ${clock(cfg.clock0 + t * 60)}` : cfg.tUnit === "s" ? `זמן: ${pf(t)} שניות` : `זמן: ${dur(t)}`, "b", "left");
    const s = status(S, t, cfg);
    if (s) h += G.he(612, 24, s[0], s[1], "right");
    if (cfg.status === "avg") {
      const d = trav(S.movers[0], t, S.len);
      h += G.he(612, 24, `דרך עד כה: ${pf(d)} ${S.unit}`, "b", "right");
      if (t > 0) h += G.he(612, 48, `ממוצע עד כה: ${ltr(pf(d) + " ÷ " + pf(t) + " = " + pf(d / t))} ${S.vUnit}`, "a", "right");
    } else h += G.he(30, 48, cfg.speedNote || S.movers.map(m => `${m.name}: ${pf(m.v)} ${S.vUnit}`).join(" · "), "m", "left");
    h += scene(S, t, RY, cfg);
    h += G.line(X0, SY, X1, SY, "ink");
    const stp = cfg.sTick || 1;
    for (let v = 0; v <= S.tMax + 1e-9; v += stp) h += G.line(xs(v), SY - 6, xs(v), SY + 6, "thin") + G.t(xs(v), SY + 36, cfg.clock0 != null ? clock(cfg.clock0 + v * 60) : pf(v), "m");
    h += G.knob(xs(t), SY, "t", 15);
    return { svg: h, height: SY + 48 };
  }

  const OX = 70, OY = 222, CSY = 268;
  function drawCross(st, cfg) {
    const t = st.k / cfg.den, dn = cfg.vn * t, de = cfg.ve * t, s = cfg.scale, nx = OX, ny = OY - dn * s, ex = OX + de * s, xs = v => X0 + (X1 - X0) * v / cfg.tMax;
    let h = G.line(OX, OY, OX, OY - cfg.vn * cfg.tMax * s - 8, "mut") + G.line(OX, OY, OX + cfg.ve * cfg.tMax * s + 8, OY, "mut");
    h += G.he(OX, OY - cfg.vn * cfg.tMax * s - 16, "צפון", "m") + G.he(OX + cfg.ve * cfg.tMax * s + 16, OY + 5, "מזרח", "m", "left");
    if (t > 0) {
      h += G.rightMark(OX, OY, 1, 0, 0, -1, 10) + G.line(OX, OY, nx, ny, "sa") + G.line(OX, OY, ex, OY, "sblue") + G.line(nx, ny, ex, OY, "dash");
      h += G.t(OX - 16, (OY + ny) / 2 + 5, pf(dn), "a", "end") + G.t((OX + ex) / 2, OY + 22, pf(de), "blue");
      h += G.t((nx + ex) / 2 + 12, (ny + OY) / 2 - 6, pf(Math.sqrt(dn * dn + de * de)), "ok", "start");
    }
    h += G.circle(OX, OY, 4, "dot") + G.circle(nx, ny, 9, "fa") + G.circle(ex, OY, 9, "fblue");
    const d2 = dn * dn + de * de, d = Math.sqrt(d2);
    h += G.he(612, 34, `זמן: ${dur(t)}`, "b", "right") + G.he(612, 64, `צפונה: ${pf(dn)} ק"מ`, "a", "right") + G.he(612, 90, `מזרחה: ${pf(de)} ק"מ`, "blue", "right");
    if (t > 0) h += G.he(612, 122, `הקו הישר: ${ltr(pf(dn) + "² + " + pf(de) + "² = " + pf(d2))}`, "m", "right") + G.he(612, 148, `המרחק ביניהם: ${ltr("√" + pf(d2) + " = " + pf(d))} ק"מ`, "ok", "right");
    h += G.line(X0, CSY, X1, CSY, "ink");
    for (let k = 0; k <= cfg.tMax * cfg.den; k++) h += G.line(xs(k / cfg.den), CSY - 6, xs(k / cfg.den), CSY + 6, "thin") + G.t(xs(k / cfg.den), CSY + 36, Math.round(k / cfg.den * 60), "m");
    h += G.he(612, CSY + 58, "דקות", "m", "right");
    h += G.knob(xs(t), CSY, "t", 15);
    return { svg: h, height: CSY + 66 };
  }

  function bars(rows, ref, split) {
    const R = 610, L = 30, max = split ? split.total : Math.max(ref || 0, ...rows.map(r => r.len)) * 1.02, u = (R - L) / max; let h = "";
    rows.forEach((r, i) => {
      const y = 30 + i * 96;
      h += kit.rowTitle(R, y - 10, r.kind);
      if (split) {
        const a = r.len * u, np = { "pointer-events": "none" };
        h += G.rect(L, y, a, 40, "fa") + G.rect(L + a, y, R - L - a, 40, "fblue");
        h += G.he(L + a / 2, y + 26, `${split.names[0]} ${pf(r.len)}`, "inv", "middle", np) + G.he(L + a + (R - L - a) / 2, y + 26, `${split.names[1]} ${pf(split.total - r.len)}`, "inv", "middle", np);
      } else {
        h += G.rect(L, y, R - L, 40, "bg", { rx: 4 }) + G.rect(L, y, r.len * u, 40, r.kind === "chosen" ? "fwarn" : "fok");
        if (ref) h += G.line(L + ref * u, y - 6, L + ref * u, y + 46, "dash");
      }
      h += G.he(R, y + 62, r.cap, "m", "right");
    });
    return h;
  }

  Boards["prb-road"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const cross = cfg.mode === "cross";
      const render = () => {
        const d = cross ? drawCross(st, cfg) : drawLine(st, cfg), tools = [], V = cfg.vars;
        if (V) tools.push({ label: `${V.name}: מהר יותר`, op: "v+", disabled: st.v >= V.max }, { label: `${V.name}: לאט יותר`, op: "v-", disabled: st.v <= V.min });
        if (cfg.lens) cfg.lens.forEach(n => tools.push({ label: `דרך של ${pf(n)} ק"מ`, op: "len", n, active: st.len === n }));
        tools.push({ label: "↺ מההתחלה", op: "reset", quiet: true });
        ui.set({ height: d.height, svg: d.svg, tools });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "דרך עם שעון נגרר",
        dragFrom: pt => pt.y > (cross ? CSY : RY + (two(cfg) ? 130 : 104)) - 26 ? "t" : null,
        onDrag(key, pt) { const tm = cross ? cfg.tMax : scen(st, cfg).tMax; st.k = Math.max(0, Math.min(Math.round(tm * cfg.den), Math.round((pt.x - X0) / (X1 - X0) * tm * cfg.den))); render(); },
        onOp(op, el) {
          if (op === "reset") kit.reset(st, fresh(cfg));
          else if (op === "v+") { st.v++; st.k = 0; } else if (op === "v-") { st.v--; st.k = 0; }
          else if (op === "len") { st.len = +el.dataset.n; st.k = 0; }
          render();
        },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      const C = cfg.compare; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const note = (cfg.notes || {})[chosen], pair = [[chosen, "chosen"], [correct, "correct"]];
      if (C.kind === "scene") {
        const S = scen(fresh(cfg), cfg), rh = cfg.bridge ? 188 : two(cfg) ? 214 : 170; let h = "";
        pair.forEach(([j, kind], i) => { const y = i * rh; h += kit.rowTitle(612, y + 22, kind) + scene(S, C.ks[j] / C.den, y + 96, cfg) + G.he(612, y + rh - 8, C.caps[j], "m", "right"); });
        return kit.compare(host, { height: rh * 2 + 4, svg: h, note, title: "ככה זה נראה על הדרך" });
      }
      const rows = pair.map(([j, kind]) => ({ kind, len: C.vals[j], cap: C.caps[j] }));
      kit.compare(host, { height: 208, svg: bars(rows, C.ref, C.kind === "split" ? C : null), note, title: C.title || "ככה זה נראה על הדרך" });
    },
  };
})();
