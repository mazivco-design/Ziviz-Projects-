/* Lab: מרובעים — draggable parallelogram (angles, area by cut-and-move, rectangle diagonals), perpendicular-diagonals
   model (rhombus / kite / square), isosceles trapezoid with draggable corner, triangle inside a rectangle. */
(function () {
  const { G } = Lab, R = Math.PI / 180;
  const norm = a => ((a % 360) + 360) % 360;
  const at = (V, a, r) => [V[0] + r * Math.cos(a * R), V[1] - r * Math.sin(a * R)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const m = s => '<bdi dir="ltr">' + s + '</bdi>';
  const r1 = v => Math.round(v * 10) / 10;
  const sqrtStr = n => { const s = Math.round(Math.sqrt(n)); return s * s === n ? String(s) : "√" + n + " ≈ " + r1(Math.sqrt(n)); };
  function wedge(V, a1, d, r, cls) { const s = at(V, a1, r), e = at(V, a1 + d, r); return G.path(`M${V[0]},${V[1]} L${s[0]},${s[1]} A${r},${r} 0 0 0 ${e[0]},${e[1]} Z`, cls); }
  function angLbl(V, a1, d, r, text, cls) { const mid = a1 + d / 2, rr = r + 16 + Math.max(0, 40 - d) * 0.6, p = at(V, mid, rr), w = String(text).length * 8; return G.t(p[0] + Math.cos(mid * R) * w * .4, p[1] + 6, text, cls); }
  function rmark(V, a1, s = 12) { const u = at(V, a1, s), w = at(V, a1 + 90, s), c = at(u, a1 + 90, s); return G.path(`M${u[0]},${u[1]} L${c[0]},${c[1]} L${w[0]},${w[1]}`, "thin"); }
  function sideLbl(P, Q, In, text, cls, off = 8) {
    const mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2; let nx = -(Q[1] - P[1]), ny = Q[0] - P[0]; const n = Math.hypot(nx, ny) || 1; nx /= n; ny /= n;
    if ((In[0] - mx) * nx + (In[1] - my) * ny > 0) { nx = -nx; ny = -ny; }
    const w = String(text).length * 9.5, d = off + Math.abs(nx) * w / 2 + Math.abs(ny) * 9; return G.t(mx + nx * d, my + ny * d + 6, text, cls);
  }
  const dots = (O, u, x0, x1, y0, y1) => { let h = ""; for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) h += G.circle(O[0] + x * u, O[1] - y * u, 1.5, "dot", { opacity: .25 }); return h; };

  // ---------- model 1: parallelogram A(0,0) B(b,0) C(b+s,h) D(s,h) ----------
  const PO = [150, 300], PU = 30, pp = (x, y) => [PO[0] + x * PU, PO[1] - y * PU];
  const angA = S => Math.atan2(S.h, S.s) / R;
  const degStr = d => (Math.abs(d - Math.round(d)) > .05 ? "≈" : "") + Math.round(d) + "°";
  function drawPara(S) {
    let h = dots(PO, PU, -4, 12, 0, 7); const A = pp(0, 0), B = pp(S.b, 0), C = pp(S.b + S.s, S.h), D = pp(S.s, S.h), a = angA(S);
    if (S.cut) {
      const F = pp(S.s, 0), F2 = pp(S.b + S.s, 0);
      h += G.poly([F, F2, C, D], "fblue-soft");
      h += G.poly([A, F, D], "ghost") + G.poly([B, F2, C], "fok-soft");
      h += G.line(F[0], F[1], D[0], D[1], "sok") + G.line(F2[0], F2[1], C[0], C[1], "dash") + G.line(B[0], B[1], F2[0], F2[1], "dash");
      h += rmark(F, 0, 11) + rmark(F2, 90, 11);
      h += G.t((D[0] + C[0]) / 2, D[1] - 12, String(S.b), "b") + G.t(F[0] - 10, (F[1] + D[1]) / 2 + 6, "h = " + S.h, "ok", "end");
    } else {
      h += G.poly([A, B, C, D], "fblue-soft");
      if (S.angles && S.s === 0) h += rmark(A, 0) + rmark(B, 90) + rmark(C, 180) + rmark(D, 270);
      else if (S.angles) { h += wedge(A, 0, a, 28, "fsoft") + wedge(B, a, 180 - a, 24, "fok-soft") + (S.angles === "AB" ? "" : wedge(C, 180, a, 28, "fsoft") + wedge(D, 180 + a, 180 - a, 24, "fok-soft")); }
      h += G.poly([A, B, C, D], "ink");
      if (S.diag) { h += G.line(A[0], A[1], C[0], C[1], "dash") + G.line(B[0], B[1], D[0], D[1], "dash"); }
      if (S.height) {
        const F = pp(S.s, 0);
        if (S.s < 0) h += G.line(F[0], F[1], A[0], A[1], "dash");
        h += G.line(D[0], D[1], F[0], F[1], "sok") + rmark(F, S.s < 0 ? 0 : 0, 11) + G.t(F[0] + (S.s < 0 ? -8 : 8), (F[1] + D[1]) / 2 + 6, "h = " + S.h, "ok", S.s < 0 ? "end" : "start");
      }
      h += G.t((A[0] + B[0]) / 2, A[1] + 26, String(S.b), "b");
      if (!(S.height && S.s < 0)) h += sideLbl(A, D, B, sqrtStr(S.s * S.s + S.h * S.h), "b");
      if (S.angles && !(S.diag && S.s === 0)) { const ra = Math.round(a * 10) / 10; h += angLbl(A, 0, a, 28, degStr(a), "a") + angLbl(B, a, 180 - a, 24, degStr(180 - ra), "ok") + (S.angles === "AB" ? "" : angLbl(C, 180, a, 28, degStr(a), "a") + angLbl(D, 180 + a, 180 - a, 24, degStr(180 - ra), "ok")); }
    }
    h += G.t(A[0] - 12, A[1] + 22, "A", "b") + G.t(B[0] + 12, B[1] + 22, "B", "b") + G.t(C[0] + 8, C[1] - 24, "C", "b") + G.t(D[0] - 8, D[1] - 24, "D", "b");
    if (S.drag) h += G.knob(D[0], D[1], "D", 15);
    let y = 34;
    if (S.area) { h += G.t(20, y, "S = " + S.b + " × " + S.h + " = " + S.b * S.h, "ok", "start"); y += 28; }
    if (S.diag) { h += G.t(20, y, "AC = " + sqrtStr((S.b + S.s) ** 2 + S.h ** 2), "b", "start") + G.t(20, y + 26, "BD = " + sqrtStr((S.b - S.s) ** 2 + S.h ** 2), "b", "start"); }
    return h;
  }

  // ---------- model 2: perpendicular diagonals (rhombus / kite / square) ----------
  const KO = [290, 200], KU = 20;
  function drawKite(S) {
    let h = ""; const Lp = [KO[0] - S.p * KU, KO[1]], Rp = [KO[0] + S.q * KU, KO[1]], T = [KO[0], KO[1] - S.t * KU], U = [KO[0], KO[1] + S.u * KU];
    const d1 = S.p + S.q, d2 = S.t + S.u, lb = S.labels || {};
    if (S.box) { h += G.rect(Lp[0], T[1], d1 * KU, d2 * KU, "fwarn"); }
    h += G.poly([Lp, T, Rp, U], "fblue-soft") + G.poly([Lp, T, Rp, U], "ink");
    h += G.line(Lp[0], Lp[1], Rp[0], Rp[1], "dash") + G.line(T[0], T[1], U[0], U[1], "dash") + rmark(KO, 0, 10);
    if (S.halves) {
      h += G.t((Lp[0] + KO[0]) / 2, KO[1] - 8, String(S.p), "a") + G.t((Rp[0] + KO[0]) / 2, KO[1] - 8, String(S.q), "a");
      h += G.t(KO[0] + 8, (T[1] + KO[1]) / 2 + 6, String(S.t), "blue", "start") + G.t(KO[0] + 8, (U[1] + KO[1]) / 2 + 6, String(S.u), "blue", "start");
    }
    const ins = KO;
    if (!S.hideSides) for (const [P, Q] of [[Lp, T], [T, Rp], [Rp, U], [U, Lp]]) {
      const n2 = Math.round(((P[0] - Q[0]) ** 2 + (P[1] - Q[1]) ** 2) / KU / KU);
      h += sideLbl(P, Q, ins, lb.side || sqrtStr(n2), "b");
    }
    h += G.t(Rp[0] + 22, Rp[1] + 6, "d₁ = " + (lb.d1 || d1), "a", "start");
    h += G.t(T[0], T[1] - 26, "d₂ = " + (lb.d2 || d2), "blue");
    if (S.drag) { h += G.knob(Lp[0], Lp[1], "kL", 14) + G.knob(Rp[0], Rp[1], "kR", 14) + G.knob(T[0], T[1], "kT", 14) + G.knob(U[0], U[1], "kU", 14); }
    if (S.area) h += G.t(20, 34, "S = " + d1 + " × " + d2 + " ÷ 2 = " + G.fmt(d1 * d2 / 2), "ok", "start");
    if (S.box) h += G.t(20, 62, d1 + " × " + d2 + " = " + d1 * d2, "w", "start");
    if (S.name) h += G.he(600, 34, S.name(S), "b", "right");
    return h;
  }
  const kiteName = S => { const rh = S.p === S.q && S.t === S.u; if (rh && S.p === S.t) return "ריבוע"; if (rh) return "מעוין"; if (S.p === S.q || S.t === S.u) return "דלתון"; return "מרובע עם אלכסונים מאונכים"; };

  // ---------- model 3: isosceles trapezoid, bottom base 16 ----------
  const TO = [36, 315], TU = 21, BIG = 16, tp = (x, y) => [TO[0] + x * TU, TO[1] - y * TU];
  function drawTrap(S) {
    let h = dots(TO, TU, 0, 26, 0, 9); const o = (BIG - S.t) / 2, A = tp(0, 0), B = tp(BIG, 0), C = tp(BIG - o, S.h), D = tp(o, S.h);
    h += G.poly([A, B, C, D], "fblue-soft");
    if (S.copy) { const C2 = tp(2 * BIG - o, S.h), B2 = tp(BIG + S.t, 0); h += G.poly([B, B2, C2, C], "fok-soft") + G.poly([B, B2, C2, C], "ink", { "stroke-dasharray": "5 4" }); h += G.t((B[0] + B2[0]) / 2, B[1] + 26, String(S.t), "ok") + G.t((C[0] + C2[0]) / 2, C[1] - 12, String(BIG), "ok"); }
    h += G.poly([A, B, C, D], "ink");
    if (S.hts) {
      const F1 = tp(o, 0), F2 = tp(BIG - o, 0);
      h += G.line(D[0], D[1], F1[0], F1[1], "dash") + G.line(C[0], C[1], F2[0], F2[1], "dash") + rmark(F1, 0, 10) + rmark(F2, 90, 10);
      h += G.rect(A[0], A[1] + 34, o * TU, 6, "fa") + G.rect(F2[0], A[1] + 34, o * TU, 6, "fa");
      h += G.t((A[0] + F1[0]) / 2, A[1] + 58, G.fmt(o), "a") + G.t((F2[0] + B[0]) / 2, A[1] + 58, G.fmt(o), "a");
      h += G.t(F1[0] + 8, (F1[1] + D[1]) / 2 + 6, "h = " + S.h, "ok", "start");
    }
    h += G.t((A[0] + B[0]) / 2, A[1] + 24, String(BIG), "b") + G.t((C[0] + D[0]) / 2, D[1] - 12, String(S.t), "b");
    const leg2 = o * o + S.h * S.h;
    h += sideLbl(B, C, A, sqrtStr(leg2), "blue") + sideLbl(A, D, B, sqrtStr(leg2), "blue");
    if (S.drag) h += G.knob(C[0], C[1], "T", 15);
    if (S.area) h += G.t(20, 34, "S = (16 + " + S.t + ") × " + S.h + " ÷ 2 = " + G.fmt((16 + S.t) * S.h / 2), "ok", "start");
    return h;
  }

  // ---------- model 4: triangle ABP inside a rectangle ----------
  const RO = [160, 320], RU = 30;
  function drawRect(S) {
    let h = ""; const A = [RO[0], RO[1]], B = [RO[0] + 10 * RU, RO[1]], C = [B[0], RO[1] - 6 * RU], D = [A[0], C[1]], P = [RO[0] + S.px * RU, C[1]];
    h += G.poly([A, B, C, D], "fwarn") + G.poly([A, B, P], "fblue-soft") + G.poly([A, B, C, D], "ink") + G.poly([A, B, P], "ink");
    h += G.line(P[0], P[1], P[0], A[1], "dash") + rmark([P[0], A[1]], 0, 10);
    h += G.t((A[0] + B[0]) / 2, A[1] + 26, "10", "b") + G.t(B[0] + 12, (B[1] + C[1]) / 2 + 6, "6", "b", "start");
    h += G.t(A[0] - 12, A[1] + 22, "A", "b") + G.t(B[0] + 12, B[1] + 22, "B", "b") + G.t(C[0] + 22, C[1] + 6, "C", "b", "start") + G.t(D[0] - 22, D[1] + 6, "D", "b", "end");
    h += G.knob(P[0], P[1], "P", 15) + G.t(P[0], P[1] - 24, "P", "b");
    h += G.t(20, 34, "S(ABP) = 10 × 6 ÷ 2 = 30", "blue", "start") + G.t(20, 62, "S(ABCD) = 10 × 6 = 60", "w", "start");
    return h;
  }

  function draw(L) { const S = L.state; return S.mode === "para" ? drawPara(S) : S.mode === "kite" ? drawKite(S) : S.mode === "trap" ? drawTrap(S) : drawRect(S); }
  function drag(L, key, pt) {
    const S = L.state;
    if (key === "D") { S.s = clamp(Math.round((pt.x - PO[0]) / PU), -4, 6); S.h = clamp(Math.round((PO[1] - pt.y) / PU), 1, 7); }
    else if (key === "kL") S.p = clamp(Math.round((KO[0] - pt.x) / KU), 1, 10);
    else if (key === "kR") S.q = clamp(Math.round((pt.x - KO[0]) / KU), 1, 10);
    else if (key === "kT") S.t = clamp(Math.round((KO[1] - pt.y) / KU), 1, 7);
    else if (key === "kU") S.u = clamp(Math.round((pt.y - KO[1]) / KU), 1, 7);
    else if (key === "T") { const x = clamp(Math.round((pt.x - TO[0]) / TU), 9, 15); S.t = 2 * (x - 8); S.h = clamp(Math.round((TO[1] - pt.y) / TU), 1, 9); }
    else if (key === "P") S.px = clamp(Math.round((pt.x - RO[0]) / RU), 0, 10);
  }
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const dropIf = (ok, hint) => (L, e) => e.type !== "drop" ? null : ok(L.state) ? true : hint(L.state);
  const para = o => Object.assign({ mode: "para", b: 6, s: 2, h: 3, drag: true, angles: true, diag: false, height: false, cut: false, area: false }, o);
  const kite = o => Object.assign({ mode: "kite", p: 4, q: 4, t: 3, u: 3, drag: true, box: false, halves: false, area: false, name: kiteName }, o);

  Lab.register({
    id: "geo-quadrilaterals", title: "המחשה: מרובעים", viewBox: "0 0 620 380",
    chapters: ["מקבילית", "שטח מקבילית", "מעוין, דלתון וריבוע", "טרפז", "משולש בתוך מלבן", "שאלת מבחן"],
    draw, drag,
    steps: [
      // ---- ch0: parallelogram angles ----
      { ch: 0, setup: L => { L.state = para({ s: 2, h: 3 }); },
        say: "מקבילית: הבסיס AB קבוע, ואת הקודקוד D אפשר לגרור. C זז איתו, כך שהצלעות הנגדיות נשארות שוות ומקבילות.",
        task: "גרור את D כך שהזווית ב־A תהיה 45°.",
        demo: L => { Object.assign(L.state, { s: 3, h: 3 }); L.act({ type: "drop" }); },
        check: dropIf(S => S.s === S.h, S => { const a = angA(S); return `הזווית ב־A עכשיו ${degStr(a)}. ${a > 45 ? "היא גדולה מדי: הזז את D ימינה." : "היא קטנה מדי: הזז את D שמאלה או למעלה."} ב־45° הצעד ימינה שווה לצעד למעלה.`; }),
        ok: "A = C = 45°, ו־B = D = 135°. <b>זוויות נגדיות שוות</b>, ו<b>זוויות סמוכות משלימות ל־180°</b>. גרור עוד קצת ותראה שזה נשאר נכון תמיד." },
      { ch: 0, say: "ומה קורה כשהמקבילית 'נזקפת'?", task: "גרור את D כך שהמקבילית תהיה <b>מלבן</b>.",
        setup: L => { L.state.diag = true; },
        demo: L => { Object.assign(L.state, { s: 0, h: 4 }); L.act({ type: "drop" }); },
        check: dropIf(S => S.s === 0, S => `הזווית ב־A עכשיו ${degStr(angA(S))}. במלבן כל הזוויות 90°: D צריך להיות בדיוק מעל A.`),
        ok: "כל הזוויות 90°. שים לב למעלה: שני האלכסונים, שהיו שונים זה מזה, נעשו <b>שווים</b>. זו התכונה של מלבן: אלכסונים שווים." },
      // ---- ch1: parallelogram area ----
      { ch: 1, setup: L => { L.state = para({ s: 3, h: 4, drag: false, angles: false, height: true }); },
        say: "מקבילית עם בסיס 6, צלע נטויה 5 וגובה 4.",
        task: "לפני שנחתוך: מה השטח שלה?", choices: ["30", "24", "20", "12"],
        check: (L, e) => { if (e.type !== "choice") return null; L.memo.par = e.j; return true; },
        ok: L => L.memo.par === 0 ? "30 זו מכפלת הצלעות. בוא נבדוק אם זה השטח." : "בוא נבדוק על הלוח." },
      { ch: 1, say: "נחתוך את המשולש השמאלי לאורך הגובה, ונזיז אותו לצד השני.",
        task: "לחץ על 'גזור והזז'.",
        tools: () => [["גזור והזז", L => { L.state.cut = true; L.act({ type: "cut" }); }, true]],
        demo: L => { L.state.cut = true; L.act({ type: "cut" }); },
        check: (L, e) => e.type === "cut" ? true : null,
        ok: L => (L.memo.par === 0 ? "לא 30! " : L.memo.par === 1 ? "צדקת! " : "") + `המשולש עבר ימינה ונוצר מלבן של ${m("6 × 4")}. כלום לא נוסף ולא נגרע, ולכן <b>שטח מקבילית = צלע × הגובה אליה = 24</b>. מכפלת הצלעות (30) היא מלכודת.` },
      { ch: 1, setup: L => { Object.assign(L.state, { cut: false, drag: true, area: true, angles: "AB", height: true }); },
        say: "עכשיו אפשר שוב לגרור את D. השטח מוצג למעלה.",
        task: "גרור את D כך שהשטח יישאר 24, אבל הזווית ב־A תהיה <b>קהה</b>.",
        demo: L => { Object.assign(L.state, { s: -2, h: 4 }); L.act({ type: "drop" }); },
        check: dropIf(S => S.h === 4 && S.s < 0, S => S.h !== 4 ? `השטח עכשיו ${m(`6 × ${S.h} = ${6 * S.h}`)}. כדי לקבל 24 הגובה חייב להיות 4.` : "השטח 24, אבל הזווית ב־A עדיין לא קהה. הזז את D שמאלה, מעבר ל־A."),
        ok: "הצורה השתנתה לגמרי, והשטח לא זז: 24. בגובה 4 ובסיס 6, השטח תמיד 24, גם כשהגובה נופל מחוץ לבסיס." },
      // ---- ch2: rhombus, kite, square ----
      { ch: 2, setup: L => { L.state = kite({ p: 4, q: 4, t: 3, u: 3, drag: false }); },
        say: "מרובע חדש, שנבנה מהאלכסונים שלו: שני אלכסונים מאונכים שחוצים זה את זה. התוצאה היא <b>מעוין</b>: ארבע צלעות שוות.",
        task: "לחץ על 'הראה מלבן חוסם'.",
        tools: () => [["הראה מלבן חוסם", L => { L.state.box = true; L.state.area = true; L.act({ type: "box" }); }, true]],
        demo: L => { L.state.box = true; L.state.area = true; L.act({ type: "box" }); },
        check: (L, e) => e.type === "box" ? true : null,
        ok: `המלבן שנבנה על האלכסונים הוא ${m("8 × 6 = 48")}. כל אחד מארבעת המשולשים הכתומים שווה למשולש הכחול שלידו, ולכן המעוין תופס בדיוק חצי: <b>שטח = ${m("d₁ × d₂ ÷ 2")}</b> = 24.` },
      { ch: 2, setup: L => { Object.assign(L.state, { box: false, drag: true }); },
        say: "עכשיו אפשר לגרור את ארבעת קצות האלכסונים. שם הצורה מוצג למעלה מימין.",
        task: "הארך רק את הקצה השמאלי, כך ש־d₁ יהיה 12.",
        demo: L => { Object.assign(L.state, { p: 8, q: 4, t: 3, u: 3 }); L.act({ type: "drop" }); },
        check: dropIf(S => S.p + S.q === 12 && S.t === 3 && S.u === 3 && S.q === 4, S => S.q !== 4 || S.t !== 3 || S.u !== 3 ? "הזזת קצה אחר. השאר את הימני על 4 ואת האנכי על 3 ו־3, ומשוך רק את השמאלי." : `${m(`d₁ = ${S.p + S.q}`)}. ${S.p + S.q < 12 ? "משוך את הקצה השמאלי עוד שמאלה." : "החזר את הקצה השמאלי קצת ימינה."}`),
        ok: `נוצר <b>דלתון</b>: שני משולשים שווי־שוקיים על בסיס משותף. האלכסונים עדיין מאונכים, ולכן אותה נוסחה עובדת: ${m("12 × 6 ÷ 2 = 36")}.` },
      { ch: 2, setup: L => { Object.assign(L.state, { p: 8, q: 8, t: 6, u: 6, drag: false, halves: true, area: false, hideSides: true }); },
        say: "צלע המעוין היא יתר של משולש ישר־זווית קטן, שהניצבים שלו הם <b>חצאי</b> האלכסונים.",
        task: "האלכסונים של מעוין הם 16 ו־12. מה אורך הצלע שלו?", choices: ["10", "14", "20", "28"],
        check: (L, e) => { if (e.type !== "choice") return null; if (e.j === 0) { L.state.hideSides = false; L.render(); return true; }
          return { 1: `${m("8 + 6 = 14")}: חיברת את החצאים. הם ניצבים, ולכן משתמשים בפיתגורס.`, 2: `20 יוצא מ־${m("16² + 12²")}: לקחת אלכסונים שלמים. הניצבים הם החצאים, 8 ו־6.`, 3: "28 הוא סכום האלכסונים. הצלע היא יתר במשולש הקטן שבמרכז." }[e.j]; },
        ok: `חצאי האלכסונים 8 ו־6, ולכן הצלע ${m("√(64 + 36) = 10")} (השלשה ${m("6 : 8 : 10")}).` },
      { ch: 2, setup: L => { Object.assign(L.state, { p: 4, q: 4, t: 3, u: 3, drag: true, halves: false, area: true, hideSides: false }); },
        say: "המקרה המיוחד ביותר.", task: "גרור את הקצוות כך שהמרובע יהיה <b>ריבוע</b>.",
        demo: L => { Object.assign(L.state, { p: 4, q: 4, t: 4, u: 4 }); L.act({ type: "drop" }); },
        check: dropIf(S => S.p === S.q && S.t === S.u && S.p === S.t, S => S.p === S.q && S.t === S.u ? "זה מעוין: כל הצלעות שוות, אבל האלכסונים שונים. בריבוע גם האלכסונים שווים." : "האלכסונים צריכים לחצות זה את זה (חצאים שווים) וגם להיות שווים באורכם."),
        ok: L => `ריבוע הוא מעוין שהאלכסונים שלו שווים. לכן שטח ריבוע = ${m("d² ÷ 2")}. כאן: ${m(`${2 * L.state.p}² ÷ 2 = ${2 * L.state.p * L.state.p}`)}.` },
      // ---- ch3: isosceles trapezoid ----
      { ch: 3, setup: L => { L.state = { mode: "trap", t: 6, h: 3, drag: false, hts: false, area: false, copy: false }; },
        say: "טרפז שווה־שוקיים: בסיס גדול 16 ובסיס קטן 6. הטריק של הקורס: מורידים שני גבהים.",
        task: "לחץ על 'הורד גבהים'.",
        tools: () => [["הורד גבהים", L => { L.state.hts = true; L.act({ type: "hts" }); }, true]],
        demo: L => { L.state.hts = true; L.act({ type: "hts" }); },
        check: (L, e) => e.type === "hts" ? true : null,
        ok: `באמצע נוצר מלבן ברוחב 6, ובצדדים שני משולשים ישרי־זווית זהים. כל 'בליטה' (בוורוד) היא ${m("(16 − 6) ÷ 2 = 5")}. <b>מחלקים את ההפרש ב־2</b>, כי הוא מתחלק בין שני הצדדים.` },
      { ch: 3, setup: L => { L.state.drag = true; },
        say: "עכשיו גרור את הפינה הימנית העליונה. היא משנה גם את הבסיס הקטן וגם את הגובה.",
        task: "בנה טרפז שהבסיס הקטן שלו 4 וכל שוק שלו 10.",
        demo: L => { Object.assign(L.state, { t: 4, h: 8 }); L.act({ type: "drop" }); },
        check: dropIf(S => S.t === 4 && S.h === 8, S => S.t !== 4 ? `הבסיס הקטן עכשיו ${S.t}. קודם קבע אותו על 4.` : `הבליטה היא 6, והשוק עכשיו ${m(sqrtStr(36 + S.h * S.h))}. ${S.h < 8 ? "הרם את הפינה." : "הורד את הפינה."} איזה ניצב משלים את 6 ליתר 10?`),
        ok: `הבליטה ${m("(16 − 4) ÷ 2 = 6")}, השוק 10, ולכן הגובה 8: שוב ${m("6 : 8 : 10")}.` },
      { ch: 3, setup: L => { L.state.drag = false; },
        say: "למה שטח טרפז הוא (סכום הבסיסים) × גובה ÷ 2?", task: "לחץ על 'הוסף עותק הפוך'.",
        tools: () => [["הוסף עותק הפוך", L => { L.state.copy = true; L.act({ type: "copy" }); }, true]],
        demo: L => { L.state.copy = true; L.act({ type: "copy" }); },
        check: (L, e) => e.type === "copy" ? true : null,
        ok: `טרפז ועותק הפוך שלו יוצרים יחד מקבילית שהבסיס שלה ${m("16 + 4 = 20")} והגובה 8. הטרפז הוא חצי ממנה.` },
      { ch: 3, task: "אז מה שטח הטרפז שעל הלוח (בסיסים 16 ו־4, גובה 8)?", choices: ["80", "96", "128", "160"],
        check: (L, e) => { if (e.type !== "choice") return null; if (e.j === 0) { Object.assign(L.state, { area: true }); L.render(); return true; }
          return { 1: `${m("(16 − 4) × 8")}: חיסרת את הבסיסים. צריך לחבר אותם.`, 2: `${m("16 × 8")}: לקחת רק את הבסיס הגדול. אבל הטרפז קטן מהמלבן הזה.`, 3: "160 היא כל המקבילית, הטרפז ועותק שלו. נשאר לחלק ב־2." }[e.j]; },
        ok: `${m("(16 + 4) × 8 ÷ 2 = 80")}.` },
      // ---- ch4: triangle inside rectangle ----
      { ch: 4, setup: L => { L.state = { mode: "rect", px: 3 }; },
        say: "מלבן 10 × 6, ומשולש שהבסיס שלו AB והקודקוד P שלו על הצלע שמול AB. את P אפשר לגרור.",
        task: "גרור את P עד הפינה C וצפה בשטח למעלה.",
        demo: L => { L.state.px = 10; L.act({ type: "drop" }); },
        check: dropIf(S => S.px === 10, S => "גרור את P עד הסוף ימינה, לפינה C."),
        ok: "בכל מקום של P, הבסיס 10 והגובה 6. לכן השטח תמיד 30, בדיוק <b>חצי מהמלבן</b>. ב־C המשולש הוא פשוט חצי המלבן שנחתך באלכסון." },
      { ch: 4, say: "אותו רעיון עובד גם במקבילית.", task: "שטח מקבילית ABCD הוא 50. P היא נקודה כלשהי על הצלע CD. מה שטח המשולש ABP?",
        choices: ["20", "25", "50", "אי אפשר לדעת, זה תלוי איפה P"],
        check: pick(1, { 0: "חזור ללוח: השטח לא תלוי במיקום של P. איזה חלק מהמרובע הוא תמיד?", 2: "המשולש והמקבילית חולקים בסיס וגובה, אבל למשולש מחלקים ב־2.", 3: "זו המלכודת. גרור את P על הלוח: השטח לא משתנה, כי הבסיס והגובה לא משתנים." }),
        ok: "הבסיס AB משותף, והגובה הוא המרחק בין הצלעות המקבילות. לכן המשולש הוא תמיד חצי: 25." },
      // ---- ch5: exam ----
      { ch: 5, setup: L => { L.state = kite({ p: 8, q: 8, t: 6, u: 6, drag: false, halves: false, name: null, labels: { d1: "?", d2: "12", side: "10" } }); },
        say: "שאלה ברמת מבחן.", task: "היקף של מעוין הוא 40, ואחד האלכסונים שלו 12. מה שטח המעוין?",
        choices: ["48", "96", "120", "192"],
        check: pick(1, { 0: "48 = 6 × 8: כפלת את החצאים. השטח הוא האלכסונים השלמים כפול זה בזה, חלקי 2.", 2: "120 = 12 × 10: כפלת אלכסון בצלע. צריך את האלכסון השני.", 3: "192 הוא המלבן החוסם, 16 × 12. נשאר לחלק ב־2." }),
        ok: `צלע = ${m("40 ÷ 4 = 10")}. במשולש הקטן: יתר 10 וניצב 6 (חצי מ־12), ולכן הניצב השני 8 והאלכסון השני 16. שטח = ${m("16 × 12 ÷ 2 = 96")}.` },
      { ch: 5, say: "<b>סיכום ההמחשה:</b><br>1. מקבילית: נגדיות שוות, סמוכות משלימות ל־180°. שטח = צלע × הגובה אליה, לא מכפלת צלעות.<br>2. אלכסונים מאונכים (מעוין, דלתון, ריבוע): שטח = d₁ × d₂ ÷ 2. לצלע עובדים עם חצאי אלכסונים.<br>3. טרפז שווה־שוקיים: מורידים שני גבהים, בליטה = הפרש הבסיסים ÷ 2. שטח = (a + b) × h ÷ 2.<br>4. משולש על צלע של מלבן או מקבילית, עם קודקוד על הצלע שמולה, הוא תמיד חצי מהשטח.", next: "סיום ההמחשה" },
    ],
  });
})();
