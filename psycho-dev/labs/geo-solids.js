/* Lab: תלת־ממד — נפח ושטח פנים. Models: unit-cube box (oblique), box net, cube packing, cylinder, cone pouring. */
(function () {
  const { G } = Lab;
  const K1 = 0.45, K2 = 0.32;                      // oblique depth vector (per unit of depth)
  const PX = 608;                                    // right edge of the info panel
  const ell = (cx, cy, rx, ry, cls) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" class="${cls}"/>`;
  const proj = (o, u) => (x, y, z) => [o[0] + u * (x + z * K1), o[1] - u * (y + z * K2)];

  // info panel: stacked rows [hebrewLabel, ltrValue, valueClass]
  function panel(rows, y0 = 44) {
    let h = "", y = y0;
    for (const [lab, val, cls] of rows) {
      if (lab) { h += G.he(PX, y, lab, "m", "right"); y += 24; }
      if (val !== undefined && val !== null && val !== "") { h += /[\u0590-\u05FF]/.test(val) ? G.he(PX, y, val, cls || "b", "right") : G.t(PX, y, val, cls || "b", "end"); y += 30; }
      y += 6;
    }
    return h;
  }

  // solid box with visible faces + grid every `s` units
  function box(P, a, c, b, s, cls) {
    let h = "";
    const F = [P(0, 0, 0), P(a, 0, 0), P(a, c, 0), P(0, c, 0)];
    const T = [P(0, c, 0), P(a, c, 0), P(a, c, b), P(0, c, b)];
    const R = [P(a, 0, 0), P(a, 0, b), P(a, c, b), P(a, c, 0)];
    h += G.poly(F, cls.front) + G.poly(T, cls.top) + G.poly(R, cls.side);
    const L = (p, q) => G.line(p[0], p[1], q[0], q[1], "thin", { opacity: .55 });
    if (s) {
      for (let x = s; x < a - 1e-9; x += s) { h += L(P(x, 0, 0), P(x, c, 0)) + L(P(x, c, 0), P(x, c, b)); }
      for (let y = s; y < c - 1e-9; y += s) { h += L(P(0, y, 0), P(a, y, 0)) + L(P(a, y, 0), P(a, y, b)); }
      for (let z = s; z < b - 1e-9; z += s) { h += L(P(0, c, z), P(a, c, z)) + L(P(a, 0, z), P(a, c, z)); }
    }
    return h;
  }
  const BOXCLS = { front: "fsoft", top: "fblue-soft", side: "fok-soft" };
  const WARNCLS = { front: "fwarn", top: "fwarn", side: "fwarn" };
  function dims(P, a, c, b, cls = "b") {
    const f = P(a / 2, 0, 0), l = P(0, c / 2, 0), r = P(a, 0, b / 2);
    return G.t(f[0], f[1] + 24, G.fmt(a), cls) + G.t(l[0] - 16, l[1] + 6, G.fmt(c), cls, "end") + G.t(r[0] + 14, r[1] + 16, G.fmt(b), cls, "start");
  }

  function drawBox(S) {
    const P = proj([60, 330], S.u); let h = box(P, S.a, S.c, S.b, 1, BOXCLS) + dims(P, S.a, S.c, S.b);
    const V = S.a * S.b * S.c;
    const rows = [["אורך × רוחב × גובה", `${S.a} × ${S.b} × ${S.c}`, "b"], ["נפח (מספר הקוביות)", `V = ${G.fmt(V)}`, "a big"]];
    if (S.hist && S.hist.length > 1) rows.push(["הנפח לאורך הדרך", S.hist.join(" → "), "blue"]);
    if (S.showS) rows.push(["שטח פנים", `S = ${2 * (S.a * S.b + S.b * S.c + S.a * S.c)}`, "b"]);
    return h + panel(rows);
  }

  // net of box a (length) × b (depth) × c (height): strip [left b][front a][right b][back a] of height c, top above front, bottom below front
  function drawNet(S) {
    const { a, b, c } = S, u = 24, x0 = 40, yT = 40;
    const ys = yT + b * u;                                     // strip top
    const faces = {
      left: [x0, ys, b, c, "fok-soft"], front: [x0 + b * u, ys, a, c, "fsoft"], right: [x0 + (b + a) * u, ys, b, c, "fok-soft"],
      back: [x0 + (2 * b + a) * u, ys, a, c, "fsoft"], top: [x0 + b * u, yT, a, b, "fblue-soft"], bottom: [x0 + b * u, ys + c * u, a, b, "fblue-soft"],
    };
    let h = "";
    for (const [k, [x, y, w, hh, cls]] of Object.entries(faces)) {
      if (S.noBases && (k === "top" || k === "bottom")) continue;
      let c2 = cls;
      if (S.hl && k === "front") c2 = "fa";
      if (S.picked === k) c2 = k === "back" ? "fa" : "fwarn";
      const r = G.rect(x, y, w * u, hh * u, c2 + (S.tapNet ? " hot" : ""));
      h += S.tapNet ? G.tap(r, k) : r;
      const inv = c2 === "fa";
      h += G.t(x + w * u / 2, y + hh * u / 2 + 6, `${w}×${hh}`, inv ? "inv" : "m", "middle", { "pointer-events": "none" });
    }
    if (S.noBases) {
      const yb = ys + c * u + 26;
      h += G.line(x0, yb - 14, x0 + (2 * a + 2 * b) * u, yb - 14, "mut");
      h += G.t(x0 + (a + b) * u, yb + 8, `${b} + ${a} + ${b} + ${a} = ${2 * (a + b)}`, "b");
      h += G.he(x0 + (a + b) * u, yb + 32, "היקף הבסיס", "m");
      h += G.t(x0 + (2 * a + 2 * b) * u + 8, ys + c * u / 2 + 6, String(c), "b", "start");
    }
    const rows = S.noBases
      ? [["שטח מעטפת", S.solvedL ? `${2 * (a + b)} × ${c} = ${2 * (a + b) * c}` : "?", "a big"]]
      : [["6 פאות, 3 זוגות", `2(${a * b} + ${a * c} + ${b * c})`, "b"]];
    return h + panel(rows);
  }

  function drawPack(S) {
    const P = proj([60, 330], S.u), { a, b, c, s, nx, ny, nz } = S;
    const back = [[0, 0, b], [a, 0, b]], E = (p, q, cls) => { const A = P(...p), B = P(...q); return G.line(A[0], A[1], B[0], B[1], cls); };
    let h = "";
    // hidden container edges first (dashed)
    h += E([0, 0, b], [a, 0, b], "dash") + E([0, 0, b], [0, c, b], "dash") + E([0, 0, b], [0, 0, 0], "dash");
    const over = nx * s > a || ny * s > b || nz * s > c;
    if (nx && ny && nz) h += box(P, nx * s, nz * s, ny * s, s, over ? WARNCLS : { front: "fblue-soft", top: "fblue-soft", side: "fblue-soft" });
    // visible container edges
    const V = [[[0, 0, 0], [a, 0, 0]], [[a, 0, 0], [a, c, 0]], [[a, c, 0], [0, c, 0]], [[0, c, 0], [0, 0, 0]], [[0, c, 0], [0, c, b]], [[a, c, 0], [a, c, b]], [[a, 0, 0], [a, 0, b]], [[0, c, b], [a, c, b]], [[a, 0, b], [a, c, b]]];
    for (const [p, q] of V) h += E(p, q, "ink");
    h += dims(P, a, c, b);
    const fx = Math.floor(a / s), fy = Math.floor(b / s), fz = Math.floor(c / s);
    if (S.showCount) {
      const row = (lab, n, d, f) => [lab, `${n} (${d} ÷ ${s} → ${f})`, n > f ? "w" : n === f ? "ok" : "b"];
      return h + panel([row("קוביות לאורך", nx, a, fx), row("קוביות לרוחב", ny, b, fy), row("קוביות לגובה", nz, c, fz), ["סה״כ קוביות", `${nx} × ${ny} × ${nz} = ${nx * ny * nz}`, "a big"]], 34);
    }
    return h + panel([["נפח התיבה", `${a} × ${b} × ${c} = ${a * b * c}`, "b"], ["נפח קובייה", `${s} × ${s} × ${s} = ${s ** 3}`, "b"]]);
  }

  function cylinder(cx, by, rx, hp, cls, water) {
    const ry = rx * 0.3, l = cx - rx, r = cx + rx, t = by - hp;
    let h = "";
    if (cls === "ghost") {
      h += ell(cx, t, rx, ry, "ghost") + G.line(l, t, l, by, "ghost") + G.line(r, t, r, by, "ghost") + G.path(`M${l},${by} A${rx},${ry} 0 0 0 ${r},${by}`, "ghost");
      return h;
    }
    h += G.path(`M${l},${t} L${l},${by} A${rx},${ry} 0 0 0 ${r},${by} L${r},${t} A${rx},${ry} 0 0 1 ${l},${t} Z`, cls);
    if (water) {
      const wt = by - water;
      h += G.path(`M${l},${wt} L${l},${by} A${rx},${ry} 0 0 0 ${r},${by} L${r},${wt} A${rx},${ry} 0 0 1 ${l},${wt} Z`, "fblue", { opacity: .55 });
      h += ell(cx, wt, rx, ry, "fblue-soft");
    }
    h += G.path(`M${l},${by} A${rx},${ry} 0 0 1 ${r},${by}`, "dash");
    h += ell(cx, t, rx, ry, water >= hp - 0.5 ? "fblue-soft" : "box");
    return h;
  }
  function cone(cx, by, rx, hp, full) {
    const ry = rx * 0.3, l = cx - rx, r = cx + rx, t = by - hp;
    let h = G.path(`M${cx},${t} L${l},${by} A${rx},${ry} 0 0 0 ${r},${by} Z`, full ? "fblue-soft" : "fsoft");
    h += G.path(`M${l},${by} A${rx},${ry} 0 0 1 ${r},${by}`, "dash");
    h += G.line(cx, t, cx, by, "dash");
    return h;
  }

  function drawCyl(S) {
    const u = 24, cx = 170, by = 300, rx = S.r * u;
    let h = cylinder(cx, by, rx, S.h * u, "fsoft");
    h += G.line(cx, by - S.h * u, cx + rx, by - S.h * u, "sa") + G.circle(cx, by - S.h * u, 3, "dot");
    h += G.t(cx, by + rx * 0.3 + 24, "r = " + S.r, "a");
    h += G.line(cx + rx + 16, by, cx + rx + 16, by - S.h * u, "mut") + G.t(cx + rx + 22, by - S.h * u / 2 + 6, "h = " + S.h, "b", "start");
    if (S.r !== S.r0 || S.h !== S.h0) h += cylinder(cx, by, S.r0 * u, S.h0 * u, "ghost");
    const V = S.r * S.r * S.h, V0 = S.r0 * S.r0 * S.h0, ratio = V / V0;
    const rows = [["שטח בסיס", `πr² = ${S.r * S.r}π`, "b"], ["נפח", `V = ${S.r * S.r} × ${S.h} π = ${V}π`, "a big"]];
    if (S.r !== S.r0 || S.h !== S.h0) rows.push(["לעומת המקורי (מקווקו)", ratio >= 1 ? `×${G.fmt(ratio)}` : `×${fracStr(V, V0)}`, "blue big"]);
    return h + panel(rows);
  }
  const gcd = (x, y) => y ? gcd(y, x % y) : x;
  const fracStr = (n, d) => { const g = gcd(n, d); return `${n / g}/${d / g}`; };

  function drawCone(S) {
    const { u } = S, by = 296;
    const cyl = S.cyl, co = S.cone;
    let h = cylinder(S.cylX, by, cyl.r * u, cyl.h * u, "box", S.level * u);
    h += cone(S.coneX, by, co.r * u, co.h * u, S.coneFull);
    // marks on cylinder
    if (S.thirds) for (const k of [1, 2]) { const y = by - cyl.h * u * k / 3; h += G.line(S.cylX + cyl.r * u + 4, y, S.cylX + cyl.r * u + 16, y, "mut"); }
    const ry1 = cyl.r * u * .3, ry2 = co.r * u * .3;
    h += G.line(S.cylX, by, S.cylX + cyl.r * u, by, "sa") + G.circle(S.cylX, by, 3, "dot") + G.line(S.coneX, by, S.coneX + co.r * u, by, "sa");
    h += G.t(S.cylX + cyl.r * u / 2, by + ry1 + 20, "r = " + cyl.r, "a") + G.he(S.cylX, by + ry1 + 44, "גליל", "m");
    h += G.t(S.coneX + co.r * u / 2, by + ry2 + 20, "r = " + co.r, "a") + G.he(S.coneX, by + ry2 + 44, "חרוט", "m");
    const hx = S.coneX + co.r * u + 14;
    h += G.line(hx, by, hx, by - co.h * u, "mut") + G.t(hx + 6, by - co.h * u / 2 + 6, "h = " + co.h, "b", "start");
    if (S.cylH) h += G.t(S.cylX - cyl.r * u - 10, by - cyl.h * u / 2, "h = " + cyl.h, "b", "end");
    if (S.ask) h += G.t(S.cylX + cyl.r * u + 14, by - cyl.h * u / 2, "?", "a big", "start");
    const rows = S.pours !== undefined ? [["חרוטים שנשפכו", String(S.pours), "a big"], ["גובה המים בגליל", ["0", "⅓ גליל", "⅔ גליל", "גליל מלא"][Math.round(S.level / cyl.h * 3)], "b"]] : [];
    return h + panel(rows);
  }

  function draw(L) {
    const S = L.state;
    return ({ box: drawBox, net: drawNet, pack: drawPack, cyl: drawCyl, cone: drawCone })[S.mode](S);
  }
  function tap(L, key) { L.state.picked = key; }

  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const guess = (L, e) => { if (e.type !== "choice") return null; L.memo.g = e.j; return true; };
  const btn = (label, f, type, pulse) => [label, L => { f(L.state); L.render(); L.act({ type }); }, pulse];
  const S = L => L.state;

  Lab.register({
    id: "geo-solids", title: "המחשה: תלת־ממד", viewBox: "0 0 620 380",
    chapters: ["נפח = קוביות", "שטח פנים", "קוביות בתיבה", "גליל", "חרוט", "שאלת מבחן"],
    draw, tap,
    steps: [
      // ---------- ch0: volume as counting cubes ----------
      { ch: 0, setup: L => { L.state = { mode: "box", a: 3, b: 2, c: 1, u: 30 }; },
        say: "זו תיבה שבנויה מקוביות יחידה (כל מקצוע = 1). הנפח שלה הוא פשוט מספר הקוביות שהיא מכילה.",
        task: "הוסף שכבות בעזרת 'גובה +' עד שהנפח יהיה 18.",
        tools: () => [btn("גובה +", s => { if (s.c < 6) s.c++; }, "dim", true), btn("גובה −", s => { if (s.c > 1) s.c--; }, "dim")],
        demo: L => { S(L).c = 3; L.act({ type: "dim" }); },
        check: (L, e) => { if (e.type !== "dim") return null; const V = S(L).a * S(L).b * S(L).c; return V === 18 ? true : V > 18 ? "עברת את 18. כל שכבה מוסיפה 6 קוביות, הורד שכבה." : null; },
        ok: "שכבה אחת היא 3 × 2 = 6 קוביות, כלומר שטח הבסיס. 3 שכבות = 18. זה כל הסוד: <b>נפח = שטח בסיס × גובה</b>." },
      { ch: 0, say: "עכשיו נכפיל את כל שלושת הממדים: אורך, רוחב וגובה, כל אחד פי 2.", task: "לפני שבודקים: פי כמה יגדל הנפח?",
        choices: ["פי 2", "פי 4", "פי 6", "פי 8"], check: guess, ok: "בוא נבדוק על התיבה." },
      { ch: 0, setup: L => { S(L).hist = [18]; S(L).done = {}; },
        say: "כל כפתור מכפיל ממד אחד. שים לב למספר הקוביות אחרי כל לחיצה.", task: "הכפל את האורך, את הרוחב ואת הגובה.",
        tools: L => ["a", "b", "c"].map((k, i) => [["אורך ×2", "רוחב ×2", "גובה ×2"][i], L => { const s = S(L); if (s.done[k]) return; s.done[k] = 1; s[k] *= 2; s.hist.push(s.a * s.b * s.c); L.render(); L.act({ type: "dbl" }); }, true]),
        demo: L => { const s = S(L); for (const k of ["a", "b", "c"]) if (!s.done[k]) { s.done[k] = 1; s[k] *= 2; s.hist.push(s.a * s.b * s.c); } L.act({ type: "dbl" }); },
        check: (L, e) => e.type === "dbl" && Object.keys(S(L).done).length === 3 ? true : null,
        ok: L => (L.memo.g === 3 ? "צדקת. " : "") + "כל הכפלה של ממד אחד הכפילה את הנפח: 18 → 36 → 72 → 144. שלוש הכפלות: 2 × 2 × 2 = <b>פי 8</b>." },

      // ---------- ch1: surface area via net ----------
      { ch: 1, setup: L => { L.state = { mode: "box", a: 4, b: 3, c: 2, u: 34, showS: false }; },
        say: "שטח פנים = סכום השטחים של <b>כל</b> הפאות. בתיבה הזו (4 × 3 × 2) רואים רק 3 פאות מתוך 6.",
        task: "לחץ על 'פרוש לרשת' כדי לראות את כולן.",
        tools: () => [btn("פרוש לרשת", s => { s.mode = "net"; s.hl = true; }, "unfold", true)],
        demo: L => { Object.assign(S(L), { mode: "net", hl: true }); L.act({ type: "unfold" }); },
        check: (L, e) => e.type === "unfold" ? true : null,
        ok: "זו הרשת: 6 מלבנים. הצבעים זהים לצבעי הפאות בתיבה." },
      { ch: 1, setup: L => { Object.assign(S(L), { mode: "net", hl: true, tapNet: true, picked: null }); },
        say: "הפאה הקדמית (4 × 2) מודגשת. כשמקפלים את הרשת חזרה, איזו פאה תהיה מולה?",
        task: "לחץ על הפאה שמול החזית.",
        demo: L => { S(L).picked = "back"; L.act({ type: "tap", key: "back" }); },
        check: (L, e) => {
          if (e.type !== "tap") return null; const k = e.key;
          if (k === "back") { S(L).tapNet = false; L.render(); return true; }
          return k === "front" ? "זו החזית עצמה. חפש את התאומה שלה." : (k === "left" || k === "right") ? "לפאה הזו מידות 3 × 2. חפש פאה של 4 × 2." : "לפאה הזו מידות 4 × 3, זה בסיס. חפש פאה של 4 × 2.";
        },
        ok: "נכון, הפאה האחורית. וכך בכל זוג: למעלה ולמטה (4 × 3), ימין ושמאל (3 × 2). לכל פאה יש תאומה זהה מולה." },
      { ch: 1, setup: L => { Object.assign(S(L), { hl: false, picked: null }); }, say: "המספרים על המלבנים הם המידות שלהם.",
        task: "מה שטח הפנים של התיבה 4 × 3 × 2?", choices: ["24", "26", "48", "52"],
        check: pick(3, { 0: "24 זה הנפח (4 · 3 · 2), לא השטח.", 1: "26 = 12 + 8 + 6, אלה רק שלוש פאות. לכל אחת יש תאומה.", 2: "בדוק שוב את השטחים: 4 · 3 = 12, 4 · 2 = 8, 3 · 2 = 6." }),
        ok: "2 × (12 + 8 + 6) = 52. הנוסחה: <b>2(ab + bc + ac)</b>." },
      { ch: 1, say: "<b>שטח מעטפת</b> הוא שטח הפנים בלי שני הבסיסים (למעלה ולמטה).", task: "לחץ על 'הסר בסיסים'.",
        tools: () => [btn("הסר בסיסים", s => { s.noBases = true; }, "nob", true)],
        demo: L => { S(L).noBases = true; L.act({ type: "nob" }); },
        check: (L, e) => e.type === "nob" ? true : null,
        ok: "נשארה רצועה אחת של 4 פאות. האורך שלה הוא היקף הבסיס, 14, והגובה שלה 2." },
      { ch: 1, task: "מה שטח המעטפת?", choices: ["14", "28", "40", "52"],
        check: (L, e) => { const r = pick(1, { 0: "14 זה רק אורך הרצועה. כפול בגובה שלה.", 2: "52 − 12 = 40, אבל הסרנו שני בסיסים, לא אחד.", 3: "52 זה שטח הפנים המלא. הסרנו את הבסיסים." })(L, e); if (r === true) { S(L).solvedL = true; L.render(); } return r; },
        ok: "<b>מעטפת = היקף בסיס × גובה</b> = 14 × 2 = 28. ושטח פנים = מעטפת + 2 בסיסים = 28 + 24 = 52." },

      // ---------- ch2: cubes in a box ----------
      { ch: 2, setup: L => { L.state = { mode: "pack", a: 7, b: 5, c: 4, s: 2, nx: 1, ny: 1, nz: 1, u: 36, showCount: false }; },
        say: "תיבה ריקה במידות 7 × 5 × 4, וקובייה כחולה שהמקצוע שלה 2. נפח התיבה 140 ונפח קובייה 8.",
        task: "140 ÷ 8 = 17.5. אז נכנסות לתיבה 17 קוביות?", choices: ["כן, 17", "פחות מ־17", "יותר מ־17"], check: guess, ok: "בוא נמלא ונראה." },
      { ch: 2, setup: L => { S(L).showCount = true; },
        say: "כל כפתור מוסיף או מוריד שורה של קוביות בכיוון אחד.", task: "מלא את התיבה בכמה שיותר קוביות שלמות.",
        tools: () => [["x", "nx", "לאורך"], ["y", "ny", "לרוחב"], ["z", "nz", "לגובה"]].flatMap(([, k, w]) => [
          btn("+ " + w, s => { const lim = { nx: s.a, ny: s.b, nz: s.c }[k]; if (s[k] * s.s <= lim) s[k]++; }, "pack", true), btn("− " + w, s => { if (s[k] > 1) s[k]--; }, "pack")]),
        demo: L => { Object.assign(S(L), { nx: 3, ny: 2, nz: 2 }); L.act({ type: "pack" }); },
        check: (L, e) => {
          if (e.type !== "pack") return null; const s = S(L);
          const bad = [["nx", s.a, "באורך"], ["ny", s.b, "ברוחב"], ["nz", s.c, "בגובה"]].find(([k, d]) => s[k] * s.s > d);
          if (bad) return `הקוביות בולטות מהתיבה ${bad[2]}: ${bad[1]} ÷ 2 נותן רק ${Math.floor(bad[1] / 2)} קוביות שלמות.`;
          return s.nx === 3 && s.ny === 2 && s.nz === 2 ? true : null;
        },
        ok: L => (L.memo.g === 1 ? "צדקת! " : "") + "רק <b>12</b>. בכל ממד נשארה 'שארית' שאי אפשר לנצל: 7 ← 3 קוביות, 5 ← 2, 4 ← 2. משווים ממד לממד, מעגלים כלפי מטה, ורק אז כופלים: 3 × 2 × 2." },
      { ch: 2, setup: L => { L.state = { mode: "pack", a: 10, b: 7, c: 6, s: 3, nx: 0, ny: 0, nz: 0, u: 26, showCount: false }; },
        say: "עכשיו בלי כפתורים.", task: "כמה קוביות שהמקצוע שלהן 3 נכנסות לכל היותר לתיבה 10 × 7 × 6?",
        choices: ["9", "12", "15", "18"],
        check: pick(1, { 0: "בדוק את האורך: 10 ÷ 3 = 3 ועוד שארית, כלומר 3 קוביות.", 2: "זו המלכודת: 420 ÷ 27 ≈ 15.5 זה חילוק נפח בנפח. בדוק כל ממד לחוד.", 3: "7 ÷ 3 = 2 ועוד שארית. מעגלים כלפי מטה, לא כלפי מעלה." }),
        ok: "10 ← 3, 7 ← 2, 6 ← 2. סה״כ 3 × 2 × 2 = 12, הרבה פחות מ־15.5 שמתקבל מחילוק הנפחים." },

      // ---------- ch3: cylinder, radius squared ----------
      { ch: 3, setup: L => { L.state = { mode: "cyl", r: 2, h: 4, r0: 2, h0: 4 }; },
        say: "גליל הוא מנסרה עם בסיס עגול: נפח = שטח בסיס × גובה = πr²h. כאן r = 2 ו־h = 4, ולכן הנפח 16π.",
        task: "אם נכפיל את הרדיוס פי 2 והגובה יישאר 4, פי כמה יגדל הנפח?", choices: ["פי 2", "פי 4", "פי 8"], check: guess, ok: "נבדוק." },
      { ch: 3, task: "הגדל את הרדיוס ל־4.",
        tools: () => [btn("רדיוס +", s => { if (s.r < 5) s.r++; }, "cyl", true), btn("רדיוס −", s => { if (s.r > 1) s.r--; }, "cyl")],
        demo: L => { S(L).r = 4; L.act({ type: "cyl" }); },
        check: (L, e) => e.type !== "cyl" ? null : S(L).r === 4 ? true : S(L).r > 4 ? "עברת את 4. הורד את הרדיוס." : null,
        ok: L => (L.memo.g === 1 ? "צדקת. " : "") + "הרדיוס גדל פי 2, אבל שטח הבסיס גדל פי 4 (4π → 16π), ולכן הנפח 64π: <b>פי 4</b>. הרדיוס נכנס לנוסחה בריבוע." },
      { ch: 3, say: "עכשיו לא נוגעים ברדיוס.", task: "החזר את הנפח ל־16π בעזרת הגובה בלבד.",
        tools: () => [btn("גובה +", s => { if (s.h < 8) s.h++; }, "cyl"), btn("גובה −", s => { if (s.h > 1) s.h--; }, "cyl", true)],
        demo: L => { S(L).h = 1; L.act({ type: "cyl" }); },
        check: (L, e) => e.type !== "cyl" ? null : S(L).h === 1 ? true : S(L).h > 4 ? "הנפח רק גדל. כדי להקטין אותו פי 4 צריך להקטין את הגובה." : null,
        ok: "גובה 1: 16π × 1 = 16π. הגובה פועל 'רגיל': גובה קטן פי 4 ⇐ נפח קטן פי 4. רדיוס פי 2 (נפח ×4) וגובה ÷4 מתקזזים." },
      { ch: 3, task: "רדיוס של גליל קטן פי 2 והגובה שלו גדל פי 3. פי כמה משתנה הנפח?", choices: ["פי 1.5", "פי ¾", "פי 6", "פי ⅙"],
        check: pick(1, { 0: "חילקת את הרדיוס ב־2 בלי להעלות בריבוע. רדיוס ÷2 ⇐ שטח בסיס ÷4.", 2: "רדיוס קטן מקטין את הנפח, לא מגדיל.", 3: "הגובה גדל פי 3, לא קטן." }),
        ok: "(½)² × 3 = ¼ × 3 = <b>¾</b>. קודם מעלים את שינוי הרדיוס בריבוע, ואז כופלים בשינוי הגובה." },

      // ---------- ch4: cone = 1/3 cylinder ----------
      { ch: 4, setup: L => { L.state = { mode: "cone", u: 24, cylX: 140, coneX: 340, cyl: { r: 3, h: 5 }, cone: { r: 3, h: 5 }, level: 0, pours: 0, coneFull: true, thirds: false, cylH: true }; },
        say: "חרוט וגליל עם אותו בסיס ואותו גובה. ממלאים את החרוט במים ושופכים לגליל.", task: "כמה חרוטים מלאים צריך כדי למלא את הגליל?",
        choices: ["2", "3", "4"], check: guess, ok: "נשפוך ונראה." },
      { ch: 4, setup: L => { S(L).thirds = true; }, task: "לחץ על 'שפוך חרוט' עד שהגליל יתמלא.",
        tools: () => [btn("שפוך חרוט", s => { if (s.pours < 3) { s.pours++; s.level = s.cyl.h * s.pours / 3; } }, "pour", true)],
        demo: L => { Object.assign(S(L), { pours: 3, level: 5 }); L.act({ type: "pour" }); },
        check: (L, e) => e.type === "pour" && S(L).pours === 3 ? true : null,
        ok: L => (L.memo.g === 1 ? "צדקת. " : "") + "3 חרוטים בדיוק. <b>נפח גוף מחודד</b> (חרוט, פירמידה) = ⅓ × שטח בסיס × גובה. שים לב: הגובה הוא המרחק מהקודקוד לבסיס, לא אורך הדופן המשופעת." },

      // ---------- ch5: exam ----------
      { ch: 5, setup: L => { L.state = { mode: "cone", u: 18, cylX: 120, coneX: 330, cyl: { r: 3, h: 6 }, cone: { r: 6, h: 3 }, level: 0, coneFull: true, cylH: false, ask: true }; },
        say: "שאלה ברמת מבחן. אפשר להיעזר בשני הכלים שבנינו: רדיוס בריבוע, ושליש.",
        task: "חרוט שרדיוס הבסיס שלו 6 והגובה שלו 3 מלא במים. שופכים את כל המים לגליל ריק שרדיוס הבסיס שלו 3. לאיזה גובה יגיעו המים בגליל?",
        choices: ["1", "4", "6", "12"],
        check: pick(1, { 0: "בגליל הרדיוס קטן פי 2, ולכן שטח הבסיס קטן פי 4. המים צריכים לעלות גבוה יותר, לא נמוך יותר.", 2: "רדיוס קטן פי 2 ⇐ שטח בסיס קטן פי 4, לא פי 2.", 3: "שכחת את השליש: נפח החרוט הוא ⅓ · π · 36 · 3." }),
        ok: "נפח החרוט: ⅓ · π · 6² · 3 = 36π. שטח בסיס הגליל: π · 3² = 9π. גובה המים: 36π ÷ 9π = <b>4</b>." },
      { ch: 5, say: "<b>סיכום ההמחשה:</b><br>1. נפח מנסרה = שטח בסיס × גובה. גוף מחודד = שליש מזה.<br>2. שטח פנים = כל 6 הפאות, 2(ab + bc + ac). מעטפת = היקף בסיס × גובה.<br>3. קוביות בתיבה: ממד מול ממד, מעגלים למטה, ואז כופלים.<br>4. שינוי ברדיוס עולה בריבוע, שינוי בגובה נשאר כמו שהוא.", next: "סיום ההמחשה" },
    ],
  });
})();
