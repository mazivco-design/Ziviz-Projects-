/* Lab: הסתברות — a 6×6 two-dice grid, a coin streak, and an urn you draw from without replacement. */
(function () {
  const { G } = Lab, CW = 40, GX = 250, GY = 84;
  const dice = o => Object.assign({ mode: "dice", sel: {}, showSum: false, compl: false }, o);
  const urn = (p, b, o) => Object.assign({ mode: "urn", balls: [...Array(p).fill("p"), ...Array(b).fill("b")], out: [], fr: [], canDraw: true, showProd: false }, o);
  const cellX = j => GX + (5 - j) * CW;            // die B value j+1; value 1 on the right (RTL table)
  const keys = S => Object.keys(S.sel).filter(k => S.sel[k]);

  function drawDice(S) {
    let h = "";
    h += G.he(GX + 3 * CW, 40, "קובייה ב", "m", "middle") + G.he(600, 70, "קובייה א", "m", "right");
    for (let j = 0; j < 6; j++) h += G.t(cellX(j) + CW / 2, 70, String(j + 1), "b");
    for (let i = 0; i < 6; i++) {
      h += G.t(GX + 6 * CW + 16, GY + i * CW + 26, String(i + 1), "b");
      for (let j = 0; j < 6; j++) {
        const k = i + ":" + j, on = S.sel[k], x = cellX(j), y = GY + i * CW, c = S.compl && i < 5 && j < 5;
        h += G.tap(G.rect(x, y, CW, CW, (on ? "fa" : c ? "fwarn" : "box") + " hot"), k);
        if (S.showSum || on) h += G.t(x + CW / 2, y + 26, String(i + j + 2), on ? "inv" : "m", "middle", { "pointer-events": "none" });
      }
    }
    const n = keys(S).length;
    h += G.he(215, 120, "רצוי (מסומן): " + n, "a", "right") + G.he(215, 148, "מצוי (כל הטבלה): 36", "m", "right");
    h += G.t(130, 200, n + "/36", "a big");
    if (S.compl) h += G.he(215, 250, "צהוב: אין אף 6", "w", "right") + G.t(130, 282, "25/36", "w big");
    return h;
  }
  function drawCoins(S) {
    let h = G.he(600, 40, "מטבע הוגן, 4 הטלות", "b", "right");
    for (let k = 0; k < 5; k++) {
      const x = 520 - k * 105, y = 170, last = k === 4;
      h += G.circle(x, y, 38, last ? "ghost" : "fblue-soft");
      h += last ? G.t(x, y + 9, "?", "big") : G.he(x, y + 7, "עץ", "b", "middle");
      h += G.he(x, y + 70, "הטלה " + (k + 1), "m", "middle");
    }
    return h;
  }
  const bagPos = i => [80 + (i % 4) * 52, 300 - Math.floor(i / 4) * 52];
  function drawUrn(S) {
    let h = G.path("M50,110 L50,320 Q50,340 70,340 L270,340 Q290,340 290,320 L290,110", "ink");
    const left = S.balls.map((c, i) => S.out.includes(i) ? null : c).filter(Boolean), p = left.filter(c => c === "p").length;
    const nm = (k, one, many) => k === 1 ? one : k + " " + many;
    h += G.he(290, 60, "בכד: " + nm(p, "ורוד אחד", "ורודים") + ", " + nm(left.length - p, "כחול אחד", "כחולים"), "b", "right");
    h += G.he(290, 86, "סך הכול " + left.length + " כדורים", "m", "right");
    S.balls.forEach((c, i) => { if (S.out.includes(i)) return; const [x, y] = bagPos(i);
      const ball = G.circle(x, y, 20, (c === "p" ? "fa" : "fblue") + (S.canDraw ? " hot" : ""));
      h += S.canDraw ? G.tap(ball, "b:" + i) : ball; });
    for (let k = 0; k < 2; k++) {
      const x = 540 - k * 120, y = 150, i = S.out[k];
      h += G.he(x, 96, "שליפה " + (k + 1), "m", "middle");
      h += i === undefined ? G.circle(x, y, 22, "ghost") : G.circle(x, y, 22, S.balls[i] === "p" ? "fa" : "fblue");
      if (S.fr[k]) h += G.t(x, y + 58, S.fr[k], "a big");
      if (k === 1 && S.fr[1]) h += G.t(x + 60, y + 58, "×", "a big");
    }
    if (S.showProd && S.out.length === 2) h += G.t(480, 290, S.fr[0] + " × " + S.fr[1] + " = " + S.prod, "a big");
    return h;
  }
  const draw = L => { const S = L.state; return S.mode === "coins" ? drawCoins(S) : S.mode === "urn" ? drawUrn(S) : drawDice(S); };
  function tap(L, key) {
    const S = L.state;
    if (S.mode === "dice") { S.sel[key] = !S.sel[key]; return; }
    if (S.mode !== "urn" || !S.canDraw || S.out.length >= 2) return false;
    const i = +key.slice(2); S.err = null;
    if (S.want && S.balls[i] !== S.want) { S.err = "color"; return; }
    const left = S.balls.filter((c, j) => !S.out.includes(j)), c = left.filter(x => x === S.balls[i]).length;
    S.fr.push(c + "/" + left.length); S.out.push(i);
  }
  // dice-grid task: select exactly the cells where pred(a,b) holds
  const cells = (pred, why, n) => (L, e) => { if (e.type !== "tap") return null; const ks = keys(L.state);
    const bad = ks.find(k => { const [i, j] = k.split(":").map(Number); return !pred(i + 1, j + 1); });
    if (bad) { const [i, j] = bad.split(":").map(Number); return why(i + 1, j + 1) + " לחץ עליו שוב כדי לבטל."; }
    return ks.length === n ? true : null; };
  const solve = pred => L => { const S = L.state; S.sel = {}; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if (pred(i + 1, j + 1)) S.sel[i + ":" + j] = true; L.act({ type: "tap" }); };
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const firstPink = S => S.balls.findIndex((c, i) => c === "p" && !S.out.includes(i));
  const drawPink = (L, e) => { if (e.type !== "tap") return null; if (L.state.err === "color") return "זה כדור כחול. אנחנו בודקים את המקרה ששני הכדורים ורודים, אז שלוף ורוד."; return true; };

  const sum5 = (a, b) => a + b === 5, sum7 = (a, b) => a + b === 7, ev = (a, b) => a % 2 === 0 && b % 2 === 0, six = (a, b) => a === 6 || b === 6;
  Lab.register({
    id: "prb-prob", title: "מעבדת הסתברות", viewBox: "0 0 620 360",
    chapters: ["רצוי ÷ מצוי", "וגם = כפל", "או, ומשלים", "בלי החזרה", "שאלת מבחן"],
    draw, tap,
    steps: [
      { ch: 0, setup: L => { L.state = dice(); },
        say: "מטילים שתי קוביות. כל משבצת היא תוצאה אחת: השורה היא קובייה א, והעמודה היא קובייה ב. יש 6 × 6 = 36 תוצאות, ולכולן אותו סיכוי.",
        task: "סמן את כל התוצאות שבהן הסכום הוא 5.",
        demo: solve(sum5),
        check: cells(sum5, (a, b) => "בתא הזה הסכום הוא " + (a + b) + " (" + a + " + " + b + ").", 4),
        ok: "4 תוצאות רצויות מתוך 36 מצויות: P = 4/36 = 1/9. <b>הסתברות = רצוי ÷ מצוי</b>. שים לב: 1 ו־4 ו־4 ו־1 הן שתי תוצאות שונות." },
      { ch: 0, task: "איזה סכום של שתי קוביות הוא הכי שכיח?", choices: ["12", "7", "6", "לכל הסכומים אותו סיכוי"],
        check: pick(1, { 0: "12 יוצא רק מ־6 ו־6, תא אחד בלבד.", 2: "קרוב. אבל נסה לספור את התאים של 6 ושל 7.", 3: "לסכום 2 יש רק תא אחד (1 ו־1), ולסכום 5 מצאת 4. הם לא שווים." }),
        ok: "7. בוא נראה למה." },
      { ch: 0, setup: L => { L.state = dice({ showSum: true }); },
        say: "עכשיו כל תא מראה את הסכום שלו.", task: "סמן את כל התאים שבהם הסכום הוא 7.",
        demo: solve(sum7),
        check: cells(sum7, (a, b) => "בתא הזה הסכום הוא " + (a + b) + ", לא 7.", 6),
        ok: "6/36 = 1/6. האלכסון של 7 הוא הארוך ביותר. ככל שמתרחקים מ־7, האלכסונים מתקצרים." },
      { ch: 0, task: "השווה: P(סכום 4) לעומת P(סכום 10).", choices: ["ל־10 סיכוי גדול יותר", "ל־4 סיכוי גדול יותר", "הסיכוי שווה"],
        check: pick(2, { 0: "ספור בטבלה: כמה תאים של 4, וכמה של 10?", 1: "ספור בטבלה: כמה תאים של 4, וכמה של 10?" }),
        ok: "3/36 לכל אחד. 4 ו־10 נמצאים באותו מרחק מ־7, ולכן יש להם אותה הסתברות: <b>P(s) = P(14 − s)</b>." },
      { ch: 1, setup: L => { L.state = dice(); },
        say: "בלי סכומים הפעם.", task: "סמן את כל התוצאות שבהן <b>שתי</b> הקוביות יצאו זוגיות.",
        demo: solve(ev),
        check: cells(ev, (a, b) => "בתא הזה " + (a % 2 ? "קובייה א יצאה " + a : "קובייה ב יצאה " + b) + ", מספר אי־זוגי.", 9),
        ok: "9/36 = 1/4. ובכפל: P(א זוגית) = 1/2 וגם P(ב זוגית) = 1/2, ולכן 1/2 × 1/2 = 1/4. <b>\"וגם\" → כופלים</b>: 3 שורות × 3 עמודות." },
      { ch: 1, setup: L => { L.state = { mode: "coins" }; },
        say: "מטבע הוגן נפל \"עץ\" 4 פעמים ברצף.", task: "מה ההסתברות שבהטלה הבאה ייפול \"פלי\"?",
        choices: ["1/2", "יותר מ־1/2, כי מגיע לו פלי", "1/16", "15/16"],
        check: pick(0, { 1: "המטבע לא זוכר מה יצא קודם. מה ההסתברות לפלי בכל הטלה?", 2: "1/16 היא ההסתברות לרצף של 4 תוצאות מסוימות מראש. אבל 4 ההטלות כבר קרו.", 3: "ההטלות הקודמות כבר קרו. כמה פנים יש למטבע?" }),
        ok: "1/2. <b>להסתברות אין היסטוריה</b>. מה שקטן הוא רק הסיכוי, מראש, לרצף של 5 עץ: 1/2 × 1/2 × 1/2 × 1/2 × 1/2 = 1/32." },
      { ch: 2, setup: L => { L.state = dice(); },
        say: "\"או\" בשתי קוביות.", task: "מה ההסתברות שיצא 6 לפחות באחת הקוביות?",
        choices: ["12/36 (1/6 + 1/6)", "11/36", "1/36", "10/36"],
        check: (L, e) => { if (e.type !== "choice") return null; L.memo.six = e.j; return true; }, ok: "בוא נספור בטבלה." },
      { ch: 2, task: "סמן את כל התוצאות שיש בהן לפחות 6 אחד.",
        demo: solve(six),
        check: cells(six, () => "בתא הזה אין 6 באף קובייה.", 11),
        ok: L => (L.memo.six === 0 ? "12 זו המלכודת. " : L.memo.six === 1 ? "צדקת. " : "") + "11, לא 12. התא של 6 ו־6 שייך גם לשורה וגם לעמודה, ו־1/6 + 1/6 סופר אותו פעמיים. <b>מחברים הסתברויות רק כשאין חפיפה</b>." },
      { ch: 2, setup: L => { L.state.compl = true; },
        say: "המשבצות הצהובות הן כל התוצאות שאין בהן אף 6.", task: "מה ההסתברות שלא ייצא אף 6?",
        choices: ["25/36", "30/36", "5/36", "1/36"],
        check: pick(0, { 1: "ספור את הבלוק הצהוב: 5 שורות × 5 עמודות.", 2: "5 זה רק שורה אחת של הבלוק. ספור את כולו.", 3: "1/36 זה תא אחד. הבלוק הצהוב גדול בהרבה." }),
        ok: "5/6 × 5/6 = 25/36. ולכן P(לפחות 6 אחד) = 1 − 25/36 = 11/36, בלי לספור חפיפות. <b>\"לפחות אחד\" = 1 − \"אף אחד\"</b>." },
      { ch: 3, setup: L => { L.state = urn(3, 5, { want: "p" }); },
        say: "בכד 3 כדורים ורודים ו־5 כחולים. שולפים שני כדורים בזה אחר זה, <b>בלי להחזיר</b>. מה הסיכוי ששניהם ורודים?",
        task: "שלוף כדור ורוד: לחץ עליו.",
        demo: L => { tap(L, "b:" + firstPink(L.state)); L.act({ type: "tap" }); },
        check: drawPink, ok: "הסיכוי לשלוף ורוד היה 3 מתוך 8, כלומר 3/8. הכדור לא חוזר לכד." },
      { ch: 3, setup: L => { L.state.canDraw = false; }, task: "מה הסיכוי שגם הכדור הבא יהיה ורוד?", choices: ["3/8", "2/7", "2/8", "3/7"],
        check: pick(1, { 0: "הכד כבר לא אותו כד. ספור את הכדורים שנשארו בו.", 2: "גם המכנה קטן: כמה כדורים נשארו בכד?", 3: "המכנה נכון. וכמה ורודים נשארו?" }),
        ok: "2/7. <b>בלי החזרה</b> קטנים גם הרצויים וגם המצויים." },
      { ch: 3, setup: L => { L.state.canDraw = true; L.state.showProd = true; L.state.prod = "6/56 = 3/28"; }, task: "שלוף עוד כדור ורוד.",
        demo: L => { tap(L, "b:" + firstPink(L.state)); L.act({ type: "tap" }); },
        check: drawPink,
        ok: "\"וגם\" → כופלים: 3/8 × 2/7 = 6/56 = 3/28. עם החזרה זה היה 3/8 × 3/8 = 9/64, קצת יותר." },
      { ch: 4, setup: L => { L.state = urn(2, 3, {}); },
        say: "שאלה ברמת מבחן. אפשר לשלוף מהכד כדי לחשוב, ו'החזר' מחזיר את הכדורים.",
        tools: () => [["החזר", L => { L.state.out = []; L.state.fr = []; }]],
        task: "בכד 2 כדורים ורודים ו־3 כחולים. שולפים 2 כדורים בלי החזרה. מה ההסתברות שלפחות אחד מהם ורוד?",
        choices: ["16/25", "7/10", "2/5", "3/10"],
        check: pick(1, { 0: "זה החישוב עם החזרה (1 − 3/5 × 3/5). כאן הכדור הראשון לא חוזר.", 2: "זה רק הסיכוי שהראשון ורוד. נסה דרך המשלים: 1 − P(שניהם כחולים).", 3: "זה הסיכוי ששניהם כחולים. השאלה שואלת על ההפך." }),
        ok: "P(שניהם כחולים) = 3/5 × 2/4 = 6/20 = 3/10. ולכן P(לפחות ורוד אחד) = 1 − 3/10 = <b>7/10</b>." },
      { ch: 4, say: "<b>סיכום המעבדה:</b><br>1. הסתברות = רצוי ÷ מצוי. בשתי קוביות סופרים בטבלה של 36.<br>2. \"וגם\" → כופלים. בלי החזרה קטנים גם המונה וגם המכנה.<br>3. \"או\" → מחברים רק בלי חפיפה. \"לפחות אחד\" = 1 − \"אף אחד\".<br>4. אין היסטוריה. בשתי קוביות 7 הכי שכיח, וסכומים במרחק שווה מ־7 שווים בסיכוי.", next: "סיום המעבדה" },
    ],
  });
})();
