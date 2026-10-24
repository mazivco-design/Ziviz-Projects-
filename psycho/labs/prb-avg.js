/* Lab: ממוצעים — עמודות קוביות שמיישרים (ממוצע = גובה משותף) ונדנדה (ממוצע משוקלל). */
(function () {
  const { G } = Lab;
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const sum = a => a.reduce((s, v) => s + v, 0);
  const r2 = n => Math.round(n * 100) / 100;

  // ---------- columns ----------
  const BASE = 318, U = 16, CW = 46, GAP = 22, MAXH = 15;
  const cols = o => Object.assign({ mode: "cols", vals: [3, 7, 5, 9, 6], line: null, lineDrag: false, dragCol: null, live: false, showED: true, lineLabel: "" }, o);
  const colX = (S, j) => { const n = S.vals.length, tw = n * CW + (n - 1) * GAP, x0 = 330 - tw / 2; return x0 + j * (CW + GAP); };
  const avg = S => sum(S.vals) / S.vals.length;
  function ed(S) { let ex = 0, de = 0; for (const v of S.vals) { if (v > S.line) ex += v - S.line; else de += S.line - v; } return { ex, de }; }
  function drawCols(S) {
    let h = "";
    const n = S.vals.length, xl = colX(S, 0) - 40, xr = colX(S, n - 1) + CW + 20;
    h += G.line(xl, BASE, xr, BASE, "ink") + G.line(xl, BASE, xl, BASE - MAXH * U, "mut");
    for (let k = 0; k <= MAXH; k += 1) { h += G.line(xl - 4, BASE - k * U, xl, BASE - k * U, "mut"); if (k % 2 === 0) h += G.t(xl - 8, BASE - k * U + 5, k, "m", "end"); }
    const lv = S.live ? avg(S) : S.line;
    S.vals.forEach((v, j) => {
      const x = colX(S, j);
      for (let k = 0; k < v; k++) h += G.rect(x, BASE - (k + 1) * U, CW, U, S.showED && lv !== null && !S.live && k >= lv ? "fa" : (S.dragCol === j ? "fok-soft" : "fblue-soft"));
      if (S.showED && lv !== null && !S.live) for (let k = v; k < lv; k++) h += G.rect(x + 2, BASE - (k + 1) * U + 2, CW - 4, U - 4, "fwarn");
      h += G.t(x + CW / 2, BASE + 22, S.hide === j ? "?" : v, S.dragCol === j ? "ok" : "b");
      if (S.dragCol === j) h += G.knob(x + CW / 2, BASE - v * U, "c" + j, 15);
    });
    if (lv !== null) {
      const y = BASE - lv * U;
      h += G.line(xl, y, xr, y, "sa", { "stroke-dasharray": S.lineDrag ? null : "7 5" });
      if (S.lineDrag) h += G.knob(xr + 18, y, "line", 15);
      const lab = S.live ? "" : S.lineLabel;
      if (lab) h += G.he(xr + (S.lineDrag ? 40 : 6), y + 5, lab, "a", "left");
    }
    if (S.showED && S.line !== null && !S.live) { const { ex, de } = ed(S); h += G.he(330, 34, `עודף: ${ex} · חסר: ${de}`, ex === de ? "ok" : "b"); }
    if (S.note) h += G.he(330, 34, S.note, "a");
    if (S.live) h += G.he(330, 34, "ממוצע: " + G.fmt(r2(avg(S))), "a");
    return h;
  }

  // ---------- seesaw ----------
  const SX0 = 60, SX1 = 560, PY = 210;
  const saw = o => Object.assign({ mode: "saw", lo: 50, hi: 100, f: 70, fDrag: false, groups: [], bh: 22, dist: false, step: 10 }, o);
  const vx = (S, v) => SX0 + (SX1 - SX0) * (v - S.lo) / (S.hi - S.lo);
  const torque = S => sum(S.groups.map(g => g.n * (g.v - S.f)));
  function drawSaw(S) {
    let h = "";
    const fx = vx(S, S.f), tq = torque(S), ang = Math.max(-9, Math.min(9, tq * S.tk));
    let g = G.line(SX0 - 10, PY, SX1 + 10, PY, "ink", { style: "stroke-width:5" });
    for (let v = S.lo; v <= S.hi; v += 1) { const x = vx(S, v), big = v % S.step === 0; g += G.line(x, PY + 3, x, PY + (big ? 12 : 7), "thin"); if (big && Math.abs(v - S.f) >= 2) g += G.t(x, PY + 28, v, "m"); }
    S.groups.forEach(gr => {
      const x = vx(S, gr.v), bw = 44;
      const blocks = gr.blocks || gr.n;
      for (let k = 0; k < blocks; k++) { const y = PY - 3 - (k + 1) * S.bh; g += G.rect(x - bw / 2, y, bw, S.bh - 2, gr.cls, { rx: 3 }); if (gr.blockLabel) g += G.t(x, y + S.bh / 2 + 4, gr.blockLabel, "inv"); }
      g += G.he(x, PY - 12 - blocks * S.bh, gr.label(gr), "b");
      g += G.line(x, PY - 2, x, PY + 2, "ink");
    });
    h += `<g transform="rotate(${ang} ${fx} ${PY})">${g}</g>`;
    h += G.poly([[fx, PY + 3], [fx - 20, PY + 42], [fx + 20, PY + 42]], "fsoft");
    if (S.fDrag) h += G.knob(fx, PY + 60, "f", 15);
    h += G.t(fx, PY + (S.fDrag ? 98 : 66), "" + G.fmt(S.f), "a big");
    const bal = tq === 0;
    h += G.he(330, 30, bal ? "מאוזן" : tq > 0 ? "נוטה ימינה" : "נוטה שמאלה", bal ? "ok" : "m");
    if (S.dist && bal) {
      S.groups.forEach(gr => {
        const x = vx(S, gr.v), y = PY + 124;
        h += G.line(fx, y, x, y, "sblue") + G.line(x, y - 6, x, y + 6, "sblue") + G.line(fx, y - 6, fx, y + 6, "sblue");
        h += G.he((fx + x) / 2, y + 24, "מרחק " + Math.abs(gr.v - S.f), "blue");
      });
    }
    return h;
  }

  function draw(L) { return L.state.mode === "cols" ? drawCols(L.state) : drawSaw(L.state); }
  function drag(L, key, pt) {
    const S = L.state;
    if (key === "line") S.line = Math.max(0, Math.min(MAXH, Math.round((BASE - pt.y) / U)));
    if (key[0] === "c") S.vals[+key.slice(1)] = Math.max(0, Math.min(MAXH, Math.round((BASE - pt.y) / U)));
    if (key === "f") S.f = Math.max(S.lo, Math.min(S.hi, Math.round(S.lo + (pt.x - SX0) / (SX1 - SX0) * (S.hi - S.lo))));
  }
  function dragFrom(L, pt) {
    const S = L.state;
    if (S.mode === "saw" && S.fDrag && pt.y > PY && pt.y < PY + 90) return "f";
    if (S.mode === "cols" && S.lineDrag && S.line !== null && Math.abs(pt.y - (BASE - S.line * U)) < 22) return "line";
    if (S.mode === "cols" && S.dragCol !== null) { const x = colX(S, S.dragCol); if (pt.x > x - 10 && pt.x < x + CW + 10 && pt.y < BASE) return "c" + S.dragCol; }
    return null;
  }
  const drop = (fn) => (L, e) => e.type !== "drop" ? null : fn(L.state);

  Lab.register({
    id: "prb-avg", title: "מעבדת ממוצעים", viewBox: "0 0 620 370",
    chapters: ["יישור עמודות", "סכום = ממוצע × מספר", "איבר חדש", "נדנדה", "שאלת מבחן"],
    draw, drag, dragFrom,
    steps: [
      // ---- ch0
      { ch: 0, setup: L => { L.state = cols({ line: 2, lineDrag: true }); },
        say: "חמש עמודות של קוביות: 3, 7, 5, 9, 6. הממוצע הוא הגובה שבו כל העמודות היו שוות, אם היינו מעבירים קוביות מהגבוהות לנמוכות.",
        task: "גרור את הקו האופקי לגובה שבו העודף (קוביות ורודות מעל הקו) שווה לחוסר (המשבצות המקווקוות מתחתיו).",
        demo: L => { L.state.line = 6; L.act({ type: "drop", key: "line" }); },
        check: drop(S => { const { ex, de } = ed(S); return ex === de ? true : ex > de ? `העודף גדול מהחוסר (${ex} מול ${de}). הרם את הקו.` : `החוסר גדול מהעודף (${de} מול ${ex}). הורד את הקו.`; }),
        ok: "בגובה 6 יש 4 קוביות עודף ו־4 משבצות ריקות. אם נעביר את העודף לחורים, כל העמודות יהיו 6." },
      { ch: 0, setup: L => { L.state.lineDrag = false; },
        say: "בוא נעשה את זה באמת.", task: "לחץ על 'ישר את העמודות'.",
        tools: () => [["ישר את העמודות", L => { L.state.vals = L.state.vals.map(() => 6); L.render(); L.act({ type: "level" }); }, true]],
        demo: L => { L.state.vals = L.state.vals.map(() => 6); L.act({ type: "level" }); },
        check: (L, e) => e.type === "level" ? true : null,
        ok: "כל העמודות בגובה 6, ומספר הקוביות לא השתנה: 5 × 6 = 30 = 3 + 7 + 5 + 9 + 6. זה הלב של הפרק: <b>סכום = ממוצע × מספר האיברים</b>." },
      { ch: 0, setup: L => { L.state = cols({ vals: [4, 5, 6, 7, 8], line: 6 }); },
        say: "עמודות סימטריות: 4, 5, 6, 7, 8. העודף בצד אחד משלים בדיוק את החוסר בצד השני, ולכן הממוצע הוא האיבר האמצעי.",
        task: "מה הממוצע של 13, 15, 17, 19, 21?", choices: ["15", "17", "17.5", "85"],
        check: pick(1, { 0: "15 הוא לא האמצע של הרשימה. מי באמצע?", 2: "ברשימה סימטרית עם מספר אי־זוגי של איברים, הממוצע הוא בדיוק האיבר האמצעי.", 3: "85 זה הסכום. הממוצע הוא הסכום חלקי 5." }),
        ok: "17, האיבר האמצעי, בלי לחבר אף מספר." },
      // ---- ch1
      { ch: 1, setup: L => { L.state = cols({ vals: [5, 9, 6, 2], line: 7, dragCol: 3, hide: null, lineLabel: "ממוצע 7" }); },
        say: "ארבעה מספרים, והממוצע שלהם 7 (הקו). שלושה מהם ידועים: 5, 9, 6. מה המספר הרביעי?",
        task: "גרור את ראש העמודה הירוקה עד שהעודף והחוסר יתאזנו סביב הקו.",
        demo: L => { L.state.vals[3] = 8; L.act({ type: "drop", key: "c3" }); },
        check: drop(S => { const v = S.vals[3], { ex, de } = ed(S); return v === 8 ? true : ex > de ? "יש יותר עודף מחוסר. הנמך את העמודה הירוקה." : "עדיין יש יותר חוסר מעודף. הגבה את העמודה הירוקה."; }),
        ok: "8. בלי קוביות: סכום = 7 × 4 = 28. כבר יש 5 + 9 + 6 = 20, אז חסר 8." },
      { ch: 1, setup: L => { L.state.dragCol = null; },
        say: "אותו רעיון, בלי ציור.",
        task: "הממוצע של 4 מספרים הוא 10. אחד מהם הוא 16. מה הממוצע של שלושת האחרים?", choices: ["6", "8", "10", "24"],
        check: pick(1, { 0: "חילקת ב־4, אבל נשארו רק 3 מספרים. מספר האיברים השתנה.", 2: "הוצאנו מספר גדול מהממוצע, ולכן הממוצע של הנשארים חייב לרדת.", 3: "24 הוא הסכום של השלושה. השאלה על הממוצע שלהם." }),
        ok: "סכום: 4 × 10 = 40. בלי 16 נשאר 24, ו־24 ÷ 3 = 8." },
      // ---- ch2
      { ch: 2, setup: L => { L.state = cols({ vals: [8, 8, 8, 8, 8, 8], dragCol: 5, live: true, showED: false }); },
        say: "לחמישה ילדים ממוצע של 8 נקודות. אפשר לחשוב שלכל אחד <b>כאילו</b> בדיוק 8: הסכום זהה. הצטרף ילד שישי, והממוצע עלה ל־9.",
        task: "גרור את העמודה של הילד השישי עד שהממוצע יהיה 9.",
        demo: L => { L.state.vals[5] = 14; L.act({ type: "drop", key: "c5" }); },
        check: drop(S => { const v = S.vals[5], a = avg(S); if (v === 14) return true; if (v === 13) return "13 נותן נקודה נוספת רק ל־5 הוותיקים. גם הילד החדש עצמו צריך להגיע ל־9."; return a < 9 ? `הממוצע עכשיו ${G.fmt(r2(a))}. הגבה את העמודה.` : `הממוצע עכשיו ${G.fmt(r2(a))}. הנמך את העמודה.`; }),
        ok: "14. הילד החדש 'מביא' 8 כמו כולם, ועוד נקודה לכל אחד מ־6 הילדים, כולל עצמו: 8 + 6 = 14. בחשבון: 6 × 9 − 5 × 8 = 54 − 40 = 14." },
      { ch: 2,
        say: "ועכשיו בלי לגרור.",
        task: "ומה אם הילד השישי היה מקבל בדיוק 8?", choices: ["הממוצע היה עולה", "הממוצע לא היה משתנה", "הממוצע היה יורד"],
        check: pick(1, { 0: "8 לא מוסיף כלום מעבר לממוצע הקיים. אין לו מה 'לתת' לאחרים.", 2: "8 לא נמוך מהממוצע. אין לו מה 'לקחת' מהאחרים." }),
        ok: L => { L.state.vals[5] = 8; L.render(); return "איבר ששווה לממוצע לא משנה אותו: כל העמודות נשארות בגובה 8."; } },
      // ---- ch3
      { ch: 3, setup: L => { L.state = saw({ f: 70, tk: .025, groups: [
          { v: 80, n: 30, blocks: 3, cls: "fa", blockLabel: "10", label: () => "30 תלמידים" },
          { v: 60, n: 10, blocks: 1, cls: "fblue", blockLabel: "10", label: () => "10 תלמידים" }] }); },
        say: "נדנדה של ציונים. בכיתה א' 30 תלמידים עם ממוצע 80, ובכיתה ב' 10 תלמידים עם ממוצע 60. כל קובייה היא 10 תלמידים, והיא יושבת על הממוצע של הכיתה שלה.",
        task: "לפני שמזיזים: הממוצע של כל 40 התלמידים יהיה —", choices: ["בדיוק 70, באמצע", "קרוב יותר ל־80", "קרוב יותר ל־60"],
        check: pick(1, { 0: "70 נכון רק אם הכיתות באותו גודל. כאן יש פי 3 תלמידים ליד 80.", 2: "רוב התלמידים נמצאים ליד 80, לא ליד 60." }),
        ok: "נכון. הממוצע המשותף נמשך לכיוון הקבוצה הגדולה. רואים שהנדנדה כבר נוטה לשם." },
      { ch: 3, setup: L => { L.state.fDrag = true; },
        say: "נקודת המשען שבה הנדנדה מתאזנת היא הממוצע המשותף.",
        task: "גרור את נקודת המשען עד שהנדנדה תתאזן.",
        demo: L => { L.state.f = 75; L.act({ type: "drop", key: "f" }); },
        check: drop(S => { const t = torque(S); if (t === 0) { S.dist = true; return true; } return t > 0 ? "הנדנדה נוטה ימינה. הזז את המשען ימינה, לכיוון הצד הכבד." : "הנדנדה נוטה שמאלה. הזז את המשען שמאלה."; }),
        ok: L => { L.render(); return "75. בדיקה: (30 · 80 + 10 · 60) ÷ 40 = 3000 ÷ 40 = 75."; } },
      { ch: 3, setup: L => { L.state.fDrag = false; L.state.dist = true; },
        say: "תסתכל על המרחקים מנקודת האיזון: 5 עד הכיתה הגדולה, 15 עד הקטנה.",
        task: "איך המרחקים (5 ו־15) קשורים לגודלי הכיתות (30 ו־10)?", choices: ["באותו יחס", "ביחס הפוך", "אין קשר"],
        check: pick(1, { 0: "הכיתה הגדולה (30) קיבלה דווקא את המרחק הקטן (5).", 2: "חלק 15 ב־5, וחלק 30 ב־10. מה יוצא?" }),
        ok: "<b>המרחקים ביחס הפוך לגדלים</b>: 5:15 = 1:3, ו־30:10 = 3:1. כך פותרים בלי לחשב סכומים." },
      { ch: 3, setup: L => { L.state = saw({ lo: 60, hi: 90, f: 74, fDrag: true, tk: .03, step: 5, bh: 24, groups: [
          { v: 64, n: 2, cls: "fblue", label: () => "2 עובדים" },
          { v: 84, n: 3, cls: "fa", label: () => "3 עובדים" }] }); },
        say: "2 עובדים קיבלו ציון 64, ו־3 עובדים קיבלו 84. 'ממוצע הממוצעים' הוא 74, ושם המשען עכשיו. אבל הנדנדה לא מאוזנת.",
        task: "מצא את נקודת האיזון.",
        demo: L => { L.state.f = 76; L.act({ type: "drop", key: "f" }); },
        check: drop(S => { const t = torque(S); if (t === 0) { S.dist = true; return true; } return t > 0 ? "עדיין נוטה ימינה, לצד של 3 העובדים. הזז את המשען ימינה." : "עכשיו נוטה שמאלה. חזור קצת שמאלה."; }),
        ok: L => { L.render(); return "76. המרחקים 12 ו־8 ביחס 3:2, הפוך ליחס 2:3 של גודלי הקבוצות. בחשבון: (2 · 64 + 3 · 84) ÷ 5 = 380 ÷ 5 = 76."; } },
      // ---- ch4
      { ch: 4, setup: L => { L.state = saw({ lo: 25, hi: 45, f: 34, tk: .03, step: 5, bh: 15, groups: [
          { v: 40, n: 6, cls: "fblue", label: g => g.n + " גברים" },
          { v: 30, n: 3, cls: "fa", label: g => g.n + " נשים" }] }); },
        say: "שאלה ברמת מבחן. המשען קבוע על 34, ואפשר להוסיף או להוריד נשים בנדנדה.",
        task: "בקבוצה 6 גברים שגילם הממוצע 40, ועוד כמה נשים שגילן הממוצע 30. הגיל הממוצע של כל הקבוצה הוא 34. כמה נשים בקבוצה?",
        tools: () => [["+ אישה", L => { const g = L.state.groups[1]; if (g.n < 12) g.n++; }], ["− אישה", L => { const g = L.state.groups[1]; if (g.n > 1) g.n--; }]],
        choices: ["4", "6", "9", "10"],
        check: pick(2, { 0: "הפכת את היחס. הנשים קרובות יותר לממוצע (מרחק 4), ולכן הן הקבוצה הגדולה.", 1: "עם 6 נשים הקבוצות שוות, והממוצע היה בדיוק באמצע, 35.", 3: "בדוק: (240 + 300) ÷ 16 = 33.75, לא 34." }),
        ok: L => { L.state.groups[1].n = 9; L.state.dist = true; L.render(); return "מרחקים: גברים 6, נשים 4. הגדלים ביחס הפוך: נשים:גברים = 6:4 = 3:2, ולכן 9 נשים. בדיקה: (240 + 270) ÷ 15 = 34."; } },
      { ch: 4,
        say: "<b>סיכום המעבדה:</b><br>1. ממוצע = הגובה שבו כל העמודות שוות. <b>סכום = ממוצע × מספר האיברים</b>.<br>2. ברשימה סימטרית הממוצע הוא האמצע.<br>3. איבר חדש: חשב את הסכום לפני ואחרי. ומספר האיברים משתנה!<br>4. ממוצע משוקלל נוטה לקבוצה הגדולה, והמרחקים ביחס הפוך לגדלים.", next: "סיום המעבדה" },
    ],
  });
})();
