/* board-alg-ex-squares.js — area models for the short-multiplication formulas, drawn to scale.
   kind "sum":  a square of side x+y (cfg.sum) cut at a draggable point: x², y² and two xy rectangles, all computed live.
   kind "diff": a square a² with the square b² removed from its corner; "סדר כמלבן" moves one piece and turns the
                colored L-shape into the rectangle (a−b)(a+b). With cfg.sum the junction a|b is draggable; with cfg.a/cfg.b it is fixed.
   cfg: { type:"alg-ex-squares", kind, tip, names:["x","y"], sum?, start?, step?, min?, max?, a?, b?, target? (xy for "sum", a²−b² for "diff"),
          cmp:{ kind:"regions", x, fills:[[region names] per option], extra?:[n extra rectangles per option], caps:[..] }
             | { kind:"rects", unit:"px per 1", rects:[[w,h] per option], caps:[..] },  notes:{ optionIndex: text } } */
(function () {
  "use strict";
  const { kit } = Boards, { G, ltr, pf } = kit, X0 = 40, Y0 = 46, S = 240, PX = 318, NP = { "pointer-events": "none" };
  const fresh = cfg => ({ init: true, v: cfg.start !== undefined ? cfg.start : null, rect: false });
  // readout panel: lines of [hebrew heading, formula, class] ; a line with only heading = note
  const panel = (lines, y) => lines.map(([he, f, cls]) => { const s = (he ? G.he(612, y, he, f ? "m" : cls || "m", "right") : "") + (f ? G.t(PX, y, f, cls || "b", "start") : ""); y += 32; return s; }).join("");

  function drawSum(st, cfg) {
    const [nx, ny] = cfg.names, T = cfg.sum, u = S / T, x = st.v, y = T - x, c = X0 + x * u, r = Y0 + x * u; let h = "";
    h += G.rect(X0, Y0, x * u, x * u, "fa") + G.rect(c, r, y * u, y * u, "fa") + G.rect(c, Y0, y * u, x * u, "fblue-soft") + G.rect(X0, r, x * u, y * u, "fblue-soft");
    const lab = (cx, cy, w, hh, t, cls) => Math.min(w, hh) >= 52 ? G.t(cx, cy + 6, t, cls, "middle", NP) : "";
    h += lab(X0 + x * u / 2, Y0 + x * u / 2, x * u, x * u, pf(x * x), "inv") + lab(c + y * u / 2, r + y * u / 2, y * u, y * u, pf(y * y), "inv");
    h += lab(c + y * u / 2, Y0 + x * u / 2, y * u, x * u, pf(x * y), "blue") + lab(X0 + x * u / 2, r + y * u / 2, x * u, y * u, pf(x * y), "blue");
    h += G.rect(X0, Y0, S, S, "ink") + G.t(X0 + x * u / 2, Y0 - 24, `${nx} = ${pf(x)}`, "a") + G.t(c + y * u / 2, Y0 - 24, `${ny} = ${pf(y)}`, "a") + G.knob(c, Y0, "k", 15);
    const hit = Math.abs(x * y - cfg.target) < 1e-9;
    h += panel([["נתון", `${nx} + ${ny} = ${pf(T)}`], ["כל מלבן כחול", `${nx}${ny} = ${pf(x * y)}`, "blue"], [hit ? "הגעת ליעד ✓" : "היעד לפי השאלה: " + ltr(`${nx}${ny} = ${pf(cfg.target)}`), "", hit ? "ok" : "m"],
    ["שני הריבועים", `${nx}² + ${ny}² = ${pf(x * x + y * y)}`, "a"], ["הריבוע הגדול", `${pf(T)}² = ${pf(T * T)}`]], Y0 + 30);
    return { svg: h, height: Y0 + S + 16 };
  }

  // the L-shape a² − b² (or, rearranged, the rectangle (a−b)(a+b)) at (x0,y0), scale u
  function lshape(x0, y0, a, b, u, rect, c1 = "fsoft", c2 = "fblue-soft") {
    const A = a * u, B = b * u, D = (a - b) * u; const pe = { "pointer-events": "all" }; let h = G.rect(x0, y0, A, A, "ghost", pe) + G.rect(x0 + D, y0 + D, B, B, "ghost", pe);
    if (D > 0) h += G.rect(x0, y0, A, D, c1) + (rect ? G.rect(x0 + A, y0, B, D, c2) : G.rect(x0, y0 + D, D, B, c2));
    return h;
  }
  function drawDiff(st, cfg) {
    const fixed = cfg.a !== undefined, [na, nb] = cfg.names || [], a = fixed ? cfg.a : st.v, b = fixed ? cfg.b : cfg.sum - a, u = S / (fixed ? Math.max(a, (a + b) / 1.65) : cfg.sum), A = a * u, B = b * u;
    const wide = (a + b) * u > S + 20, la = fixed ? pf(a) : `${na} = ${pf(a)}`, lb = fixed ? pf(b) : `${nb} = ${pf(b)}`; let h = "";
    h += G.tap(G.group(lshape(X0, Y0, a, b, u, st.rect), { class: "hot" }), "mv");
    if (B >= 56) h += G.t(X0 + A - B / 2, Y0 + A - B / 2 + 6, fixed ? pf(b) + "²" : nb + "²", "m", "middle", NP);
    h += G.line(X0 + A, Y0, X0 + A + B, Y0, "dash") + G.t(X0 + A / 2, Y0 - 24, la, "a") + G.t(X0 + A + B / 2, Y0 - 24, lb, "blue");
    if (!fixed) h += G.knob(X0 + A, Y0, "k", 15); else h += G.line(X0 + A, Y0 - 6, X0 + A, Y0 + 6, "ink") + G.line(X0 + A + B, Y0 - 6, X0 + A + B, Y0 + 6, "ink");
    const d = a - b, area = a * a - b * b, lines = [];
    if (fixed) {
      lines.push(["השטח הצבוע", `${pf(a)}² − ${pf(b)}² = ${st.rect ? pf(area) : "?"}`, "a"]);
      if (st.rect) lines.push(["אותו שטח, מסודר כמלבן:", "", "m"], ["", `(${pf(a)} − ${pf(b)}) · (${pf(a)} + ${pf(b)})`], ["", `= ${pf(d)} · ${pf(a + b)} = ${pf(area)}`, "a"]);
      else lines.push(["לחץ על „סדר כמלבן” כדי להזיז את החלק הכחול", "", "m"]);
    } else {
      const hit = Math.abs(area - cfg.target) < 1e-9;
      lines.push(["נתון", `${na} + ${nb} = ${pf(cfg.sum)}`], ["השטח הצבוע", `${na}² − ${nb}² = ${pf(area)}`, "a"], [hit ? "הגעת ליעד ✓" : "היעד לפי השאלה: " + ltr(`${na}² − ${nb}² = ${pf(cfg.target)}`), "", hit ? "ok" : "m"]);
      if (st.rect) lines.push(["כמלבן", `(${na} − ${nb})(${na} + ${nb}) = ${pf(d)} · ${pf(a + b)}`]);
      lines.push(["מה ששאלו", `${na} · ${nb} = ${pf(a * b)}`, "blue"]);
    }
    h += panel(lines, Y0 + (wide ? 62 : 30));
    return { svg: h, height: Y0 + S + 16 };
  }

  Boards["alg-ex-squares"] = {
    mount(host, st, cfg) {
      if (!st.init) Object.assign(st, fresh(cfg));
      const u = S / (cfg.sum || 1), step = cfg.step || .5;
      const render = () => {
        const d = cfg.kind === "sum" ? drawSum(st, cfg) : drawDiff(st, cfg);
        ui.set({
          height: d.height, svg: d.svg, msg: "",
          tools: [...(cfg.kind === "diff" ? [{ label: st.rect ? "חזרה לצורה המקורית" : "סדר כמלבן", op: "rect", active: st.rect }] : []), { label: "↺ מההתחלה", op: "reset", quiet: true }],
        });
      };
      const ui = kit.mount(host, {
        tip: cfg.tip, aria: "מודל שטחים לנוסחאות הכפל המקוצר",
        onDrag(key, pt) { const v = Math.round((pt.x - X0) / u / step) * step; st.v = Math.max(cfg.min, Math.min(cfg.max, v)); render(); },
        onTap() { if (cfg.kind === "diff") { st.rect = !st.rect; render(); } },
        onOp(op) { if (op === "rect") st.rect = !st.rect; else kit.reset(st, fresh(cfg)); render(); },
      });
      render();
    },

    compare(host, cfg, chosen, correct) {
      const C = cfg.cmp; if (!C || chosen === correct || chosen === undefined || isNaN(chosen)) { host.innerHTML = ""; return; }
      const sides = [[chosen, "chosen", "fwarn"], [correct, "correct", "fok"]]; let h = "", H = 0;
      if (C.kind === "regions") {
        const T = cfg.sum, s = 150, u = s / T, x = C.x, y = T - x;
        sides.forEach(([j, kind, fc], i) => {
          const x0 = i ? 60 : 380, y0 = 40, f = C.fills[j], c = x0 + x * u, r = y0 + x * u, ex = (C.extra || [])[j] || 0;
          const cell = (nm, X, Y, w, hh, t) => G.rect(X, Y, w, hh, f.includes(nm) ? fc : "ghost") + G.t(X + w / 2, Y + hh / 2 + 6, t, f.includes(nm) ? "b" : "m");
          h += kit.rowTitle(x0 + s + (ex ? 50 : 0), 24, kind) + cell("x2", x0, y0, x * u, x * u, pf(x * x)) + cell("y2", c, r, y * u, y * u, pf(y * y)) + cell("r1", c, y0, y * u, x * u, pf(x * y)) + cell("r2", x0, r, x * u, y * u, pf(x * y));
          for (let k = 0; k < ex; k++) h += G.rect(x0 + s + 12, y0 + k * (x * u + 10), 40, x * u, fc) + G.t(x0 + s + 32, y0 + k * (x * u + 10) + x * u / 2 + 6, "+" + pf(x * y), "b");
          h += G.t(x0 + s / 2 + (ex ? 25 : 0), y0 + s + 28, C.caps[j], kind === "chosen" ? "w" : "ok");
        });
        H = 240;
      } else {
        const u = C.unit;
        sides.forEach(([j, kind, fc], i) => {
          const y = 30 + H, [w, hh] = C.rects[j], ph = Math.max(hh * u, 0);
          h += kit.rowTitle(612, y - 6, kind);
          h += hh ? G.rect(X0, y + 6, w * u, ph, fc) : G.line(X0, y + 10, X0 + w * u, y + 10, kind === "chosen" ? "sa" : "sok");
          h += G.he(612, y + ph + 34, C.caps[j], "m", "right");
          H += ph + 74;
        });
        H += 4;
      }
      kit.compare(host, { height: H, svg: h, note: (cfg.notes || {})[chosen], title: "ככה זה נראה בשטחים" });
    },
  };
})();
