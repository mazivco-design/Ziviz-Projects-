/* Lab: בעיות כלליות — יחסים זהים, ערך משולש, יחס כבלוקים, "תן למסכן" על מאזניים. */
(function () {
  const { G } = Lab;
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");

  // ---------- double number line ----------
  const DX0 = 70, DX1 = 570, YT = 130, YB = 230;
  const dnl = o => Object.assign({ mode: "dnl", max: 12, given: 3, price: 8, knob: 0, top: "מחברות", bot: "שקלים", arrows: 0 }, o);
  const dx = (S, v) => DX0 + (DX1 - DX0) * v / S.max;
  function drawDnl(S) {
    let h = "";
    h += G.he(DX1 + 40, YT - 52, S.top, "b", "right") + G.he(DX1 + 40, YB + 58, S.bot, "b", "right");
    h += G.line(DX0, YT, DX1, YT, "ink") + G.line(DX0, YB, DX1, YB, "ink");
    for (let v = 0; v <= S.max; v++) { const x = dx(S, v); h += G.line(x, YT - 6, x, YT + 6, "thin") + G.t(x, YT - 14, v, "m"); }
    const gx = dx(S, S.given);
    h += G.line(gx, YT, gx, YB, "dash") + G.circle(gx, YT, 6, "fblue") + G.circle(gx, YB, 6, "fblue") + G.t(gx, YB + 26, G.fmt(S.price), "blue");
    h += G.t(dx(S, 0), YB + 26, "0", "m");
    if (S.knob > 0) {
      const kx = dx(S, S.knob), val = S.price * S.knob / S.given;
      h += G.line(kx, YT, kx, YB, "sa") + G.circle(kx, YB, 7, "fa") + G.t(kx, YB + 26, G.fmt(val), "a");
    }
    if (S.arrows) {
      const k = S.arrows, x2 = dx(S, S.given * k);
      h += G.path(`M${gx},${YT - 30} Q${(gx + x2) / 2},${YT - 62} ${x2},${YT - 30}`, "sa") + G.t((gx + x2) / 2, YT - 52, "×" + k, "a");
      h += G.path(`M${gx},${YB + 36} Q${(gx + x2) / 2},${YB + 66} ${x2},${YB + 36}`, "sa") + G.t((gx + x2) / 2, YB + 70, "×" + k, "a");
    }
    h += G.knob(dx(S, S.knob), YT, "k", 15);
    return h;
  }

  // ---------- ratio table (triangle value) ----------
  // cells: [[r0c0, r0c1],[r1c0, r1c1]] with one "?"; Hebrew order: column 0 is on the RIGHT.
  const tbl = o => Object.assign({ mode: "tbl", rows: ["ק״ג", "₪"], cells: [[4, 6], [10, "?"]], sel: [], calc: "" }, o);
  const CX = [400, 250], CY = [100, 180], CW = 120, CH = 64;
  function drawTbl(S) {
    let h = "";
    for (let r = 0; r < 2; r++) {
      h += G.he(CX[0] + CW / 2 + 50, CY[r] + 40, S.rows[r], "b");
      for (let c = 0; c < 2; c++) {
        const v = S.cells[r][c], x = CX[c] - CW / 2, y = CY[r], key = r + "" + c, on = S.sel.includes(key), q = v === "?";
        h += G.tap(G.rect(x, y, CW, CH, (q ? "fwarn" : on ? "fa" : "box") + (q ? "" : " hot"), { rx: 8 }), key);
        h += G.t(CX[c], y + 41, q && S.ans ? G.fmt(S.ans) : v, q ? "w big" : on ? "inv big" : "big", "middle", { "pointer-events": "none" });
      }
    }
    if (S.diag) {
      const p = k => [CX[+k[1]], CY[+k[0]] + CH / 2];
      const [a, b] = S.diag.map(p);
      h += G.line(a[0], a[1], b[0], b[1], "sa", { "pointer-events": "none", opacity: .5 });
    }
    if (S.calc) h += G.t(325, 300, S.calc, "a big");
    return h;
  }

  // ---------- ratio blocks (tape) ----------
  const TR = 530, TU = 7;
  const tape = o => Object.assign({ mode: "tape", a: 2, b: 3, x: 2, la: "בנים", lb: "בנות", ca: "fblue", cb: "fa", want: "total", target: 30 }, o);
  const SX0 = 120, SX1 = 520, XMAX = 12;
  const sx = v => SX0 + (SX1 - SX0) * (v - 1) / (XMAX - 1);
  function drawTape(S) {
    let h = "";
    const w = S.x * TU, rows = [[S.a, S.la, S.ca, 70], [S.b, S.lb, S.cb, 150]];
    rows.forEach(([n, lab, cls, y]) => {
      h += G.he(605, y + 30, lab, "b", "right");
      for (let k = 0; k < n; k++) { const x = TR - (k + 1) * w; h += G.rect(x, y, w, 44, cls, { rx: 3 }); if (w >= 30) h += G.t(x + w / 2, y + 28, S.x, "inv"); }
      h += G.t(TR - n * w - 10, y + 29, "= " + n * S.x, "b", "end");
    });
    if (S.want === "diff") {
      const xa = TR - S.a * w, xb = TR - S.b * w;
      h += G.rect(xb, 150, xa - xb, 44, "fwarn", { rx: 3, "pointer-events": "none", style: "fill:none" });
      h += G.line(xb, 206, xa, 206, "sa") + G.line(xb, 200, xb, 212, "sa") + G.line(xa, 200, xa, 212, "sa");
      h += G.he((xa + xb) / 2, 230, "הפרש: " + (S.b - S.a) * S.x, "a");
    } else h += G.he(TR, 232, "סה״כ: " + (S.a + S.b) + " בלוקים = " + (S.a + S.b) * S.x, "a", "right");
    // slider for block size
    h += G.line(SX0, 300, SX1, 300, "mut");
    for (let v = 1; v <= XMAX; v++) h += G.line(sx(v), 294, sx(v), 306, "thin");
    h += G.he(612, 305, "גודל בלוק", "m", "right");
    h += G.t(sx(S.x), 340, "x = " + S.x, "a");
    h += G.knob(sx(S.x), 300, "x", 15);
    return h;
  }

  // ---------- balance scale ("give to the poor") ----------
  const PV = [310, 205], ARM = 170;
  const scale = o => Object.assign({ mode: "scale", ln: "אבי", rn: "בני", lw: 6, rw: 2, op: "×3", tag: "tray", tx: 310, ty: 326, sym: false }, o);
  const apply = (S, side) => { const w = side === "L" ? S.lw : S.rw; if (S.tag !== side) return w; return S.op[0] === "×" ? w * +S.op.slice(1) : w + +S.op.slice(1); };
  function pile(cx, by, n, sym, extra) {
    // sym: [count of 'g' boxes, extra unit blocks]
    let h = "", y = by;
    if (sym) {
      for (let k = 0; k < sym[0]; k++) { y -= 38; h += G.rect(cx - 36, y, 72, 36, "fblue-soft", { rx: 4 }) + G.t(cx, y + 24, "g", "blue"); }
      for (let k = 0; k < sym[1]; k++) { const c = k % 4, r = Math.floor(k / 4); h += G.rect(cx - 36 + c * 18, y - 18 - r * 18, 17, 17, "fsoft", { rx: 2 }); }
      return h;
    }
    for (let k = 0; k < n; k++) { const c = k % 4, r = Math.floor(k / 4); h += G.rect(cx - 36 + c * 18, by - 18 - r * 18, 17, 17, k < (extra || n) ? "fsoft" : "fok-soft", { rx: 2 }); }
    return h;
  }
  function drawScale(S) {
    let h = "";
    const wl = apply(S, "L"), wr = apply(S, "R");
    const ang = Math.max(-14, Math.min(14, (wr - wl) * 1.6)); // + => right side down
    const rad = ang * Math.PI / 180, c = Math.cos(rad), s = Math.sin(rad);
    const pL = [PV[0] - ARM * c, PV[1] - ARM * s], pR = [PV[0] + ARM * c, PV[1] + ARM * s];
    h += G.poly([[PV[0], PV[1]], [PV[0] - 28, 300], [PV[0] + 28, 300]], "bg");
    h += G.line(pL[0], pL[1], pR[0], pR[1], "ink", { style: "stroke-width:4" });
    h += G.circle(PV[0], PV[1], 6, "dot");
    [[pL, "L", S.ln], [pR, "R", S.rn]].forEach(([p, side, nm]) => {
      const by = p[1] - 14;
      h += G.line(p[0], p[1], p[0], by, "ink") + G.rect(p[0] - 52, by - 5, 104, 6, "bg", { rx: 3 });
      if (S.sym) {
        const base = side === "L" ? S.sym.L : S.sym.R, mult = S.tag === side ? 2 : 1;
        h += pile(p[0], by - 6, 0, [base[0] * mult, base[1] * mult]);
      } else {
        const base = side === "L" ? S.lw : S.rw, w = apply(S, side);
        h += pile(p[0], by - 6, w, null, S.op[0] === "+" ? base : w);
      }
      h += G.he(p[0], p[1] + 34, nm, "b");
      if (S.tag === side) h += tagSvg(side === "L" ? p[0] - 98 : p[0] + 98, by - 26, S);
    });
    const bal = wl === wr;
    h += G.he(310, 30, bal ? "מאוזן" : wl > wr ? "נוטה שמאלה" : "נוטה ימינה", bal ? "ok" : "m");
    if (S.eq) h += G.t(310, 345, S.eq(S), "a big");
    if (S.tag === "tray") h += tagSvg(S.tx, S.ty, S);
    return h;
  }
  const tagSvg = (x, y, S) => `<g data-drag="tag" class="hot"><rect x="${x - 30}" y="${y - 19}" width="60" height="38" rx="9" class="fsoft" style="stroke-width:2.5"/>` + G.t(x, y + 7, S.op, "a big", "middle", { "pointer-events": "none" }) + "</g>";

  function draw(L) {
    const S = L.state;
    return S.mode === "dnl" ? drawDnl(S) : S.mode === "tbl" ? drawTbl(S) : S.mode === "tape" ? drawTape(S) : drawScale(S);
  }
  function drag(L, key, pt, phase) {
    const S = L.state;
    if (key === "k") S.knob = Math.max(0, Math.min(S.max, Math.round((pt.x - DX0) / (DX1 - DX0) * S.max)));
    if (key === "x") S.x = Math.max(1, Math.min(XMAX, Math.round(1 + (pt.x - SX0) / (SX1 - SX0) * (XMAX - 1))));
    if (key === "tag") {
      if (phase === "start") S.tag = "tray";
      S.tx = Math.max(30, Math.min(590, pt.x)); S.ty = Math.max(20, Math.min(340, pt.y));
      if (phase === "end") {
        const dl = Math.hypot(pt.x - (PV[0] - ARM), pt.y - 170), dr = Math.hypot(pt.x - (PV[0] + ARM), pt.y - 170);
        if (Math.min(dl, dr) < 110) S.tag = dl < dr ? "L" : "R"; else { S.tag = "tray"; S.tx = 310; S.ty = 326; }
      }
    }
  }
  function dragFrom(L, pt) {
    const S = L.state;
    if (S.mode === "dnl" && Math.abs(pt.y - YT) < 34 && pt.x > DX0 - 20 && pt.x < DX1 + 20) return "k";
    if (S.mode === "tape" && Math.abs(pt.y - 300) < 30 && pt.x > SX0 - 25 && pt.x < SX1 + 25) return "x";
    return null;
  }
  function tap(L, key) {
    const S = L.state; if (S.mode !== "tbl" || S.lock) return false;
    const i = S.sel.indexOf(key); if (i >= 0) S.sel.splice(i, 1); else { if (S.sel.length >= 2) S.sel.shift(); S.sel.push(key); }
  }

  const tagCheck = (good, badHint) => (L, e) => {
    if (e.type !== "drop" || e.key !== "tag") return null;
    const S = L.state; if (S.tag === "tray") return "גרור את התגית עד לאחת הכפות ושחרר אותה שם.";
    return S.tag === good ? true : badHint;
  };

  Lab.register({
    id: "prb-general", title: "מעבדת בעיות כלליות", viewBox: "0 0 620 360",
    chapters: ["יחסים זהים", "ערך משולש", "יחס = בלוקים", "תן למסכן", "שאלת מבחן"],
    draw, drag, dragFrom, tap,
    steps: [
      // ---- ch0: double number line
      { ch: 0, setup: L => { L.state = dnl({}); },
        say: "שני קווים מקבילים: למעלה מחברות, למטה שקלים. 3 מחברות עולות 8 ₪, ולכן הן מסומנות אחת מול השנייה (בכחול).",
        task: "גרור את העיגול שעל הקו העליון למספר מחברות שהוא פי 3 מ־3.",
        demo: L => { L.state.knob = 9; L.act({ type: "drop", key: "k" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const k = L.state.knob; if (k === 9) { L.state.arrows = 3; L.render(); return true; } return k < 9 ? "עוד ימינה. פי 3 מ־3 זה 3 + 3 + 3." : "עברת. פי 3 מ־3 זה 3 + 3 + 3."; },
        ok: "9 מחברות הן פי 3 מחברות, ולכן גם פי 3 שקלים: 8 × 3 = 24 ₪. מה שכופלים למעלה, כופלים גם למטה." },
      { ch: 0, setup: L => { L.state.arrows = 0; },
        say: "זו בדיוק טבלת יחסים: שתי שורות שזזות יחד באותו כפל. העיגול עדיין זז, אפשר להיעזר בו.",
        task: "כמה עולות 12 מחברות?", choices: ["24 ₪", "30 ₪", "32 ₪", "36 ₪"],
        check: pick(2, { 0: "24 ₪ זה המחיר של 9 מחברות. 12 זה פי כמה מ־3?", 1: "הוספת 6 ₪ כמו שהוספת 3 מחברות? ביחסים כופלים. 12 זה פי 4 מ־3.", 3: "מחברת לא עולה 3 ₪. 12 זה פי 4 מ־3, אז כופלים את 8 ב־4." }),
        ok: "12 = 3 × 4, ולכן 8 × 4 = 32 ₪. כשרואים יחס שלם, פשוט כופלים בו." },
      // ---- ch1: triangle value
      { ch: 1, setup: L => { L.state = tbl({}); },
        say: "4 ק״ג תפוחים עולים 10 ₪. כמה עולים 6 ק״ג? מ־4 ל־6 זה פי 1.5, לא מספר שלם. כאן עובדים עם <b>ערך משולש</b>.",
        task: "בטבלה, לחץ על שני המספרים שיושבים באלכסון אחד, בלי סימן השאלה.",
        demo: L => { L.state.sel = ["01", "10"]; L.act({ type: "tap" }); },
        check: (L, e) => {
          if (e.type !== "tap") return null; const s = L.state.sel;
          if (s.includes("00")) return "4 נמצא באלכסון אחד עם סימן השאלה. הוא המספר שמחלקים בו, לא חלק מהמכפלה.";
          if (s.length < 2) return null;
          if (s.includes("01") && s.includes("10")) { Object.assign(L.state, { diag: ["01", "10"], calc: "6 × 10 ÷ 4 = 15", ans: 15, lock: true }); L.render(); return true; }
          return "בחר שני מספרים שנמצאים באלכסון, כמו פינות של X.";
        },
        ok: "כופלים את האלכסון: 6 × 10 = 60. מחלקים במספר שנשאר, 4: 60 ÷ 4 = <b>15 ₪</b>." },
      { ch: 1, setup: L => { L.state = tbl({ rows: ["ליטר", "₪"], cells: [[6, 10], [15, "?"]] }); L.state.lock = true; },
        say: "עוד אחד, הפעם בראש. 6 ליטר מיץ עולים 15 ₪.",
        task: "כמה עולים 10 ליטר?", choices: ["9 ₪", "19 ₪", "25 ₪", "30 ₪"],
        check: pick(2, { 0: "חילקת במספר הלא נכון. מחלקים במספר שבאלכסון עם סימן השאלה, כלומר ב־6.", 1: "הוספת 4 ל־15, כמו שהוספת 4 ל־6? ביחסים כופלים, לא מוסיפים.", 3: "10 זה לא פי 2 מ־6. כפול את האלכסון (10 × 15) וחלק ב־6." }),
        ok: L => { Object.assign(L.state, { diag: ["01", "10"], calc: "10 × 15 ÷ 6 = 25", ans: 25 }); L.render(); return "10 × 15 = 150, ו־150 ÷ 6 = 25 ₪. זה עובד גם כשהיחס לא שלם."; } },
      // ---- ch2: ratio as blocks
      { ch: 2, setup: L => { L.state = tape({}); },
        say: "בכיתה היחס בין בנים לבנות הוא 2:3. זה לא אומר שיש 2 בנים, רק שעל כל 2 בנים יש 3 בנות. לכן כל צד בנוי מבלוקים שווים בגודל x.",
        task: "בכיתה 30 תלמידים. גרור את הידית שמשנה את גודל הבלוק, עד שיהיו בכיתה 30 תלמידים.",
        demo: L => { L.state.x = 6; L.act({ type: "drop", key: "x" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const t = 5 * L.state.x; return t === 30 ? true : t < 30 ? `יש עכשיו ${t} תלמידים. הגדל את הבלוק.` : `יש עכשיו ${t} תלמידים, יותר מדי. הקטן את הבלוק.`; },
        ok: "5 בלוקים × 6 = 30, כלומר x = 6. בנים: 2x = 12, בנות: 3x = 18." },
      { ch: 2,
        say: "שים לב: הסך הכול תמיד 5 בלוקים שווים. גרור את הידית ותראה אילו סכומים בכלל אפשריים.",
        task: "איזה מספר תלמידים <b>לא</b> ייתכן בכיתה עם יחס 2:3?", choices: ["20", "25", "40", "42"],
        check: pick(3, { 0: "20 = 5 × 4. גרור ל־x = 4 ותראה שזה עובד.", 1: "25 = 5 × 5. גרור ל־x = 5 ותראה שזה עובד.", 2: "40 = 5 × 8. גרור ל־x = 8 ותראה שזה עובד." }),
        ok: "42 לא מתחלק ב־5 (מספר הבלוקים). זה טריק הפסילה: הסך הכול מתחלק בסכום החלקים, ומספר הבנים מתחלק ב־2." },
      { ch: 2,
        say: "ועכשיו מלכודת מוכרת.",
        task: "בכיתה ז' היחס בנים:בנות הוא 2:3, ובכיתה ח' הוא 1:2. באיזו כיתה יש יותר בנות?", choices: ["בכיתה ז'", "בכיתה ח'", "אי אפשר לדעת"],
        check: pick(2, { 0: "יחס לא אומר כמה. אולי בכיתה ז' יש רק 10 תלמידים?", 1: "יחס לא אומר כמה. אולי בכיתה ח' יש רק 3 תלמידים?" }),
        ok: "יחס הוא שבר, לא כמות. בלי לדעת את גודל הבלוק, אי אפשר להשוות כמויות בין שתי הכיתות." },
      // ---- ch3: give to the poor
      { ch: 3, setup: L => { L.state = scale({}); },
        say: "\"לאבי יש פי 3 בולים מאשר לבני.\" מי ה'מסכן' כאן? בני, כי יש לו פחות. המשוואה צריכה להשוות בין הצדדים, כמו מאזניים.",
        task: "גרור את התגית ×3 לכף שצריך לחזק כדי שהמאזניים יתאזנו.",
        demo: L => { L.state.tag = "R"; L.act({ type: "drop", key: "tag" }); },
        check: tagCheck("R", "הכפלת את אבי, שכבר יש לו יותר. הפער רק גדל. את 'פי 3' נותנים למסכן."),
        ok: "מאוזן: <b>a = 3b</b>. את ה'פי' כותבים ליד הצד הקטן, כדי להשוות אותו לגדול. הטעות הנפוצה היא לכתוב 3a = b." },
      { ch: 3, setup: L => { L.state = scale({ ln: "גלית", rn: "דור", lw: 7, rw: 2, op: "+5" }); },
        say: "אותו דבר עם הוספה: \"לגלית יש 5 בולים יותר מאשר לדור.\"",
        task: "גרור את התגית +5 לכף הנכונה.",
        demo: L => { L.state.tag = "R"; L.act({ type: "drop", key: "tag" }); },
        check: tagCheck("R", "הוספת לגלית, שכבר יש לה יותר. את התוספת נותנים למי שיש לו פחות."),
        ok: "מאוזן: <b>g = d + 5</b>. 'יותר ב־5' הולך גם הוא לצד המסכן." },
      { ch: 3, setup: L => { L.state = scale({ ln: "רון", rn: "גיל", lw: 16, rw: 8, op: "×2", sym: { L: [1, 8], R: [1, 0] } }); },
        say: "בעיית גילים. רון מבוגר מגיל ב־8 שנים. בעוד 4 שנים יהיה רון מבוגר פי 2 מגיל. נסמן ב־g את הגיל של גיל <b>בעוד 4 שנים</b>. אז רון יהיה אז g + 8 (ההפרש לא משתנה).",
        task: "גרור את ×2 לכף הנכונה.",
        demo: L => { L.state.tag = "R"; L.act({ type: "drop", key: "tag" }); },
        check: tagCheck("R", "רון כבר גדול יותר. את 'פי 2' נותנים לצעיר, לגיל."),
        ok: L => { L.state.eq = () => "2g = g + 8"; L.render(); return "2g = g + 8. מורידים g אחד משני הצדדים ונשאר <b>g = 8</b>."; } },
      { ch: 3,
        say: "מצאנו g = 8. רגע לפני שעונים.",
        task: "בן כמה גיל <b>היום</b>?", choices: ["4", "8", "12", "16"],
        check: pick(0, { 1: "g הוא הגיל של גיל <b>בעוד 4 שנים</b>, לא היום.", 2: "12 הוא הגיל של רון היום.", 3: "16 הוא הגיל של רון בעוד 4 שנים." }),
        ok: "גיל בן 4 ורון בן 12. בדיקה: בעוד 4 שנים 8 ו־16, בדיוק פי 2. בדיקה כזו היא גם 'הצבת תשובות': מתחילים מהתשובה האמצעית ובודקים." },
      // ---- ch4: exam
      { ch: 4, setup: L => { L.state = tape({ a: 3, b: 5, la: "אדומים", lb: "כחולים", ca: "fa", cb: "fblue", want: "diff", x: 2 }); },
        say: "שאלה ברמת מבחן. הבלוקים פתוחים לשימוש חופשי.",
        task: "בקופסה כדורים אדומים וכחולים ביחס 3:5. יש בה 12 כדורים כחולים יותר מאדומים. כמה כדורים יש בקופסה?",
        choices: ["18", "30", "48", "96"],
        check: pick(2, { 0: "18 הם רק האדומים. השאלה על כל הקופסה.", 1: "30 הם רק הכחולים. השאלה על כל הקופסה.", 3: "ההפרש הוא 2 בלוקים, לא בלוק אחד. אז בלוק = 6." }),
        ok: "ההפרש בין 5 בלוקים ל־3 בלוקים הוא 2 בלוקים = 12, ולכן בלוק = 6. בקופסה 8 בלוקים: 8 × 6 = <b>48</b>." },
      { ch: 4, setup: L => { L.state.x = 6; },
        say: "<b>סיכום המעבדה:</b><br>1. יחסים זהים: מה שכופלים בשורה אחת, כופלים גם בשנייה. כשאין יחס שלם, ערך משולש: אלכסון × אלכסון ÷ המספר שנשאר.<br>2. יחס a:b הוא בלוקים: a·x ו־b·x. הסך הכול מתחלק ב־a+b.<br>3. יחס לבד לא אומר כמה יש.<br>4. \"פי\" ו\"יותר ב־\" נותנים למסכן, לצד הקטן.", next: "סיום המעבדה" },
    ],
  });
})();
