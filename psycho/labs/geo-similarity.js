/* Lab: דמיון — scale-factor sliders (k, k², k³), a draggable parallel line inside a triangle, an hourglass with a draggable base. */
(function () {
  const { G } = Lab;
  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  const frac = (p, q) => { const g = gcd(p, q); return q / g === 1 ? String(p / g) : (p / g) + "/" + (q / g); };
  const lerp = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
  const kStr = k => G.fmt(k);

  function panel(rows) {
    let h = "";
    rows.forEach(([lab, val, cls], i) => { const y = 40 + i * 56; h += G.he(604, y, lab, "m", "right") + G.t(604, y + 24, val, cls || "b", "end"); });
    return h;
  }
  function slider(S, x0, x1, y, lo, hi, step, val, key) {
    let h = G.line(x0, y, x1, y, "mut", { "stroke-width": 4, "stroke-linecap": "round" });
    for (let v = lo; v <= hi + 1e-9; v += step) { const x = x0 + (x1 - x0) * (v - lo) / (hi - lo); h += G.line(x, y - 5, x, y + 5, "mut"); }
    const kx = x0 + (x1 - x0) * (val - lo) / (hi - lo);
    return h + G.t(x0 - 14, y + 5, "k", "b", "end") + G.knob(kx, y, key, 15);
  }

  // ---- chapter models ----
  const U0 = 22, R0 = [40, 300];
  function pair(S) {              // 3-4-5 right triangle and its k-times copy
    const k = S.k, u = U0, s = [[R0[0], R0[1]], [R0[0] + 4 * u, R0[1]], [R0[0], R0[1] - 3 * u]];
    const o = [170, 300], b = [[o[0], o[1]], [o[0] + 4 * k * u, o[1]], [o[0], o[1] - 3 * k * u]];
    let h = G.poly(s, "fblue-soft") + G.poly(b, "fsoft");
    h += G.rightMark(s[0][0], s[0][1], 1, 0, 0, -1, 9) + G.rightMark(b[0][0], b[0][1], 1, 0, 0, -1, 11);
    h += G.t(s[0][0] + 2 * u, s[0][1] + 20, "4", "blue") + G.t(s[0][0] - 8, s[0][1] - 1.5 * u + 5, "3", "blue", "end") + G.t(s[0][0] + 2 * u + 10, s[0][1] - 1.5 * u - 6, "5", "blue", "start");
    h += G.t(o[0] + 2 * k * u, o[1] + 20, kStr(4 * k), "a") + G.t(o[0] - 8, o[1] - 1.5 * k * u + 5, kStr(3 * k), "a", "end") + G.t(o[0] + 2 * k * u + 12, o[1] - 1.5 * k * u - 8, kStr(5 * k), "a", "start");
    h += slider(S, 200, 400, 350, 1, 3, .5, k, "k");
    return h + panel([["יחס קווי", "k = " + kStr(k), "a"], ["יתר", "5 → " + kStr(5 * k)], ["היקף", "12 → " + kStr(12 * k)]]);
  }
  const TS = 50, TB = [200, 300];
  function tiles(S) {             // equilateral triangle and its k-scaled copy cut into k² copies
    const k = S.k, H = Math.sqrt(3) / 2, small = [[40, 300], [40 + TS, 300], [40 + TS / 2, 300 - TS * H]];
    const L = k * TS, A = [TB[0] + L / 2, TB[1] - L * H], B = TB, C = [TB[0] + L, TB[1]];
    let h = G.poly(small, "fblue-soft") + G.t(40 + TS / 2, 324, "1", "blue");
    for (let r = 0; r < k; r++) for (let c = 0; c <= 2 * r; c++) {      // row r from the top has 2r+1 small triangles
      const y0 = A[1] + r * TS * H, y1 = y0 + TS * H, xl = A[0] - r * TS / 2;
      const j = c >> 1, up = c % 2 === 0;
      const tri = up ? [[xl + j * TS, y0], [xl + j * TS - TS / 2, y1], [xl + j * TS + TS / 2, y1]] : [[xl + j * TS, y0], [xl + (j + 1) * TS, y0], [xl + j * TS + TS / 2, y1]];
      h += G.poly(tri, up ? "fsoft" : "fok-soft");
    }
    h += G.poly([A, B, C], "ink") + G.t(TB[0] + L / 2, TB[1] + 22, "k = " + k, "a");
    h += slider(S, 200, 400, 350, 1, 5, 1, k, "k");
    return h + panel([["יחס קווי", "k = " + k, "a"], ["משולשים קטנים", k + " × " + k + " = " + k * k, "a"], ["יחס שטחים", "1 : " + k * k]]);
  }
  function cubes() {
    const c = 34, cs = Math.cos(Math.PI / 6);
    const iso = (ox, oy, x, y, z) => [ox + (x - y) * c * cs, oy + (x + y) * c * .5 - z * c];
    const cube = (ox, oy, x, y, z) => {
      const p = (a, b, d) => iso(ox, oy, x + a, y + b, z + d);
      return G.poly([p(0, 0, 1), p(1, 0, 1), p(1, 1, 1), p(0, 1, 1)], "fsoft") + G.poly([p(1, 0, 0), p(1, 1, 0), p(1, 1, 1), p(1, 0, 1)], "fblue-soft") + G.poly([p(0, 1, 0), p(1, 1, 0), p(1, 1, 1), p(0, 1, 1)], "bg");
    };
    let h = cube(90, 230, 0, 0, 0) + G.t(90, 290, "1", "blue");
    const list = []; for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) for (let z = 0; z < 2; z++) list.push([x, y, z]);
    list.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]) || a[2] - b[2]);
    for (const [x, y, z] of list) h += cube(300, 200, x, y, z);
    h += G.t(300, 330, "?", "big a");
    return h + panel([["יחס קווי", "k = 2", "a"]]);
  }
  const TA = [230, 40], TBb = [50, 330], TC = [410, 330];
  function par(S, L) {            // triangle with DE ∥ BC, D draggable on AB (N equal parts)
    const N = S.N, i = S.i, t = i / N, D = lerp(TA, TBb, t), E = lerp(TA, TC, t);
    let h = "";
    if (S.fillTrap) h += G.poly([D, TBb, TC, E], "fblue-soft");
    h += G.poly([TA, TBb, TC], "ink") + G.poly([TA, D, E], "fsoft");
    for (let j = 1; j < N; j++) { const p = lerp(TA, TBb, j / N); h += G.line(p[0] - 6, p[1] - 3, p[0] + 6, p[1] + 3, "mut"); }
    h += G.line(D[0], D[1], E[0], E[1], "sa");
    const mDE = [(D[0] + E[0]) / 2, D[1]], mBC = [(TBb[0] + TC[0]) / 2, TBb[1]];
    h += G.path(`M${mDE[0] - 5},${mDE[1] - 5} l6,5 l-6,5`, "thin") + G.path(`M${mBC[0] - 5},${mBC[1] - 5} l6,5 l-6,5`, "thin");
    h += G.t(TA[0], TA[1] - 10, "A", "b") + G.t(TBb[0] - 10, TBb[1] + 18, "B", "b", "end") + G.t(TC[0] + 10, TC[1] + 18, "C", "b", "start");
    h += G.t(E[0] + 24, E[1] + 6, "E", "b", "start");
    if (S.sideLabels) { const m1 = lerp(TA, D, .5), m2 = lerp(D, TBb, .5); h += G.t(m1[0] - 14, m1[1] + 4, String(i), "a", "end"); h += G.t(m2[0] - 14, m2[1] + 4, String(N - i), "blue", "end"); }
    if (S.bc) h += G.t(mBC[0], TBb[1] + 24, "BC = " + S.bc, "b");
    if (S.de) h += G.t(mDE[0], D[1] - 8, S.de, "a");
    if (S.areaTxt) { h += G.t(TA[0], (TA[1] + 2 * D[1]) / 3 + 10, S.areaTxt[0], "b"); h += G.t(mBC[0], (D[1] + TBb[1]) / 2 + 8, S.areaTxt[1], "b"); }
    h += G.knob(D[0], D[1], "D", 15) + G.t(D[0] - 22, D[1] + 6, "D", "b", "end");
    return h + panel(S.rows ? S.rows(L) : []);
  }
  const HY0 = 60, HY1 = 320, HX = 220, HU = 22;
  function hour(S) {               // AB ∥ CD, AC and BD cross at E; |CD| = m (draggable C)
    const m = S.m, A = [HX - 2 * HU, HY0], B = [HX + 2 * HU, HY0], C = [HX + m * HU / 2, HY1], D = [HX - m * HU / 2, HY1];
    const ty = 4 / (4 + m), E = [HX, HY0 + (HY1 - HY0) * ty];
    let h = G.poly([A, B, E], "fsoft") + G.poly([E, C, D], "fblue-soft");
    h += G.line(A[0] - 30, HY0, B[0] + 30, HY0, "mut") + G.line(40, HY1, 400, HY1, "mut");
    h += G.line(A[0], A[1], C[0], C[1], "ink") + G.line(B[0], B[1], D[0], D[1], "ink") + G.line(A[0], A[1], B[0], B[1], "sa") + G.line(D[0], D[1], C[0], C[1], "sblue");
    h += G.t(A[0] - 8, A[1] - 8, "A", "b", "end") + G.t(B[0] + 8, B[1] - 8, "B", "b", "start") + G.t(D[0] - 6, D[1] + 22, "D", "b", "end") + G.t(C[0] + 20, C[1] + 22, "C", "b", "start");
    h += G.t(HX + 14, E[1] + 5, "E", "b", "start");
    h += G.t(HX, HY0 - 16, "AB = 4", "a") + G.t(HX, HY1 + 24, "CD = " + m, "blue");
    h += G.knob(C[0], C[1], "C", 15);
    const g = gcd(4, m);
    return h + panel([["AE : EC", "4 : " + m + (g > 1 ? " = " + 4 / g + " : " + m / g : ""), "a"], ["BE : ED", "4 : " + m + (g > 1 ? " = " + 4 / g + " : " + m / g : ""), "blue"]]);
  }
  const dA = [250, 40], dir = a => [Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180)], SC = 31;
  function diag(S) {               // ∠ADE = ∠ACB, DE not parallel to BC
    const P = (d, len) => [dA[0] + d[0] * len * SC, dA[1] + d[1] * len * SC];
    const uB = dir(115), uC = dir(65), B = P(uB, 10), C = P(uC, 8), D = P(uB, 4), E = P(uC, 5);
    let h = G.poly([dA, B, C], "ink") + G.poly([dA, D, E], "fsoft") + G.line(D[0], D[1], E[0], E[1], "sa");
    const arcAt = (V, P1, P2, cls) => { const a1 = Math.atan2(P1[1] - V[1], P1[0] - V[0]), a2 = Math.atan2(P2[1] - V[1], P2[0] - V[0]); let d = a2 - a1; while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI; const r = 22; return G.path(`M${V[0] + r * Math.cos(a1)},${V[1] + r * Math.sin(a1)} A${r},${r} 0 0 ${d > 0 ? 1 : 0} ${V[0] + r * Math.cos(a2)},${V[1] + r * Math.sin(a2)}`, cls); };
    h += arcAt(D, dA, E, "sa") + arcAt(C, dA, B, "sa");
    h += G.t(dA[0], dA[1] - 10, "A", "b") + G.t(B[0] - 10, B[1] + 16, "B", "b", "end") + G.t(C[0] + 10, C[1] + 16, "C", "b", "start");
    h += G.t(D[0] - 12, D[1] + 4, "D", "b", "end") + G.t(E[0] + 12, E[1] + 4, "E", "b", "start");
    if (S.flip) {                   // ADE reflected over the bisector of A: D' lies on AC, E' on AB
      const D2 = P(uC, 4), E2 = P(uB, 5);
      h += G.poly([dA, D2, E2], "fok-soft", { opacity: .85 }) + G.line(D2[0], D2[1], E2[0], E2[1], "sok");
      h += G.t(D2[0] + 12, D2[1] - 2, "D", "ok", "start") + G.t(E2[0] - 12, E2[1] - 2, "E", "ok", "end");
    }
    return h + panel([["נתון", "AD = 4", "a"], ["", "AE = 5", "a"], ["", "AC = 8"], ["", "AB = ?"]]);
  }

  function draw(L) {
    const S = L.state;
    return S.mode === "pair" ? pair(S) : S.mode === "tiles" ? tiles(S) : S.mode === "cubes" ? cubes() : S.mode === "par" ? par(S, L) : S.mode === "hour" ? hour(S) : diag(S);
  }
  function drag(L, key, pt) {
    const S = L.state;
    if (key === "k") { const lo = 1, hi = S.mode === "pair" ? 3 : 5, st = S.mode === "pair" ? .5 : 1; const v = lo + (pt.x - 200) / 200 * (hi - lo); S.k = Math.max(lo, Math.min(hi, Math.round(v / st) * st)); }
    if (key === "D") { const dx = TBb[0] - TA[0], dy = TBb[1] - TA[1]; const t = ((pt.x - TA[0]) * dx + (pt.y - TA[1]) * dy) / (dx * dx + dy * dy); S.i = Math.max(1, Math.min(S.N - 1, Math.round(t * S.N))); }
    if (key === "C") S.m = Math.max(2, Math.min(12, Math.round(2 * (pt.x - HX) / HU)));
  }
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const parRows = L => { const S = L.state; return [["AD : AB", S.i + " : " + S.N, "a"], ["יחס קווי k", frac(S.i, S.N), "a"], ["יחס שטחים k²", frac(S.i * S.i, S.N * S.N), "blue"]]; };


  // Math inside Hebrew (RTL) messages: wrap each formula/coordinate run in an LTR isolate so "(4, 7)" or "4 : 9" never render reversed.
  const MATH = /[A-Za-zΔ\d(−√π][A-Za-zΔ\d\s.,:×÷=+−\-()√π²³/·°%∥↔→⇒]*[A-Za-z\d)π²³°%]|[A-Za-z\d]/g;
  const BIDI = h => String(h).split(/(<[^>]+>)/).map(s => s[0] === "<" ? s : s.replace(MATH, m => '<span dir="ltr">' + m + "</span>")).join("");
  const bidi = steps => steps.map(s => {
    const o = Object.assign({}, s);
    for (const k of ["say", "task", "ok"]) if (o[k]) { const v = o[k]; o[k] = typeof v === "function" ? L => BIDI(v(L)) : BIDI(v); }
    if (o.choices) o.choices = o.choices.map(BIDI);
    if (o.check) { const c = o.check; o.check = (L, e) => { const r = c(L, e); return typeof r === "string" ? BIDI(r) : r; }; }
    return o;
  });

  Lab.register({
    id: "geo-similarity", title: "מעבדת דמיון", viewBox: "0 0 620 380",
    chapters: ["יחס קווי", "שטחים ונפחים", "קו מקביל לבסיס", "שעון חול ואלכסון", "שאלת מבחן"],
    draw, drag,
    steps: bidi([
      { ch: 0, setup: L => { L.state = { mode: "pair", k: 1 }; },
        say: "שני משולשים ישרי־זווית. הכחול קבוע: 3, 4, 5. האדום הוא אותה צורה, מוגדלת פי k. המספר k נקרא <b>היחס הקווי</b>.",
        task: "גרור את המחוון עד שהיתר של המשולש האדום יהיה 10.",
        demo: L => { L.state.k = 2; L.act({ type: "drop", key: "k" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const k = L.state.k; if (k === 2) return true;
          return k < 2 ? "היתר עכשיו " + kStr(5 * k) + ". צריך להגיע ל־10: פי כמה זה מ־5?" : "היתר עכשיו " + kStr(5 * k) + ", יותר מ־10. היתר הקטן הוא 5, אז k = 10 ÷ 5."; },
        ok: "k = 2. <b>כל</b> אורך הוכפל ב־2: הניצבים 6 ו־8, והיתר 10." },
      { ch: 0, say: "המספרים בצד מראים גם את ההיקף.", task: "היתר גדל פי 2. פי כמה גדל ההיקף?",
        choices: ["פי 2", "פי 4", "פי 8", "זה תלוי בצורה"],
        check: pick(0, { 1: "פי 4 זה השטח. היקף הוא אורך: סכום של צלעות.", 2: "פי 8 זה נפח. היקף הוא אורך.", 3: "בצורות דומות כל קו מתאים גדל באותו יחס, בכל צורה." }),
        ok: "12 → 24, פי 2. היחס הקווי משותף ל<b>כל</b> קו: צלעות, גבהים, תיכונים, אלכסונים וגם היקף." },

      { ch: 1, setup: L => { L.state = { mode: "tiles", k: 1 }; },
        say: "עכשיו נבדוק מה קורה לשטח. המשולש הכחול הוא יחידת השטח.",
        task: "לפני שנגרור: אם כל צלע גדלה פי 3, פי כמה יגדל השטח?",
        choices: ["פי 3", "פי 6", "פי 9", "פי 27"],
        check: (L, e) => { if (e.type !== "choice") return null; L.memo.g3 = e.j; return true; },
        ok: L => L.memo.g3 === 2 ? "בוא נוודא על הלוח." : "בוא נבדוק על הלוח." },
      { ch: 1, task: "גרור את המחוון ל־k = 3 וספור כמה משולשים כחולים נכנסים.",
        demo: L => { L.state.k = 3; L.act({ type: "drop", key: "k" }); },
        check: (L, e) => { if (e.type !== "drop") return null; return L.state.k === 3 ? true : "k = " + L.state.k + " עכשיו. כוון ל־3."; },
        ok: L => (L.memo.g3 === 2 ? "צדקת: " : L.memo.g3 === 0 ? "לא פי 3, אלא " : "") + "9 משולשים קטנים. השטח גדל גם ברוחב וגם בגובה, ולכן <b>יחס השטחים = k²</b>. נסה גם k = 4 או 5." },
      { ch: 1, say: "נשתמש בזה.", task: "שטח משולש הוא 7. במשולש דומה כל צלע ארוכה פי 2. מה שטחו?",
        choices: ["14", "28", "49", "56"],
        check: pick(1, { 0: "הכפלת ב־k. בשטח כופלים ב־k².", 2: "49 = 7². את k מעלים בריבוע, לא את השטח.", 3: "56 = 7 × 8, כלומר k³. זה יחס של נפחים." }),
        ok: "k = 2, ולכן k² = 4. 7 × 4 = 28." },
      { ch: 1, say: "ועכשיו בכיוון ההפוך: ידוע יחס השטחים.", task: "היחס בין שטחי שני מעגלים הוא 4 : 9. מה היחס בין הרדיוסים?",
        choices: ["4 : 9", "2 : 3", "16 : 81", "8 : 27"],
        check: pick(1, { 0: "זה יחס השטחים. רדיוס הוא אורך.", 2: "העלית בריבוע. מיחס שטחים ליחס קווי <b>מוציאים</b> שורש.", 3: "8 : 27 הוא יחס נפחים של יחס קווי 2 : 3." }),
        ok: "√4 : √9 = 2 : 3. מיחס שטחים ליחס קווי מוציאים שורש. (כל המעגלים דומים זה לזה.)" },
      { ch: 1, setup: L => { L.state = { mode: "cubes" }; },
        say: "בנפח יש שלושה כיוונים: אורך, רוחב וגובה.", task: "קובייה שצלעה ארוכה פי 2. פי כמה גדל הנפח?",
        choices: ["פי 2", "פי 4", "פי 6", "פי 8"],
        check: pick(3, { 0: "גם הגובה, גם הרוחב וגם העומק גדלים פי 2.", 1: "פי 4 זה רק שכבה אחת. כמה שכבות יש?", 2: "ספור את הקוביות: 2 × 2 × 2." }),
        ok: "2 × 2 × 2 = 8 קוביות. <b>יחס נפחים = k³</b>." },

      { ch: 2, setup: L => { L.state = { mode: "par", N: 5, i: 1, sideLabels: true, rows: L => [["AD", String(L.state.i), "a"], ["DB", String(L.state.N - L.state.i), "blue"]] }; },
        say: "הקטע DE מקביל לבסיס BC. לכן המשולש הקטן ADE דומה למשולש הגדול ABC. הצלע AB מחולקת ל־5 חלקים שווים.",
        task: "גרור את D כך ש־AD = 3 ו־DB = 2.",
        demo: L => { L.state.i = 3; L.act({ type: "drop", key: "D" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const i = L.state.i; return i === 3 ? true : i === 2 ? "הפוך: עכשיו AD = 2. AD הוא החלק העליון, ליד A." : "AD = " + i + " עכשיו. צריך 3 חלקים מ־A."; },
        ok: "AD = 3, DB = 2. המשולש הקטן נע יחד עם D, ותמיד נשאר דומה לגדול." },
      { ch: 2, task: "מה היחס הקווי בין המשולש ADE למשולש ABC?",
        choices: ["3 : 2", "3 : 5", "2 : 5", "9 : 25"],
        check: pick(1, { 0: "זו המלכודת. DB אינו צלע של אף אחד מהמשולשים. הצלע של המשולש הגדול היא כל AB.", 2: "2 זה DB. השווה את הצלע של הקטן (AD) לצלע של הגדול (AB).", 3: "9 : 25 יהיה יחס השטחים. שאלנו על היחס הקווי." }),
        ok: "AD : AB = 3 : (3 + 2) = 3 : 5. משווים צלע של משולש לצלע של משולש." },
      { ch: 2, setup: L => { Object.assign(L.state, { bc: 10, de: "DE = ?" }); },
        task: "BC = 10. מה אורך DE?", choices: ["6", "15", "4", "7.5"],
        check: pick(0, { 1: "15 = 10 × 3/2, כלומר השתמשת ביחס 3 : 2. היחס הנכון הוא 3 : 5.", 2: "4 = 10 × 2/5, זה היחס של DB. DE שייך למשולש הקטן, כמו AD.", 3: "DE קצר מ־BC פי 5/3. חשב 10 × 3/5." }),
        ok: "DE = 10 × 3/5 = 6." },
      { ch: 2, setup: L => { Object.assign(L.state, { i: 2, bc: 0, de: "", fillTrap: true, areaTxt: ["8", "?"] }); },
        say: "עכשיו AD = 2 ו־DB = 3. שטח המשולש הקטן ADE הוא 8.",
        task: "מה שטח הטרפז DBCE (הכחול)?", choices: ["42", "50", "18", "12"],
        check: pick(0, { 1: "50 הוא שטח כל המשולש ABC. הטרפז הוא הגדול פחות הקטן.", 2: "18 = 8 × (3/2)², כלומר השתמשת ביחס 2 : 3. היחס הקווי הוא AD : AB = 2 : 5.", 3: "12 = 8 × 5/2 − 8. כפלת ב־k ולא ב־k²." }),
        ok: "יחס קווי 2 : 5 ⇒ יחס שטחים 4 : 25. ABC = 8 × 25/4 = 50, והטרפז = 50 − 8 = 42." },
      { ch: 2, setup: L => { Object.assign(L.state, { N: 4, i: 1, sideLabels: false, fillTrap: false, areaTxt: null, rows: parRows }); },
        say: "עכשיו AB מחולק ל־4 חלקים. בצד רואים את היחס הקווי ואת יחס השטחים.",
        task: "גרור את D כך ששטח ADE יהיה בדיוק רבע משטח ABC.",
        demo: L => { L.state.i = 2; L.act({ type: "drop", key: "D" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const i = L.state.i; if (i === 2) return true;
          if (i === 1) return "AD הוא רבע מ־AB, אבל השטח רק 1/16. השטח הוא <b>ריבוע</b> היחס הקווי.";
          return "השטח עכשיו " + frac(i * i, 16) + " מהגדול. איזה יחס קווי, בריבוע, נותן 1/4?"; },
        ok: "AD = חצי AB, ולכן השטח (1/2)² = 1/4. כדי לעבור מיחס שטחים ליחס קווי, מוציאים שורש: √(1/4) = 1/2." },

      { ch: 3, setup: L => { L.state = { mode: "hour", m: 6 }; },
        say: "'שעון חול': AB ∥ CD, והקטעים AC ו־BD נחתכים ב־E. המשולשים EAB ו־ECD דומים. A מתאים ל־C, ו־B מתאים ל־D.",
        task: "גרור את C כך ש־EC יהיה ארוך פי 2 מ־AE.",
        demo: L => { L.state.m = 8; L.act({ type: "drop", key: "C" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const m = L.state.m; if (m === 8) return true;
          if (m === 2) return "הפוך: עכשיו EC קצר פי 2 מ־AE. הבסיס התחתון צריך להיות הארוך.";
          return "AE : EC = AB : CD = 4 : " + m + ". כדי ש־EC יהיה פי 2, גם CD צריך להיות פי 2 מ־AB."; },
        ok: "CD = 8 = 2 × AB, ולכן EC = 2 × AE וגם ED = 2 × BE. היחס בין הבסיסים הוא היחס הקווי." },
      { ch: 3, task: "בשעון חול AB = 6, CD = 9 ו־BE = 4. מה אורך ED?",
        choices: ["6", "8/3", "13.5", "10"],
        check: pick(0, { 1: "הפכת את היחס. ED שייך למשולש עם הבסיס הגדול, ולכן הוא הארוך.", 2: "13.5 = 9 × 6/4. השווה צלע לצלע מתאימה: BE מול ED, כמו AB מול CD.", 3: "10 זה כל BD. שאלו רק על ED." }),
        ok: "AB : CD = 6 : 9 = 2 : 3. BE : ED = 2 : 3, ולכן ED = 4 × 3/2 = 6." },
      { ch: 3, setup: L => { L.state = { mode: "diag", flip: false }; },
        say: "'דמיון באלכסון': DE <b>לא</b> מקביל ל־BC, אבל ∠ADE = ∠ACB (הקשתות). שתי זוויות שוות (גם ∠A משותפת) ⇒ המשולשים דומים. הצלעות מתאימות <b>בהצלבה</b>.",
        task: "מה אורך AB? (אפשר ללחוץ על 'הפוך את ADE')",
        tools: () => [["הפוך את ADE", L => { L.state.flip = !L.state.flip; }]],
        choices: ["10", "6.4", "2.5", "16"],
        check: pick(0, { 1: "6.4 יוצא אם מתאימים AD ל־AB. אבל D מתאים ל־C (שם הזוויות השוות), ולכן AD מול AC.", 2: "AB היא צלע של המשולש הגדול, ולכן היא ארוכה מ־AE.", 3: "16 = 2 × AC. AB מתאימה ל־AE, לא ל־AC." }),
        ok: "AD ↔ AC ו־AE ↔ AB. יחס קווי 4 : 8 = 1 : 2, ולכן AB = 2 × AE = 10." },

      { ch: 4, setup: L => { L.state = { mode: "par", N: 12, i: 3, rows: L => [["AD", String(L.state.i), "a"], ["יחס קווי k", frac(L.state.i, 12), "a"]] }; },
        say: "שאלה ברמת מבחן. אפשר לגרור את D (כאן AB = 12).",
        task: "במשולש ABC, DE ∥ BC. שטח הטרפז DBCE גדול פי 3 משטח המשולש ADE, ו־AB = 12. מה אורך AD?",
        choices: ["3", "4", "6", "9"],
        check: pick(2, { 0: "3 = 12/4. אבל 1/4 הוא יחס ה<b>שטחים</b> ADE : ABC. היחס הקווי הוא השורש.", 1: "4 = 12/3. היחס 1 : 3 הוא בין המשולש לטרפז, לא בין שני המשולשים.", 3: "בדוק: AD = 9 נותן יחס קווי 3/4, ושטח ADE יהיה 9/16 מ־ABC. זה יותר מהטרפז." }),
        ok: "ADE = 1 חלק, הטרפז = 3 חלקים, ABC = 4 חלקים. יחס שטחים 1 : 4 ⇒ יחס קווי 1 : 2 ⇒ AD = 6." },
      { ch: 4, say: "<b>סיכום המעבדה:</b><br>1. בצורות דומות כל קו מתאים (צלע, גובה, היקף) מוכפל באותו יחס קווי k.<br>2. שטחים: k². נפחים: k³. מיחס שטחים ליחס קווי מוציאים שורש.<br>3. DE ∥ BC: היחס הוא AD : AB, לא AD : DB. טרפז = גדול פחות קטן.<br>4. שעון חול ו'אלכסון': צלעות מתאימות הן אלה שמול זוויות שוות.", next: "סיום המעבדה" },
    ]),
  });
})();
