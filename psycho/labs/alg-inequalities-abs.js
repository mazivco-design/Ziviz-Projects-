/* Lab: אי־שוויונות וערך מוחלט — number line with a draggable test point, solution rays, a draggable interval,
   distance brackets for |x − a|, and chained arrows for |a + b| vs |a| + |b|. */
(function () {
  const { G } = Lab;
  const AX = 200, X0 = 310, U = 32, LO = -8, HI = 8;
  const P = v => X0 + U * v;
  const num = v => (v < 0 ? "−" : "") + G.fmt(Math.abs(v));
  const par = v => v < 0 ? "(" + num(v) + ")" : num(v);
  const m = s => `<span dir="ltr">${s}</span>`;
  const snap = (x, lo = LO, hi = HI) => Math.max(lo, Math.min(hi, Math.round((x - X0) / U)));
  const HALO = { style: "paint-order:stroke;stroke:var(--sheet);stroke-width:6px;stroke-linejoin:round", "pointer-events": "none" };
  const base = o => Object.assign({ ineq: null, tx: null, trail: {}, sides: null, picked: null, rays: [], band: null, pts: [], center: null, abs: false, ab: null, head: "" }, o);
  const OPS = { "<": (a, b) => a < b, "≤": (a, b) => a <= b, ">": (a, b) => a > b };
  const I1 = { txt: "2x − 3 < 5", l: x => 2 * x - 3, r: 5, op: "<", lt: x => "2·" + par(x) + " − 3" };
  const I2 = { txt: "−2x < 6", l: x => -2 * x, r: 6, op: "<", lt: x => "−2·" + par(x) };
  const truth = (I, x) => OPS[I.op](I.l(x), I.r);

  function ray(r, y) {
    const x = P(r.b), end = r.dir > 0 ? 596 : 24, cls = r.cls || "sblue";
    let h = G.line(x, y, x, AX, "dash") + G.arrow(x, y, end, y, cls);
    h += G.circle(x, y, 7, r.incl ? (cls === "sok" ? "fok" : "fblue") : "box");
    h += G.t(r.dir > 0 ? x + 14 : x - 14, y - 12, r.lab, cls === "sok" ? "ok" : "blue", r.dir > 0 ? "start" : "end", HALO);
    return h;
  }
  function knobBelow(v, key, label) {
    const x = P(v), r = x > 480;
    return G.line(x, AX, x, AX + 36, "sa") + G.circle(x, AX, 5, "fa") + G.knob(x, AX + 52, key, 16) +
      (label ? G.t(r ? x - 24 : x + 24, AX + 58, label, "a", r ? "end" : "start") : "");
  }

  function draw(L) {
    const S = L.state; let h = "";
    // tap halves
    if (S.sides) {
      const c = P(S.sides.at);
      for (const [k, x0, x1] of [["L", 20, c], ["R", c, 600]]) {
        const pk = S.picked === k, ok = k === S.sides.good;
        h += G.tap(G.rect(x0, AX - 26, x1 - x0, 52, (pk ? (ok ? "fok-soft" : "fwarn") : k === "L" ? "fsoft" : "fblue-soft") + " hot", { opacity: pk ? 1 : .5 }), k);
      }
    }
    // axis
    h += G.line(14, AX, 606, AX, "ink");
    for (let k = LO; k <= HI; k++) { const z = k === 0; h += G.line(P(k), AX - (z ? 9 : 5), P(k), AX + (z ? 9 : 5), z ? "ink" : "thin"); if (k % 2 === 0 || HI - LO < 12) h += G.t(P(k), AX + 26, num(k), z ? "b" : "m"); }
    // header
    if (S.head) h += G.t(310, 36, S.head, "big");
    if (S.ineq && S.tx !== null) {
      const I = S.ineq, v = I.l(S.tx), ok = truth(I, S.tx);
      h += G.t(318, 70, I.lt(S.tx) + " = " + num(v) + "  " + I.op + "  " + num(I.r), "b", "end");
      h += G.he(332, 70, ok ? "נכון: פתרון" : "לא נכון", ok ? "ok" : "w", "left");
    }
    // trail of tested integers
    Object.keys(S.trail).forEach(k => { h += G.circle(P(+k), AX, 6, S.trail[k] ? "fok" : "fwarn"); });
    // rays
    S.rays.forEach((r, i) => { h += ray(r, 112 + i * 36); });
    // fixed points
    S.pts.forEach(p => {
      if (p.from !== undefined) h += G.path(`M${P(p.from)},${AX - 8} Q${(P(p.from) + P(p.v)) / 2},${AX - 30 - 22 * Math.abs(p.v)} ${P(p.v)},${AX - 8}`, "dash");
      if (p.ghost) { h += G.circle(P(p.v), AX, 7, "ghost") + G.t(P(p.v), AX - 16, p.lab, "m"); return; }
      h += G.circle(P(p.v), AX, 8, p.cls || "fblue") + G.t(P(p.v), AX - 16, p.lab, p.tc || "blue", "middle", HALO);
    });
    // interval with two knobs
    if (S.band) {
      const { lo, hi } = S.band;
      if (hi > lo) h += G.line(P(lo), AX, P(hi), AX, "sok", { style: "stroke-width:7" });
      h += G.line(P(lo), AX, P(lo), AX + 36, "sok") + G.knob(P(lo), AX + 52, "lo", 16);
      h += G.line(P(hi), AX, P(hi), AX + 36, "sok") + G.knob(P(hi), AX + 52, "hi", 16);
    }
    // distance from a center
    if (S.center !== null) {
      const c = P(S.center);
      h += G.circle(c, AX, 8, "fblue") + G.t(c, AX + 26, num(S.center), "blue");
      if (S.tx !== null && S.tx !== S.center) {
        const x = P(S.tx), d = Math.abs(S.tx - S.center), y = AX - 26;
        h += G.line(c, y, x, y, "sblue") + G.line(c, y - 7, c, y + 7, "sblue") + G.line(x, y - 7, x, y + 7, "sblue");
        h += G.he((c + x) / 2, y - 10, "מרחק " + d, "blue", "middle", HALO);
      }
      if (S.tx !== null) h += G.t(310, 70, "|" + num(S.tx) + " + 1| = " + Math.abs(S.tx - S.center), "b");
    }
    // |x| mirror point
    if (S.abs && S.tx !== null) {
      const a = Math.abs(S.tx), y = 120, rel = S.tx < a ? "<" : "=";
      h += G.line(P(a), y + 8, P(a), AX, "dash") + G.circle(P(a), y, 8, "fblue") + G.t(P(a) > 470 ? P(a) - 16 : P(a) + 16, y + 6, "|x| = " + num(a), "blue", P(a) > 470 ? "end" : "start", HALO);
      h += G.t(250, 70, "x = " + num(S.tx), "a") + G.t(380, 70, "x " + rel + " |x|", "b");
    }
    // chained arrows for |a + b|
    if (S.ab) {
      const { a, b } = S.ab, s = a + b, ya = 96, yb = 132, ys = 168;
      h += G.line(P(0), 84, P(0), AX, "dash");
      if (a) h += G.arrow(P(0), ya, P(a), ya, "sa"); h += G.t((P(0) + P(a)) / 2, ya - 10, "a = " + num(a), "a", "middle", HALO);
      h += G.line(P(a), ya, P(a), yb, "dash");
      if (b) h += G.arrow(P(a), yb, P(s), yb, "sblue"); h += G.t((P(a) + P(s)) / 2, yb - 10, "b = " + num(b), "blue", "middle", HALO);
      if (s) h += G.arrow(P(0), ys, P(s), ys, "sok"); h += G.t((P(0) + P(s)) / 2 + (s ? 0 : 40), ys - 10, "a + b = " + num(s), "ok", "middle", HALO);
      h += G.knob(P(a), ya, "a", 15) + G.knob(P(s), yb, "b", 15);
      const L1 = Math.abs(a) + Math.abs(b), L2 = Math.abs(s);
      h += G.t(290, 42, "|a + b| = " + L2, "ok", "end") + G.t(310, 44, L2 < L1 ? "<" : "=", "big") + G.t(330, 42, "|a| + |b| = " + L1, "b", "start");
    }
    if (S.tx !== null) h += knobBelow(S.tx, "x", "x = " + num(S.tx));
    return h;
  }
  function drag(L, key, pt) {
    const S = L.state;
    if (key === "x") { S.tx = snap(pt.x); if (S.ineq && S.trail) S.trail[S.tx] = truth(S.ineq, S.tx); }
    else if (key === "lo") S.band.lo = Math.min(snap(pt.x), S.band.hi);
    else if (key === "hi") S.band.hi = Math.max(snap(pt.x), S.band.lo);
    else if (key === "a") { const s = S.ab.a + S.ab.b; S.ab.a = snap(pt.x, -6, 6); S.ab.b = Math.max(-8 - S.ab.a, Math.min(8 - S.ab.a, s - S.ab.a)); }
    else if (key === "b") { const s = snap(pt.x); S.ab.b = s - S.ab.a; }
  }
  function tap(L, key) { L.state.picked = key; }
  const put = v => L => { const S = L.state; S.tx = v; if (S.ineq) S.trail[v] = truth(S.ineq, v); L.act({ type: "drop", key: "x" }); };
  const at = (wants, hint) => (L, e) => e.type !== "drop" ? null : wants.includes(L.state.tx) ? true : hint(L.state.tx, L);
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const side = (good, hints) => (L, e) => e.type !== "tap" ? null : e.key === good ? true : hints;

  Lab.register({
    id: "alg-inequalities-abs", title: "המחשה: אי־שוויונות וערך מוחלט", viewBox: "0 0 620 330",
    chapters: ["פתרון הוא תחום", "הופכים סימן", "תחום משותף", "ערך מוחלט", "שאלות הבנה", "שאלת מבחן"],
    draw, drag, tap,
    steps: [
      { ch: 0, setup: L => { L.state = base({ ineq: I1, head: I1.txt, tx: 0, trail: { 0: true } }); },
        say: "לאי־שוויון יש בדרך כלל הרבה פתרונות. העיגול הוא מספר לבדיקה: גרור אותו, וההמחשה תציב אותו. כל מספר שבדקת נשאר מסומן: ירוק הוא פתרון, כתום לא.",
        task: "מצא את המספר השלם הגדול ביותר שהוא פתרון.", demo: put(3),
        check: at([3], v => v === 4 ? `ב־4 יוצא ${m("5 < 5")}. זה לא נכון: 5 לא קטן מעצמו.` : v > 4 ? "זה לא פתרון. לך שמאלה." : "זה פתרון, אבל יש גדול ממנו. המשך ימינה."),
        ok: `3 הוא הגדול ביותר: ${m("2·3 − 3 = 3 < 5")}. ב־4 כבר יוצא שוויון, וזה לא מספיק.` },
      { ch: 0, setup: L => { L.state.sides = { at: 4, good: "L" }; L.state.picked = null; },
        say: `פותרים כמו משוואה: ${m("2x < 8")}, ולכן ${m("x < 4")}. 4 הוא קו הגבול.`, task: "לחץ על הצד של הגבול שבו נמצאים כל הפתרונות.",
        demo: L => { L.state.picked = "L"; L.act({ type: "tap", key: "L" }); },
        check: side("L", `מימין ל־4 כל המספרים גדולים מ־4. בדוק למשל את 5: יוצא ${m("7 < 5")}?`),
        ok: `כל המספרים משמאל ל־4, גם שברים כמו ${m("3.9")}. הפתרון הוא <b>תחום</b>, ו־4 עצמו לא בפנים.` },
      { ch: 1, setup: L => { L.state = base({ head: "2 < 5", pts: [{ v: 2, lab: "2" }, { v: 5, lab: "5" }] }); },
        say: "עכשיו הדבר היחיד שבו אי־שוויון שונה ממשוואה. כאן 2 קטן מ־5, ולכן הוא משמאל לו.", task: `לחץ על "כפול ב־${m("(−1)")}".`,
        tools: () => [["כפול ב־⁦(−1)⁩", L => { L.state.pts = [{ v: 2, lab: "2", ghost: true }, { v: 5, lab: "5", ghost: true }, { v: -2, lab: "−2", from: 2 }, { v: -5, lab: "−5", from: 5 }]; L.state.head = "−2  ?  −5"; L.render(); L.act({ type: "flip" }); }, true]],
        demo: L => { L.setTools([]); L.state.pts = [{ v: 2, lab: "2", ghost: true }, { v: 5, lab: "5", ghost: true }, { v: -2, lab: "−2", from: 2 }, { v: -5, lab: "−5", from: 5 }]; L.state.head = "−2  ?  −5"; L.act({ type: "flip" }); },
        check: (L, e) => e.type === "flip" ? true : null,
        ok: "כל נקודה קפצה לצד השני של 0, כמו במראה." },
      { ch: 1, say: "הסתכל על הציר.", task: "איזה סימן מתאים במקום סימן השאלה?", choices: ["&lt;", "&gt;", "="],
        check: pick(1, { 0: `‎−2 נמצא <b>מימין</b> ל־‎−5. מי גדול יותר?`, 2: "הם בנקודות שונות על הציר." }),
        ok: m("−2 > −5") + ". המראה הפכה את הסדר. לכן כפל או חילוק במספר שלילי <b>הופכים את סימן אי־השוויון</b>." },
      { ch: 1, setup: L => { L.state = base({ ineq: I2, head: I2.txt, tx: 0, trail: { 0: true } }); },
        say: `מישהו פתר: ${m("−2x < 6")}, חילק ב־‎−2 ושכח להפוך, וקיבל ${m("x < −3")}.`, task: `בדוק אותו: הצב ${m("x = −5")}, שהוא קטן מ־‎−3.`, demo: put(-5),
        check: at([-5], v => v > -5 ? "עוד שמאלה." : "עוד ימינה."),
        ok: `${m("−2·(−5) = 10")}, ו־${m("10 < 6")} לא נכון. כלומר ${m("x < −3")} שגוי.` },
      { ch: 1, say: "אפשר להמשיך לבדוק מספרים על הציר.", task: `מה הפתרון הנכון של ${m("−2x < 6")}?`,
        choices: [m("x < −3"), m("x > −3"), m("x < 3"), m("x > 3")],
        check: pick(1, { 0: "זה בדיוק מה שבדקנו עכשיו: ‎−5 נפסל.", 2: "בדוק את 0: הוא פתרון? ואת ‎−2?", 3: "בדוק את 0: " + m("−2·0 = 0 < 6") + ", כלומר 0 הוא פתרון." }),
        ok: `הדרך של הקורס, בלי לחלק בשלילי: מעבירים את הנעלם לאגף שבו הוא חיובי. ${m("0 < 6 + 2x")}, ‏${m("−6 < 2x")}, ולכן ${m("x > −3")}.` },
      { ch: 2, setup: L => { L.state = base({ head: "3 < 2x + 1 ≤ 9" }); },
        say: "אי־שוויון כפול מפצלים לשניים, פותרים כל חלק, ולוקחים את מה ששניהם מסכימים עליו.", task: `מה נותן החלק ${m("3 < 2x + 1")}?`,
        choices: [m("x > 1"), m("x < 1"), m("x > 2"), m("x ≥ 1")],
        check: pick(0, { 1: "x נמצא באגף הגדול. אז x גדול ממשהו.", 2: `קודם מחסירים 1: ${m("2 < 2x")}, ואז מחלקים ב־2.`, 3: `הסימן נשאר "קטן ממש". האם ${m("x = 1")} מקיים ${m("3 < 3")}?` }),
        ok: m("x > 1") + ". הנה החלק הזה על הציר." },
      { ch: 2, setup: L => { L.state.rays = [{ b: 1, dir: 1, incl: false, lab: "x > 1" }]; },
        task: `ומה נותן החלק ${m("2x + 1 ≤ 9")}?`, choices: [m("x ≤ 4"), m("x < 4"), m("x ≥ 4"), m("x ≤ 5")],
        check: pick(0, { 1: `הסימן ≤ נשאר ≤. ב־4: ${m("2·4 + 1 = 9")}, ו־${m("9 ≤ 9")} נכון.`, 2: "x באגף הקטן. אז x קטן ממשהו.", 3: `${m("2x ≤ 8")}. חלק ב־2.` }),
        ok: m("x ≤ 4") + ", עם עיגול מלא כי 4 בפנים." },
      { ch: 2, setup: L => { L.state.rays = [{ b: 1, dir: 1, incl: false, lab: "x > 1" }, { b: 4, dir: -1, incl: true, lab: "x ≤ 4", cls: "sok" }]; L.state.band = { lo: -5, hi: 7 }; },
        say: "שתי הקרניים מעל הציר.", task: "גרור את שני העיגולים שמתחת לציר כך שהקטע ביניהם יהיה התחום ששתי הקרניים מכסות.",
        demo: L => { L.state.band = { lo: 1, hi: 4 }; L.act({ type: "drop", key: "hi" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const { lo, hi } = L.state.band;
          if (lo === 1 && hi === 4) return true;
          if (lo !== 1) return lo < 1 ? "הקצה השמאלי רחוק מדי: משמאל ל־1 אין את הקרן הכחולה." : "הקצה השמאלי: איפה מתחילה הקרן הכחולה?";
          return hi > 4 ? "הקצה הימני רחוק מדי: מימין ל־4 אין את הקרן הירוקה." : "הקצה הימני: איפה נגמרת הקרן הירוקה?"; },
        ok: `התחום המשותף: ${m("1 < x ≤ 4")}. אפשר לכתוב אותו כשרשרת אחת. 1 לא בפנים, 4 כן.` },
      { ch: 2, setup: L => { L.state = base({ head: "x > 5   ,   x < 2", rays: [{ b: 5, dir: 1, incl: false, lab: "x > 5" }, { b: 2, dir: -1, incl: false, lab: "x < 2", cls: "sok" }] }); },
        say: "שני תנאים שצריכים להתקיים יחד.", task: "מה התחום המשותף?", choices: [m("2 < x < 5"), "אין פתרון", m("x = 5"), m("x < 2") + " או " + m("x > 5")],
        check: pick(1, { 0: "בקטע הזה אין אף אחת מהקרניים. בדוק את 3: הוא גדול מ־5?", 2: `5 לא מקיים ${m("x > 5")}.`, 3: "המילה היא 'וגם': צריך ששני התנאים יתקיימו באותו מספר." }),
        ok: "הקרניים לא נפגשות, ולכן <b>אין פתרון</b>. זו מלכודת: לא לבחור אחד מהגבולות." },
      { ch: 3, setup: L => { L.state = base({ head: "|x + 1| = 4" }); },
        say: "ערך מוחלט הוא <b>מרחק</b>. ‏|x − a| הוא המרחק של x מ־a.", task: `${m("|x + 1|")} הוא המרחק של x מאיזה מספר?`,
        choices: [m("1"), m("−1"), m("4"), m("0")],
        check: pick(1, { 0: `${m("x + 1 = x − (−1)")}. ממה מודדים?`, 2: "4 הוא המרחק עצמו, לא הנקודה שממנה מודדים.", 3: "מ־0 מודדים ב־|x|. כאן יש תוספת של 1." }),
        ok: `${m("x + 1 = x − (−1)")}, ולכן מודדים מ־‎−1.` },
      { ch: 3, setup: L => { L.state.center = -1; L.state.tx = 0; },
        say: "‎−1 מסומן בכחול.", task: "גרור את x לנקודה שהמרחק שלה מ־‎−1 הוא 4.", demo: put(3),
        check: at([3, -5], v => { const d = Math.abs(v + 1); return d < 4 ? `המרחק עכשיו ${d}. התרחק עוד מ־‎−1.` : `המרחק עכשיו ${d}. התקרב ל־‎−1.`; }),
        ok: L => { L.memo.first = L.state.tx; L.state.pts = [{ v: L.state.tx, lab: "✓", cls: "fok", tc: "ok" }]; L.render(); return `x = ${m(num(L.state.tx))}. יופי.`; } },
      { ch: 3, task: "יש עוד פתרון אחד. מצא אותו.", demo: L => put(L.memo.first === 3 ? -5 : 3)(L),
        check: (L, e) => { if (e.type !== "drop") return null; const v = L.state.tx, o = L.memo.first === 3 ? -5 : 3;
          if (v === o) return true; if (v === L.memo.first) return "את זה כבר מצאת. חפש בצד השני של ‎−1.";
          return `המרחק עכשיו ${Math.abs(v + 1)}. צריך 4, בצד השני של ‎−1.`; },
        ok: `${m("x = 3")} או ${m("x = −5")}. אלה בדיוק שני המקרים של הקורס: ${m("x + 1 = 4")} או ${m("x + 1 = −4")}.` },
      { ch: 3, say: "ועכשיו בלי ציר.", task: `כמה פתרונות יש ל־${m("|x + 1| = −3")}?`, choices: ["0", "1", "2", "אינסוף"],
        check: pick(0, { 1: "האם מרחק יכול להיות שלילי?", 2: "האם מרחק יכול להיות שלילי?", 3: "האם מרחק יכול להיות שלילי?" }),
        ok: "מרחק אף פעם לא שלילי, ולכן <b>אין פתרון</b>. לפני שמפצלים למקרים, בודקים את האגף השני." },
      { ch: 4, setup: L => { L.state = base({ tx: 3, abs: true, sides: { at: 0, good: "L" } }); },
        say: "הנקודה הכחולה היא |x|, המרחק של x מ־0. גרור את x ותראה מתי היא זזה איתו ומתי לא.",
        task: `לחץ על החלק של הציר שבו ${m("x < |x|")}.`, demo: L => { L.state.picked = "L"; L.act({ type: "tap", key: "L" }); },
        check: side("L", "בצד החיובי |x| = x בדיוק, הנקודות על אותו מקום. גרור את x שמאלה ובדוק."),
        ok: `${m("x < |x|")} פירושו ש־x <b>שלילי</b>. זו שאלת הבנה קלאסית: הערך המוחלט "מעיף" את השלילי לצד החיובי.` },
      { ch: 4, setup: L => { L.state = base({ ab: { a: 3, b: 2 } }); },
        say: "החץ הוורוד הוא a, הכחול הוא b שמתחיל איפה ש־a נגמר, והירוק הוא הסכום. אורך של חץ הוא הערך המוחלט שלו.",
        task: `גרור את קצות החצים כך ש־${m("|a + b|")} יהיה קטן מ־${m("|a| + |b|")}.`,
        demo: L => { L.state.ab = { a: 5, b: -3 }; L.act({ type: "drop", key: "b" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const { a, b } = L.state.ab;
          return a * b < 0 ? true : a === 0 || b === 0 ? "כשאחד מהם 0 עדיין יש שוויון. שני החצים צריכים להיות לא אפסיים." : "שני החצים באותו כיוון, ולכן האורכים פשוט מתחברים. נסה להפנות את b לכיוון השני."; },
        ok: `כש־a ו־b <b>בסימנים שונים</b>, החץ השני חוזר אחורה והסכום קצר יותר. באותו סימן: ${m("|a + b| = |a| + |b|")}.` },
      { ch: 5, setup: L => { L.state = base({ ab: { a: 3, b: 2 } }); },
        say: "שאלה ברמת מבחן. החצים פתוחים לשימוש.", task: `נתון ${m("a > 0")} וגם ${m("|a + b| < |a| + |b|")}. מה בהכרח נכון?`,
        choices: [m("b < 0"), m("b > 0"), m("a + b < 0"), m("|b| < |a|")],
        check: pick(0, { 1: "אם b חיובי, שני החצים באותו כיוון ויש שוויון.", 2: `נסה ${m("a = 5, b = −3")}: הסכום חיובי, והתנאי מתקיים.`, 3: `נסה ${m("a = 2, b = −5")}: התנאי מתקיים, אבל |b| גדול יותר.` }),
        ok: "אי־שוויון ממש אומר שהם בסימנים שונים. a חיובי, ולכן b שלילי. שאר הטענות תלויות במספרים." },
      { ch: 5, say: `<b>סיכום ההמחשה:</b><br>1. פותרים כמו משוואה, אבל כפל או חילוק בשלילי הופכים את הסימן. עדיף להעביר את הנעלם לאגף שבו הוא חיובי.<br>2. אי־שוויון כפול: מפצלים, פותרים, ולוקחים את התחום המשותף. אם אין חפיפה, אין פתרון.<br>3. ‏${m("|x − a|")} הוא מרחק מ־a: שני פתרונות, אחד מכל צד. מרחק שלילי? אין פתרון.<br>4. ‏${m("x < |x|")} ⇔ x שלילי; ‏${m("|a + b| < |a| + |b|")} ⇔ סימנים שונים.`, next: "סיום ההמחשה" },
    ],
  });
})();
