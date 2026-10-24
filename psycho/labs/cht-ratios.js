/* Lab: אחוזים, ממוצעים ויחסים מתוך טבלה — area model (total = units × per-unit), width-weighted percent bars, inverse-ratio bars. */
(function () {
  const { G } = Lab;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const BASE = 320;                     // baseline for area + library modes
  const PX_DAY = 12, PX_UNIT = 2;       // area model: 1 day = 12px wide, 1 ₪/day = 2px high
  const MK = { x: 60, w: 480, top: 90, h: 200 };   // percent bars
  const hit = (x, y, w, h, key) => G.tap(G.rect(x, y, w, h, "hot", { fill: "none", "pointer-events": "all" }), key);

  // ---------- area model ----------
  function areaLayout(S) { let x = 594; return S.items.map(it => { const w = it.days * PX_DAY; x -= w; const r = { x, w }; x -= 26; return r; }); }
  function drawArea(S) {
    let h = G.he(600, 28, S.title, "b", "right") + G.he(600, 52, "רוחב = מספר ימים · גובה = מחיר ליום · שטח = מחיר כולל", "m", "right");
    const lay = areaLayout(S);
    S.items.forEach((it, k) => {
      const { x, w } = lay[k], mid = x + w / 2;
      h += G.he(mid, 84, "מחיר: " + G.fmt(it.total) + " ₪", "b", "middle");
      if (it.h === null) { h += G.rect(x, BASE - 150, w, 150, "ghost") + G.t(mid, BASE - 70, "?", "big"); }
      else {
        const top = BASE - it.h * PX_UNIT, area = it.days * it.h, good = area === it.total;
        h += G.rect(x, top, w, BASE - top, good ? "fok-soft" : area > it.total ? "fwarn" : "fblue-soft");
        // day ticks along the bottom
        for (let d = 1; d < it.days; d++) h += G.line(x + d * PX_DAY, BASE - 6, x + d * PX_DAY, BASE, "thin", { opacity: .5 });
        if (BASE - top > 46) h += G.t(mid, (top + BASE) / 2 + 2, G.fmt(area), good ? "ok" : "b") + G.he(mid, (top + BASE) / 2 + 22, good ? "שווה למחיר" : area > it.total ? "יותר מדי" : "חסר", "m", "middle");
        h += G.he(mid, top - (it.drag ? 24 : 10), G.fmt(it.h) + " ₪ ליום", "a", "middle");
        if (it.drag) h += G.knob(mid, top, "h" + k, 15);
      }
      h += G.line(x - 4, BASE, x + w + 4, BASE, "ink");
      h += G.he(mid, BASE + 24, it.name, "b", "middle") + G.he(mid, BASE + 46, it.days + " ימים", "m", "middle");
      if (S.tap) h += G.tap(G.rect(x, 64, w, BASE - 64, "hot", { fill: "none", "pointer-events": "all" }), "i" + k);
      if (S.sel === k) h += G.rect(x - 6, 64, w + 12, BASE + 56 - 64, "sok", { rx: 8 });
    });
    return h;
  }
  // ---------- width-weighted percent bars ----------
  function drawMekko(S) {
    let h = G.he(600, 28, S.title, "b", "right") + G.he(600, 52, S.sub, "m", "right");
    const total = S.groups.reduce((s, g) => s + g.n, 0), u = MK.w / total, bot = MK.top + MK.h;
    if (!S.merged) {
      let x = MK.x;
      S.groups.forEach(g => {
        const w = g.n * u, fy = bot - MK.h * g.pct / 100;
        h += G.rect(x, MK.top, w, MK.h, "bg") + G.rect(x, fy, w, bot - fy, "fa");
        h += G.t(x + w / 2, fy + 22, g.pct + "%", "inv");
        if (S.counts) h += G.he(x + w / 2, fy + 42, G.fmt(g.n * g.pct / 100) + " " + S.what, "inv", "middle");
        h += G.he(x + w / 2, bot + 22, g.name, "b", "middle") + G.t(x + w / 2, bot + 44, G.fmt(g.n), "m");
        x += w + 6;
      });
    } else {
      const fy = bot - MK.h * S.level / 100, need = S.groups.reduce((s, g) => s + g.n * g.pct / 100, 0);
      h += G.rect(MK.x, MK.top, MK.w, MK.h, "bg") + G.rect(MK.x, fy, MK.w, bot - fy, "fa", { opacity: .85 });
      h += G.line(MK.x, fy, MK.x + MK.w + 18, fy, "sa") + G.knob(MK.x + MK.w + 30, fy, "lv", 15);
      if (bot - fy > 30) h += G.t(MK.x + MK.w / 2, fy + 22, S.level + "% × " + G.fmt(total) + " = " + G.fmt(total * S.level / 100), "inv");
      h += G.he(MK.x + MK.w, MK.top - 12, "יחד: " + G.fmt(need) + " " + S.what + " מתוך " + G.fmt(total), "a", "right");
      h += G.he(MK.x + MK.w / 2, bot + 22, "שני המכונים יחד", "b", "middle") + G.t(MK.x + MK.w / 2, bot + 44, G.fmt(total), "m");
    }
    for (const p of [0, 50, 100]) h += G.t(MK.x - 8, bot - MK.h * p / 100 + 5, p + "%", "m", "end");
    return h;
  }
  // ---------- libraries: table + ratio bars ----------
  function drawLib(S) {
    let h = G.he(600, 28, "ספריות", "b", "right");
    // table on the right
    const ry = [70, 104, 138, 172];
    h += G.line(390, ry[0] + 10, 600, ry[0] + 10, "ink");
    h += G.he(570, ry[0], "ספרייה", "b", "middle") + G.he(490, ry[0], "ספרים", "b", "middle") + G.he(420, ry[0], "עובדים", "b", "middle");
    S.libs.forEach((l, i) => { h += G.he(570, ry[i + 1], l.name.replace("ספרייה ", ""), "b", "middle") + G.t(490, ry[i + 1], G.fmt(l.books)) + G.t(420, ry[i + 1], G.fmt(l.staff)); });
    // bars on the left
    const vals = S.libs.map(l => S.flip ? l.staff / l.books * 1000 : l.books / l.staff), mx = S.flip ? 3 : 700, H = 190;
    h += G.he(30, 110, S.flip ? "עובדים לכל 1,000 ספרים" : "ספרים לעובד", "a", "left");
    S.libs.forEach((l, i) => {
      const x = 40 + i * 110, bh = vals[i] / mx * H, top = BASE - bh;
      const r = G.rect(x, top, 70, bh, (S.sel === i ? "fa" : "fblue-soft") + (S.tap ? " hot" : ""));
      h += S.tap ? G.tap(r, "l" + i) + hit(x - 10, BASE - H, 90, H + 40, "l" + i) : r;
      h += G.t(x + 35, top - 8, S.flip ? G.fmt(Math.round(vals[i] * 100) / 100) : G.fmt(vals[i]), "b");
      h += G.he(x + 35, BASE + 24, l.name, "b", "middle");
    });
    return h + G.line(30, BASE, 360, BASE, "ink");
  }

  function draw(L) { const S = L.state; return S.mode === "area" ? drawArea(S) : S.mode === "mekko" ? drawMekko(S) : drawLib(S); }
  function drag(L, key, pt) {
    const S = L.state;
    if (key[0] === "h") { const it = S.items[+key.slice(1)]; it.h = clamp(Math.round((BASE - pt.y) / PX_UNIT / 5) * 5, 0, 120); }
    if (key === "lv") S.level = clamp(Math.round((MK.top + MK.h - pt.y) / MK.h * 100 / 5) * 5, 0, 100);
  }
  function dragFrom(L, pt) {
    const S = L.state;
    if (S.mode === "area") { const lay = areaLayout(S); const k = S.items.findIndex((it, k) => it.drag && pt.x > lay[k].x - 6 && pt.x < lay[k].x + lay[k].w + 6 && pt.y > 60 && pt.y < BASE + 10); return k >= 0 ? "h" + k : null; }
    if (S.mode === "mekko" && S.merged && pt.x > MK.x && pt.y > MK.top - 20 && pt.y < MK.top + MK.h + 20) return "lv";
    return null;
  }
  function tap(L, key) { const S = L.state; S.sel = +key.slice(1); }
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const S_ = L => L.state;
  const areaHint = (it) => { const a = it.days * it.h; return a > it.total ? `${it.days} × ${it.h} = ${G.fmt(a)}, יותר מ־${G.fmt(it.total)}. הנמך.` : `${it.days} × ${it.h} = ${G.fmt(a)}, פחות מ־${G.fmt(it.total)}. הגבה.`; };
  const trips = () => [{ name: "טיול א", days: 12, total: 960, h: 40, drag: true }, { name: "טיול ב", days: 12, total: 1080, h: null }, { name: "טיול ג", days: 20, total: 1400, h: null }];
  const gym = () => ({ mode: "mekko", title: "שני מכונים: אחוז הנשים", sub: "רוחב = מספר החברים · חלק צבוע = נשים", what: "נשים", groups: [{ name: "מכון א", n: 200, pct: 30 }, { name: "מכון ב", n: 600, pct: 50 }], counts: false, merged: false, level: 0 });

  Lab.register({
    id: "cht-ratios", title: "המחשה: יחסים מטבלה", viewBox: "0 0 620 380",
    chapters: ["כמות ליחידה", "קיצור: רכיב זהה", "אחוז של הכלל", "יחס הפוך", "שאלת מבחן"],
    draw, drag, dragFrom, tap,
    steps: [
      { ch: 0, setup: L => { L.state = { mode: "area", title: "שלושה טיולים", items: trips() }; },
        say: "בטבלה: שלושה טיולים, מספר ימים ומחיר כולל. שואלים על <b>מחיר ליום</b>, נתון נגזר. כל טיול הוא מלבן: הרוחב הוא הימים, הגובה הוא המחיר ליום, והשטח הוא המחיר הכולל.",
        task: "גרור את הגובה של טיול א עד שהשטח שווה למחיר שלו, 960 ₪.",
        demo: L => { S_(L).items[0].h = 80; L.act({ type: "drop", key: "h0" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const it = S_(L).items[0]; return it.h === 80 ? true : areaHint(it); },
        ok: "12 × 80 = 960. הגובה הוא המחיר ליום: <b>80 ₪</b>. כלומר מחיר ליום = מחיר כולל ÷ ימים." },
      { ch: 0, setup: L => { const S = S_(L); S.items[0].drag = false; S.items[2].h = 40; S.items[2].drag = true; },
        say: "טיול ג ארוך יותר, וגם יקר יותר בסך הכול.", task: "גרור את הגובה של טיול ג עד שהשטח שווה ל־1,400.",
        demo: L => { S_(L).items[2].h = 70; L.act({ type: "drop", key: "h2" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const it = S_(L).items[2]; return it.h === 70 ? true : areaHint(it); },
        ok: "20 × 70 = 1,400. טיול ג הוא היקר ביותר בסך הכול, אבל הנמוך ביותר: 70 ₪ ליום." },

      { ch: 1, setup: L => { S_(L).items[2].drag = false; },
        say: "טיול ב: גם הוא 12 ימים, בדיוק כמו א. כלומר המלבן שלו <b>באותו רוחב</b>, והשטח שלו (1,080) גדול יותר.", task: "בלי לגרור ובלי לחלק: מה אפשר לומר על המחיר ליום של ב?",
        choices: ["ב יקר יותר ליום מ־א", "ב זול יותר ליום מ־א", "אי אפשר לדעת בלי לחלק"],
        check: pick(0, { 1: "אותו רוחב ושטח גדול יותר. איך זה אפשרי אם הגובה נמוך יותר?", 2: "אפשר. כשהרוחב זהה, שטח גדול יותר אומר בהכרח גובה גדול יותר." }),
        ok: "<b>מכנה זהה ⇐ משווים רק מונים.</b> 1,080 > 960, ולכן ב יקר יותר ליום. כך פוסלים תשובה בלי לחשב." },
      { ch: 1, setup: L => { S_(L).items[1].h = 90; }, say: "עכשיו רואים את שלושתם.", task: "באיזה טיול המחיר ליום הוא הנמוך ביותר?",
        choices: ["טיול א", "טיול ב", "טיול ג"],
        check: pick(2, { 0: "א הכי זול <b>בסך הכול</b>. השאלה על מחיר ליום, כלומר על הגובה.", 1: "ב הוא דווקא הגבוה ביותר: 90 ₪ ליום." }),
        ok: "טיול ג: 70 ₪ ליום, למרות שהמחיר הכולל שלו הוא הגבוה ביותר. בשאלות כאלה הרכיב הנגזר הוא שקובע." },
      { ch: 1, setup: L => { L.state = { mode: "area", title: "שני מנויים, אותו מחיר", items: [{ name: "מנוי ד", days: 15, total: 1200, h: 40, drag: true }, { name: "מנוי ה", days: 20, total: 1200, h: 60 }] }; },
        say: "המקרה ההפוך: שני מנויים, שניהם 1,200 ₪, כלומר <b>אותו שטח</b>. אחד ל־15 ימים ואחד ל־20.", task: "גרור את הגובה של מנוי ד עד שהשטח שלו 1,200.",
        demo: L => { S_(L).items[0].h = 80; L.act({ type: "drop", key: "h0" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const it = S_(L).items[0]; return it.h === 80 ? true : areaHint(it); },
        ok: "אותו שטח במלבן צר יותר ⇐ המלבן גבוה יותר. <b>מונה זהה ⇐ המכנה הקטן נותן את השבר הגדול</b>: 80 ₪ ליום מול 60." },

      { ch: 2, setup: L => { L.state = gym(); },
        say: "בכל מכון יש אחוז נשים אחר, ומספר חברים אחר: מכון ב גדול פי 3 ממכון א, ולכן הוא רחב פי 3.", task: "לפני שנחשב: מה אחוז הנשים בשני המכונים יחד?",
        choices: ["40%, הממוצע של 30% ו־50%", "יותר מ־40%", "פחות מ־40%"],
        check: (L, e) => { if (e.type !== "choice") return null; L.memo.guess = e.j; return true; },
        ok: "נבדוק." },
      { ch: 2, say: "לא ממצעים אחוזים. קודם הופכים כל אחוז לכמות.", task: "לחץ על 'הפוך לכמויות'.",
        tools: () => [["הפוך לכמויות", L => { S_(L).counts = true; L.render(); L.act({ type: "counts" }); }, true]],
        demo: L => { S_(L).counts = true; L.act({ type: "counts" }); },
        check: (L, e) => e.type === "counts" ? true : null,
        ok: "30% מ־200 = 60 נשים. 50% מ־600 = 300 נשים. ביחד: 360 נשים מתוך 800 חברים." },
      { ch: 2, setup: L => { const S = S_(L); S.merged = true; S.level = 0; },
        say: "עכשיו אחדתי את המכונים לפס אחד של 800 חברים.", task: "גרור את המפלס לאחוז הנשים בשני המכונים יחד.",
        demo: L => { S_(L).level = 45; L.act({ type: "drop", key: "lv" }); },
        check: (L, e) => { if (e.type !== "drop") return null; const v = S_(L).level; if (v === 45) return true;
          if (v === 40) return "40% זה ממוצע האחוזים. 40% מ־800 = 320, אבל יש 360 נשים.";
          return `${v}% מ־800 = ${G.fmt(8 * v)}. צריך שיצא 360.`; },
        ok: L => (L.memo.guess === 1 ? "צדקת! " : "") + "360 ÷ 800 = 45%. התוצאה קרובה ל־50% כי מכון ב גדול יותר ולכן 'שוקל' יותר. <b>אחוז משותף = סכום הכמויות ÷ סכום הכול.</b>" },

      { ch: 3, setup: L => { L.state = { mode: "lib", libs: [{ name: "ספרייה א", books: 4000, staff: 8 }, { name: "ספרייה ב", books: 3000, staff: 5 }, { name: "ספרייה ג", books: 6000, staff: 15 }], flip: false, tap: true, sel: null }; },
        say: "מהטבלה חישבתי את מספר הספרים לעובד בכל ספרייה. אבל השאלה במבחן היא: באיזו ספרייה מספר <b>העובדים לספר</b> הוא הגדול ביותר?",
        task: "לחץ על הספרייה שעונה על השאלה.",
        demo: L => { S_(L).sel = 2; L.act({ type: "tap", key: "l2" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const i = +e.key.slice(1);
          return i === 2 ? true : i === 1 ? "ב גבוהה ביותר בספרים לעובד. אבל השאלה הפוכה: עובדים לספר. כשהופכים שבר, הסדר מתהפך." : "בספרים לעובד, א באמצע. מה קורה לסדר כשהופכים את השבר?"; },
        ok: "ספרייה ג: הכי מעט ספרים לכל עובד, ולכן הכי הרבה עובדים לכל ספר." },
      { ch: 3, setup: L => { const S = S_(L); S.tap = false; S.sel = null; }, say: "בוא נראה את זה.", task: "לחץ על 'הפוך את היחס'.",
        tools: () => [["הפוך את היחס", L => { S_(L).flip = true; L.render(); L.act({ type: "flip" }); }, true]],
        demo: L => { S_(L).flip = true; L.act({ type: "flip" }); },
        check: (L, e) => e.type === "flip" ? true : null,
        ok: "עכשיו ג הגבוהה (2.5 עובדים לאלף ספרים) וב הנמוכה. <b>יחס הפוך = סדר הפוך</b>: הגדול נהיה הקטן." },

      { ch: 4, setup: L => { L.state = { mode: "mekko", title: "שלושה מפעלים: אחוז האקדמאים", sub: "רוחב = מספר העובדים · חלק צבוע = אקדמאים", what: "אקדמאים",
          groups: [{ name: "מפעל א", n: 400, pct: 25 }, { name: "מפעל ב", n: 100, pct: 40 }, { name: "מפעל ג", n: 500, pct: 32 }], counts: false, merged: false, level: 0 }; },
        say: "שאלה ברמת מבחן. בטבלה: מפעל א – 400 עובדים, 25% אקדמאים. מפעל ב – 100 עובדים, 40%. מפעל ג – 500 עובדים, 32%.",
        task: "מה אחוז האקדמאים מכלל העובדים בשלושת המפעלים?", choices: ["30%", "32%", "32⅓%", "35%"],
        check: pick(0, { 1: "32% זה האחוז של מפעל ג בלבד. חשב כמויות: 100 + 40 + 160.", 2: "זה ממוצע שלושת האחוזים. המפעלים בגדלים שונים, אז הופכים לכמויות.", 3: "חשב כמויות: 25% מ־400, 40% מ־100, 32% מ־500. ואז חלק ב־1,000." }),
        ok: "100 + 40 + 160 = 300 אקדמאים מתוך 1,000 עובדים: 30%. מפעל ב, עם האחוז הגבוה, הוא הקטן ביותר, ולכן הוא כמעט לא מזיז את הממוצע." },
      { ch: 4, say: "<b>סיכום ההמחשה:</b><br>1. נתון נגזר (מחיר ליום) = כולל ÷ יחידות. מזהים קודם אילו שני נתונים צריך.<br>2. רכיב זהה? משווים רק את הרכיב השני, בלי לחלק.<br>3. אחוז של כלל הקבוצה: הופכים לכמויות, סוכמים, מחלקים. לא ממצעים אחוזים.<br>4. יחס הפוך הופך את הסדר.", next: "סיום ההמחשה" },
    ],
  });
})();
