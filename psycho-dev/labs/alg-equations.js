/* Lab: משוואות ומערכות — balance scale (isolating x, identity vs contradiction), equation rows (add/subtract to get an expression),
   value columns with an x slider (product = 0, ± roots). */
(function () {
  const { G } = Lab;
  const m = s => `<bdi dir="ltr"${String(s).length <= 26 ? ' style="white-space:nowrap"' : ""}>${s}</bdi>`;
  const neg = v => v < 0 ? "−" + (-v) : String(v);
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const PX = 310, PY = 110, HL = 200, SLY = 352;
  const SV = v => 170 + v * 40;            // weight slider 0..8

  // ---------- scale ----------
  const weight = (s, xv) => s.w ? s.w(xv) : s.x * xv + s.u;
  const sideText = s => s.text || (s.x || s.u ? (s.x ? (s.x === 1 ? "x" : s.x + "x") : "") + (s.x && s.u ? " + " : "") + (s.u ? s.u : "") : "0");
  function pan(cx, ey, s, key, tapOn) {
    const py = ey + 150; let h = G.line(cx, ey, cx - 92, py, "mut") + G.line(cx, ey, cx + 92, py, "mut");
    h += G.rect(cx - 100, py, 200, 8, "bg", { rx: 3 });
    if (s.lab) return h + G.rect(cx - 92, py - 46, 184, 40, "fsoft", { rx: 8 }) + G.t(cx, py - 20, s.lab, "b");
    const rows = s.rows || (() => { const it = [...Array(s.x).fill("x"), ...Array(s.u).fill("u")], r = []; for (let i = 0; i < it.length; i += 5) r.push(it.slice(i, i + 5)); return r; })();
    rows.forEach((row, r) => {
      const y = py - 36 * (r + 1), x0 = cx - (row.length * 36 - 4) / 2;
      if (s.bundle) h += G.rect(x0 - 5, y - 2, row.length * 36 + 6, 36, "ghost", { rx: 6 });
      row.forEach((t, i) => {
        const x = x0 + i * 36, el = t === "x" ? G.rect(x, y, 32, 32, "fblue-soft" + (tapOn ? " hot" : ""), { rx: 3 }) : G.rect(x, y, 32, 32, "fsoft" + (tapOn ? " hot" : ""), { rx: 16 });
        h += tapOn ? G.tap(el, key + ":" + t) : el;
        h += G.t(x + 16, y + 22, t === "x" ? "x" : "1", t === "x" ? "b" : "", "middle", { "pointer-events": "none" });
      });
    });
    return h;
  }
  function drawScale(S) {
    const wL = weight(S.L, S.xv), wR = weight(S.R, S.xv), th = Math.max(-0.12, Math.min(0.12, (wL - wR) * 0.03));
    const lx = PX - HL * Math.cos(th), ly = PY + HL * Math.sin(th), rx = PX + HL * Math.cos(th), ry = PY - HL * Math.sin(th);
    let h = G.poly([[PX, PY], [PX - 30, 300], [PX + 30, 300]], "bg") + G.line(PX - 70, 300, PX + 70, 300, "ink");
    h += pan(lx, ly, S.L, "L", S.tapOn) + pan(rx, ry, S.R, "R", S.tapOn);
    h += G.line(lx, ly, rx, ry, "ink", { "stroke-width": 5, "stroke-linecap": "round" }) + G.circle(PX, PY, 6, "dot");
    const bal = wL === wR;
    h += G.t(PX, 40, `${sideText(S.L)}  ${bal ? "=" : wL > wR ? ">" : "<"}  ${sideText(S.R)}`, bal ? "big" : "big w");
    if (S.slider) {
      h += G.line(SV(0), SLY, SV(8), SLY, "mut");
      for (let v = 0; v <= 8; v++) h += G.line(SV(v), SLY - 6, SV(v), SLY + 6, "mut");
      h += G.he(SV(0) - 24, SLY + 5, "משקל x", "m", "right") + G.t(SV(8) + 24, SLY + 5, "x = " + S.xv, "b", "start") + G.knob(SV(S.xv), SLY, "xv", 15);
    }
    return h;
  }
  // ---------- equation rows ----------
  function drawRows(S) {
    let h = "";
    S.rows.forEach((r, i) => {
      const y = r.y; h += G.rect(20, y - 28, 580, 56, i === 2 ? "fok-soft" : "bg", { rx: 10 });
      if (r.text) { h += G.t(310, y + 7, r.text, "big"); return; }
      let x = 40;
      const box = (t, x) => G.rect(x, y - 12, 24, 24, t === "x" ? "fblue-soft" : "fok-soft", { rx: 3 }) + G.t(x + 12, y + 5, t, "b");
      if (r.pairs) for (let k = 0; k < r.pairs; k++) { h += G.rect(x - 3, y - 16, 56, 32, "ghost", { rx: 6 }) + box("x", x) + box("y", x + 26); x += 60; }
      else for (const t of r.items) { h += box(t, x); x += 27; }
      h += G.t(478, y + 7, "=", "big") + G.rect(500, y - 18, 86, 36, "fsoft", { rx: 8 }) + G.t(543, y + 7, r.rhs, "b");
      if (r.label) h += G.t(40, y - 34, r.label, "m", "start");
    });
    if (S.op) h += G.line(20, 172, 600, 172, "ink") + G.t(10, 168, S.op, "big", "start");
    if (S.note) h += G.t(310, 320, S.note, "a");
    return h;
  }
  // ---------- value columns ----------
  function drawCols(S) {
    const { lo, hi, k } = S, step = 440 / (hi - lo), CXv = v => 100 + (v - lo) * step, base = 240;
    const vL = S.fL(S.x), vR = S.fR(S.x), eq = vL === vR;
    let h = G.t(310, 36, S.title, "big") + G.line(150, base, 470, base, "ink");
    [[vL, 200, S.labL, "fblue"], [vR, 330, S.labR, "fa"]].forEach(([v, x, lab, cls]) => {
      const top = v >= 0 ? base - v * k : base;
      h += G.rect(x, top, 90, Math.abs(v) * k, cls);
      h += G.t(x + 45, v >= 0 ? top - 8 : base + Math.abs(v) * k + 20, neg(v), "b");
      h += G.t(x + 45, 308, lab, "b");
    });
    h += eq ? G.he(540, 150, "שווים!", "ok") : G.t(540, 150, "≠", "big");
    h += G.line(CXv(lo), SLY, CXv(hi), SLY, "mut");
    for (let v = lo; v <= hi; v++) {
      const f = (S.found || []).includes(v);
      if (f) h += G.circle(CXv(v), SLY, 9, "fok");
      h += G.line(CXv(v), SLY - 6, CXv(v), SLY + 6, "mut") + G.t(CXv(v), SLY + 26, neg(v), f ? "ok" : "m");
    }
    return h + G.t(CXv(lo) - 22, SLY + 5, "x", "b", "end") + G.knob(CXv(S.x), SLY, "x", 15);
  }

  function draw(L) { const S = L.state; return S.kind === "rows" ? drawRows(S) : S.kind === "cols" ? drawCols(S) : drawScale(S); }
  function drag(L, key, pt, phase) {
    const S = L.state;
    if (key === "xv") { S.xv = Math.max(0, Math.min(8, Math.round((pt.x - 170) / 40))); if (phase === "end") S.tried[S.xv] = true; }
    if (key === "x") {
      const step = 440 / (S.hi - S.lo); S.x = Math.max(S.lo, Math.min(S.hi, Math.round((pt.x - 100) / step) + S.lo));
      if (phase === "end" && S.fL(S.x) === S.fR(S.x) && !S.found.includes(S.x)) S.found.push(S.x);
    }
  }
  function dragFrom(L, pt) { const S = L.state; if (pt.y < SLY - 22) return null; return S.kind === "cols" ? "x" : S.slider ? "xv" : null; }
  function tap(L, key) {
    const S = L.state, [side, t] = key.split(":");
    if (!S.tapOn) return false;
    if (t !== S.allow) { L.memo.wrongType = t; return; }
    const s = S[side]; if (s[t] > 0) { s[t]--; S.d[side + t]++; }
  }
  // scale step helpers
  const startScale = (L, allow) => { const S = L.state; S.tapOn = true; S.allow = allow; S.d = { Lx: 0, Rx: 0, Lu: 0, Ru: 0 }; S.snap = JSON.stringify([S.L, S.R]); L.memo.wrongType = null; };
  const restart = () => [["התחל מחדש", L => { const S = L.state, [a, b] = JSON.parse(S.snap); S.L = a; S.R = b; S.d = { Lx: 0, Rx: 0, Lu: 0, Ru: 0 }; }]];
  const scaleCheck = (goal, typeHint) => (L, e) => {
    if (e.type !== "tap") return null; const S = L.state;
    if (L.memo.wrongType) { L.memo.wrongType = null; return typeHint; }
    const pend = Math.abs(S.d.Lx - S.d.Rx) + Math.abs(S.d.Lu - S.d.Ru);
    if (pend >= 2) return "המאזניים נטו. מה שמורידים מכף אחת, מורידים בדיוק גם מהשנייה. לחץ 'התחל מחדש' ונסה שוב.";
    if (pend === 0 && goal(S)) return true;
    return null;
  };
  const eqRows = (a, b) => [{ y: 60, items: a.items, rhs: a.rhs, label: a.label }, { y: 130, items: b.items, rhs: b.rhs, label: b.label }];
  const its = (nx, ny) => [...Array(nx).fill("x"), ...Array(ny).fill("y")];
  const cols = o => Object.assign({ kind: "cols", found: [] }, o);

  Lab.register({
    id: "alg-equations", title: "המחשה: משוואות", viewBox: "0 0 620 380",
    chapters: ["מאזניים", "זהות וסתירה", "מבקשים ביטוי", "מכפלה שווה 0", "שאלת מבחן"],
    draw, drag, dragFrom, tap,
    steps: [
      // ---------- ch0: balance ----------
      { ch: 0, setup: L => { L.state = { L: { x: 3, u: 2 }, R: { x: 1, u: 10 }, xv: 4, tried: {} }; startScale(L, "x"); },
        say: `המאזניים מאוזנים: ${m("3x + 2 = x + 10")}. כל הקופסאות הכחולות שוקלות אותו דבר (x), וכל עיגול שוקל 1. לפתור משוואה = לגלות כמה שוקלת קופסה.`,
        task: "לחץ על קופסאות x כדי להוריד אותן, עד שבכף ימין לא תישאר אף קופסה. שמור על איזון.",
        tools: restart,
        demo: L => { const S = L.state; S.L.x = 2; S.R.x = 0; S.d = { Lx: 1, Rx: 1, Lu: 0, Ru: 0 }; L.act({ type: "tap" }); },
        check: scaleCheck(S => S.R.x === 0, "בשלב הזה מורידים רק קופסאות x. את העיגולים נוריד אחר כך."),
        ok: `הורדת x מכל כף, והמאזניים נשארו מאוזנים: ${m("2x + 2 = 10")}. <b>כל פעולה על אגף אחד עושים גם על השני.</b>` },
      { ch: 0, setup: L => startScale(L, "u"),
        say: "עכשיו העיגולים.", task: "הורד עיגולים עד שבכף שמאל יישארו רק קופסאות x.",
        tools: restart,
        demo: L => { const S = L.state; S.L.u = 0; S.R.u = 8; S.d = { Lx: 0, Rx: 0, Lu: 2, Ru: 2 }; L.act({ type: "tap" }); },
        check: scaleCheck(S => S.L.u === 0, "בשלב הזה מורידים רק עיגולים. הקופסאות כבר מסודרות."),
        ok: `${m("2x = 8")}. הנעלם כמעט מבודד.` },
      { ch: 0, setup: L => { L.state.tapOn = false; },
        say: "שתי קופסאות שוקלות כמו 8 עיגולים.", task: "כמה שוקלת קופסה אחת?", choices: ["4", "6", "8", "16"],
        check: pick(0, { 1: "6 זה מה שיוצא אם מחסרים 2. אבל 2x פירושו 2 כפול x.", 2: "8 הם שתי הקופסאות יחד.", 3: "כפלת במקום לחלק." }),
        ok: `${m("x = 4")}: חילקנו את שני האגפים ב־2. בדיקה במשוואה המקורית: ${m("3·4 + 2 = 14 = 4 + 10")}.` },

      // ---------- ch1: identity / contradiction ----------
      { ch: 1, setup: L => { L.state = { L: { x: 2, u: 6, rows: [["x", "u", "u", "u"], ["x", "u", "u", "u"]], bundle: true, text: "2(x + 3)" }, R: { x: 2, u: 6 }, xv: 1, tried: {}, slider: true }; },
        say: `משמאל ${m("2(x + 3)")}: שתי חבילות של ${m("x + 3")}. מימין ${m("2x + 6")}. עכשיו אתה קובע כמה שוקל x.`,
        task: "גרור את המחוון של משקל x לשלושה ערכים שונים, ובדוק את המאזניים.",
        demo: L => { L.state.tried = { 1: true, 4: true, 7: true }; L.state.xv = 7; L.act({ type: "drop", key: "xv" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const n = Object.keys(L.state.tried).length; return n >= 3 ? true : null; },
        ok: `בכל ערך המאזניים מאוזנים, כי ${m("2(x + 3) = 2x + 6")} תמיד. זו <b>זהות</b>: יש אינסוף פתרונות.` },
      { ch: 1, setup: L => { const S = L.state; S.R = { x: 2, u: 5 }; },
        say: `עכשיו בכף ימין ${m("2x + 5")}. המחוון עדיין פעיל.`,
        task: "לאיזה x המאזניים יתאזנו?", choices: [m("x = 0"), m("x = 1"), "לאף x", "לכל x"],
        check: pick(2, { 0: `גרור את x ל־0: ${m("6")} מול ${m("5")}.`, 1: `גרור את x ל־1: ${m("8")} מול ${m("7")}.`, 3: "גרור את x לכמה ערכים. האם המאזניים מתאזנים?" }),
        ok: `אם מורידים ${m("2x")} משני הצדדים, נשאר ${m("6 = 5")}: <b>סתירה</b>. אין פתרון. שמאל תמיד כבד יותר ב־1.` },
      { ch: 1, setup: L => { const S = L.state; S.L = { lab: "3(x − 2) + x", w: x => 3 * (x - 2) + x, text: "3(x − 2) + x" }; S.R = { lab: "4x − 6", w: x => 4 * x - 6, text: "4x − 6" }; S.xv = 0; },
        say: "שים לב: כאן x = 0 מקיים את המשוואה. אבל האם רק הוא?",
        task: `${m("3(x − 2) + x = 4x − 6")}. מה נכון?`, choices: [m("x = 0") + " בלבד", m("x = 2") + " בלבד", "אין פתרון", "כל x הוא פתרון"],
        check: pick(3, { 0: "0 אכן מקיים, אבל זו מלכודת. גרור את x לערכים אחרים או פתח סוגריים.", 1: "פתח סוגריים בצד שמאל והשווה לצד ימין.", 2: "גרור את x: המאזניים מאוזנים. אז יש פתרון." }),
        ok: `${m("3x − 6 + x = 4x − 6")}: זהות, ולכן כל x הוא פתרון. מי שמציב 0, רואה שזה מתקיים ומסמן ${m("x = 0")}, טועה.` },

      // ---------- ch2: asked for an expression ----------
      { ch: 2, setup: L => { L.state = { kind: "rows", rows: eqRows({ items: its(2, 5), rhs: 24 }, { items: its(5, 2), rhs: 18 }) }; },
        say: `שתי משוואות: ${m("2x + 5y = 24")} ו־${m("5x + 2y = 18")}. השאלה מבקשת רק את ${m("x + y")}. לא צריך למצוא כל נעלם לחוד.`,
        task: "מה לעשות עם שתי המשוואות? בחר פעולה.",
        tools: () => [["חבר את המשוואות", L => { const S = L.state; S.rows[2] = { y: 225, pairs: 7, rhs: 42 }; S.op = "+"; S.note = "7(x + y) = 42"; L.render(); L.act({ type: "add" }); }, true],
                      ["חסר את המשוואות", L => { const S = L.state; S.rows[2] = { y: 225, text: "−3x + 3y = 6" }; S.op = "−"; S.note = ""; L.render(); L.act({ type: "sub" }); }]],
        demo: L => { const S = L.state; S.rows[2] = { y: 225, pairs: 7, rhs: 42 }; S.op = "+"; S.note = "7(x + y) = 42"; L.act({ type: "add" }); },
        check: (L, e) => e.type === "add" ? true : e.type === "sub" ? `החיסור נתן מקדמים הפוכים, ${m("−3")} ו־3. כדי לקבל ${m("x + y")} צריך מקדמים שווים. נסה את הפעולה השנייה.` : null,
        ok: `המקדמים "מוצלבים" (2 ו־5), ולכן בחיבור כל נעלם מקבל 7: ${m("7x + 7y = 42")}. אלה 7 זוגות זהים של ${m("x + y")}.` },
      { ch: 2, say: "7 זוגות של x + y שוקלים יחד 42.", task: `${m("x + y = ?")}`, choices: ["6", "7", "42", "3"],
        check: pick(0, { 1: "7 הוא מספר הזוגות, לא המשקל של זוג.", 2: "42 הוא המשקל של כל 7 הזוגות יחד.", 3: "חלק את 42 ב־7." }),
        ok: `${m("x + y = 6")}, בלי לחשב את x ואת y לחוד. (אגב, ${m("x = 2, y = 4")}.) בבחינה זה חוסך הרבה זמן.` },
      { ch: 2, setup: L => { L.state = { kind: "rows", rows: [{ y: 60, text: "5a − 3b = 14" }, { y: 130, text: "3a − 5b = 2" }] }; },
        say: "עכשיו אתה מחליט לבד.", task: `נתון ${m("5a − 3b = 14")} ו־${m("3a − 5b = 2")}. מהו ${m("a − b")}?`, choices: ["2", "6", "4", "16"],
        check: pick(0, { 1: `6 זה ${m("a + b")} (מהחיסור). כאן מבקשים ${m("a − b")}.`, 2: "חבר את המשוואות וראה אילו מקדמים יוצאים.", 3: `${m("8a − 8b = 16")}. עכשיו חלק ב־8.` }),
        ok: `בחיבור: ${m("8a − 8b = 16")}, כלומר ${m("a − b = 2")}. מבקשים ${m("a + b")}? מחסרים. ${m("a − b")}? מחברים. בודקים מה נותן מקדמים שווים.` },

      // ---------- ch3: product = 0 ----------
      { ch: 3, setup: L => { L.state = cols({ title: "x² = 3x", fL: x => x * x, fR: x => 3 * x, labL: "x²", labR: "3x", lo: -2, hi: 6, k: 4.5, x: 1 }); },
        say: `${m("x² = 3x")}. העמודה הכחולה היא צד שמאל והוורודה צד ימין. גרור את x על הציר.`,
        task: "מצא את כל הערכים שבהם שני הצדדים שווים. כשתסיים, לחץ 'סיימתי'.",
        tools: () => [["סיימתי", L => L.act({ type: "done" })]],
        demo: L => { L.state.found = [0, 3]; L.state.x = 3; L.act({ type: "drop", key: "x" }); },
        check: (L, e) => { const f = L.state.found;
          if (f.includes(0) && f.includes(3)) return true;
          if (e.type !== "done") return null;
          if (f.includes(3)) return `מצאת את 3. בדקת גם את ${m("x = 0")}? ${m("0² = 0")} וגם ${m("3·0 = 0")}.`;
          if (f.includes(0)) return "יש עוד ערך חיובי. המשך לגרור.";
          return "עוד לא מצאת אף ערך. חפש מתי שתי העמודות באותו גובה."; },
        ok: `${m("x = 0")} או ${m("x = 3")}. מי שמחלק את המשוואה ב־x מקבל רק 3 ומאבד את 0. הדרך הנכונה: ${m("x² − 3x = 0")}, כלומר ${m("x(x − 3) = 0")}, ו<b>מכפלה שווה 0 רק אם אחד הגורמים שווה 0</b>.` },
      { ch: 3, setup: L => { L.state = cols({ title: "x² = 49", fL: x => x * x, fR: () => 49, labL: "x²", labR: "49", lo: -8, hi: 8, k: 2, x: 2 }); },
        say: "עוד מלכודת: הוצאת שורש. אפשר לגרור את x כדי לבדוק.",
        task: `${m("x² = 49")}. מה הפתרונות?`, choices: ["7 בלבד", `7 או ${m("−7")}`, `${m("−7")} בלבד`, "24.5"],
        check: pick(1, { 0: `גרור את x ל־${m("−7")} ובדוק.`, 2: "גרור את x ל־7 ובדוק.", 3: `${m("x²")} זה x כפול x, לא 2 כפול x.` }),
        ok: `גם ${m("(−7)² = 49")}. הוצאת שורש זוגי נותנת שני פתרונות: ${m("x = ±7")}. אם בשאלה כתוב ${m("x < 0")}, נשאר רק ${m("−7")}.` },

      // ---------- ch4: exam ----------
      { ch: 4, setup: L => { L.state = { kind: "rows", rows: eqRows({ items: its(2, 3), rhs: 17 }, { items: its(3, 2), rhs: 18 }) }; },
        say: "שאלה ברמת מבחן.", task: `נתון: ${m("2x + 3y = 17")} ו־${m("3x + 2y = 18")}. מהו ${m("x − y")}?`, choices: ["1", "7", "5", m("−1")],
        check: pick(0, { 1: `7 זה ${m("x + y")}, מהחיבור. מבקשים ${m("x − y")}: חסר את המשוואות.`, 2: `בחיסור: ${m("(3x + 2y) − (2x + 3y) = x − y")}. כמה זה ${m("18 − 17")}?`, 3: "שים לב לכיוון: מחסרים את הראשונה מהשנייה, ואז מקדם x חיובי." }),
        ok: `${m("(3x + 2y) − (2x + 3y) = x − y = 18 − 17 = 1")}. (אגב, ${m("x = 4, y = 3")}.)` },
      { ch: 4, say: "<b>סיכום ההמחשה:</b><br>1. מאזניים: כל פעולה על אגף אחד עושים גם על השני.<br>2. זהות (כמו 6 = 6): אינסוף פתרונות. סתירה (כמו 6 = 5): אין פתרון.<br>3. מבקשים ביטוי? חבר או חסר את המשוואות עד שיוצאים מקדמים שווים.<br>4. לא מחלקים ב־x: מוציאים גורם משותף, ומכפלה = 0 כשגורם אחד = 0. שורש זוגי נותן ±.", next: "סיום ההמחשה" },
    ],
  });
})();
