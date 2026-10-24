/* Lab: תרגילים באותיות והגדרת פעולה — models: place-value rods & cubes (AB = 10A + B), a vertical letter-sum board
   with a digit pad, operation "machines" with input slots (plain, nested), a conditional machine with two doors,
   and a recursion staircase. */
(function () {
  const { G } = Lab;
  const SX0 = 130, SX1 = 570, AY = 296, BY = 362;
  const sx = (v, lo, hi) => SX0 + (v - lo) / (hi - lo) * (SX1 - SX0);
  const sv = (x, lo, hi) => Math.max(lo, Math.min(hi, Math.round(lo + (x - SX0) / (SX1 - SX0) * (hi - lo))));
  function slider(y, v, lo, hi, key, label) {
    let h = G.t(SX0 - 22, y + 7, label, "b", "end") + G.line(SX0, y, SX1, y, "mut");
    for (let k = lo; k <= hi; k++) { const x = sx(k, lo, hi); h += G.line(x, y - 4, x, y + 4, "mut") + G.t(x, y + 38, k, k === v ? "a" : "m"); }
    return h + G.knob(sx(v, lo, hi), y, key, 16);
  }

  // ---------- place value ----------
  function group(x0, tens, ones, name) {
    let h = "";
    for (let i = 0; i < tens; i++) h += G.rect(x0 + i * 15, 90, 11, 110, "fblue", { rx: 2 });
    const cx = x0 + Math.max(tens, 1) * 15 + 8;
    for (let i = 0; i < ones; i++) h += G.rect(cx + Math.floor(i / 5) * 15, 189 - (i % 5) * 15, 11, 11, "fa", { rx: 2 });
    h += G.t(x0, 72, name + " = " + (tens * 10 + ones), "big", "start");
    h += G.he(x0, 228, `${tens} עשרות, ${ones} אחדות`, "m", "left");
    return h;
  }
  function drawPV(S) {
    let h = group(30, S.A, S.B, "AB");
    if (S.showBA) h += G.line(318, 60, 318, 236, "dash") + group(336, S.B, S.A, "BA");
    if (S.showBA === "sum") h += G.t(310, 270, `${10 * S.A + S.B} + ${10 * S.B + S.A} = ${S.A + S.B} · 10 + ${S.A + S.B} = 11 · ${S.A + S.B} = ${11 * (S.A + S.B)}`, "b");
    if (S.showBA === "diff") { const d = 9 * (S.A - S.B); h += G.t(310, 270, `${10 * S.A + S.B} − ${10 * S.B + S.A} = ${d}  =  9 · (${S.A} − ${S.B})`, "b"); }
    h += slider(AY, S.A, S.lo, 9, "A", "A") + slider(BY, S.B, S.loB, 9, "B", "B");
    return h;
  }

  // ---------- column letter-sum ----------
  const CX = [250, 310, 370], RY = [52, 112, 196];
  const PUZ = [["", "A", "B"], ["", "A", "B"], ["B", "C", "C"]];
  function drawCol(S) {
    let h = "";
    if (S.col !== null) h += G.rect(CX[S.col] - 30, 30, 60, 230, "fwarn", { rx: 8 });
    h += G.t(CX[0] - 56, RY[1] + 33, "+", "big") + G.line(CX[0] - 70, 182, CX[2] + 30, 182, "ink");
    PUZ.forEach((row, r) => row.forEach((ch, c) => {
      if (!ch) return;
      const x = CX[c] - 25, y = RY[r], v = S.val[ch], foc = S.focus === ch;
      h += G.rect(x, y, 50, 50, foc ? "fsoft" : "box", { rx: 8 });
      if (v === null) h += G.t(CX[c], y + 34, ch, "big");
      else h += G.t(CX[c], y + 34, v, "big") + G.t(x + 9, y + 15, ch, "m");
    }));
    if (S.carry) h += G.t(CX[0], 26, "1", "w") + G.arrow(CX[1] - 4, 20, CX[0] + 12, 20, "thin");
    h += G.he(600, 70, "ספרות שונות", "m", "right");
    ["A", "B", "C"].forEach((ch, i) => h += G.t(560, 110 + i * 32, ch + " = " + (S.val[ch] === null ? "?" : S.val[ch]), S.focus === ch ? "a" : "b", "middle"));
    if (S.pad) for (let d = 0; d <= 9; d++) {
      const x = 40 + d * 54;
      h += G.tap(G.rect(x, 300, 48, 52, "box hot", { rx: 8 }), "k" + d) + G.t(x + 24, 333, d, "b", "middle", { "pointer-events": "none" });
    }
    if (S.pad) h += G.he(600, 284, "לחץ על ספרה כדי להציב אותה באות המסומנת", "m", "right");
    return h;
  }

  // ---------- machines ----------
  function machine(x, y, a, b, out, formula, sym) {
    let h = "";
    const slot = (sx_, sy, v, nm) => G.rect(sx_, sy, 46, 40, v === null ? "fwarn" : "fblue-soft", { rx: 8 }) + G.t(sx_ + 23, sy + 27, v === null ? nm : v, v === null ? "m" : "b");
    h += slot(x, y, a, "a") + slot(x, y + 52, b, "b");
    h += G.arrow(x + 48, y + 20, x + 76, y + 40, "thin") + G.arrow(x + 48, y + 72, x + 76, y + 54, "thin");
    h += G.rect(x + 78, y + 10, 160, 72, "bg", { rx: 12 }) + G.t(x + 158, y + 42, sym, "big") + G.t(x + 158, y + 68, formula, "m");
    h += G.arrow(x + 238, y + 46, x + 264, y + 46, "thin");
    h += G.rect(x + 266, y + 26, 56, 40, out === null ? "ghost" : "fok-soft", { rx: 8 }) + G.t(x + 294, y + 53, out === null ? "?" : out, out === null ? "m" : "ok");
    return h;
  }
  const op = (a, b) => 2 * a + b * b;
  function drawOp(S) {
    let h = "";
    if (S.top) h += G.t(310, 30, S.top, "big");
    if (S.nested) {
      h += machine(40, 50, S.ia, S.ib, S.iout, S.formula, S.sym);
      h += machine(250, 200, S.oa, S.ob, S.oout, S.formula, S.sym);
      h += G.path(`M${40 + 322},${96} C 420,140 200,150 ${250 + 23},${200}`, S.iout === null ? "dash" : "sok");
      h += G.he(600, 130, "פנימית (בסוגריים)", "m", "right") + G.he(240, 330, "חיצונית", "m", "right");
      if (S.calc) h += G.t(20, 360, S.calc, "b", "start");
      return h;
    }
    h += machine(150, 70, S.a, S.b, S.out, S.formula, S.sym);
    if (S.calc) h += G.t(310, 220, S.calc, "b");
    if (S.cards) {
      h += G.he(600, 262, "כרטיסי מספרים: לחץ כדי להכניס למכונה", "m", "right");
      for (let v = 1; v <= 5; v++) { const x = 160 + (v - 1) * 62; h += G.tap(G.rect(x, 280, 52, 52, "box hot", { rx: 8 }), "c" + v) + G.t(x + 26, 313, v, "big", "middle", { "pointer-events": "none" }); }
    }
    return h;
  }

  // ---------- conditional ----------
  function drawCond(S) {
    let h = "";
    const chain = S.hist.join("  →  ");
    h += G.t(310, 40, chain, "big");
    h += G.he(600, 80, `הפעלות: ${S.hist.length - 1} מתוך 3`, "m", "right");
    const cur = S.hist[S.hist.length - 1];
    h += G.circle(310, 150, 42, "fsoft") + G.t(310, 160, cur, "big");
    const doors = [{ k: "even", x: 70, lab: "זוגי", f: "n ÷ 2" }, { k: "odd", x: 370, lab: "אי־זוגי", f: "n + 7" }];
    for (const d of doors) {
      h += G.tap(G.rect(d.x, 230, 180, 90, (S.flash === d.k ? "fwarn" : "fblue-soft") + " hot", { rx: 12 }), d.k);
      h += G.he(d.x + 90, 266, d.lab, "b", "middle", { "pointer-events": "none" }) + G.t(d.x + 90, 300, d.f, "blue", "middle", { "pointer-events": "none" });
    }
    h += G.arrow(282, 182, 190, 226, "thin") + G.arrow(338, 182, 430, 226, "thin");
    return h;
  }

  // ---------- recursion staircase ----------
  const F = { 1: 3, 2: 5, 3: 9, 4: 17 };
  function drawRec(S) {
    let h = G.t(40, 34, "f(1) = 3", "b", "start") + G.t(580, 34, "f(n) = 2 · f(n − 1) − 1", "b", "end");
    for (let n = 4; n >= 1; n--) {
      const i = 4 - n, x = 40 + i * 140, y = 90 + i * 62;
      h += G.rect(x, y, 130, 46, n === 1 ? "fok-soft" : S.known[n] ? "fblue-soft" : "box", { rx: 8 });
      h += G.t(x + 65, y + 30, S.known[n] ? `f(${n}) = ${F[n]}` : `f(${n}) = ?`, S.known[n] ? "b" : "m");
      if (n > 1) h += G.path(`M${x + 130},${y + 23} L${x + 140},${y + 23} L${x + 140},${y + 62}`, "mut");
      if (S.at === n) h += G.circle(x + 65, y - 14, 10, "fa");
    }
    h += G.he(600, 380, S.phase === "down" ? "יורדים עד שמגיעים לערך ידוע" : "מטפסים בחזרה ומציבים", "m", "right");
    return h;
  }

  function draw(L) { const S = L.state; return S.mode === "pv" ? drawPV(S) : S.mode === "col" ? drawCol(S) : S.mode === "op" ? drawOp(S) : S.mode === "cond" ? drawCond(S) : drawRec(S); }
  function drag(L, key, pt) { const S = L.state; if (key === "A") S.A = sv(pt.x, S.lo, 9); if (key === "B") S.B = sv(pt.x, S.loB, 9); }
  function dragFrom(L, pt) {
    if (L.state.mode !== "pv" || pt.x < SX0 - 20 || pt.x > SX1 + 20) return null;
    return Math.abs(pt.y - AY) < 24 ? "A" : Math.abs(pt.y - BY) < 24 ? "B" : null;
  }
  function tap(L, key) {
    const S = L.state;
    if (key[0] === "k" && S.focus) S.val[S.focus] = +key.slice(1);
    else if (key[0] === "c") {
      const v = +key.slice(1);
      if (S.a === null) S.a = v; else if (S.b === null) S.b = v; else return false;
      if (S.b !== null) { S.out = op(S.a, S.b); S.calc = `${S.a} ◆ ${S.b} = 2 · ${S.a} + ${S.b}² = ${S.out}`; }
      return S.b !== null ? undefined : false;
    } else if (key === "even" || key === "odd") S.last = key;
  }

  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const opState = o => Object.assign({ mode: "op", sym: "a ◆ b", formula: "2a + b²", a: null, b: null, out: null, calc: "", cards: false, top: "" }, o);
  const colState = (focus, col, val) => ({ mode: "col", focus, col, val, pad: true, carry: false });
  const digitCheck = (letter, right, hintFor) => (L, e) => { if (e.type !== "tap") return null; const d = L.state.val[letter]; return d === right ? true : hintFor(d); };

  Lab.register({
    id: "alg-letters-operations", title: "מעבדת אותיות ופעולות", viewBox: "0 0 620 415",
    chapters: ["AB = 10A + B", "תרגיל במאונך", "הגדרת פעולה", "פעולה עם תנאים", "שאלת מבחן"],
    draw, drag, dragFrom, tap,
    steps: [
      // ---- ch0: place value
      { ch: 0, setup: L => { L.state = { mode: "pv", A: 2, B: 3, lo: 1, loB: 0, showBA: false }; },
        say: "בתרגילים באותיות, AB הוא <b>מספר דו־ספרתי</b>, לא A כפול B. ‏A היא ספרת העשרות (מוטות כחולים של 10) ו־B ספרת האחדות (קוביות).",
        task: "גרור את המחוונים כך שייבנה המספר 47.",
        demo: L => { Object.assign(L.state, { A: 4, B: 7 }); L.act({ type: "drop", key: "B" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const { A, B } = L.state;
          if (A === 4 && B === 7) return true;
          if (A === 7 && B === 4) return "בנית 74. ‏A היא ספרת העשרות, כלומר מספר המוטות.";
          if (e.key === "A" && A !== 4) return "A היא ספרת העשרות: כמה מוטות של 10 יש ב־47?";
          if (e.key === "B" && B !== 7) return "B היא ספרת האחדות: כמה קוביות בודדות יש ב־47?";
          return null; },
        ok: "47 = 4 · 10 + 7. ובאופן כללי: <b>AB = 10A + B</b>." },
      { ch: 0, say: "עכשיו נהפוך את הספרות: BA הוא 74.", task: "לחץ על 'הוסף את BA'.",
        tools: () => [["הוסף את BA", L => { L.state.showBA = "sum"; L.act({ type: "ba" }); }, true]],
        demo: L => { L.state.showBA = "sum"; L.act({ type: "ba" }); },
        check: (L, e) => e.type === "ba" ? true : null,
        ok: "ספור יחד: 4 + 7 = 11 מוטות, ו־7 + 4 = 11 קוביות. ‏11 · 10 + 11 = 11 · 11 = 121." },
      { ch: 0, say: "אפשר להזיז את המחוונים ולנסות ספרות אחרות לפני שעונים.", task: "AB + BA מתחלק <b>תמיד</b> ב־",
        choices: ["2", "9", "10", "11"],
        check: pick(3, { 0: "נסה A = 2, B = 3: ‏23 + 32 = 55. זה לא זוגי.", 1: "9 שייך להפרש AB − BA. בחיבור ספור מוטות וקוביות.", 2: "47 + 74 = 121 לא מתחלק ב־10." }),
        ok: "תמיד יש A + B מוטות ו־A + B קוביות, ולכן <b>AB + BA = 11(A + B)</b>." },
      { ch: 0, setup: L => { Object.assign(L.state, { showBA: "diff", loB: 1, A: 5, B: 3 }); },
        say: "ובחיסור: כל מוט שעובר מצד לצד שווה 10, וכל קובייה 1. לכן ההפרש הוא תמיד 9 כפול ההפרש בין הספרות.",
        task: "קבע ספרות כך ש־AB − BA = 36.",
        demo: L => { Object.assign(L.state, { A: 7, B: 3 }); L.act({ type: "drop", key: "B" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const { A, B } = L.state, d = 9 * (A - B);
          if (d === 36) return true;
          if (d === -36) return "יצא −36: ‏BA גדול מ־AB. ‏A צריכה להיות הספרה הגדולה.";
          return `ההפרש עכשיו ${d} = 9 · ${A - B}. כמה צריך להיות A − B כדי לקבל 36?`; },
        ok: L => `${10 * L.state.A + L.state.B} − ${10 * L.state.B + L.state.A} = 36. כל זוג עם A − B = 4 עובד, כי <b>AB − BA = 9(A − B)</b>.` },

      // ---- ch1: vertical letter sum
      { ch: 1, setup: L => { L.state = colState("B", 0, { A: null, B: null, C: null }); },
        say: "AB + AB = BCC, ואותיות שונות הן ספרות שונות. שיטת הקורס: כותבים במאונך, ומתחילים מהספרה השמאלית או מהאחדות, לפי מה שנותן מידע.",
        task: "התחל מהשמאלית: מה B? לחץ על ספרה.",
        demo: L => { L.state.val.B = 1; L.act({ type: "tap" }); },
        check: digitCheck("B", 1, d => d === 0 ? "מספר לא מתחיל ב־0." : `שני מספרים דו־ספרתיים נותנים יחד פחות מ־200, אז ההעברה למאות היא לכל היותר 1. ‏${d} גדול מדי.`),
        ok: "B = 1: ‏AB + AB קטן מ־200, ולכן ספרת המאות היא 1. ו־B מופיע גם בעמודת האחדות." },
      { ch: 1, setup: L => { Object.assign(L.state, { focus: "C", col: 2 }); },
        say: "עכשיו עמודת האחדות: B + B, ואנחנו כבר יודעים ש־B = 1.", task: "מה C?",
        demo: L => { L.state.val.C = 2; L.act({ type: "tap" }); },
        check: digitCheck("C", 2, d => d === 1 ? "B כבר 1, ואותיות שונות הן ספרות שונות." : "בעמודת האחדות: B + B = 1 + 1. מה ספרת האחדות?"),
        ok: "C = 2, ואין העברה לעשרות (1 + 1 קטן מ־10)." },
      { ch: 1, setup: L => { Object.assign(L.state, { focus: "A", col: 1, carry: true }); },
        say: "עמודת העשרות: A + A צריך לתת את C = 2 בעשרות, ועוד 1 שעובר למאות (החץ הכתום).", task: "מה A?",
        demo: L => { L.state.val.A = 6; L.act({ type: "tap" }); },
        check: digitCheck("A", 6, d => d === 1 ? "A + A = 1 + 1 = 2, אבל אז לא עובר 1 למאות. וגם B כבר 1." : `${d} + ${d} = ${2 * d}. צריך 12: הספרה 2 בעשרות ו־1 שעובר למאות.`),
        ok: "61 + 61 = 122. ‏A = 6, ‏B = 1, ‏C = 2." },
      { ch: 1, setup: L => { L.state.pad = false; L.state.focus = null; L.state.col = 0; },
        say: "הכלל של העמודה השמאלית עובד בכל תרגיל כזה.", task: "PQ + RS = TUV (כל האותיות ספרות שונות). מה T?",
        choices: ["1", "2", "9", "אי אפשר לדעת"],
        check: pick(0, { 1: "הסכום הגדול ביותר של שני דו־ספרתיים הוא 99 + 98 = 197. אז המאות?", 2: "9 בעמודת המאות פירושו 900 ומעלה. שני דו־ספרתיים לא מגיעים לשם.", 3: "אפשר: הסכום בין 100 ל־197, ולכן ספרת המאות ידועה." }),
        ok: "T = 1. חיבור של שני מספרים מעביר לעמודה הבאה לכל היותר 1." },

      // ---- ch2: defined operation
      { ch: 2, setup: L => { L.state = opState({ cards: true, top: "3 ◆ 2 = ?" }); },
        say: "פעולה מוגדרת היא מכונה: a ◆ b = 2a + b². ‏a הוא מה שמשמאל לסימן, ו־b מה שמימין. מציבים בדיוק כמו בנוסחה.",
        task: "חשב 3 ◆ 2: לחץ על כרטיס למשבצת a ואחר כך על כרטיס למשבצת b.",
        tools: () => [["נקה", L => Object.assign(L.state, { a: null, b: null, out: null, calc: "" })]],
        demo: L => { Object.assign(L.state, { a: 3, b: 2, out: 10, calc: "3 ◆ 2 = 2 · 3 + 2² = 10" }); L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const { a, b } = L.state;
          if (a === 3 && b === 2) return true;
          if (a === 2 && b === 3) return "הפכת את הסדר. ‏a הוא המספר שמשמאל לסימן: 3. לחץ 'נקה' ונסה שוב.";
          return "המספרים צריכים להיות 3 ו־2. לחץ 'נקה' ונסה שוב."; },
        ok: "2 · 3 + 2² = 6 + 4 = 10." },
      { ch: 2, say: "שאלת ניבוי.", task: "האם 2 ◆ 3 שווה גם הוא 10?",
        choices: ["כן, אותם מספרים", "לא, ‏a ו־b מקבלים תפקיד שונה"],
        check: (L, e) => { if (e.type !== "choice") return null; Object.assign(L.state, { a: 2, b: 3, out: 13, calc: "2 ◆ 3 = 2 · 2 + 3² = 13", top: "2 ◆ 3 = ?" }); L.render(); return e.j === 1 ? true : "תסתכל על המכונה: עכשיו 3 נכנס ל־b ומועלה בריבוע. יוצא 13, לא 10."; },
        ok: "2 · 2 + 3² = 13. בפעולה מוגדרת הסדר בדרך כלל משנה." },
      { ch: 2, setup: L => { L.state = opState({ nested: true, top: "(1 ◆ 2) ◆ 3", ia: 1, ib: 2, iout: null, oa: null, ob: 3, oout: null }); },
        say: "כשהפעולה מופיעה כמה פעמים, מתחילים מהסוגריים הפנימיים. התוצאה שלהם נכנסת למכונה החיצונית.",
        task: "הפעל את המכונות בסדר הנכון.",
        tools: () => [["הפעל פנימית", L => { const S = L.state; S.iout = op(1, 2); S.oa = S.iout; S.calc = "1 ◆ 2 = 2 · 1 + 2² = 6"; L.act({ type: "inner" }); }, true],
                      ["הפעל חיצונית", L => L.act({ type: "outer" })]],
        demo: L => { const S = L.state; Object.assign(S, { iout: 6, oa: 6, oout: 21, calc: "6 ◆ 3 = 2 · 6 + 3² = 21" }); L.act({ type: "outer" }); },
        check: (L, e) => { const S = L.state;
          if (e.type === "inner") return null;
          if (e.type !== "outer") return null;
          if (S.oa === null) return "למכונה החיצונית חסר a. הוא התוצאה של הסוגריים, אז קודם מפעילים את הפנימית.";
          S.oout = op(S.oa, 3); S.calc = `6 ◆ 3 = 2 · 6 + 3² = ${S.oout}`; L.render(); return true; },
        ok: "1 ◆ 2 = 6, ואז 6 ◆ 3 = 12 + 9 = <b>21</b>." },
      { ch: 2, setup: L => { L.state = opState({ a: 1, b: 2, out: 6, calc: "1 ◆ 2 = 6", top: "4 + 1 ◆ 2 = ?" }); },
        say: "הפעולה החדשה קודמת לכל פעולה אחרת (חוץ מסוגריים), גם לחיבור.", task: "חשב 4 + 1 ◆ 2.",
        choices: ["10", "14", "6", "18"],
        check: pick(0, { 1: "חיברת קודם: ‏(4 + 1) ◆ 2 = 14. אבל הפעולה המוגדרת קודמת לחיבור.", 2: "6 זה רק 1 ◆ 2. שכחת את ה־4.", 3: "בדוק שוב: 1 ◆ 2 = 2 + 4 = 6." }),
        ok: "קודם 1 ◆ 2 = 6, ורק אחר כך 4 + 6 = 10." },

      // ---- ch3: conditional + recursion
      { ch: 3, setup: L => { L.state = { mode: "cond", hist: [20], flash: null, last: null }; },
        say: "פעולה עם תנאי: אם n זוגי מחלקים ב־2, אם n אי־זוגי מוסיפים 7. מפעילים 3 פעמים, מתחילים מ־20.",
        task: "בכל שלב לחץ על הדלת הנכונה למספר שבעיגול.",
        demo: L => { L.state.hist = [20, 10, 5, 12]; L.act({ type: "done" }); },
        check: (L, e) => { const S = L.state;
          if (e.type === "done") return true;
          if (e.type !== "tap") return null;
          const cur = S.hist[S.hist.length - 1], even = cur % 2 === 0;
          if ((S.last === "even") !== even) { S.flash = S.last; L.render();
            return cur === 5 ? "5 אי־זוגי. את התנאי בודקים מחדש על המספר הנוכחי, לא על 20 שהתחלנו בו." : `${cur} ${even ? "זוגי" : "אי־זוגי"}. בדוק את התנאי על המספר שבעיגול.`; }
          S.flash = null; S.hist.push(even ? cur / 2 : cur + 7); L.render();
          return S.hist.length === 4 ? true : null; },
        ok: "20 → 10 → 5 → 12. בשלב השני 10 זוגי, אבל 5 כבר אי־זוגי. מי שממשיך לחלק ב־2 כי 'התחלנו בזוגי' מקבל 2.5." },
      { ch: 3, setup: L => { L.state = { mode: "cond", hist: [7], flash: null, last: null }; },
        say: "אותה פעולה, נקודת התחלה אחרת.", task: "מה מתקבל אחרי שלוש הפעלות על 7?",
        choices: ["14", "7", "21", "28"],
        check: (L, e) => { if (e.type !== "choice") return null; if (e.j === 0) { L.state.hist = [7, 14, 7, 14]; L.render(); return true; }
          return { 1: "ספרת רק שתי הפעלות? ‏7 → 14 → 7 → ...", 2: "‏+7 רק כשהמספר אי־זוגי. ‏14 זוגי.", 3: "‏+7 רק כשהמספר אי־זוגי. ‏14 זוגי." }[e.j]; },
        ok: "7 → 14 → 7 → 14. התנאי מתחלף בכל שלב, והפעולה נכנסת למחזור." },
      { ch: 3, setup: L => { L.state = { mode: "rec", at: 4, known: { 1: false }, phase: "down" }; },
        say: "פעולה מעגלית: f(n) מוגדר בעזרת f(n − 1). כדי לחשב f(4) יורדים עד הערך הידוע f(1) = 3, ואז מטפסים בחזרה.",
        task: "השתמש בכפתורים כדי לחשב את f(4).",
        tools: () => [["רד שלב", L => L.act({ type: "down" }), true], ["טפס שלב", L => L.act({ type: "up" })]],
        demo: L => { Object.assign(L.state, { at: 4, known: { 1: true, 2: true, 3: true, 4: true }, phase: "up" }); L.act({ type: "fin" }); },
        check: (L, e) => { const S = L.state;
          if (e.type === "fin") return true;
          if (e.type === "down") {
            if (S.phase === "up") return "כבר הגענו ל־f(1) ומטפסים. עכשיו לוחצים 'טפס שלב'.";
            if (S.at === 1) return "f(1) = 3 ידוע. זה תנאי העצירה, אין לאן לרדת. עכשיו מטפסים.";
            S.at--; if (S.at === 1) { S.known[1] = true; S.phase = "up"; } L.render(); return null; }
          if (e.type === "up") {
            if (S.phase === "down") return `עוד לא הגענו לערך ידוע. ‏f(${S.at}) תלוי ב־f(${S.at - 1}), אז ממשיכים לרדת.`;
            S.at++; S.known[S.at] = true; L.render(); return S.at === 4 ? true : null; }
          return null; },
        ok: "f(2) = 2 · 3 − 1 = 5, ‏f(3) = 2 · 5 − 1 = 9, ‏f(4) = 2 · 9 − 1 = <b>17</b>." },

      // ---- ch4: exam
      { ch: 4, setup: L => { L.state = opState({ nested: true, sym: "a ⊗ b", formula: "a · b − b", top: "(x ⊗ 2) ⊗ 3 = 15", ia: "x", ib: 2, iout: null, oa: null, ob: 3, oout: null }); },
        say: "שאלה ברמת מבחן. אפשר להציב את התשובות במכונות, כמו שהקורס ממליץ.",
        task: "הפעולה ⊗ מוגדרת כך: a ⊗ b = a · b − b. נתון: (x ⊗ 2) ⊗ 3 = 15. מהו x?",
        tools: () => [3, 4, 5, 6].map(x => ["הצב " + x, L => { const S = L.state, i = x * 2 - 2, o = i * 3 - 3; Object.assign(S, { ia: x, iout: i, oa: i, oout: o, calc: `${x} ⊗ 2 = ${i},   ${i} ⊗ 3 = ${o}` }); }]),
        choices: ["3", "4", "5", "6"],
        check: pick(1, { 0: "הצב 3: ‏3 ⊗ 2 = 4, ו־4 ⊗ 3 = 9. לא 15.", 2: "הצב 5: ‏5 ⊗ 2 = 8, ו־8 ⊗ 3 = 21. לא 15.", 3: "נראה שחישבת קודם 2 ⊗ 3. אבל הסוגריים הם סביב x ⊗ 2, ואותם מחשבים ראשונים." }),
        ok: "x ⊗ 2 = 2x − 2, ואז (2x − 2) · 3 − 3 = 15, כלומר 6x − 9 = 15 ו־x = <b>4</b>. בהצבה: 4 ⊗ 2 = 6, ו־6 ⊗ 3 = 15." },
      { ch: 4, say: "<b>סיכום המעבדה:</b><br>1. AB = 10A + B. לכן AB + BA = 11(A + B) ו־AB − BA = 9(A − B).<br>2. תרגיל במאונך: הספרה השמאלית (לא 0, העברה לכל היותר 1), האחדות, ואז מציבים.<br>3. פעולה מוגדרת: מציבים לפי ההגדרה, מתחילים מהסוגריים, והיא קודמת לחיבור ולכפל.<br>4. פעולה עם תנאי: בודקים את התנאי מחדש בכל שלב. פעולה מעגלית: יורדים לתנאי העצירה ומטפסים.", next: "סיום המעבדה" },
    ],
  });
})();
