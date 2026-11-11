/* Lab: מערכת צירים — draggable points on a grid with live Δx, Δy, length, midpoint, slope and area. */
(function () {
  const { G } = Lab;
  const U = 26, X0 = -6, X1 = 7, Y0 = -4, Y1 = 6, OX = 24 - X0 * U, OY = 26 + Y1 * U;
  const PX = x => OX + x * U, PY = y => OY - y * U;
  const N = n => n < 0 ? "−" + G.fmt(-n) : G.fmt(n);
  const P = p => "(" + N(p.x) + ", " + N(p.y) + ")";
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const len2 = (a, b) => (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  const lenStr = (a, b) => { const s = len2(a, b), r = Math.sqrt(s); return Number.isInteger(r) ? G.fmt(r) : "√" + s + " ≈ " + G.fmt(Math.round(r * 100) / 100); };
  const slope = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y; if (!dx) return null; const g = gcd(dx, dy) || 1; let p = dy / g, q = dx / g; if (q < 0) { p = -p; q = -q; } return q === 1 ? N(p) : N(p) + "/" + q; };
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  const fresh = o => Object.assign({ pts: {}, drag: [], show: {} }, o);

  function grid() {
    let h = "";
    for (let x = X0; x <= X1; x++) h += G.line(PX(x), PY(Y1), PX(x), PY(Y0), "mut", { opacity: x ? .28 : 0 });
    for (let y = Y0; y <= Y1; y++) h += G.line(PX(X0), PY(y), PX(X1), PY(y), "mut", { opacity: y ? .28 : 0 });
    h += G.arrow(PX(X0), OY, PX(X1) + 10, OY, "ink") + G.arrow(OX, PY(Y0), OX, PY(Y1) - 10, "ink");
    h += G.t(PX(X1) + 6, OY + 20, "x", "m b") + G.t(OX - 14, PY(Y1) - 2, "y", "m b");
    for (let x = X0; x <= X1 - 1; x++) if (x && x % 2 === 0) h += G.t(PX(x), OY + 17, N(x), "m");
    for (let y = Y0; y <= Y1 - 1; y++) if (y && y % 2 === 0) h += G.t(OX - 6, PY(y) + 5, N(y), "m", "end");
    h += G.t(OX - 8, OY + 17, "0", "m", "end");
    return h;
  }
  function clipLine(a, b) {         // the full line through a,b clipped to the grid box
    const dx = b.x - a.x, dy = b.y - a.y; let t0 = -1e9, t1 = 1e9;
    const lim = (p, d, lo, hi) => { if (!d) return; let u0 = (lo - p) / d, u1 = (hi - p) / d; if (u0 > u1) [u0, u1] = [u1, u0]; t0 = Math.max(t0, u0); t1 = Math.min(t1, u1); };
    lim(a.x, dx, X0, X1); lim(a.y, dy, Y0, Y1);
    if (!dx) { t0 = (Y0 - a.y) / dy; t1 = (Y1 - a.y) / dy; if (t0 > t1) [t0, t1] = [t1, t0]; }
    return [{ x: a.x + dx * t0, y: a.y + dy * t0 }, { x: a.x + dx * t1, y: a.y + dy * t1 }];
  }

  function draw(L) {
    const S = L.state, p = S.pts, sh = S.show, A = p.A, B = p.B, C = p.C; let h = grid(), rows = [];
    if (sh.circle && A && B) {
      h += `<clipPath id="gc-clip"><rect x="${PX(X0)}" y="${PY(Y1)}" width="${(X1 - X0) * U}" height="${(Y1 - Y0) * U}"/></clipPath>`;
      h += G.circle(PX(A.x), PY(A.y), Math.sqrt(len2(A, B)) * U, "dash", { "clip-path": "url(#gc-clip)" });
    }
    if (sh.line && A && B && (A.x !== B.x || A.y !== B.y)) { const [u, v] = clipLine(A, B); h += G.line(PX(u.x), PY(u.y), PX(v.x), PY(v.y), "mut"); }
    if (sh.stairs && A && B && A.x !== B.x) {
      const dx = B.x - A.x, dy = B.y - A.y, g = gcd(dx, dy) || 1, sx = dx / g, sy = dy / g; let d = `M${PX(A.x)},${PY(A.y)}`;
      for (let k = 1; k <= g; k++) d += ` H${PX(A.x + sx * k)} V${PY(A.y + sy * k)}`;
      h += G.path(d, "sok");
      if (sy) h += G.t(PX(A.x + sx / 2), PY(A.y) + (sy > 0 ? 18 : -8), String(Math.abs(sx)), "ok") + G.t(PX(A.x + sx) + (sx > 0 ? 8 : -8), PY(A.y + sy / 2) + 5, String(Math.abs(sy)), "ok", sx > 0 ? "start" : "end");
    }
    if (sh.tri && A && B && A.x !== B.x && A.y !== B.y) {
      const Q = { x: B.x, y: A.y };
      h += G.poly([[PX(A.x), PY(A.y)], [PX(Q.x), PY(Q.y)], [PX(B.x), PY(B.y)]], "fblue-soft");
      const ux = Math.sign(A.x - Q.x), vy = -Math.sign(B.y - Q.y);
      h += G.rightMark(PX(Q.x), PY(Q.y), ux, 0, 0, vy, 10);
      h += G.t((PX(A.x) + PX(Q.x)) / 2, PY(Q.y) + (B.y > A.y ? 20 : -9), String(Math.abs(B.x - A.x)), "blue");
      h += G.t(PX(Q.x) - ux * 9, (PY(Q.y) + PY(B.y)) / 2 + 5, String(Math.abs(B.y - A.y)), "blue", ux > 0 ? "end" : "start");
    }
    if (sh.count && A && B && A.y === B.y && A.x !== B.x) {
      const lo = Math.min(A.x, B.x), n = Math.abs(B.x - A.x);
      for (let k = 0; k < n; k++) { h += G.line(PX(lo + k + 1), PY(A.y) - 5, PX(lo + k + 1), PY(A.y) + 5, "ink"); h += G.t(PX(lo + k + .5), PY(A.y) - 19, String(k + 1), "a"); }
    }
    if (C && A && B) {
      h += G.poly([[PX(A.x), PY(A.y)], [PX(B.x), PY(B.y)], [PX(C.x), PY(C.y)]], "fsoft");
      const lo = Math.min(A.x, B.x), hi = Math.max(A.x, B.x);
      if (C.x < lo) h += G.line(PX(C.x), PY(A.y), PX(lo), PY(A.y), "dash");
      if (C.x > hi) h += G.line(PX(hi), PY(A.y), PX(C.x), PY(A.y), "dash");
      if (C.y !== A.y) { h += G.line(PX(C.x), PY(C.y), PX(C.x), PY(A.y), "sblue", { "stroke-dasharray": "6 4" }); h += G.rightMark(PX(C.x), PY(A.y), C.x > lo ? -1 : 1, 0, 0, C.y > A.y ? -1 : 1, 9); }
    }
    if (A && B && !sh.noSeg) h += G.line(PX(A.x), PY(A.y), PX(B.x), PY(B.y), C ? "ink" : "sa");
    if (sh.mid && A && B) { const M = mid(A, B); h += G.circle(PX(M.x), PY(M.y), 6, "fok") + G.t(PX(M.x) + 10, PY(M.y) + 20, "M", "ok", "start"); }
    for (const k of ["A", "B", "C"]) {
      const q = p[k]; if (!q) continue;
      if (S.drag.includes(k)) h += G.knob(PX(q.x), PY(q.y), k, 15);
      h += G.circle(PX(q.x), PY(q.y), 5, "dot", { "pointer-events": "none" });
      const oth = Object.entries(p).filter(([kk]) => kk !== k).map(([, o]) => o);
      let vx = 1, vy = 1;                                   // label direction: away from the other points (grid units, y up)
      if (oth.length) { vx = q.x - oth.reduce((s, o) => s + o.x, 0) / oth.length; vy = q.y - oth.reduce((s, o) => s + o.y, 0) / oth.length; }
      const m = Math.hypot(vx, vy) || 1; vx /= m; vy /= m;
      let lx = PX(q.x) + vx * 22, ly = PY(q.y) - vy * 22 + 6;
      lx = Math.max(PX(X0) + 8, Math.min(PX(X1) - 8, lx)); ly = Math.max(PY(Y1) + 14, Math.min(PY(Y0) - 4, ly));
      h += G.t(lx, ly, k, "b", "middle", { "pointer-events": "none" });
    }
    if (S.target) h += G.circle(PX(S.target.x), PY(S.target.y), 11, "ghost");
    // readout panel
    const row = (lab, val, cls = "b") => rows.push([lab, val, cls]);
    for (const k of ["A", "B", "C"]) if (p[k] && !sh.hideCoords) row(k, P(p[k]));
    if (sh.delta && A && B) { row("Δx", N(B.x - A.x)); row("Δy", N(B.y - A.y)); }
    if (sh.len && A && B) row("AB", lenStr(A, B), "a");
    if (sh.mid && A && B) row("M", P(mid(A, B)), "ok");
    if (sh.slope && A && B) row("שיפוע", slope(A, B) === null ? "—" : slope(A, B), "ok");
    if (C && A && B && sh.area) { const base = Math.abs(B.x - A.x), ht = Math.abs(C.y - A.y); row("בסיס", String(base)); row("גובה", String(ht), "blue"); row("שטח", G.fmt(base) + "·" + G.fmt(ht) + "÷2 = " + G.fmt(base * ht / 2), "a"); }
    rows.forEach(([lab, val, cls], i) => {
      const y = 44 + i * 34;
      if (/[א-ת]/.test(lab)) h += G.he(608, y, lab, "m", "right") + G.t(400, y, val, cls, "start");
      else h += G.t(400, y, lab + " = " + val, cls, "start");
    });
    return h;
  }
  function drag(L, key, pt) {
    const S = L.state, q = S.pts[key]; if (!q || !S.drag.includes(key)) return;
    const x = Math.max(X0, Math.min(X1 - 1, Math.round((pt.x - OX) / U))), y = Math.max(Y0, Math.min(Y1 - 1, Math.round((OY - pt.y) / U)));
    if (Object.entries(S.pts).some(([k, o]) => k !== key && o.x === x && o.y === y)) return;
    q.x = x; q.y = y;
  }
  const pts = L => L.state.pts;
  const at = (q, x, y) => q.x === x && q.y === y;
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const move = (k, x, y) => L => { pts(L)[k] = { x, y }; L.act({ type: "drop", key: k }); };


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
    id: "geo-coordinates", title: "המחשה: מערכת צירים", viewBox: "0 0 620 320",
    chapters: ["נקודות", "אורך קטע", "אמצע קטע", "שיפוע", "שטח משולש", "שאלת מבחן"],
    draw, drag,
    steps: bidi([
      { ch: 0, setup: L => { L.state = fresh({ pts: { A: { x: -4, y: 3 } }, drag: ["A"] }); },
        say: "זו מערכת צירים. כל נקודה נכתבת (x, y): המספר הראשון הוא כמה ימינה או שמאלה, השני כמה למעלה או למטה.",
        task: "גרור את A לנקודה (3, −2).",
        demo: move("A", 3, -2),
        check: (L, e) => { if (e.type !== "drop") return null; const A = pts(L).A; if (at(A, 3, -2)) return true;
          if (at(A, -2, 3)) return "החלפת בין x ל־y. המספר הראשון, 3, הוא x: שלוש משבצות ימינה.";
          if (A.x === 3) return "ה־x נכון. עכשיו y = −2: שתי משבצות מתחת לציר ה־x.";
          if (A.y === -2) return "ה־y נכון. עכשיו x = 3: שלוש משבצות ימינה מהראשית.";
          return "התחל בראשית (0, 0). זוז 3 ימינה, ואז 2 למטה."; },
        ok: "A = (3, −2). ימינה זה x חיובי, למטה זה y שלילי." },
      { ch: 0, setup: L => { pts(L).B = { x: 4, y: 3 }; L.state.drag = ["B"]; },
        say: "נקודה על אחד הצירים תמיד מכילה אפס.",
        task: "גרור את B לנקודה על ציר ה־y, ארבע משבצות מעל הראשית.",
        demo: move("B", 0, 4),
        check: (L, e) => { if (e.type !== "drop") return null; const B = pts(L).B; if (at(B, 0, 4)) return true;
          if (at(B, 4, 0)) return "זה על ציר ה־x. על ציר ה־y ערך ה־x הוא 0.";
          if (B.x === 0) return "אתה על ציר ה־y. עכשיו כוון לגובה 4.";
          return "ציר ה־y הוא הקו האנכי שעובר בראשית. שם x = 0."; },
        ok: "B = (0, 4). כל נקודה על ציר ה־y היא (0, y), וכל נקודה על ציר ה־x היא (x, 0)." },
      { ch: 0, setup: L => { L.state.drag = ["B"]; },
        say: "עכשיו הקטע AB משופע.",
        task: "גרור את B כך שהקטע AB יהיה מקביל לציר ה־x.",
        demo: move("B", -3, -2),
        check: (L, e) => { if (e.type !== "drop") return null; const { A, B } = pts(L); if (B.y === A.y) return true;
          if (B.x === A.x) return "עכשיו הקטע עומד: הוא מקביל לציר ה־y (אותו x). מקביל לציר ה־x פירושו אותו y.";
          return "קטע מקביל לציר ה־x שוכב אופקית. איזה ערך צריך להיות שווה ל־A?"; },
        ok: L => "שתי הנקודות עם y = −2. <b>מקביל לציר ה־x = אותו y</b>, ומקביל לציר ה־y = אותו x." },

      { ch: 1, setup: L => { L.state = fresh({ pts: { A: { x: -3, y: 1 }, B: { x: 5, y: 1 } } }); },
        say: "A ו־B על אותו קו אופקי, משני צדי ציר ה־y.",
        task: "לפני שנמדוד: מה אורך הקטע AB?",
        choices: ["2", "8", "5", "−8"],
        check: pick(1, { 0: "5 − 3 = 2, אבל A נמצא ב־<b>מינוס</b> 3. מ־A לציר יש 3 משבצות, ומהציר ל־B עוד 5.", 2: "5 זה רק החלק מימין לציר. מ־A עד הציר יש עוד 3.", 3: "אורך הוא תמיד חיובי. ספור משבצות מ־A ל־B." }),
        ok: "3 משבצות עד הציר ועוד 5 אחריו: 5 − (−3) = 8." },
      { ch: 1, setup: L => { L.state.show = { count: true, len: true }; L.state.drag = ["A"]; },
        say: "המספרים האדומים סופרים את המשבצות בקטע.",
        task: "הזז את A (בלי לזוז מהקו) כך ש־AB = 10 בדיוק.",
        demo: move("A", -5, 1),
        check: (L, e) => { if (e.type !== "drop") return null; const { A, B } = pts(L); if (A.y !== B.y) return "ירדת מהקו. שמור על y = 1 כדי שהקטע יישאר אופקי.";
          if (A.x === -5) return true; const d = Math.abs(B.x - A.x);
          return d < 10 ? "AB = " + d + " עכשיו. צריך עוד " + (10 - d === 1 ? "משבצת אחת" : (10 - d) + " משבצות") + " שמאלה." : "AB = " + d + ". זה יותר מדי."; },
        ok: "A = (−5, 1). בדיקה: 5 − (−5) = 10. כשהנקודות משני צדי הציר, <b>מחברים</b> את שני החלקים." },
      { ch: 1, setup: L => { L.state = fresh({ pts: { A: { x: -2, y: -1 }, B: { x: 1, y: 3 } }, show: { delta: true } }); },
        say: "קטע אלכסוני אי אפשר לספור במשבצות. הטריק: להשלים <b>משולש ישר־זווית</b> שהקטע הוא היתר שלו.",
        task: "לחץ על 'השלם משולש'.",
        tools: () => [["השלם משולש", L => { L.state.show = { delta: true, tri: true, len: true }; L.render(); L.act({ type: "tri" }); }, true]],
        demo: L => { L.state.show = { delta: true, tri: true, len: true }; L.act({ type: "tri" }); },
        check: (L, e) => e.type === "tri" ? true : null,
        ok: "הניצבים הם Δx = 3 ו־Δy = 4. זו השלשה 3:4:5, ולכן AB = 5. בפיתגורס: √(9 + 16) = 5." },
      { ch: 1, setup: L => { L.state.drag = ["B"]; },
        say: "המשולש מתעדכן כשאתה מזיז את B.",
        task: "מצא מקום אחר ל־B שבו AB = 5 בדיוק, והקטע עדיין אלכסוני.",
        demo: move("B", 2, 2),
        check: (L, e) => { if (e.type !== "drop") return null; const { A, B } = pts(L), s = len2(A, B);
          if (at(B, 1, 3)) return "זה המקום שבו B היה. חפש מקום אחר.";
          if (s === 25 && (A.x === B.x || A.y === B.y)) return "האורך 5, אבל הקטע מקביל לציר. חפש הפרשים 3 ו־4 בשני הכיוונים.";
          if (s === 25) return true;
          return "AB = √" + s + " עכשיו. חפש מקום שבו ההפרשים הם 3 ו־4 (או 4 ו־3)."; },
        ok: L => { const { A, B } = pts(L); return "Δx = " + Math.abs(B.x - A.x) + " ו־Δy = " + Math.abs(B.y - A.y) + ", ולכן AB = 5. יש 8 מקומות כאלה סביב A: זה מעגל ברדיוס 5."; } },
      { ch: 1, say: "עכשיו בלי הלוח.", task: "מה המרחק בין (−1, −2) ל־(5, 6)?",
        choices: ["14", "10", "100", "√14"],
        check: pick(1, { 0: "6 + 8 = 14, כלומר חיברת את הניצבים. המרחק הוא היתר, ומשתמשים בפיתגורס.", 2: "100 זה האורך בריבוע. צריך להוציא שורש.", 3: "הניצבים הם 6 ו־8. מה היתר?" }),
        ok: "Δx = 6, Δy = 8. זו השלשה 3:4:5 כפול 2, ולכן המרחק 10." },

      { ch: 2, setup: L => { L.state = fresh({ pts: { A: { x: -3, y: -1 }, B: { x: 5, y: 3 } }, drag: ["B"], show: { mid: true } }); },
        say: "הנקודה הירוקה M היא אמצע הקטע. ה־x שלה הוא ממוצע ערכי ה־x, וה־y שלה ממוצע ערכי ה־y.",
        task: "גרור את B כך שהאמצע M ייפול בדיוק על הראשית (0, 0).",
        demo: move("B", 3, 1),
        check: (L, e) => { if (e.type !== "drop") return null; const M = mid(pts(L).A, pts(L).B); if (!M.x && !M.y) return true;
          if (!M.x) return "ה־x של M כבר 0. עכשיו A נמצא 1 מתחת לציר ה־x, אז B צריך להיות 1 מעליו.";
          if (!M.y) return "ה־y של M כבר 0. A נמצא 3 שמאלה מהראשית, אז B צריך להיות 3 ימינה.";
          return "M באמצע הדרך בין A ל־B. אם A הוא (−3, −1), איפה B צריך להיות כדי שהראשית תהיה בדיוק באמצע?"; },
        ok: "B = (3, 1), ממש מול A ביחס לראשית. בדיקה: ((−3 + 3)/2, (−1 + 1)/2) = (0, 0)." },
      { ch: 2, say: "כיוון הפוך: ידוע אחד הקצוות וידוע האמצע.", task: "A = (−4, 2), והאמצע של AB הוא M = (1, 3). מה B?",
        choices: ["(−1.5, 2.5)", "(6, 4)", "(5, 1)", "(−9, 1)"],
        check: pick(1, { 0: "זה האמצע בין A ל־M. אבל M הוא האמצע, ו־B נמצא מעבר לו.", 2: "מ־A ל־M ה־x עולה ב־5, וגם ה־y <b>עולה</b> ב־1. המשך באותו צעד מ־M.", 3: "הלכת בכיוון ההפוך. B נמצא מעבר ל־M, לא לפני A." }),
        ok: "מ־A ל־M: 5 ימינה ו־1 למעלה. עוד צעד זהה מ־M: (1 + 5, 3 + 1) = (6, 4)." },

      { ch: 3, setup: L => { L.state = fresh({ pts: { A: { x: -4, y: -3 }, B: { x: 2, y: -1 } }, drag: ["B"], show: { line: true, stairs: true, slope: true } }); },
        say: "על ישר אפשר לצייר 'מדרגות' זהות. השיפוע = גובה מדרגה ÷ רוחב מדרגה. עכשיו כל מדרגה היא 3 ימינה ו־1 למעלה: שיפוע 1/3.",
        task: "גרור את B כך שכל מדרגה תהיה 1 ימינה ו־2 למעלה (שיפוע 2).",
        demo: move("B", -1, 3),
        check: (L, e) => { if (e.type !== "drop") return null; const { A, B } = pts(L), dx = B.x - A.x, dy = B.y - A.y;
          if (dx && dy === 2 * dx) return true;
          if (!dx) return "הישר עומד. אין לו מדרגות, ושיפוע לא מוגדר.";
          if (dx && 2 * dy === dx) return "החלפת: 2 ימינה ו־1 למעלה זה שיפוע 1/2. צריך מדרגה גבוהה פי 2 מרוחבה.";
          if (dy * dx < 0) return "הישר יורד. שיפוע 2 עולה כשהולכים ימינה.";
          return "השיפוע עכשיו " + slope(A, B) + ". כל מדרגה צריכה לעלות פי 2 ממה שהיא זזה ימינה."; },
        ok: "כל מדרגה: 1 ימינה, 2 למעלה. Δy ÷ Δx = 6 ÷ 3 = 2. המדרגות זהות לכל אורך הישר, ולכן נקודות במרחקים שווים על הישר נמצאות בקפיצות זהות." },
      { ch: 3, say: "כך משתמשים במדרגות כדי למצוא נקודות על ישר.",
        task: "הנקודות (0, 1) ו־(2, 4) על ישר. איזו נקודה נוספת על הישר נמצאת במרחק זהה מ־(2, 4), בהמשך אותו כיוון?",
        choices: ["(4, 6)", "(4, 7)", "(4, 8)", "(3, 5.5)"],
        check: pick(1, { 0: "הצעד בין הנקודות הוא 2 ימינה ו־<b>3</b> למעלה. כמה עולים אחרי 4 − 2?", 2: "הכפלת את ה־y ב־2. אבל מוסיפים צעד קבוע, לא כופלים.", 3: "זו נקודה על הישר, אבל רק במרחק של חצי צעד." }),
        ok: "המדרגה היא 2 ימינה ו־3 למעלה. עוד מדרגה מ־(2, 4): (4, 7)." },

      { ch: 4, setup: L => { L.state = fresh({ pts: { A: { x: -4, y: -2 }, B: { x: 4, y: -2 }, C: { x: -2, y: 4 } }, drag: ["C"], show: { area: true, hideCoords: true } }); },
        say: "משולש שהבסיס שלו AB מקביל לציר ה־x. הגובה (הקו הכחול) הוא המרחק <b>האנכי</b> מ־C לבסיס, כלומר הפרש ערכי ה־y.",
        task: "גרור את C כך ששטח המשולש יהיה 12.",
        demo: move("C", 0, 1),
        check: (L, e) => { if (e.type !== "drop") return null; const { A, C } = pts(L), ht = Math.abs(C.y - A.y);
          if (ht === 3) return true; if (!ht) return "C ירד לבסיס: אין גובה ואין משולש.";
          return "השטח עכשיו " + G.fmt(8 * ht / 2) + ". הבסיס 8, אז 12 = 8 × גובה ÷ 2. איזה גובה צריך?"; },
        ok: "גובה 3: 8 × 3 ÷ 2 = 12." },
      { ch: 4, say: "עכשיו נזיז את C הצידה, בגובה זהה, אל הנקודה (6, 1), מחוץ לבסיס. הצלע AC תתארך מאוד.",
        task: "מה יקרה לשטח?", choices: ["יגדל", "יקטן", "יישאר 12"],
        check: (L, e) => { if (e.type !== "choice") return null; L.memo.areaGuess = e.j; return true; },
        ok: "בוא נבדוק על הלוח." },
      { ch: 4, setup: L => { pts(L).C = { x: 6, y: 1 }; L.state.drag = ["C"]; },
        say: L => (L.memo.areaGuess === 2 ? "צדקת. " : "") + "הגובה נשאר 3: הוא נופל מחוץ לבסיס, על ההמשך המקווקו שלו. השטח לא תלוי בכמה הצלע משופעת.",
        task: "גרור את C לאורך הקו y = 1 ושים לב לשטח.",
        demo: move("C", -5, 1),
        check: (L, e) => { if (e.type !== "drop") return null; const { C } = pts(L); if (C.x === 6 && C.y === 1) return null; return C.y === 1 ? true : "יצאת מהקו y = 1. השטח השתנה כי הגובה השתנה. חזור לגובה 1."; },
        ok: "השטח נשאר 12 בכל מקום על הקו. <b>גובה = הפרש y</b>, לא אורך הצלע המשופעת." },

      { ch: 5, setup: L => { L.state = fresh({ pts: { A: { x: -2, y: -3 }, B: { x: 4, y: 5 } }, drag: ["A", "B"], show: { circle: true, tri: true, delta: true } }); },
        say: "שאלה ברמת מבחן. אפשר להזיז את הנקודות על הלוח.",
        task: "מרכז מעגל בנקודה (−2, −3), והמעגל עובר בנקודה (4, 5). מה שטח המעגל?",
        choices: ["100π", "20π", "10π", "14π"],
        check: pick(0, { 1: "20 זה הקוטר. השטח הוא π·r².", 2: "10 זה הרדיוס, אבל השטח הוא π·r².", 3: "חיברת 6 + 8. הרדיוס הוא היתר במשולש ישר־הזווית." }),
        ok: "Δx = 6, Δy = 8, ולכן הרדיוס 10 (השלשה 6:8:10). שטח = π·10² = 100π." },
      { ch: 5, say: "<b>סיכום ההמחשה:</b><br>1. (x, y): קודם ימינה/שמאלה, אחר כך למעלה/למטה. מקביל לציר ה־x = אותו y.<br>2. אורך קטע: משלימים משולש ישר־זווית עם Δx ו־Δy. משני צדי ציר מחברים.<br>3. אמצע = ממוצע ה־x וממוצע ה־y. שיפוע = מדרגה: Δy ÷ Δx.<br>4. גובה משולש = המרחק האנכי לבסיס, גם מחוצה לו.", next: "סיום ההמחשה" },
    ]),
  });
})();
