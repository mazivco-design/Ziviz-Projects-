/* Lab: משולשים — sticks (triangle inequality), grid triangle with draggable apex (isosceles, height, area),
   right triangle with draggable legs (Pythagoras), fixed-hypotenuse triangle (30-60-90, 45-45-90). */
(function () {
  const { G } = Lab, R = Math.PI / 180;
  const norm = a => ((a % 360) + 360) % 360;
  const ang = (P, Q) => norm(Math.atan2(-(Q[1] - P[1]), Q[0] - P[0]) / R);
  const at = (V, a, r) => [V[0] + r * Math.cos(a * R), V[1] - r * Math.sin(a * R)];
  const snap = (v, s) => Math.round(v / s) * s;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const m = s => '<bdi dir="ltr">' + s + '</bdi>';
  const r1 = v => Math.round(v * 10) / 10;
  function interior(V, P, Q) { let a1 = ang(V, P), d = norm(ang(V, Q) - a1); if (d > 180) { a1 = ang(V, Q); d = 360 - d; } return [a1, d]; }
  function wedge(V, a1, d, r, cls) { const s = at(V, a1, r), e = at(V, a1 + d, r); return G.path(`M${V[0]},${V[1]} L${s[0]},${s[1]} A${r},${r} 0 0 0 ${e[0]},${e[1]} Z`, cls); }
  function angLbl(V, a1, d, r, text, cls) { const mid = a1 + d / 2, rr = r + 16 + Math.max(0, 40 - d) * 0.6, p = at(V, mid, rr), w = String(text).length * 8; return G.t(p[0] + Math.cos(mid * R) * w * .4, p[1] + 6, text, cls); }
  function rmark(V, a1, s = 13) { const u = at(V, a1, s), w = at(V, a1 + 90, s), c = at(u, a1 + 90, s); return G.path(`M${u[0]},${u[1]} L${c[0]},${c[1]} L${w[0]},${w[1]}`, "thin"); }
  // side label: at midpoint of PQ, pushed away from point Inside
  function sideLbl(P, Q, In, text, cls, off = 8) {
    const mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2; let nx = -(Q[1] - P[1]), ny = Q[0] - P[0]; const n = Math.hypot(nx, ny) || 1; nx /= n; ny /= n;
    if ((In[0] - mx) * nx + (In[1] - my) * ny > 0) { nx = -nx; ny = -ny; }
    const w = String(text).length * 9.5, d = off + Math.abs(nx) * w / 2 + Math.abs(ny) * 9; return G.t(mx + nx * d, my + ny * d + 6, text, cls);
  }
  const sqrtStr = n => { const s = Math.round(Math.sqrt(n)); return s * s === n ? String(s) : "√" + n + " ≈ " + r1(Math.sqrt(n)); };

  // ---------- model 1: sticks (triangle inequality) ----------
  const SA = [220, 235], SU = 34, SLX = v => 60 + (v - 1) * 40, SLY = 330;
  function drawSticks(S) {
    let h = ""; const { a, b, c } = S, B = [SA[0] + c * SU, SA[1]];
    if (a + b > c && a + c > b && b + c > a) {
      const x = (a * a - b * b + c * c) / (2 * c), y = Math.sqrt(a * a - x * x), C = [SA[0] + x * SU, SA[1] - y * SU];
      h += G.poly([SA, B, C], "fok-soft");
      h += G.line(SA[0], SA[1], C[0], C[1], "sa") + G.line(B[0], B[1], C[0], C[1], "sblue") + G.line(SA[0], SA[1], B[0], B[1], "ink", { "stroke-width": 4 });
      h += sideLbl(SA, C, B, "a = " + a, "a") + sideLbl(B, C, SA, "b = " + b, "blue");
      h += G.circle(C[0], C[1], 4, "dot");
      h += G.he(600, 40, "נסגר משולש", "ok", "right");
    } else {
      h += G.line(SA[0], SA[1], B[0], B[1], "ink", { "stroke-width": 4 });
      let aEnd, bEnd;
      if (a + b <= c) { aEnd = SA[0] + a * SU; bEnd = B[0] - b * SU; }
      else if (b >= a + c) { aEnd = SA[0] - a * SU; bEnd = B[0] - b * SU; }
      else { aEnd = SA[0] + a * SU; bEnd = B[0] + b * SU; }
      const ya = SA[1] - 9, yb = SA[1] + 9;
      h += G.line(SA[0], ya, aEnd, ya, "sa") + G.line(B[0], yb, bEnd, yb, "sblue");
      h += G.t((SA[0] + aEnd) / 2, ya - 12, "a = " + a, "a") + G.t((B[0] + bEnd) / 2, yb + 26, "b = " + b, "blue");
      const gap = a + b <= c ? c - a - b : b >= a + c ? b - a - c : a - b - c;
      if (gap > 0) {
        const g1 = a + b <= c ? aEnd : b >= a + c ? bEnd : bEnd, g2 = a + b <= c ? bEnd : b >= a + c ? aEnd : aEnd;
        h += G.rect(Math.min(g1, g2), SA[1] - 16, Math.abs(g2 - g1), 32, "fwarn");
        h += G.he(600, 40, "המקלות לא נפגשים: חסר " + gap, "w", "right");
      } else h += G.he(600, 40, "המקלות שוכבים על קו אחד: אין משולש", "w", "right");
    }
    h += G.t((SA[0] + B[0]) / 2, SA[1] + (a + b > c && a + c > b && b + c > a ? 26 : 52), "c = " + c, "b");
    // slider for b
    h += G.line(SLX(1), SLY, SLX(14), SLY, "mut");
    for (let v = 1; v <= 14; v++) h += G.line(SLX(v), SLY - 5, SLX(v), SLY + 5, "mut") + G.t(SLX(v), SLY + 26, v, v === b ? "blue" : "m");
    h += G.he(SLX(14) + 10, SLY - 16, "אורך b", "m", "right");
    h += G.knob(SLX(b), SLY, "sl", 15);
    return h;
  }

  // ---------- model 2: grid triangle with draggable apex ----------
  const GO = [170, 320], GU = 30, gp = (x, y) => [GO[0] + x * GU, GO[1] - y * GU];
  function drawGrid(S) {
    let h = ""; const A = gp(0, 0), B = gp(S.base, 0), C = gp(S.cx, S.cy);
    for (let x = -3; x <= 12; x++) for (let y = 0; y <= 9; y++) { const p = gp(x, y); h += G.circle(p[0], p[1], 1.6, "dot", { opacity: .3 }); }
    h += G.poly([A, B, C], "fblue-soft");
    if (S.angles) {
      for (const [V, P, Q, cls] of [[A, B, C, "fsoft"], [B, C, A, "fsoft"], [C, A, B, "fok-soft"]]) { if (S.angles === "base" && V === C) continue; const [a1, d] = interior(V, P, Q); h += wedge(V, a1, d, 26, cls); }
    }
    if (S.height) {
      const F = gp(S.cx, 0);
      if (S.cx < 0) h += G.line(F[0], F[1], A[0], A[1], "dash"); if (S.cx > S.base) h += G.line(B[0], B[1], F[0], F[1], "dash");
      h += G.line(C[0], C[1], F[0], F[1], "sok") + rmark(F, S.cx > S.base ? 180 : 0, 11);
      const hl = at(F, 90, S.cy * GU / 2); h += G.t(hl[0] + (S.cx > S.base / 2 ? -10 : 10), hl[1] + 6, "h = " + S.cy, "ok", S.cx > S.base / 2 ? "end" : "start");
    }
    h += G.poly([A, B, C], "ink");
    const ac = S.cx * S.cx + S.cy * S.cy, bc = (S.cx - S.base) ** 2 + S.cy * S.cy;
    if (!S.hideSides) {
      h += sideLbl(A, C, B, sqrtStr(ac), "b") + sideLbl(B, C, A, sqrtStr(bc), "b");
      if (ac === bc) for (const [P, Q] of [[A, C], [B, C]]) { const mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2, a = ang(P, Q) + 90, u = at([mx, my], a, 7), w = at([mx, my], a + 180, 7); h += G.line(u[0], u[1], w[0], w[1], "ink"); }
    }
    h += G.t((A[0] + B[0]) / 2, A[1] + 26, String(S.base), "b");
    if (S.angles) {
      for (const [V, P, Q, cls] of [[A, B, C, "a"], [B, C, A, "a"], [C, A, B, "ok"]]) { if (S.angles === "base" && V === C) continue; const [a1, d] = interior(V, P, Q); h += angLbl(V, a1, d, 26, (Math.abs(d - Math.round(d)) > .05 ? "≈" : "") + Math.round(d) + "°", cls); }
    }
    h += G.t(A[0] - 14, A[1] + 22, "A", "b") + G.t(B[0] + 14, B[1] + 22, "B", "b");
    if (S.drag) h += G.knob(C[0], C[1], "C", 15);
    h += G.t(C[0], C[1] - 22, "C", "b");
    if (S.area) h += G.t(20, 34, "S = " + S.base + " × " + S.cy + " ÷ 2 = " + G.fmt(S.base * S.cy / 2), "ok", "start");
    return h;
  }

  // ---------- model 3: right triangle with draggable legs ----------
  const RO = [120, 335], RU = 22;
  function drawRight(S) {
    let h = ""; const T = [RO[0], RO[1] - S.a * RU], E = [RO[0] + S.b * RU, RO[1]], c2 = S.a * S.a + S.b * S.b, c = Math.sqrt(c2), whole = Number.isInteger(c);
    for (let x = 0; x <= 18; x++) for (let y = 0; y <= 12; y++) h += G.circle(RO[0] + x * RU, RO[1] - y * RU, 1.4, "dot", { opacity: .25 });
    h += G.poly([RO, E, T], whole ? "fok-soft" : "fblue-soft") + G.poly([RO, E, T], "ink") + rmark(RO, 0, 12);
    h += G.line(RO[0], RO[1], T[0], T[1], "sa") + G.line(RO[0], RO[1], E[0], E[1], "sblue");
    h += G.t(RO[0] - 12, (RO[1] + T[1]) / 2 + 6, String(S.a), "a", "end") + G.t((RO[0] + E[0]) / 2, RO[1] + 26 > 372 ? 372 : RO[1] + 26, String(S.b), "blue");
    h += sideLbl(T, E, RO, whole ? String(c) : "?", whole ? "ok" : "b");
    h += G.knob(T[0], T[1], "ra", 15) + G.knob(E[0], E[1], "rb", 15);
    h += G.t(600, 40, S.a + "² + " + S.b + "² = " + S.a * S.a + " + " + S.b * S.b + " = " + c2, "b", "end");
    h += G.t(600, 68, "c = √" + c2 + (whole ? " = " + c : " ≈ " + r1(c)), whole ? "ok" : "m", "end");
    return h;
  }

  // ---------- model 4: fixed hypotenuse 10, draggable angle ----------
  const QA = [90, 320], QU = 26;
  const EX = { 30: "5", 45: "5√2", 60: "5√3" };
  const legStr = deg => EX[deg] || "≈ " + r1(10 * Math.sin(deg * R));
  function drawSpecial(S) {
    let h = ""; const t = S.th, Rv = [QA[0] + 10 * QU * Math.cos(t * R), QA[1]], B = [Rv[0], QA[1] - 10 * QU * Math.sin(t * R)];
    h += G.poly([QA, Rv, B], "fblue-soft") + wedge(QA, 0, t, 34, "fsoft") + wedge(B, 180 + t, 90 - t, 28, "fok-soft");
    h += G.poly([QA, Rv, B], "ink") + rmark(Rv, 90, 12);
    h += angLbl(QA, 0, t, 34, t + "°", "a") + angLbl(B, 180 + t, 90 - t, 28, (90 - t) + "°", "ok");
    h += sideLbl(QA, B, Rv, "10", "b") + G.t((QA[0] + Rv[0]) / 2, QA[1] + 26, legStr(90 - t), "blue") + G.t(Rv[0] + 12, (Rv[1] + B[1]) / 2 + 6, legStr(t), "blue", "start");
    h += G.knob(B[0], B[1], "sp", 15);
    const kind = t === 45 ? ["משולש כסף", "a : a : a√2"] : (t === 30 || t === 60) ? ["משולש זהב", "a : a√3 : 2a"] : null;
    if (kind) { h += G.he(600, 40, kind[0], "a", "right") + G.t(600, 68, kind[1], "b", "end"); }
    return h;
  }

  function draw(L) { const S = L.state; return S.mode === "sticks" ? drawSticks(S) : S.mode === "grid" ? drawGrid(S) : S.mode === "right" ? drawRight(S) : drawSpecial(S); }
  function drag(L, key, pt) {
    const S = L.state;
    if (key === "sl") S.b = clamp(Math.round((pt.x - 60) / 40) + 1, 1, 14);
    else if (key === "C") { S.cx = clamp(Math.round((pt.x - GO[0]) / GU), -3, 12); S.cy = clamp(Math.round((GO[1] - pt.y) / GU), 1, 9); }
    else if (key === "ra") S.a = clamp(Math.round((RO[1] - pt.y) / RU), 1, 12);
    else if (key === "rb") S.b = clamp(Math.round((pt.x - RO[0]) / RU), 1, 18);
    else if (key === "sp") S.th = clamp(snap(ang(QA, [pt.x, pt.y]), 5), 15, 75);
  }
  function dragFrom(L, pt) { const S = L.state; if (S.mode === "sticks" && Math.abs(pt.y - SLY) < 30) return "sl"; return null; }
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const dropIf = (ok, hint) => (L, e) => e.type !== "drop" ? null : ok(L.state) ? true : hint(L.state);
  const grid = o => Object.assign({ mode: "grid", base: 8, cx: 2, cy: 4, drag: true, angles: false, height: false, area: false }, o);

  Lab.register({
    id: "geo-triangles", title: "המחשה: משולשים", viewBox: "0 0 620 380",
    chapters: ["אי־שוויון המשולש", "שווה־שוקיים ושטח", "פיתגורס", "זהב וכסף", "שאלת מבחן"],
    draw, drag, dragFrom,
    steps: [
      // ---- ch0: triangle inequality ----
      { ch: 0, setup: L => { L.state = { mode: "sticks", a: 3, b: 3, c: 8 }; },
        say: "בסיס באורך 8, ומקל באורך 3 קשור לקצה השמאלי שלו. את אורך המקל השני, b, קובעים במחוון שלמטה. מנסים לסגור משולש.",
        task: "מצא את האורך השלם <b>הקטן ביותר</b> של b שעוד סוגר משולש.",
        demo: L => { L.state.b = 6; L.act({ type: "drop" }); },
        check: dropIf(S => S.b === 6, S => S.b === 5 ? `${m("3 + 5 = 8")}: המקלות נפגשים בדיוק על הבסיס. זה קו שטוח, לא משולש. צריך עוד קצת.` : S.b < 5 ? `${m("3 + " + S.b + " = " + (3 + S.b))}, קצר מ־8. המקלות לא מגיעים זה לזה.` : `נסגר משולש, אבל אפשר לקצר את b עוד.`),
        ok: `b = 6. כאן ${m("3 + 6 = 9")}, יותר מ־8. ב־5 בדיוק המשולש 'נשטח' לקו. כלומר: <b>סכום שתי צלעות חייב להיות גדול מהשלישית</b>.` },
      { ch: 0, say: "עכשיו לכיוון השני.", task: "מצא את האורך השלם <b>הגדול ביותר</b> של b שעוד סוגר משולש.",
        demo: L => { L.state.b = 10; L.act({ type: "drop" }); },
        check: dropIf(S => S.b === 10, S => S.b === 11 ? `${m("3 + 8 = 11")}: גם אם פותחים את המקל a עד הסוף, הוא מגיע בדיוק לקצה של b. שוב קו שטוח.` : S.b > 11 ? `b ארוך מדי: גם 3 וגם 8 יחד (${m("3 + 8 = 11")}) לא מגיעים לקצה שלו.` : "נסגר משולש, אבל אפשר להאריך את b עוד."),
        ok: `b = 10. כלומר ${m("5 < b < 11")}: <b>הצלע השלישית גדולה מההפרש וקטנה מהסכום</b> של שתי האחרות. הקצוות עצמם (5 ו־11) אסורים.` },
      { ch: 0, say: "בדיקה מהירה.", task: "האם יש משולש שצלעותיו 4, 4 ו־8?",
        choices: ["כן, משולש שווה־שוקיים", "לא, כי 4 + 4 = 8 והוא נשטח לקו", "רק אם יש בו זווית ישרה"],
        check: (L, e) => { if (e.type !== "choice") return null; if (e.j === 1) { Object.assign(L.state, { a: 4, b: 4 }); L.render(); return true; }
          return e.j === 0 ? `שתי שוקיים שוות זה בסדר, אבל ${m("4 + 4")} לא גדול מ־8. נסה לדמיין את המקלות.` : `במשולש ישר־זווית היתר קטן מסכום הניצבים. כאן ${m("4 + 4 = 8")} בדיוק.`; },
        ok: "על הלוח: שני מקלות של 4 שוכבים על בסיס של 8 ונפגשים בדיוק באמצע. אין משולש. זו מלכודת נפוצה: צריך גדול <b>ממש</b>, לא שווה." },
      // ---- ch1: isosceles, height, area ----
      { ch: 1, setup: L => { L.state = grid({ cx: 2, cy: 4, angles: "base" }); },
        say: "משולש על רשת. הבסיס AB באורך 8, ואת הקודקוד C אפשר לגרור. ליד הצלעות מוצגים האורכים שלהן.",
        task: "גרור את C כך שהמשולש יהיה <b>שווה־שוקיים</b>: AC = BC.",
        demo: L => { Object.assign(L.state, { cx: 4, cy: 4 }); L.act({ type: "drop" }); },
        check: dropIf(S => S.cx === 4, S => S.cx < 4 ? "AC קצרה מ־BC: הקודקוד קרוב מדי ל־A. הזז אותו ימינה." : "BC קצרה מ־AC: הקודקוד קרוב מדי ל־B. הזז אותו שמאלה."),
        ok: L => `C נמצא בדיוק מעל אמצע הבסיס, והשוקיים שוות. שים לב גם לזוויות: <b>זוויות הבסיס שוות</b> (כל אחת ${Math.round(Math.atan2(L.state.cy, 4) / R)}°). במשולש, צלעות שוות עומדות מול זוויות שוות.` },
      { ch: 1, setup: L => { Object.assign(L.state, { angles: false }); },
        say: "עכשיו נוריד גובה מ־C אל הבסיס.", task: "לחץ על 'הורד גובה'.",
        tools: () => [["הורד גובה", L => { L.state.height = true; L.act({ type: "h" }); }, true]],
        demo: L => { L.state.height = true; L.act({ type: "h" }); },
        check: (L, e) => e.type === "h" ? true : null,
        ok: "במשולש שווה־שוקיים הגובה נוחת בדיוק באמצע הבסיס: הוא גם <b>תיכון</b> וגם <b>חוצה זווית</b>. הוא חותך את המשולש לשני משולשים ישרי־זווית זהים." },
      { ch: 1, say: "ככה מחשבים גובה בעזרת חצי בסיס.", task: "במשולש שווה־שוקיים כל שוק 5 והבסיס 8. מה הגובה לבסיס?",
        choices: ["3", "4", "5", "√39"],
        check: (L, e) => { if (e.type !== "choice") return null; if (e.j === 0) { Object.assign(L.state, { cx: 4, cy: 3 }); L.render(); return true; }
          return { 1: "4 הוא חצי הבסיס. הגובה הוא הניצב השני במשולש הישר־זווית.", 2: "5 היא השוק, היתר של המשולש הישר־זווית. הגובה קצר ממנה.", 3: `${m("√39 = √(64 − 25)")}: לקחת את כל הבסיס. הגובה חוצה אותו, אז הניצב הוא 4.` }[e.j]; },
        ok: `בכל חצי יש משולש עם יתר 5 וניצב 4, ולכן הגובה 3 (השלשה ${m("3 : 4 : 5")}). הקודקוד על הלוח זז בהתאם.` },
      { ch: 1, setup: L => { Object.assign(L.state, { area: true, cx: 4, cy: 3 }); },
        say: `שטח משולש = צלע × הגובה אליה ÷ 2. הנוסחה מוצגת למעלה ומתעדכנת כשגוררים.`,
        task: "גרור את C כך ששטח המשולש יהיה 20.",
        demo: L => { Object.assign(L.state, { cx: 6, cy: 5 }); L.act({ type: "drop" }); },
        check: dropIf(S => S.cy === 5, S => `השטח עכשיו ${m(`8 × ${S.cy} ÷ 2 = ${S.base * S.cy / 2}`)}. ${S.cy < 5 ? "צריך גובה גדול יותר: הרם את C." : "הגובה גדול מדי: הורד את C."} רק הגובה משנה.`),
        ok: L => `${m("8 × 5 ÷ 2 = 20")}. שים לב: לא היה משנה לאן הזזת את C הצידה. בגובה 5 השטח תמיד 20.${L.state.cx < 0 || L.state.cx > 8 ? " גם כשהגובה נופל מחוץ לבסיס (בקו המקווקו)." : ""}` },
      { ch: 1, setup: L => { Object.assign(L.state, { cx: 10, cy: 3, area: false, height: false, angles: false, drag: false }); },
        say: "עוד כלל: הצלע הגדולה במשולש נמצאת מול הזווית הגדולה.",
        task: "בלי למדוד: באיזה קודקוד נמצאת הזווית הגדולה ביותר?", choices: ["A", "B", "C"],
        check: (L, e) => { if (e.type !== "choice") return null; if (e.j === 1) { L.state.angles = true; L.render(); return true; }
          return e.j === 0 ? "מול A נמצאת הצלע BC, שהיא הקצרה ביותר. לכן הזווית שב־A היא דווקא הקטנה." : "מול C נמצא הבסיס, 8. אבל יש צלע ארוכה ממנו. איזו, ומה מולה?"; },
        ok: `הצלע הארוכה היא AC (${m("√109 ≈ 10.4")}), ומולה הזווית שב־B, שהיא קהה. הזוויות מוצגות עכשיו על הלוח.` },
      // ---- ch2: Pythagoras ----
      { ch: 2, setup: L => { L.state = { mode: "right", a: 2, b: 5 }; },
        say: `משולש ישר־זווית. את שני הניצבים אפשר לגרור. היתר c מחושב בפיתגורס: ${m("a² + b² = c²")}.`,
        task: "גרור את הניצבים עד שהיתר יצא <b>מספר שלם</b>.",
        demo: L => { Object.assign(L.state, { a: 3, b: 4 }); L.act({ type: "drop" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const S = L.state, c = Math.sqrt(S.a * S.a + S.b * S.b); if (Number.isInteger(c)) { L.memo.tr = [S.a, S.b, c]; return true; }
          return `${m(`c = √${S.a * S.a + S.b * S.b}`)}, לא שלם. ${m(S.a * S.a + S.b * S.b + "")} צריך להיות ריבוע של מספר שלם. נסה ניצבים 3 ו־4.`; },
        ok: L => { const [a, b, c] = L.memo.tr; return `${m(`${a}² + ${b}² = ${c}²`)}. שלושה מספרים שלמים כאלה נקראים <b>שלשה פיתגורית</b>. במבחן אין מחשבון, ולכן כדאי להכיר בעל־פה את ${m("3 : 4 : 5")} ואת ${m("5 : 12 : 13")}, וגם את הכפולות שלהן.`; } },
      { ch: 2, say: "שלשה ככפולה.", task: "גרור את הניצבים ל־6 ול־8. מה יצא היתר?",
        demo: L => { Object.assign(L.state, { a: 6, b: 8 }); L.act({ type: "drop" }); },
        check: dropIf(S => (S.a === 6 && S.b === 8) || (S.a === 8 && S.b === 6), S => `עכשיו הניצבים ${S.a} ו־${S.b}. קבע אחד מהם 6 (שש משבצות) ואת השני 8.`),
        ok: `היתר 10. זו בדיוק פי 2 של ${m("3 : 4 : 5")}. כשמכפילים את כל הצלעות באותו מספר, זו עדיין שלשה. למשל גם ${m("9 : 12 : 15")}.` },
      { ch: 2, say: "עכשיו המלכודת הכי נפוצה.", task: "במשולש ישר־זווית ניצב אחד 8 והיתר 10. מה הניצב השני?",
        choices: ["2", "6", "√164", "12.8"],
        check: pick(1, { 0: "10 − 8 = 2? בפיתגורס מחסרים ריבועים, לא צלעות.", 2: `${m("√164 = √(64 + 100)")}: חיברת. אבל 10 הוא היתר, הצלע הגדולה ביותר, ולכן מחסרים: ${m("100 − 64")}.`, 3: "הניצב חייב להיות קצר מהיתר 10." }),
        ok: `${m("10² − 8² = 100 − 64 = 36")}, ולכן הניצב 6. זו שוב השלשה ${m("6 : 8 : 10")}. <b>היתר הוא תמיד הגדול בשלשה</b>.` },
      // ---- ch3: special triangles ----
      { ch: 3, setup: L => { L.state = { mode: "special", th: 20 }; },
        say: "משולש ישר־זווית שהיתר שלו קבוע: 10. גרור את הקודקוד העליון, והזווית שב־A משתנה.",
        task: "גרור עד שהזווית ב־A תהיה 45°.",
        demo: L => { L.state.th = 45; L.act({ type: "drop" }); },
        check: dropIf(S => S.th === 45, S => `הזווית ב־A עכשיו ${S.th}°. ${S.th < 45 ? "הרם את הקודקוד העליון." : "הורד את הקודקוד העליון."}`),
        ok: `45°-45°-90°: שני הניצבים שווים, ${m("5√2 ≈ 7.07")}. זה <b>'משולש כסף'</b>: ${m("a : a : a√2")}. היתר הוא ניצב כפול √2.` },
      { ch: 3, say: "המשולש המיוחד השני.", task: "גרור עד שהזווית ב־A תהיה 30°.",
        demo: L => { L.state.th = 30; L.act({ type: "drop" }); },
        check: dropIf(S => S.th === 30, S => S.th === 60 ? "זה אמנם משולש 30-60-90, אבל ה־30° נמצאת עכשיו למעלה. צריך 30° בדיוק ב־A." : `הזווית ב־A עכשיו ${S.th}°. ${S.th < 30 ? "הרם את הקודקוד העליון." : "הורד את הקודקוד העליון."}`),
        ok: `30°-60°-90°: הניצב שמול 30° הוא בדיוק 5, <b>חצי מהיתר</b>. הניצב השני ${m("5√3")}. זה <b>'משולש זהב'</b>: ${m("a : a√3 : 2a")}.` },
      { ch: 3, say: "שאלה על משולש זהב.", task: "במשולש ישר־זווית יש זווית של 60°, והניצב הקצר באורך 4. מה אורך היתר?",
        choices: ["4√3", "8", "4√2", "2√3"],
        check: pick(1, { 0: `${m("4√3")} הוא הניצב הארוך, זה שמול 60°. היתר הוא 2a.`, 2: `${m("a√2")} שייך למשולש כסף (45°). כאן יש 60°, כלומר משולש זהב.`, 3: "היתר הוא הצלע הארוכה, הוא לא יכול להיות קצר מ־4." }),
        ok: `הניצב הקצר נמצא מול 30°, ולכן a = 4. היתר ${m("2a = 8")}, והניצב הארוך ${m("4√3")}.` },
      // ---- ch4: exam ----
      { ch: 4, setup: L => { L.state = { mode: "right", a: 5, b: 12 }; },
        say: "שאלה ברמת מבחן. הלוח של פיתגורס פתוח לשימוש חופשי.", task: "היתר של משולש ישר־זווית הוא 26, ואחד הניצבים 10. מה שטח המשולש?",
        choices: ["120", "130", "240", "260"],
        check: pick(0, { 1: `${m("26 × 10 ÷ 2")}: היתר אינו גובה לניצב. בשטח של ישר־זווית כופלים את שני <b>הניצבים</b>.`, 2: "240 היא מכפלת הניצבים. נשאר לחלק ב־2.", 3: "260 = 26 × 10. צריך את הניצב השני, ואז לחלק ב־2." }),
        ok: `${m("10 : 24 : 26")} הוא פי 2 של ${m("5 : 12 : 13")}, ולכן הניצב השני 24. שטח = ${m("10 × 24 ÷ 2 = 120")}.` },
      { ch: 4, say: "<b>סיכום ההמחשה:</b><br>1. כל צלע קטנה מסכום שתי האחרות וגדולה מההפרש שלהן. שוויון = קו שטוח.<br>2. בשווה־שוקיים הגובה לבסיס חוצה אותו. שטח = צלע × גובה ÷ 2, והגובה הוא מה שקובע.<br>3. פיתגורס: מכירים בעל־פה 3:4:5 ו־5:12:13 וכפולות. היתר הוא תמיד הגדול.<br>4. זהב (30-60-90): a : a√3 : 2a. כסף (45-45-90): a : a : a√2.", next: "סיום ההמחשה" },
    ],
  });
})();
