/* Lab: ביטויים, כפל מקוצר והצבת מספרים — algebra tiles in rows (common factor), number line a/b (opposites),
   area models ((a+b)², a²−b²), substitution machine (plug numbers, eliminate answers). */
(function () {
  const { G } = Lab;
  const m = s => `<bdi dir="ltr"${String(s).length <= 26 ? ' style="white-space:nowrap"' : ""}>${s}</bdi>`;
  const neg = v => v < 0 ? "−" + (-v) : String(v);
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");

  // ---------- tiles (common factor) ----------
  const SLX = k => 120 + (k - 1) * 55;   // slider 1..8
  function drawTiles(S) {
    const k = S.k, ok = 8 % k === 0 && 12 % k === 0, tiles = [];
    for (let i = 0; i < 8; i++) tiles.push("x"); for (let i = 0; i < 12; i++) tiles.push("y");
    let rows = [];
    if (ok) for (let r = 0; r < k; r++) rows.push([...Array(8 / k).fill("x"), ...Array(12 / k).fill("y")]);
    else { const per = Math.ceil(20 / k); for (let i = 0; i < 20; i += per) rows.push(tiles.slice(i, i + per)); }
    const per = Math.max(...rows.map(r => r.length)), tw = Math.min(44, 500 / per - 4), th = Math.min(40, 210 / rows.length - 6);
    let h = "";
    rows.forEach((row, r) => {
      const y = 50 + r * (th + 6), x0 = 310 - (per * (tw + 4)) / 2;
      row.forEach((t, i) => { const x = x0 + i * (tw + 4); h += G.rect(x, y, tw, th, t === "x" ? "fblue-soft" : "fsoft", { rx: 4 }) + (th >= 18 && tw >= 16 ? G.t(x + tw / 2, y + th / 2 + 5, t, "b") : ""); });
    });
    const expr = k === 1 ? "8x + 12y" : ok ? `${k}(${8 / k === 1 ? "" : 8 / k}x + ${12 / k}y)` : "";
    if (ok) h += G.t(310, 290, expr, "a"); else h += G.he(310, 290, "השורות לא זהות", "w");
    h += G.line(SLX(1), 326, SLX(8), 326, "mut");
    for (let i = 1; i <= 8; i++) h += G.line(SLX(i), 320, SLX(i), 332, "mut");
    h += G.he(SLX(1) - 26, 331, "שורות:", "m", "right") + G.t(SLX(8) + 26, 331, k, "b");
    return h + G.knob(SLX(k), 326, "k", 15);
  }
  // ---------- boxes: a(x+5) + 3(x+5) ----------
  function drawBoxes(S) {
    let h = G.rect(140, 90, 250, 150, "fblue-soft") + G.rect(390, 90, 90, 150, "fsoft");
    h += G.t(265, 172, "a(x + 5)", "b") + G.t(435, 172, "3(x + 5)", "b");
    h += G.t(265, 80, "a", "m") + G.t(435, 80, "3", "m") + G.t(120, 170, "x + 5", "m", "end");
    if (S.done) h += G.line(140, 262, 480, 262, "sa") + G.t(310, 290, "a + 3", "a") + G.t(310, 330, "(x + 5)(a + 3)", "big");
    return h;
  }
  // ---------- number line a, b ----------
  const AX = v => 60 + v * 50;
  function drawNline(S) {
    const { a, b } = S; let h = G.line(40, 240, 580, 240, "ink");
    for (let v = 0; v <= 10; v++) h += G.line(AX(v), 234, AX(v), 246, "ink") + G.t(AX(v), 270, v, "m");
    if (a !== b) {
      h += G.arrow(AX(b), 170, AX(a), 170, "sa") + G.t((AX(a) + AX(b)) / 2, 160, "a − b = " + neg(a - b), "a");
      h += G.arrow(AX(a), 110, AX(b), 110, "sblue") + G.t((AX(a) + AX(b)) / 2, 100, "b − a = " + neg(b - a), "blue");
      h += G.line(AX(a), 110, AX(a), 226, "dash") + G.line(AX(b), 110, AX(b), 226, "dash");
      h += G.t(310, 330, `(a − b) / (b − a) = ${neg(a - b)} / ${neg(b - a)} = −1`, "b");
    } else h += G.he(310, 330, "a = b: המכנה b − a שווה 0, ואסור לחלק ב־0", "w");
    h += G.knob(AX(a), 240, "a", 15) + G.knob(AX(b), 240, "b", 15);
    h += G.t(AX(a), 296, "a", "a") + G.t(AX(b), 296, "b", "blue");
    return h;
  }
  // ---------- square (a+b)² ----------
  function drawSq(S) {
    const x0 = 60, y0 = 50, A = 150, B = 90; let h = "";
    const N = S.gen ? { a: "x", b: "y", a2: "x²", ab: "xy", b2: "y²", ta: "x", tb: "y" } : { a: "a", b: "b", a2: "a² = 25", ab: "ab = 15", b2: "b² = 9", ta: "a = 5", tb: "b = 3" };
    h += G.t(x0 + A / 2, y0 - 12, N.ta, "m") + G.t(x0 + A + B / 2, y0 - 12, N.tb, "m");
    h += G.t(x0 - 10, y0 + A / 2 + 5, N.a, "m", "end") + G.t(x0 - 10, y0 + A + B / 2 + 5, N.b, "m", "end");
    if (!S.split) {
      h += G.rect(x0, y0, A + B, A + B, "bg") + G.t(x0 + (A + B) / 2, y0 + (A + B) / 2 + 6, "(a + b)²", "big");
    } else {
      const reg = [["a2", x0, y0, A, A, N.a2], ["ab1", x0 + A, y0, B, A, N.ab], ["ab2", x0, y0 + A, A, B, N.ab], ["b2", x0 + A, y0 + A, B, B, N.b2]];
      reg.forEach(([k, x, y, w, hh, lab]) => {
        const isAb = k.startsWith("ab"), on = S.tapped[k];
        const cls = isAb ? (on ? "fa" : "box hot") : "fblue-soft hot";
        h += G.tap(G.rect(x, y, w, hh, cls), k);
        const txt = isAb ? (on || S.reveal ? lab : "?") : lab;
        h += G.t(x + w / 2, y + hh / 2 + 6, txt, on ? "inv" : "b", "middle", { "pointer-events": "none" });
      });
    }
    const px = 600; let y = 90;
    for (const [txt, cls] of S.panel || []) { h += G.t(px, y, txt, cls, "end"); y += 40; }
    return h;
  }
  // ---------- difference of squares ----------
  const DQ = { x0: 60, y0: 50, A: 200, B: 80 };
  function drawDos(S) {
    const { x0, y0, A, B } = DQ, C = A - B; let h = "";
    // top part a × (a−b)
    h += G.rect(x0, y0, A, C, "fblue-soft");
    h += G.t(x0 + A / 2, y0 - 12, "a", "m");
    if (!S.cut) {
      h += G.rect(x0, y0 + C, A, B, "fblue-soft") + G.rect(x0, y0, A, A, "ink", { "pointer-events": "none" });
      h += G.tap(G.rect(x0 + C, y0 + C, B, B, "fwarn hot"), "corner") + G.t(x0 + C + B / 2, y0 + C + B / 2 + 6, "b²", "w", "middle", { "pointer-events": "none" });
      h += G.t(x0 - 10, y0 + A / 2 + 5, "a", "m", "end");
      h += G.t(450, 150, "a²", "big");
    } else {
      if (!S.placed) h += G.rect(x0 + C, y0 + C, B, B, "ghost");
      h += G.t(x0 - 10, y0 + C / 2 + 5, "a − b", "m", "end");
      if (S.placed) {
        h += G.rect(x0 + A, y0, B, C, "fsoft") + G.t(x0 + A + B / 2, y0 + C / 2 + 5, "b", "m");
        h += G.line(x0, y0 + C + 14, x0 + A + B, y0 + C + 14, "sa") + G.t(x0 + (A + B) / 2, y0 + C + 38, "a + b", "a");
        h += G.t(x0 + A + B + 12, y0 + C / 2 + 5, "a − b", "a", "start");
      } else {
        if (S.target) h += G.rect(x0 + A, y0, B, C, "ghost", { rx: 2 });
        const sx = x0 + (S.dx || 0), sy = y0 + C + (S.dy || 0);
        h += G.rect(sx, sy, C, B, "fsoft", { style: "cursor:grab" }) + G.t(sx + C / 2, sy + B / 2 + 5, "(a−b)·b", "b", "middle", { "pointer-events": "none" });
        if (!S.dx && !S.dy) h += G.t(x0 + C / 2, y0 + A + 22, "a − b", "m") + G.t(x0 + C + 10, y0 + C + B / 2 + 5, "b", "m", "start");
      }
      h += G.t(480, 300, S.placed ? "(a + b)(a − b)" : "a² − b²", "big");
    }
    return h;
  }
  // ---------- substitution machine ----------
  const SX = v => 150 + (v + 3) * 50;  // x: −3..4
  const CARDS = [["4x", x => 4 * x], ["8x", x => 8 * x], ["16", () => 16], ["x² + 16", x => x * x + 16]];
  const Q = x => (x + 2) ** 2 - (x - 2) ** 2;
  function drawSub(S) {
    let h = G.line(SX(-3), 60, SX(4), 60, "ink");
    for (let v = -3; v <= 4; v++) h += G.line(SX(v), 54, SX(v), 66, "ink") + G.t(SX(v), 92, neg(v), (S.tried || []).includes(v) ? "a" : "m");
    h += G.t(SX(-3) - 30, 66, "x", "b", "end") + G.knob(SX(S.x), 60, "x", 15);
    h += G.rect(110, 112, 400, 50, "bg", { rx: 10 }) + G.t(310, 144, `(x + 2)² − (x − 2)² = ${neg(Q(S.x))}`, "b");
    CARDS.forEach(([lab, f], i) => {
      const x = 22 + i * 146, y = 196, v = f(S.x), dead = S.elim[i], match = v === Q(S.x);
      h += G.rect(x, y, 132, 86, dead ? "ghost" : match ? "fok-soft" : "box", { rx: 10 });
      h += G.t(x + 66, y + 32, lab, dead ? "m" : "b") + G.t(x + 66, y + 64, "= " + neg(v), dead ? "m" : match ? "ok" : "");
      if (dead) h += G.line(x + 10, y + 10, x + 122, y + 76, "mut");
    });
    const left = S.elim.filter(e => !e).length;
    h += G.he(310, 330, left === 1 ? "נשארה תשובה אחת" : `נשארו ${left} תשובות`, left === 1 ? "ok" : "m");
    return h;
  }

  function draw(L) {
    const S = L.state;
    return ({ tiles: drawTiles, boxes: drawBoxes, nline: drawNline, sq: drawSq, dos: drawDos, sub: drawSub }[S.kind] || (() => ""))(S);
  }
  function drag(L, key, pt, phase) {
    const S = L.state;
    if (key === "k") S.k = Math.max(1, Math.min(8, Math.round((pt.x - 120) / 55) + 1));
    else if (key === "a" || key === "b") S[key] = Math.max(0, Math.min(10, Math.round((pt.x - 60) / 50)));
    else if (key === "x") {
      S.x = Math.max(-3, Math.min(4, Math.round((pt.x - 150) / 50) - 3));
      if (phase === "end" && !(S.only0 && S.x !== 0)) { CARDS.forEach(([, f], i) => { if (f(S.x) !== Q(S.x)) S.elim[i] = true; }); if (!S.tried.includes(S.x)) S.tried.push(S.x); }
    } else if (key === "strip") {
      const { x0, y0, A, B } = DQ, C = A - B;
      if (phase === "start") { S.gx = pt.x - (x0 + (S.dx || 0)); S.gy = pt.y - (y0 + C + (S.dy || 0)); }
      S.dx = pt.x - S.gx - x0; S.dy = pt.y - S.gy - y0 - C;
      if (phase === "end") {
        const cx = x0 + S.dx + C / 2, cy = y0 + C + S.dy + B / 2;   // strip centre
        if (Math.hypot(cx - (x0 + A + B / 2), cy - (y0 + C / 2)) < 90) S.placed = true; else { S.dx = 0; S.dy = 0; }
      }
    }
  }
  function dragFrom(L, pt) {
    const S = L.state;
    if (S.kind === "tiles" && pt.y > 300) return "k";
    if (S.kind === "sub" && pt.y < 100) return "x";
    if (S.kind === "dos" && S.cut && !S.placed && S.target) {
      const { x0, y0, A, B } = DQ, C = A - B, sx = x0 + (S.dx || 0), sy = y0 + C + (S.dy || 0);
      if (pt.x > sx - 10 && pt.x < sx + C + 10 && pt.y > sy - 10 && pt.y < sy + B + 10) return "strip";
    }
    return null;
  }
  function tap(L, key) {
    const S = L.state;
    if (S.kind === "sq") { L.memo.lastTap = key; if (key.startsWith("ab")) S.tapped[key] = !S.tapped[key]; }
    if (S.kind === "dos" && key === "corner") S.cut = true;
  }

  Lab.register({
    id: "alg-expressions", title: "מעבדת ביטויים", viewBox: "0 0 620 360",
    chapters: ["גורם משותף", "נגדיים", "ריבוע של סכום", "הפרש ריבועים", "הצבת מספרים", "שאלת מבחן"],
    draw, drag, dragFrom, tap,
    steps: [
      // ---------- ch0 ----------
      { ch: 0, setup: L => { L.state = { kind: "tiles", k: 1 }; },
        say: `אלה האריחים של הביטוי ${m("8x + 12y")}: שמונה אריחי x ושנים־עשר אריחי y. להוציא גורם משותף פירושו לסדר את האריחים בשורות זהות.`,
        task: "גרור את הידית שלמטה וסדר את האריחים בכמה שיותר שורות זהות.",
        demo: L => { L.state.k = 4; L.act({ type: "drop", key: "k" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const k = L.state.k;
          if (k === 4) return true;
          if (k === 2) return "השורות זהות, אבל אפשר לחלק ליותר שורות.";
          if (k === 1) return "שורה אחת תמיד אפשרית. נסה יותר שורות.";
          return `ב־${k} שורות האריחים לא מתחלקים שווה, והשורות לא זהות.`; },
        ok: `4 שורות זהות, ובכל אחת ${m("2x + 3y")}. לכן ${m("8x + 12y = 4(2x + 3y)")}. הגורם המשותף, 4, הוא מספר השורות.` },
      { ch: 0, setup: L => { L.state = { kind: "boxes", done: false }; },
        say: `גם סוגריים שלמים יכולים להיות גורם משותף. בשני המלבנים יש אותו גובה: ${m("(x + 5)")}.`,
        task: `${m("a(x + 5) + 3(x + 5) = ?")}`, choices: [m("(x + 5)(a + 3)"), m("3a(x + 5)"), m("(a + 3)(2x + 10)"), m("a + 3 + x + 5")],
        check: (L, e) => { const r = pick(0, { 1: "לא כופלים את a ב־3. הרוחב הכולל של המלבנים הוא a ועוד 3.", 2: `הגובה של המלבן הגדול הוא ${m("x + 5")} אחד, לא פעמיים.`, 3: "שטח מלבן הוא כפל, לא חיבור." })(L, e); if (r === true) L.state.done = true; return r; },
        ok: L => { L.render(); return `${m("(x + 5)")} מופיע בשני האיברים, אז מוציאים אותו כמו מספר: ${m("(x + 5)(a + 3)")}. מלבן אחד: גובה ${m("x + 5")}, רוחב ${m("a + 3")}.`; } },

      // ---------- ch1 ----------
      { ch: 1, setup: L => { L.state = { kind: "nline", a: 2, b: 7 }; },
        say: `${m("a − b")} ו־${m("b − a")} הם אותו מרחק בין שתי הנקודות, אבל בכיוונים הפוכים. החץ הוורוד הוא ${m("a − b")}.`,
        task: `גרור את הנקודות כך ש־${m("a − b = 4")}.`,
        demo: L => { L.state.a = 6; L.state.b = 2; L.act({ type: "drop", key: "a" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const { a, b } = L.state;
          if (a - b === 4) return true;
          if (b - a === 4) return `הפוך: ${m("a − b")} חיובי רק כש־a מימין ל־b.`;
          return `עכשיו ${m("a − b = " + neg(a - b))}. צריך מרחק 4, ו־a מימין ל־b.`; },
        ok: `${m("a − b = 4")} ו־${m("b − a = −4")}. שים לב לשורה התחתונה: בכל מיקום ${m("(a − b) / (b − a) = −1")}.` },
      { ch: 1, say: "עכשיו נשתמש בזה.", task: `${m("(6x − 6y) / (3y − 3x) = ?")}`, choices: [m("2"), m("−2"), m("−1/2"), m("3")],
        check: pick(1, { 0: `שים לב: ${m("x − y")} ו־${m("y − x")} הפוכים זה לזה.`, 2: `${m("6 / 3 = 2")}, לא 1/2.`, 3: "הוצא 6 מהמונה ו־3 מהמכנה, ואז השווה את הסוגריים." }),
        ok: `${m("6(x − y) / 3(y − x) = 2 · (−1) = −2")}.` },

      // ---------- ch2 ----------
      { ch: 2, setup: L => { L.state = { kind: "sq", split: false, tapped: {}, panel: [] }; },
        say: `זה ריבוע שהצלע שלו ${m("a + b")}, עם ${m("a = 5")} ו־${m("b = 3")}.`,
        task: `לפני שנפתח אותו: ${m("(5 + 3)²")} לעומת ${m("5² + 3²")}?`,
        choices: ["שווים", `${m("(5 + 3)²")} גדול יותר`, `${m("5² + 3²")} גדול יותר`],
        check: (L, e) => { if (e.type !== "choice") return null; L.memo.guess = e.j; return true; },
        ok: "נחתוך את הריבוע ונראה." },
      { ch: 2, setup: L => { Object.assign(L.state, { split: true, panel: [["(a + b)² = 8² = 64", "b"], ["a² + b² = 25 + 9 = 34", "b"]] }); L.memo.lastTap = null; },
        say: `הריבוע מורכב מ־4 חלקים. ${m("a²")} ו־${m("b²")} צבועים בכחול.`,
        task: `לחץ על החלקים של הריבוע שלא נכללים ב־${m("a² + b²")}.`,
        demo: L => { L.state.tapped = { ab1: true, ab2: true }; L.act({ type: "tap", key: "ab1" }); },
        check: (L, e) => { if (e.type !== "tap") return null;
          if (e.key === "a2" || e.key === "b2") return `זה כבר נספר ב־${m("a² + b²")}. חפש את מה ששכחו.`;
          const t = L.state.tapped; return t.ab1 && t.ab2 ? true : null; },
        ok: L => { L.state.reveal = true; L.state.panel.push(["a² + 2ab + b²", "a"], ["= 25 + 30 + 9 = 64", "a"]); L.render();
          return (L.memo.guess === 1 ? "צדקת. " : "") + `שני מלבנים של ${m("ab = 15")} נעלמים ב־${m("a² + b²")}. לכן <b>${m("(a + b)² = a² + 2ab + b²")}</b>.`; } },
      { ch: 2, say: `באותו אופן: ${m("(a − b)² = a² − 2ab + b²")}.`, task: `${m("(x − 4)² = ?")}`,
        choices: [m("x² − 16"), m("x² − 8x + 16"), m("x² − 8x − 16"), m("x² + 16")],
        check: pick(1, { 0: `זה ${m("(x + 4)(x − 4)")}. בריבוע חסר האיבר האמצעי ${m("−2·4·x")}.`, 2: `${m("(−4)² = +16")}: ריבוע תמיד חיובי.`, 3: `שכחת את האיבר האמצעי ${m("−2ab = −8x")}.` }),
        ok: `${m("x² − 2·4·x + 4² = x² − 8x + 16")}.` },

      // ---------- ch3 ----------
      { ch: 3, setup: L => { L.state = { kind: "dos", cut: false, placed: false, target: false, dx: 0, dy: 0 }; },
        say: `ריבוע בצלע a, כלומר שטח ${m("a²")}. בפינה מסומן ריבוע קטן בצלע b.`,
        task: `לחץ על הריבוע הקטן ${m("b²")} כדי לגזור אותו.`,
        demo: L => { L.state.cut = true; L.act({ type: "tap", key: "corner" }); },
        check: (L, e) => e.type === "tap" && e.key === "corner" ? true : null,
        ok: `השטח שנשאר הוא ${m("a² − b²")}. עכשיו נסדר אותו מחדש.` },
      { ch: 3, setup: L => { L.state.target = true; },
        say: "הרצועה התחתונה (הוורודה) היא באורך a − b ובגובה b.",
        task: "גרור את הרצועה אל המסגרת המקווקוות שמימין.",
        demo: L => { L.state.placed = true; L.act({ type: "drop", key: "strip" }); },
        check: (L, e) => { if (e.type !== "drop") return null; return L.state.placed ? true : "קרב את הרצועה עוד למסגרת המקווקוות, מימין לחלק הכחול."; },
        ok: `אותו שטח, אבל עכשיו זה מלבן: רוחב ${m("a + b")}, גובה ${m("a − b")}. לכן <b>${m("a² − b² = (a + b)(a − b)")}</b>.` },
      { ch: 3, say: "הנוסחה הזאת מופיעה בבחינה גם \"מוסווית\" כתרגיל חשבון. חפש שני מספרים סימטריים סביב מספר עגול.",
        task: `${m("52 · 48 = ?")}`, choices: ["2,496", "2,504", "2,500", "2,396"],
        check: pick(0, { 1: `הפכת סימן: ${m("a² − b²")}, לא ${m("a² + b²")}.`, 2: `שכחת להחסיר את ${m("b² = 4")}.`, 3: `${m("50² = 2,500")}, ו־${m("2² = 4")}. בדוק את החיסור.` }),
        ok: `${m("52 = 50 + 2")} ו־${m("48 = 50 − 2")}. לכן ${m("50² − 2² = 2,500 − 4 = 2,496")}.` },

      // ---------- ch4 ----------
      { ch: 4, setup: L => { L.state = { kind: "sub", x: 3, elim: [false, false, false, false], tried: [], only0: true }; },
        say: `השאלה: ${m("(x + 2)² − (x − 2)² = ?")} והתשובות כתובות ב־x. במקום לפתח, מציבים מספר בשאלה ובכל תשובה, ופוסלים כל תשובה שלא יוצאת שווה.`,
        task: "נתחיל מהמספר הכי נוח: גרור את x ל־0.",
        demo: L => { L.state.x = 0; drag(L, "x", { x: SX(0), y: 60 }, "end"); L.act({ type: "drop", key: "x" }); },
        check: (L, e) => e.type !== "drop" ? null : L.state.x === 0 ? true : "גרור בדיוק ל־0.",
        ok: `עם ${m("x = 0")} השאלה שווה 0. נפסלו 16 ו־${m("x² + 16")}, אבל 4x ו־8x נותנות שתיהן 0. אסור לסמן עדיין! <b>כלל ברזל: פוסלים שלוש לפני שמסמנים.</b>` },
      { ch: 4, setup: L => { L.state.only0 = false; },
        say: "0 ו־1 נוחים, אבל לפעמים כמה תשובות יוצאות שוות. אז מציבים שוב.",
        task: "גרור את x למספר אחר, עד שנשארת רק תשובה אחת.",
        demo: L => { L.state.x = 1; drag(L, "x", { x: SX(1), y: 60 }, "end"); L.act({ type: "drop", key: "x" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const left = L.state.elim.filter(v => !v).length;
          if (left === 1) return true;
          return L.state.x === 0 ? "את 0 כבר בדקת. נסה מספר אחר." : `עדיין נשארו ${left} תשובות. נסה מספר נוסף.`; },
        ok: L => `עם ${m("x = " + neg(L.state.x))} השאלה שווה ${m(neg(Q(L.state.x)))}, ורק 8x מתאימה. בדיקה: ${m("(x² + 4x + 4) − (x² − 4x + 4) = 8x")}.` },
      { ch: 4, say: "זהירות כשמציבים מספר שלילי.", task: `מציבים ${m("a = −3")}. כמה זה ${m("−a²")}?`, choices: [m("−9"), m("9"), m("6"), m("−6")],
        check: pick(0, { 1: `המינוס שלפני a לא נכנס לריבוע. קודם ${m("a² = 9")}, ורק אחר כך המינוס.`, 2: `${m("a²")} זה a כפול a, לא 2 כפול a.`, 3: `${m("a²")} זה a כפול a, לא 2 כפול a.` }),
        ok: `${m("−a² = −(−3)² = −9")}. החזקה קודמת למינוס שלפניה. מציבים שלילי תמיד בתוך סוגריים.` },
      { ch: 4, say: "ובביטוי עם שברים?", task: `${m("x/2 + x/3 = ?")}`, choices: [m("5x/6"), m("x/5"), m("5x"), m("2x/5")],
        check: pick(0, { 1: `לא מחברים מכנים. הצב ${m("x = 6")}: ${m("3 + 2 = 5")}. מה יוצא כאן?`, 2: `זה ביטול מכנה. מותר רק במשוואה, לא בביטוי. הצב ${m("x = 6")} ובדוק.`, 3: `לא מחברים מכנים. הצב ${m("x = 6")}: ${m("3 + 2 = 5")}. מה יוצא כאן?` }),
        ok: `מכנה משותף 6: ${m("3x/6 + 2x/6 = 5x/6")}. בביטוי <b>לא מבטלים</b> את המכנה. בדיקה עם ${m("x = 6")}: ${m("3 + 2 = 5")}, וגם ${m("5·6/6 = 5")}.` },

      // ---------- ch5 ----------
      { ch: 5, setup: L => { L.state = { kind: "sq", gen: true, split: true, reveal: true, tapped: {}, panel: [["(x + y)² = x² + 2xy + y²", "b"], ["(x − y)² = x² − 2xy + y²", "b"]] }; },
        say: "שאלה ברמת מבחן. אפשר לפתוח לפי הנוסחאות, ואפשר להציב.",
        task: `${m("(x − y)² + 4xy = ?")}`, choices: [m("(x + y)²"), m("x² + y²"), m("(x − y)²"), m("x² + 4xy + y²")],
        check: pick(0, { 1: `פתח: ${m("(x − y)² = x² − 2xy + y²")}. עכשיו הוסף 4xy.`, 2: `הוספת 4xy, אז הביטוי השתנה. הצב ${m("x = 2, y = 1")} ובדוק.`, 3: `${m("−2xy + 4xy = 2xy")}, לא 4xy.` }),
        ok: `${m("x² − 2xy + y² + 4xy = x² + 2xy + y² = (x + y)²")}. בהצבה ${m("x = 2, y = 1")}: ${m("1 + 8 = 9 = 3²")}.` },
      { ch: 5, say: "<b>סיכום המעבדה:</b><br>1. גורם משותף = לסדר בשורות זהות. גם סוגריים שלמים יכולים להיות הגורם.<br>2. " + m("(a − b)/(b − a) = −1") + ".<br>3. " + m("(a ± b)² = a² ± 2ab + b²") + ", ו־" + m("a² − b² = (a + b)(a − b)") + ". אל תשכח את 2ab.<br>4. הצבת מספרים: מציבים בשאלה ובכל תשובה, ופוסלים שלוש לפני שמסמנים.", next: "סיום המעבדה" },
    ],
  });
})();
