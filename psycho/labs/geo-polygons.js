/* Lab: מצולעים — draggable polygon vertices with live interior/exterior angles, fan triangulation, regular n-gons, decomposition. */
(function () {
  const { G } = Lab;
  const SN = 20, BX0 = 40, BX1 = 400, BY0 = 40, BY1 = 360, CX = 220, CY = 200;
  const D2R = Math.PI / 180, NAMES = "ABCDEFGHIJKL";
  const r1 = n => Math.round(n * 10) / 10;
  const deg = n => G.fmt(Math.round(n)) + "°";
  function roundTo(vals) {            // round to integers but keep the (integer) total exact — so the labels add up
    const tot = Math.round(vals.reduce((s, v) => s + v, 0)), f = vals.map(Math.floor); let rest = tot - f.reduce((s, v) => s + v, 0);
    vals.map((v, i) => [v - f[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (rest > 0) { f[i]++; rest--; } });
    return f;
  }

  // ---------- geometry ----------
  const signedArea = P => P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
  function angles(P) {               // interior + exterior (turn) angles in degrees, any simple polygon
    const s = Math.sign(signedArea(P)) || 1;
    return P.map((v, i) => {
      const p = P[(i + P.length - 1) % P.length], q = P[(i + 1) % P.length];
      const e1 = [v[0] - p[0], v[1] - p[1]], e2 = [q[0] - v[0], q[1] - v[1]];
      const turn = Math.atan2(e1[0] * e2[1] - e1[1] * e2[0], e1[0] * e2[0] + e1[1] * e2[1]) / D2R * s;
      return { int: 180 - turn, ext: turn };
    });
  }
  const segX = (a, b, c, d) => { const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])); return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0; };
  function simple(P) {
    const n = P.length;
    for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) { if (i === 0 && j === n - 1) continue; if (segX(P[i], P[(i + 1) % n], P[j], P[(j + 1) % n])) return false; }
    return angles(P).every(a => Math.abs(a.ext) < 179 && a.int > 2) && Math.abs(signedArea(P)) > 400;
  }
  const regular = (n, R = 150, cx = CX, cy = CY) => Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + 2 * Math.PI * i / n; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
  const unit = (x, y) => { const m = Math.hypot(x, y) || 1; return [x / m, y / m]; };
  function inward(P, i, intDeg) {
    const v = P[i], p = P[(i + P.length - 1) % P.length], q = P[(i + 1) % P.length];
    const u1 = unit(p[0] - v[0], p[1] - v[1]), u2 = unit(q[0] - v[0], q[1] - v[1]);
    let b = [u1[0] + u2[0], u1[1] + u2[1]];
    if (Math.hypot(b[0], b[1]) < 1e-6) b = [-u1[1], u1[0]];
    b = unit(b[0], b[1]); if (intDeg > 180) b = [-b[0], -b[1]];
    return { b, u1, u2 };
  }
  function arc(v, u1, u2, sweepDeg, r, cls) {   // arc from direction u1 to u2 spanning sweepDeg (screen coords)
    const a1 = Math.atan2(u1[1], u1[0]), a2 = Math.atan2(u2[1], u2[0]);
    let cw = (a2 - a1) / D2R; cw = ((cw % 360) + 360) % 360;
    const sweep = Math.abs(cw - sweepDeg) < 1 ? 1 : 0, large = sweepDeg > 180 ? 1 : 0;
    return G.path(`M${v[0] + r * u1[0]},${v[1] + r * u1[1]} A${r},${r} 0 ${large} ${sweep} ${v[0] + r * u2[0]},${v[1] + r * u2[1]}`, cls);
  }
  const wedge = (cx, cy, r, a1, a2, cls) => {         // screen angles in degrees, clockwise from a1 to a2
    const p = a => [cx + r * Math.cos(a * D2R), cy + r * Math.sin(a * D2R)], [x1, y1] = p(a1), [x2, y2] = p(a2);
    return G.path(`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2},${y2} Z`, cls);
  };

  // ---------- drawing ----------
  function panel(rows) {
    let h = "";
    rows.forEach(([lab, val, cls], i) => { const y = 40 + i * 56; h += G.he(604, y, lab, "m", "right") + G.t(604, y + 24, val, cls || "b", "end"); });
    return h;
  }
  function dots() { let h = ""; for (let x = BX0; x <= BX1; x += SN) for (let y = BY0; y <= BY1; y += SN) h += G.circle(x, y, 1.3, "dot", { opacity: .18 }); return h; }

  function draw(L) {
    const S = L.state; let h = "";
    if (S.oct) return octagon(S) + panel(S.rows ? S.rows(L) : []);
    if (S.mode === "free") h += dots();
    const P = S.P, n = P.length, A = angles(P);
    // fan triangles from vertex 0
    if (S.fan) for (let i = 1; i < n - 1; i++) h += G.poly([P[0], P[i], P[i + 1]], i % 2 ? "fsoft" : "fblue-soft");
    h += G.poly(P, S.fan ? "ink" : "bg");
    // diagonals drawn by the learner (step 0)
    if (S.diag) for (const j of S.diag) h += G.line(P[0][0], P[0][1], P[j][0], P[j][1], "sa");
    if (S.fan) for (let i = 2; i < n - 1; i++) h += G.line(P[0][0], P[0][1], P[i][0], P[i][1], "sa");
    // hexagon long diagonals
    if (S.hex) {
      for (let k = 0; k < 3; k++) {
        const a = P[k], b = P[k + 3];
        if (S.hex[k]) h += G.line(a[0], a[1], b[0], b[1], "sa");
        else h += G.tap(G.line(a[0], a[1], b[0], b[1], "dash hot", { "stroke-width": 34, opacity: 0.001 }), "hx" + k) + G.line(a[0], a[1], b[0], b[1], "dash", { "pointer-events": "none" });
      }
      if (S.hex.every(Boolean)) for (let k = 0; k < 6; k++) { const a = P[k], b = P[(k + 1) % 6]; h += G.poly([[CX, CY], a, b], k % 2 ? "fsoft" : "fblue-soft", { opacity: .9 }); h += G.t((CX + a[0] + b[0]) / 3, (CY + a[1] + b[1]) / 3 + 6, "9√3", "m"); }
      h += G.poly(P, "ink");
      h += G.t((P[1][0] + P[2][0]) / 2, P[1][1] - 12, "6", "b");
      if (S.hexDiag) h += G.line(P[0][0], P[0][1], P[3][0], P[3][1], "sok") + G.t(CX - 100, CY - 9, "?", "big ok");
    }
    // angles
    const RI = roundTo(A.map(a => a.int)), RE = roundTo(A.map(a => a.ext));
    if (S.showInt) P.forEach((v, i) => {
      if (S.showInt === "top" && i) return;
      const { b, u1, u2 } = inward(P, i, A[i].int);
      h += arc(v, u1, u2, A[i].int, 20, S.hot === i ? "sa" : "thin");
      const d = (A[i].int > 150 ? 42 : 36) + (S.drag ? 6 : 0);
      h += G.t(v[0] + b[0] * d, v[1] + b[1] * d + 5, RI[i] + "°", S.hot === i ? "a" : "m");
    });
    if (S.showExt) P.forEach((v, i) => {
      const p = P[(i + n - 1) % n], q = P[(i + 1) % n], e = unit(v[0] - p[0], v[1] - p[1]), f = unit(q[0] - v[0], q[1] - v[1]);
      h += G.line(v[0], v[1], v[0] + e[0] * 46, v[1] + e[1] * 46, "dash");
      const a1 = Math.atan2(e[1], e[0]) / D2R; let a2 = Math.atan2(f[1], f[0]) / D2R; let sw = a2 - a1; sw = ((sw % 360) + 360) % 360;
      const cw = signedArea(P) > 0;                        // screen-clockwise polygon => turns are clockwise
      h += cw ? wedge(v[0], v[1], 30, a1, a1 + sw, "fok-soft") : wedge(v[0], v[1], 30, a2, a2 + (360 - sw) % 360, "fok-soft");
      const mid = cw ? a1 + sw / 2 : a2 + ((360 - sw) % 360) / 2, mx = v[0] + 50 * Math.cos(mid * D2R), my = v[1] + 50 * Math.sin(mid * D2R);
      h += G.t(mx, my + 5, RE[i] + "°", "ok");
    });
    if (S.gather) { let a = -90; const cx = 520, cy = 280, R = 62; A.forEach((x, i) => { h += wedge(cx, cy, R, a, a + x.ext, i % 2 ? "fok-soft" : "fblue-soft"); const m = (a + x.ext / 2) * D2R; h += G.t(cx + 40 * Math.cos(m), cy + 40 * Math.sin(m) + 5, RE[i] + "°", "m"); a += x.ext; }); h += G.circle(cx, cy, R, "ink"); }
    // vertex labels / handles / tap targets
    if (S.labels) P.forEach((v, i) => {
      const { b } = inward(P, i, A[i].int);
      const d = S.taps || S.drag ? 31 : 22;
      h += G.t(v[0] - b[0] * d, v[1] - b[1] * d + 6, NAMES[i], "b");
    });
    if (S.taps) P.forEach((v, i) => { if (!i) return; h += G.tap(G.circle(v[0], v[1], 17, (S.diag.includes(i) ? "fsoft" : "box") + " hot"), "v" + i); });
    if (S.taps) h += G.circle(P[0][0], P[0][1], 9, "fa");
    if (S.drag) P.forEach((v, i) => { if (S.drag === true || S.drag.includes(i)) h += G.knob(v[0], v[1], "p" + i, 14); });
    return h + panel(S.rows ? S.rows(L) : []);
  }
  function octagon(S) {
    const a = 110, s = a / Math.SQRT2, h0 = a / 2, x0 = CX - h0, x1 = CX + h0, y0 = CY - h0, y1 = CY + h0; let h = "";
    h += G.rect(x0, y0, a, a, "fblue-soft");
    h += G.rect(x0, y0 - s, a, s, "box") + G.rect(x0, y1, a, s, "box") + G.rect(x0 - s, y0, s, a, "box") + G.rect(x1, y0, s, a, "box");
    const corners = [[[x0, y0], [x0 - s, y0], [x0, y0 - s]], [[x1, y0], [x1, y0 - s], [x1 + s, y0]], [[x1, y1], [x1 + s, y1], [x1, y1 + s]], [[x0, y1], [x0, y1 + s], [x0 - s, y1]]];
    const quarters = [[[CX, CY], [x0, y0], [x1, y0]], [[CX, CY], [x1, y0], [x1, y1]], [[CX, CY], [x1, y1], [x0, y1]], [[CX, CY], [x0, y1], [x0, y0]]];
    corners.forEach((c, k) => { h += S.oct[k] ? G.poly(c, "ghost") : G.tap(G.poly(c, "fsoft hot"), "oc" + k); });
    quarters.forEach((q, k) => { if (S.oct[k]) h += G.poly(q, "fsoft"); });
    h += G.t(CX, y0 - s - 10, "a", "b") + G.t(x0 - s / 2 - 8, y0 - s / 2 - 4, "a", "b", "end");
    h += G.t(CX, y0 - s / 2 + 5, "a × a/√2", "m");
    return h;
  }

  function drag(L, key, pt, phase) {
    const S = L.state, i = +key.slice(1);
    const x = Math.max(BX0, Math.min(BX1, Math.round(pt.x / SN) * SN)), y = Math.max(BY0, Math.min(BY1, Math.round(pt.y / SN) * SN));
    const Q = S.P.map(p => p.slice()); Q[i] = [x, y];
    if (!simple(Q)) return;
    if (S.convex && angles(Q).some(a => a.ext <= 0.5)) return;
    S.P = Q;
  }
  function tap(L, key) {
    const S = L.state;
    if (key[0] === "v") { const j = +key.slice(1), n = S.P.length; if (j === 1 || j === n - 1) { L.memo.adj = true; return; } L.memo.adj = false; if (!S.diag.includes(j)) S.diag.push(j); }
    else if (key.startsWith("hx")) S.hex[+key.slice(2)] = true;
    else if (key.startsWith("oc")) S.oct[+key.slice(2)] = true;
  }
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const PENT = () => [[200, 60], [80, 140], [120, 300], [300, 300], [340, 140]];
  const sumRows = L => { const n = L.state.P.length; return [["מספר צלעות", "n = " + n], ["משולשים מקודקוד אחד", String(n - 2), "a"], ["סכום הזוויות", (n - 2) + " × 180° = " + (n - 2) * 180 + "°", "a"]]; };
  const regRows = L => { const n = L.state.P.length, s = (n - 2) * 180; return [["מספר צלעות", "n = " + n], ["סכום הזוויות", s + "°"], ["זווית אחת", s + "° ÷ " + n + " = " + G.fmt(r1(s / n)) + "°", "a"]]; };
  const setN = (L, n) => { L.state.P = regular(n); };
  const nTools = (lo, hi, ev) => () => [["+ צלע", L => { if (L.state.P.length < hi) setN(L, L.state.P.length + 1); L.render(); L.act({ type: ev }); }, true], ["− צלע", L => { if (L.state.P.length > lo) setN(L, L.state.P.length - 1); L.render(); L.act({ type: ev }); }]];


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
    id: "geo-polygons", title: "מעבדת מצולעים", viewBox: "0 0 620 380",
    chapters: ["סכום הזוויות", "מצולע משוכלל", "זוויות חיצוניות", "שטח: פירוק לחלקים", "שאלת מבחן"],
    draw, drag, tap,
    steps: bidi([
      { ch: 0, setup: L => { L.state = { P: PENT(), mode: "free", labels: true, taps: true, diag: [], rows: () => [["מספר צלעות", "n = 5"]] }; L.memo.adj = false; },
        say: "זה מחומש. כדי לדעת את סכום הזוויות שלו, נחלק אותו למשולשים, שבהם הסכום ידוע: 180°.",
        task: "העבר את כל האלכסונים מהקודקוד A: לחץ על כל קודקוד שאפשר לחבר ל־A באלכסון.",
        demo: L => { L.state.diag = [2, 3]; L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; if (L.memo.adj) return "B ו־E שכנים של A: הקו אליהם הוא צלע, לא אלכסון. אלכסון מחבר קודקודים שאינם שכנים."; return L.state.diag.length === 2 ? true : null; },
        ok: "שני אלכסונים, AC ו־AD. הם חותכים את המחומש לשלושה משולשים." },
      { ch: 0, setup: L => { Object.assign(L.state, { taps: false, diag: null, fan: true }); },
        say: "צבענו את המשולשים. הזוויות שלהם ביחד הן בדיוק הזוויות של המחומש.",
        task: "מה סכום הזוויות במחומש?",
        choices: ["360°", "540°", "900°", "720°"],
        check: pick(1, { 0: "360° זה סכום של שני משולשים. ספור כמה משולשים יש כאן.", 2: "900° = 5 × 180°. אבל יש רק 3 משולשים, לא 5.", 3: "720° = 4 × 180°. כמה משולשים צבועים?" }),
        ok: "3 משולשים × 180° = 540°." },
      { ch: 0, setup: L => { Object.assign(L.state, { fan: false, showInt: true, drag: true, hot: 3, rows: L => [["סכום הזוויות", G.fmt(Math.round(angles(L.state.P).reduce((s, a) => s + a.int, 0))) + "°", "a"]] }); },
        say: "עכשיו רואים כל זווית. אפשר לגרור כל קודקוד.",
        task: "גרור את הקודקוד D כך שהזווית בו תהיה 90° בדיוק. שים עין על הסכום.",
        demo: L => { L.state.P[3] = [340, 300]; L.act({ type: "drop", key: "p3" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const a = angles(L.state.P)[3].int; if (Math.abs(a - 90) < .5) return true;
          if (e.key !== "p3") return "הזזת קודקוד אחר. גרור את D, הקודקוד שהזווית שלו מסומנת באדום.";
          return "הזווית ב־D עכשיו " + deg(a) + ". רמז: נסה ש־DC תהיה אופקית ו־DE אנכית."; },
        ok: "D = 90°. הזוויות האחרות השתנו יחד איתה, אבל <b>הסכום נשאר 540°</b>. הסכום תלוי רק במספר הצלעות." },
      { ch: 0, setup: L => { L.state = { P: regular(5), fan: true, rows: sumRows }; },
        say: "כל צלע נוספת מוסיפה עוד משולש.",
        task: "לפני שנבדוק: מה סכום הזוויות במצולע בעל 8 צלעות?",
        choices: ["1440°", "1080°", "1260°", "720°"],
        check: pick(1, { 0: "1440° = 8 × 180°. אבל מקודקוד אחד יוצאים פחות משולשים מצלעות. כמה פחות?", 2: "1260° = 7 × 180°. ספור שוב: בחומש היו 3 משולשים, כלומר n − 2.", 3: "720° זה רק 4 משולשים. כמה יהיו במתומן?" }),
        ok: "נבדוק על הלוח." },
      { ch: 0, say: "הוסף צלעות ושים לב למספר המשולשים.", task: "לחץ '+ צלע' עד שתגיע למתומן.",
        tools: nTools(3, 12, "n"),
        demo: L => { setN(L, 8); L.act({ type: "n" }); },
        check: (L, e) => { if (e.type !== "n") return null; const n = L.state.P.length; return n === 8 ? true : n > 8 ? "עברת את 8. לחץ '− צלע'." : null; },
        ok: "8 צלעות, 6 משולשים: 6 × 180° = 1080°. מכאן הנוסחה: <b>סכום = (n − 2) · 180°</b>." },

      { ch: 1, setup: L => { L.state = { P: regular(3), showInt: true, rows: regRows }; },
        say: "במצולע <b>משוכלל</b> כל הצלעות וכל הזוויות שוות. לכן זווית אחת = הסכום ÷ n.",
        task: "בנה מצולע משוכלל שכל זווית בו היא 135°.",
        tools: nTools(3, 12, "n"),
        demo: L => { setN(L, 8); L.act({ type: "n" }); },
        check: (L, e) => { if (e.type !== "n") return null; const n = L.state.P.length; return n === 8 ? true : n > 8 ? "עברת. ככל שיש יותר צלעות, כל זווית גדלה. חזור צלע אחורה." : null; },
        ok: "מתומן משוכלל: 1080° ÷ 8 = 135°. כדאי לזכור: מחומש 108°, משושה 120°, מתומן 135°." },
      { ch: 1, setup: L => { setN(L, 5); }, say: "מלכודת נפוצה במבחן.",
        task: "מה גודלה של זווית <b>אחת</b> במחומש משוכלל?",
        choices: ["540°", "108°", "72°", "120°"],
        check: pick(1, { 0: "540° זה סכום כל חמש הזוויות. שאלו על זווית אחת.", 2: "72° = 360° ÷ 5. זו הזווית החיצונית, לא הפנימית.", 3: "120° זו הזווית במשושה. במחומש: 540° ÷ 5." }),
        ok: "540° ÷ 5 = 108°. תמיד בדוק: שאלו על הסכום או על זווית אחת?" },

      { ch: 2, setup: L => { L.state = { P: PENT(), mode: "free", drag: true, convex: true, showExt: true, rows: L => [["סכום הזוויות החיצוניות", G.fmt(Math.round(angles(L.state.P).reduce((s, a) => s + a.ext, 0))) + "°", "ok"]] }; L.memo.snap = JSON.stringify(L.state.P); },
        say: "זווית חיצונית: ממשיכים צלע (הקו המקווקו) ומודדים בכמה 'מסתובבים' בפינה. היא משלימה את הזווית הפנימית ל־180°.",
        task: "גרור קודקודים ונסה לשנות את סכום הזוויות החיצוניות.",
        demo: L => { L.state.P[1] = [60, 180]; L.act({ type: "drop", key: "p1" }); },
        check: (L, e) => e.type === "drop" && JSON.stringify(L.state.P) !== L.memo.snap ? true : null,
        ok: "כל זווית חיצונית השתנתה, אבל הסכום נשאר 360°." },
      { ch: 2, say: "ומה אם יהיו יותר צלעות?",
        task: "לפני שנבדוק: מה יקרה לסכום הזוויות החיצוניות כשמוסיפים צלעות?",
        choices: ["יגדל ב־180° על כל צלע", "יישאר 360°", "יגדל ב־360° על כל צלע"],
        check: (L, e) => { if (e.type !== "choice") return null; L.memo.extGuess = e.j; return true; },
        ok: L => L.memo.extGuess === 1 ? "בוא נראה למה זה נכון." : "זו בדיוק ההתנהגות של הזוויות ה<b>פנימיות</b>. בוא נבדוק את החיצוניות." },
      { ch: 2, say: "דמיין שאתה הולך לאורך הצלעות. בכל פינה אתה מסתובב בזווית החיצונית, ובסוף חוזר לכיוון שבו התחלת.",
        task: "לחץ 'אסוף למרכז' כדי לחבר את כל הזוויות החיצוניות.",
        tools: () => [["אסוף למרכז", L => { L.state.gather = true; L.render(); L.act({ type: "gather" }); }, true]],
        demo: L => { L.state.gather = true; L.act({ type: "gather" }); },
        check: (L, e) => e.type === "gather" ? true : null,
        ok: L => (L.memo.extGuess === 1 ? "צדקת. " : "") + "יחד הן סיבוב שלם: 360°. זה נכון לכל מצולע (קמור), עם כל מספר צלעות. במשוכלל כל חיצונית = 360° ÷ n." },
      { ch: 2, setup: L => { L.state.drag = false; },
        say: "השתמש בזה הפוך.",
        task: "כל זווית פנימית במצולע משוכלל היא 140°. כמה צלעות יש לו?",
        choices: ["7", "9", "10", "14"],
        check: pick(1, { 0: "בדוק: במשוכלל בן 7 צלעות כל חיצונית 360° ÷ 7 ≈ 51°. כמה צריכה להיות החיצונית?", 2: "360° ÷ 10 = 36°, כלומר פנימית 144°. חשב קודם את החיצונית: 180° − 140°.", 3: "חשב קודם את הזווית החיצונית: 180° − 140°. כמה כאלה נכנסות ב־360°?" }),
        ok: "חיצונית = 180° − 140° = 40°, ו־360° ÷ 40° = 9 צלעות." },

      { ch: 3, setup: L => { L.state = { P: regular(6, 130).map(p => [p[0], p[1]]), hex: [false, false, false], rows: () => [["צלע", "6"], ["שטח משולש שווה־צלעות", "a²·√3 ÷ 4"]] };
          L.state.P = Array.from({ length: 6 }, (_, i) => { const a = Math.PI + Math.PI / 3 * i; return [CX + 130 * Math.cos(a), CY + 130 * Math.sin(a)]; }); },
        say: "משושה משוכלל שצלעו 6. את השטח מוצאים בפירוק לצורות מוכרות.",
        task: "לחץ על שלושת הקווים המקווקווים כדי להעביר את האלכסונים הארוכים.",
        demo: L => { L.state.hex = [true, true, true]; L.act({ type: "tap" }); },
        check: (L, e) => e.type === "tap" && L.state.hex.every(Boolean) ? true : null,
        ok: "6 משולשים שווי־צלעות, כל אחד בצלע 6. שטח אחד: 6²·√3 ÷ 4 = 9√3." },
      { ch: 3, task: "מה שטח המשושה?", choices: ["9√3", "54√3", "36√3", "108"],
        check: pick(1, { 0: "זה שטח משולש אחד. כמה משולשים יש?", 2: "36√3 = 6² · √3. אבל משולש אחד הוא 9√3, ויש 6 כאלה.", 3: "בשטח של משולש שווה־צלעות יש √3. חשב 6 × 9√3." }),
        ok: "6 × 9√3 = 54√3. ובנוסחה: 6 · a²√3 ÷ 4." },
      { ch: 3, setup: L => { L.state.hexDiag = true; },
        say: "האלכסון הירוק עובר דרך המרכז.", task: "מה אורכו?",
        choices: ["6", "6√3", "12", "18"],
        check: pick(2, { 0: "6 זו צלע אחת. האלכסון עובר דרך שני משולשים.", 1: "6√3 הוא האלכסון ה<b>קצר</b>, שמדלג על קודקוד אחד. הארוך עובר דרך המרכז.", 3: "ספור: מהקודקוד למרכז צלע אחת של משולש, ומהמרכז לקודקוד הנגדי עוד אחת." }),
        ok: "שתי צלעות של משולש: <b>12 = 2a</b>. האלכסון הקצר הוא פעמיים גובה של משולש: a√3 = 6√3." },
      { ch: 3, setup: L => { L.state = { P: [[0, 0], [1, 0], [0, 1]], oct: [false, false, false, false], rows: () => [["ריבוע + 4 מלבנים", "a² + 4 · a²/√2"], ["4 משולשי פינה", "= ?", "a"]] }; },
        say: "מתומן משוכלל בצלע a: ריבוע באמצע, 4 מלבנים ו־4 משולשים בפינות.",
        task: "לחץ על ארבעת משולשי הפינה כדי להזיז אותם לריבוע האמצעי.",
        demo: L => { L.state.oct = [true, true, true, true]; L.act({ type: "tap" }); },
        check: (L, e) => e.type === "tap" && L.state.oct.every(Boolean) ? (L.state.rows = () => [["ריבוע + 4 מלבנים", "a² + 4 · a²/√2"], ["4 משולשי פינה", "= a²", "a"], ["שטח המתומן", "2a² + 2√2·a²", "a"]], true) : null,
        ok: "ארבעת משולשי הפינה ממלאים בדיוק את הריבוע: יחד הם a². לכן שטח המתומן = 2a² + 4 · a · a/√2 = <b>2a² + 2√2·a²</b>." },

      { ch: 4, setup: L => { L.state = { P: regular(6), showInt: "top", rows: L => { const n = L.state.P.length, i = 180 - 360 / n; return [["מספר צלעות", "n = " + n], ["פנימית", G.fmt(r1(i)) + "°"], ["חיצונית", G.fmt(r1(360 / n)) + "°", "ok"]]; } }; },
        say: "שאלה ברמת מבחן. אפשר לשנות את מספר הצלעות על הלוח.",
        task: "במצולע משוכלל, כל זווית פנימית גדולה פי 4 מהזווית החיצונית. כמה צלעות יש לו?",
        tools: nTools(3, 12, "n"),
        choices: ["8", "10", "12", "5"],
        check: pick(1, { 0: "במתומן: פנימית 135°, חיצונית 45°. זה פי 3 בלבד.", 2: "ב־12 צלעות: פנימית 150°, חיצונית 30°. זה פי 5.", 3: "במחומש: 108° ו־72°. זה אפילו לא פי 2." }),
        ok: "פנימית + חיצונית = 180°, ופנימית = 4 × חיצונית. לכן 5 × חיצונית = 180°, חיצונית = 36°, ו־360° ÷ 36° = 10 צלעות." },
      { ch: 4, say: "<b>סיכום המעבדה:</b><br>1. מקודקוד אחד: n − 2 משולשים. סכום הזוויות = (n − 2) · 180°.<br>2. משוכלל: זווית אחת = הסכום ÷ n. מחומש 108°, משושה 120°, מתומן 135°.<br>3. סכום החיצוניות תמיד 360°. חיצונית = 180° − פנימית, ו־n = 360° ÷ חיצונית.<br>4. שטח: מפרקים. משושה = 6 משולשים שווי־צלעות, מתומן = ריבוע, 4 מלבנים ו־4 משולשים ששווים לריבוע.", next: "סיום המעבדה" },
    ]),
  });
})();
