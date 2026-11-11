/* Lab: הספק — פסי עבודה על ציר שעות (השוואת זמנים), מיכל שמתמלא (הספק משותף, צינור מרוקן), רשת ימי עבודה (צוות). */
(function () {
  const { G } = Lab;
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const near = (a, b) => Math.abs(a - b) < 1e-6;
  const snapTo = (v, s) => Math.round(v / s) * s;
  const hm = t => { const h = Math.floor(t + 1e-9), m = Math.round((t - h) * 60); return h + ":" + String(m).padStart(2, "0"); };

  // ---------- rows on an hours axis ----------
  const RX0 = 40, RX1 = 440;
  const rows = o => Object.assign({ mode: "rows", H: 14, t: 0, snap: 1, labStep: 2, rows: [] }, o);
  const rx = (S, h) => RX0 + (RX1 - RX0) * h / S.H;
  let RY0 = 80; const RY = i => RY0 + i * 78;
  function drawRows(S) {
    let h = ""; RY0 = S.rows.length === 1 ? 130 : 90;
    const ay = RY(S.rows.length) - 8;
    S.rows.forEach((r, i) => {
      const y = RY(i), done = S.t / r.p;
      for (let k = 0; k * r.p < S.H - 1e-9; k++) {
        const a = k * r.p, b = Math.min(S.H, (k + 1) * r.p), xa = rx(S, a), xb = rx(S, b), full = S.t >= (k + 1) * r.p - 1e-9 && (k + 1) * r.p <= S.H + 1e-9;
        h += G.rect(xa, y, xb - xa, 46, "ghost");
        const f = Math.max(0, Math.min(S.t, b) - a);
        if (f > 0 && !r.dots) h += G.rect(xa, y, rx(S, f) - RX0, 46, full ? r.cls : r.cls === "fa" ? "fsoft" : "fblue-soft");
        if (r.dots) for (let j = 0; j < r.dots; j++) { const cx = xa + (xb - xa) * (j + .5) / r.dots; h += G.circle(cx, y + 23, 7, (k * r.dots + j + 1) <= S.t / r.p * r.dots + 1e-9 ? r.cls : "ghost"); }
        else if (full && xb - xa >= 26) h += G.t((xa + xb) / 2, y + 29, k + 1, "inv");
      }
      h += G.he(612, y + 18, r.label, "b", "right");
      const cnt = r.dots ? G.fmt(S.t / r.p * r.dots) : near(done, Math.round(done)) ? String(Math.round(done)) : Math.floor(done) + " + חלק";
      h += G.he(612, y + 42, (r.unit || "עבודות") + ": " + cnt, r.dots || near(done, Math.round(done)) ? "a" : "m", "right");
    });
    h += G.line(RX0, ay, RX1, ay, "ink");
    for (let k = 0; k <= S.H; k++) { const x = rx(S, k); h += G.line(x, ay, x, ay + (k % S.labStep ? 4 : 8), "thin"); if (k % S.labStep === 0) h += G.t(x, ay + 24, k, "m"); }
    h += G.he(612, ay + 24, "שעות", "m", "right");
    const cx = rx(S, S.t);
    h += G.line(cx, RY0 - 18, cx, ay, "sa");
    h += G.knob(cx, ay + 46, "t", 15);
    h += G.he(cx, RY0 - 26, G.fmt(S.t) + " שעות", "a");
    return h;
  }

  // ---------- tank ----------
  const TX = 210, TW = 200, TY = 70, TH = 220, SL0 = 110, SL1 = 510, SLY = 330;
  const tank = o => Object.assign({ mode: "tank", t: 0, tmax: 4, snap: .2, taps: [] }, o);
  const level = S => S.taps.reduce((s, p) => s + p.sign * S.t / p.p, 0);
  function drawTank(S) {
    let h = "";
    const lv = level(S), fills = S.taps.filter(p => p.sign > 0), drains = S.taps.filter(p => p.sign < 0);
    h += G.rect(TX, TY, TW, TH, "bg");
    for (let q = 1; q < 4; q++) h += G.line(TX, TY + TH * q / 4, TX + 12, TY + TH * q / 4, "mut");
    if (!drains.length) {
      let y = TY + TH;
      let used = 0; fills.forEach(p => { const part = Math.min(S.t / p.p, 1 - used); used += part; const hh = part * TH; y -= hh; h += G.rect(TX, y, TW, hh, p.cls); if (hh > 26) h += G.t(TX + TW / 2, y + hh / 2 + 6, G.fmt(Math.round(S.t / p.p * 100) / 100), "inv"); });
    } else {
      const hh = Math.max(0, Math.min(1, lv)) * TH; h += G.rect(TX, TY + TH - hh, TW, hh, "fblue");
    }
    if (lv > 1 + 1e-9) h += G.rect(TX - 8, TY - 14, TW + 16, 14, "fwarn") + G.he(TX + TW / 2, TY - 22, "גולש!", "w");
    h += G.rect(TX, TY, TW, TH, "ink");
    // taps
    fills.forEach((p, i) => {
      const x = i === 0 ? TX + TW - 40 : TX + 40;
      h += G.rect(x - 9, TY - 44, 18, 30, p.cls === "fa" ? "fsoft" : "fblue-soft");
      if (S.t > 0 && S.t < S.tmax + 1 && lv <= 1 + 1e-9) h += G.line(x, TY - 14, x, TY + TH - Math.min(1, lv) * TH, p.cls === "fa" ? "sa" : "sblue", { "stroke-dasharray": "3 4" });
      h += G.he(i === 0 ? 612 : TX - 12, TY - 22, p.label, p.cls === "fa" ? "a" : "blue", "right");
    });
    drains.forEach(p => {
      h += G.rect(TX - 34, TY + TH - 26, 34, 16, "fwarn");
      h += G.he(TX - 12, TY + TH - 40, p.label, "w", "right");
    });
    h += G.he(612, 140, "זמן", "m", "right") + G.t(560, 172, hm(S.t), "a big");
    h += G.he(612, 210, "מילוי", "m", "right") + G.t(560, 240, Math.round(Math.max(0, lv) * 100) + "%", Math.abs(lv - 1) < 1e-6 ? "ok big" : "big");
    if (drains.length) {
      const inn = fills.reduce((s, p) => s + S.t / p.p, 0), out = drains.reduce((s, p) => s + S.t / p.p, 0);
      h += G.he(TX - 12, 150, "נכנס: " + G.fmt(Math.round(inn * 100) / 100), "a", "right");
      h += G.he(TX - 12, 180, "יצא: " + G.fmt(Math.round(out * 100) / 100), "w", "right");
      h += G.he(TX - 12, 210, "(בריכות)", "m", "right");
    }
    // time slider
    const sx = v => SL0 + (SL1 - SL0) * v / S.tmax;
    h += G.line(SL0, SLY, SL1, SLY, "mut");
    for (let k = 0; k <= S.tmax; k++) h += G.line(sx(k), SLY - 6, sx(k), SLY + 6, "thin") + G.t(sx(k), SLY + 26, k, "m");
    h += G.he(SL1 + 90, SLY + 5, "שעות", "m", "right");
    h += G.knob(sx(S.t), SLY, "tt", 15);
    return h;
  }

  // ---------- crew grid ----------
  const CS = 27, GX1 = 400, GY0 = 70;
  const crew = o => Object.assign({ mode: "crew", workers: 6, days: 4, need: 24, dragDays: false, maxD: 9 }, o);
  function drawCrew(S) {
    let h = "", n = 0;
    const gx0 = GX1 - S.maxD * CS;
    for (let c = 0; c < S.maxD; c++) for (let r = 0; r < S.workers; r++) {
      const x = GX1 - (c + 1) * CS, y = GY0 + r * CS;
      if (c < S.days) { n++; h += G.rect(x, y, CS, CS, n > S.need ? "fwarn" : "fok-soft"); } else h += G.rect(x, y, CS, CS, "ghost", { opacity: .5 });
    }
    const gb = GY0 + S.workers * CS;
    for (let r = 0; r < S.workers; r++) h += G.circle(GX1 + 18, GY0 + r * CS + CS / 2, 8, "fblue");
    h += G.he(GX1 + 34, GY0 + S.workers * CS / 2 + 5, S.workers + " פועלים", "blue", "left");
    for (let c = 0; c < S.maxD; c++) h += G.t(GX1 - c * CS - CS / 2, GY0 - 10, c + 1, "m");
    h += G.he(GX1 + 34, GY0 - 10, "ימים", "m", "left");
    const dx = GX1 - S.days * CS;
    h += G.line(dx, GY0 - 4, dx, gb + 6, "sa");
    if (S.dragDays) h += G.knob(dx, gb + 28, "d", 15);
    h += G.he(GX1 - S.days * CS / 2, gb + 60, S.days + " ימים", "a");
    const tot = S.workers * S.days, ok = tot === S.need;
    h += G.he(gx0 - 6, GY0 + 40, "ימי עבודה", "m", "right") + G.t(gx0 - 30, GY0 + 72, tot, ok ? "ok big" : "big", "end");
    h += G.he(gx0 - 6, GY0 + 112, "הגדר צריכה", "m", "right") + G.t(gx0 - 30, GY0 + 144, S.need, "big", "end");
    return h;
  }

  function draw(L) { const S = L.state; return S.mode === "rows" ? drawRows(S) : S.mode === "tank" ? drawTank(S) : drawCrew(S); }
  function drag(L, key, pt) {
    const S = L.state;
    if (key === "t") S.t = Math.max(0, Math.min(S.H, snapTo((pt.x - RX0) / (RX1 - RX0) * S.H, S.snap)));
    if (key === "tt") S.t = Math.max(0, Math.min(S.tmax, Math.round(snapTo((pt.x - SL0) / (SL1 - SL0) * S.tmax, S.snap) * 100) / 100));
    if (key === "d") S.days = Math.max(1, Math.min(S.maxD, Math.round((GX1 - pt.x) / CS)));
  }
  function dragFrom(L, pt) {
    const S = L.state;
    if (S.mode === "rows" && S.free !== false && pt.y > RY(S.rows.length) - 8 && pt.x > RX0 - 20 && pt.x < RX1 + 20) return "t";
    if (S.mode === "tank" && Math.abs(pt.y - SLY) < 30 && pt.x > SL0 - 20 && pt.x < SL1 + 20) return "tt";
    if (S.mode === "crew" && S.dragDays && pt.y > GY0 && pt.x < GX1 + 10) return "d";
    return null;
  }
  const drop = fn => (L, e) => e.type !== "drop" ? null : fn(L.state);

  Lab.register({
    id: "prb-work", title: "המחשה: הספק", viewBox: "0 0 620 370",
    chapters: ["עבודה = הספק × זמן", "השוואת זמנים", "ביחד", "צינור מרוקן", "צוות", "שאלת מבחן"],
    draw, drag, dragFrom,
    steps: [
      // ---- ch0
      { ch: 0, setup: L => { L.state = rows({ H: 6, snap: .5, labStep: 1, rows: [{ label: "אופה", p: 1, dots: 4, cls: "fa", unit: "עוגות" }] }); },
        say: "אופה מכין 8 עוגות ב־2 שעות, בקצב קבוע. כל משבצת בפס היא שעה אחת.",
        task: "מה ההספק שלו?", choices: ["16 עוגות לשעה", "4 עוגות לשעה", "2 שעות לעוגה", "8 עוגות לשעה"],
        check: pick(1, { 0: "כפלת עבודה בזמן. הספק = עבודה ÷ זמן.", 2: "הפכת את השבר. הספק הוא 'עבודה ליחידת זמן': עוגות לשעה.", 3: "8 עוגות לוקחות 2 שעות, לא שעה אחת." }),
        ok: "הספק = עבודה ÷ זמן = 8 ÷ 2 = <b>4 עוגות לשעה</b>. הספק הוא תמיד שבר: כמה עבודה ביחידת זמן." },
      { ch: 0,
        say: "עכשיו נפעיל את השעון. עבודה = הספק × זמן.",
        task: "גרור את הסמן בציר השעות לרגע שבו האופה מסיים בדיוק 14 עוגות.",
        demo: L => { L.state.t = 3.5; L.act({ type: "drop", key: "t" }); },
        check: drop(S => { const c = S.t * 4; return c === 14 ? true : c < 14 ? `יש רק ${c} עוגות. המשך ימינה.` : `כבר ${c} עוגות. חזור שמאלה.`; }),
        ok: "3.5 שעות: 4 × 3.5 = 14. בדרך של יחסים: 8 עוגות ↔ 2 שעות, 14 עוגות ↔ ? → 14 × 2 ÷ 8 = 3.5." },
      // ---- ch1
      { ch: 1, setup: L => { L.state = rows({ H: 14, rows: [{ label: "ברז א': 4 ש׳", p: 4, cls: "fa", unit: "בריכות" }, { label: "ברז ב': 6 ש׳", p: 6, cls: "fblue", unit: "בריכות" }] }); },
        say: "ברז א' ממלא בריכה ב־4 שעות, וברז ב' ב־6 שעות. כל מלבן הוא בריכה אחת. כדי לחבר את העבודה שלהם, מחפשים <b>זמן משותף</b> שבו כל אחד מסיים מספר שלם של בריכות.",
        task: "גרור את הסמן לזמן הראשון שבו <b>שני</b> הברזים מסיימים בריכות שלמות.",
        demo: L => { L.state.t = 12; L.act({ type: "drop", key: "t" }); },
        check: drop(S => { const a = S.t % 4 === 0, b = S.t % 6 === 0; if (S.t === 12) return true; if (S.t === 0) return "בזמן 0 עוד לא קרה כלום. גרור ימינה."; if (a && !b) return "ברז א' סיים בריכות שלמות, אבל ברז ב' באמצע בריכה."; if (b && !a) return "ברז ב' סיים בריכות שלמות, אבל ברז א' באמצע בריכה."; return S.t > 12 ? "עברת את הזמן הראשון. חזור שמאלה." : "שניהם באמצע בריכה. המשך לחפש."; }),
        ok: "ב־12 שעות: ברז א' מילא 3 בריכות וברז ב' מילא 2. (12 הוא המכפלה המשותפת של 4 ו־6.)" },
      { ch: 1, setup: L => { L.state.t = 12; L.state.free = false; },
        say: "עכשיו אפשר לחבר, כי מדובר באותו זמן.",
        task: "כמה בריכות ממלאים שני הברזים יחד ב־12 שעות?", choices: ["2", "3", "5", "6"],
        check: pick(2, { 0: "זה רק ברז ב'. גם ברז א' עבד.", 1: "זה רק ברז א'. גם ברז ב' עבד.", 3: "ספור את המלבנים המלאים בשתי השורות." }),
        ok: "3 + 2 = <b>5 בריכות ב־12 שעות</b>. מחברים עבודות (הספקים), לא זמנים." },
      { ch: 1,
        say: "רגע לפני החישוב, ניחוש.",
        task: "בכמה זמן ימלאו שני הברזים יחד בריכה אחת?", choices: ["5 שעות (ממוצע הזמנים)", "10 שעות (סכום הזמנים)", "2.4 שעות", "2 שעות"],
        check: pick(2, { 0: "יחד הם חייבים להיות מהירים יותר מהמהיר שבהם, שמסיים לבד ב־4 שעות.", 1: "כשעובדים יחד הזמן מתקצר, לא מתארך.", 3: "ב־2 שעות ברז א' ממלא חצי בריכה וברז ב' שליש. ביחד 5/6, עוד לא מלא." }),
        ok: "5 בריכות ב־12 שעות, ולכן בריכה אחת ב־12 ÷ 5 = 2.4 שעות. בוא נראה את זה במיכל." },
      // ---- ch2
      { ch: 2, setup: L => { L.state = tank({ tmax: 4, snap: .2, taps: [{ label: "א': בריכה ב־4 ש׳", p: 4, cls: "fa", sign: 1 }, { label: "ב': בריכה ב־6 ש׳", p: 6, cls: "fblue", sign: 1 }] }); },
        say: "בריכה אחת, ושני הברזים פתוחים. כל ברז מוסיף את החלק שלו (ורוד וכחול).",
        task: "גרור את השעון בתחתית עד שהבריכה מלאה בדיוק.",
        demo: L => { L.state.t = 2.4; L.act({ type: "drop", key: "tt" }); },
        check: drop(S => { const lv = level(S); return near(S.t, 2.4) ? true : lv > 1 ? "הבריכה גולשת. חזור קצת אחורה." : `הבריכה מלאה רק ב־${Math.round(lv * 100)}%. המשך.`; }),
        ok: "2.4 שעות = <b>שעתיים ו־24 דקות</b>. ברז א' מילא 0.6 מהבריכה וברז ב' 0.4. יחס 3:2, בדיוק כמו 3 בריכות מול 2 בהשוואת הזמנים." },
      { ch: 2,
        say: "עכשיו בלי מיכל. השתמש בהשוואת זמנים.",
        task: "פועל אחד מסיים עבודה ב־3 שעות, והשני ב־6 שעות. בכמה זמן יסיימו אותה יחד?", choices: ["שעתיים", "4.5 שעות", "9 שעות", "שעה וחצי"],
        check: pick(0, { 1: "זה ממוצע הזמנים. יחד הם מהירים יותר מהמהיר שבהם (3 שעות).", 2: "זה סכום הזמנים. יחד הזמן מתקצר.", 3: "בזמן משותף של 6 שעות הם עושים 2 + 1 = 3 עבודות, לא 4." }),
        ok: "זמן משותף 6 שעות: 2 + 1 = 3 עבודות, ולכן עבודה אחת בשעתיים. בנוסחה: 3 · 6 ÷ (3 + 6) = 2." },
      // ---- ch3
      { ch: 3, setup: L => { L.state = tank({ tmax: 8, snap: .5, taps: [{ label: "ברז: בריכה ב־3 ש׳", p: 3, cls: "fa", sign: 1 }, { label: "פתח: מרוקן ב־6 ש׳", p: 6, cls: "fwarn", sign: -1 }] }); },
        say: "ברז ממלא בריכה ב־3 שעות, אבל בתחתית יש פתח שמרוקן בריכה מלאה ב־6 שעות. שניהם פתוחים.",
        task: "לפני שמפעילים: בכמה זמן תתמלא הבריכה?", choices: ["שעתיים", "4.5 שעות", "6 שעות", "היא לא תתמלא אף פעם"],
        check: pick(2, { 0: "שעתיים זה אם שניהם היו <b>ממלאים</b>. הפתח מרוקן, ולכן מחסירים את ההספק שלו.", 1: "ממוצע זמנים לא עובד כאן, ולא בשום שאלת הספק.", 3: "הברז מהיר יותר מהפתח, אז המים בכל זאת עולים, לאט." }),
        ok: "בוא נבדוק את זה." },
      { ch: 3,
        say: "שים לב למונים משמאל: כמה נכנס וכמה יצא.",
        task: "גרור את השעון עד שהבריכה מלאה.",
        demo: L => { L.state.t = 6; L.act({ type: "drop", key: "tt" }); },
        check: drop(S => { const lv = level(S); return near(S.t, 6) ? true : lv > 1 ? "הבריכה גולשת. חזור אחורה." : `מלאה רק ב־${Math.round(lv * 100)}%. המשך.`; }),
        ok: "6 שעות: הברז הכניס 2 בריכות והפתח הוציא 1. נטו בריכה אחת. כלומר <b>מחסרים הספקים</b>: בזמן משותף של 6 שעות, 2 − 1 = 1 בריכה." },
      // ---- ch4
      { ch: 4, setup: L => { L.state = crew({}); },
        say: "6 פועלים בונים גדר ב־4 ימים. כל משבצת היא פועל אחד ביום אחד: 'יום עבודה'. בגדר יש 6 × 4 = 24 ימי עבודה, וזה הזמן שהיה לוקח לפועל אחד לבדו.",
        task: "אם יהיו 8 פועלים, כמה ימים זה ייקח?", next: "בוא נבדוק" },
      { ch: 4, setup: L => { Object.assign(L.state, { workers: 8, days: 1, dragDays: true }); },
        say: "עכשיו יש 8 שורות של פועלים. הגדר עדיין צריכה 24 ימי עבודה.",
        task: "גרור את הקו הוורוד (הידית שמתחת לרשת) עד שיהיו בדיוק 24 ימי עבודה.",
        demo: L => { L.state.days = 3; L.act({ type: "drop", key: "d" }); },
        check: drop(S => { const t = S.workers * S.days; return t === 24 ? true : t > 24 ? `${t} ימי עבודה, יותר ממה שהגדר צריכה. הזז ימינה.` : `רק ${t} ימי עבודה. הזז שמאלה.`; }),
        ok: "8 × 3 = 24, כלומר <b>3 ימים</b>. יותר פועלים → פחות ימים: יחס הפוך. וחשוב: פועלים × זמן ÷ עבודה = קבוע." },
      { ch: 4, setup: L => { L.state.dragDays = false; },
        say: "משנים כל נתון בנפרד ובודקים איך הוא משפיע.",
        task: "12 פועלים צריכים לבנות גדר <b>כפולה</b> באורכה. כמה ימים זה ייקח?", choices: ["יום אחד", "2 ימים", "4 ימים", "8 ימים"],
        check: pick(2, { 0: "יותר פועלים מקצרים את הזמן, אבל גדר כפולה מאריכה אותו. בדוק את שני השינויים.", 1: "שכחת שהגדר כפולה: היא צריכה 48 ימי עבודה.", 3: "גדר כפולה מכפילה את הזמן, אבל פי 2 פועלים מחלקים אותו בחצי." }),
        ok: "גדר כפולה = 48 ימי עבודה, ו־48 ÷ 12 = <b>4 ימים</b>. פי 2 עבודה → פי 2 זמן; פי 2 פועלים → חצי זמן." },
      // ---- ch5
      { ch: 5, setup: L => { L.state = rows({ H: 30, labStep: 5, rows: [{ label: "א' לבד: 10 ש׳", p: 10, cls: "fa", unit: "עבודות" }, { label: "יחד: 6 ש׳", p: 6, cls: "fblue", unit: "עבודות" }] }); },
        say: "שאלה ברמת מבחן. ציר השעות פתוח לשימוש חופשי.",
        task: "פועל א' מסיים עבודה לבדו ב־10 שעות. כשפועל ב' מצטרף, הם מסיימים אותה יחד ב־6 שעות. בכמה שעות יסיים פועל ב' את העבודה לבדו?",
        choices: ["4", "8", "15", "16"],
        check: pick(2, { 0: "חיסרת זמנים: 10 − 6. מחסרים הספקים, לא זמנים.", 1: "בדוק: אם ב' מסיים ב־8, יחד הם מסיימים ב־80 ÷ 18, בערך 4.4 שעות.", 3: "חיברת זמנים. בדוק: 10 · 16 ÷ 26 זה לא 6." }),
        ok: L => { L.state.t = 30; L.render(); return "זמן משותף 30 שעות: יחד 5 עבודות, א' לבדו 3. ב' עושה את ההפרש: 2 עבודות ב־30 שעות, כלומר עבודה ב־<b>15 שעות</b>. בדיקה: 10 · 15 ÷ 25 = 6."; } },
      { ch: 5,
        say: "<b>סיכום ההמחשה:</b><br>1. עבודה = הספק × זמן. הספק הוא שבר: עבודה ליחידת זמן.<br>2. יחד מחברים <b>הספקים</b>, לא זמנים. השוואת זמנים: בוחרים זמן משותף וסופרים עבודות.<br>3. צינור מרוקן: מחסרים את ההספק שלו.<br>4. צוות: ימי עבודה = פועלים × ימים. יותר פועלים → פחות זמן.", next: "סיום ההמחשה" },
    ],
  });
})();
