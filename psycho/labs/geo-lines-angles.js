/* Lab: ישרים וזוויות — rotating lines, parallels + transversal, "break" between parallels, triangle exterior angle. */
(function () {
  const { G } = Lab, R = Math.PI / 180;
  // ---- geometry helpers (math angles in degrees, y-up; screen y-down) ----
  const norm = a => ((a % 360) + 360) % 360;
  const ang = (P, Q) => norm(Math.atan2(-(Q[1] - P[1]), Q[0] - P[0]) / R);
  const at = (V, a, r) => [V[0] + r * Math.cos(a * R), V[1] - r * Math.sin(a * R)];
  const snap = (v, s) => Math.round(v / s) * s;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function wedge(V, a1, d, r, cls, extra) {
    const s = at(V, a1, r), e = at(V, a1 + d, r);
    return G.path(`M${V[0]},${V[1]} L${s[0]},${s[1]} A${r},${r} 0 ${d > 180 ? 1 : 0} 0 ${e[0]},${e[1]} Z`, cls, extra);
  }
  function arc(V, a1, d, r, cls) {
    if (Math.abs(d - 90) < .01) { const u = at(V, a1, 13), w = at(V, a1 + 90, 13), c = at(at(V, a1, 13), a1 + 90, 13); return G.path(`M${u[0]},${u[1]} L${c[0]},${c[1]} L${w[0]},${w[1]}`, "thin"); }
    const s = at(V, a1, r), e = at(V, a1 + d, r);
    return G.path(`M${s[0]},${s[1]} A${r},${r} 0 ${d > 180 ? 1 : 0} 0 ${e[0]},${e[1]}`, cls || "thin");
  }
  // label outside the arc on the bisector; small angles push the label further out
  function lbl(V, a1, d, r, text, cls) { const mid = a1 + d / 2, rr = r + 18 + Math.max(0, 40 - d) * 0.9, p = at(V, mid, rr), w = String(text).length * 8.5; return G.t(p[0] + Math.cos(mid * R) * w * 0.42, p[1] + 6 - Math.sin(mid * R) * 4, text, cls || "b"); }
  const deg = v => G.fmt(v) + "°";
  const m = s => '<bdi dir="ltr">' + s + '</bdi>';

  // ---------- model 1: two crossing lines ----------
  const O = [310, 210], RAY = 160;
  function crossAngles(th) { return { a: [0, th], b: [th, 180 - th], c: [180, th], d: [180 + th, 180 - th] }; }
  const GREEK = { a: "α", b: "β", c: "γ", d: "δ" };
  function drawCross(S) {
    let h = "";
    const A = crossAngles(S.th), dir = at([0, 0], S.th, 1);
    for (const k of "abcd") {
      if (!S.show.includes(k)) continue;
      const [a1, d] = A[k], cls = S.sel === k ? "fa" : S.neutral ? "ghost" : (k === "a" || k === "c") ? "fsoft" : "fblue-soft";
      h += wedge(O, a1, d, 44, cls, { opacity: S.sel === k ? .55 : 1 });
    }
    h += G.line(O[0] - 230, O[1], O[0] + 230, O[1], "ink");
    h += G.line(O[0] - RAY * dir[0], O[1] - RAY * dir[1], O[0] + RAY * dir[0], O[1] + RAY * dir[1], "ink");
    for (const k of "abcd") {
      if (!S.show.includes(k)) continue;
      const [a1, d] = A[k], val = S.hide.includes(k) ? "?" : deg(d);
      h += lbl(O, a1, d, 44, GREEK[k] + " = " + val, S.neutral ? "b" : (k === "a" || k === "c") ? "a" : "blue");
      if (S.tap) h += G.tap(wedge(O, a1, d, 70, "fsoft", { opacity: 0, class: "fsoft hot" }), k);
    }
    h += G.circle(O[0], O[1], 4, "dot") + G.t(O[0] + 4, O[1] + 24, "O", "b", "start");
    if (S.drag) { const k = at(O, S.th, RAY - 12); h += G.knob(k[0], k[1], "rot", 16); }
    if (S.sum) h += G.t(310, 30, S.sum(S), "b");
    return h;
  }

  // ---------- model 2: two parallels + transversal ----------
  const M = [310, 195], YA = 115, YB = 275;
  function parPts(S) {
    const d = at([0, 0], S.th, 1), X1 = [M[0] + (YA - M[1]) / d[1] * d[0], YA];
    const phi = S.tilt || 0;  // line b direction (math deg); b passes through X2 point on transversal at y=YB
    const X2 = [M[0] + (YB - M[1]) / d[1] * d[0], YB];
    return { X1, X2, phi, d };
  }
  function parAngles(th, phi) {  // 4 wedges at a crossing of a line with direction phi and the transversal th
    return { a: [phi, th - phi], b: [th, 180 + phi - th], c: [180 + phi, th - phi], d: [180 + th, 180 + phi - th] };
  }
  function drawPar(S) {
    let h = "";
    const { X1, X2, phi, d } = parPts(S);
    const sets = [["1", X1, 0], ["2", X2, phi]];
    for (const [n, X, ph] of sets) {
      const A = parAngles(S.th, ph);
      for (const q of "abcd") {
        const key = n + q, [a1, dd] = A[q];
        let cls = S.color ? (dd < 90 ? "fsoft" : dd > 90 ? "fblue-soft" : "fok-soft") : (S.sel && S.sel.includes(key) ? "fsoft" : "ghost");
        if (S.given === key) cls = "fa";
        h += wedge(X, a1, dd, 30, cls, S.given === key ? { opacity: .6 } : {});
      }
    }
    h += G.line(40, YA, 580, YA, "ink");
    const bl = at(X2, phi, 280), br = at(X2, phi + 180, 280);
    h += G.line(br[0], br[1], bl[0], bl[1], "ink");
    h += G.t(598, YA + 6, "a", "b") + G.t(Math.min(598, bl[0] + 16), bl[1] + 6, "b", "b");
    const t1 = (40 - M[1]) / d[1], t2 = (350 - M[1]) / d[1];
    h += G.line(M[0] + t1 * d[0], 40, M[0] + t2 * d[0], 350, "ink");
    for (const [n, X, ph] of sets) {
      const A = parAngles(S.th, ph);
      for (const q of "abcd") {
        const key = n + q, [a1, dd] = A[q];
        const show = S.vals === "all" || S.given === key || (S.vals === "sel" && S.sel && S.sel.includes(key));
        if (show) h += lbl(X, a1, dd, 30, deg(dd), dd < 90 ? "a" : dd > 90 ? "blue" : "ok");
        if (S.tap) h += G.tap(wedge(X, a1, dd, 62, "fsoft", { opacity: 0, class: "fsoft hot" }), key);
      }
    }
    if (S.drag) { const k = [M[0] + (48 - M[1]) / d[1] * d[0], 48]; h += G.knob(k[0], k[1], "par", 16); }
    if (S.note) h += S.note;
    return h;
  }

  // ---------- model 3: "break" point P between parallels ----------
  const ZA = [110, 70], ZB = [150, 305];
  function zigP(ta, tb) {   // P = A + s(cos ta, sin ta) [screen down] = B + t(cos tb, -sin tb)
    const ca = Math.cos(ta * R), sa = Math.sin(ta * R), cb = Math.cos(tb * R), sb = Math.sin(tb * R);
    // s*ca - t*cb = ZB.x - ZA.x ; s*sa + t*sb = ZB.y - ZA.y
    const dx = ZB[0] - ZA[0], dy = ZB[1] - ZA[1], det = ca * sb + cb * sa;
    const s = (dx * sb + cb * dy) / det;
    return [ZA[0] + s * ca, ZA[1] + s * sa];
  }
  function drawZig(S) {
    let h = "";
    const P = zigP(S.ta, S.tb), Lb = S.labels || {};
    h += wedge(ZA, 360 - S.ta, S.ta, 40, "fsoft") + wedge(ZB, 0, S.tb, 40, "fblue-soft");
    if (S.c) { h += wedge(P, 180 - S.ta, S.ta, 34, "fsoft") + wedge(P, 180, S.tb, 34, "fblue-soft"); }
    else h += wedge(P, 180 - S.ta, S.ta + S.tb, 34, "fok-soft");
    h += G.line(40, ZA[1], 600, ZA[1], "ink") + G.line(40, ZB[1], 600, ZB[1], "ink");
    h += G.t(28, ZA[1] + 6, "a", "b") + G.t(28, ZB[1] + 6, "b", "b");
    if (S.c) h += G.line(40, P[1], 600, P[1], "dash") + G.t(28, P[1] + 6, "c", "m");
    h += G.line(ZA[0], ZA[1], P[0], P[1], "ink") + G.line(ZB[0], ZB[1], P[0], P[1], "ink");
    h += lbl(ZA, 360 - S.ta, S.ta, 40, Lb.a || deg(S.ta), "a") + lbl(ZB, 0, S.tb, 40, Lb.b || deg(S.tb), "blue");
    if (S.c) { h += lbl(P, 180 - S.ta, S.ta, 34, Lb.a || deg(S.ta), "a") + lbl(P, 180, S.tb, 34, Lb.b || deg(S.tb), "blue"); }
    else { const p = at(P, 180, 70); h += G.t(p[0] - 6, p[1] + 6, Lb.p || (S.hideP ? "?" : deg(S.ta + S.tb)), "ok", "end"); }
    for (const [V, n, dy] of [[ZA, "A", -12], [ZB, "B", 26]]) h += G.circle(V[0], V[1], 4, "dot") + G.t(V[0], V[1] + dy, n, "b");
    h += G.circle(P[0], P[1], 4, "dot");
    if (S.drag) h += G.knob(P[0], P[1], "P", 16) + G.t(P[0] + 24, P[1] + 6, "P", "b", "start");
    else h += G.t(P[0] + 12, P[1] + 6, "P", "b", "start");
    if (S.c && !S.labels) h += G.t(30, 350, "∢APB = " + deg(S.ta) + " + " + deg(S.tb) + " = " + deg(S.ta + S.tb), "b", "start");
    return h;
  }

  // ---------- model 4: triangle with exterior angle ----------
  const TA = [130, 305], TB = [380, 305];
  function triC(al, be) { const hgt = (TB[0] - TA[0]) / (1 / Math.tan(al * R) + 1 / Math.tan(be * R)); return [TA[0] + hgt / Math.tan(al * R), TA[1] - hgt]; }
  function triOk(al, be) { if (al < 20 || be < 20 || al + be > 160) return false; const C = triC(al, be); return C[1] >= 45 && C[0] >= 40 && C[0] <= 560; }
  function drawTri(S) {
    let h = "";
    const C = triC(S.al, S.be), ga = 180 - S.al - S.be;
    h += wedge(TA, 0, S.al, 34, "fsoft") + wedge(TB, 180 - S.be, S.be, 34, "fblue-soft") + wedge(C, 180 + S.al, ga, 30, "fok-soft");
    if (S.ext) h += wedge(TB, 0, 180 - S.be, 48, "fwarn");
    h += G.poly([TA, TB, C], "ink");
    h += G.line(TB[0], TB[1], 600, TB[1], S.ext ? "ink" : "dash");
    h += lbl(TA, 0, S.al, 34, deg(S.al), "a") + lbl(TB, 180 - S.be, S.be, 34, deg(S.be), "blue");
    h += lbl(C, 180 + S.al, ga, 30, deg(ga), "ok");
    if (S.ext) h += lbl(TB, 0, 180 - S.be, 48, (S.extQ ? "?" : deg(180 - S.be)), "w");
    h += G.t(TA[0] - 8, TA[1] + 26, "A", "b") + G.t(TB[0], TB[1] + 26, "B", "b");
    h += G.knob(C[0], C[1], "C", 16) + G.t(C[0], C[1] - 24, "C", "b");
    h += G.t(30, 36, deg(S.al) + " + " + deg(S.be) + " + " + deg(ga) + " = 180°", "b", "start");
    if (S.ext && !S.extQ) h += G.t(30, 62, deg(180 - S.be) + " = " + deg(S.al) + " + " + deg(ga), "w", "start");
    return h;
  }

  function draw(L) {
    const S = L.state;
    return S.mode === "cross" ? drawCross(S) : S.mode === "par" ? drawPar(S) : S.mode === "zig" ? drawZig(S) : drawTri(S);
  }
  function drag(L, key, pt) {
    const S = L.state;
    if (key === "rot") { let a = ang(O, [pt.x, pt.y]); if (a > 180) a -= 180; S.th = clamp(snap(a, 5), 10, 170); }
    else if (key === "par") { let a = ang(M, [pt.x, pt.y]); if (a > 180) a -= 180; S.th = clamp(snap(a, 5), 30, 150); }
    else if (key === "P") {
      const ta = clamp(snap(Math.atan2(pt.y - ZA[1], pt.x - ZA[0]) / R, 5), 15, 75), tb = clamp(snap(Math.atan2(ZB[1] - pt.y, pt.x - ZB[0]) / R, 5), 15, 75);
      const P = zigP(ta, tb); if (P[0] < 585 && P[1] > ZA[1] + 20 && P[1] < ZB[1] - 20) { S.ta = ta; S.tb = tb; }
    } else if (key === "C") {
      const al = snap(ang(TA, [pt.x, pt.y]), 5), be = snap(180 - ang(TB, [pt.x, pt.y]), 5);
      if (triOk(al, be)) { S.al = al; S.be = be; }
    }
  }
  function tap(L, key) {
    const S = L.state;
    if (S.mode === "cross") { S.sel = key; return; }
    if (S.given === key) return false;
    const i = S.sel.indexOf(key); if (i >= 0) S.sel.splice(i, 1); else S.sel.push(key);
    S.last = key;
  }
  const cross = o => Object.assign({ mode: "cross", th: 30, show: "ab", hide: "", sel: null, tap: false, drag: true }, o);
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const dropIf = (ok, hint) => (L, e) => e.type !== "drop" ? null : ok(L.state) ? true : hint(L.state);
  const SMALL = ["1a", "1c", "2a", "2c"];   // for th < 90

  Lab.register({
    id: "geo-lines-angles", title: "המחשה: ישרים וזוויות", viewBox: "0 0 620 380",
    chapters: ["זוויות צמודות", "קודקודיות ו־360°", "ישרים מקבילים", "שבירה בין מקבילים", "זווית חיצונית", "שאלת מבחן"],
    draw, drag, tap,
    steps: [
      // ---- ch0: adjacent angles ----
      { ch: 0, setup: L => { L.state = cross({ th: 30 }); },
        say: "שני ישרים נחתכים בנקודה O. את הישר הנטוי אפשר לסובב בעזרת העיגול שבקצה שלו.",
        task: `סובב את הישר עד ש־${m("α")} תהיה 60°.`,
        demo: L => { L.state.th = 60; L.act({ type: "drop" }); },
        check: dropIf(S => S.th === 60, S => S.th < 60 ? `${m("α = " + S.th + "°")}. חסרות עוד ${60 - S.th}°: הזז את העיגול שמאלה, נגד כיוון השעון.` : `${m("α = " + S.th + "°")}. עברת ב־${S.th - 60}°: החזר את העיגול ימינה.`),
        ok: `${m("α = 60°")} ו־${m("β = 120°")}. ביחד הן ממלאות את הקו הישר, ולכן ${m("<b>α + β = 180°</b>")}. זוויות כאלה, שנמצאות זו ליד זו על קו ישר, נקראות <b>צמודות</b>.` },
      { ch: 0, say: `שים לב: כשמגדילים את ${m("α")}, הזווית ${m("β")} קטנה בדיוק באותה כמות.`,
        task: `סובב כך ש־${m("β")} תהיה גדולה מ־${m("α")} ב־40° בדיוק.`,
        demo: L => { L.state.th = 70; L.act({ type: "drop" }); },
        check: dropIf(S => S.th === 70, S => S.th >= 90 ? `עכשיו ${m("α")} היא הגדולה (${S.th}°). צריך ש־${m("β")} תהיה הגדולה מביניהן.` : `עכשיו ${m("β − α = " + (180 - 2 * S.th) + "°")}. ${180 - 2 * S.th > 40 ? `ההפרש גדול מדי: הגדל את ${m("α")}.` : `ההפרש קטן מדי: הקטן את ${m("α")}.`}`),
        ok: `${m("α = 70°")} ו־${m("β = 110°")}. בלי שרטוט: ${m("x + (x + 40) = 180")}, כלומר ${m("2x = 140")} ו־${m("x = 70")}.` },
      { ch: 0, say: "עכשיו בלי לגרור.", task: `אם ${m("α = 25°")}, כמה תהיה ${m("β")}?`, choices: ["25°", "65°", "155°", "335°"],
        check: (L, e) => { if (e.type !== "choice") return null; if (e.j === 2) { L.state.th = 25; L.render(); return true; }
          return { 0: `זו ${m("α")} עצמה. ${m("β")} היא הזווית שליד ${m("α")} על אותו קו ישר.`, 1: "65° משלימה ל־90°. על קו ישר משלימים ל־180°.", 3: "335° משלימה ל־360°. זוויות צמודות משלימות ל־180°." }[e.j]; },
        ok: `${m("180° − 25° = 155°")}. על הלוח רואים את זה: הזווית הקטנה צרה מאוד, והצמודה לה כמעט קו ישר שלם.` },
      // ---- ch1: vertical angles, around a point ----
      { ch: 1, setup: L => { L.state = cross({ th: 50, show: "abcd", hide: "bcd", tap: true, drag: false, neutral: true }); },
        say: `הישרים ממשיכים גם מעבר ל־O, ולכן נוצרות ארבע זוויות. רק ${m("α")} ידועה.`,
        task: `לחץ על הזווית ששווה ל־${m("α")}, בלי למדוד.`,
        demo: L => { L.state.sel = "c"; L.act({ type: "tap", key: "c" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const S = L.state, k = S.sel; if (k === "c") { S.hide = ""; S.neutral = false; S.sel = null; L.render(); return true; }
          return k === "a" ? `זו ${m("α")} עצמה. חפש את הזווית שנמצאת מולה, מעבר לנקודה O.` : `זו זווית צמודה ל־${m("α")}: יחד הן 180°, ולכן היא גדולה ממנה. חפש את הזווית שמול ${m("α")}.`; },
        ok: `${m("γ = α = 50°")}. זוויות שעומדות זו מול זו נקראות <b>קודקודיות</b>, והן תמיד שוות. הסיבה: שתיהן צמודות לאותה ${m("β")}, ולכן כל אחת מהן היא ${m("180° − β")}.` },
      { ch: 1, setup: L => { Object.assign(L.state, { tap: false, drag: true, sel: null, hide: "", neutral: false, sum: S => "α + β + γ + δ = " + S.th + "° + " + (180 - S.th) + "° + " + S.th + "° + " + (180 - S.th) + "° = 360°" }); },
        say: "עכשיו אפשר שוב לסובב. כל זוג שעומד זה מול זה נשאר שווה, והסכום של ארבעתן מוצג למעלה.",
        task: "סובב כך שכל ארבע הזוויות יהיו שוות זו לזו.",
        demo: L => { L.state.th = 90; L.act({ type: "drop" }); },
        check: dropIf(S => S.th === 90, S => `עדיין יש זוג של ${Math.min(S.th, 180 - S.th)}° וזוג של ${Math.max(S.th, 180 - S.th)}°. מתי ${m("α")} שווה לזווית הצמודה לה?`),
        ok: `כל אחת 90°, ו־${m("4 × 90° = 360°")}. זה הכלל השלישי: <b>כל הזוויות סביב נקודה אחת משלימות ל־360°</b>.` },
      { ch: 1, setup: L => { L.state.sum = null; L.state.drag = false; },
        say: "שאלה שמשלבת את שני הכללים.", task: "שני ישרים נחתכים. סכום שתי זוויות קודקודיות הוא 140°. מה גודלה של כל אחת מהזוויות האחרות?",
        choices: ["40°", "70°", "110°", "220°"],
        check: pick(2, { 0: `${m("40° = 180° − 140°")}. אבל 140° הוא סכום של שתי זוויות, לא זווית אחת. כמה היא כל אחת?`, 1: "70° היא כל אחת מהזוויות הנתונות. השאלה שואלת על הזוויות הצמודות להן.", 3: `220° הוא הסכום של שתי האחרות יחד (${m("360° − 140°")}). כמה היא כל אחת?` }),
        ok: `קודקודיות שוות, ולכן כל אחת 70°. הצמודה לה: ${m("180° − 70° = 110°")}. בדיקה: ${m("70 + 70 + 110 + 110 = 360")}.` },
      // ---- ch2: parallels ----
      { ch: 2, setup: L => { L.state = { mode: "par", th: 60, given: "1a", sel: [], vals: "sel", tap: true, drag: false, color: false }; },
        say: "a ו־b הם ישרים <b>מקבילים</b>, וישר שלישי חותך את שניהם. נוצרות 8 זוויות. אחת מהן מסומנת: 60°.",
        task: "לחץ על כל הזוויות ששוות לה (לחיצה נוספת מבטלת).",
        demo: L => { L.state.sel = SMALL.filter(k => k !== "1a"); L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const sel = L.state.sel;
          if (sel.some(k => !SMALL.includes(k))) return "אחת הזוויות שבחרת היא 'גדולה' (קהה), 120°. היא משלימה את ה־60° ל־180°. לחץ עליה שוב כדי לבטל.";
          return sel.length === 3 ? true : null; },
        ok: "כל הזוויות הקטנות שוות: 60°. אין צורך לזכור שמות כמו 'מתחלפות' או 'מתאימות'. מספיק לשאול: קטנה או גדולה?" },
      { ch: 2, setup: L => { Object.assign(L.state, { given: null, sel: [], vals: "all", tap: false, drag: true, color: true }); },
        say: "עכשיו רואים את כל 8 הזוויות: הקטנות בוורוד והגדולות בכחול. סובב את הישר החותך בעזרת העיגול העליון.",
        task: "סובב כך שכל אחת מהזוויות הגדולות תהיה 125°.",
        demo: L => { L.state.th = 55; L.act({ type: "drop" }); },
        check: dropIf(S => S.th === 55 || S.th === 125, S => S.th === 90 ? "כרגע כל הזוויות ישרות. הטה את הישר." : `הגדולות עכשיו ${Math.max(S.th, 180 - S.th)}°. ${Math.max(S.th, 180 - S.th) > 125 ? "הן גדולות מדי: העמד את הישר זקוף יותר." : "הן קטנות מדי: השכב את הישר יותר."}`),
        ok: `הגדולות 125° והקטנות 55°. בכל מצב יש רק שני גדלים, <b>קטנה + גדולה = 180°</b>.` },
      { ch: 2, setup: L => { Object.assign(L.state, { th: 60, tilt: -7, drag: false, note: G.he(600, 362, "הישר התחתון הוטה ב־7° בלבד", "w", "right") }); },
        say: "הטינו את b ב־7° בלבד. בעין הוא עדיין נראה כמעט מקביל, אבל הזוויות למטה כבר אינן שוות לזוויות למעלה.",
        task: "בשאלת מבחן שני ישרים 'נראים' מקבילים. מתי מותר להשתמש בכלל קטנה = קטנה?",
        choices: ["תמיד, אם הם נראים מקבילים בשרטוט", "רק אם נתון במפורש שהם מקבילים", "רק אם הזוויות נראות שוות בשרטוט"],
        check: pick(1, { 0: "תסתכל על הלוח: b נראה כמעט מקביל, ובכל זאת 60° הפכה ל־67°. השרטוט במבחן אינו בהכרח מדויק.", 2: "גם 60° ו־67° 'נראות' דומות בעין. אי אפשר לסמוך על המראה." }),
        ok: "מקבילות חייבת להיות <b>נתונה</b> (במילים, או בסימון חצים על הישרים). בלי זה, הכלל לא תקף." },
      // ---- ch3: break between parallels ----
      { ch: 3, setup: L => { L.state = { mode: "zig", ta: 25, tb: 50, c: false, drag: false, hideP: true }; },
        say: "שוב שני ישרים מקבילים, a ו־b. מ־A ומ־B יוצאים שני קטעים שנפגשים בנקודה P שביניהם, כמו 'שבירה'.",
        task: `לפני שנבדוק: כמה לדעתך ${m("∢APB")}?`, choices: ["25°", "75°", "105°", "130°"],
        check: (L, e) => { if (e.type !== "choice") return null; L.memo.zig = e.j; return true; },
        ok: L => L.memo.zig === 1 ? "בוא נבדוק אם צדקת." : "בוא נבדוק את זה על הלוח." },
      { ch: 3, say: "הטריק של הקורס: מעבירים דרך P ישר שלישי, c, שמקביל ל־a ול־b.",
        task: "לחץ על 'העבר ישר מקביל דרך P'.",
        tools: () => [["העבר ישר מקביל דרך P", L => { L.state.c = true; L.act({ type: "c" }); }, true]],
        demo: L => { L.state.c = true; L.act({ type: "c" }); },
        check: (L, e) => e.type === "c" ? true : null,
        ok: L => (L.memo.zig === 1 ? "צדקת! " : "") + `הישר c חילק את ${m("∢APB")} לשני חלקים. החלק העליון הוא זווית קטנה בין המקבילים a ו־c, ולכן הוא 25°, כמו ב־A. החלק התחתון הוא 50°, כמו ב־B. ביחד: <b>75°</b>.` },
      { ch: 3, setup: L => { Object.assign(L.state, { drag: true, hideP: false }); },
        say: `עכשיו אפשר לגרור את P. הזוויות ב־A וב־B משתנות, ו־${m("∢APB")} תמיד שווה לסכומן.`,
        task: `גרור את P כך ש־${m("∢APB")} תהיה 90°.`,
        demo: L => { Object.assign(L.state, { ta: 40, tb: 50 }); L.act({ type: "drop" }); },
        check: dropIf(S => S.ta + S.tb === 90, S => `עכשיו ${m(`∢APB = ${S.ta}° + ${S.tb}° = ${S.ta + S.tb}°`)}. ${S.ta + S.tb > 90 ? "גדול מדי: משוך את P ימינה, הרחק מ־A ומ־B." : "קטן מדי: קרב את P אל A ואל B."}`),
        ok: L => `${m(`${L.state.ta}° + ${L.state.tb}° = 90°`)}. כל צירוף שסכומו 90° מתאים. זה כלל ה<b>שבירה</b>: זווית השבירה שווה לסכום שתי הזוויות שבקצוות.` },
      // ---- ch4: triangle exterior angle ----
      { ch: 4, setup: L => { L.state = { mode: "tri", al: 50, be: 60, ext: false }; },
        say: "משולש. אפשר לגרור את הקודקוד C, והזוויות משתנות. הסכום שלהן מוצג למעלה.",
        task: "גרור את C כך שהזווית בקודקוד C תהיה 100°.",
        demo: L => { Object.assign(L.state, { al: 40, be: 40 }); L.act({ type: "drop" }); },
        check: dropIf(S => 180 - S.al - S.be === 100, S => { const g = 180 - S.al - S.be; return g < 100 ? `הזווית ב־C היא ${g}°. כדי להגדיל אותה, הורד את C למטה, קרוב לבסיס.` : `הזווית ב־C היא ${g}°. הרם את C קצת למעלה.`; }),
        ok: "הזווית ב־C גדלה, ושתי האחרות קטנו. אבל הסכום תמיד <b>180°</b>." },
      { ch: 4, setup: L => { Object.assign(L.state, { ext: true, extQ: true }); },
        say: "המשכנו את הצלע AB מעבר ל־B. הזווית החדשה (בכתום) נקראת <b>זווית חיצונית</b>.",
        task: "לפני שנחשוף: למה היא שווה?", choices: ["לזווית הצמודה לה, שב־B", "לסכום שתי הזוויות הרחוקות, A ו־C", "ל־180° פחות הזווית שב־A"],
        check: (L, e) => { if (e.type !== "choice") return null; if (e.j === 1) { L.state.extQ = false; L.render(); return true; }
          return e.j === 0 ? "היא צמודה לזווית שב־B, ולכן יחד הן 180°. הן שוות רק כששתיהן 90°." : "180° פחות A זה בדיוק B + C. אבל הזווית החיצונית צמודה ל־B, לא ל־A."; },
        ok: `הזווית החיצונית היא ${m("180° − B")}, וגם ${m("A + C = 180° − B")}. לכן <b>זווית חיצונית = סכום שתי הפנימיות הרחוקות</b>. הנוסחה מוצגת עכשיו למעלה.` },
      { ch: 4, say: "בדוק את זה בידיים.", task: "גרור את C כך שהזווית החיצונית ב־B תהיה 130°.",
        demo: L => { Object.assign(L.state, { al: 60, be: 50 }); L.act({ type: "drop" }); },
        check: dropIf(S => S.be === 50, S => `הזווית החיצונית עכשיו ${180 - S.be}°. ${180 - S.be > 130 ? "כדי להקטין אותה, הגדל את הזווית הפנימית ב־B: הזז את C ימינה." : "כדי להגדיל אותה, הקטן את הזווית הפנימית ב־B: הזז את C שמאלה."}`),
        ok: L => `${m(`${L.state.al}° + ${180 - L.state.al - L.state.be}° = 130°`)}. בכל משולש שתגרור, הזווית החיצונית שווה לסכום הזוויות שב־A וב־C.` },
      { ch: 4, say: "עכשיו בלי לוח.", task: "במשולש שתי זוויות הן 40° ו־65°. כמה היא הזווית החיצונית הצמודה לזווית של 65°?",
        choices: ["75°", "105°", "115°", "140°"],
        check: pick(2, { 0: "75° היא הזווית השלישית במשולש. הזווית החיצונית גדולה ממנה.", 1: `${m("40° + 65°")}: חיברת את הזווית הצמודה עצמה. צריך לחבר את שתי הזוויות <b>הרחוקות</b>.`, 3: `${m("140° = 180° − 40°")}. אבל הזווית החיצונית צמודה לזווית 65°, לא ל־40°.` }),
        ok: `הזווית השלישית: ${m("180 − 40 − 65 = 75°")}. החיצונית ליד 65° שווה ל־${m("40° + 75° = 115°")}. או בקיצור: ${m("180° − 65° = 115°")}.` },
      // ---- ch5: exam ----
      { ch: 5, setup: L => { L.state = { mode: "zig", ta: 32, tb: 64, c: false, drag: false, labels: { a: "x", b: "2x", p: "96°" } }; },
        say: "שאלה ברמת מבחן.", task: `a ו־b מקבילים, והנקודה P ביניהם. הזווית ב־A היא x, הזווית ב־B היא 2x, ו־${m("∢APB = 96°")}. מה x?`,
        choices: ["24°", "32°", "48°", "64°"],
        check: pick(1, { 0: `${m("4x = 96")} נותן 24. אבל יש כאן x ועוד 2x. כמה זה ביחד?`, 2: "48 הוא חצי מ־96, אבל שני החלקים לא שווים: אחד x והשני 2x.", 3: "64° היא הזווית 2x. השאלה שואלת על x." }),
        ok: `כלל השבירה: ${m("x + 2x = 96°")}, כלומר ${m("3x = 96°")} ו־${m("x = 32°")}.` },
      { ch: 5, say: `<b>סיכום ההמחשה:</b><br>1. צמודות משלימות ל־180°, קודקודיות שוות, וסביב נקודה 360°.<br>2. בין מקבילים יש רק 'קטנה' ו'גדולה': קטנה = קטנה, וקטנה + גדולה = 180°. רק אם המקבילות נתונה!<br>3. שבירה בין מקבילים: מעבירים ישר מקביל דרך נקודת השבירה, והזווית = סכום הזוויות בקצוות.<br>4. במשולש הסכום 180°, וזווית חיצונית = סכום שתי הרחוקות.`, next: "סיום ההמחשה" },
    ],
  });
})();
