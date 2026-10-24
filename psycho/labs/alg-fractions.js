/* Lab: יסודות ושברים — number line chips (definitions), fraction strips (compare, complement to 1, cross-multiply), measuring bar (division). */
(function () {
  const { G } = Lab;
  const m = s => `<bdi dir="ltr"${String(s).length <= 26 ? ' style="white-space:nowrap"' : ""}>${s}</bdi>`;
  const X0 = 120, U = 440, SH = 50;
  const strip = o => Object.assign({ y: 100, n: 5, sel: [], gap: [], sub: 1, tap: false, mode: "sel", title: "", lab: null, h: SH }, o);
  const cnt = a => a.filter(Boolean).length;
  const fill = (n, k) => Array.from({ length: n }, (_, i) => i < k);
  const frac = (x, y, a, b, cls = "b") => { const w = Math.max(String(a).length, String(b).length) * 6 + 8;
    return G.t(x, y - 7, a, cls) + G.line(x - w, y, x + w, y, "ink") + G.t(x, y + 19, b, cls); };
  const NX = v => 64 + (v + 3) * 46, NY = 200;
  const SLOTS = [{ x: 220, y: 100 }, { x: 400, y: 100 }];

  function drawStrip(s, si) {
    let h = ""; const cw = U / s.n, y = s.y, H = s.h;
    if (s.title) h += G.he(X0 + U, y - 12, s.title, "b", "right");
    for (let k = 0; k < s.n; k++) {
      const x = X0 + k * cw, cls = s.sel[k] ? "fa" : s.gap[k] ? "fwarn" : "box";
      const r = G.rect(x, y, cw, H, cls + (s.tap ? " hot" : ""));
      h += s.tap ? G.tap(r, si + ":" + k) : r;
      if (s.sub > 1) for (let j = 1; j < s.sub; j++) { const sx = x + j * cw / s.sub; h += G.line(sx, y + 3, sx, y + H - 3, s.sel[k] ? "thin" : "mut", { "pointer-events": "none", opacity: .75 }); }
    }
    h += G.rect(X0, y, U, H, "ink", { "pointer-events": "none" });
    const a = s.lab ? s.lab[0] : cnt(s.sel) * s.sub, b = s.lab ? s.lab[1] : s.n * s.sub;
    return h + frac(X0 - 50, y + H / 2 + 4, a, b);
  }
  function drawLine(S) {
    let h = G.line(30, NY, 594, NY, "ink");
    if (S.lineTitle) h += G.he(594, 110, S.lineTitle, "b", "right");
    for (let v = -3; v <= 8; v++) {
      const on = S.marks[v];
      h += G.tap(G.circle(NX(v), NY, 18, (on ? "fa" : "box") + " hot"), "n:" + v);
      h += G.t(NX(v), NY + 6, v < 0 ? "−" + (-v) : v, on ? "inv" : "b", "middle", { "pointer-events": "none" });
    }
    if (S.bracket) { const [a, b, txt] = S.bracket; h += G.line(NX(a) - 10, NY + 40, NX(b) + 10, NY + 40, "sok") + G.he((NX(a) + NX(b)) / 2, NY + 66, txt, "ok"); }
    return h;
  }
  function drawMeasure(S) {
    let h = G.he(560, 72, "3 שלמים", "b", "right");
    for (let k = 0; k < 3; k++) h += G.rect(80 + k * 160, 90, 160, SH, "bg") + G.t(160 + k * 160, 121, "1", "b");
    for (let k = 0; k < S.pieces; k++) {
      const x = 80 + k * 120, over = x + 120 > 561;
      h += G.rect(x, 170, 120, SH, over ? "fwarn" : k % 2 ? "fblue" : "fok") + G.t(x + 60, 201, "3/4", over ? "w" : "inv");
    }
    h += G.line(560, 80, 560, 240, "dash");
    h += G.he(560, 280, "מספר חתיכות: " + S.pieces, "b", "right");
    return h;
  }
  function drawTokens(S) {
    let h = "";
    h += frac(220, 210, 4, 7, "big") + frac(400, 210, 5, 9, "big");
    h += G.line(236, 192, 384, 224, "dash") + G.line(236, 224, 384, 192, "dash");
    SLOTS.forEach(s => { h += G.rect(s.x - 56, s.y - 22, 112, 44, "ghost", { rx: 8 }); });
    h += G.he(310, 40, "גרור כל מכפלה למשבצת שמעל השבר שלה", "m");
    S.tok.forEach(t => { h += G.rect(t.x - 52, t.y - 20, 104, 40, "fsoft", { rx: 8, style: "cursor:grab" }) + G.t(t.x, t.y + 6, t.lab, "b", "middle", { "pointer-events": "none" }); });
    return h;
  }
  function draw(L) {
    const S = L.state; let h = "";
    if (S.kind === "line") h = drawLine(S);
    else if (S.kind === "measure") h = drawMeasure(S);
    else if (S.kind === "tokens") h = drawTokens(S);
    else S.strips.forEach((s, i) => { h += drawStrip(s, i); });
    return h + (S.notes || []).join("");
  }
  function tap(L, key) {
    const S = L.state;
    if (key.startsWith("n:")) { const v = +key.slice(2); S.marks[v] = !S.marks[v]; return; }
    const [si, k] = key.split(":").map(Number), s = S.strips[si];
    if (s.mode === "gap") { if (s.sel[k]) { L.memo.bad = true; return; } s.gap[k] = !s.gap[k]; return; }
    s.sel[k] = !s.sel[k];
  }
  function dragFrom(L, pt) {
    const S = L.state; if (S.kind !== "tokens") return null;
    const i = S.tok.findIndex(t => Math.abs(pt.x - t.x) < 56 && Math.abs(pt.y - t.y) < 24);
    return i >= 0 ? "tk" + i : null;
  }
  function drag(L, key, pt, phase) {
    const S = L.state, t = S.tok[+key.slice(2)];
    if (phase !== "end") { t.x = Math.max(56, Math.min(564, pt.x)); t.y = Math.max(24, Math.min(336, pt.y)); t.slot = null; return; }
    const j = SLOTS.findIndex((s, i) => Math.hypot(s.x - t.x, s.y - t.y) < 75 && !S.tok.some(o => o !== t && o.slot === i));
    if (j >= 0) { t.slot = j; t.x = SLOTS[j].x; t.y = SLOTS[j].y; } else { t.x = t.hx; t.y = t.hy; }
  }
  // helpers for number-line tasks
  const marked = L => Object.keys(L.state.marks).filter(k => L.state.marks[k]).map(Number);
  const setMarks = (L, arr) => { L.state.marks = {}; arr.forEach(v => { L.state.marks[v] = true; }); };
  const lineCheck = (target, wrongHint, missHint) => (L, e) => {
    if (e.type !== "tap" && e.type !== "check") return null;
    const on = marked(L), bad = on.filter(v => !target.includes(v));
    if (bad.length) return wrongHint(bad[0]);
    const miss = target.filter(v => !on.includes(v));
    if (!miss.length) return true;
    return e.type === "check" ? missHint(miss) : null;
  };
  const checkBtn = () => [["בדוק", L => L.act({ type: "check" })]];
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const S0 = L => L.state.strips;

  Lab.register({
    id: "alg-fractions", title: "המחשה: יסודות ושברים", viewBox: "0 0 620 360",
    chapters: ["הגדרות", "מונה ומכנה", "השלמה ל־1", "כפל באלכסון", "חילוק בשבר", "שאלת מבחן"],
    draw, tap, drag, dragFrom,
    steps: [
      // ---------- ch0: definitions on a number line ----------
      { ch: 0, setup: L => { L.state = { kind: "line", marks: {}, lineTitle: "ציר המספרים" }; },
        say: "הרבה שאלות \"קלות\" בבחינה נופלות על הגדרות. נבדוק אותן על הציר: לחיצה על מספר מסמנת אותו, ולחיצה נוספת מבטלת.",
        task: "סמן את כל המספרים הזוגיים שעל הציר, ואז לחץ 'בדוק'.",
        tools: checkBtn,
        demo: L => { setMarks(L, [-2, 0, 2, 4, 6, 8]); L.act({ type: "tap" }); },
        check: lineCheck([-2, 0, 2, 4, 6, 8],
          v => `${m(v < 0 ? "−" + (-v) : v)} הוא אי־זוגי: בחלוקה ב־2 נשארת שארית.`,
          miss => miss.includes(0) ? "ספרת את 0? הוא מתחלק ב־2 בלי שארית, ולכן הוא זוגי." : miss.some(v => v < 0) ? `גם שליליים יכולים להיות זוגיים: ${m("−2 = 2·(−1)")}.` : "חסר עוד מספר זוגי."),
        ok: `זוגי = מתחלק ב־2 בלי שארית. לכן גם 0 זוגי, וגם ${m("−2")}.` },
      { ch: 0, setup: L => { L.state.marks = {}; },
        say: "ראשוני הוא מספר טבעי שיש לו בדיוק שני מחלקים: 1 והוא עצמו.",
        task: "סמן את כל המספרים הראשוניים שעל הציר, ואז לחץ 'בדוק'.",
        tools: checkBtn,
        demo: L => { setMarks(L, [2, 3, 5, 7]); L.act({ type: "tap" }); },
        check: lineCheck([2, 3, 5, 7],
          v => v === 1 ? "1 אינו ראשוני: יש לו רק מחלק אחד, הוא עצמו." : v <= 0 ? "ראשוני חייב להיות מספר טבעי גדול מ־1." : `${v} מתחלק גם ב־2, אז יש לו יותר משני מחלקים.`,
          miss => miss.includes(2) ? "שכחת את 2. הוא מתחלק רק ב־1 וב־2, ולכן הוא ראשוני, הראשוני הזוגי היחיד." : "חסר עוד ראשוני. בדוק כל מספר: האם יש לו מחלק חוץ מ־1 ומעצמו?"),
        ok: "הראשוניים כאן: 2, 3, 5, 7. שתי המלכודות: <b>1 אינו ראשוני</b>, ו־<b>2 הוא הראשוני הזוגי היחיד</b>." },
      { ch: 0, setup: L => { L.state.marks = {}; L.state.bracket = null; },
        say: "מספר <b>טבעי</b> הוא מספר שלם וחיובי.",
        task: "כמה מספרים טבעיים יש על הציר?", choices: ["8", "9", "11", "12"],
        check: pick(0, { 1: "ספרת את 0? הוא שלם, אבל לא חיובי, ולכן לא טבעי.", 2: "ספרת גם שליליים. טבעי חייב להיות חיובי.", 3: "אלה כל המספרים השלמים שעל הציר. טבעי חייב להיות גם חיובי." }),
        ok: L => { L.state.bracket = [1, 8, "טבעיים: 1 עד 8"]; L.render(); return "1 עד 8, כלומר 8 מספרים. <b>0 אינו טבעי</b>, אבל הוא שלם וזוגי."; } },

      // ---------- ch1: numerator & denominator ----------
      { ch: 1, setup: L => { L.state = { strips: [strip({ y: 90, n: 5, tap: true, title: "שלם אחד, חתוך ל־5" })] }; },
        say: "זה פס באורך שלם אחד, חתוך ל־5 חלקים שווים. המכנה אומר לכמה חלקים חתכנו, והמונה אומר כמה חלקים לקחנו.",
        task: "לחץ על חלקים כדי לצבוע 3/5 מהפס.",
        demo: L => { S0(L)[0].sel = fill(5, 3); L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const c = cnt(S0(L)[0].sel); return c === 3 ? true : c > 3 ? "צבעת יותר מ־3 חלקים. המונה 3 אומר כמה חלקים לצבוע." : null; },
        ok: "זה 3/5: שלושה חלקים מתוך חמישה." },
      { ch: 1, setup: L => { const s = S0(L)[0]; s.tap = false; },
        say: "עכשיו ניקח פס זהה ונחתוך אותו ל־7 חלקים, במקום ל־5. ונצבע שוב 3 חלקים.",
        task: "לפני שנבדוק: איך 3/7 לעומת 3/5?", choices: ["3/7 גדול יותר", "3/7 קטן יותר", "הם שווים, כי בשניהם 3 חלקים"],
        check: (L, e) => { if (e.type !== "choice") return null; L.memo.guess = e.j; return true; },
        ok: "בוא נבדוק על הפס." },
      { ch: 1, setup: L => { L.state.strips.push(strip({ y: 230, n: 7, tap: true, title: "אותו שלם, חתוך ל־7" })); },
        say: "הנה הפס השני.", task: "צבע 3/7 בפס התחתון.",
        demo: L => { S0(L)[1].sel = fill(7, 3); L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const c = cnt(S0(L)[1].sel); return c === 3 ? true : c > 3 ? "צבעת יותר מ־3 חלקים בפס התחתון." : null; },
        ok: L => (L.memo.guess === 1 ? "צדקת. " : "") + "אותם 3 חלקים, אבל כל חלק קטן יותר, ולכן 3/7 קטן מ־3/5. <b>מכנה גדל ← השבר קטן. מונה גדל ← השבר גדל.</b>" },
      { ch: 1, setup: L => { L.state = { strips: [strip({ y: 40, n: 9, sel: fill(9, 4), h: 44 }), strip({ y: 140, n: 7, sel: fill(7, 4), h: 44 }), strip({ y: 240, n: 7, sel: fill(7, 3), h: 44 })] }; },
        say: "אפשר להשוות כמה שברים בלי לחשב: משווים זוג עם אותו מונה, ואחר כך זוג עם אותו מכנה.",
        task: "מי הגדול מבין 4/9, 4/7, 3/7?", choices: ["4/9", "4/7", "3/7"],
        check: pick(1, { 0: "ל־4/9 ול־4/7 אותו מונה. למי מהם החלקים גדולים יותר?", 2: "ל־3/7 ול־4/7 אותו מכנה. למי יש יותר חלקים?" }),
        ok: "4/7 גדול מ־4/9 (אותו מונה, מכנה קטן יותר) וגדול מ־3/7 (אותו מכנה, מונה גדול יותר). נשאר מועמד אחד." },

      // ---------- ch2: complement to 1 ----------
      { ch: 2, setup: L => { L.state = { strips: [strip({ y: 80, n: 8, sel: fill(8, 7), tap: true, mode: "gap" }), strip({ y: 210, n: 10, sel: fill(10, 9), tap: true, mode: "gap" })] }; L.memo.bad = false; },
        say: "7/8 מול 9/10: שני השברים קרובים מאוד ל־1. במקום לחשב, נבדוק <b>כמה חסר</b> לכל אחד עד שלם.",
        task: "לחץ על החלק החסר בכל אחד מהפסים.",
        demo: L => { S0(L)[0].gap = [0, 0, 0, 0, 0, 0, 0, 1]; S0(L)[1].gap = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1]; L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null;
          if (L.memo.bad) { L.memo.bad = false; return "זה חלק צבוע, הוא כבר בתוך השבר. חפש את החלק הריק, זה שחסר עד שלם."; }
          return S0(L).every(s => s.sel.every((v, k) => v || s.gap[k])) ? true : null; },
        ok: L => { L.state.notes = [G.he(X0 + U, 158, "חסרה שמינית", "w", "right"), G.he(X0 + U, 288, "חסרה עשירית", "w", "right")]; L.render(); return "ל־7/8 חסרה 1/8, ול־9/10 חסרה 1/10."; } },
      { ch: 2, say: "הסתכל על החלקים הכתומים.", task: "איזה שבר גדול יותר?", choices: ["7/8", "9/10", "הם שווים"],
        check: pick(1, { 0: "ל־7/8 חסרה שמינית, ל־9/10 חסרה עשירית. איזה חוסר קטן יותר?", 2: "שניהם חסרים חלק אחד, אבל החלקים לא באותו גודל." }),
        ok: "ל־9/10 חסר פחות, ולכן הוא גדול יותר. <b>השלמה ל־1 קטנה יותר ← השבר גדול יותר.</b>" },
      { ch: 2, setup: L => { L.state = { strips: [strip({ y: 80, n: 7, sel: fill(7, 5), gap: [0, 0, 0, 0, 0, 1, 1] }), strip({ y: 210, n: 11, sel: fill(11, 9), gap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1] })],
          notes: [G.he(X0 + U, 158, "חסרות 2/7", "w", "right"), G.he(X0 + U, 288, "חסרות 2/11", "w", "right")] }; },
        say: "עכשיו 5/7 מול 9/11. ההשלמות הן 2/7 ו־2/11. יש להן אותו מונה, ולכן קל להשוות ביניהן.",
        task: "איזה שבר גדול יותר?", choices: ["5/7", "9/11"],
        check: pick(1, { 0: "ל־5/7 חסרות 2/7. ל־9/11 חסרות 2/11. איזו השלמה קטנה יותר?" }),
        ok: "2/11 קטן מ־2/7, ולכן 9/11 הוא הגדול. השיטה נוחה כשהשברים קרובים ל־1 ולהשלמות יש אותו מונה. אחרת עוברים לכפל באלכסון." },

      // ---------- ch3: cross multiplication ----------
      { ch: 3, setup: L => { L.state = { strips: [strip({ y: 80, n: 7, sel: fill(7, 4) }), strip({ y: 210, n: 9, sel: fill(9, 5) })] }; },
        say: "4/7 מול 5/9. כאן ההשלמות (3/7 ו־4/9) לא עוזרות. הרעיון: לחתוך את שני הפסים לחלקים קטנים <b>באותו גודל</b>.",
        task: "לחץ על שני הכפתורים כדי לחתוך כל חלק בכל פס.",
        tools: L => [["חתוך כל שביעית ל־9", L => { S0(L)[0].sub = 9; L.render(); L.act({ type: "sub" }); }, S0(L)[0].sub === 1], ["חתוך כל תשיעית ל־7", L => { S0(L)[1].sub = 7; L.render(); L.act({ type: "sub" }); }, S0(L)[1].sub === 1]],
        demo: L => { S0(L)[0].sub = 9; S0(L)[1].sub = 7; L.act({ type: "sub" }); },
        check: (L, e) => e.type === "sub" && S0(L)[0].sub === 9 && S0(L)[1].sub === 7 ? true : null,
        ok: `עכשיו בשני הפסים יש 63 חלקים קטנים. בפס העליון צבועים ${m("4 · 9 = 36")}, ובתחתון ${m("5 · 7 = 35")}.` },
      { ch: 3, say: "שני הפסים חתוכים עכשיו לאותם חלקים.", task: "מי גדול יותר?", choices: ["4/7", "5/9", "הם שווים"],
        check: pick(0, { 1: "ספור חלקים צבועים: 36 למעלה, 35 למטה.", 2: `כמעט, אבל ${m("36 ≠ 35")}.` }),
        ok: `4/7 גדול, אבל רק בחלק אחד מתוך 63. זה כל הרעיון של <b>כפל באלכסון</b>: משווים את ${m("4·9")} מול ${m("5·7")}, בלי לחשב את המכנה 63.` },
      { ch: 3, setup: L => { L.state = { kind: "tokens", tok: [{ lab: "4·9 = 36", want: 0, x: 400, y: 290, hx: 400, hy: 290 }, { lab: "5·7 = 35", want: 1, x: 220, y: 290, hx: 220, hy: 290 }].map(t => Object.assign(t, { slot: null })) }; },
        say: "בכפל באלכסון כופלים כל מונה במכנה של השבר השני. המלכודת: לרשום את המכפלה מעל השבר הלא נכון.",
        task: "גרור כל מכפלה למשבצת שמעל השבר שאליו היא שייכת.",
        demo: L => { L.state.tok.forEach(t => { t.slot = t.want; t.x = SLOTS[t.want].x; t.y = SLOTS[t.want].y; }); L.act({ type: "drop" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const T = L.state.tok;
          const w = T.find(t => t.slot !== null && t.slot !== t.want);
          if (w) return w.want === 0 ? `${m("36 = 4·9")}, והמונה 4 שייך ל־4/7. המכפלה נכתבת מעל המונה שלה.` : `${m("35 = 5·7")}, והמונה 5 שייך ל־5/9. המכפלה נכתבת מעל המונה שלה.`;
          return T.every(t => t.slot === t.want) ? true : null; },
        ok: "36 מעל 4/7 ו־35 מעל 5/9. הצד עם המכפלה הגדולה הוא השבר הגדול. מי שמחליף צדדים הופך את התשובה." },

      // ---------- ch4: dividing by a fraction ----------
      { ch: 4, setup: L => { L.state = { kind: "measure", pieces: 0 }; },
        say: "חילוק שואל: <b>כמה פעמים</b> נכנס? למשל, 3 : 3/4 שואל כמה חתיכות של 3/4 נכנסות ב־3 שלמים.",
        task: "הוסף חתיכות של 3/4 עד שתמלא בדיוק את 3 השלמים.",
        tools: () => [["+ חתיכה של 3/4", L => { if (L.state.pieces < 5) L.state.pieces++; L.render(); L.act({ type: "add" }); }, true], ["בטל", L => { if (L.state.pieces) L.state.pieces--; L.render(); L.act({ type: "add" }); }]],
        demo: L => { L.state.pieces = 4; L.act({ type: "add" }); },
        check: (L, e) => { if (e.type !== "add") return null; const p = L.state.pieces; return p === 4 ? true : p > 4 ? "החתיכה האחרונה יוצאת מעבר לקו. לחץ 'בטל'." : null; },
        ok: `4 חתיכות. כלומר ${m("3 : 3/4 = 4")}, וזה בדיוק ${m("3 · 4/3 = 4")}. <b>חילוק בשבר = כפל בהופכי שלו.</b>` },
      { ch: 4, say: "עכשיו בלי פס.", task: `${m("2 : 2/5 = ?")}`, choices: ["4/5", "5", "1/5", "10"],
        check: pick(1, { 0: "כפלת ב־2/5 במקום לחלק. חילוק במספר קטן מ־1 מגדיל.", 2: "חילוק במספר קטן מ־1 מגדיל את התוצאה.", 3: "ההופכי של 2/5 הוא 5/2, לא 5." }),
        ok: `${m("2 · 5/2 = 5")}. בדיקה עם הפס: חתיכה של 2/5 נכנסת 5 פעמים ב־2 שלמים.` },

      // ---------- ch5: exam ----------
      { ch: 5, setup: L => { L.state = { strips: [strip({ y: 30, n: 15, sel: fill(15, 13), h: 44 }), strip({ y: 108, n: 8, sel: fill(8, 7), h: 44 }), strip({ y: 186, n: 19, sel: fill(19, 17), h: 44 }), strip({ y: 264, n: 12, sel: fill(12, 11), h: 44 })] }; },
        say: "שאלה ברמת מבחן. הפסים לפניך, אבל נסה לפתור בכלים שלמדת.",
        task: "איזה מהשברים הבאים הוא הגדול ביותר?", choices: ["13/15", "7/8", "17/19", "11/12"],
        check: pick(3, { 0: "ההשלמה של 13/15 היא 2/15. השווה אותה להשלמות האחרות.", 1: "ל־7/8 חסרה 1/8, כלומר 2/16. יש השלמה קטנה יותר.", 2: "ל־17/19 חסרות 2/19. ול־11/12 חסרה 1/12, כלומר 2/24. מי קטנה יותר?" }),
        ok: `ההשלמות: 2/15, ${m("1/8 = 2/16")}, 2/19, ${m("1/12 = 2/24")}. לכולן מונה 2, והקטנה ביותר היא 2/24. לכן <b>11/12</b> הוא הגדול.` },
      { ch: 5, say: "<b>סיכום ההמחשה:</b><br>1. 0 זוגי ושלם, אבל לא טבעי. 1 אינו ראשוני. 2 הוא הראשוני הזוגי היחיד.<br>2. מכנה גדל ← השבר קטן. מונה גדל ← השבר גדל.<br>3. שברים קרובים ל־1: ההשלמה הקטנה ← השבר הגדול. אחרת כפל באלכסון, והמכפלה נכתבת מעל המונה שלה.<br>4. חילוק בשבר = כפל בהופכי שלו.", next: "סיום ההמחשה" },
    ],
  });
})();
