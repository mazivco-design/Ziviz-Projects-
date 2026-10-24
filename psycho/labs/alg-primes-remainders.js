/* Lab: מספרים ראשוניים, התחלקות ושארית — models: chip array with row width (division/remainder), number tiles,
   prime "bricks", two hopping frogs (common multiple), digit tiles. */
(function () {
  const { G } = Lab;
  const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19];
  const SX0 = 130, SX1 = 570;
  const sx = (v, lo, hi) => SX0 + (hi === lo ? 0 : (v - lo) / (hi - lo) * (SX1 - SX0));
  const sv = (x, lo, hi) => Math.max(lo, Math.min(hi, Math.round(lo + (x - SX0) / (SX1 - SX0) * (hi - lo))));
  const WY = 318, NY = 372;   // slider rows

  function slider(y, v, lo, hi, key, label) {
    let h = G.he(SX0 - 22, y + 6, label, "b", "right") + G.line(SX0, y, SX1, y, "mut");
    const n = hi - lo, every = n <= 12 ? 1 : n <= 24 ? 2 : 5;
    for (let k = lo; k <= hi; k++) {
      const x = sx(k, lo, hi); h += G.line(x, y - 4, x, y + 4, "mut");
      if (k === v || (every === 1 || (k % every === 0 && Math.abs(k - v) >= 2))) h += G.t(x, y + 38, k, k === v ? "a" : "m");
    }
    return h + G.knob(sx(v, lo, hi), y, key, 16);
  }

  function drawArray(S) {
    let h = "";
    const n = S.n, w = S.w, rows = Math.ceil(n / w), full = Math.floor(n / w), r = n % w;
    const top = 62, s = Math.min(38, 500 / w, 210 / rows), rad = s * 0.36, x0 = 310 - w * s / 2, gap = r ? 8 : 0;
    if (full) h += G.rect(x0 - 5, top - 5, w * s + 10, full * s + 10, "fsoft", { rx: 8 });
    if (r) h += G.rect(x0 - 5, top + full * s + gap - 4, r * s + 10, s + 8, "fwarn", { rx: 8 });
    for (let k = 0; k < n; k++) {
      const row = Math.floor(k / w), col = k % w, left = row >= full;
      h += G.circle(x0 + col * s + s / 2, top + row * s + (left ? gap : 0) + s / 2, rad, left ? "box" : "fa");
    }
    h += G.t(18, 34, `${n} = ${full} · ${w} + ${r}`, "big", "start");
    const msg = r ? `שארית ${r}` : full >= 2 ? `מלבן: ${full} שורות` : "שורה אחת";
    h += G.he(602, 34, msg, r ? "w" : "ok", "right");
    if (S.wDrag) h += slider(WY, w, S.wLo, S.wHi, "w", "רוחב שורה");
    else h += G.he(SX0 - 22, WY + 6, "רוחב שורה", "b", "right") + G.t(SX0 + 10, WY + 6, w + " (קבוע)", "a", "start");
    if (S.nDrag) h += slider(NY, n, S.nLo, S.nHi, "n", "עיגולים");
    return h;
  }

  function drawGrid(S) {
    let h = G.he(602, 80, "המספרים 1 עד 20", "b", "right");
    for (let v = 1; v <= 20; v++) {
      const i = (v - 1) % 10, j = Math.floor((v - 1) / 10), x = 40 + i * 54, y = 120 + j * 66, on = S.sel[v];
      h += G.tap(G.rect(x, y, 50, 54, (on ? "fa" : "box") + " hot", { rx: 8 }), "g" + v);
      h += G.t(x + 25, y + 34, v, on ? "inv" : "b", "middle", { "pointer-events": "none" });
    }
    if (S.reveal) h += G.he(602, 300, "ראשוניים: 2, 3, 5, 7, 11, 13, 17, 19", "ok", "right") + G.he(602, 330, "1 – לא ראשוני. 2 – הזוגי היחיד.", "m", "right");
    return h;
  }

  function drawBricks(S) {
    let h = "";
    S.rows.forEach((R, ri) => {
      const y = R.y;
      h += G.t(108, y + 30, R.num + " =", "big", "end");
      R.bricks.forEach((p, i) => {
        const x = 125 + i * 72, on = R.sel[i];
        const el = G.rect(x, y, 58, 46, (on ? "fa" : "fblue-soft") + (R.tap ? " hot" : ""), { rx: 8 });
        h += R.tap ? G.tap(el, "b" + ri + ":" + i) : el;
        h += G.t(x + 29, y + 30, p, on ? "inv" : "b", "middle", { "pointer-events": "none" });
        if (i < R.bricks.length - 1) h += G.t(x + 65, y + 30, "·", "m");
      });
      if (R.label) h += G.he(602, y + 30, R.label, "m", "right");
    });
    const R0 = S.rows[0], picked = R0.bricks.filter((_, i) => R0.sel[i]);
    if (picked.length) h += G.he(602, S.outY, S.outLabel, "b", "right") + G.t(530, S.outY, picked.join(" · ") + " = " + picked.reduce((a, b) => a * b, 1), "a", "end");
    return h;
  }

  const FX = v => 40 + v * 560 / 30;
  function drawFrogs(S) {
    let h = "";
    const lanes = [{ y: 150, d: 4, cls: "sblue", dot: "fblue", t: "blue", lab: "צפרדע שקופצת 4" }, { y: 280, d: 6, cls: "sa", dot: "fa", t: "a", lab: "צפרדע שקופצת 6" }];
    if (S.pick !== null) h += G.line(FX(S.pick), 92, FX(S.pick), 312, "dash");
    for (const Ln of lanes) {
      h += G.line(40, Ln.y, 600, Ln.y, "mut");
      for (let v = 0; v <= 30; v++) h += G.line(FX(v), Ln.y - 3, FX(v), Ln.y + 3, "mut");
      h += G.he(600, Ln.y - 58, Ln.lab, Ln.t, "right");
      for (let v = 0; v + Ln.d <= 30; v += Ln.d) {
        const a = FX(v), b = FX(v + Ln.d);
        h += G.path(`M${a},${Ln.y} Q${(a + b) / 2},${Ln.y - 62} ${b},${Ln.y}`, Ln.cls);
      }
      for (let v = 0; v <= 30; v += Ln.d) { h += G.circle(FX(v), Ln.y, 6, Ln.dot); h += G.t(FX(v), Ln.y + 32, v, v && S.pick === v ? "b" : "m"); }
    }
    for (let v = 1; v <= 30; v++) if (v % 4 === 0 || v % 6 === 0)
      h += G.tap(G.rect(FX(v) - 17, 96, 34, 214, "box hot", { opacity: 0 }), "f" + v);
    if (S.pick !== null) h += G.circle(FX(S.pick), 150, 13, "sok") + (S.pick % 6 === 0 ? G.circle(FX(S.pick), 280, 13, "sok") : "");
    return h;
  }

  function drawDigits(S) {
    let h = G.he(602, 70, "לחץ על כל ספרה כדי להוסיף אותה לסכום", "m", "right");
    const D = S.digits, x0 = 310 - D.length * 40;
    D.forEach((d, i) => {
      const on = S.tapped[i], x = x0 + i * 80;
      h += G.tap(G.rect(x + 6, 110, 68, 84, (on ? "fa" : "box") + " hot", { rx: 10 }), "d" + i);
      h += G.t(x + 40, 165, d, on ? "inv" : "big", "middle", { "pointer-events": "none", style: "font-size:34px" });
    });
    const got = D.filter((_, i) => S.tapped[i]);
    if (got.length) h += G.t(310, 260, got.join(" + ") + " = " + got.reduce((a, b) => a + b, 0), "big");
    if (S.note) h += G.he(310, 310, S.note, "ok", "middle");
    return h;
  }

  function draw(L) {
    const S = L.state;
    return S.mode === "array" ? drawArray(S) : S.mode === "grid" ? drawGrid(S) : S.mode === "bricks" ? drawBricks(S) : S.mode === "frogs" ? drawFrogs(S) : drawDigits(S);
  }
  function drag(L, key, pt) {
    const S = L.state;
    if (key === "w") S.w = sv(pt.x, S.wLo, S.wHi);
    if (key === "n") S.n = sv(pt.x, S.nLo, S.nHi);
  }
  function dragFrom(L, pt) {
    const S = L.state; if (S.mode !== "array" || pt.x < SX0 - 20 || pt.x > SX1 + 20) return null;
    if (S.wDrag && Math.abs(pt.y - WY) < 24) return "w";
    if (S.nDrag && Math.abs(pt.y - NY) < 24) return "n";
    return null;
  }
  function tap(L, key) {
    const S = L.state;
    if (key[0] === "g") { const v = +key.slice(1); S.sel[v] = !S.sel[v]; }
    else if (key[0] === "b") { const [ri, i] = key.slice(1).split(":").map(Number), R = S.rows[ri]; R.sel[i] = !R.sel[i]; }
    else if (key[0] === "f") S.pick = +key.slice(1);
    else if (key[0] === "d") S.tapped[+key.slice(1)] = true;
  }

  const arr = o => Object.assign({ mode: "array", n: 12, w: 2, wDrag: true, wLo: 2, wHi: 12, nDrag: false, nLo: 1, nHi: 40 }, o);
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const rows = (n, w) => Math.floor(n / w);
  const prod = R => R.bricks.reduce((a, p, i) => R.sel[i] ? a * p : a, 1);
  const cnt = (R, p) => R.bricks.filter((q, i) => R.sel[i] && q === p).length;

  Lab.register({
    id: "alg-primes-remainders", title: "מעבדת ראשוניים ושארית", viewBox: "0 0 620 415",
    chapters: ["מה זה ראשוני", "אבני בניין", "כפולה משותפת", "שארית", "שאלת מבחן"],
    draw, drag, dragFrom, tap,
    steps: [
      // ---- ch0: primes as "no rectangle"
      { ch: 0, setup: L => { L.state = arr({ n: 12, w: 2 }); },
        say: "לפניך 12 עיגולים. המחוון קובע כמה עיגולים יש בכל שורה. לסדר עיגולים בשורות שוות זה בדיוק לחלק.",
        task: "גרור את המחוון כך שהעיגולים ייצרו מלבן מלא של 3 שורות.",
        demo: L => { L.state.w = 4; L.act({ type: "drop" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const S = L.state, r = S.n % S.w, q = rows(S.n, S.w);
          if (q === 3 && !r) return true;
          if (r) return `נשארה שורה חלקית של ${r}, כלומר 12 לא מתחלק ב־${S.w}. נסה רוחב אחר.`;
          return `זה מלבן מלא, אבל יש בו ${q} שורות. צריך 3. שורות רחבות יותר = פחות שורות.`; },
        ok: "12 = 3 · 4. בכל פעם שהעיגולים יוצרים מלבן מלא, רוחב השורה הוא <b>מחלק</b> של המספר: ל־12 יש מלבנים ברוחב 2, 3, 4, 6." },
      { ch: 0, setup: L => { L.state = arr({ n: 13, w: 2 }); },
        say: "עכשיו 13 עיגולים.",
        task: "נסה למצוא רוחב (2 עד 12) שיוצר מלבן מלא. אם השתכנעת שאין כזה, לחץ 'אין מלבן'.",
        tools: () => [["אין מלבן", L => L.act({ type: "none" }), true]],
        demo: L => L.act({ type: "none" }),
        check: (L, e) => e.type === "none" ? true : e.type === "drop" ? `ברוחב ${L.state.w} נשארת שארית ${L.state.n % L.state.w}. נסה עוד רוחב, או לחץ 'אין מלבן'.` : null,
        ok: "נכון, אין. 13 אפשר לסדר רק בשורה אחת (או בעמודה אחת). זה <b>מספר ראשוני</b>: מתחלק רק ב־1 ובעצמו." },
      { ch: 0, setup: L => { L.state = { mode: "grid", sel: {} }; },
        say: "ראשוני = מספר שאי אפשר לסדר כמלבן. את הראשוניים הקטנים כדאי לזהות מיד.",
        task: "לחץ על כל הראשוניים מ־1 עד 20, ורק עליהם.",
        demo: L => { L.state.sel = {}; PRIMES.forEach(p => L.state.sel[p] = true); L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const s = L.state.sel, on = Object.keys(s).filter(k => s[k]).map(Number);
          if (s[1]) return "1 אינו ראשוני: יש לו מחלק אחד בלבד, ולראשוני יש בדיוק שניים (1 והמספר עצמו). בטל אותו.";
          const bad = on.find(v => !PRIMES.includes(v));
          if (bad) { const p = PRIMES.find(q => bad % q === 0); return `${bad} = ${p} · ${bad / p}, כלומר אפשר לסדר אותו כמלבן. הוא לא ראשוני.`; }
          if (on.length === 8) { L.state.reveal = true; return true; }
          if (on.length === 7 && !s[2]) return "חסר עוד אחד. רמז: הוא זוגי.";
          return null; },
        ok: "שמונה ראשוניים עד 20. שים לב: 2 הוא <b>הראשוני הזוגי היחיד</b>. כל זוגי אחר מתחלק ב־2." },
      { ch: 0, say: "בקורס כדאי לזכור עוד ראשוני אחד בעל־פה.", task: "מהו הראשוני הדו־ספרתי הגדול ביותר?",
        choices: ["91", "93", "97", "99"],
        check: pick(2, { 0: "91 נראה ראשוני, אבל 91 = 7 · 13.", 1: "93 = 3 · 31. סכום הספרות 12 מתחלק ב־3.", 3: "99 = 9 · 11." }),
        ok: "97. ו־91 = 7 · 13 הוא מלכודת קלאסית: נראה ראשוני ואינו." },

      // ---- ch1: prime bricks
      { ch: 1, setup: L => { L.state = { mode: "bricks", outY: 230, outLabel: "בנית:", rows: [{ num: 168, y: 110, bricks: [2, 2, 2, 3, 7], sel: [], tap: true }] }; },
        say: "כל מספר בנוי מ<b>גורמים ראשוניים</b>, כמו מלבנים. 168 = 2 · 2 · 2 · 3 · 7. מחלק של 168 בנוי רק מהלבנים שלו.",
        task: "לחץ על לבנים כדי לבנות את המחלק 12.",
        demo: L => { L.state.rows[0].sel = [true, true, false, true, false]; L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const R = L.state.rows[0], p = prod(R);
          if (p === 12) return true;
          if (R.sel[4]) return "7 לא נמצא בתוך 12. הסר אותו.";
          if (cnt(R, 2) > 2) return "יש לך שלושה גורמי 2, כלומר 8 בפנים. ל־12 צריך רק שניים.";
          return null; },
        ok: "12 = 2 · 2 · 3, וכל הלבנים האלה נמצאות ב־168. לכן 12 מחלק את 168 (168 = 12 · 14, ו־14 הן הלבנים שנשארו: 2 · 7)." },
      { ch: 1, setup: L => { L.state.rows[0].sel = []; L.state.rows[0].tap = false; },
        say: "עכשיו בלי ללחוץ. הסתכל על הלבנים.", task: "האם 18 מחלק את 168?",
        choices: ["כן, כי 2 ו־3 שניהם מופיעים ב־168", "לא, כי 18 = 2 · 3 · 3 וב־168 יש רק 3 אחד", "כן, כי שניהם זוגיים"],
        check: pick(1, { 0: "18 = 2 · 3 · 3. לא מספיק שהגורם קיים — צריך אותו <b>כמה פעמים</b> שהוא מופיע.", 2: "זוגיות מבטיחה רק גורם 2 משותף. כמה גורמי 3 יש ב־18?" }),
        ok: "בדיוק. 18 צריך שתי לבנים של 3, ול־168 יש רק אחת. סופרים גם את <b>כמות</b> הגורמים." },
      { ch: 1, setup: L => { L.state = { mode: "bricks", outY: 340, outLabel: "בנית:", rows: [{ num: 60, y: 100, bricks: [2, 2, 3, 5], sel: [], tap: true, label: "" }, { num: 84, y: 200, bricks: [2, 2, 3, 7], sel: [], tap: false }] }; },
        say: "<b>מחלק משותף גדול ביותר</b> בנוי מהלבנים ששני המספרים חולקים. 60 = 2 · 2 · 3 · 5 ו־84 = 2 · 2 · 3 · 7.",
        task: "סמן בשורה של 60 את הלבנים שיש גם ב־84, ולחץ 'זה המחלק המשותף'.",
        tools: () => [["זה המחלק המשותף", L => L.act({ type: "submit" }), true]],
        demo: L => { L.state.rows[0].sel = [true, true, true, false]; L.act({ type: "submit" }); },
        check: (L, e) => { const R = L.state.rows[0];
          if (e.type === "tap") return R.sel[3] ? "5 לא מופיע ב־84, ולכן הוא לא יכול להיות במחלק המשותף." : null;
          if (e.type !== "submit") return null;
          const p = prod(R);
          if (R.sel[3]) return "5 לא מופיע ב־84. הסר אותו.";
          if (p === 12) return true;
          if (!R.sel.some(Boolean)) return "עוד לא סימנת לבנים.";
          return `${p} מחלק את שניהם, אבל הוא לא הגדול ביותר. יש עוד לבנה משותפת שלא סימנת.`; },
        ok: "המחלק המשותף הגדול ביותר הוא 2 · 2 · 3 = 12. ‏60 = 12 · 5 ו־84 = 12 · 7, ול־5 ול־7 כבר אין שום דבר משותף." },

      // ---- ch2: common multiple (frogs) + divisibility signs
      { ch: 2, setup: L => { L.state = { mode: "frogs", pick: null }; },
        say: "שתי צפרדעים יוצאות מ־0. אחת קופצת 4 בכל פעם, השנייה 6. נקודה ששתיהן נוחתות בה מתחלקת ב־4 וגם ב־6.",
        task: "לחץ על הנקודה <b>הראשונה</b> (אחרי 0) ששתי הצפרדעים נוחתות בה.",
        demo: L => { L.state.pick = 12; L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const v = L.state.pick;
          if (v === 12) return true;
          if (v === 24) return "גם 24 משותף לשתיהן, וזה 4 · 6. אבל יש נקודה משותפת מוקדמת יותר.";
          if (v % 4 === 0 && v % 6) return `רק הצפרדע של 4 נוחתת ב־${v}. הצפרדע של 6 מדלגת עליו.`;
          return `רק הצפרדע של 6 נוחתת ב־${v}. הצפרדע של 4 מדלגת עליו.`; },
        ok: "12 היא <b>הכפולה המשותפת הקטנה</b> של 4 ו־6. כל נקודה משותפת אחרת (24) היא כפולה של 12." },
      { ch: 2, say: "וזו המלכודת שהקורס מזהיר ממנה.", task: "מספר מתחלק ב־4 וגם ב־6. במה הוא <b>בטוח</b> מתחלק?",
        choices: ["24", "12", "10", "48"],
        check: pick(1, { 0: "דוגמה נגדית מהמסך: 12 מתחלק ב־4 וב־6, אבל לא ב־24.", 2: "10 = 4 + 6. חיבור לא קשור כאן. הסתכל על הנקודות המשותפות.", 3: "12 מתחלק ב־4 וב־6, ובכל זאת לא ב־48." }),
        ok: "12. מתחלק ב־a וב־b ⇒ מתחלק בכפולה המשותפת הקטנה, לא בהכרח ב־a · b. ‏4 ו־6 חולקים גורם 2, ולכן 4 · 6 'סופר' אותו פעמיים." },
      { ch: 2, setup: L => { L.state = { mode: "digits", digits: [7, 4, 1, 6], tapped: [], note: "" }; },
        say: "סימני התחלקות: מספר מתחלק ב־3 (או ב־9) אם <b>סכום הספרות</b> שלו מתחלק ב־3 (או ב־9).",
        task: "לחץ על כל ארבע הספרות של 7,416.",
        demo: L => { L.state.tapped = [true, true, true, true]; L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; if (L.state.tapped.filter(Boolean).length === 4) { L.state.note = "18 מתחלק ב־3 וגם ב־9"; return true; } return null; },
        ok: "סכום הספרות 18, ולכן 7,416 מתחלק ב־3 וגם ב־9. (בדיקה: 7,416 = 9 · 824.)" },
      { ch: 2, task: "האם 7,416 מתחלק ב־6?",
        choices: ["כן: הוא זוגי וגם מתחלק ב־3", "לא: סכום הספרות לא מתחלק ב־6", "אי אפשר לדעת בלי לחלק"],
        check: pick(0, { 1: "הסימן של 6 הוא לא סכום הספרות. 6 = 2 · 3, אז בודקים 2 וגם 3.", 2: "אפשר: 6 = 2 · 3. בדוק אם הוא זוגי ואם הוא מתחלק ב־3." }),
        ok: "מתחלק ב־6 = מתחלק ב־2 וגם ב־3. ‏7,416 = 6 · 1,236. (ולגבי 4: בודקים את שתי הספרות האחרונות, 16, כן.)" },

      // ---- ch3: remainder
      { ch: 3, setup: L => { L.state = arr({ n: 23, w: 2, wHi: 10 }); },
        say: "חזרה לעיגולים. לחלק 23 ב־5 = לסדר 23 עיגולים בשורות של 5.",
        task: "קבע רוחב שורה 5.",
        demo: L => { L.state.w = 5; L.act({ type: "drop" }); },
        check: (L, e) => e.type !== "drop" ? null : L.state.w === 5 ? true : `זה רוחב ${L.state.w}. מחלקים ב־5, אז בכל שורה 5 עיגולים.`,
        ok: "23 = 4 · 5 + 3: ‏4 שורות מלאות הן ה<b>מנה</b>, ו־3 העיגולים בשורה החלקית הם ה<b>שארית</b>." },
      { ch: 3, setup: L => { Object.assign(L.state, { wDrag: false, nDrag: true, nLo: 20, nHi: 30 }); },
        say: "עכשיו רוחב השורה קבוע (5), ואתה משנה את מספר העיגולים.",
        task: "גרור את מחוון העיגולים כך שהשארית תהיה <b>הגדולה ביותר האפשרית</b>.",
        demo: L => { L.state.n = 24; L.act({ type: "drop" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const r = L.state.n % 5;
          if (r === 4) return true;
          if (r === 0) return "השורה החלקית התמלאה והפכה לשורה מלאה, אז השארית חזרה ל־0. נסה עיגול אחד פחות.";
          return `השארית כרגע ${r}. אפשר יותר. הוסף עיגולים, ושים לב מה קורה כשהשורה מתמלאת.`; },
        ok: "השארית הגדולה ביותר בחלוקה ב־5 היא 4. עוד עיגול אחד והשורה מלאה, והשארית חוזרת ל־0." },
      { ch: 3, task: "מהי השארית הגדולה ביותר האפשרית בחלוקה ב־12?",
        choices: ["12", "11", "6", "13"],
        check: pick(1, { 0: "12 עיגולים בשורה של 12 הם שורה מלאה, לא שארית.", 2: "שארית יכולה להיות כל מספר עד שהשורה מתמלאת, לא רק עד חצי.", 3: "שארית תמיד קטנה מהמחלק." }),
        ok: "שארית בחלוקה ב־n היא תמיד בין 0 ל־n − 1. שארית שווה למחלק או גדולה ממנו – לא ייתכן." },

      // ---- ch4: exam
      { ch: 4, setup: L => { L.state = arr({ n: 4, w: 6, wDrag: false, nDrag: true, nLo: 1, nHi: 40 }); },
        say: "שאלה ברמת מבחן. העיגולים מסודרים בשורות של 6 ואפשר להזיז את מחוון העיגולים. הקורס ממליץ: הצב מספר קטן שעומד בתנאי.",
        task: "כשמחלקים מספר שלם חיובי x ב־6 מתקבלת שארית 4. מה השארית כשמחלקים את 2x ב־6?",
        choices: ["4", "8", "2", "0"],
        check: pick(2, { 0: "הצב x = 4: אז 2x = 8. כמה עיגולים נשארים בשורה החלקית כש־8 מסודרים בשורות של 6?", 1: "שארית בחלוקה ב־6 לא יכולה להיות 8. ‏8 עיגולים יוצרים שורה מלאה ועוד משהו.", 3: "הצב x = 4: אז 2x = 8. האם 8 מתחלק ב־6?" }),
        ok: "x = 4 → ‏2x = 8 = 1 · 6 + 2. ‏נבדוק עוד הצבה: x = 10 → ‏2x = 20 = 3 · 6 + 2. השארית <b>2</b>. (באופן כללי: 2x = 12q + 8, ו־8 נותן שארית 2.)" },
      { ch: 4, say: "<b>סיכום המעבדה:</b><br>1. ראשוני = אי אפשר לסדר כמלבן. ‏1 אינו ראשוני, ו־2 הוא הזוגי היחיד.<br>2. מחלק בנוי רק מהגורמים הראשוניים של המספר, ולא יותר פעמים ממה שיש בו.<br>3. מתחלק ב־a וב־b ⇒ מתחלק בכפולה המשותפת הקטנה (4 ו־6 → 12, לא 24).<br>4. מספר = מנה · מחלק + שארית, והשארית קטנה מהמחלק. בשאלות שארית – מציבים מספר קטן.", next: "סיום המעבדה" },
    ],
  });
})();
