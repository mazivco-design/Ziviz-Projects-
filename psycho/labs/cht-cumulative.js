/* Lab: גרף מצטבר — cumulative line with draggable points, toggle to per-month bars, jump brackets, leveling line. */
(function () {
  const { G } = Lab;
  const X0 = 70, X1 = 560, Y0 = 290, YT = 80;
  const MONTHS = ["ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יוני"];
  const MFULL = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני"];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const yOf = (S, v) => Y0 - v / S.ymax * (Y0 - YT);
  const vOf = (S, y) => (Y0 - y) / (Y0 - YT) * S.ymax;
  const slot = S => (X1 - X0) / S.labels.length;
  const cx = (S, i) => X0 + slot(S) * (i + .5);
  const hit = (x, y, w, h, key) => G.tap(G.rect(x, y, w, h, "hot", { fill: "none", "pointer-events": "all" }), key);

  const st = o => Object.assign({ view: "cum", labels: MONTHS, ymax: 30, ystep: 5, title: "", unit: "", cum: [], bars: [], cumGhost: false, barGhost: false,
    dragPts: [], dragBars: [], tapPts: false, sel: [], brackets: [], cumVals: true, barVals: true, level: null, levelRange: null, notes: [] }, o);

  function grid(S) {
    let h = G.he(600, 30, S.title, "b", "right") + (S.unit ? G.he(600, 54, S.unit, "m", "right") : "");
    for (let v = 0; v <= S.ymax; v += S.ystep) {
      const y = yOf(S, v);
      h += G.line(X0, y, X1, y, v ? "mut" : "ink", v ? { opacity: .35 } : {}) + G.t(X0 - 10, y + 5, G.fmt(v), "m", "end");
    }
    h += G.line(X0, YT - 8, X0, Y0, "ink");
    S.labels.forEach((lb, i) => h += G.he(cx(S, i), Y0 + 24, lb, "m", "middle"));
    // legend for the view that is shown
    const lg = [];
    if (S.view === "cum" || S.cumGhost) lg.push(["sa", "מצטבר"]);
    if (S.view === "bars" || S.barGhost) lg.push(["fblue-soft", "בכל חודש"]);
    lg.forEach(([cls, nm], k) => {
      const x = X0 + 80 + k * 120;
      h += cls === "sa" ? G.line(x - 2, YT - 40, x + 18, YT - 40, "sa") + G.circle(x + 8, YT - 40, 4, "fa") : G.rect(x, YT - 47, 16, 14, cls);
      h += G.he(x - 6, YT - 35, nm, "m", "right");
    });
    return h;
  }
  function barsLayer(S, vals, ghost) {
    const bw = Math.min(46, slot(S) * .55); let h = "";
    vals.forEach((v, i) => {
      if (v === null || v === undefined) { h += G.rect(cx(S, i) - bw / 2, YT, bw, Y0 - YT, "ghost"); return; }
      const y = yOf(S, v);
      h += G.rect(cx(S, i) - bw / 2, y, bw, Y0 - y, "fblue-soft", ghost ? { opacity: .55 } : {});
      if (S.barVals) { const drg = !ghost && S.dragBars.includes(i), tall = Y0 - y >= 24;
        h += G.t(cx(S, i), tall ? Y0 - 7 : y - (drg ? 22 : 8), G.fmt(v), ghost ? "m" : "blue"); }
    });
    if (!ghost) S.dragBars.forEach(i => { if (vals[i] !== null) h += G.knob(cx(S, i), yOf(S, vals[i]), "b" + i, 15); });
    return h;
  }
  function cumLayer(S, ghost) {
    const pts = []; S.cum.forEach((v, i) => { if (v !== null && v !== undefined) pts.push([cx(S, i), yOf(S, v), v, i]); });
    let h = "";
    if (pts.length > 1) h += G.path("M" + pts.map(p => p[0] + "," + p[1]).join(" L"), ghost ? "dash" : "sa");
    pts.forEach(([x, y, v, i]) => {
      if (S.dragPts.includes(i)) return;
      h += G.circle(x, y, ghost ? 4 : 6, ghost ? "dot" : "fa");
      if (S.cumVals) h += G.t(x - 9, y - 9, G.fmt(v), ghost ? "m" : "a", "end");
      if (S.sel.includes(i)) h += G.circle(x, y, 13, "sok");
    });
    if (S.tapPts) S.cum.forEach((v, i) => h += hit(cx(S, i) - slot(S) / 2 + 3, YT - 10, slot(S) - 6, Y0 - YT + 40, "p" + i));
    S.dragPts.forEach(i => h += G.knob(cx(S, i), yOf(S, S.cum[i]), "p" + i, 15) + G.t(cx(S, i), yOf(S, S.cum[i]) - 22, G.fmt(S.cum[i]), "a"));
    return h;
  }
  function bracket(S, i, j) {
    const a = i < 0 ? 0 : S.cum[i], b = S.cum[j], x = cx(S, j) + 22, ya = yOf(S, a), yb = yOf(S, b);
    let h = G.line(i < 0 ? X0 : cx(S, i), ya, x + 6, ya, "dash");
    h += G.line(x, ya, x, yb, "sok") + G.line(x - 5, yb, x + 5, yb, "sok") + G.line(x - 5, ya, x + 5, ya, "sok");
    h += G.t(x + 8, (ya + yb) / 2 + 6, "+" + G.fmt(b - a), "ok", "start");
    return h;
  }
  function levelLayer(S) {
    if (S.level === null) return "";
    const [a, b] = S.levelRange, xa = cx(S, a) - slot(S) / 2 + 6, xb = cx(S, b) + slot(S) / 2 - 6, y = yOf(S, S.level), n = b - a + 1;
    let h = G.rect(xa, y, xb - xa, Y0 - y, "fsoft", { opacity: .55 });
    h += G.line(xa, y, X1 + 10, y, "sa", { "stroke-dasharray": "8 5" }) + G.knob(X1 + 28, y, "lv", 15);
    h += G.t(xa + 6, YT - 14, n + " × " + G.fmt(S.level) + " = " + G.fmt(n * S.level), "a", "start");
    return h;
  }

  function draw(L) {
    const S = L.state; let h = grid(S);
    if (S.view === "bars") { if (S.cumGhost) h += cumLayer(Object.assign({}, S, { dragPts: [], tapPts: false, sel: [] }), true); h += levelLayer(S) + barsLayer(S, S.bars, false); }
    else { if (S.barGhost) h += barsLayer(S, S.bars, true); S.brackets.forEach(([i, j]) => h += bracket(S, i, j)); h += cumLayer(S, false); }
    return h + S.notes.join("");
  }
  function drag(L, key, pt) {
    const S = L.state, v = clamp(Math.round(vOf(S, pt.y)), 0, S.ymax), i = +key.slice(1);
    if (key[0] === "p") S.cum[i] = v; else if (key[0] === "b") S.bars[i] = v; else if (key === "lv") S.level = v;
  }
  function dragFrom(L, pt) {
    const S = L.state; if (pt.y < YT - 20 || pt.y > Y0 + 20) return null;
    if (S.level !== null && Math.abs(pt.y - yOf(S, S.level)) < 18) return "lv";
    const i = Math.floor((pt.x - X0) / slot(S));
    if (S.view === "bars" && S.dragBars.includes(i)) return "b" + i;
    if (S.view === "cum" && S.dragPts.includes(i)) return "p" + i;
    return null;
  }
  function tap(L, key) {
    const S = L.state, i = +key.slice(1);
    if (S.pickTwo) { S.sel = S.sel.includes(i) ? S.sel.filter(k => k !== i) : S.sel.concat(i).slice(-2); const s = [...S.sel].sort((a, b) => a - b); S.brackets = s.length === 2 ? [[s[0], s[1]]] : []; }
    else { S.sel = [i]; S.brackets = [[i - 1, i]]; }
  }
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const S_ = L => L.state;

  const BOOKS = [4, 6, 0, 5, 3, 7], BOOKS_C = [4, 10, 10, 15, 18, 25];
  const SAVE = [5, 4, 6, 0, 2, 3], SAVE_C = [5, 9, 15, 15, 17, 20];
  const save = o => st(Object.assign({ cum: SAVE_C.slice(), ymax: 25, title: "החיסכון של דנה – מצטבר", unit: "(באלפי ₪, מתחילת השנה)" }, o));
  const barHint = (S, i, v) => v === SAVE_C[i] ? `${v} זה הערך המצטבר: כל מה שנחסך עד סוף ${MFULL[i]}. כמה נוסף ב${MFULL[i]} עצמו?` :
    `בדוק: הנקודה של ${MFULL[i]} (${SAVE_C[i]}) פחות הנקודה של ${MFULL[i - 1]} (${SAVE_C[i - 1]}).`;

  Lab.register({
    id: "cht-cumulative", title: "מעבדת גרף מצטבר", viewBox: "0 0 620 360",
    chapters: ["מה זה מצטבר", "ממצטבר לחודשי", "קטע אופקי ושיפוע", "סכום של כמה חודשים", "ממוצע", "שאלת מבחן"],
    draw, drag, dragFrom, tap,
    steps: [
      { ch: 0, setup: L => { L.state = st({ title: "ספרים שקראה מיכל", unit: "(מספר ספרים)", barGhost: true, bars: BOOKS.slice(), cum: [4, 0, null, null, null, null], dragPts: [1] }); },
        say: "העמודות מראות כמה ספרים קראה מיכל <b>בכל חודש</b>. הנקודות הוורודות הן גרף <b>מצטבר</b>: כמה קראה מתחילת השנה ועד סוף החודש. בינואר זה אותו דבר: 4.",
        task: "גרור את הנקודה של פברואר לגובה הנכון בגרף המצטבר.",
        demo: L => { S_(L).cum[1] = 10; L.act({ type: "drop", key: "p1" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const v = S_(L).cum[1]; return v === 10 ? true :
          v === 6 ? "6 זה רק מה שקראה בפברואר. מצטבר = כל מה שנקרא עד עכשיו: 4 + 6." : "כמה ספרים קראה מתחילת השנה ועד סוף פברואר? ינואר ועוד פברואר."; },
        ok: "4 + 6 = 10. כל נקודה במצטבר = הנקודה הקודמת + מה שנוסף בחודש הנוכחי." },
      { ch: 0, setup: L => { const S = S_(L); S.dragPts = [2]; S.cum[2] = 0; },
        say: "במרץ מיכל לא קראה אף ספר.", task: "גרור את הנקודה של מרץ.",
        demo: L => { S_(L).cum[2] = 10; L.act({ type: "drop", key: "p2" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const v = S_(L).cum[2]; return v === 10 ? true :
          v === 0 ? "0 זה מה שקראה במרץ. אבל 10 הספרים מינואר ופברואר לא נעלמו." : v > 10 ? "במרץ לא נוסף אף ספר, אז הסכום לא גדל." : "המצטבר לא יכול לרדת. הספרים שכבר נקראו נשארים בספירה."; },
        ok: "10 גם במרץ. בגרף זה נראה כ<b>קטע אופקי</b>: החודש שבו לא נוסף כלום." },
      { ch: 0, setup: L => { const S = S_(L); S.dragPts = []; S.cum = BOOKS_C.slice(); },
        say: "השלמתי את שאר הנקודות. במאי קראה רק 3, פחות מאשר באפריל.", task: "האם גרף מצטבר יכול לרדת?",
        choices: ["כן, בחודש שקוראים בו פחות מבחודש הקודם", "לא. לכל היותר הוא נשאר באותו גובה", "כן, בחודש שלא קוראים בו בכלל"],
        check: pick(1, { 0: "הסתכל על מאי: קראה רק 3, ובכל זאת הנקודה עלתה מ־15 ל־18. חודש חלש רק מוסיף מעט.", 2: "הסתכל על מרץ: לא קראה כלום, והנקודה נשארה על 10." }),
        ok: "מצטבר הוא כמו חשבון שרק מפקידים אליו: הוא עולה או נשאר, אף פעם לא יורד." },

      { ch: 1, setup: L => { L.state = save({ view: "bars", cumGhost: true, bars: [5, 0, null, null, null, null], dragBars: [1] }); },
        say: "עכשיו בכיוון ההפוך, כמו בבחינה: נתון רק הגרף המצטבר (קו מקווקו). רוצים לדעת כמה נחסך <b>בכל חודש</b>. בינואר אין ערך קודם, ולכן העמודה היא 5.",
        task: "גרור את העמודה של פברואר לגובה של מה שנחסך בפברואר בלבד.",
        demo: L => { S_(L).bars[1] = 4; L.act({ type: "drop", key: "b1" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const v = S_(L).bars[1]; return v === 4 ? true : barHint(S_(L), 1, v); },
        ok: "9 − 5 = 4. <b>תוספת בחודש = מצטבר עכשיו − מצטבר בחודש הקודם.</b>" },
      { ch: 1, setup: L => { const S = S_(L); S.bars[2] = 0; S.dragBars = [2]; }, say: "אותו דבר למרץ.", task: "גרור את העמודה של מרץ.",
        demo: L => { S_(L).bars[2] = 6; L.act({ type: "drop", key: "b2" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const v = S_(L).bars[2]; return v === 6 ? true : barHint(S_(L), 2, v); },
        ok: "15 − 9 = 6. שים לב: העמודה של מרץ נמוכה בהרבה מהנקודה של מרץ. מי שעונה עם הערך המצטבר טועה." },

      { ch: 2, setup: L => { L.state = save({}); },
        say: "בגרף המצטבר, בין מרץ לאפריל הקו אופקי: 15 ואז שוב 15.", task: "מה קרה באפריל?",
        choices: ["דנה משכה כסף מהחיסכון", "דנה לא חסכה כלום", "דנה חסכה 15 אלף ₪"],
        check: pick(1, { 0: "משיכה הייתה מורידה את הקו. בגרף מצטבר של חיסכון הקו לא יורד.", 2: "15 זה כל מה שנחסך עד אפריל. כמה <i>נוסף</i> באפריל? 15 − 15." }),
        ok: "15 − 15 = 0. קטע אופקי = תוספת אפס, לא ירידה." },
      { ch: 2, setup: L => { L.state = save({ view: "bars", cumGhost: true, bars: [5, 4, 6, 0, 0, 0], dragBars: [3, 4, 5] }); },
        say: "השלם את שלושת החודשים האחרונים.", task: "גרור את העמודות של אפריל, מאי ויוני לגובה הנכון.",
        demo: L => { S_(L).bars = SAVE.slice(); L.act({ type: "drop", key: "b5" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const S = S_(L), i = +e.key.slice(1);
          if (S.bars[i] !== SAVE[i]) return barHint(S, i, S.bars[i]);
          return [3, 4, 5].every(k => S.bars[k] === SAVE[k]) ? true : null; },
        ok: "אפריל 0 (כבר היה נכון), מאי 2, יוני 3. בדיקה: 5+4+6+0+2+3 = 20, בדיוק הנקודה האחרונה במצטבר." },
      { ch: 2, setup: L => { L.state = st({ title: "צעדים של רון – מצטבר", unit: "(באלפים, מתחילת החודש; לפי שבוע)", labels: ["1", "2", "3", "4", "5", "6"], cum: [3, 8, 10, 17, 19, 24], tapPts: true, cumVals: false }); },
        say: "גרף חדש, הפעם בלי מספרים. ככל שהקטע <b>תלול</b> יותר, נוסף יותר באותה תקופה.",
        task: "באיזה שבוע רון צעד הכי הרבה? לחץ על הנקודה של השבוע.",
        demo: L => { const S = S_(L); S.sel = [3]; S.brackets = [[2, 3]]; L.act({ type: "tap", key: "p3" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const i = +e.key.slice(1);
          return i === 3 ? true : i === 5 ? "זו הנקודה הגבוהה ביותר, כלומר הסכום עד הסוף. חפש את הקטע התלול ביותר, את הקפיצה הגדולה." : "הירוק מראה כמה נוסף בשבוע הזה. יש שבוע עם קפיצה גדולה יותר."; },
        ok: "שבוע 4: קפיצה מ־10 ל־17, כלומר 7 אלף צעדים. התלול ביותר = הכי הרבה." },

      { ch: 3, setup: L => { L.state = save({ tapPts: true, pickTwo: true }); },
        say: "חזרה לחיסכון של דנה. שאלה: כמה חסכה מפברואר עד מאי (כולל)? לא צריך לחבר חודש־חודש: מספיק להפחית שתי נקודות.",
        task: "לחץ על שתי הנקודות שההפרש ביניהן הוא החיסכון מפברואר עד מאי.",
        demo: L => { const S = S_(L); S.sel = [0, 4]; S.brackets = [[0, 4]]; L.act({ type: "tap", key: "p4" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const s = [...S_(L).sel].sort((a, b) => a - b); if (s.length < 2) return null;
          if (s[0] === 0 && s[1] === 4) return true;
          if (s[0] === 1 && s[1] === 4) return "הנקודה של פברואר כבר כוללת את מה שנחסך בפברואר, ואז הוא היה נמחק. צריך את הנקודה <b>שלפני</b> התקופה: ינואר.";
          if (s[1] !== 4) return "סוף התקופה הוא מאי. אחת הנקודות צריכה להיות של מאי.";
          return "התחלת מוקדם מדי. הנקודה השנייה היא החודש שלפני פברואר."; },
        ok: "17 − 5 = 12 אלף ₪. בדיקה: 4 + 6 + 0 + 2 = 12. <b>סכום מחודש a עד b = מצטבר(b) − מצטבר(a−1).</b>" },

      { ch: 4, setup: L => { L.state = save({}); },
        say: "שאלה נפוצה: ממוצע לחודש בחלק מהתקופה.", task: "מה הממוצע החודשי של החיסכון בחודשים פברואר עד יוני?",
        choices: ["3", "3⅓", "4", "15"],
        check: pick(0, { 1: "חילקת 20 ב־6. אבל 20 כולל גם את ינואר, והשאלה רק על פברואר עד יוני.", 2: "חילקת 20 ב־5. אבל 20 כולל גם את ינואר. קודם תוספת: 20 − 5.", 3: "15 זה הסכום שנחסך בתקופה. ממוצע = הסכום ÷ מספר החודשים." }),
        ok: "התוספת בתקופה: 20 − 5 = 15, בחמישה חודשים: 15 ÷ 5 = 3. בוא נראה את זה." },
      { ch: 4, setup: L => { L.state = save({ view: "bars", bars: SAVE.slice(), cumGhost: false, level: 0, levelRange: [1, 5], title: "החיסכון של דנה – בכל חודש", unit: "(באלפי ₪)" }); },
        say: "אלה העמודות החודשיות. ממוצע = הגובה שבו כל חמשת החודשים (פברואר עד יוני) שווים, וביחד נותנים אותו סכום.",
        task: "גרור את הקו הוורוד לגובה הממוצע של פברואר עד יוני.",
        demo: L => { S_(L).level = 3; L.act({ type: "drop", key: "lv" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const v = S_(L).level; return v === 3 ? true :
          `5 חודשים × ${v} = ${5 * v}, אבל בחודשים האלה נחסכו 4+6+0+2+3 = 15.`; },
        ok: "5 × 3 = 15. הממוצע מחושב מהתוספות, לא מהערך המצטבר." },

      { ch: 5, setup: L => { L.state = st({ title: "מבקרים חדשים באתר – מצטבר", unit: "(באלפים, מתחילת השבוע)", labels: ["יום 1", "יום 2", "יום 3", "יום 4", "יום 5"], cum: [6, 14, 14, 23, 30] }); },
        say: "שאלה ברמת מבחן.", task: "בכמה מהימים נוספו יותר מ־7,000 מבקרים חדשים?",
        choices: ["1", "2", "3", "4"],
        check: pick(1, { 0: "בדוק שוב את יום 2: 14 − 6.", 2: "יום 5: 30 − 23 = 7, וזה לא <i>יותר</i> מ־7.", 3: "ספרת ערכים מצטברים שגדולים מ־7. צריך את התוספת של כל יום." }),
        ok: "התוספות: 6, 8, 0, 9, 7. רק ביום 2 וביום 4 נוספו יותר מ־7 אלף." },
      { ch: 5, say: "<b>סיכום המעבדה:</b><br>1. מצטבר = כל מה שהיה עד הנקודה. הוא לא יורד.<br>2. תוספת בתקופה = מצטבר עכשיו − מצטבר קודם. קטע אופקי = 0.<br>3. סכום מ־a עד b = מצטבר(b) − מצטבר(a−1).<br>4. ממוצע מחשבים מהתוספת בתקופה, לא מהמצטבר.", next: "סיום המעבדה" },
    ],
  });
})();
