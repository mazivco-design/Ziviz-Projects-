/* Lab: ציר המספרים — a draggable x on the number line, with live "lanes" showing where x², x³, √x and 1/x land. */
(function () {
  const { G } = Lab;
  const AX = 250, X0 = 310, U = 90;                 // axis y, position of 0, px per unit (−3..3 visible)
  const P = v => X0 + U * v;
  const num = v => (v < 0 ? "−" : "") + G.fmt(Math.abs(v));
  const m = s => `<span dir="ltr">${s}</span>`;
  const OPS = {
    x: { lab: "x", f: v => v, dot: "fa", tc: "a" },
    sq: { lab: "x²", f: v => v * v, dot: "fblue", tc: "blue" },
    cu: { lab: "x³", f: v => v * v * v, dot: "fok", tc: "ok" },
    rt: { lab: "√x", f: v => v < 0 ? null : Math.sqrt(v), dot: "dot", tc: "b" },
    inv: { lab: "1/x", f: v => v === 0 ? null : 1 / v, dot: "fwarn", tc: "w" },
  };
  const HALO = { style: "paint-order:stroke;stroke:var(--sheet);stroke-width:6px;stroke-linejoin:round", "pointer-events": "none" };
  const REG = [[-3.3, -1, "x<−1"], [-1, 0, "−1<x<0"], [0, 1, "0<x<1"], [1, 3.3, "x>1"]];
  const base = o => Object.assign({ x: 0, show: [], regions: false, regTap: false, picked: [], order: null, bad: null }, o);

  function draw(L) {
    const S = L.state; let h = "";
    // regions
    if (S.regions || S.regTap) REG.forEach(([a, b, lab], i) => {
      const pk = S.picked.includes(i), cls = S.regTap ? (pk ? (i === 2 ? "fok-soft" : "fwarn") + " hot" : "box hot") : (i % 2 ? "fblue-soft" : "fsoft");
      let r = G.rect(P(a), AX - 18, P(b) - P(a), 36, cls, { opacity: S.regTap ? 1 : .55 });
      h += S.regTap ? G.tap(r, "r" + i) : r;
      h += G.t((P(a) + P(b)) / 2, 352, lab, "m");
    });
    // axis
    h += G.line(14, AX, 606, AX, "ink");
    for (let k = -3; k <= 3; k++) { const big = Math.abs(k) <= 1; h += G.line(P(k), AX - (big ? 10 : 6), P(k), AX + (big ? 10 : 6), big ? "ink" : "thin") + G.t(P(k) + (k === L.state.x ? 14 : 0), AX + 30, num(k), big ? "b" : "m", k === L.state.x ? "start" : "middle"); }
    for (const k of [-2.5, -1.5, -.5, .5, 1.5, 2.5]) h += G.line(P(k), AX - 4, P(k), AX + 4, "thin");
    // lanes
    const n = S.show.length, lanes = S.show.map((k, i) => ({ k, op: OPS[k], y: AX - 48 - (n - 1 - i) * 40 }));
    let marks = "", labels = "";
    lanes.forEach(({ k, op, y }) => {
      const v = op.f(S.x);
      if (v === null) { labels += G.t(P(S.x) - 12, y + 5, op.lab, op.tc, "end", HALO) + G.he(P(S.x) + 12, y + 5, "לא מוגדר", "m", "left", HALO); return; }
      const out = v > 3.25 ? 1 : v < -3.25 ? -1 : 0, px = out ? (out > 0 ? 588 : 32) : P(v);
      if (!out) marks += G.line(px, y + 8, px, AX, "dash", { "pointer-events": "none" }) + G.circle(px, AX, 5, op.dot, { "pointer-events": "none" });
      else marks += G.arrow(px + out * 10, y, px + out * 26, y, "thin");
      const tapIdx = S.order ? S.order.indexOf(k) : -1;
      if (S.order) marks += G.tap(G.circle(px, y, 18, tapIdx >= 0 ? "fok-soft hot" : "fsoft hot"), "op:" + k);
      marks += G.circle(px, y, 7, op.dot, { "pointer-events": "none" });
      if (tapIdx >= 0) marks += G.t(px, y - 22, String(tapIdx + 1), "ok");
      const txt = op.lab + " = " + num(Math.round(v * 1000) / 1000), right = px > 420;
      labels += G.t(right ? px - 24 : px + 24, y + 6, txt, op.tc, right ? "end" : "start", HALO);
    });
    h += marks + labels;
    // the x knob
    const kx = P(S.x);
    h += G.line(kx, AX, kx, AX + 38, "sa") + G.circle(kx, AX, 6, "fa") + G.knob(kx, AX + 54, "x", 16);
    const xr = kx > 470;
    h += G.t(xr ? kx - 24 : kx + 24, AX + 60, "x = " + num(S.x), "a", xr ? "end" : "start");
    return h;
  }
  function drag(L, key, pt) { L.state.x = Math.max(-3, Math.min(3, Math.round((pt.x - X0) / U * 4) / 4)); }
  function tap(L, key) {
    const S = L.state;
    if (key[0] === "r") { const i = +key.slice(1); if (!S.picked.includes(i)) S.picked.push(i); S.lastTap = i; return; }
    if (!S.order) return false;
    const k = key.slice(3); if (S.order.includes(k)) return false;
    const sorted = S.show.slice().sort((a, b) => OPS[a].f(S.x) - OPS[b].f(S.x));
    if (sorted[S.order.length] === k) S.order.push(k); else { S.order = []; S.bad = k; }
  }
  const at = (wants, hint) => (L, e) => e.type !== "drop" ? null : wants.includes(L.state.x) ? true : hint(L.state.x);
  const put = v => L => { L.state.x = v; L.act({ type: "drop", key: "x" }); };
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const guess = (L, e) => { if (e.type !== "choice") return null; L.memo.g = e.j; return true; };

  Lab.register({
    id: "alg-number-line", title: "מעבדת ציר המספרים", viewBox: "0 0 620 370",
    chapters: ["x² מול x", "ארבעה תחומים", "תמונת ראי", "ההופכי", "שיטת הציר", "שאלת מבחן"],
    draw, drag, tap,
    steps: [
      { ch: 0, setup: L => { L.state = base({ x: 0, show: ["sq"] }); },
        say: "זה ציר המספרים. העיגול למטה הוא x, והנקודה הכחולה מראה איפה נמצא x². גרור את x ותראה איך x² זז.",
        task: `גרור את x ל־${m("2")}.`, demo: put(2),
        check: at([2], v => v < 2 ? "עוד ימינה. x צריך להיות 2." : "עברת את 2. חזור קצת שמאלה."),
        ok: `${m("x² = 4")}, הרבה יותר ימינה מ־x. מספר גדול מ־1 גדל כשמעלים אותו בריבוע.` },
      { ch: 0, say: "עכשיו נבדוק שבר.", task: `אם ${m("x = 1/2")}, איפה יהיה x²?`,
        choices: ["מימין ל־x (גדול ממנו)", "משמאל ל־x (קטן ממנו)", "בדיוק על x"], check: guess,
        ok: "בוא נבדוק על הציר." },
      { ch: 0, say: `${m("1/2 = 0.5")}, באמצע בין 0 ל־1.`, task: `גרור את x ל־${m("0.5")}.`, demo: put(.5),
        check: at([.5], v => v > .5 ? "עוד שמאלה. 0.5 זה בדיוק באמצע בין 0 ל־1." : "עוד ימינה. 0.5 זה בדיוק באמצע בין 0 ל־1."),
        ok: L => (L.memo.g === 1 ? "צדקת! " : "הפתעה: ") + `${m("x² = 0.25")}, <b>משמאל</b> ל־x. חצי כפול חצי זה רבע: כפל בשבר חיובי מקטין.` },
      { ch: 0, setup: L => { L.state.regTap = true; L.state.picked = []; },
        say: "הציר מחולק עכשיו לארבעה תחומים. אפשר להמשיך להזיז את x ולבדוק.", task: "לחץ על התחום שבו x² קטן מ־x.",
        demo: L => { L.state.picked = [2]; L.state.lastTap = 2; L.act({ type: "tap", key: "r2" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const i = L.state.lastTap; L.state.picked = [i]; L.render();
          return i === 2 ? true : i === 3 ? `הצב ${m("x = 2")}: ${m("x² = 4")}, גדול מ־x.` : "בשליליים x² חיובי, ולכן הוא תמיד מימין ל־x. חפש בצד החיובי."; },
        ok: `רק בין 0 ל־1. זו המלכודת הראשונה של הפרק: ${m("x² > x")} לא תמיד נכון.` },
      { ch: 1, setup: L => { L.state = base({ x: 2, show: ["sq"], regions: true }); },
        say: "הנקודות ‎−1, 0 ו־1 מחלקות את הציר לארבעה תחומים. בתוך כל תחום כל המספרים מתנהגים אותו דבר, ולכן מספיק להציב נציג אחד.",
        task: `גרור את x לנציג הנוח של התחום שבין ${m("−1")} ל־0: ${m("−1/2")}.`, demo: put(-.5),
        check: at([-.5], v => v > 0 ? "צריך מספר שלילי, משמאל ל־0." : v < -1 ? `עברת את ${m("−1")}. התחום הוא בין ${m("−1")} ל־0.` : v === -1 || v === 0 ? "זה גבול התחום. כוון לאמצע שלו." : `אתה בתחום הנכון. הנציג הנוח הוא בדיוק ${m("−0.5")}.`),
        ok: `${m("x² = 0.25")}: חזקה זוגית של מספר שלילי "קופצת" לצד החיובי של הציר.` },
      { ch: 1, say: "גרור את x גם לתחום השמאלי ביותר אם תרצה.", task: "מה נכון לגבי x² לכל x שלילי?",
        choices: [m("x² > x") + " תמיד", m("x² < x") + " תמיד", "תלוי באיזה תחום"],
        check: pick(0, { 1: `נסה ${m("x = −2")}: ${m("x² = 4")}. מי גדול יותר?`, 2: "בשני התחומים השליליים x² חיובי. וכל מספר חיובי גדול מכל מספר שלילי." }),
        ok: "זו <b>היררכיה</b>: מספר בתחום ימני גדול ממספר בתחום שמאלי, בלי לחשב כלום. x² חיובי, x שלילי, וזהו." },
      { ch: 2, setup: L => { L.state = base({ x: .5, show: ["cu"], regions: true }); },
        say: `השליליים הם תמונת ראי של החיוביים. ב־${m("x = 1/2")} החזקה השלישית היא ${m("1/8")}: היא קירבה את x ל־0, ולכן ${m("x³ < x")}.`,
        task: `ומה יקרה ב־${m("x = −1/2")}?`, choices: ["x³ יהיה משמאל ל־x (קטן ממנו)", "x³ יהיה מימין ל־x (גדול ממנו)"], check: guess,
        ok: "גרור ובדוק." },
      { ch: 2, task: `גרור את x ל־${m("−0.5")}.`, demo: put(-.5),
        check: at([-.5], v => v > -.5 ? "עוד שמאלה." : "עוד ימינה. ‎−0.5 זה באמצע בין ‎−1 ל־0."),
        ok: L => (L.memo.g === 1 ? "צדקת. " : "") + `${m("x³ = −0.125")}, <b>מימין</b> ל־x. בתמונת ראי החזקה שוב קירבה את המספר ל־0, אבל בצד השלילי "קרוב ל־0" פירושו "גדול יותר".` },
      { ch: 2, setup: L => { L.state.show = ["cu", "sq"]; }, say: "נוסיף את x² ונעבור לתחום השמאלי ביותר.",
        task: `גרור את x ל־${m("−2")}.`, demo: put(-2),
        check: at([-2], v => v > -2 ? "עוד שמאלה." : "עוד ימינה."),
        ok: `${m("x³ = −8")}: מחוץ לציר, רחוק שמאלה. ו־${m("x² = 4")} בצד החיובי.` },
      { ch: 2, say: "הנציג ‎−2 מייצג את כל התחום.", task: `מה נכון לכל ${m("x < −1")}?`,
        choices: [m("x³ < x < x²"), m("x < x³ < x²"), m("x² < x < x³"), m("x³ < x² < x")],
        check: pick(0, { 1: `זה הסדר בתחום ${m("−1 < x < 0")}. כאן ${m("x³ = −8")}, משמאל ל־x.`, 2: "x² חיובי, ולכן הוא הגדול ביותר.", 3: "x² חיובי, ולכן הוא הגדול ביותר." }),
        ok: `${m("−8 < −2 < 4")}. מעבר ל־${m("−1")} החזקה האי־זוגית מרחיקה מ־0, כמו בצד החיובי מעבר ל־1.` },
      { ch: 3, setup: L => { L.state = base({ x: 2, show: ["inv"], regions: true }); },
        say: "הנקודה הכתומה היא ההופכי, 1/x. ב־x = 2 ההופכי הוא חצי.",
        task: `מצא x שעבורו ${m("1/x = x")}. יש שניים כאלה, מספיק אחד.`, demo: put(1),
        check: at([1, -1], v => v === 0 ? "ל־0 אין הופכי. נסה מקום אחר." : Math.abs(v) > 1 ? "כאן ההופכי קרוב יותר ל־0 מ־x. התקרב ל־0." : "כאן ההופכי רחוק יותר מ־0 מ־x. התרחק מ־0."),
        ok: `${m("x = 1")} (וגם ${m("x = −1")}). אלה גבולות התחומים: בין ${m("−1")} ל־1 ההופכי רחוק יותר מ־0 מ־x, ומחוץ להם הוא קרוב יותר ל־0.` },
      { ch: 3, say: "מלכודת מוכרת.", task: `כמה זה 1/x כש־${m("x = −1/2")}?`, choices: [m("2"), m("−2"), m("−1/2"), m("1/2")],
        check: pick(1, { 0: "ההופכי של מספר שלילי נשאר שלילי.", 2: "זה x עצמו. כמה חצאים יש ב־1?", 3: "ההופכי של מספר שלילי נשאר שלילי, וההופכי של חצי הוא לא חצי." }),
        ok: `${m("1 ÷ (−1/2) = −2")}. ההופכי של שבר שלילי <b>קטן מ־‎−1</b>.` },
      { ch: 3, task: `גרור את x ל־${m("−0.5")} וראה את זה על הציר.`, demo: put(-.5),
        check: at([-.5], v => v > -.5 ? "עוד שמאלה." : "עוד ימינה."),
        ok: "x בתחום שבין ‎−1 ל־0, וההופכי שלו קפץ אל מעבר ל־‎−1. מספר קרוב ל־0 נותן הופכי רחוק מ־0." },
      { ch: 4, setup: L => { L.state = base({ x: .5, show: ["x", "sq", "cu", "rt", "inv"], regions: true, order: [] }); },
        say: `"שיטת הציר": מציבים נציג ורואים את כל הסדר בבת אחת. כאן ${m("x = 1/2")}.`,
        task: "לחץ על הנקודות לפי הסדר, מהקטנה לגדולה.",
        demo: L => { const S = L.state; S.order = S.show.slice().sort((a, b) => OPS[a].f(S.x) - OPS[b].f(S.x)); L.act({ type: "tap", key: "op:inv" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const S = L.state;
          if (S.bad) { const b = OPS[S.bad].lab; S.bad = null; return `${b} עוד לא. בכל פעם חפש את הנקודה הכי שמאלית שעוד לא סימנת. מתחילים מחדש.`; }
          return S.order.length === 5 ? true : null; },
        ok: `לכל ${m("0 < x < 1")}: ${m("x³ < x² < x < √x < 1 < 1/x")}. חזקה גבוהה יותר נותנת מספר קטן יותר, ושורש (חזקה של חצי) פועל הפוך.` },
      { ch: 4, setup: L => { L.state.order = null; }, say: "אפשר לגרור את x ל־2 ולבדוק.", task: `מה הסדר לכל ${m("x > 1")}?`,
        choices: [m("1/x < √x < x < x² < x³"), m("√x < 1/x < x < x² < x³"), m("x³ < x² < x < √x < 1/x"), m("1/x < x < √x < x² < x³")],
        check: pick(0, { 1: "ההופכי של מספר גדול מ־1 קטן מ־1, והשורש שלו גדול מ־1.", 2: "זה הסדר של שבר בין 0 ל־1. מעל 1 הכול מתהפך.", 3: `${m("√4 = 2")}, וזה פחות מ־4. השורש קטן מ־x.` }),
        ok: `מעל 1 הסדר מתהפך: ${m("1/x < 1 < √x < x < x² < x³")}. מספיק לזכור תחום אחד ולהפוך.` },
      { ch: 5, setup: L => { L.state = base({ x: 0, show: ["cu", "sq", "inv"], regions: true }); },
        say: "שאלה ברמת מבחן. הציר פתוח לשימוש.", task: `נתון ${m("−1 < x < 0")}. סדר מהקטן לגדול: ${m("1/x")}, ${m("x²")}, ${m("x³")}.`,
        choices: [m("1/x < x³ < x²"), m("x³ < 1/x < x²"), m("x² < x³ < 1/x"), m("x³ < x² < 1/x")],
        check: pick(0, { 1: `הצב ${m("x = −1/2")}: ${m("1/x = −2")}, ${m("x³ = −0.125")}. מי שמאלי יותר?`, 2: "x² חיובי, והשאר שליליים. מי הגדול?", 3: `ההופכי של שבר שלילי קטן מ־${m("−1")}, ולכן הוא לא הגדול.` }),
        ok: `נציג ${m("x = −1/2")}: ${m("1/x = −2")}, ${m("x³ = −1/8")}, ${m("x² = 1/4")}. לכן ${m("1/x < x³ < x²")}.` },
      { ch: 5, say: `<b>סיכום המעבדה:</b><br>1. ארבעה תחומים: ${m("x < −1")}, ${m("−1 < x < 0")}, ${m("0 < x < 1")}, ${m("x > 1")}. מציבים נציג אחד מכל תחום.<br>2. בשבר חיובי חזקה מקטינה ושורש מגדיל. מעל 1 להפך.<br>3. השליליים הם תמונת ראי: "קרוב ל־0" שם פירושו "גדול יותר", וחזקה זוגית קופצת לצד החיובי.<br>4. ההופכי של מספר קרוב ל־0 רחוק מ־0, ולהפך.`, next: "סיום המעבדה" },
    ],
  });
})();
