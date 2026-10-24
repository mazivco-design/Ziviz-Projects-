/* Lab: קריאת טבלה ותרשים — bar chart with tappable bars, draggable reading lines, line vs continuous graph. */
(function () {
  const { G } = Lab;
  const X0 = 70, X1 = 560, Y0 = 290, YT = 80;
  const MONTHS = ["ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יוני"];
  const MFULL = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני"];
  const yOf = (S, v) => Y0 - (v - S.ymin) / (S.ymax - S.ymin) * (Y0 - YT);
  const vOf = (S, y) => S.ymin + (Y0 - y) / (Y0 - YT) * (S.ymax - S.ymin);
  const xOf = (S, v) => X0 + (v - S.xmin) / (S.xmax - S.xmin) * (X1 - X0);
  const vxOf = (S, x) => S.xmin + (x - X0) / (X1 - X0) * (S.xmax - S.xmin);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hit = (x, y, w, h, key) => G.tap(G.rect(x, y, w, h, "hot", { fill: "none", "pointer-events": "all" }), key);

  const chart = o => Object.assign({ kind: "bars", data: [], labels: MONTHS, ymin: 0, ymax: 30, ystep: 5, title: "", unit: "", showVals: false,
    tapBars: false, tapHead: false, sel: {}, rl: null, rlDrag: false, vl: null, copies: 0, stack: false, notes: [] }, o);

  function head(S) {
    let h = G.he(600, 30, S.title, "b", "right");
    if (S.unit) h += G.he(600, 54, S.unit, "m", "right");
    if (S.tapHead) {
      h += hit(330, 10, 280, 28, "title") + hit(470, 38, 140, 24, "unit");
      h += hit(10, YT - 12, 52, Y0 - YT + 24, "yaxis") + hit(X0, Y0 + 6, X1 - X0, 30, "xaxis");
    }
    return h;
  }
  function grid(S) {
    let h = "";
    for (let v = S.ymin; v <= S.ymax + 1e-9; v += S.ystep) {
      const y = yOf(S, v);
      h += G.line(X0, y, X1, y, v === S.ymin ? "ink" : "mut", v === S.ymin ? {} : { opacity: .35 });
      h += G.t(X0 - 10, y + 5, G.fmt(v), "m", "end");
    }
    return h + G.line(X0, YT - 8, X0, Y0, "ink");
  }
  function readLine(S) {
    if (S.rl === null) return "";
    const y = yOf(S, S.rl);
    let h = G.line(X0, y, X1 + 8, y, "sa", { "stroke-dasharray": "8 5" });
    h += G.t(X1 + 26, y - 20, G.fmt(S.rl), "a");
    if (S.rlDrag) h += G.knob(X1 + 26, y, "rl", 15);
    return h;
  }
  function bars(S) {
    const n = S.data.length, slot = (X1 - X0) / n, bw = Math.min(54, slot * .55);
    let h = "";
    S.data.forEach((v, i) => {
      const cx = X0 + slot * (i + .5), y = yOf(S, v);
      const touch = S.rl !== null && S.rl === v;
      const cls = S.sel[i] ? "fa" : touch ? "fok-soft" : "fblue-soft";
      const r = G.rect(cx - bw / 2, y, bw, Y0 - y, cls + (S.tapBars ? " hot" : ""));
      h += S.tapBars ? G.tap(r, "b" + i) + hit(cx - slot / 2 + 4, YT - 10, slot - 8, Y0 - YT + 10, "b" + i) : r;
      if (S.showVals) h += G.t(cx, y - 8, G.fmt(v), "b");
      h += G.he(cx, Y0 + 24, S.labels[i], "m", "middle");
    });
    // copies of the first bar stacked next to the last bar (estimation chapter)
    if (S.copies) {
      const cx = X0 + slot * (n - .5) + bw / 2 + 4, w = bw * .7, u = S.data[0];
      for (let k = 0; k < S.copies; k++) {
        const yb = yOf(S, u * k), yt = yOf(S, u * (k + 1));
        h += G.rect(cx, yt, w, yb - yt, "fsoft") + G.t(cx + w / 2, (yt + yb) / 2 + 5, G.fmt(u), "a");
      }
    }
    return h;
  }
  function group(S) {
    let h = "";
    if (!S.stack) {
      const n = S.labels.length, slot = (X1 - X0) / n, bw = 40;
      S.labels.forEach((lb, i) => {
        const cx = X0 + slot * (i + .5);
        [["a", S.A, "fa"], ["b", S.B, "fblue"]].forEach(([s, arr, cls], k) => {
          const x = cx - bw - 2 + k * (bw + 4), y = yOf(S, arr[i]);
          const r = G.rect(x, y, bw, Y0 - y, cls + (S.tapBars ? " hot" : ""));
          h += S.tapBars ? G.tap(r, s + i) : r;
          if (S.sel[s + i]) h += G.rect(x - 4, y - 4, bw + 8, Y0 - y + 4, "ink");
        });
        h += G.he(cx, Y0 + 24, lb, "m", "middle");
      });
    } else {
      const xs = [X0 + 130, X0 + 330], bw = 80;
      [["סניף א", S.A, "fa"], ["סניף ב", S.B, "fblue"]].forEach(([nm, arr, cls], k) => {
        let acc = 0;
        arr.forEach((v, i) => {
          const yb = yOf(S, acc), yt = yOf(S, acc + v); acc += v;
          h += G.rect(xs[k] - bw / 2, yt, bw, yb - yt, cls, { opacity: i % 2 ? .7 : 1 });
          h += G.t(xs[k], (yt + yb) / 2 + 5, G.fmt(v), "inv");
        });
        h += G.t(xs[k], yOf(S, acc) - 10, "= " + G.fmt(acc), "b");
        h += G.he(xs[k], Y0 + 24, nm, "b", "middle");
      });
    }
    // legend
    h += G.rect(X0 + 76, YT - 46, 14, 14, "fa") + G.he(X0 + 70, YT - 34, "סניף א", "m", "right");
    h += G.rect(X0 + 186, YT - 46, 14, 14, "fblue") + G.he(X0 + 180, YT - 34, "סניף ב", "m", "right");
    return h;
  }
  function lineChart(S) {
    let h = "";
    for (let x = S.xmin; x <= S.xmax; x += S.xtick) {
      const px = xOf(S, x);
      h += G.line(px, Y0, px, Y0 + 6, "ink");
      if ((x - S.xmin) % S.xlab === 0) h += G.t(px, Y0 + 24, String(x), "m");
    }
    if (S.xname) h += G.he(X1 + 4, Y0 + 50, S.xname, "m", "right");
    const pts = S.pts.map(([x, v]) => [xOf(S, x), yOf(S, v)]);
    h += G.path("M" + pts.map(p => p.join(",")).join(" L"), S.continuous ? "sblue" : "ink");
    if (!S.continuous) pts.forEach(p => h += G.circle(p[0], p[1], 6, "fblue"));
    if (S.vl !== null) {
      const px = xOf(S, S.vl), v = valueAt(S, S.vl);
      h += G.line(px, YT - 10, px, Y0, "sa", { "stroke-dasharray": "8 5" });
      h += G.knob(px, Y0 + 50, "vl", 15);
      let lab;
      if (v === null) lab = G.he(px, YT - 18, "אין נתון", "w", "middle");
      else {
        const py = yOf(S, v);
        h += G.line(X0, py, px, py, "dash") + G.circle(px, py, 7, "fa");
        lab = G.t(px, YT - 18, (S.xfmt ? S.xfmt(S.vl) : S.vl) + " → " + G.fmt(v) + (S.vunit || ""), "a");
      }
      h += lab;
    }
    return h;
  }
  function valueAt(S, x) {
    const p = S.pts;
    for (let i = 0; i < p.length; i++) if (p[i][0] === x) return p[i][1];
    if (!S.continuous) return null;
    for (let i = 1; i < p.length; i++) if (x < p[i][0]) { const [a, va] = p[i - 1], [b, vb] = p[i]; return va + (vb - va) * (x - a) / (b - a); }
    return null;
  }

  function draw(L) {
    const S = L.state;
    let h = head(S) + grid(S);
    if (S.kind === "bars") h += bars(S) + readLine(S);
    else if (S.kind === "group") h += group(S);
    else h += lineChart(S);
    return h + S.notes.join("");
  }
  function drag(L, key, pt) {
    const S = L.state;
    if (key === "rl") S.rl = clamp(Math.round(vOf(S, pt.y)), S.ymin, S.ymax);
    if (key === "vl") S.vl = clamp(Math.round(vxOf(S, pt.x)), S.xmin, S.xmax);
  }
  function dragFrom(L, pt) {
    const S = L.state;
    if (S.kind === "bars" && S.rlDrag && S.rl !== null && Math.abs(pt.y - yOf(S, S.rl)) < 18 && pt.x > X0) return "rl";
    if (S.kind === "line" && S.vl !== null && pt.y > Y0 + 30 && pt.x > X0 - 20) return "vl";
    return null;
  }
  function tap(L, key) {
    const S = L.state;
    if (S.tapBars && key !== "title") S.sel[key.replace(/^b/, "")] = !S.sel[key.replace(/^b/, "")];
    if (S.single) { const k = key.replace(/^b/, ""); S.sel = { [k]: true }; }
  }
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const S_ = L => L.state;

  const museum = [12, 18, 15, 24, 9, 21];

  Lab.register({
    id: "cht-reading", title: "המחשה: קריאת תרשים", viewBox: "0 0 620 380",
    chapters: ["קודם יחידות", "קו קריאה", "ערך בודד מול סכום", "קווי מול רציף", "הערכה", "שאלת מבחן"],
    draw, drag, dragFrom, tap,
    steps: [
      { ch: 0, setup: L => { L.state = chart({ data: museum, title: "מבקרים במוזיאון לפי חודש", unit: "(באלפים)", showVals: true, tapHead: true }); },
        say: "לפני שעונים על שאלה בתרשים, מקדישים חצי דקה להבנה: כותרת, צירים, מקרא, ובעיקר <b>יחידות</b>.",
        task: "לחץ על המקום בתרשים שמגלה באילו יחידות נמדדים המספרים.",
        demo: L => L.act({ type: "tap", key: "unit" }),
        check: (L, e) => { if (e.type !== "tap") return null; return e.key === "unit" ? true :
          e.key === "title" ? "הכותרת אומרת <i>מה</i> נמדד. חפש את השורה הקטנה שאומרת <i>באיזה גודל</i>." :
          e.key === "yaxis" ? "בציר האנכי רואים רק את המספרים עצמם. היחידה כתובה ליד הכותרת." : "בציר האופקי יש חודשים. היחידה כתובה ליד הכותרת."; },
        ok: "בדיוק. <b>(באלפים)</b> אומר שכל מספר בתרשים כפול 1,000. מי שמדלג על השורה הזאת טועה פי 1,000." },
      { ch: 0, setup: L => { const S = S_(L); S.tapHead = false; S.tapBars = true; S.single = true; },
        say: "עכשיו שליפת נתון, כמו השאלה הראשונה בכל מקטע תרשימים.", task: "לחץ על העמודה של אפריל.",
        demo: L => { S_(L).sel = { 3: true }; L.act({ type: "tap", key: "b3" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const i = +e.key.slice(1); return i === 3 ? true : `זה ${MFULL[i]}. אפריל הוא החודש הרביעי משמאל.`; },
        ok: "העמודה של אפריל מגיעה ל־24." },
      { ch: 0, say: "ועכשיו עם היחידות.", task: "כמה מבקרים היו במוזיאון באפריל?", choices: ["24", "2,400", "24,000", "240,000"],
        check: pick(2, { 0: "24 זה המספר שעל העמודה. מה אומרת השורה '(באלפים)'?", 1: "'באלפים' זה כפול 1,000, לא כפול 100.", 3: "הוספת אפס אחד יותר מדי. 24 אלף = 24 × 1,000." }),
        ok: "24 אלף = 24,000 מבקרים. כלל: עונים במספרים של התרשים, וממירים ליחידות רק בסוף." },

      { ch: 1, setup: L => { L.state = chart({ data: museum, title: "מבקרים במוזיאון לפי חודש", unit: "(באלפים)", rl: 0, rlDrag: true }); },
        say: "במבחן המספרים לא כתובים על העמודות. קוראים אותם בעזרת קו ישר אל הציר. הקו הוורוד הוא סרגל הקריאה שלך.",
        task: "גרור את העיגול שבצד ימין עד שהקו נוגע בראש העמודה של מרץ.",
        demo: L => { S_(L).rl = 15; L.act({ type: "drop", key: "rl" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const v = S_(L).rl; if (v === 15) return true;
          const m = museum.indexOf(v); if (m >= 0) return `הקו נוגע ב${MFULL[m]}. מרץ היא העמודה השלישית משמאל.`;
          return v > 15 ? "הקו מעל ראש העמודה של מרץ. הורד אותו." : "הקו עדיין מתחת לראש העמודה של מרץ. הרם אותו."; },
        ok: "הקו נוגע בעמודה בגובה 15, וזה בדיוק על קו רשת. כלומר 15 אלף מבקרים." },
      { ch: 1, setup: L => { S_(L).rl = 0; }, say: "עכשיו עמודה שלא נגמרת על קו רשת.", task: "קרא את הגובה של עמודת יוני.",
        demo: L => { S_(L).rl = 21; L.act({ type: "drop", key: "rl" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const v = S_(L).rl; if (v === 21) return true;
          if (v === 20 || v === 25) return "העמודה לא נגמרת על קו הרשת. קרב את הקו עד שהוא נוגע בדיוק בראש העמודה.";
          return v > 21 ? "הקו מעל עמודת יוני. הורד אותו." : "הקו מתחת לראש עמודת יוני. הרם אותו."; },
        ok: "21: קצת מעל 20. התרשימים בבחינה מדויקים, ולכן מותר לסמוך על קריאה כזאת." },
      { ch: 1, setup: L => { const S = S_(L); S.rl = 16; S.rlDrag = false; S.tapBars = true; S.sel = {}; },
        say: "הקו קבוע עכשיו על 16, כלומר 16,000 מבקרים.", task: "לחץ על כל החודשים שבהם היו יותר מ־16,000 מבקרים.",
        demo: L => { S_(L).sel = { 1: true, 3: true, 5: true }; L.act({ type: "tap", key: "b5" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const s = S_(L).sel, on = Object.keys(s).filter(k => s[k]).map(Number);
          const low = on.find(i => museum[i] < 16); if (low !== undefined) return `העמודה של ${MFULL[low]} נמוכה מהקו. לחץ עליה שוב כדי לבטל.`;
          return on.length === 3 ? true : null; },
        ok: "פברואר, אפריל ויוני. עם קו אחד ענית על שאלה שלמה, בלי לקרוא אף מספר מדויק." },

      { ch: 2, setup: L => { L.state = chart({ kind: "group", labels: ["ינואר", "פברואר", "מרץ"], A: [8, 27, 7], B: [16, 15, 17], title: "מכירות בשני סניפים", unit: "(באלפי ₪)", tapBars: true, single: true }); },
        say: "תרשים עם שתי סדרות: כל חודש מופיעים בו שני סניפים. המקרא למעלה אומר איזה צבע שייך לאיזה סניף.",
        task: "לחץ על העמודה הבודדת הגבוהה ביותר בתרשים.",
        demo: L => { S_(L).sel = { a1: true }; L.act({ type: "tap", key: "a1" }); },
        check: (L, e) => e.type !== "tap" ? null : e.key === "a1" ? true : "יש עמודה אחת שבולטת מעל כולן. חפש אותה.",
        ok: "סניף א בפברואר: 27 אלף ₪. זה הערך הבודד הגבוה ביותר." },
      { ch: 2, setup: L => { S_(L).tapBars = false; }, say: "שאלה אחרת לגמרי.", task: "איזה סניף מכר יותר בסך הכול בשלושת החודשים?",
        choices: ["סניף א", "סניף ב", "שניהם מכרו אותו סכום"],
        check: (L, e) => { if (e.type !== "choice") return null; L.memo.guess = e.j; return true; },
        ok: L => L.memo.guess === 0 ? "אתה כנראה מסתכל על העמודה הגבוהה. בוא נבדוק." : "בוא נבדוק." },
      { ch: 2, say: "כדי לראות סכום, מערימים את העמודות של כל סניף אחת על השנייה.", task: "לחץ על 'ערום לפי סניף'.",
        tools: () => [["ערום לפי סניף", L => { const S = S_(L); S.stack = true; S.ymax = 50; S.ystep = 10; L.act({ type: "stack" }); }, true]],
        demo: L => { const S = S_(L); S.stack = true; S.ymax = 50; S.ystep = 10; L.act({ type: "stack" }); },
        check: (L, e) => e.type === "stack" ? true : null,
        ok: L => (L.memo.guess === 1 ? "צדקת! " : "") + "סניף ב: 16+15+17 = 48. סניף א: 8+27+7 = 42. לסניף א יש את <b>השיא</b>, אבל לסניף ב יש את <b>הסכום</b>. קרא היטב מה השאלה מבקשת." },

      { ch: 3, setup: L => { L.state = chart({ kind: "line", pts: [[2018, 40], [2020, 30], [2022, 50], [2024, 45]], xmin: 2018, xmax: 2024, xtick: 1, xlab: 1, ymin: 0, ymax: 60, ystep: 10,
          title: "נרשמים לחוג שחמט", unit: "(נמדד אחת לשנתיים)", vl: 2018 }); },
        say: "גרף קווי: נקודות שמחוברות בקו. הקו רק עוזר לראות מגמה. יש נתון רק במקום שיש נקודה.",
        task: "גרור את העיגול שמתחת לציר אל שנת 2021.",
        demo: L => { S_(L).vl = 2021; L.act({ type: "drop", key: "vl" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const v = S_(L).vl; return v === 2021 ? true : v < 2021 ? "עוד ימינה. 2021 נמצאת בין 2020 ל־2022." : "עברת. 2021 נמצאת בין 2020 ל־2022."; },
        ok: "קו הקריאה חוצה את הקו, אבל אין שם נקודה. שים לב מה כתוב למעלה." },
      { ch: 3, say: "הקו בין 2020 ל־2022 עובר בגובה 40 בערך באמצע.", task: "כמה נרשמים היו לחוג ב־2021?",
        choices: ["40", "בין 30 ל־50", "אי אפשר לדעת מהגרף"],
        check: pick(2, { 0: "40 זה הגובה של הקו, אבל הקו רק מחבר נקודות. אולי ב־2021 נרשמו 70?", 1: "גם זו הסקה מהקו. בין שתי מדידות המספר יכול היה לקפוץ לכל ערך." }),
        ok: "נכון. בגרף קווי לא רציף אין מידע בין הנקודות, וגם לא אחרי הנקודה האחרונה." },
      { ch: 3, setup: L => { L.state = chart({ kind: "line", continuous: true, pts: [[0, 18], [3, 15], [6, 15], [9, 21], [12, 27], [15, 30], [18, 24], [21, 21], [24, 18]],
          xmin: 0, xmax: 24, xtick: 1, xlab: 3, xfmt: x => x + ":00", ymin: 0, ymax: 35, ystep: 5, vunit: "°", title: "טמפרטורה לאורך יממה", unit: "(מעלות; בציר האופקי: שעה ביממה)", vl: 0 }); },
        say: "גרף <b>רציף</b>: טמפרטורה נמדדת כל רגע, ולכן לכל נקודה על הקו יש ערך אמיתי.",
        task: "גרור את קו הקריאה לשעה שבה היה הכי חם.",
        demo: L => { S_(L).vl = 15; L.act({ type: "drop", key: "vl" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const v = S_(L).vl; return v === 15 ? true : v < 15 ? "בשעה הזאת הקו עדיין עולה. המשך ימינה." : "כאן הקו כבר יורד. חזור שמאלה."; },
        ok: "בשעה 15:00 היו 30°, השיא." },
      { ch: 3, say: "בגרף רציף מותר לקרוא גם בין הנקודות המסומנות על הציר.", task: "מה הייתה הטמפרטורה בשעה 10:00? אפשר לגרור את הקו.",
        choices: ["21°", "23°", "24°", "27°"],
        check: pick(1, { 0: "21° הייתה ב־9:00. ב־10:00 הקו כבר טיפס קצת.", 2: "קרוב. גרור את הקו בדיוק ל־10:00 וקרא.", 3: "27° הייתה רק ב־12:00." }),
        ok: "בין 9:00 ל־12:00 עלתה הטמפרטורה ב־6°, כלומר 2° בכל שעה. ב־10:00: 21 + 2 = 23°." },

      { ch: 4, setup: L => { L.state = chart({ data: [12, 20, 26, 37], labels: ["2021", "2022", "2023", "2024"], ymax: 40, ystep: 10, title: "יצוא של חברה", unit: "(במיליוני דולר)" }); },
        say: "התרשימים מדויקים, ולכן כשהתשובות רחוקות זו מזו מעריכים במקום לחשב. שאלה: פי כמה גדל היצוא מ־2021 ל־2024?",
        task: "לחץ על '+ עוד 2021' כדי לערום עותקים של עמודת 2021 ליד עמודת 2024, עד שהגובה דומה.",
        tools: () => [["+ עוד 2021", L => { S_(L).copies++; L.render(); L.act({ type: "copy" }); }, true], ["בטל", L => { const S = S_(L); if (S.copies) S.copies--; }]],
        demo: L => { S_(L).copies = 3; L.act({ type: "copy" }); },
        check: (L, e) => { if (e.type !== "copy") return null; const c = S_(L).copies; return c === 3 ? true : c > 3 ? "עברת את הגובה של 2024. לחץ על 'בטל'." : null; },
        ok: "שלושה עותקים כמעט בדיוק בגובה של 2024. כלומר <b>פי 3 בערך</b>, בלי לחלק 37 ב־12." },
      { ch: 4, setup: L => { const S = S_(L); S.copies = 0; S.rl = 0; S.rlDrag = true; }, say: "עוד הערכה. אפשר להיעזר בקו הקריאה.",
        task: "בכמה אחוזים, בקירוב, גדל היצוא מ־2022 ל־2023?", choices: ["6%", "30%", "60%", "130%"],
        check: pick(1, { 0: "6 זה השינוי במיליונים, לא באחוזים. השווה אותו ל־20.", 2: "השינוי (6) הוא פחות משליש מ־20, לא יותר ממחצית.", 3: "130% זה היחס 26 ÷ 20. השאלה שואלת בכמה <i>גדל</i>." }),
        ok: "20 → 26: תוספת של 6 מתוך 20, כלומר 30%. התשובות רחוקות זו מזו, אז די היה לראות ש־6 זה 'קצת פחות משליש'." },

      { ch: 5, setup: L => { L.state = chart({ data: [14, 9, 17, 11, 20], labels: ["א׳", "ב׳", "ג׳", "ד׳", "ה׳"], ymax: 25, ystep: 5, title: "כרטיסים שנמכרו בכל יום", unit: "(במאות)", rl: 0, rlDrag: true }); },
        say: "שאלה ברמת מבחן. קו הקריאה פתוח לשימוש.", task: "בכמה כרטיסים עלו המכירות ביום החזק ביותר על המכירות ביום החלש ביותר?",
        choices: ["11", "800", "1,100", "2,900"],
        check: pick(2, { 0: "החישוב נכון, אבל שכחת את היחידות: הכול במאות.", 1: "17 הוא לא היום החזק ביותר. בדוק את יום ה׳.", 3: "חיברת במקום לחסר. השאלה שואלת בכמה עלו." }),
        ok: "יום ה׳: 20, יום ב׳: 9. ההפרש 11 מאות = 1,100 כרטיסים." },
      { ch: 5, say: "<b>סיכום ההמחשה:</b><br>1. קודם כותרת, מקרא ובעיקר יחידות (באלפים, במאות).<br>2. קוראים ערך עם קו ישר לציר, וסומכים על התרשים.<br>3. בגרף קווי אין ערך בין הנקודות. בגרף רציף יש.<br>4. שיא בודד ≠ סכום. וכשהתשובות רחוקות, מעריכים.", next: "סיום ההמחשה" },
    ],
  });
})();
