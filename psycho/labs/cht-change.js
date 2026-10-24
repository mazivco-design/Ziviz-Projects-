/* Lab: גרף שינויים — top: change graph (points vs zero line), bottom: reconstructed real values with draggable points. */
(function () {
  const { G } = Lab;
  const X0 = 70, X1 = 570;
  const P1 = { top: 72, bot: 210 }, P2 = { top: 282, bot: 414 };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const n = S => S.labels.length;
  const slot = S => (X1 - X0) / n(S);
  const cx = (S, i) => X0 + slot(S) * (i + .5);
  const y1 = (S, v) => P1.bot - (v - S.r1[0]) / (S.r1[1] - S.r1[0]) * (P1.bot - P1.top);
  const y2 = (S, v) => P2.bot - (v - S.r2[0]) / (S.r2[1] - S.r2[0]) * (P2.bot - P2.top);
  const v2 = (S, y) => S.r2[0] + (P2.bot - y) / (P2.bot - P2.top) * (S.r2[1] - S.r2[0]);
  const sg = v => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v);
  const hit = (x, y, w, h, key) => G.tap(G.rect(x, y, w, h, "hot", { fill: "none", "pointer-events": "all" }), key);

  const CHG = [null, 10, 6, 4, -14, 0, 6], START = 50;
  const VALS = CHG.reduce((a, c, i) => (a.push(i ? a[i - 1] + c : START), a), []);   // 50,60,66,70,56,56,62
  const LABELS = ["התחלה", "1", "2", "3", "4", "5", "6"], NAMES = ["ההתחלה", "חודש 1", "חודש 2", "חודש 3", "חודש 4", "חודש 5", "חודש 6"];
  const club = o => Object.assign({ labels: LABELS, names: NAMES, chg: CHG, r1: [-15, 15, 5], r2: [45, 75, 5], vals: [START, null, null, null, null, null, null],
    title: "חוג ריצה: מספר החברים", t1: "שינוי לעומת החודש הקודם (ציר אופקי: חודש)", t2: "מספר החברים בפועל", line: true, drag: [], tapTop: false, tapBot: false, sel: null, notes: [] }, o);

  function panelGrid(S, r, yf, top, bot) {
    let h = "";
    for (let v = r[0]; v <= r[1]; v += r[2]) {
      const y = yf(S, v), zero = v === 0 && r[0] < 0;
      h += G.line(X0, y, X1, y, zero ? "ink" : "mut", zero ? {} : { opacity: .35 });
      if ((v - r[0]) % (2 * r[2]) === (r[0] % (2 * r[2]) === 0 ? 0 : r[2]) || zero) h += G.t(X0 - 10, y + 5, r[0] < 0 ? sg(v) : G.fmt(v), zero ? "b" : "m", "end");
    }
    return h + G.line(X0, top - 6, X0, bot, "ink");
  }
  function draw(L) {
    const S = L.state;
    let h = G.he(600, 26, S.title, "b", "right");
    // ---- panel 1: change graph
    h += G.he(600, 52, S.t1, "a", "right");
    h += panelGrid(S, S.r1, y1, P1.top, P1.bot);
    const cp = []; S.chg.forEach((c, i) => { if (c !== null) cp.push([cx(S, i), y1(S, c), c, i]); });
    if (S.line) h += G.path("M" + cp.map(p => p[0] + "," + p[1]).join(" L"), "thin");
    cp.forEach(([x, y, c, i]) => {
      if (S.sel === "c" + i) h += G.circle(x, y, 13, "sok");
      h += G.circle(x, y, 6, c < 0 ? "fa" : "fblue");
      h += G.t(x + 10, c < 0 ? y + 5 : y - 9, sg(c), c < 0 ? "a" : "blue", "start");
      if (S.tapTop) h += hit(x - slot(S) / 2 + 3, P1.top - 8, slot(S) - 6, P1.bot - P1.top + 16, "c" + i);
    });
    S.labels.forEach((lb, i) => h += G.he(cx(S, i), P1.bot + 22, lb, "m", "middle"));
    // ---- panel 2: reconstructed values
    h += G.he(600, P2.top - 22, S.t2, "blue", "right");
    h += panelGrid(S, S.r2, y2, P2.top, P2.bot);
    const vp = []; S.vals.forEach((v, i) => { if (v !== null) vp.push([cx(S, i), y2(S, v), v, i]); });
    if (vp.length > 1) h += G.path("M" + vp.map(p => p[0] + "," + p[1]).join(" L"), "sblue");
    S.vals.forEach((v, i) => {
      const x = cx(S, i);
      if (v === null) { h += G.t(x, P2.bot - 12, "?", "m"); return; }
      const y = y2(S, v);
      if (S.sel === "t" + i) h += G.circle(x, y, 13, "sok");
      if (S.drag.includes(i)) h += G.knob(x, y, "v" + i, 15) + G.t(x, y - 22, G.fmt(v), "a");
      else { const pv = i ? S.vals[i - 1] : null, below = pv !== null && pv > v;
        h += G.circle(x, y, 6, "fblue") + G.t(x - 9, below ? y + 20 : y - 9, G.fmt(v), "blue", "end"); }
      if (S.tapBot) h += hit(x - slot(S) / 2 + 3, P2.top - 8, slot(S) - 6, P2.bot - P2.top + 16, "t" + i);
    });
    S.labels.forEach((lb, i) => h += G.he(cx(S, i), P2.bot + 22, lb, "m", "middle"));
    return h + S.notes.join("");
  }
  function drag(L, key, pt) { const S = L.state, i = +key.slice(1); S.vals[i] = clamp(Math.round(v2(S, pt.y)), S.r2[0], S.r2[1]); }
  function dragFrom(L, pt) {
    const S = L.state; if (pt.y < P2.top - 20 || pt.y > P2.bot + 20) return null;
    const i = Math.floor((pt.x - X0) / slot(S)); return S.drag.includes(i) ? "v" + i : null;
  }
  function tap(L, key) { L.state.sel = key; }
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const S_ = L => L.state;
  const openDrag = (L, i) => { const S = S_(L); S.vals[i] = S.vals[i - 1]; S.drag = [i]; };
  const dragCheck = i => (L, e) => {
    if (e.type !== "drop") return null;
    const S = S_(L), v = S.vals[i], prev = S.vals[i - 1], c = S.chg[i], want = prev + c;
    if (v === want) return true;
    if (v === prev) return `זה עדיין הערך של ${S.names[i - 1]}. עכשיו הפעל עליו את השינוי של ${S.names[i]}: ${sg(c)}.`;
    if (v === prev - c) return `הפכת את הכיוון. השינוי הוא ${sg(c)}, כלומר ${c > 0 ? "עלייה" : "ירידה"}.`;
    if (v === START + c && i > 1) return `הוספת את השינוי לערך ההתחלתי. מוסיפים אותו לערך של החודש הקודם (${prev}).`;
    return `הערך הקודם הוא ${prev}, והשינוי הוא ${sg(c)}. כמה זה ביחד?`;
  };
  const fill = (L, upTo) => { const S = S_(L); for (let k = 0; k <= upTo; k++) S.vals[k] = VALS[k]; S.drag = []; };

  Lab.register({
    id: "cht-change", title: "מעבדת גרף שינויים", viewBox: "0 0 620 450",
    chapters: ["מה הנקודה אומרת", "קו יורד ≠ ירידה", "שחזור הכמות", "אחוז שינוי", "שאלת מבחן"],
    draw, drag, dragFrom, tap,
    steps: [
      { ch: 0, setup: L => { L.state = club({}); },
        say: "בחוג ריצה היו 50 חברים בהתחלה. הגרף העליון הוא <b>גרף שינויים</b>: כל נקודה אומרת בכמה השתנה מספר החברים לעומת החודש הקודם. הגרף התחתון ריק: נמלא אותו בהמשך.",
        task: "הנקודה של חודש 1 נמצאת על 10+. מה זה אומר?",
        choices: ["בסוף חודש 1 היו בחוג 10 חברים", "בחודש 1 נוספו 10 חברים", "מספר החברים עלה ב־10%"],
        check: pick(1, { 0: "זו המלכודת הראשונה: הגרף לא מראה כמה חברים יש, אלא בכמה המספר השתנה.", 2: "הציר מראה מספר חברים שנוספו, לא אחוזים." }),
        ok: "נוספו 10 חברים. כדי לדעת כמה יש בפועל צריך ערך התחלתי (50) ולהוסיף את השינוי." },
      { ch: 0, setup: L => { S_(L).tapTop = true; }, say: "קו האפס הוא הקו החשוב בגרף הזה.", task: "לחץ על החודש שבו מספר החברים לא השתנה.",
        demo: L => { S_(L).sel = "c5"; L.act({ type: "tap", key: "c5" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const i = +e.key.slice(1);
          return i === 5 ? true : i === 4 ? "כאן הנקודה מתחת לאפס: מספר החברים ירד. חפש נקודה שיושבת בדיוק על קו האפס." : "הנקודה הזאת מעל האפס: נוספו חברים. חפש נקודה שיושבת בדיוק על קו האפס."; },
        ok: "חודש 5: שינוי 0. מספר החברים נשאר כמו בחודש 4." },

      { ch: 1, setup: L => { const S = S_(L); S.sel = null; },
        say: "ועכשיו המלכודת הגדולה של הנושא.", task: "לחץ על החודש (או החודשים) שבהם מספר החברים <b>ירד</b>.",
        demo: L => { S_(L).sel = "c4"; L.act({ type: "tap", key: "c4" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const i = +e.key.slice(1);
          if (i === 4) return true;
          if (i === 2 || i === 3) return "נכון שהקו יורד כאן, אבל הנקודה מעל האפס: גם בחודש הזה <b>נוספו</b> חברים, רק פחות מבחודש הקודם.";
          if (i === 5) return "0 = אין שינוי, לא ירידה.";
          return "הנקודה הזאת מעל האפס: נוספו חברים."; },
        ok: "רק בחודש 4: הנקודה היחידה מתחת לאפס (14−). ירידה של הקו מ־10+ ל־4+ היא לא ירידה במספר החברים." },
      { ch: 1, setup: L => { const S = S_(L); S.tapTop = false; S.sel = null; },
        say: "ניחוש לפני שנשחזר את המספרים.", task: "באיזה חודש היה בחוג המספר <b>הגדול ביותר</b> של חברים?",
        choices: ["חודש 1", "חודש 3", "חודש 6"],
        check: (L, e) => { if (e.type !== "choice") return null; L.memo.guess = e.j; return true; },
        ok: "נבדוק עוד מעט. קודם כלל העבודה עם הגרף הזה." },
      { ch: 1, say: "בגרף שינויים הקו רק מבלבל: הוא מראה איך השינוי השתנה, לא איך הכמות השתנתה.", task: "לחץ על 'הסתר את הקו'.",
        tools: () => [["הסתר את הקו", L => { S_(L).line = false; L.render(); L.act({ type: "hide" }); }, true]],
        demo: L => { S_(L).line = false; L.act({ type: "hide" }); },
        check: (L, e) => e.type === "hide" ? true : null,
        ok: "מעכשיו מסתכלים רק על הנקודות ועל הסימן שלהן: מעל האפס עלייה, מתחת ירידה, על האפס ללא שינוי." },

      { ch: 2, setup: L => { S_(L).line = false; openDrag(L, 1); },
        say: "עכשיו בונים שורה של ערכים אמיתיים, כמו שהקורס ממליץ. מתחילים מ־50.", task: "גרור את הנקודה של חודש 1 (בגרף התחתון) למספר החברים בסוף חודש 1.",
        demo: L => { S_(L).vals[1] = 60; L.act({ type: "drop", key: "v1" }); },
        check: dragCheck(1), ok: "50 + 10 = 60." },
      { ch: 2, setup: L => openDrag(L, 2), say: "ממשיכים מהערך החדש.", task: "גרור את הנקודה של חודש 2.",
        demo: L => { S_(L).vals[2] = 66; L.act({ type: "drop", key: "v2" }); },
        check: dragCheck(2), ok: "60 + 6 = 66. <b>ערך(n) = ערך(n−1) + שינוי(n)</b>." },
      { ch: 2, setup: L => { fill(L, 3); openDrag(L, 4); }, say: "השלמתי את חודש 3: 66 + 4 = 70. עכשיו החודש עם השינוי השלילי.", task: "גרור את הנקודה של חודש 4.",
        demo: L => { S_(L).vals[4] = 56; L.act({ type: "drop", key: "v4" }); },
        check: dragCheck(4), ok: "70 − 14 = 56." },
      { ch: 2, setup: L => fill(L, 6),
        say: L => "השלמתי גם את חודשים 5 ו־6. הסתכל על הגרף התחתון: השיא הוא <b>חודש 3</b>, עם 70 חברים. " +
          (L.memo.guess === 1 ? "ניחשת נכון! " : L.memo.guess === 0 ? "ניחשת חודש 1, כי שם הנקודה העליונה הכי גבוהה. אבל זה רק השינוי הגדול ביותר. " : "") +
          "המספר עלה כל עוד השינויים היו חיוביים, כלומר עד חודש 3, וירד רק בחודש 4.",
        next: "הבנתי" },

      { ch: 3, setup: L => { const S = S_(L); S.tapBot = true; S.sel = null; },
        say: "אחוז שינוי = השינוי ÷ הערך <b>הקודם</b>. רוצים את אחוז השינוי בחודש 4 (14−).", task: "לחץ בגרף התחתון על הערך שבו מחלקים.",
        demo: L => { S_(L).sel = "t3"; L.act({ type: "tap", key: "t3" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const i = +e.key.slice(1);
          if (i === 3) return true;
          if (i === 4) return "זה הערך החדש, אחרי הירידה. משווים למה שהיה <b>לפני</b> השינוי.";
          if (i === 0) return "משווים לחודש הקודם, לא לערך ההתחלתי.";
          return "אחוז השינוי של חודש 4 נמדד ביחס לערך שהיה רגע לפניו, בסוף חודש 3."; },
        ok: "70, הערך בסוף חודש 3." },
      { ch: 3, setup: L => { S_(L).tapBot = false; }, say: "עכשיו החישוב.", task: "בכמה אחוזים ירד מספר החברים בחודש 4?",
        choices: ["14%", "20%", "25%", "28%"],
        check: pick(1, { 0: "14 זה השינוי במספר חברים, לא באחוזים. חלק אותו ב־70.", 2: "חילקת ב־56, הערך החדש. מחלקים בערך הקודם: 70.", 3: "חילקת ב־50, הערך ההתחלתי. מחלקים בערך הקודם: 70." }),
        ok: "14 ÷ 70 = 0.2, כלומר ירידה של 20%." },

      { ch: 4, setup: L => { L.state = club({ labels: ["2020", "2021", "2022", "2023", "2024"], names: ["2020", "2021", "2022", "2023", "2024"], chg: [null, 12, -4, -8, 6], r1: [-15, 15, 5], r2: [70, 100, 5],
          vals: [80, 80, 80, 80, 80], drag: [1, 2, 3, 4], line: true, title: "מחיר מוצר (בש״ח)", t1: "שינוי לעומת השנה הקודמת", t2: "דף טיוטה: אפשר לגרור" }); },
        say: "שאלה ברמת מבחן. ב־2020 המחיר היה 80 ₪. הגרף התחתון הוא טיוטה, אם תרצה לשחזר.",
        task: "באיזו שנה המחיר היה שווה למחיר ב־2020?", choices: ["2021", "2022", "2023", "2024"],
        check: pick(2, { 0: "ב־2021 המחיר עלה ב־12, ל־92.", 1: "הקו חוצה כאן את האפס, אבל זה לא אומר כלום. 92 − 4 = 88.", 3: "שחזר עד 2023 וראה מה קורה שם. ב־2024: 80 + 6 = 86." }),
        ok: "80 → 92 → 88 → 80 → 86. ב־2023 המחיר חזר ל־80, למרות שאף נקודה בגרף לא נמצאת על 80 ולא על אפס." },
      { ch: 4, say: "<b>סיכום המעבדה:</b><br>1. בגרף שינויים כל נקודה היא שינוי לעומת התקופה הקודמת, לא כמות.<br>2. מתעלמים מהקו. מעל האפס עלייה, מתחת ירידה.<br>3. משחזרים שורת ערכים: ערך(n) = ערך(n−1) + שינוי(n).<br>4. אחוז שינוי = שינוי ÷ הערך הקודם.", next: "סיום המעבדה" },
    ],
  });
})();
