/* Lab: ניסוי וטעייה, מינימום־מקסימום וחוקיות — models: draggable item columns (sharing with constraints),
   a snail on a wall with a sawtooth height graph (step-by-step pattern), a bead cycle (period + remainder),
   points on a circle joined by tapped segments (substitution of small n). */
(function () {
  const { G } = Lab;
  const BASE = 340, CW = 44, CG = 62, CX0 = 40;
  const colX = k => CX0 + k * CG;

  // ---------- columns ----------
  function stats(S) {
    const h = S.h, sum = h.reduce((a, b) => a + b, 0), cnt = {};
    h.forEach(v => cnt[v] = (cnt[v] || 0) + 1);
    return { sum, dup: h.some(v => cnt[v] > 1), low: h.some(v => v < S.min), max: Math.max(...h) };
  }
  function drawCols(S) {
    let h = "";
    const st = stats(S), cnt = {};
    S.h.forEach(v => cnt[v] = (cnt[v] || 0) + 1);
    S.h.forEach((v, k) => {
      const x = colX(k), top = BASE - v * S.u, bad = cnt[v] > 1 || v < S.min;
      h += G.rect(x, top, CW, v * S.u, bad ? "fwarn" : "fa", { rx: 3 });
      for (let j = 1; j < v; j++) if (S.u >= 7) h += G.line(x + 4, BASE - j * S.u, x + CW - 4, BASE - j * S.u, "thin", { opacity: .25 });
      h += G.t(x + CW / 2, top - 38, v, bad ? "w" : "b");
      h += G.knob(x + CW / 2, top - 16, "c" + k, 15);
      h += G.t(x + CW / 2, BASE + 22, k + 1, "m");
    });
    h += G.line(CX0 - 10, BASE, Math.max(colX(S.h.length), 300), BASE, "ink");
    h += G.he(CX0 - 10 + 0, BASE + 46, S.who, "m", "left");
    const left = S.total - st.sum;
    h += G.he(602, 34, `חולקו ${st.sum} מתוך ${S.total}`, "b", "right");
    h += G.he(602, 62, left > 0 ? `נשארו ${left}` : left < 0 ? `חסרים ${-left}!` : "הכל חולק", left === 0 ? "ok" : "w", "right");
    if (st.dup) h += G.he(602, 90, "שתי עמודות שוות", "w", "right");
    if (st.low) h += G.he(602, st.dup ? 118 : 90, `מישהו קיבל פחות מ־${S.min}`, "w", "right");
    return h;
  }

  // ---------- snail ----------
  function drawSnail(S) {
    let h = "";
    const y = m => 350 - m * 26, X = i => 150 + i * 28;
    h += G.rect(70, y(10), 40, 260, "fblue-soft");
    for (let m = 0; m <= 10; m += 2) h += G.t(60, y(m) + 5, m, "m", "end") + G.line(110, y(m), 590, y(m), "thin", { opacity: .15 });
    h += G.line(110, y(10), 590, y(10), "sok") + G.he(116, y(10) - 10, "פי הבור: 10 מ'", "ok", "left");
    const P = S.hist;
    h += G.path(P.map((m, i) => (i ? "L" : "M") + X(i) + "," + y(m)).join(" "), "sa");
    P.forEach((m, i) => { h += G.circle(X(i), y(m), 4, "dot"); });
    const last = P.length - 1;
    h += G.circle(X(last), y(P[last]), 11, "fsoft") + G.circle(90, y(P[last]), 9, "fa");
    for (let d = 1; 2 * d - 1 < P.length; d++) h += G.t(X(2 * d - 1), y(P[2 * d - 1]) - 14, d, "m");
    const day = Math.ceil(last / 2);
    h += G.he(590, 380, last ? `יום ${day}, ${last % 2 ? "סוף היום" : "סוף הלילה"}: ${P[last]} מ'` : "התחלה: 0 מ'", "b", "right");
    h += G.he(590, 30, "המספרים על הגרף: מספר היום", "m", "right");
    return h;
  }

  // ---------- beads ----------
  const BC = ["fa", "fok", "fblue", "fwarn"], BN = ["ורוד", "ירוק", "כחול", "צהוב"];
  function drawBeads(S) {
    let h = G.he(602, 50, "החרוזים חוזרים במחזור של 4", "b", "right");
    for (let c = 0; c < 3; c++) { const x1 = 40 + c * 4 * 44 - 18, x2 = x1 + 3 * 44 + 36; h += G.path(`M${x1},128 L${x1},118 L${x2},118 L${x2},128`, "mut") + G.he((x1 + x2) / 2, 108, `מחזור ${c + 1}`, "m", "middle"); }
    for (let i = 0; i < 12; i++) {
      const x = 40 + i * 44, picked = S.pick === i + 1;
      h += G.tap(G.circle(x, 160, 17, BC[i % 4] + " hot"), "p" + (i + 1));
      if (picked) h += G.circle(x, 160, 24, "sok");
      h += G.t(x, 205, i + 1, picked ? "b" : "m");
    }
    h += G.t(560, 166, "…", "big") + G.circle(595, 160, 17, "ghost") + G.t(595, 166, "?", "b") + G.t(595, 205, S.target, "a");
    if (S.note) h += G.t(310, 270, S.note, "big");
    return h;
  }

  // ---------- circle & substitution ----------
  const FORM = [["n(n − 1) / 2", n => n * (n - 1) / 2], ["2n − 3", n => 2 * n - 3], ["n + 1", n => n + 1], ["n²", n => n * n]];
  function cpt(S, i) { const a = -Math.PI / 2 + i * 2 * Math.PI / S.n; return [175 + 120 * Math.cos(a), 205 + 120 * Math.sin(a)]; }
  function drawCircle(S) {
    let h = G.circle(175, 205, 120, "dash");
    for (const k of S.chords) { const [i, j] = k.split("-").map(Number), [x1, y1] = cpt(S, i), [x2, y2] = cpt(S, j); h += G.line(x1, y1, x2, y2, "sblue"); }
    for (let i = 0; i < S.n; i++) { const [x, y] = cpt(S, i); h += G.tap(G.circle(x, y, 18, (S.sel === i ? "fa" : "fsoft") + " hot"), "v" + i); }
    h += G.t(20, 40, `n = ${S.n}`, "big", "start") + G.he(330, 40, `קטעים: ${S.chords.length}`, "b", "right");
    // formula table
    const tx = 350; h += G.t(tx, 100, "תשובה", "m", "start") + G.t(500, 100, "n = 3", "m") + G.t(570, 100, "n = 4", "m");
    FORM.forEach(([f, fn], r) => {
      const y = 140 + r * 44, hit3 = S.show3 && fn(3) === 3, hit4 = S.show4 && fn(4) === 6;
      h += G.rect(tx - 8, y - 26, 268, 38, hit4 ? "fok-soft" : hit3 ? "fblue-soft" : "box", { rx: 6 });
      h += G.t(tx, y, f, "b", "start");
      h += G.t(500, y, S.show3 ? fn(3) : "", hit3 ? "blue" : "m") + G.t(570, y, S.show4 ? fn(4) : "", hit4 ? "ok" : "m");
    });
    return h;
  }

  function draw(L) { const S = L.state; return S.mode === "cols" ? drawCols(S) : S.mode === "snail" ? drawSnail(S) : S.mode === "beads" ? drawBeads(S) : drawCircle(S); }
  function drag(L, key, pt) { const S = L.state, k = +key.slice(1); S.h[k] = Math.max(0, Math.min(S.total, Math.round((BASE - pt.y + 16) / S.u))); }
  function dragFrom(L, pt) {
    const S = L.state; if (S.mode !== "cols" || pt.y > BASE + 10) return null;
    const k = S.h.findIndex((_, i) => pt.x >= colX(i) - 6 && pt.x <= colX(i) + CW + 6);
    return k >= 0 ? "c" + k : null;
  }
  function tap(L, key) {
    const S = L.state;
    if (key[0] === "p") S.pick = +key.slice(1);
    if (key[0] === "v") {
      const i = +key.slice(1);
      if (S.sel === null) { S.sel = i; return false; }
      if (S.sel === i) { S.sel = null; return false; }
      const k = [Math.min(S.sel, i), Math.max(S.sel, i)].join("-"); S.sel = null;
      if (!S.chords.includes(k)) S.chords.push(k);
    }
  }

  const cols = (total, h, u, who, min = 1) => ({ mode: "cols", total, h, u, who, min });
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const submit = [["סיימתי", L => L.act({ type: "submit" }), true]];
  function validity(S) {
    const st = stats(S), left = S.total - st.sum;
    if (st.low) return `כל אחד צריך לקבל לפחות ${S.min}.`;
    if (left > 0) return `נשארו ${left} שעוד לא חולקו. כולם צריכים להתחלק.`;
    if (left < 0) return `חילקת ${-left} יותר ממה שיש.`;
    if (st.dup) return "לשתי עמודות יש אותו מספר, וזה אסור: כל המספרים שונים.";
    return null;
  }
  const circleCheck = want => (L, e) => e.type === "tap" && L.state.chords.length === want ? true : null;
  const allChords = n => { const c = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) c.push(i + "-" + j); return c; };

  Lab.register({
    id: "prb-trial", title: "מעבדת ניסוי וטעייה", viewBox: "0 0 620 400",
    chapters: ["מקסימום לאחד", "מה יכול ומה לא", "חוקיות צעד־צעד", "הצבת n קטן", "שאלת מבחן"],
    draw, drag, dragFrom, tap,
    steps: [
      // ---- ch0: min-max
      { ch: 0, setup: L => { L.state = cols(30, [9, 10, 11], 8, "ילדים"); },
        say: "30 עוגיות מתחלקות בין 3 ילדים. כל ילד מקבל לפחות אחת, ואין שני ילדים עם אותו מספר. כל עמודה היא ילד, וגוררים אותה מהעיגול שמעליה.",
        task: "חלק את כל העוגיות כך שילד אחד יקבל <b>כמה שיותר</b>. כשתסיים, לחץ 'סיימתי'.",
        tools: () => submit,
        demo: L => { L.state.h = [1, 2, 27]; L.act({ type: "submit" }); },
        check: (L, e) => { if (e.type !== "submit") return null; const v = validity(L.state); if (v) return v;
          const m = stats(L.state).max; return m === 27 ? true : `הגדול קיבל ${m}. אפשר יותר: תן לשני האחרים כמה שפחות.`; },
        ok: "1 + 2 + 27. <b>מקסימום לאחד = מינימום לכל השאר</b>: המינימום הוא 1 ו־2 (לא 1 ו־1, כי המספרים שונים)." },
      { ch: 0, say: "עכשיו שאלה הפוכה: כמה שיותר ילדים. אפשר להוסיף ולהוריד ילדים.",
        task: "חלק את כל 30 העוגיות בין <b>כמה שיותר</b> ילדים, באותם תנאים, ולחץ 'סיימתי'.",
        tools: () => [["+ ילד", L => { if (L.state.h.length < 8) L.state.h.push(0); }], ["− ילד", L => { if (L.state.h.length > 1) L.state.h.pop(); }], ...submit],
        demo: L => { L.state.h = [1, 2, 3, 4, 5, 6, 9]; L.act({ type: "submit" }); },
        check: (L, e) => { if (e.type !== "submit") return null; const v = validity(L.state); if (v) return v;
          const n = L.state.h.length; return n === 7 ? true : `${n} ילדים זה תקין, אבל אפשר יותר. תן לכל אחד כמה שפחות: 1, 2, 3, ...`; },
        ok: "1 + 2 + ... + 6 = 21, והעודף (9) הולך לילד אחרון אחד. כדי שיהיו <b>כמה שיותר</b> משתתפים, כל אחד מקבל <b>כמה שפחות</b>." },
      { ch: 0, task: "האם אפשר לחלק את 30 העוגיות בין 8 ילדים?",
        choices: ["כן, אם מחלקים נכון", "לא: ‏1 + 2 + ... + 8 = 36, יותר מ־30", "לא: ‏30 לא מתחלק ב־8"],
        check: pick(1, { 0: "נסה את החלוקה הקטנה ביותר האפשרית ל־8 ילדים שונים: 1, 2, ..., 8. כמה עוגיות היא דורשת?", 2: "לא צריך שיתחלק שווה. המספרים דווקא חייבים להיות שונים. מה החלוקה הכי חסכונית ל־8?" }),
        ok: "המינימום ל־8 ילדים הוא 36 עוגיות. לכן 7 הוא המקסימום. כך מוכיחים: דוגמה ל־7, וחישוב שמראה ש־8 לא ייתכן." },

      // ---- ch1: what can / can't be
      { ch: 1, setup: L => { L.state = cols(12, [2, 4, 6], 16, "שלושה מספרים שונים"); },
        say: "שלושה מספרים שלמים חיוביים <b>שונים</b>, וסכומם 12. נבדוק מה יכול להיות המספר הגדול שבהם.",
        task: "בנה דוגמה שבה המספר הגדול <b>קטן ככל האפשר</b>, ולחץ 'סיימתי'.",
        tools: () => submit,
        demo: L => { L.state.h = [3, 4, 5]; L.act({ type: "submit" }); },
        check: (L, e) => { if (e.type !== "submit") return null; const v = validity(L.state); if (v) return v;
          const m = stats(L.state).max; return m === 5 ? true : `הגדול כאן ${m}. אפשר להקטין אותו: קרב את שלושת המספרים זה לזה.`; },
        ok: "3 + 4 + 5 = 12. הגדול לא יכול להיות 4: גם 2 + 3 + 4 = 9 בלבד." },
      { ch: 1, task: "ועכשיו דוגמה שבה המספר הגדול <b>גדול ככל האפשר</b>.",
        tools: () => submit,
        demo: L => { L.state.h = [1, 2, 9]; L.act({ type: "submit" }); },
        check: (L, e) => { if (e.type !== "submit") return null; const v = validity(L.state); if (v) return v;
          const m = stats(L.state).max; return m === 9 ? true : `הגדול כאן ${m}. כדי להגדיל אותו, תן לשניים האחרים את המינימום.`; },
        ok: "1 + 2 + 9 = 12. אז הגדול נע בין 5 ל־9." },
      { ch: 1, say: "בשאלת 'מה <b>לא</b> יכול להיות' מראים דוגמה לכל התשובות האחרות. העמודות פתוחות לניסוי.",
        task: "איזה מהמספרים הבאים <b>אינו יכול</b> להיות המספר הגדול?",
        choices: ["5", "6", "9", "10"],
        check: pick(3, { 0: "כבר בנית דוגמה: 3 + 4 + 5.", 1: "נסה 1 + 5 + 6.", 2: "כבר בנית דוגמה: 1 + 2 + 9." }),
        ok: "10 ייתן לשניים האחרים רק 2, כלומר 1 + 1. אבל המספרים חייבים להיות שונים. מלכודת נפוצה: לשכוח תנאי כזה." },

      // ---- ch2: pattern step by step
      { ch: 2, setup: L => { L.state = { mode: "snail", hist: [0], next: "day" }; },
        say: "חילזון בתחתית בור בעומק 10 מ'. ביום הוא מטפס 3 מ', ובלילה מחליק 2 מ'.",
        task: "ניחוש לפני שבודקים: באיזה יום הוא יוצא מהבור?",
        choices: ["ביום ה־10", "ביום ה־9", "ביום ה־8", "ביום ה־7"],
        check: (L, e) => { if (e.type !== "choice") return null; L.memo.snail = e.j; return true; },
        ok: L => L.memo.snail === 0 ? "ניחוש של 'מטר ליממה'. בוא נבדוק צעד אחרי צעד." : "בוא נבדוק צעד אחרי צעד." },
      { ch: 2, say: "בחוקיות לא מחפשים נוסחה. רושמים שלב אחרי שלב עד שמגיעים.",
        task: "לחץ על הכפתורים לפי הסדר עד שהחילזון יוצא.",
        tools: () => [["בוקר: ‏+3", L => L.act({ type: "day" }), true], ["לילה: ‏−2", L => L.act({ type: "night" })]],
        demo: L => { L.state.hist = [0, 3, 1, 4, 2, 5, 3, 6, 4, 7, 5, 8, 6, 9, 7, 10]; L.act({ type: "out" }); },
        check: (L, e) => { const S = L.state, P = S.hist, cur = P[P.length - 1];
          if (e.type === "out") return true;
          if (e.type !== "day" && e.type !== "night") return null;
          const want = P.length % 2 ? "day" : "night";
          if (e.type !== want) return want === "day" ? (P.length === 1 ? "מתחילים בבוקר: קודם החילזון מטפס." : "אחרי לילה בא בוקר.") : "אחרי יום בא לילה.";
          P.push(e.type === "day" ? cur + 3 : cur - 2); L.render();
          return P[P.length - 1] >= 10 ? true : null; },
        ok: L => (L.memo.snail === 2 ? "ניחשת נכון! " : "") + "ביום ה־8 הוא מתחיל ב־7 מ' ומטפס ל־10, ויוצא <b>לפני</b> שהלילה מוריד אותו. מי שמחלק 10 ב'מטר ליממה' מקבל 10, ושוכח שהיעד מושג באמצע מחזור." },
      { ch: 2, setup: L => { L.state = { mode: "beads", pick: null, target: 50, note: "" }; },
        say: "כשיש מחזור שחוזר, לא סופרים עד הסוף. מוצאים את אורך המחזור ומשתמשים בשארית.",
        task: "לחץ על החרוז בשורה שזהה בצבעו לחרוז מספר 50.",
        demo: L => { L.state.pick = 2; L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const p = L.state.pick;
          if (p % 4 === 2) { L.state.note = "50 = 12 · 4 + 2"; return true; }
          if (p % 4 === 0) return "חרוז 48 = 12 · 4 סוגר מחזור. ‏50 בא אחריו בעוד כמה צעדים?";
          return "כמה מחזורים שלמים של 4 נכנסים ב־50, וכמה נשאר?"; },
        ok: "50 ÷ 4 = 12 ושארית 2, ולכן חרוז 50 זהה לחרוז השני במחזור: ירוק." },
      { ch: 2, setup: L => { Object.assign(L.state, { pick: null, target: 48, note: "" }); }, task: "ומה הצבע של חרוז מספר 48?",
        choices: BN,
        check: pick(3, { 0: "שארית 0 לא אומרת 'החרוז הראשון'. ‏48 = 12 · 4, כלומר הוא סוגר מחזור.", 1: "48 קטן מ־50 ב־2. חזור שני צעדים אחורה מהחרוז הירוק.", 2: "48 = 12 · 4 בדיוק. איזה חרוז סוגר כל מחזור?" }),
        ok: "שארית 0 = <b>האחרון</b> במחזור (כמו חרוזים 4, 8, 12): צהוב. זו טעות הקצוות הקלאסית." },

      // ---- ch3: substitution
      { ch: 3, setup: L => { L.state = { mode: "circle", n: 3, sel: null, chords: [], show3: false, show4: false }; },
        say: "שאלה: n נקודות על מעגל, וכל שתיים מחוברות בקטע. כמה קטעים יש? בתשובות (בטבלה) יש ביטויים עם n. הקורס אומר: הצב n קטן וספור בעצמך.",
        task: "חבר כל זוג נקודות: לחץ על נקודה ואז על נקודה אחרת.",
        demo: L => { L.state.chords = allChords(3); L.act({ type: "tap" }); },
        check: circleCheck(3),
        ok: "ל־3 נקודות יש 3 קטעים." },
      { ch: 3, task: "הצב n = 3 בארבע התשובות. כמה מהן נותנות 3?",
        choices: ["אחת", "שתיים", "שלוש", "אף אחת"],
        check: (L, e) => { if (e.type !== "choice") return null; L.state.show3 = true; L.render(); return e.j === 1 ? true : "ראה בטבלה: ‏3 · 2 / 2 = 3, וגם 2 · 3 − 3 = 3. לכן שתיים."; },
        ok: "שתי תשובות מתאימות, אז ההצבה לא הכריעה. במקרה כזה <b>מציבים מספר נוסף</b>." },
      { ch: 3, setup: L => Object.assign(L.state, { n: 4, sel: null, chords: [] }),
        say: "עכשיו 4 נקודות. אל תשכח את האלכסונים.", task: "חבר כל זוג נקודות.",
        demo: L => { L.state.chords = allChords(4); L.act({ type: "tap" }); },
        check: circleCheck(6),
        ok: "6 קטעים: 4 צלעות ו־2 אלכסונים." },
      { ch: 3, task: "איזו תשובה נכונה?",
        choices: ["n(n − 1) / 2", "2n − 3", "n + 1", "n²"],
        check: (L, e) => { if (e.type !== "choice") return null; L.state.show4 = true; L.render(); return e.j === 0 ? true : { 1: "ב־n = 4 היא נותנת 5, וספרת 6.", 2: "כבר ב־n = 3 היא נתנה 4 ולא 3.", 3: "כבר ב־n = 3 היא נתנה 9 ולא 3." }[e.j]; },
        ok: "רק n(n − 1) / 2 נותן 6. הצבה של n קטן, ובדיקה של <b>כל</b> ארבע התשובות." },

      // ---- ch4: exam
      { ch: 4, setup: L => { L.state = cols(40, [8, 8, 8, 8, 8], 7, "קבוצות", 2); },
        say: "שאלה ברמת מבחן. העמודות פתוחות לשימוש (40 תלמידים, 5 קבוצות).",
        task: "40 תלמידים מתחלקים ל־5 קבוצות. בכל קבוצה לפחות 2 תלמידים, ואין שתי קבוצות באותו גודל. מהו המספר הגדול ביותר האפשרי של תלמידים בקבוצה אחת?",
        choices: ["22", "26", "30", "32"],
        check: pick(1, { 0: "יש חלוקה עם קבוצה גדולה יותר. תן לארבע האחרות כמה שפחות.", 2: "זה יוצא אם האחרות מקבלות 1, 2, 3, 4. אבל בכל קבוצה לפחות 2.", 3: "זה יוצא אם האחרות מקבלות 2, 2, 2, 2. אבל הגדלים שונים." }),
        ok: "המינימום לארבע הקבוצות האחרות: 2 + 3 + 4 + 5 = 14. נשארים 40 − 14 = <b>26</b>." },
      { ch: 4, say: "<b>סיכום המעבדה:</b><br>1. מקסימום לאחד = מינימום לכל השאר. כמה שיותר משתתפים = כל אחד מקבל כמה שפחות.<br>2. 'מה יכול להיות': דוגמה אחת. 'מה לא יכול': דוגמה לכל האחרות. לא לשכוח תנאים (שונים, לפחות 2).<br>3. חוקיות: רושמים שלב אחרי שלב ובודקים קצוות. במחזור משתמשים בשארית, ושארית 0 = האחרון.<br>4. תשובות עם n: מציבים n קטן ובודקים את כל התשובות. אם שתיים מתאימות, מציבים עוד מספר.", next: "סיום המעבדה" },
    ],
  });
})();
