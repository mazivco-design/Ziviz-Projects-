/* Lab: מספרים שלמים — dot piles in pairs (parity), a dot array (products), sign cards, and leveling bars (consecutive numbers). */
(function () {
  const { G } = Lab;
  const m = s => `<span dir="ltr">${s}</span>`;
  const num = v => (v < 0 ? "−" : "") + G.fmt(Math.abs(v));
  const par = v => v < 0 ? "(" + num(v) + ")" : num(v);
  const parity = n => n % 2 === 0 ? "זוגי" : "אי־זוגי";
  const SP = 34;

  // a run of columns: "p" = pair, "n" = new pair (formed from two lonely dots), "l" = lonely dot
  function columns(cols, x0, y) {
    let h = "";
    cols.forEach((c, k) => {
      const x = x0 + k * SP;
      if (c === "l") { h += G.circle(x, y, 15, "fwarn") + G.circle(x, y, 8, "dot"); return; }
      h += G.rect(x - 15, y - 15, 30, 30 + 32, c === "n" ? "fok-soft" : "fblue-soft", { rx: 15 }) + G.circle(x, y, 8, "dot") + G.circle(x, y + 32, 8, "dot");
    });
    return h;
  }
  const pileCols = n => [...Array(Math.floor(n / 2)).fill("p"), ...(n % 2 ? ["l"] : [])];
  function pileLabel(n, y, extra) {
    return G.t(470, y + 26, (extra || "") + n, "big", "end") + G.he(590, y + 24, parity(n), n % 2 ? "w" : "ok", "right");
  }

  function drawPiles(S) {
    let h = "";
    if (!S.merged) {
      const n = S.piles.length, y0 = n === 1 ? 140 : n === 2 ? 90 : 50;
      S.piles.forEach((p, i) => {
        const y = y0 + i * 100;
        if (i) h += G.t(24, y + 22, "+", "big");
        h += columns(pileCols(p), 64, y) + pileLabel(p, y);
        if (p === 0) h += G.rect(50, y - 18, 120, 68, "ghost", { rx: 12 }) + G.he(110, y + 22, "ערימה ריקה", "m", "middle");
      });
    } else {
      const loners = S.piles.filter(p => p % 2).length, cols = [];
      S.piles.forEach(p => { for (let k = 0; k < Math.floor(p / 2); k++) cols.push("p"); });
      for (let k = 0; k < Math.floor(loners / 2); k++) cols.push("n");
      if (loners % 2) cols.push("l");
      const tot = S.piles.reduce((a, b) => a + b, 0), y = 140;
      h += G.t(310, 50, S.piles.join(" + ") + " = " + tot, "big");
      h += columns(cols, 40, y) + pileLabel(tot, y);
      const nx = 40 + cols.indexOf("n") * SP;
      if (cols.includes("n")) h += G.he(nx, y + 82, loners >= 2 ? "זוג חדש" : "", "ok", "middle");
    }
    return h;
  }

  const GX = 80, GY = 70;
  function drawGrid(S) {
    const { r, c } = S; let h = "";
    const X = j => GX + j * SP, Y = i => GY + i * SP;
    const cap = (x1, y1, x2, y2) => G.rect(Math.min(x1, x2) - 14, Math.min(y1, y2) - 14, Math.abs(x2 - x1) + 28, Math.abs(y2 - y1) + 28, "fblue-soft", { rx: 14 });
    if (c % 2 === 0) { for (let i = 0; i < r; i++) for (let j = 0; j < c; j += 2) h += cap(X(j), Y(i), X(j + 1), Y(i)); }
    else if (r % 2 === 0) { for (let j = 0; j < c; j++) for (let i = 0; i < r; i += 2) h += cap(X(j), Y(i), X(j), Y(i + 1)); }
    else { for (let i = 0; i < r; i++) for (let j = 0; j < c - 1; j += 2) h += cap(X(j), Y(i), X(j + 1), Y(i)); for (let i = 0; i < r - 1; i += 2) h += cap(X(c - 1), Y(i), X(c - 1), Y(i + 1)); h += G.circle(X(c - 1), Y(r - 1), 15, "fwarn"); }
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) h += G.circle(X(j), Y(i), 7, "dot");
    h += G.t((X(0) + X(c - 1)) / 2, GY - 26, String(c), "blue") + G.t(GX - 30, (Y(0) + Y(r - 1)) / 2 + 5, String(r), "blue");
    h += G.line(X(c - 1) + 14, Y(r - 1) + 14, X(c - 1) + 24, Y(r - 1) + 24, "sa") + G.knob(X(c - 1) + 30, Y(r - 1) + 30, "corner", 16);
    const n = r * c;
    h += G.t(520, 140, r + " × " + c + " = " + n, "big") + G.he(520, 176, parity(n), n % 2 ? "w" : "ok", "middle");
    h += G.he(520, 220, n % 2 ? "נשארה נקודה בודדה" : "הכול מתחלק לזוגות", "m", "middle");
    return h;
  }

  function drawCards(S) {
    let h = ""; const cs = S.cards, w = 76, gap = 34, tw = cs.length * w + (cs.length - 1) * gap, x0 = 310 - tw / 2;
    cs.forEach((cd, i) => {
      const x = x0 + i * (w + gap);
      if (i) h += G.t(x - gap / 2, 132, "·", "big");
      const box = G.rect(x, 90, w, 70, (cd.v < 0 ? "fsoft" : "box") + (cd.tap ? " hot" : ""), { rx: 10, style: cd.tap ? null : "stroke-dasharray:5 4" });
      h += cd.tap ? G.tap(box, "c" + i) : box;
      h += G.t(x + w / 2, 134, num(cd.v), "big", "middle", { "pointer-events": "none" });
      if (cd.name) h += G.t(x + w / 2, 78, cd.name, "blue");
    });
    const prod = cs.filter(c => !c.skip).reduce((a, c) => a * c.v, 1), neg = cs.filter(c => !c.skip && c.v < 0).length;
    const expr = S.ab2 ? "a · b² = " + par(cs[0].v) + " · " + num(cs[2].v) + " = " + num(prod) : cs.map(c => par(c.v)).join(" · ") + " = " + num(prod);
    h += G.t(310, 220, expr, "big");
    h += G.he(310, 262, "מינוסים במכפלה: " + neg + (neg % 2 ? " (אי־זוגי) ← תוצאה שלילית" : " (זוגי) ← תוצאה חיובית"), neg % 2 ? "w" : "ok", "middle");
    return h;
  }

  const CX = 30, CW = 28, SY = 300, BU = 7, BB = 250;
  function drawCons(S) {
    let h = ""; const s = S.start, mid = s + 2, vals = [s, s + 1, s + 2, s + 3, s + 4], sum = 5 * mid;
    vals.forEach((v, i) => {
      const x = 190 + i * 50, w = 40;
      if (!S.level) h += G.rect(x, BB - v * BU, w, v * BU, "fblue-soft");
      else {
        h += G.rect(x, BB - mid * BU, w, mid * BU, "fblue-soft");
        if (v > mid) h += G.rect(x, BB - v * BU, w, (v - mid) * BU, "ghost");
        if (v < mid) h += G.rect(x, BB - mid * BU, w, (mid - v) * BU, "fok");
      }
      h += G.t(x + w / 2, BB - Math.max(v, S.level ? mid : 0) * BU - 8, String(v), "b");
    });
    h += G.line(170, BB, 450, BB, "ink");
    h += G.t(310, 36, vals.join(" + ") + " = " + sum + (S.level ? "  =  5 × " + mid : ""), "b");
    for (let k = 1; k <= 20; k++) { const x = CX + (k - 1) * CW; h += G.rect(x, SY, CW, 30, k >= s && k <= s + 4 ? "fblue-soft" : "box") + G.t(x + CW / 2, SY + 21, String(k), "m"); }
    const wx = CX + (s - 1) * CW;
    h += G.rect(wx - 2, SY - 4, 5 * CW + 4, 38, "sa", { rx: 6 }) + G.line(wx + 2.5 * CW, SY + 34, wx + 2.5 * CW, SY + 42, "sa") + G.knob(wx + 2.5 * CW, SY + 56, "win", 15);
    return h;
  }

  function draw(L) {
    const S = L.state;
    return S.mode === "piles" ? drawPiles(S) : S.mode === "grid" ? drawGrid(S) : S.mode === "cards" ? drawCards(S) : S.mode === "cons" ? drawCons(S) : "";
  }
  function drag(L, key, pt) {
    const S = L.state;
    if (key === "corner") { S.c = Math.max(1, Math.min(9, Math.round((pt.x - 30 - GX) / SP) + 1)); S.r = Math.max(1, Math.min(6, Math.round((pt.y - 30 - GY) / SP) + 1)); }
    if (key === "win") S.start = Math.max(1, Math.min(16, Math.round((pt.x - CX) / CW - 2.5) + 1));
  }
  function dragFrom(L, pt) { return L.state.mode === "cons" && pt.y > SY - 10 && pt.y < SY + 75 ? "win" : null; }
  function tap(L, key) {
    const S = L.state, cd = S.cards[+key.slice(1)]; if (!cd || !cd.tap) return false;
    cd.v = -cd.v; L.memo.lastCard = cd.name || null;
    if (S.ab2) { S.cards[2].v = S.cards[1].v * S.cards[1].v; }
  }
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const guess = (L, e) => { if (e.type !== "choice") return null; L.memo.g = e.j; return true; };
  const plusMinus = () => [["+1", L => { if (L.state.piles[0] < 18) L.state.piles[0]++; L.act({ type: "count" }); }], ["−1", L => { if (L.state.piles[0] > 0) L.state.piles[0]--; L.act({ type: "count" }); }]];
  const mergeTool = () => [["אחד ערימות", L => { L.state.merged = true; L.render(); L.act({ type: "merge" }); }, true]];
  const ab2Cards = () => [{ v: 3, tap: true, name: "a" }, { v: 2, tap: true, name: "b", skip: true }, { v: 4, name: "b²" }];

  Lab.register({
    id: "alg-integers", title: "המחשה: מספרים שלמים", viewBox: "0 0 620 380",
    chapters: ["זוגי = זוגות", "חיבור", "כפל", "סימנים", "עוקבים", "שאלת מבחן"],
    draw, drag, dragFrom, tap,
    steps: [
      { ch: 0, setup: L => { L.state = { mode: "piles", piles: [6], merged: false }; },
        say: "כל נקודה היא יחידה, ומסדרים את הנקודות בזוגות. מספר <b>זוגי</b>: כל הנקודות מסתדרות בזוגות. <b>אי־זוגי</b>: נשארת נקודה אחת בודדה.",
        task: "הפוך את הערימה לאי־זוגית בעזרת הכפתורים.", tools: plusMinus,
        demo: L => { L.state.piles[0] = 7; L.act({ type: "count" }); },
        check: (L, e) => e.type !== "count" ? null : L.state.piles[0] % 2 ? true : "עדיין כל הנקודות בזוגות. שנה את הערימה בנקודה אחת בלבד.",
        ok: "נשארה נקודה בודדה, בכתום. זה כל ההבדל: לאי־זוגי יש שארית 1 בחלוקה ל־2." },
      { ch: 0, say: "ומה קורה כשאין נקודות בכלל?", task: "הורד את הערימה ל־0.", tools: plusMinus,
        demo: L => { L.state.piles[0] = 0; L.act({ type: "count" }); },
        check: (L, e) => e.type !== "count" ? null : L.state.piles[0] === 0 ? true : null,
        ok: "ערימה ריקה." },
      { ch: 0, say: "אין אף נקודה בודדה.", task: "אז 0 הוא:", choices: ["זוגי", "אי־זוגי", "לא זוגי ולא אי־זוגי"],
        check: pick(0, { 1: "יש נקודה בודדה? אין. 0 ÷ 2 = 0 בלי שארית.", 2: "זוגי פירושו מתחלק ב־2 בלי שארית. 0 ÷ 2 = 0 בלי שארית." }),
        ok: "<b>0 זוגי.</b> זו מלכודת קלאסית: כשהשאלה אומרת \"זוגי\", גם 0 הוא הצבה כשרה." },
      { ch: 1, setup: L => { L.state = { mode: "piles", piles: [5, 3], merged: false }; },
        say: "שתי ערימות אי־זוגיות: 5 ו־3. לכל אחת יש נקודה בודדה.", task: "לחץ על 'אחד ערימות'.", tools: mergeTool,
        demo: L => { L.state.merged = true; L.act({ type: "merge" }); }, check: (L, e) => e.type === "merge" ? true : null,
        ok: "שתי הנקודות הבודדות מצאו זו את זו והפכו לזוג חדש (בירוק). לכן <b>אי־זוגי + אי־זוגי = זוגי</b>." },
      { ch: 1, setup: L => { L.state = { mode: "piles", piles: [5, 3, 7], merged: false }; },
        say: "שלוש ערימות אי־זוגיות.", task: "לפני שמאחדים: הסכום יהיה זוגי או אי־זוגי?", choices: ["זוגי", "אי־זוגי"], check: guess,
        ok: "בוא נבדוק." },
      { ch: 1, task: "לחץ על 'אחד ערימות'.", tools: mergeTool,
        demo: L => { L.state.merged = true; L.act({ type: "merge" }); }, check: (L, e) => e.type === "merge" ? true : null,
        ok: L => (L.memo.g === 1 ? "צדקת. " : "") + "שלוש נקודות בודדות: שתיים מתחברות לזוג, ואחת נשארת. הכלל: <b>סופרים כמה אי־זוגיים יש בסכום</b>. מספר זוגי שלהם נותן זוגי, ומספר אי־זוגי נותן אי־זוגי. הזוגיים לא משנים כלום." },
      { ch: 1, say: "עכשיו בלי ערימות.", task: `a זוגי, b ו־c אי־זוגיים. מה הזוגיות של ${m("a + b + c + 1")}?`, choices: ["זוגי", "אי־זוגי", "תלוי במספרים"],
        check: pick(1, { 0: "ספור את האי־זוגיים בסכום. אל תשכח את 1.", 2: "בחיבור הזוגיות תמיד נקבעת. ספור את האי־זוגיים: b, ‏c, ו־1." }),
        ok: `שלושה אי־זוגיים (b, ‏c ו־1), ולכן הסכום אי־זוגי. הצבה מאשרת: ${m("0 + 1 + 1 + 1 = 3")}.` },
      { ch: 2, setup: L => { L.state = { mode: "grid", r: 3, c: 4 }; },
        say: "מכפלה היא מלבן של נקודות: שורות כפול עמודות. גרור את הפינה כדי לשנות את המידות.",
        task: "מצא מלבן שבו מספר הנקודות אי־זוגי.", demo: L => { L.state.r = 3; L.state.c = 5; L.act({ type: "drop", key: "corner" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const { r, c } = L.state; if (r * c % 2) return true;
          return r % 2 === 0 && c % 2 === 0 ? "שתי הצלעות זוגיות. נסה לשנות את שתיהן." : `הצלע של ${r % 2 === 0 ? r : c} זוגית, ולכן הכול מתחלק לזוגות. מה צריך לקרות לה?`; },
        ok: "רק כששתי הצלעות אי־זוגיות נשארת נקודה בודדה. מספיק <b>גורם זוגי אחד</b> כדי שכל המכפלה תהיה זוגית." },
      { ch: 2, say: "אפשר להמשיך לגרור.", task: `מה תמיד נכון לגבי ${m("n(n + 1)")}, מכפלה של שני מספרים עוקבים?`, choices: ["היא זוגית", "היא אי־זוגית", "תלוי ב־n"],
        check: pick(0, { 1: `נסה ${m("n = 2")}: ${m("2·3 = 6")}.`, 2: "מבין שני עוקבים, אחד תמיד זוגי. מה זה אומר על המכפלה?" }),
        ok: `אחד משני עוקבים תמיד זוגי, ומספיק גורם זוגי אחד. ועוד דבר: חזקה לא משנה זוגיות, כי ${m("n³ = n·n·n")} וכל הגורמים באותה זוגיות.` },
      { ch: 3, setup: L => { L.state = { mode: "cards", cards: [{ v: -2, tap: true }, { v: 3, tap: true }, { v: -1, tap: true }, { v: -4, tap: true }] }; },
        say: "בכפל סופרים מינוסים. כל זוג מינוסים מבטל את עצמו, בדיוק כמו זוג נקודות.", task: "לחץ על קלף אחד כדי להפוך את הסימן שלו, כך שהמכפלה תהיה חיובית.",
        demo: L => { L.state.cards[1].v = -3; L.act({ type: "tap", key: "c1" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const neg = L.state.cards.filter(c => c.v < 0).length; return neg % 2 === 0 ? true : "מספר המינוסים עדיין אי־זוגי. כל לחיצה משנה אותו באחד."; },
        ok: L => { L.state.cards.forEach(c => c.tap = false); L.render(); return "מספר זוגי של מינוסים, ולכן התוצאה חיובית. כל היפוך של קלף אחד הופך את סימן המכפלה כולה."; } },
      { ch: 3, setup: L => { L.state = { mode: "cards", ab2: true, cards: ab2Cards() }; },
        say: `עכשיו ${m("a · b²")}. הקלף המקווקו הוא b², והוא מחושב לבד מ־b.`, task: `שנה סימנים כך ש־${m("a · b²")} יהיה שלילי.`,
        demo: L => { L.state.cards[0].v = -3; L.act({ type: "tap", key: "c0" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const c = L.state.cards; if (c[0].v * c[2].v < 0) return true;
          return L.memo.lastCard === "b" ? "הפכת את b, אבל b² נשאר חיובי. ריבוע לא משנה את הסימן." : "המכפלה חיובית. איזה קלף באמת משפיע על הסימן?"; },
        ok: `רק a קובע את הסימן. ${m("b²")} תמיד אי־שלילי, וכך גם ${m("|b|")}.` },
      { ch: 3, say: "אפשר להמשיך ללחוץ על הקלפים.", task: `נתון ${m("ab² < 0")}. מה בהכרח נכון?`, choices: [m("a < 0"), m("b < 0"), m("a < 0") + " וגם " + m("b < 0"), m("b > 0")],
        check: pick(0, { 1: "הפוך את b על הקלפים: האם הסימן של המכפלה השתנה?", 2: "b יכול להיות חיובי או שלילי, b² חיובי בכל מקרה.", 3: "b יכול להיות חיובי או שלילי, b² חיובי בכל מקרה." }),
        ok: `${m("ab² < 0")} אומר רק ש־${m("a < 0")}. הסימן של b לא נקבע (ו־b ≠ 0).` },
      { ch: 4, setup: L => { L.state = { mode: "cons", start: 3, level: false }; },
        say: "חמישה מספרים עוקבים, כעמודות. אפשר להזיז את החלון על פס המספרים.", task: "לחץ על 'יישר'.",
        tools: () => [["יישר", L => { L.state.level = true; L.render(); L.act({ type: "level" }); }, true]],
        demo: L => { L.state.level = true; L.act({ type: "level" }); }, check: (L, e) => e.type === "level" ? true : null,
        ok: "העודף של העמודות הגבוהות (מקווקו) ממלא בדיוק את החוסר של הנמוכות (בירוק). כל העמודות בגובה האמצעית, ולכן <b>הסכום = מספר האיברים × האיבר האמצעי</b>." },
      { ch: 4, say: "היישור נשאר מופעל.", task: "גרור את החלון כך שהסכום יהיה 65.",
        demo: L => { L.state.start = 11; L.act({ type: "drop", key: "win" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const s = L.state.start, sum = 5 * (s + 2); if (sum === 65) return true;
          return `הסכום עכשיו ${sum}, והאמצעי ${s + 2}. איזה אמצעי צריך? ${m("65 ÷ 5")}.`; },
        ok: `${m("65 ÷ 5 = 13")} הוא האמצעי, והמספרים הם 11 עד 15. בלי לנחש ובלי משוואה.` },
      { ch: 4, say: "ומה עם עוקבים <b>אי־זוגיים</b>?", task: "סכום של 3 מספרים אי־זוגיים עוקבים הוא 45. מה הגדול שבהם?", choices: ["15", "16", "17", "19"],
        check: pick(2, { 0: "15 הוא האמצעי. מה הגדול?", 1: "16 זוגי. עוקבים אי־זוגיים מרוחקים ב־2, לא ב־1.", 3: `בדוק: ${m("15 + 17 + 19 = 51")}.` }),
        ok: `האמצעי ${m("45 ÷ 3 = 15")}, והמספרים 13, 15, 17. עוקבים אי־זוגיים מרוחקים <b>ב־2</b>.` },
      { ch: 5, setup: L => { L.state = { mode: "grid", r: 3, c: 4 }; },
        say: "שאלה ברמת מבחן. המלבן פתוח לשימוש.", task: "n מספר שלם. איזה מהביטויים הבאים הוא תמיד אי־זוגי?",
        choices: [m("n² + n"), m("n(n + 1) + 1"), m("3n + 1"), m("n² + 1")],
        check: pick(1, { 0: `${m("n² + n = n(n + 1)")}: מכפלת עוקבים, תמיד זוגית.`, 2: `הצב ${m("n = 1")}: ${m("3 + 1 = 4")}.`, 3: `הצב ${m("n = 1")}: ${m("1 + 1 = 2")}.` }),
        ok: `${m("n(n + 1)")} תמיד זוגי, ועוד 1 נותן תמיד אי־זוגי. דרך מהירה: הצב n = 0 ו־n = 1 ופסול כל תשובה שנכשלת.` },
      { ch: 5, say: "<b>סיכום ההמחשה:</b><br>1. זוגי = הכול בזוגות. 0 זוגי.<br>2. בחיבור סופרים את האי־זוגיים. בכפל מספיק גורם זוגי אחד, וחזקה לא משנה זוגיות.<br>3. בכפל ובחילוק סופרים מינוסים. ‏b² ו־|b| לא משפיעים על הסימן.<br>4. עוקבים: הסכום = מספר האיברים × האמצעי. אי־זוגיים עוקבים מרוחקים ב־2.", next: "סיום ההמחשה" },
    ],
  });
})();
