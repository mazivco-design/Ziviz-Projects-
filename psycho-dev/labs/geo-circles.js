/* Lab: מעגלים — points that slide on a circle (radii → isosceles, central vs. inscribed angle, diameter, cyclic quad),
   tangents from a draggable outside point, sector with draggable radius and angle (area, part of whole, segment). */
(function () {
  const { G } = Lab, R = Math.PI / 180;
  const norm = a => ((a % 360) + 360) % 360;
  const ang = (P, Q) => norm(Math.atan2(-(Q[1] - P[1]), Q[0] - P[0]) / R);
  const at = (V, a, r) => [V[0] + r * Math.cos(a * R), V[1] - r * Math.sin(a * R)];
  const snap = (v, s) => Math.round(v / s) * s;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const m = s => '<bdi dir="ltr">' + s + '</bdi>';
  const r1 = v => Math.round(v * 10) / 10;
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const cdist = (a, b) => { const d = norm(a - b); return Math.min(d, 360 - d); };
  function interior(V, P, Q) { let a1 = ang(V, P), d = norm(ang(V, Q) - a1); if (d > 180) { a1 = ang(V, Q); d = 360 - d; } return [a1, d]; }
  function wedge(V, a1, d, r, cls) { const s = at(V, a1, r), e = at(V, a1 + d, r); return G.path(`M${V[0]},${V[1]} L${s[0]},${s[1]} A${r},${r} 0 ${d > 180 ? 1 : 0} 0 ${e[0]},${e[1]} Z`, cls); }
  function arcPath(V, a1, d, r, cls) { const s = at(V, a1, r), e = at(V, a1 + d, r); return G.path(`M${s[0]},${s[1]} A${r},${r} 0 ${d > 180 ? 1 : 0} 0 ${e[0]},${e[1]}`, cls); }
  function angLbl(V, a1, d, r, text, cls) { const mid = a1 + d / 2, rr = r + 16 + Math.max(0, 40 - d) * 0.6, p = at(V, mid, rr), w = String(text).length * 8; return G.t(p[0] + Math.cos(mid * R) * w * .4, p[1] + 6, text, cls); }
  function rmark(V, a1, s = 11) { const u = at(V, a1, s), w = at(V, a1 + 90, s), c = at(u, a1 + 90, s); return G.path(`M${u[0]},${u[1]} L${c[0]},${c[1]} L${w[0]},${w[1]}`, "thin"); }
  function sideLbl(P, Q, In, text, cls, off = 8) {
    const mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2; let nx = -(Q[1] - P[1]), ny = Q[0] - P[0]; const n = Math.hypot(nx, ny) || 1; nx /= n; ny /= n;
    if ((In[0] - mx) * nx + (In[1] - my) * ny > 0) { nx = -nx; ny = -ny; }
    const w = String(text).length * 9.5, d = off + Math.abs(nx) * w / 2 + Math.abs(ny) * 9; return G.t(mx + nx * d, my + ny * d + 6, text, cls);
  }
  const sqrtStr = n => { const s = Math.round(Math.sqrt(n)); return s * s === n ? String(s) : "√" + n + " ≈ " + r1(Math.sqrt(n)); };
  const piStr = (num, den) => { const g = gcd(num, den), n = num / g, d = den / g; return d === 1 ? (n === 1 ? "π" : n + "π") : "(" + n + "/" + d + ")π"; };

  // ---------- model 1: points on a circle ----------
  const O = [220, 192], RC = 140;
  const inArc = (x, a1, d) => norm(x - a1) < d;     // is angle x inside the ccw arc a1 → a1+d
  function circInfo(S) {
    const d = norm(S.B - S.A);                        // ccw arc A → B (the arc that is "below" in the default setup)
    if (S.C == null) return { d, arcA: S.A, arcD: d, ins: null };
    const onAB = inArc(S.C, S.A, d);                 // C sits on arc A→B ⇒ the angle at C intercepts the other arc
    const arcA = onAB ? S.B : S.A, arcD = onAB ? 360 - d : d;
    return { d, arcA, arcD, ins: arcD / 2, onAB };
  }
  function drawCirc(S) {
    let h = ""; const A = at(O, S.A, RC), B = at(O, S.B, RC), C = S.C != null ? at(O, S.C, RC) : null, I = circInfo(S), lb = S.labels || {};
    h += G.circle(O[0], O[1], RC, "ink");
    if (S.iso) {   // chapter 0: triangle AOB
      h += G.poly([O, A, B], "fblue-soft");
      const [a1, d1] = interior(A, O, B), [b1, d2] = interior(B, A, O);
      h += wedge(A, a1, d1, 26, "fsoft") + wedge(B, b1, d2, 26, "fsoft") + wedge(O, S.A, I.d, 30, "fok-soft");
      h += G.poly([O, A, B], "ink");
      h += angLbl(A, a1, d1, 26, G.fmt((180 - I.d) / 2) + "°", "a") + angLbl(B, b1, d2, 26, G.fmt((180 - I.d) / 2) + "°", "a") + angLbl(O, S.A, I.d, 30, I.d + "°", "ok");
      for (const [P, a] of [[A, S.A], [B, S.B]]) { const mp = [(O[0] + P[0]) / 2, (O[1] + P[1]) / 2], q = at(mp, a + 90, 16); h += G.t(q[0], q[1] + 6, "r", "b"); }
    } else {
      if (S.showCentral !== false) {
        h += wedge(O, I.arcA, I.arcD, 30, "fok-soft") + arcPath(O, I.arcA, I.arcD, RC, "sok");
        h += G.line(O[0], O[1], A[0], A[1], "thin") + G.line(O[0], O[1], B[0], B[1], "thin");
        h += angLbl(O, I.arcA, I.arcD, 30, lb.o || (I.arcD + "°"), "ok");
      }
      if (C) {
        const [c1, cd] = interior(C, A, B);
        h += wedge(C, c1, cd, 30, "fsoft") + G.line(C[0], C[1], A[0], A[1], "ink") + G.line(C[0], C[1], B[0], B[1], "ink");
        h += angLbl(C, c1, cd, 30, lb.c || (S.hideIns ? "?" : G.fmt(I.ins) + "°"), "a");
      }
      if (S.chord) h += G.line(A[0], A[1], B[0], B[1], "ink");
      if (lb.a) { const [a1, d1] = interior(A, B, C); h += wedge(A, a1, d1, 30, "fblue-soft") + angLbl(A, a1, d1, 30, lb.a, "blue"); }
      if (lb.b) { const [a1, d1] = interior(B, C, A); h += wedge(B, a1, d1, 30, "fblue-soft") + angLbl(B, a1, d1, 30, lb.b, "blue"); }
    }
    h += G.circle(O[0], O[1], 4, "dot") + G.t(O[0] - 4, O[1] - 10, "O", "b", "end");
    const pts = [["A", S.A], ["B", S.B]].concat(S.C != null ? [["C", S.C]] : []);
    for (const [n, a] of pts) { const P = at(O, a, RC), q = at(O, a, RC + 26); h += G.circle(P[0], P[1], 4, "dot") + G.t(q[0], q[1] + 6, n, "b"); if ((S.drag || "").includes(n)) h += G.knob(P[0], P[1], n, 15); }
    // readout
    let y = 40; const line = (txt, cls) => { h += G.t(605, y, txt, cls, "end"); y += 28; };
    if (S.iso) { line("∢AOB = " + I.d + "°", "ok"); line("∢OAB = ∢OBA = " + G.fmt((180 - I.d) / 2) + "°", "a"); }
    else if (!S.labels) {
      if (S.showCentral !== false) line("∢AOB = " + I.arcD + "°", "ok");
      if (C) line("∢ACB = " + (S.hideIns ? "?" : G.fmt(I.ins) + "°"), "a");
      if (S.quad && C) line(G.fmt(I.ins) + "° + " + G.fmt(180 - I.ins) + "° = 180°", "b");
    }
    if (S.note) h += S.note(S);
    return h;
  }

  // ---------- model 2: tangents from P ----------
  const TO = [190, 192], TU = 18, TR = 5;
  function drawTan(S) {
    let h = ""; const P = [TO[0] + S.px * TU, TO[1] - S.py * TU], d2 = S.px * S.px + S.py * S.py, d = Math.sqrt(d2), phi = Math.acos(TR / d) / R, base = ang(TO, P);
    const T1 = at(TO, base + phi, TR * TU), T2 = at(TO, base - phi, TR * TU);
    h += G.poly([TO, T1, P, T2], "fblue-soft") + G.circle(TO[0], TO[1], TR * TU, "ink");
    h += G.line(P[0], P[1], T1[0], T1[1], "sa") + G.line(P[0], P[1], T2[0], T2[1], "sa");
    h += G.line(TO[0], TO[1], T1[0], T1[1], "ink") + G.line(TO[0], TO[1], T2[0], T2[1], "ink") + G.line(TO[0], TO[1], P[0], P[1], "dash");
    h += rmark(T1, ang(T1, P)) + rmark(T2, ang(T2, TO));
    const tl = sqrtStr(d2 - 25);
    for (const T of [T1, T2]) h += sideLbl(T, P, TO, tl, "a") + sideLbl(TO, T, P, "5", "b");
    h += G.circle(TO[0], TO[1], 4, "dot") + G.t(TO[0] - 8, TO[1] + 6, "O", "b", "end");
    h += G.knob(P[0], P[1], "P", 15) + G.t(P[0] + (S.px > 16 ? -22 : 22), P[1] - 16, "P", "b");
    h += G.t(605, 40, "OP = " + sqrtStr(d2), "b", "end") + G.t(605, 68, "PT = " + tl, "a", "end");
    h += G.t(605, 360, "r = 5", "m", "end");
    return h;
  }

  // ---------- model 3: sector ----------
  const SO = [200, 200], SU = 24;
  function drawSector(S) {
    let h = ""; const rp = S.r * SU, K1 = at(SO, 0, rp), K2 = at(SO, S.al, rp);
    h += G.circle(SO[0], SO[1], rp, "fblue-soft");
    h += wedge(SO, 0, S.al, rp, "fsoft");
    if (S.seg) { h += G.poly([SO, K1, K2], "fwarn"); h += G.line(K1[0], K1[1], K2[0], K2[1], "ink"); }
    h += G.circle(SO[0], SO[1], rp, "ink") + G.line(SO[0], SO[1], K1[0], K1[1], "ink") + G.line(SO[0], SO[1], K2[0], K2[1], "ink");
    h += S.al === 90 ? rmark(SO, 0, 12) : angLbl(SO, 0, S.al, 18, S.al + "°", "a");
    if (S.al === 90) { const q = at(SO, 45, 34); h += G.t(q[0], q[1] + 6, "90°", "a"); }
    h += G.t((SO[0] + K1[0]) / 2, SO[1] + 22, "r = " + S.r, "b");
    h += G.circle(SO[0], SO[1], 4, "dot");
    if (!S.seg) h += G.knob(K1[0], K1[1], "r", 15) + G.knob(K2[0], K2[1], "al", 15);
    const g = gcd(S.al, 360);
    let y = 34; const line = (txt, cls) => { h += G.t(605, y, txt, cls, "end"); y += 28; };
    line("S = πr² = " + piStr(S.r * S.r, 1), "blue");
    line("P = 2πr = " + piStr(2 * S.r, 1), "m");
    line("α/360 = " + S.al + "/360 = " + (S.al / g) + "/" + (360 / g), "a");
    const heLine = (lab, f, cls) => { h += G.he(605, y - 4, lab, "m", "right"); y += 24; h += G.t(605, y, f, cls, "end"); y += 32; };
    heLine("שטח הגזרה", piStr(S.al * S.r * S.r, 360), "a");
    if (S.seg) { heLine("שטח המשולש", S.r + " × " + S.r + " ÷ 2 = " + G.fmt(S.r * S.r / 2), "w"); heLine("שטח המקטע", piStr(S.al * S.r * S.r, 360) + " − " + G.fmt(S.r * S.r / 2), "b"); }
    return h;
  }

  function draw(L) { const S = L.state; return S.mode === "circ" ? drawCirc(S) : S.mode === "tan" ? drawTan(S) : drawSector(S); }
  function drag(L, key, pt) {
    const S = L.state, p = [pt.x, pt.y];
    if (S.mode === "circ") {
      const a = snap(ang(O, p), 5), others = ["A", "B", "C"].filter(k => k !== key && S[k] != null).map(k => S[k]);
      if (others.some(o => cdist(o, a) < 15)) return;
      if (S.iso) { const d = key === "A" ? norm(S.B - a) : norm(a - S.A); if (d < 20 || d > 170) return; }
      S[key] = a;
    } else if (S.mode === "tan") {
      const x = clamp(Math.round((pt.x - TO[0]) / TU), -9, 22), y = clamp(Math.round((TO[1] - pt.y) / TU), -9, 9);
      if (x * x + y * y >= 36) { S.px = x; S.py = y; }
    } else {
      if (key === "r") S.r = clamp(Math.round((pt.x - SO[0]) / SU), 1, 7);
      else { const a = snap(ang(SO, p), 15); S.al = clamp(a === 0 ? (S.al > 180 ? 345 : 15) : a, 15, 345); }
    }
  }
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const dropIf = (ok, hint) => (L, e) => e.type !== "drop" ? null : ok(L.state) ? true : hint(L.state);
  const circ = o => Object.assign({ mode: "circ", A: 210, B: 330, C: null, drag: "", iso: false, chord: false }, o);

  Lab.register({
    id: "geo-circles", title: "המחשה: מעגלים", viewBox: "0 0 620 380",
    chapters: ["רדיוסים", "מרכזית והיקפית", "משיקים", "שטח וגזרה", "שאלת מבחן"],
    draw, drag,
    steps: [
      // ---- ch0: radii → isosceles ----
      { ch: 0, setup: L => { L.state = circ({ A: 210, B: 330, iso: true, drag: "AB" }); },
        say: "מעגל שמרכזו O. הנקודות A ו־B נמצאות על המעגל ואפשר להזיז אותן לאורכו. OA ו־OB הם רדיוסים, ולכן שניהם באורך r.",
        task: `הזז את A או את B כך ש־${m("∢AOB")} תהיה 60°.`,
        demo: L => { Object.assign(L.state, { A: 240, B: 300 }); L.act({ type: "drop" }); },
        check: dropIf(S => norm(S.B - S.A) === 60, S => { const d = norm(S.B - S.A); return `${m("∢AOB = " + d + "°")}. ${d > 60 ? "קרב את A ו־B זו לזו." : "הרחק את A ו־B זו מזו."}`; }),
        ok: "שני רדיוסים שווים, ולכן המשולש AOB תמיד <b>שווה־שוקיים</b>, וזוויות הבסיס שוות. כאן כל זווית היא 60°, כלומר המשולש שווה־צלעות, והמיתר AB שווה לרדיוס." },
      { ch: 0, say: "גרור עוד קצת: זוויות הבסיס תמיד שוות, ותמיד משלימות יחד עם הזווית שב־O ל־180°.",
        task: `אם ${m("∢AOB = 100°")}, כמה היא הזווית OAB?`, choices: ["40°", "50°", "80°", "100°"],
        check: (L, e) => { if (e.type !== "choice") return null; if (e.j === 0) { Object.assign(L.state, { A: 220, B: 320 }); L.render(); return true; }
          return { 1: "50° היא חצי מ־100°. אבל זוויות הבסיס הן חצי ממה שנשאר מ־180°.", 2: `80° = ${m("180° − 100°")}. זה הסכום של שתי זוויות הבסיס יחד.`, 3: "100° היא הזווית שב־O. זווית הבסיס נמצאת ב־A." }[e.j]; },
        ok: `${m("(180° − 100°) ÷ 2 = 40°")}. זה הכלי הכי שימושי במעגלים: <b>כל משולש עם שני רדיוסים הוא שווה־שוקיים</b>.` },
      // ---- ch1: central vs inscribed ----
      { ch: 1, setup: L => { L.state = circ({ A: 210, B: 330, C: 100, hideIns: true }); },
        say: `עכשיו יש נקודה שלישית, C, על המעגל. הזווית ${m("∢ACB")} נקראת <b>זווית היקפית</b>, והזווית ${m("∢AOB")} היא <b>זווית מרכזית</b>. שתיהן 'נשענות' על אותה קשת (בירוק).`,
        task: `${m("∢AOB = 120°")}. כמה לדעתך ${m("∢ACB")}?`, choices: ["30°", "60°", "120°", "240°"],
        check: (L, e) => { if (e.type !== "choice") return null; L.memo.ins = e.j; L.state.hideIns = false; L.render(); return true; },
        ok: L => (L.memo.ins === 1 ? "צדקת. " : "") + `${m("∢ACB = 60°")}, בדיוק חצי. <b>זווית מרכזית = פעמיים זווית היקפית</b> הנשענת על אותה קשת.` },
      { ch: 1, setup: L => { L.state.drag = "AB"; },
        say: "בוא נבדוק את הכלל בידיים. הזז את A ואת B.", task: `הזז את A או את B כך ש־${m("∢ACB")} תהיה 40°.`,
        demo: L => { Object.assign(L.state, { A: 230, B: 310 }); L.act({ type: "drop" }); },
        check: dropIf(S => { const I = circInfo(S); return !I.onAB && I.d === 80; }, S => { const I = circInfo(S); return I.onAB ? "C נמצאת עכשיו על הקשת הירוקה. השאר את C למעלה, מחוץ לקשת שבין A ל־B." : `${m("∢ACB = " + G.fmt(I.ins) + "°")}, והזווית המרכזית ${I.d}°. איזו זווית מרכזית נותנת 40°?`; }),
        ok: `הזווית המרכזית 80°, וההיקפית חצי ממנה: 40°.` },
      { ch: 1, setup: L => { Object.assign(L.state, { drag: "C", c0: L.state.C }); },
        say: "עכשיו A ו־B קבועות, ואפשר להזיז את C.", task: "הזז את C למקום אחר על הקשת הגדולה (למעלה), ובדוק מה קורה לזווית שלה.",
        demo: L => { L.state.C = 40; L.act({ type: "drop" }); },
        check: dropIf(S => !circInfo(S).onAB && cdist(S.C, S.c0) >= 30, S => circInfo(S).onAB ? "C עברה לקשת הקטנה שבין A ל־B. השאר אותה בקשת הגדולה, למעלה." : "הזז את C קצת יותר רחוק מהמקום שבו התחילה."),
        ok: `${m("∢ACB")} נשארה 40°. <b>כל הזוויות ההיקפיות שנשענות על אותה קשת שוות</b>, כי כולן חצי מאותה זווית מרכזית.` },
      { ch: 1, setup: L => { Object.assign(L.state, { quad: true }); },
        say: "ומה אם C עוברת לצד השני?", task: "הזז את C אל הקשת הקטנה, בין A ל־B (למטה).",
        demo: L => { L.state.C = 270; L.act({ type: "drop" }); },
        check: dropIf(S => circInfo(S).onAB, S => "C עדיין בקשת הגדולה. הזז אותה מתחת למיתר שבין A ל־B."),
        ok: `עכשיו C 'רואה' את הקשת הגדולה. הזווית המרכזית שלה היא ${m("360° − 80° = 280°")}, ולכן ${m("∢ACB = 140°")}. שים לב: ${m("40° + 140° = 180°")}. זו הסיבה ש<b>במרובע חסום במעגל, זוויות נגדיות משלימות ל־180°</b>.` },
      { ch: 1, setup: L => { Object.assign(L.state, { A: 230, B: 310, C: 100, quad: false, drag: "AB" }); },
        say: "מקרה מיוחד וחשוב.", task: "הזז את A או את B כך ש־AB יהיה <b>קוטר</b> (עובר דרך המרכז O).",
        demo: L => { Object.assign(L.state, { A: 180, B: 0 }); L.act({ type: "drop" }); },
        check: dropIf(S => circInfo(S).d === 180, S => `${m("∢AOB = " + circInfo(S).arcD + "°")}. בקוטר, A, O ו־B על קו ישר אחד: הזווית המרכזית 180°.`),
        ok: `הזווית המרכזית 180°, ולכן ${m("∢ACB = 90°")}. <b>זווית היקפית שנשענת על קוטר היא תמיד ישרה</b>, לא משנה איפה C.` },
      // ---- ch2: tangents ----
      { ch: 2, setup: L => { L.state = { mode: "tan", px: 10, py: 2 }; },
        say: "מעגל ברדיוס 5, ונקודה P מחוצה לו. מ־P יוצאים שני <b>משיקים</b>. בנקודות ההשקה המשיק <b>מאונך לרדיוס</b>. גרור את P.",
        task: "גרור את P כך שאורך כל משיק יהיה 12.",
        demo: L => { Object.assign(L.state, { px: 13, py: 0 }); L.act({ type: "drop" }); },
        check: dropIf(S => S.px * S.px + S.py * S.py === 169, S => { const d2 = S.px * S.px + S.py * S.py; return `${m("OP = " + sqrtStr(d2))}, ולכן המשיק ${m("√(" + d2 + " − 25) = " + sqrtStr(d2 - 25))}. ${d2 < 169 ? "הרחק את P מ־O." : "קרב את P אל O."} במשולש: ניצב 5, ניצב 12, יתר?`; }),
        ok: `${m("OP = 13")}: השלשה ${m("5 : 12 : 13")}. שני המשיקים <b>שווים באורכם</b>, ויחד עם הרדיוסים הם יוצרים <b>דלתון</b> (בכחול).` },
      { ch: 2, say: "בדלתון שעל הלוח יש שתי זוויות ישרות, בנקודות ההשקה.",
        task: "הזווית בין שני המשיקים, ב־P, היא 50°. מה הזווית בין שני הרדיוסים, ב־O?", choices: ["50°", "90°", "130°", "140°"],
        check: pick(2, { 0: "הזווית ב־O אינה שווה לזווית ב־P. מה סכום הזוויות במרובע?", 1: "90° הן הזוויות בנקודות ההשקה. ב־O הזווית אחרת.", 3: `140° = ${m("90 + 50")}. בדוק: סכום הזוויות במרובע הוא 360°.` }),
        ok: `${m("360° − 90° − 90° − 50° = 130°")}. הזווית ב־O והזווית ב־P תמיד משלימות ל־180°.` },
      // ---- ch3: area, sector, segment ----
      { ch: 3, setup: L => { L.state = { mode: "sector", r: 3, al: 60, seg: false }; },
        say: "מעגל עם גזרה ורודה. העיגול הימני משנה את הרדיוס, והעיגול השני את זווית הגזרה. מימין: השטח, ההיקף ואיזה חלק מהמעגל הגזרה תופסת.",
        task: "קבע רדיוס 4, ועשה שהגזרה תהיה בדיוק רבע מעגל.",
        demo: L => { Object.assign(L.state, { r: 4, al: 90 }); L.act({ type: "drop" }); },
        check: dropIf(S => S.r === 4 && S.al === 90, S => S.r !== 4 ? `הרדיוס עכשיו ${S.r}. גרור את העיגול הימני לרדיוס 4.` : `הגזרה עכשיו ${S.al}°, כלומר ${S.al / gcd(S.al, 360)}/${360 / gcd(S.al, 360)} מהמעגל. רבע מעגל הוא ${m("360° ÷ 4")}.`),
        ok: `שטח המעגל ${m("π · 4² = 16π")}, והגזרה רבע ממנו: ${m("4π")}. <b>גזרה היא חלק יחסי</b>: 90° זה רבע, 120° שליש, 60° שישית.` },
      { ch: 3, say: "עכשיו נבדוק מה קורה כשמכפילים את הרדיוס.", task: "אם הרדיוס גדל מ־3 ל־6, פי כמה גדל שטח המעגל?",
        choices: ["פי 2", "פי 4", "פי 6", "פי 3.14"],
        check: (L, e) => { if (e.type !== "choice") return null; if (e.j === 1) { Object.assign(L.state, { r: 6, al: 90 }); L.render(); return true; }
          return { 0: `נסה על הלוח: ברדיוס 3 השטח ${m("9π")}. גרור לרדיוס 6 ובדוק.`, 2: "שטח תלוי ב־r², לא ב־r כפול משהו. מה זה 6² לעומת 3²?", 3: "π נמצא בשני השטחים, והוא מתקזז. השאלה היא מה קורה ל־r²." }[e.j]; },
        ok: `${m("9π → 36π")}: פי 4. <b>הכפלת הרדיוס פי 2 מכפילה את השטח פי 4</b> (ואת ההיקף רק פי 2).` },
      { ch: 3, setup: L => { Object.assign(L.state, { r: 4, al: 90 }); },
        say: "השטח שבין מיתר לקשת נקרא <b>מקטע</b>. מחשבים אותו כ'שלם פחות חלק'.",
        task: "לחץ על 'הסר את המשולש'.",
        tools: () => [["הסר את המשולש", L => { L.state.seg = true; L.act({ type: "seg" }); }, true]],
        demo: L => { L.state.seg = true; L.act({ type: "seg" }); },
        check: (L, e) => e.type === "seg" ? true : null,
        ok: `מהגזרה (${m("4π")}) מורידים את המשולש הישר־זווית שבין שני הרדיוסים (${m("4 × 4 ÷ 2 = 8")}). המקטע: ${m("4π − 8")}.` },
      { ch: 3, task: "רדיוס 6 וזווית מרכזית 90°. מה שטח המקטע?", choices: ["9π − 18", "9π", "36π − 18", "9π − 36"],
        check: (L, e) => { if (e.type !== "choice") return null; if (e.j === 0) { Object.assign(L.state, { r: 6 }); L.render(); return true; }
          return { 1: `${m("9π")} היא כל הגזרה. המקטע הוא הגזרה פחות המשולש.`, 2: `${m("36π")} הוא כל המעגל. הגזרה היא רק רבע ממנו.`, 3: `36 = ${m("6 × 6")}. שטח משולש ישר־זווית: מכפלת הניצבים ÷ 2.` }[e.j]; },
        ok: `גזרה: ${m("36π ÷ 4 = 9π")}. משולש: ${m("6 × 6 ÷ 2 = 18")}. מקטע: ${m("9π − 18")}.` },
      // ---- ch4: exam ----
      { ch: 4, setup: L => { L.state = circ({ A: 180, B: 0, C: 60, chord: true, labels: { c: " ", a: "x", b: "2x", o: " " }, showCentral: false }); },
        say: "שאלה ברמת מבחן.", task: `AB הוא קוטר במעגל, ו־C נקודה על המעגל. נתון ${m("∢ABC = 2 · ∢BAC")}. מה גודל הזווית BAC?`,
        choices: ["22.5°", "30°", "45°", "60°"],
        check: pick(1, { 0: "22.5° יוצא אם מניחים שסכום הזוויות 90° הוא 4x. אבל יש כאן x + 2x.", 2: "45° מתאים רק כש־C באמצע הקשת, ואז שתי הזוויות שוות. כאן אחת כפולה מהשנייה.", 3: "60° היא 2x, הזווית שב־B. השאלה שואלת על x." }),
        ok: `AB קוטר, ולכן ${m("∢ACB = 90°")}. נשאר: ${m("x + 2x = 90°")}, כלומר ${m("x = 30°")}.` },
      { ch: 4, say: "<b>סיכום ההמחשה:</b><br>1. כל הרדיוסים שווים: משולש עם שני רדיוסים הוא שווה־שוקיים.<br>2. זווית מרכזית = פעמיים היקפית על אותה קשת. היקפית על קוטר = 90°. במרובע חסום, נגדיות משלימות ל־180°.<br>3. משיק מאונך לרדיוס, ושני משיקים מאותה נקודה שווים.<br>4. גזרה = חלק יחסי (α/360) מהמעגל. מקטע = גזרה פחות משולש. רדיוס פי 2 ⇐ שטח פי 4.", next: "סיום ההמחשה" },
    ],
  });
})();
