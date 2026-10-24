/* Lab: אחוזים — reference implementation for lab authors. */
(function () {
  const { G } = Lab, R = 580, H = 54;
  const bar = o => Object.assign({ y: 120, total: 100, u: 4.8, cells: 0, sel: [], cut: [], add: 0, addVal: 0, mark: null, draggable: false, title: "", ghost: false, tapMode: null, ruler: false }, o);
  const W = b => b.total * b.u;
  const count = a => a.reduce((s, v) => s + (v === true ? 1 : v || 0), 0);

  function draw(L) {
    const S = L.state; let h = "";
    S.bars.forEach((b, bi) => {
      const w = W(b), x0 = R - w, y = b.y;
      if (b.title) h += G.he(R, y - (b.mark !== null ? 40 : 14), b.title, "b", "right");
      if (b.ghost) { h += G.rect(x0, y, w, H, "ghost"); h += G.t(x0 - 8, y + 33, G.fmt(b.total) + " ₪", "m", "end"); return; }
      h += G.rect(x0, y, w, H, "bg", { rx: 4 });
      if (b.cells) {
        const cw = w / b.cells, cv = b.total / b.cells;
        for (let k = 0; k < b.cells; k++) {
          const cx = R - (k + 1) * cw, cut = b.cut[k], s = b.sel[k];
          const cls = cut ? "ghost" : s === 1 ? "fa" : s === .5 ? "box" : "box";
          let cell = G.rect(cx, y, cw, H, cls + (b.tapMode ? " hot" : ""), s === .5 ? { style: "fill:url(#lab-half)" } : {});
          h += b.tapMode ? G.tap(cell, bi + ":" + k) : cell;
          if (cw >= 34) h += G.t(cx + cw / 2, y + 33, (cut ? "−" : "") + G.fmt(cv), s === 1 && !cut ? "inv" : "m", "middle", { "pointer-events": "none" });
        }
      }
      for (let k = 0; k < b.add; k++) { const cw = b.addVal * b.u, cx = x0 - (k + 1) * cw; h += G.rect(cx, y, cw, H, "fok") + G.t(cx + cw / 2, y + 33, "+" + G.fmt(b.addVal), "inv"); }
      if (b.mark !== null) {
        const mx = R - w * b.mark / 100;
        h += G.rect(mx, y, R - mx, H, "fa", { "pointer-events": "none", opacity: .85 });
        h += G.line(mx, y - 6, mx, b.draggable ? y + H + 32 : y + H + 10, "sa");
        if (b.draggable) h += G.knob(mx, y + H + 46, "bar" + bi, 15);
        h += G.t(mx, y - 12, G.fmt(b.mark) + "% = " + G.fmt(b.total * b.mark / 100) + " ₪", "a");
      }
      h += G.t(x0 - (b.add * b.addVal * b.u) - 10 - (b.labelShift || 0), y + 33, G.fmt(b.total + b.add * b.addVal) + " ₪", "b", "end");
      if (b.ruler) for (const p of [0, 25, 50, 75, 100]) { const px = R - w * p / 100; h += G.line(px, y + H, px, y + H + 6, "mut") + G.t(px, y + H + 20, p + "%", "m"); }
    });
    return h + (L.state.notes || []).join("");
  }
  function drag(L, key, pt) {
    const b = L.state.bars[+key.slice(3)]; let p = (R - pt.x) / W(b) * 100;
    b.mark = Math.max(0, Math.min(100, Math.round(p)));
  }
  function dragFrom(L, pt) { const i = L.state.bars.findIndex(b => b.draggable && pt.y > b.y - 20 && pt.y < b.y + 100 && pt.x > R - W(b) - 20 && pt.x < R + 20); return i >= 0 ? "bar" + i : null; }
  function tap(L, key) {
    const [bi, k] = key.split(":").map(Number), b = L.state.bars[bi];
    if (b.tapMode === "cut") b.cut[k] = !b.cut[k];
    else if (b.tapMode === "half") b.sel[k] = b.sel[k] === 1 ? .5 : b.sel[k] === .5 ? 0 : 1;
    else b.sel[k] = b.sel[k] ? 0 : 1;
  }
  const B0 = L => L.state.bars[0];
  const drop = (want, hint) => (L, e) => e.type !== "drop" ? null : B0(L).mark === want ? true : hint(B0(L).mark);
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");

  Lab.register({
    id: "prb-percent", title: "מעבדת אחוזים", viewBox: "0 0 620 360",
    chapters: ["השלם", "10% כמפתח", "הנחה", "הנחה ואז העלאה", "אחוז שינוי", "שאלת מבחן"],
    draw, drag, dragFrom, tap,
    steps: [
      { ch: 0, setup: L => { L.state = { bars: [bar({ y: 150, total: 80, u: 6, mark: 0, draggable: true, title: "מחיר חולצה", ruler: true })] }; },
        say: "זה פס של מחיר: חולצה שעולה 80 ₪. כל הפס, מקצה לקצה, הוא 100% מהמחיר. אחוזים הם פשוט חלקים מהפס הזה.",
        task: "גרור את העיגול שמתחת לפס ושמור עליו ב־50%.",
        demo: L => { B0(L).mark = 50; L.act({ type: "drop" }); },
        check: drop(50, m => m < 50 ? "עוד קצת. 50% זה בדיוק חצי פס." : "עברת את האמצע. 50% זה בדיוק חצי פס."),
        ok: "יפה. חצי מהפס הוא חצי מהמחיר: 40 ₪. שים לב שהמספר בשקלים משתנה יחד עם האחוז." },
      { ch: 0, setup: L => { B0(L).mark = 0; }, say: "עכשיו בלי סרגל עזר.", task: "סמן 25% מהמחיר.",
        demo: L => { B0(L).mark = 25; L.act({ type: "drop" }); },
        check: drop(25, () => "25% זה רבע: חצי של חצי. נסה למצוא את האמצע של החצי."),
        ok: "25% הם רבע, כלומר 20 ₪. בכל פעם שאתה רואה 25%, תחשוב 'רבע', ו־75% זה 'שלושה רבעים'." },
      { ch: 0, setup: L => { B0(L).mark = 0; B0(L).ruler = false; }, say: "ועכשיו האחוז הכי חשוב בפרק.", task: "סמן 10%.",
        demo: L => { B0(L).mark = 10; L.act({ type: "drop" }); },
        check: drop(10, m => Math.abs(m - 10) <= 4 ? "קרוב מאוד. כוון בדיוק ל־10%." : "10% זה חלק אחד מתוך עשרה. חלק קטן מאוד מהפס."),
        ok: "10% מ־80 הם 8 ₪. כדי למצוא 10% מזיזים את הנקודה העשרונית ספרה אחת שמאלה: 80 → 8. זה הכלי שעליו בנוי כל השאר." },
      { ch: 0, say: "בוא נראה למה 10% כל כך שימושי.", task: "לחץ על 'חלק ל־10' מתחת לפס.",
        tools: () => [["חלק ל־10", L => { const b = B0(L); b.mark = null; b.draggable = false; b.cells = 10; L.render(); L.act({ type: "split" }); }, true]],
        demo: L => { const b = B0(L); b.mark = null; b.draggable = false; b.cells = 10; L.act({ type: "split" }); },
        check: (L, e) => e.type === "split" ? true : null,
        ok: "עכשיו הפס בנוי מעשר משבצות, וכל משבצת היא 10%, כלומר 8 ₪. מכאן כל אחוז עגול קל: 30% = 3 משבצות, 70% = 7 משבצות." },
      { ch: 1, setup: L => { L.state = { bars: [bar({ y: 150, total: 60, u: 8, cells: 10, tapMode: "half", title: "מחיר ספר" })] }; },
        say: "ספר שעולה 60 ₪, כבר מחולק לעשיריות. כל משבצת היא 6 ₪.", task: "לחץ על משבצות כדי לצבוע 30% מהמחיר.",
        demo: L => { B0(L).sel = [1, 1, 1]; L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const c = count(B0(L).sel); return c === 3 ? true : c > 3 ? "צבעת יותר מדי. כל משבצת היא 10%." : null; },
        ok: "3 משבצות × 6 ₪ = 18 ₪. כלומר 30% מ־60 הם 18." },
      { ch: 1, say: "ומה עם 5%? 5% זה חצי מ־10%, כלומר חצי משבצת.", task: "צבע 35%. לחיצה שנייה על משבצת צבועה הופכת אותה לחצי.",
        demo: L => { B0(L).sel = [1, 1, 1, .5]; L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const c = count(B0(L).sel); return c === 3.5 ? true : c > 3.5 ? "יותר מדי. 35% = 3 משבצות שלמות וחצי." : null; },
        ok: "3.5 משבצות × 6 ₪ = 21 ₪. זה הטריק של הקורס: בונים כל אחוז מ־10% ומ־5%. למשל 15% = 10% + 5%, ו־45% = 4 משבצות וחצי." },
      { ch: 1, setup: L => { B0(L).sel = []; }, say: "עכשיו בלי לצבוע, רק בראש. אפשר להסתכל על הפס.", task: "כמה זה 15% מ־60?",
        choices: ["6", "9", "10", "15"],
        check: pick(1, { 0: "6 ₪ זה 10% בלבד. הוסף עוד חצי משבצת.", 2: "משבצת אחת היא 6 ₪, וחצי משבצת היא 3 ₪. כמה זה ביחד?", 3: "15 זה האחוז, לא הסכום. כמה שקלים הם משבצת וחצי?" }),
        ok: "משבצת אחת (6) ועוד חצי (3) = 9 ₪." },
      { ch: 2, setup: L => { L.state = { bars: [bar({ y: 150, total: 200, u: 2.4, cells: 10, tapMode: "cut", title: "מחיר מעיל" })] }; },
        say: "מעיל שעולה 200 ₪, וכל משבצת היא 20 ₪. החנות נותנת 20% הנחה.", task: "לחץ על המשבצות שהחנות 'מורידה' מהמחיר.",
        demo: L => { B0(L).cut = [true, true]; L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const c = count(B0(L).cut); return c === 2 ? true : c > 2 ? "הורדת יותר מדי. 20% זה 2 משבצות." : null; },
        ok: "הורדת 2 משבצות, כלומר 40 ₪. נשארו 8 משבצות, 80% מהמחיר: 160 ₪. <b>הנחה של 20% זה לשלם 80%</b>, כלומר לכפול ב־0.8: 200 × 0.8 = 160." },
      { ch: 2, say: "בדיקה קטנה לפני שממשיכים.", task: "הנחה של 30%. בכמה כופלים את המחיר?", choices: ["0.3", "0.7", "1.3", "3"],
        check: pick(1, { 0: "0.3 זה החלק שהורדנו. אבל משלמים על מה שנשאר.", 2: "הנחה מקטינה את המחיר, אז כופלים במספר קטן מ־1.", 3: "הנחה מקטינה את המחיר, אז כופלים במספר קטן מ־1." }),
        ok: "נשארו 70% מהמחיר, ולכן כופלים ב־0.7." },
      { ch: 3, setup: L => { L.state = { bars: [bar({ y: 150, total: 160, u: 2.4, title: "המחיר אחרי ההנחה" })] }; },
        say: "המעיל עולה עכשיו 160 ₪. בסוף העונה החנות מעלה את המחיר ב־20%.", task: "לפני שנבדוק: לאן לדעתך יגיע המחיר?",
        choices: ["בדיוק 200 ₪, חזרנו להתחלה", "פחות מ־200 ₪", "יותר מ־200 ₪"],
        check: (L, e) => { if (e.type !== "choice") return null; L.memo.guess = e.j; return true; },
        ok: L => L.memo.guess === 1 ? "ניחוש מעניין. בוא נבדוק אותו על הפס." : "בוא נבדוק את זה על הפס." },
      { ch: 3, say: "ההעלאה של 20% מחושבת מהמחיר <b>הנוכחי</b>, 160 ₪. לכן קודם מחלקים את הפס של 160 לעשיריות.", task: "לחץ על 'חלק ל־10'.",
        tools: () => [["חלק ל־10", L => { B0(L).cells = 10; L.render(); L.act({ type: "split" }); }, true]],
        demo: L => { B0(L).cells = 10; L.act({ type: "split" }); },
        check: (L, e) => e.type === "split" ? true : null,
        ok: "כל משבצת עכשיו שווה 16 ₪, ולא 20 כמו קודם. הפס קטן יותר, ולכן גם העשיריות שלו קטנות יותר." },
      { ch: 3, say: "עכשיו מעלים ב־20%.", task: "לחץ על '+ 10%' כמה פעמים שצריך.",
        tools: () => [["+ 10%", L => { const b = B0(L); b.add++; b.addVal = 16; L.render(); L.act({ type: "add" }); }, true], ["בטל", L => { const b = B0(L); if (b.add) b.add--; }]],
        demo: L => { const b = B0(L); b.add = 2; b.addVal = 16; L.act({ type: "add" }); },
        check: (L, e) => { if (e.type !== "add") return null; const a = B0(L).add; return a === 2 ? true : a > 2 ? "הוספת יותר מ־20%. לחץ על 'בטל'." : null; },
        ok: "הוספנו 2 משבצות של 16, כלומר 32 ₪. המחיר החדש הוא 192 ₪." },
      { ch: 3, setup: L => { const b = B0(L); b.y = 190; b.labelShift = 26; L.state.bars.unshift(bar({ y: 60, total: 200, u: 2.4, ghost: true, title: "המחיר המקורי" }));
          const gx = R - 200 * 2.4; L.state.notes = [G.rect(gx, 190, 8 * 2.4, H, "fwarn") + G.he(gx + 10, 275, "חסרים 8 ₪", "w")]; },
        say: "בוא נשים את המחיר המקורי מעל.", next: "הבנתי, למה זה קרה?" },
      { ch: 3, setup: L => { L.state.notes = L.state.notes || []; },
        say: L => (L.memo.guess === 1 ? "צדקת! " : L.memo.guess === 0 ? "זו בדיוק המלכודת שהקורס מזהיר ממנה. " : "") + "ההנחה הורידה 20% מ־200, כלומר 40 ₪, אבל ההעלאה הוסיפה 20% מ־160, כלומר רק 32 ₪. בקיצור: 0.8 × 1.2 = 0.96, ולכן המחיר הסופי הוא 96% מהמקורי.",
        task: "לפי אותו היגיון, מחיר עלה ב־50% ואחר כך ירד ב־50%. איפה הוא נגמר?",
        choices: ["במחיר המקורי", "25% מתחת למקורי", "25% מעל למקורי", "50% מתחת למקורי"],
        check: pick(1, { 0: "נסה עם 100 ₪: אחרי עלייה של 50% המחיר 150. כמה זה 50% מ־150?", 2: "נסה עם 100 ₪: אחרי עלייה של 50% המחיר 150. כמה זה 50% מ־150?", 3: "נסה עם 100 ₪: אחרי עלייה של 50% המחיר 150. כמה זה 50% מ־150?" }),
        ok: "100 → 150 → 75. כלומר 1.5 × 0.5 = 0.75, ירידה של 25%. שינויים באחוזים <b>כופלים</b> זה בזה, לא מחברים." },
      { ch: 4, setup: L => { L.state = { bars: [bar({ y: 110, total: 50, u: 8, cells: 10, title: "המחיר הישן" }), bar({ y: 240, total: 50, u: 8, add: 2, addVal: 5, title: "המחיר החדש" })] }; },
        say: "מחיר עלה מ־50 ₪ ל־60 ₪. בכמה אחוזים עלה? כדי למדוד את העלייה משווים אותה לפס של <b>המחיר הישן</b>, שמחולק לעשיריות של 5 ₪.",
        task: "התוספת (בירוק) היא 10 ₪. כמה אחוזים זה?", choices: ["10%", "16.7%", "20%", "25%"],
        check: pick(2, { 0: "10 זה הסכום בשקלים. כמה משבצות של 5 ₪ נכנסות בתוספת?", 1: "זה מה שיוצא אם מחלקים ב־60. אבל משווים תמיד לערך שממנו התחלנו.", 3: "כל משבצת היא 5 ₪, כלומר 10%. כמה משבצות כאלה יש בתוספת?" }),
        ok: "התוספת שווה 2 משבצות של הפס הישן, כלומר 20%. הנוסחה: השינוי ÷ הערך המקורי × 100 = 10 ÷ 50 × 100." },
      { ch: 4, say: "ועכשיו בכיוון ההפוך.", task: "מחיר ירד מ־60 ₪ ל־50 ₪. בכמה אחוזים ירד?", choices: ["20%", "16.7% (שישית)", "10%", "25%"],
        check: pick(1, { 0: "זה נכון לעלייה מ־50. כאן התחלנו מ־60, אז משווים ל־60.", 2: "השינוי הוא 10 ₪, וההתחלה היא 60 ₪. איזה חלק מ־60 זה?", 3: "השינוי הוא 10 ₪, וההתחלה היא 60 ₪. איזה חלק מ־60 זה?" }),
        ok: "10 מתוך 60 זה שישית, בערך 16.7%. אותם שני מספרים, אבל אחוז אחר, כי נקודת ההתחלה השתנתה." },
      { ch: 5, setup: L => { L.state = { bars: [bar({ y: 150, total: 100, u: 4.8, mark: 0, draggable: true, title: "מעבדה חופשית: גרור" })] }; },
        say: "שאלה ברמת מבחן. הפס פתוח לשימוש חופשי אם תרצה.", task: "מחיר מוצר הועלה ב־10%, ואחר כך הוזל ב־10%, והגיע ל־198 ₪. מה היה המחיר המקורי?",
        choices: ["198 ₪", "200 ₪", "202 ₪", "180 ₪"],
        check: pick(1, { 0: "זו המלכודת: עלייה וירידה באותו אחוז לא מבטלות זו את זו.", 2: "כיוון נכון, אבל בדוק: 202 × 1.1 × 0.9 = 199.98.", 3: "נסה להציב: 180 × 1.1 × 0.9. האם יוצא 198?" }),
        ok: "1.1 × 0.9 = 0.99, כלומר המחיר הסופי הוא 99% מהמקורי. 198 ÷ 0.99 = 200 ₪. אפשר גם להציב את התשובות, כמו שהקורס ממליץ." },
      { ch: 5, say: "<b>סיכום המעבדה:</b><br>1. 10% = מזיזים נקודה. ממנו בונים כל אחוז.<br>2. הנחה של X% = לכפול ב־(1 − X/100).<br>3. שינויים ברצף כופלים, לא מחברים.<br>4. אחוז שינוי משווים תמיד לנקודת ההתחלה.", next: "סיום המעבדה" },
    ],
  });
})();
