/* Lab: הבנה גיאומטרית — שרטוט גמיש, מצבים קיצוניים, עוגן. Models: apex on a perpendicular bisector, two fixed arms with a hinge,
   a vertex sliding between parallels, a flexible rhombus. The learner deforms the figure and watches what stays fixed. */
(function () {
  const { G } = Lab, PX = 608, D2R = Math.PI / 180;
  const r1 = x => Math.round(x * 10) / 10;
  const deg = x => Math.round(x) + "°";

  const lbl = (x, y, s) => /[\u0590-\u05FF]/.test(s) ? G.he(x, y, s, "m", "right") : G.t(x, y, s, "m", "end");
  function panel(rows, y0 = 44) {
    let h = "", y = y0;
    for (const [lab, val, cls] of rows) { h += lbl(PX, y, lab); y += 24; h += G.t(PX, y, val, cls || "b", "end"); y += 36; }
    return h;
  }
  function panelRow(items, y = 34) {           // horizontal: columns right-aligned at PX, PX-150, ...
    return items.map(([lab, val, cls], i) => lbl(PX - i * 150, y, lab) + G.t(PX - i * 150, y + 26, val, cls || "b", "end")).join("");
  }
  // label placed outside a polygon: midpoint pushed away from a center point
  function outLabel(p, q, ctr, s, cls, d = 18) {
    const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; let vx = mx - ctr[0], vy = my - ctr[1]; const n = Math.hypot(vx, vy) || 1;
    return G.t(mx + vx / n * d, my + vy / n * d + 6, s, cls);
  }
  const ptLabel = (p, ctr, s, d = 20) => { let vx = p[0] - ctr[0], vy = p[1] - ctr[1]; const n = Math.hypot(vx, vy) || 1; return G.t(p[0] + vx / n * d, p[1] + vy / n * d + 6, s, "b"); };
  const ang = (from, to) => Math.atan2(from[1] - to[1], to[0] - from[0]);     // math angle (y up) of ray from→to
  function arc(V, P1, P2, r, cls = "sa") {                                     // arc at V between rays V→P1 and V→P2 (the interior one, < 180°)
    let a1 = ang(V, P1), a2 = ang(V, P2); if (a2 < a1) [a1, a2] = [a2, a1];
    if (a2 - a1 > Math.PI) [a1, a2] = [a2, a1 + 2 * Math.PI];
    return G.angleArc(V[0], V[1], r, a1, a2, cls);
  }

  // ---------- model 1: apex P on the perpendicular bisector of a fixed AB ----------
  const AP = { A: [214, 310], B: [406, 310], u: 24 };
  function drawApex(S) {
    const { A, B, u } = AP, P = [310, 310 - S.h * u], a = 2 * Math.atan(4 / S.h) / D2R;
    let h = G.line(310, 334, 310, 24, "dash");
    h += G.poly([A, B, P], "fsoft") + G.line(A[0], A[1], B[0], B[1], "ink");
    h += arc(P, A, B, 30) + G.rightMark(310, 310, 1, 0, 0, -1, 9);
    h += G.t(A[0] - 14, A[1] + 6, "A", "b", "end") + G.t(B[0] + 14, B[1] + 6, "B", "b", "start") + G.t(262, 334, "8", "m");
    h += G.t(P[0] + 22, P[1] - 12, "P", "b", "start") + G.t(P[0] - 22, P[1] - 12, deg(a), "a", "end");
    h += G.knob(P[0], P[1], "P", 15);
    return h + panel([["∢APB", deg(a), "a big"], ["המרחק של P מ־AB", G.fmt(S.h), "b"]]);
  }

  // ---------- model 2: two fixed arms p (C→A, rotates) and q (C→B, fixed) ----------
  function armsGeo(S) {
    const { p, q, u } = S, C = [200, 300], g = S.g * D2R;
    const A = [C[0] + p * u * Math.cos(g), C[1] - p * u * Math.sin(g)], B = [C[0] + q * u, C[1]];
    const c = Math.sqrt(p * p + q * q - 2 * p * q * Math.cos(g));
    return { C, A, B, c, area: p * q * Math.sin(g) / 2 };
  }
  function drawArms(S) {
    const { p, q, u } = S, { C, A, B, c, area } = armsGeo(S), ctr = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
    let h = G.path(`M${C[0] + p * u},${C[1]} A${p * u},${p * u} 0 0 0 ${C[0] - p * u},${C[1]}`, "dash");
    if (S.anchor) {
      const A0 = [C[0], C[1] - p * u];
      h += G.poly([C, A0, B], "ghost");
    }
    if (S.showH) {
      const F = [A[0], C[1]];
      if (A[0] < C[0]) h += G.line(A[0], C[1], C[0], C[1], "dash");
      h += G.line(A[0], A[1], F[0], F[1], "sblue", { "stroke-dasharray": "6 4" });
      h += G.t(A[0] + (A[0] < C[0] ? -8 : 8), C[1] - (C[1] - A[1]) * .3, "h = " + G.fmt(r1(p * Math.sin(S.g * D2R))), "blue", A[0] < C[0] ? "end" : "start");
    }
    h += G.poly([C, A, B], "fsoft") + arc(C, B, A, 26);
    h += outLabel(C, A, ctr, String(p), "b") + outLabel(C, B, ctr, String(q), "b") + outLabel(A, B, ctr, G.fmt(c), "a big", 20);
    h += ptLabel(C, ctr, "C") + ptLabel(B, ctr, "B");
    h += G.knob(A[0], A[1], "A", 15);
    const rows = [["∢C", deg(S.g), "a big"], ["הצלע השלישית", "AB = " + G.fmt(c), "b"]];
    if (S.anchor) rows.push(["העוגן (מקווקו, זווית ישרה)", "AB = 10", "m"]);
    if (S.showArea) rows.push(["שטח המשולש", G.fmt(r1(area)), "blue big"]);
    return h + panel(rows);
  }
  function dragArms(S, pt) {
    const { p, q } = S; let g = Math.atan2(300 - pt.y, pt.x - 200); if (g < 0) g = pt.x > 200 ? 0 : Math.PI;
    let c = Math.sqrt(p * p + q * q - 2 * p * q * Math.cos(g));
    c = Math.max(Math.abs(p - q) + .5, Math.min(p + q - .5, Math.round(c * 2) / 2));
    S.c = c; S.g = Math.acos((p * p + q * q - c * c) / (2 * p * q)) / D2R;
  }
  const setC = (S, c) => { const { p, q } = S; S.c = c; S.g = Math.acos((p * p + q * q - c * c) / (2 * p * q)) / D2R; };

  // ---------- model 3: P slides on line a, AB fixed on parallel line b ----------
  const PA = { yA: 200, yB: 325, A: [200, 325], B: [400, 325], u: 25 };
  function drawPar(S) {
    const { yA, yB, A, B, u } = PA, P = [200 + S.p * u, yA];
    const PAl = Math.hypot(P[0] - A[0], P[1] - A[1]) / u, PBl = Math.hypot(P[0] - B[0], P[1] - B[1]) / u;
    let h = G.line(12, yA, 608, yA, "thin") + G.line(12, yB, 608, yB, "thin");
    h += G.t(20, yA - 8, "a", "m", "start") + G.t(20, yB - 8, "b", "m", "start");
    h += G.poly([A, B, P], "fsoft") + G.line(A[0], A[1], B[0], B[1], "ink");
    if (S.showArea) { h += G.line(P[0], P[1], P[0], yB, "sblue", { "stroke-dasharray": "6 4" }); h += G.t(P[0] + 8, (yA + yB) / 2 + 6, "5", "blue", "start"); }
    if (S.p === 0) h += G.rightMark(A[0], A[1], 1, 0, 0, -1, 12);
    h += G.t(A[0], yB + 24, "A", "b") + G.t(B[0], yB + 24, "B", "b") + G.t(300, yB + 24, "8", "m") + G.t(P[0], yA - 20, "P", "b");
    h += G.knob(P[0], P[1], "P", 15);
    const rows = [["היקף המשולש", G.fmt(r1(8 + PAl + PBl)), "b"]];
    rows.unshift(["שטח המשולש PAB", S.showArea ? "20" : "?", "a big"]);
    return h + panelRow(rows);
  }

  // ---------- model 4: rhombus with all sides 5, angle A flexible ----------
  const RH = { A: [200, 320], B: [350, 320], s: 5, u: 30 };
  function drawRh(S) {
    const { A, B, u, s } = RH, a = S.a * D2R, v = [s * u * Math.cos(a), -s * u * Math.sin(a)];
    const D = [A[0] + v[0], A[1] + v[1]], C = [B[0] + v[0], B[1] + v[1]], O = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2];
    const AC = Math.hypot(C[0] - A[0], C[1] - A[1]) / u, BD = Math.hypot(D[0] - B[0], D[1] - B[1]) / u;
    let h = G.poly([A, B, C, D], "fsoft");
    h += G.line(A[0], A[1], C[0], C[1], "dash") + G.line(B[0], B[1], D[0], D[1], "dash");
    const e1 = [(C[0] - A[0]) / (AC * u), (C[1] - A[1]) / (AC * u)], e2 = [(D[0] - B[0]) / (BD * u), (D[1] - B[1]) / (BD * u)];
    h += G.rightMark(O[0], O[1], e1[0], e1[1], e2[0], e2[1], 9);
    h += arc(A, B, D, 26);
    const flat = S.a < 40 || S.a > 140;
    for (const [p, q] of flat ? [[A, B], [C, D]] : [[A, B], [B, C], [C, D], [D, A]]) h += outLabel(p, q, O, "5", "m", 14);
    h += ptLabel(A, O, "A", 22) + ptLabel(B, O, "B", 22) + ptLabel(C, O, "C", 22) + ptLabel(D, O, "D", 26);
    h += G.knob(D[0], D[1], "D", 15);
    const row = [["∢A", deg(S.a), "a"], ["AC", G.fmt(r1(AC)), "b"], ["BD", G.fmt(r1(BD)), "b"]];
    if (S.showArea) row.push(["שטח", G.fmt(r1(25 * Math.sin(a))), "blue"]);
    return h + panelRow(row);
  }

  function draw(L) { const S = L.state; return ({ apex: drawApex, arms: drawArms, par: drawPar, rh: drawRh })[S.mode](S); }
  function drag(L, key, pt) {
    const S = L.state;
    if (S.mode === "apex") S.h = Math.max(.5, Math.min(11, Math.round((310 - pt.y) / AP.u * 2) / 2));
    else if (S.mode === "arms") dragArms(S, pt);
    else if (S.mode === "par") S.p = Math.max(-6, Math.min(14, Math.round((pt.x - 200) / PA.u * 2) / 2));
    else if (S.mode === "rh") { let a = Math.atan2(RH.A[1] - pt.y, pt.x - RH.A[0]) / D2R; if (a < 0) a = pt.x > RH.A[0] ? 0 : 180; S.a = Math.max(20, Math.min(160, Math.round(a / 5) * 5)); }
  }
  function dragFrom(L, pt) { const m = L.state.mode; return m === "apex" ? (Math.abs(pt.x - 310) < 60 && pt.y < 320 ? "P" : null) : m === "par" ? (Math.abs(pt.y - PA.yA) < 40 ? "P" : null) : null; }

  const S = L => L.state;
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const guess = (L, e) => { if (e.type !== "choice") return null; L.memo.g = e.j; return true; };
  const apexA = L => 2 * Math.atan(4 / S(L).h) / D2R;

  Lab.register({
    id: "geo-insight", title: "המחשה: הבנה גיאומטרית", viewBox: "0 0 620 380",
    chapters: ["זווית פתיחה", "עוגן", "בין מקבילים", "שרטוט גמיש", "שטח מקסימלי", "שאלת מבחן"],
    draw, drag, dragFrom,
    steps: [
      // ---------- ch0: apex moving away from a fixed segment ----------
      { ch: 0, setup: L => { L.state = { mode: "apex", h: 8 }; },
        say: "AB הוא קטע קבוע באורך 8. הנקודה P זזה על האנך האמצעי שלו, והמספר הוורוד הוא הזווית APB.",
        task: "גרור את P כך שהזווית תהיה בדיוק 90°.",
        demo: L => { S(L).h = 4; L.act({ type: "drop" }); },
        check: (L, e) => e.type !== "drop" ? null : S(L).h === 4 ? true : S(L).h > 4 ? `הזווית עדיין חדה (${deg(apexA(L))}). קרב את P לקטע.` : `עברת: הזווית כבר קהה (${deg(apexA(L))}). הרחק את P מעט.`,
        ok: "הזווית ישרה כש־P רחוקה 4 מהקטע, כלומר חצי מ־AB." },
      { ch: 0, task: "מה יקרה לזווית אם נרחיק את P עוד ועוד מהקטע?", choices: ["תגדל", "תקטן", "לא תשתנה"], check: guess, ok: "בדוק בעצמך." },
      { ch: 0, task: "גרור את P למעלה עד שהזווית תהיה קטנה מ־45°.",
        demo: L => { S(L).h = 11; L.act({ type: "drop" }); },
        check: (L, e) => e.type !== "drop" ? null : apexA(L) < 45 ? true : S(L).h < 4 ? "P ירדה לכיוון הקטע והזווית נפתחה. גרור למעלה, הרחק מ־AB." : `עוד למעלה. הזווית עכשיו ${deg(apexA(L))}.`,
        ok: L => (L.memo.g === 1 ? "צדקת. " : "") + "קצות הזווית (A ו־B) קבועים, ולכן ככל שהקודקוד מתרחק, הזרועות מתקרבות זו לזו והזווית <b>נסגרת</b>." },
      { ch: 0, say: "ועכשיו לקצה השני.", task: "מה קורה לזווית כש־P מתקרבת מאוד לקטע AB (כמעט נוגעת בו)? אפשר לגרור ולבדוק.",
        choices: ["שואפת ל־0°", "שואפת ל־90°", "שואפת ל־180°"],
        check: pick(2, { 0: "גרור את P עד כמעט הקטע והסתכל על המספר. היא נסגרת או נפתחת?", 1: "90° זה כש־P רחוקה 4. גרור את P עוד למטה, כמעט עד הקטע." }),
        ok: "כש־P כמעט על הקטע, הזווית כמעט שטוחה, 180°. <b>מצב קיצוני</b> כזה עוזר לראות לאן הדברים הולכים." },

      // ---------- ch1: the anchor (6, 8, 10) ----------
      { ch: 1, setup: L => { L.state = { mode: "arms", p: 6, q: 8, u: 22, g: 0 }; setC(L.state, 8); },
        say: "שתי צלעות קבועות: CA = 6 ו־CB = 8. כשגוררים את A הזווית C משתנה, ואיתה הצלע השלישית AB.",
        task: "גרור את A עד שהזווית C תהיה ישרה. שים לב לצלע השלישית.",
        demo: L => { setC(S(L), 10); L.act({ type: "drop" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const c = S(L).c; if (c === 10) { S(L).anchor = true; L.render(); return true; } return c < 10 ? `הזווית עדיין חדה (${deg(S(L).g)}). פתח אותה עוד.` : `עברת: הזווית כבר קהה (${deg(S(L).g)}).`; },
        ok: "6, 8, 10: שלשה פיתגורית. זה <b>העוגן</b>: עם הזרועות 6 ו־8, צלע שלישית 10 פירושה זווית ישרה בדיוק. המשולש המקווקו יישאר להשוואה." },
      { ch: 1, say: "עכשיו נניח שהצלע השלישית היא 12, ארוכה מהעוגן.", task: "איזו זווית C תתקבל?", choices: ["חדה", "ישרה", "קהה"], check: guess, ok: "בוא נבנה את זה." },
      { ch: 1, task: "גרור את A עד שהצלע השלישית תהיה 12.",
        demo: L => { setC(S(L), 12); L.act({ type: "drop" }); },
        check: (L, e) => e.type !== "drop" ? null : S(L).c === 12 ? true : S(L).c < 12 ? `הצלע עכשיו ${G.fmt(S(L).c)}. פתח את הזווית עוד.` : `עברת: הצלע עכשיו ${G.fmt(S(L).c)}.`,
        ok: L => (L.memo.g === 2 ? "צדקת. " : "") + "הזווית בערך 117°, קהה. צלע <b>ארוכה</b> מהעוגן ⇐ הזרועות נפתחו יותר ⇐ זווית קהה. צלע <b>קצרה</b> מהעוגן ⇐ זווית חדה. בנוסחה: 12² = 144 גדול מ־6² + 8² = 100." },
      { ch: 1, task: "צלעות משולש הן 9, 12 ו־14. מה סוג הזווית שמול הצלע 14?", choices: ["חדה", "ישרה", "קהה", "אי אפשר לדעת"],
        check: pick(0, { 1: "העוגן של 9 ו־12 הוא 15 (שלשה 3:4:5 כפול 3). האם 14 שווה ל־15?", 2: "העוגן הוא 15. האם 14 ארוך ממנו או קצר ממנו?", 3: "אפשר לדעת: שלוש צלעות קובעות משולש אחד בלבד. השווה לעוגן 15." }),
        ok: "העוגן 15, ו־14 קצר ממנו ⇐ הזווית <b>חדה</b>. (בדיקה: 196 קטן מ־81 + 144 = 225.)" },

      // ---------- ch2: between parallels ----------
      { ch: 2, setup: L => { L.state = { mode: "par", p: 3, showArea: false }; },
        say: "a ו־b ישרים מקבילים, והמרחק ביניהם 5. AB = 8 קבוע על b, ו־P זזה על a.",
        task: "לפני שגוררים: מה יקרה לשטח המשולש PAB כש־P תזוז לאורך a?",
        choices: ["יגדל ככל ש־P מתרחקת הצידה", "יישאר קבוע", "אי אפשר לדעת"], check: guess, ok: "גרור ובדוק." },
      { ch: 2, setup: L => { S(L).showArea = true; }, task: "גרור את P רחוק ימינה, ככל שאפשר, ועקוב אחרי המספרים.",
        demo: L => { S(L).p = 14; L.act({ type: "drop" }); },
        check: (L, e) => e.type !== "drop" ? null : S(L).p >= 12 ? true : "עוד ימינה, עד הקצה.",
        ok: L => (L.memo.g === 1 ? "צדקת. " : "") + "השטח נשאר 20 כל הזמן: הבסיס 8 קבוע, והגובה הוא המרחק בין המקבילים, 5. ההיקף והזוויות, לעומת זאת, משתנים." },
      { ch: 2, say: "כשמשהו קבוע, אפשר לחשב אותו במצב הכי נוח.", task: "גרור את P כך שהמשולש יהיה ישר־זווית ב־A.",
        demo: L => { S(L).p = 0; L.act({ type: "drop" }); },
        check: (L, e) => e.type !== "drop" ? null : S(L).p === 0 ? true : S(L).p > 0 ? "P צריכה להיות בדיוק מעל A. גרור שמאלה." : "עברת את A. גרור מעט ימינה.",
        ok: "עכשיו רואים את זה מיד: 8 × 5 ÷ 2 = 20. ואותו שטח בכל נקודה אחרת על a. משולשים עם בסיס משותף וקודקוד על ישר מקביל לבסיס, <b>שווי שטח</b>." },

      // ---------- ch3: flexible drawing (rhombus) ----------
      { ch: 3, setup: L => { L.state = { mode: "rh", a: 90, showArea: false }; },
        say: "ABCD מרובע שכל צלעותיו 5. בשרטוט הוא נראה כמו ריבוע, אבל לא נאמר שהשרטוט מדויק.",
        task: "האם הזוויות של ABCD בהכרח ישרות?", choices: ["כן, רואים שזה ריבוע", "לא בהכרח"],
        check: pick(1, { 0: "זו בדיוק המלכודת של 'מראה העין'. נתון רק שהצלעות שוות. נסה לחשוב אם אפשר 'למתוח' את הצורה." }),
        ok: "נכון. בוא נמתח את השרטוט." },
      { ch: 3, task: "גרור את D ו'כופף' את המרובע עד שהזווית A תהיה 60°.",
        demo: L => { S(L).a = 60; L.act({ type: "drop" }); },
        check: (L, e) => e.type !== "drop" ? null : S(L).a === 60 ? true : S(L).a > 60 ? `עוד. הזווית עכשיו ${S(L).a}°. גרור את D ימינה ולמטה.` : `עברת: ${S(L).a}°.`,
        ok: "כל הצלעות עדיין 5, הנתונים מתקיימים, ובכל זאת זה כבר לא ריבוע. זה <b>שרטוט גמיש</b>: מותר למתוח אותו כל עוד לא סותרים את הנתונים." },
      { ch: 3, setup: L => { S(L).showArea = true; }, say: "גרור את D הלוך ושוב ועקוב אחרי המספרים ואחרי הסימונים.",
        task: "מה נשאר קבוע בכל מצב?", choices: ["האלכסונים מאונכים זה לזה", "האלכסונים שווים זה לזה", "השטח הוא 25", "הזווית A ישרה"],
        check: pick(0, { 1: "הסתכל על AC ו־BD ב־60°: האם הם שווים?", 2: "השטח 25 רק בזווית ישרה. בדוק אותו ב־60°.", 3: "הרגע שינית אותה ל־60°." }),
        ok: "בכל מצב האלכסונים מאונכים (סימן הזווית הישרה זז איתם). רק ממה שנשאר קבוע מותר להסיק <b>בהכרח</b>." },
      { ch: 3, task: "גרור את D לקיצון: שטח את המרובע ככל שאפשר. מה קורה לשטח?",
        demo: L => { S(L).a = 20; L.act({ type: "drop" }); },
        check: (L, e) => e.type !== "drop" ? null : (S(L).a === 20 || S(L).a === 160) ? true : `עוד. הזווית עכשיו ${S(L).a}°, גרור עד הסוף.`,
        ok: "השטח צונח (בערך 8.6 בזווית 20°), וככל שמשטחים הוא שואף ל־0. הגדול ביותר, 25, בזווית ישרה. בדיקת <b>שני הקצוות</b> מראה מה יכול להשתנות." },

      // ---------- ch4: maximum area ----------
      { ch: 4, setup: L => { L.state = { mode: "arms", p: 6, q: 8, u: 22, g: 0, showArea: true, showH: true }; setC(L.state, 7); },
        say: "חזרה לשתי הצלעות 6 ו־8. עכשיו מוצגים גם השטח והגובה (בכחול) לצלע 8.",
        task: "גרור את A ומצא את השטח הגדול ביותר האפשרי.",
        demo: L => { setC(S(L), 10); L.act({ type: "drop" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const s = S(L); return s.c === 10 ? true : `השטח עכשיו ${G.fmt(r1(armsGeo(s).area))}. מתי הגובה הכחול הכי ארוך?`; },
        ok: "השטח הגדול ביותר הוא 24 = 6 · 8 ÷ 2, כשהזווית ישרה: אז הצלע 6 עצמה היא הגובה. בכל זווית אחרת הגובה קצר מ־6." },

      // ---------- ch5: exam ----------
      { ch: 5, setup: L => { L.state = { mode: "arms", p: 10, q: 12, u: 14, g: 0, showArea: true }; setC(L.state, 13); },
        say: "שאלה ברמת מבחן. המודל פתוח לגרירה: הצלעות כאן 10 ו־12.",
        task: "שתיים מצלעות משולש הן 10 ו־12, והזווית ביניהן אינה ידועה. אילו מהטענות נכונות בהכרח?<br>I. שטח המשולש לכל היותר 60.<br>II. הצלע השלישית קצרה מ־22.<br>III. שטח המשולש גדול מ־10.",
        choices: ["רק I", "רק I ו־II", "רק II ו־III", "I, II ו־III"],
        check: pick(1, { 0: "בדוק את II: גם כשהמשולש כמעט שטוח, האם הצלע השלישית מגיעה ל־22?", 2: "השטח הגדול ביותר הוא 10 · 12 ÷ 2 = 60, ולכן I נכונה. ומה עם III כשהמשולש כמעט שטוח?", 3: "III: גרור את A עד שהמשולש כמעט שטוח. מה קורה לשטח?" }),
        ok: "I: המקסימום 60, בזווית ישרה. II: אפילו בזווית קרובה ל־180° הצלע קצרה מ־10 + 12 = 22. III: בזווית קטנה מאוד השטח שואף ל־0, ולכן לא בהכרח." },
      { ch: 5, say: "<b>סיכום ההמחשה:</b><br>1. קצות זווית קבועים: הקודקוד מתרחק ⇐ הזווית נסגרת. זרועות קבועות: הצלע שמול הזווית גדלה ⇐ הזווית נפתחת.<br>2. עוגן: משווים לזווית ישרה (שלשה פיתגורית). ארוך מהעוגן = קהה, קצר = חדה.<br>3. שרטוט גמיש: 'מותחים' את הצורה, ומסיקים רק ממה שנשאר קבוע.<br>4. בודקים את שני הקצוות לפני שמחליטים 'בהכרח'.", next: "סיום ההמחשה" },
    ],
  });
})();
