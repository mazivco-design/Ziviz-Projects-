/* Lab: תנועה — a road with two movers and a draggable clock (time slider). */
(function () {
  const { G } = Lab, X0 = 50, X1 = 550, RY = 172, SY = 318;
  // ---- model helpers ----
  const dur = t => { const m = Math.round(t * 60), h = Math.floor(m / 60), mm = m % 60;
    const hs = h === 1 ? "שעה" : h === 2 ? "שעתיים" : h + " שעות";
    return h === 0 ? mm + " דקות" : mm === 0 ? hs : hs + " ו־" + mm + " דקות"; };
  const clock = mins => { mins = Math.round(mins); return Math.floor(mins / 60) + ":" + String(mins % 60).padStart(2, "0"); };
  const tOf = S => S.k * S.step;
  function trav(m, t, len) {               // distance covered by mover m at time t
    const tt = Math.max(0, t - (m.dep || 0));
    if (m.legs) { let left = tt, d = 0; for (const lg of m.legs) { const need = lg.d / lg.v; if (left >= need) { d += lg.d; left -= need; } else { d += lg.v * left; left = 0; break; } } return d; }
    const max = m.dir > 0 ? len - m.start : m.start; return Math.min(m.v * tt, max);
  }
  function pos(m, t, len) {
    if (!m.legs) return m.start + m.dir * trav(m, t, len);
    let d = trav(m, t, len), p = m.start;
    for (const lg of m.legs) { const s = Math.min(d, lg.d); p += lg.dir * s; d -= s; if (d <= 0) break; }
    return p;
  }
  const road = o => Object.assign({ len: 300, tick: 60, k: 0, step: .5, tMax: 5, movers: [], flag: null, clock0: null, units: "h", gap: false, lock: false, avg: false }, o);
  const car = o => Object.assign({ name: "א", cls: "a", start: 0, dir: 1, v: 60, dep: 0 }, o);
  const X = (S, km) => X0 + (X1 - X0) * km / S.len;

  function draw(L) {
    const S = L.state, t = tOf(S); let h = "";
    // legend (top right)
    S.movers.forEach((m, i) => h += G.he(600, 30 + i * 24, m.desc || (m.name + " — " + m.v + " קמ\"ש"), m.cls === "a" ? "a" : "blue", "right"));
    // time readout (top left)
    h += G.he(20, 32, "זמן נסיעה: " + dur(t), "b", "left");
    if (S.clock0 !== null) h += G.he(20, 56, "השעה " + clock(S.clock0 + t * 60), "m", "left");
    // road
    h += G.rect(X0, RY, X1 - X0, 16, "bg", { rx: 3 });
    for (let km = 0; km <= S.len + 1e-9; km += S.tick) { const x = X(S, km); h += G.line(x, RY + 16, x, RY + 23, "mut") + G.t(x, RY + 38, G.fmt(km), "m"); }
    h += G.he(X1 + 20, RY + 38, "ק\"מ", "m", "left");
    if (S.flag !== null) { const fx = X(S, S.flag); h += G.line(fx, RY, fx, RY + 16, "sok") + G.poly([[fx, RY + 46], [fx - 9, RY + 60], [fx + 9, RY + 60]], "fok") + G.he(fx, RY + 80, "יעד", "ok", "middle"); }
    // gap between two movers
    if (S.gap && S.movers.length === 2) {
      const [a, b] = S.movers.map(m => pos(m, t, S.len)), g = Math.abs(a - b);
      const passed = S.gap === "toward" && a > b + 1e-9;
      if (g > 1e-9) h += G.rect(X(S, Math.min(a, b)), RY + 3, X(S, Math.max(a, b)) - X(S, Math.min(a, b)), 10, "fwarn");
      if (t > 0 || g > 1e-9) h += G.he(20, 80, passed ? "כבר חלפו זו על פני זו" : g < 1e-9 ? "נפגשו!" : "רווח ביניהן: " + G.fmt(g) + " ק\"מ", g < 1e-9 ? "ok" : "w", "left");
    }
    // movers: first above the road, second below
    S.movers.forEach((m, i) => {
      const p = pos(m, t, S.len), x = X(S, p), up = i === 0, d = trav(m, t, S.len), waiting = t < (m.dep || 0);
      const tr = up ? RY + 4 : RY + 12, cls = m.cls === "a" ? "sa" : "sblue";
      if (m.legs) { let dd = d, pp = m.start; m.legs.forEach((lg, j) => { const s = Math.min(dd, lg.d); if (s > 0) h += G.line(X(S, pp), RY + 4 + j * 8, X(S, pp + lg.dir * s), RY + 4 + j * 8, j ? "sblue" : "sa"); pp += lg.dir * s; dd -= s; }); }
      else if (d > 0) h += G.line(X(S, m.start), tr, x, tr, cls);
      const cy = up ? RY - 30 : RY + 50;
      h += G.rect(x - 17, cy - 11, 34, 22, waiting ? "ghost" : m.cls === "a" ? "fa" : "fblue", { rx: 7 });
      h += G.he(x, cy + 6, m.name, waiting ? "m" : "inv", "middle");
      const ly = up ? cy - 20 : cy + 32;
      h += G.he(x, ly, waiting ? "ממתינה" : G.fmt(d) + " ק\"מ", waiting ? "m" : m.cls === "a" ? "a" : "blue", "middle");
    });
    if (S.avg && t > 0) { const d = trav(S.movers[0], t, S.len);
      h += G.he(X0, RY + 84, "מהירות ממוצעת עד עכשיו (קמ\"ש):", "w", "left") + G.t(X0, RY + 108, G.fmt(d) + " ÷ " + G.fmt(t) + " = " + G.fmt(d / t), "w", "start"); }
    // time slider
    const N = Math.round(S.tMax / S.step), kx = k => X0 + (X1 - X0) * k / N;
    h += G.line(X0, SY, X1, SY, "mut") + G.line(X0, SY, kx(S.k), SY, "sa");
    const tickEvery = S.units === "min" ? .25 : 1;
    for (let tt = 0; tt <= S.tMax + 1e-9; tt += tickEvery) { const x = X0 + (X1 - X0) * tt / S.tMax;
      h += G.line(x, SY - 6, x, SY + 6, "mut") + G.t(x, SY + 30, S.units === "min" ? String(Math.round(tt * 60)) : S.clock0 !== null ? clock(S.clock0 + tt * 60) : String(tt), "m"); }
    h += G.he(X1 + 4, SY + 52, S.units === "min" ? "דקות" : S.clock0 !== null ? "שעה" : "שעות", "m", "left");
    if (!S.lock) h += G.knob(kx(S.k), SY, "t", 16); else h += G.circle(kx(S.k), SY, 9, "fa");
    return h;
  }
  function drag(L, key, pt) { const S = L.state; if (S.lock) return; const N = Math.round(S.tMax / S.step); S.k = Math.max(0, Math.min(N, Math.round((pt.x - X0) / (X1 - X0) * N))); }
  const dragFrom = (L, pt) => !L.state.lock && pt.y > SY - 40 && pt.y < SY + 40 && pt.x > X0 - 25 && pt.x < X1 + 25 ? "t" : null;
  const setT = (L, t) => { L.state.k = Math.round(t / L.state.step); L.act({ type: "drop", key: "t" }); };
  const atT = (want, hint) => (L, e) => e.type !== "drop" ? null : Math.abs(tOf(L.state) - want) < 1e-9 ? true : hint(tOf(L.state), L);
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const M = (L, i) => L.state.movers[i];

  Lab.register({
    id: "prb-motion", title: "מעבדת תנועה", viewBox: "0 0 620 380",
    chapters: ["דרך = מהירות × זמן", "דקות ושעות", "זו לקראת זו", "מרדף", "מהירות ממוצעת", "שאלת מבחן"],
    draw, drag, dragFrom,
    steps: [
      { ch: 0, setup: L => { L.state = road({ len: 360, tick: 60, tMax: 6, step: .5, flag: 150, movers: [car({ v: 60 })] }); },
        say: "זה כביש, ומכונית שנוסעת במהירות קבועה של 60 קמ\"ש. מתחת לכביש יש שעון: גוררים אותו, והזמן זז קדימה.",
        task: "גרור את השעון עד שהמכונית מגיעה בדיוק לדגל (150 ק\"מ).",
        demo: L => setT(L, 2.5),
        check: atT(2.5, t => t < 2.5 ? "עוד לא הגיעה. בכל שעה היא עוברת 60 ק\"מ. כמה שעות צריך ל־150?" : "עברת את הדגל. אחרי שעתיים היא ב־120 ק\"מ, ואחרי 3 שעות כבר ב־180."),
        ok: "שעתיים וחצי. בכל שעה נוספים 60 ק\"מ: 60 × 2.5 = 150. זו הנוסחה כולה: <b>דרך = מהירות × זמן</b>." },
      { ch: 0, setup: L => { const S = L.state; S.k = 8; S.lock = true; S.flag = 300; M(L, 0).v = 60; },
        say: "עכשיו הזמן נעול על 4 שעות, ואתה שולט במהירות.",
        task: "כוון את המהירות כך שהמכונית תגיע בדיוק ליעד, 300 ק\"מ, אחרי 4 שעות. אחר כך לחץ 'בדוק'.",
        tools: () => [["− 5 קמ\"ש", L => { const m = M(L, 0); m.v = Math.max(5, m.v - 5); }], ["+ 5 קמ\"ש", L => { M(L, 0).v += 5; }], ["בדוק", L => L.act({ type: "check" }), true]],
        demo: L => { M(L, 0).v = 75; L.act({ type: "check" }); },
        check: (L, e) => { if (e.type !== "check") return null; const v = M(L, 0).v, d = v * 4; return v === 75 ? true : v < 75 ? "ב־4 שעות היא עוברת רק " + d + " ק\"מ. צריך מהירות גבוהה יותר." : "היא עוברת " + d + " ק\"מ, יותר מהיעד. הורד מהירות."; },
        ok: "75 × 4 = 300. ובכיוון ההפוך: <b>מהירות = דרך ÷ זמן</b> = 300 ÷ 4. שלוש הנוסחאות הן אותה נוסחה." },
      { ch: 1, setup: L => { L.state = road({ len: 120, tick: 30, tMax: 1, step: .25, units: "min", movers: [car({ v: 120, desc: "מכונית — 120 קמ\"ש" })] }); },
        say: "מכונית נוסעת במהירות 120 קמ\"ש. השעון מודד עכשיו דקות.",
        task: "לפני שגוררים: כמה ק\"מ היא תעבור ב־45 דקות?",
        choices: ["54 ק\"מ", "90 ק\"מ", "45 ק\"מ", "100 ק\"מ"],
        check: (L, e) => { if (e.type !== "choice") return null; L.memo.min = e.j; return true; },
        ok: L => L.memo.min === 1 ? "בוא נבדוק על הכביש." : "בוא נבדוק את זה על הכביש." },
      { ch: 1, say: "השעון מחולק לרבעי שעה.", task: "גרור את השעון ל־45 דקות.",
        demo: L => setT(L, .75),
        check: atT(.75, t => t < .75 ? "עוד קצת. כל שנתה היא 15 דקות." : "עברת. 45 דקות הן שלוש שנתות."),
        ok: L => (L.memo.min === 0 ? "54 זו בדיוק המלכודת: 45 דקות הן לא 0.45 שעה. " : "") + "45 דקות הן <b>3/4 שעה</b>, ולכן 120 × 3/4 = 90 ק\"מ. דקות הופכים לשבר של שעה: מחלקים ב־60." },
      { ch: 1, say: "בדיקה מהירה.", task: "כמה שעות הן 40 דקות?", choices: ["0.4", "2/3", "0.6", "4/6 של דקה"],
        check: pick(1, { 0: "40 דקות הן 40 מתוך 60 דקות, לא מתוך 100.", 2: "0.6 שעה זה 36 דקות. חלק 40 ב־60.", 3: "40 ÷ 60 = 4/6. אבל של שעה." }),
        ok: "40/60 = 2/3 שעה. הטריק: 20 דקות הן שליש שעה, ולכן 40 דקות הן שני שלישים." },
      { ch: 2, setup: L => { L.state = road({ len: 280, tick: 40, tMax: 3, step: .5, clock0: 8 * 60, gap: "toward",
          movers: [car({ name: "א", v: 60, desc: "א — 60 קמ\"ש" }), car({ name: "ב", cls: "b", v: 80, start: 280, dir: -1, desc: "ב — 80 קמ\"ש" })] }); },
        say: "שתי מכוניות יוצאות ב־8:00 משני קצות כביש של 280 ק\"מ, זו לקראת זו. הפס הצהוב הוא הרווח ביניהן.",
        task: "גרור את השעון לשעה 9:00, שעה אחת אחרי היציאה.",
        demo: L => setT(L, 1),
        check: atT(1, () => "כוון לשעה 9:00, שנתה אחת אחרי ההתחלה."),
        ok: "א עברה 60 ק\"מ, ב עברה 80 ק\"מ. הרווח ירד מ־280 ל־140." },
      { ch: 2, say: "תסתכל על השינוי ברווח, לא על כל מכונית לחוד.", task: "בכמה ק\"מ הרווח מצטמצם בכל שעה?",
        choices: ["20 ק\"מ (80 − 60)", "140 ק\"מ (60 + 80)", "70 ק\"מ (הממוצע)"],
        check: pick(1, { 0: "הן לא בורחות זו מזו. כל אחת סוגרת חלק מהרווח. כמה סוגרות שתיהן ביחד?", 2: "אחרי שעה הרווח ירד מ־280 ל־140. בכמה זה?" }),
        ok: "מתקרבים זו לקראת זו → <b>מחברים מהירויות</b>. אפשר לדמיין ש־א עומדת, ו־ב נוסעת אליה ב־140 קמ\"ש." },
      { ch: 2, task: "עכשיו גרור את השעון לרגע המפגש.",
        demo: L => setT(L, 2),
        check: atT(2, t => t < 2 ? "עדיין נשארו " + G.fmt(280 - 140 * t) + " ק\"מ ביניהן." : "הן כבר חלפו זו על פני זו. חזור אחורה."),
        ok: "280 ÷ 140 = 2 שעות, כלומר מפגש ב־10:00. שים לב: א עברה 120 וב עברה 160, יחס 3:4, בדיוק כמו יחס המהירויות 60:80." },
      { ch: 2, setup: L => { L.state = road({ len: 300, tick: 50, tMax: 3, step: .5, gap: "toward",
          movers: [car({ name: "א", v: 50, desc: "א — 50 קמ\"ש" }), car({ name: "ב", cls: "b", v: 100, start: 300, dir: -1, desc: "ב — 100 קמ\"ש, פי 2 מהר" })] }); },
        say: "עכשיו ב מהירה פי 2 מ־א. אפשר לגרור את השעון ולבדוק.",
        task: "איזה חלק מהדרך תעבור ב עד המפגש?", choices: ["1/2", "2/3", "3/4", "1/3"],
        check: pick(1, { 0: "חצי היה נכון אם הן היו באותה מהירות. ב מהירה יותר, אז עוברת יותר.", 2: "באותו זמן, ב עוברת פי 2 מ־א. אם א עברה חלק אחד, כמה חלקים עברה ב?", 3: "זה החלק של א. ב מהירה יותר, אז עוברת יותר." }),
        ok: "באותו זמן המרחקים ביחס המהירויות, 1:2. הדרך מתחלקת ל־3 חלקים, ו־ב עוברת 2 מהם: 200 ק\"מ מתוך 300." },
      { ch: 3, setup: L => { L.state = road({ len: 240, tick: 30, tMax: 4, step: .5, clock0: 7 * 60, gap: "chase",
          movers: [car({ name: "א", v: 60, desc: "א (משאית) — 60 קמ\"ש, 7:00" }), car({ name: "ב", cls: "b", v: 90, dep: 1, desc: "ב — 90 קמ\"ש, 8:00" })] }); },
        say: "מרדף: משאית יוצאת ב־7:00. מכונית יוצאת מאותה נקודה ובאותו כיוון שעה אחריה.",
        task: "גרור את השעון לרגע שבו המכונית יוצאת לדרך.",
        demo: L => setT(L, 1),
        check: atT(1, t => t < 1 ? "המכונית עוד ממתינה. היא יוצאת ב־8:00." : "המכונית כבר בדרך. חזור לרגע היציאה שלה, 8:00."),
        ok: "ברגע הזה המשאית כבר 60 ק\"מ לפניה. זה ה<b>ראש</b> שלה, והמרדף מתחיל ממנו." },
      { ch: 3, say: "מכאן שתיהן נוסעות באותו כיוון.", task: "בכמה ק\"מ הרווח מצטמצם בכל שעה של מרדף?",
        choices: ["150 ק\"מ", "30 ק\"מ", "90 ק\"מ", "60 ק\"מ"],
        check: pick(1, { 0: "מחברים רק כשנוסעים זו לקראת זו. כאן המשאית בורחת מהמכונית.", 2: "המכונית אכן עוברת 90 ק\"מ בשעה, אבל גם המשאית מתקדמת 60 באותה שעה.", 3: "זו המהירות של המשאית. כמה המכונית מהירה ממנה?" }),
        ok: "במרדף <b>מחסרים מהירויות</b>: 90 − 60 = 30. המכונית 'סוגרת' 30 ק\"מ בשעה." },
      { ch: 3, task: "גרור את השעון לרגע שבו המכונית משיגה את המשאית.",
        demo: L => setT(L, 3),
        check: atT(3, t => t < 1 ? "המכונית עוד לא יצאה." : t < 3 ? "עדיין יש רווח של " + G.fmt(60 - 30 * (t - 1)) + " ק\"מ." : "המכונית כבר עקפה. חזור אחורה."),
        ok: "ראש של 60 ק\"מ ÷ 30 קמ\"ש = 2 שעות מרגע היציאה של המכונית. כלומר ב־10:00, ושתיהן ב־180 ק\"מ." },
      { ch: 4, setup: L => { L.state = road({ len: 120, tick: 20, tMax: 5, step: .5, avg: true,
          movers: [car({ name: "א", desc: "הלוך 60 קמ\"ש, חזור 40 קמ\"ש", legs: [{ d: 120, v: 60, dir: 1 }, { d: 120, v: 40, dir: -1 }] })] }); },
        say: "מכונית נוסעת 120 ק\"מ ליעד במהירות 60 קמ\"ש, וחוזרת באותו כביש במהירות 40 קמ\"ש.",
        task: "מה לדעתך המהירות הממוצעת שלה בכל הנסיעה?",
        choices: ["50 קמ\"ש", "פחות מ־50 קמ\"ש", "יותר מ־50 קמ\"ש"],
        check: (L, e) => { if (e.type !== "choice") return null; L.memo.avg = e.j; return true; },
        ok: "נבדוק על הכביש." },
      { ch: 4, say: "הקו הוורוד הוא ההלוך, והכחול הוא החזור.", task: "גרור את השעון עד שהמכונית חוזרת לנקודת ההתחלה.",
        demo: L => setT(L, 5),
        check: atT(5, t => t < 2 ? "היא עוד בדרך ליעד." : "היא בדרך חזרה, אבל עוד לא הגיעה."),
        ok: L => (L.memo.avg === 0 ? "50 זו המלכודת. " : L.memo.avg === 1 ? "צדקת. " : "") + "כל הדרך 240 ק\"מ, כל הזמן 5 שעות: 240 ÷ 5 = <b>48 קמ\"ש</b>. בחזור האיטי היא בילתה יותר זמן (3 שעות מול 2), ולכן המהירות האיטית 'שוקלת' יותר." },
      { ch: 4, say: "בלי כביש הפעם.", task: "רץ רץ 6 ק\"מ במהירות 10 קמ\"ש, ועוד 6 ק\"מ במהירות 15 קמ\"ש. מה המהירות הממוצעת שלו?",
        choices: ["12.5 קמ\"ש", "12 קמ\"ש", "13 קמ\"ש", "25 קמ\"ש"],
        check: pick(1, { 0: "זה ממוצע המהירויות. חשב כל הדרך ÷ כל הזמן.", 2: "חשב את הזמן של כל קטע: 6 ÷ 10 ו־6 ÷ 15.", 3: "חיברת את המהירויות. מהירות ממוצעת = כל הדרך ÷ כל הזמן." }),
        ok: "זמן: 0.6 + 0.4 = שעה אחת. דרך: 12 ק\"מ. ממוצע: 12 ÷ 1 = 12 קמ\"ש, פחות מ־12.5." },
      { ch: 5, setup: L => { L.state = road({ len: 40, tick: 5, tMax: 2.5, step: 1 / 6, clock0: 8 * 60, gap: "chase",
          movers: [car({ name: "א", v: 15, desc: "א — 15 קמ\"ש, 8:00" }), car({ name: "ב", cls: "b", v: 25, dep: 2 / 3, desc: "ב — 25 קמ\"ש, 8:40" })] }); },
        say: "שאלה ברמת מבחן. הכביש פתוח לשימוש חופשי, והשעון זז בקפיצות של 10 דקות.",
        task: "רוכב א יצא ב־8:00 במהירות 15 קמ\"ש. ב־8:40 יצא רוכב ב מאותה נקודה ובאותו כיוון, במהירות 25 קמ\"ש. באיזו שעה ישיג ב את א?",
        choices: ["8:55", "9:16", "9:40", "10:00"],
        check: pick(2, { 0: "חיברת מהירויות, אבל זה מרדף. מחסרים: 25 − 15.", 1: "השתמשת ב־0.4 שעה. 40 דקות הן 2/3 שעה, ולכן הראש הוא 10 ק\"מ.", 3: "בדוק על הכביש: ב־10:00 א עבר 30 ק\"מ וב עבר רק 20." }),
        ok: "ראש: 15 × 2/3 = 10 ק\"מ. מהירות סגירה: 25 − 15 = 10 קמ\"ש. זמן: שעה אחת מ־8:40, כלומר <b>9:40</b>. שניהם ב־25 ק\"מ." },
      { ch: 5, say: "<b>סיכום המעבדה:</b><br>1. דרך = מהירות × זמן. דקות הופכים לשבר של שעה (45 ד' = 3/4).<br>2. זו לקראת זו → מחברים מהירויות. מרדף → מחסרים, ולא שוכחים את הראש.<br>3. באותו זמן, המרחקים ביחס המהירויות.<br>4. מהירות ממוצעת = כל הדרך ÷ כל הזמן, לא ממוצע המהירויות.", next: "סיום המעבדה" },
    ],
  });
})();
