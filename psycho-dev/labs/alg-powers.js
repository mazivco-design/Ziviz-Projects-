/* Lab: חזקות ושורשים — factor chips (multiply = join chains, divide = cancel pairs, common base = split chips, roots = pairs leave),
   power blocks (sum of powers = common factor). */
(function () {
  const { G } = Lab;
  const m = s => `<bdi dir="ltr"${String(s).length <= 26 ? ' style="white-space:nowrap"' : ""}>${s}</bdi>`;
  const SUP = s => String(s).replace(/./g, c => { const i = "0123456789".indexOf(c); return i >= 0 ? "⁰¹²³⁴⁵⁶⁷⁸⁹"[i] : c === "-" ? "⁻" : c; });
  const PR = { 4: [2, 2], 8: [2, 2, 2], 16: [2, 2, 2, 2], 9: [3, 3], 27: [3, 3, 3] };
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const C = v => ({ v, st: "" });
  const chips = arr => arr.map(C);
  const SP = 42;

  function chip(x, y, c, key) {
    const dead = c.st === "x", sel = c.st === "sel";
    const cls = dead ? "ghost" : sel ? "fa" : PR[c.v] ? "fsoft" : c.v === 3 ? "fok-soft" : c.v === 2 ? "fblue-soft" : "fsoft";
    const el = G.circle(x, y, 18, cls + (key && !dead ? " hot" : ""));
    let h = key && !dead ? G.tap(el, key) : el;
    h += G.t(x, y + 6, c.v, dead ? "m" : sel ? "inv" : "b", "middle", { "pointer-events": "none" });
    if (dead) h += G.line(x - 13, y + 13, x + 13, y - 13, "mut");
    return h;
  }
  const rowX = (n, i, cx = 310) => cx - (n - 1) * SP / 2 + i * SP;
  function liveResult(S) {
    const live = a => (a || []).filter(c => c.st !== "x");
    const n = live(S.num), d = live(S.den), all = [...n, ...d];
    if (!all.length || all.some(c => PR[c.v] || typeof c.v !== "number") || new Set(all.map(c => c.v)).size > 1) return "";
    const b = all[0].v, e = n.length - d.length;
    return e === 0 ? "= 1" : e > 0 ? `= ${b}${SUP(e)} = ${b ** e}` : `= ${b}${SUP(e)} = 1/${b ** -e}`;
  }
  function drawChips(S) {
    let h = S.head ? G.t(310, 40, S.head, "big") : "";
    if (S.groups) {
      const n0 = S.groups[0].length, n1 = S.groups[1] ? S.groups[1].length : 0, tot = n0 + n1 + (n1 ? 1 : 0);
      let i = 0;
      S.groups.forEach((g, gi) => {
        const xa = rowX(tot, i), xb = rowX(tot, i + g.length - 1);
        h += G.t((xa + xb) / 2, 118, "2" + SUP(g.length), "a");
        g.forEach((c, k) => { h += chip(rowX(tot, i + k), 160, c, null); }); i += g.length;
        h += G.tap(G.rect(xa - 26, 130, xb - xa + 52, 60, "ghost hot", { rx: 30, style: "fill:transparent" }), "g" + gi);
        if (gi === 0 && n1) { h += G.t(rowX(tot, i), 166, "·", "big"); i++; }
      });
      if (S.res) h += G.t(310, 260, S.res, "a");
      return h;
    }
    if (S.root) {
      const n = S.root.length, x0 = 250;
      h += G.path(`M${x0 - 44},150 L${x0 - 34},144 L${x0 - 22},190 L${x0 - 6},118 L${x0 + n * SP + 4},118`, "ink");
      S.root.forEach((c, i) => { h += chip(x0 + 20 + i * SP, 160, c, "r" + i); });
      S.out.forEach((v, i) => { h += chip(x0 - 70 - (S.out.length - 1 - i) * SP, 160, C(v), null); });
      if (S.out.length) h += G.he(x0 - 70 - (S.out.length - 1) * SP / 2, 214, "יצאו מהשורש", "m");
      if (S.res) h += G.t(310, 280, S.res, "a");
      return h;
    }
    const yN = S.den ? 110 : 160, w = Math.max(S.num.length, S.den ? S.den.length : 0) * SP + 10;
    S.num.forEach((c, i) => { h += chip(rowX(S.num.length, i), yN, c, "n" + i); });
    if (S.den) {
      h += G.line(310 - w / 2, 160, 310 + w / 2, 160, "ink");
      S.den.forEach((c, i) => { h += chip(rowX(S.den.length, i), 210, c, "d" + i); });
    }
    if (S.showRes) h += G.t(310, 286, liveResult(S), "a");
    return h;
  }
  function drawBlocks(S) {
    let h = S.head ? G.t(310, 40, S.head, "big") : "";
    const items = S.blocks, W = items.reduce((s, b) => s + (b.plus ? 30 : b.w), 0); let x = 310 - W / 2;
    items.forEach(b => {
      if (b.plus) { h += G.t(x + 15, 178, "+", "big"); x += 30; return; }
      const el = G.rect(x + 2, 140, b.w - 4, 60, b.cls + (b.key ? " hot" : ""), { rx: 6 });
      h += b.key ? G.tap(el, b.key) : el;
      h += G.t(x + b.w / 2, 177, b.lab, "b", "middle", { "pointer-events": "none" }); x += b.w;
    });
    if (S.total) h += G.line(310 - W / 2, 220, 310 + W / 2, 220, "sa") + G.t(310, 250, S.total, "a");
    if (S.note) h += G.t(310, 300, S.note, "a");
    return h;
  }
  function draw(L) { const S = L.state; return S.kind === "blocks" ? drawBlocks(S) : drawChips(S); }

  function tap(L, key) {
    const S = L.state; L.memo.tapKind = null;
    if (S.groups && key === "g1" || S.groups && key === "g0") { if (S.groups.length > 1) S.groups = [[...S.groups[0], ...S.groups[1]]]; L.memo.tapKind = "merge"; return; }
    if (S.kind === "blocks") { const b = S.blocks.find(b => b.key === key); if (b && b.onTap) b.onTap(S); L.memo.tapKind = "block"; return; }
    if (S.root) {
      const i = +key.slice(1), c = S.root[i], j = S.root.findIndex(o => o.st === "sel");
      if (j < 0 || j === i) { c.st = c.st === "sel" ? "" : "sel"; L.memo.tapKind = "select"; return; }
      if (S.root[j].v === c.v) { S.out.push(c.v); S.root = S.root.filter((_, k) => k !== i && k !== j); L.memo.tapKind = "pair"; }
      else { S.root[j].st = ""; L.memo.tapKind = "badpair"; }
      return;
    }
    const arr = key[0] === "n" ? S.num : S.den, i = +key.slice(1), c = arr[i];
    if (S.mode === "split" || S.mode === "free") {
      if (PR[c.v]) { arr.splice(i, 1, ...chips(PR[c.v])); L.memo.tapKind = "split"; return; }
      if (S.mode === "split") { L.memo.tapKind = "prime"; return; }
    }
    if (S.mode === "cancel" || S.mode === "free") {
      if (key[0] === "n") { L.memo.tapKind = "numtap"; return; }
      if (PR[c.v]) { L.memo.tapKind = "composite"; return; }
      const k = S.num.findIndex(o => o.st !== "x" && o.v === c.v);
      if (k < 0) { L.memo.tapKind = "nomatch"; return; }
      c.st = "x"; S.num[k].st = "x"; L.memo.tapKind = "cancel";
    }
  }
  const deadCount = a => a.filter(c => c.st === "x").length;
  const cancelAll = S => { for (const c of S.den) { if (c.st === "x" || PR[c.v]) continue; const k = S.num.findIndex(o => o.st !== "x" && o.v === c.v); if (k >= 0) { c.st = "x"; S.num[k].st = "x"; } } };
  const cancelHints = { numtap: "צמצום מתחיל מהמכנה: לחץ על גורם למטה, והוא יימחק יחד עם גורם זהה למעלה.", composite: "קודם פרק את השבב לגורמים ראשוניים.",
    nomatch: "אין יותר גורם כזה במונה לצמצם איתו. מה שנשאר במכנה נשאר שם." };
  const big = (lab, n) => ({ lab, w: 50 * n, cls: "fsoft" });

  Lab.register({
    id: "alg-powers", title: "המחשה: חזקות ושורשים", viewBox: "0 0 620 340",
    chapters: ["כפל וחילוק", "בסיס משותף", "סכום של חזקות", "שורשים", "שאלת מבחן"],
    draw, tap,
    steps: [
      // ---------- ch0 ----------
      { ch: 0, setup: L => { L.state = { groups: [chips([2, 2, 2]), chips([2, 2, 2, 2])], head: "2³ · 2⁴" }; },
        say: `חזקה היא שרשרת כפל: ${m("2³ = 2·2·2")}. כל עיגול הוא גורם אחד של 2. כאן יש שתי שרשראות.`,
        task: `לפני שנחבר אותן: ${m("2³ · 2⁴ = ?")}`, choices: [m("2⁷"), m("2¹²"), m("4⁷"), m("4¹²")],
        check: (L, e) => { if (e.type !== "choice") return null; L.memo.guess = e.j; return true; },
        ok: "בוא נבדוק עם השרשראות." },
      { ch: 0, say: "כפל של שתי שרשראות הוא פשוט שרשרת ארוכה יותר.", task: "לחץ על השרשרת של 2⁴ כדי לחבר אותה לראשונה.",
        demo: L => { const S = L.state; S.groups = [[...S.groups[0], ...S.groups[1]]]; L.memo.tapKind = "merge"; L.act({ type: "tap", key: "g1" }); },
        check: (L, e) => e.type === "tap" && L.memo.tapKind === "merge" ? true : null,
        ok: L => { L.state.res = "2³ · 2⁴ = 2⁷ = 128"; L.render();
          return (L.memo.guess === 0 ? "צדקת. " : L.memo.guess === 1 ? "לא 2¹²: ספור את העיגולים. " : "הבסיס נשאר 2: כל העיגולים הם 2. ") + `שרשרת אחת של 7 גורמים: ${m("2³ · 2⁴ = 2⁷")}. <b>בכפל מחברים מעריכים</b> (3 + 4), לא כופלים.`; } },
      { ch: 0, setup: L => { L.state = { num: chips([2, 2, 2, 2, 2, 2, 2]), den: chips([2, 2, 2, 2]), mode: "cancel", head: "2⁷ / 2⁴" }; },
        say: "בשבר, כל 2 במכנה מצטמצם עם 2 במונה.", task: "לחץ על הגורמים במכנה כדי לצמצם אותם.",
        demo: L => { cancelAll(L.state); L.memo.tapKind = "cancel"; L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const k = L.memo.tapKind; if (cancelHints[k]) return cancelHints[k]; return deadCount(L.state.den) === 4 ? true : null; },
        ok: L => { L.state.showRes = true; L.render(); return `נשארו 3 גורמים: ${m("2⁷ / 2⁴ = 2³ = 8")}. <b>בחילוק מחסרים מעריכים</b> (7 − 4).`; } },
      { ch: 0, setup: L => { L.state = { num: chips([2, 2, 2]), den: chips([2, 2, 2, 2, 2]), mode: "cancel", head: "2³ / 2⁵" }; },
        say: "ומה קורה כשבמכנה יש יותר?", task: "צמצם כל מה שאפשר.",
        demo: L => { cancelAll(L.state); L.memo.tapKind = "cancel"; L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const k = L.memo.tapKind; if (deadCount(L.state.den) === 3) return true; return cancelHints[k] || null; },
        ok: L => { L.state.showRes = true; L.render(); return `נשארו 2 גורמים במכנה: ${m("1/2² = 1/4")}. ולפי הכלל: ${m("2³⁻⁵ = 2⁻²")}. <b>מעריך שלילי = הופכי</b>, לא מספר שלילי.`; } },
      { ch: 0, say: "נשתמש בזה.", task: `${m("(−3)⁻² = ?")}`, choices: [m("9"), m("−9"), m("1/9"), m("−1/9")],
        check: pick(2, { 0: "שכחת להפוך: מעריך שלילי = הופכי.", 1: "מעריך שלילי לא הופך את הסימן, הוא הופך את המספר.", 3: `${m("(−3)² = 9")}: מספר שלילי בחזקה זוגית יוצא חיובי.` }),
        ok: `${m("(−3)⁻² = 1/(−3)² = 1/9")}.` },
      { ch: 0, say: "ועוד מלכודת סימן.", task: `${m("−3² + (−3)² = ?")}`, choices: [m("0"), m("18"), m("−18"), m("9")],
        check: pick(0, { 1: `${m("−3²")} הוא לא 9. החזקה קודמת למינוס: ${m("−(3²)")}.`, 2: `${m("(−3)²")} חיובי: מינוס כפול מינוס.`, 3: "חשב כל איבר לבד ואז חבר." }),
        ok: `${m("−3² = −9")}, אבל ${m("(−3)² = 9")}. החזקה חלה רק על מה שצמוד אליה. הסכום: 0.` },

      // ---------- ch1 ----------
      { ch: 1, setup: L => { L.state = { num: chips([8, 8, 4, 4, 4]), den: chips([2, 2, 2, 2, 2, 2, 2, 2, 2, 2]), mode: "split", head: "8² · 4³ / 2¹⁰" }; },
        say: "בסיסים שונים לא מצמצמים ישירות. קודם מביאים הכול ל<b>בסיס משותף</b>: כאן 2.",
        task: "לחץ על כל שבב שאינו 2 כדי לפרק אותו לגורמים של 2.",
        demo: L => { const S = L.state; S.num = chips(Array(12).fill(2)); L.memo.tapKind = "split"; L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; if (L.memo.tapKind === "prime") return "זה כבר 2. פרק את השבבים האחרים.";
          return L.state.num.every(c => c.v === 2) ? true : null; },
        ok: `${m("8 = 2³")} ו־${m("4 = 2²")}. במונה ${m("6 + 6 = 12")} גורמים: ${m("8² · 4³ = 2¹²")}.` },
      { ch: 1, setup: L => { L.state.mode = "cancel"; }, say: "עכשיו כל העיגולים הם 2.", task: "צמצם.",
        demo: L => { cancelAll(L.state); L.memo.tapKind = "cancel"; L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const k = L.memo.tapKind; if (cancelHints[k]) return cancelHints[k]; return deadCount(L.state.den) === 10 ? true : null; },
        ok: L => { L.state.showRes = true; L.render(); return `${m("2¹² / 2¹⁰ = 2² = 4")}. כמעט כל שאלת חזקות נפתרת כך: בסיס משותף, ואז מחברים ומחסרים מעריכים.`; } },
      { ch: 1, setup: L => { L.state = { num: chips([27, 27]), den: chips([9, 9, 9]), mode: "free", head: "27² / 9³" }; },
        say: "השבבים פעילים: לחיצה על שבב מפרקת אותו, ולחיצה על גורם במכנה מצמצמת.",
        task: `${m("27² / 9³ = ?")}`, choices: [m("1"), m("3"), m("1/3"), m("9")],
        check: pick(0, { 1: "פרק את השבבים: כמה 3 יש למעלה וכמה למטה?", 2: "פרק את השבבים: כמה 3 יש למעלה וכמה למטה?", 3: `${m("27 = 3³")} ו־${m("9 = 3²")}. ספור גורמים.` }),
        ok: `${m("27² = 3⁶")} ו־${m("9³ = 3⁶")}, ולכן התוצאה 1.` },

      // ---------- ch2 ----------
      { ch: 2, setup: L => { L.state = { num: [C("2ˣ"), C(2), C(2), C(2)], mode: "none", head: "2ˣ⁺³" }; },
        say: `${m("2ˣ⁺³")} היא שרשרת של x גורמים, ועוד 3 גורמים של 2.`, task: `${m("2ˣ⁺³ = ?")}`,
        choices: [m("2ˣ + 3"), m("2ˣ + 8"), m("8 · 2ˣ"), m("3 · 2ˣ")],
        check: pick(2, { 0: "מעריך שגדל ב־3 פירושו עוד 3 גורמים בכפל, לא בחיבור.", 1: "הגורמים מוכפלים, לא מחוברים.", 3: `כל גורם הוא 2, ולא 3. שלושה גורמים כאלה הם ${m("2³ = 8")}.` }),
        ok: `${m("2ˣ⁺³ = 2ˣ · 2³ = 8 · 2ˣ")}.` },
      { ch: 2, setup: L => { L.state = { kind: "blocks", head: "2ˣ⁺³ + 2ˣ = 72", total: "72",
          blocks: [Object.assign(big("2ˣ⁺³", 8), { key: "big", onTap: S => { S.blocks.splice(0, 1, ...Array.from({ length: 8 }, () => ({ lab: "2ˣ", w: 50, cls: "fsoft" }))); } }), { plus: true }, { lab: "2ˣ", w: 50, cls: "fblue-soft" }] }; },
        say: "בסכום של חזקות אי אפשר לחבר מעריכים. אבל אפשר לראות כמה בלוקים של 2ˣ יש.",
        task: "לחץ על הבלוק הגדול כדי לפרק אותו לבלוקים של 2ˣ.",
        demo: L => { const S = L.state; S.blocks[0].onTap(S); L.memo.tapKind = "block"; L.act({ type: "tap", key: "big" }); },
        check: (L, e) => e.type === "tap" && L.state.blocks.length === 10 ? true : null,
        ok: L => { L.state.note = "9 · 2ˣ = 72"; L.render(); return `9 בלוקים זהים של 2ˣ שווים יחד 72. זו הוצאת גורם משותף: ${m("2ˣ(8 + 1) = 72")}.`; } },
      { ch: 2, say: "9 בלוקים = 72.", task: "כמה זה x?", choices: ["3", "6", "2", "8"],
        check: pick(0, { 1: "72 / 9 = 8 זה ערך הבלוק. איזו חזקה של 2 שווה 8?", 2: `${m("2² = 4")}, ובלוק אחד שווה 8.`, 3: `8 זה ערך הבלוק ${m("2ˣ")}. איזו חזקה של 2 שווה 8?` }),
        ok: `בלוק אחד: ${m("2ˣ = 72 / 9 = 8 = 2³")}, ולכן ${m("x = 3")}. בדיקה: ${m("2⁶ + 2³ = 64 + 8 = 72")}.` },
      { ch: 2, setup: L => { L.state = { kind: "blocks", head: "2¹⁰ + 2¹⁰", blocks: [{ lab: "2¹⁰", w: 120, cls: "fsoft" }, { plus: true }, { lab: "2¹⁰", w: 120, cls: "fsoft" }] }; },
        say: "שני בלוקים זהים.", task: `${m("2¹⁰ + 2¹⁰ = ?")}`, choices: [m("2¹¹"), m("2²⁰"), m("4¹⁰"), m("4²⁰")],
        check: pick(0, { 1: "בחיבור לא מחברים מעריכים. יש כאן 2 בלוקים של 2¹⁰.", 2: "הבסיס לא משתנה. יש 2 בלוקים של 2¹⁰, כלומר 2 · 2¹⁰.", 3: "יש 2 בלוקים של 2¹⁰, כלומר 2 · 2¹⁰." }),
        ok: `${m("2 · 2¹⁰ = 2¹¹")}. כפל ב־2 מוסיף עוד גורם 2 לשרשרת, ולכן המעריך עולה ב־1.` },

      // ---------- ch3 ----------
      { ch: 3, setup: L => { L.state = { root: chips([2, 3, 2, 3, 2]), out: [], head: "√72 = √(2·3·2·3·2)" }; },
        say: "שורש ריבועי מחפש <b>זוגות</b>: כל זוג גורמים זהים יוצא מהשורש כגורם אחד, כי √(2·2) = 2.",
        task: "לחץ על שני גורמים זהים כדי להוציא אותם. המשך עד שלא נשארים זוגות.",
        demo: L => { const S = L.state; S.root = [C(2)]; S.out = [2, 3]; L.memo.tapKind = "pair"; L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; if (L.memo.tapKind === "badpair") return "רק שני גורמים <b>זהים</b> יוצאים כזוג. בחר שוב.";
          const S = L.state, cnt = {}; S.root.forEach(c => { cnt[c.v] = (cnt[c.v] || 0) + 1; }); return Object.values(cnt).every(n => n < 2) ? true : null; },
        ok: L => { L.state.res = "√72 = 2 · 3 · √2 = 6√2"; L.render(); return `בחוץ ${m("2 · 3 = 6")}, ובפנים נשאר 2 לבד: ${m("√72 = 6√2")}. כך מפשטים שורש: מוציאים ריבועים.`; } },
      { ch: 3, say: "מלכודת נפוצה.", task: `${m("√(9 + 16) = ?")}`, choices: [m("5"), m("7"), m("√7"), m("25")],
        check: pick(0, { 1: `${m("√(a + b) ≠ √a + √b")}. קודם מחברים בתוך השורש.`, 2: `בתוך השורש ${m("9 + 16 = 25")}.`, 3: "שכחת להוציא שורש." }),
        ok: `${m("√(9 + 16) = √25 = 5")}, ולא ${m("3 + 4 = 7")}. שורש מתפרק רק על <b>כפל</b>: ${m("√(a·b) = √a · √b")}.` },

      // ---------- ch4 ----------
      { ch: 4, setup: L => { L.state = { num: chips([16, 16, 16]), den: chips([4, 4, 8, 8, 8]), mode: "free", head: "16³ · 4⁻² / 8³" }; },
        say: `שאלה ברמת מבחן. המעריך השלילי כבר טופל: ${m("4⁻²")} עבר למכנה כ־${m("4²")}. השבבים פעילים אם תרצה.`,
        task: `${m("16³ · 4⁻² / 8³ = ?")}`, choices: [m("1/2"), m("2"), m("1/4"), m("8")],
        check: pick(0, { 1: `בדוק את המכנה: ${m("4² · 8³ = 2⁴ · 2⁹ = 2¹³")}.`, 2: `${m("2¹² / 2¹³")}: נשאר רק גורם 2 אחד במכנה.`, 3: `המעריך השלילי מעביר את ${m("4²")} למכנה, לא למונה.` }),
        ok: `${m("16³ = 2¹²")}, ${m("4² = 2⁴")}, ${m("8³ = 2⁹")}. לכן ${m("2¹² / 2¹³ = 2⁻¹ = 1/2")}.` },
      { ch: 4, say: "<b>סיכום ההמחשה:</b><br>1. חזקה = שרשרת כפל. בכפל מחברים מעריכים, בחילוק מחסרים.<br>2. מעריך שלילי = הופכי. " + m("−3² = −9") + " אבל " + m("(−3)² = 9") + ".<br>3. קודם בסיס משותף. בסכום של חזקות מוציאים גורם משותף: " + m("2ˣ⁺³ + 2ˣ = 9 · 2ˣ") + ".<br>4. שורש: כל זוג זהה יוצא כגורם אחד. " + m("√(a + b) ≠ √a + √b") + ".", next: "סיום ההמחשה" },
    ],
  });
})();
