/* Lab: צירופים — slot boxes fed from a chip pool, an options grid, and a handshake circle. */
(function () {
  const { G } = Lab;
  // ---------- models ----------
  const slots = o => Object.assign({ mode: "slots", pool: ["1", "2", "3", "4", "5"], n: 3, names: null, rep: true, noZero: false, picks: [], ns: [], hideN: false, err: null, zeroWarn: false }, o);
  const grid = o => Object.assign({ mode: "grid", rows: [], cols: [], text: false, sel: {}, title: "", rowHead: "", colHead: "", err: null }, o);
  const circle = o => Object.assign({ mode: "circle", names: ["דנה", "יוסי", "מאיה", "עומר", "ליה"], edges: {}, sel: null, err: null }, o);
  const allowed = (S, i, cur) => !((!S.rep && S.picks.includes(i)) || (S.noZero && cur === 0 && S.pool[i] === "0"));
  const nAllowed = (S, cur) => S.pool.filter((_, i) => allowed(S, i, cur)).length;

  function drawSlots(S) {
    let h = ""; const n = S.n, w = 70, gap = 34, tot = n * w + (n - 1) * gap, x0 = 310 - tot / 2, cur = S.picks.length;
    for (let k = 0; k < n; k++) {
      const x = x0 + (S.rtl ? n - 1 - k : k) * (w + gap);
      h += G.he(x + w / 2, 42, S.names ? S.names[k] : "תא " + (k + 1), "m", "middle");
      h += G.rect(x, 54, w, 70, k === cur ? "fsoft" : "box", { rx: 8 });
      if (S.picks[k] !== undefined) h += S.pool[S.picks[k]].match(/\d/) ? G.t(x + w / 2, 99, S.pool[S.picks[k]], "big") : G.he(x + w / 2, 99, S.pool[S.picks[k]], "big", "middle");
      if (!S.hideN && S.ns[k] !== undefined) { h += G.t(x + w / 2, 160, String(S.ns[k]), "a big"); if (k > 0) h += G.t(S.rtl ? x + w + gap / 2 : x - gap / 2, 160, "×", "a big"); }
    }
    if (!S.hideN && S.ns.length) h += S.rtl ? G.he(x0 - 14, 158, "אפשרויות", "m", "right") : G.he(x0 + tot + 14, 158, "אפשרויות", "m", "left");
    if (!S.hideN && cur === n) { const prod = S.ns.reduce((a, b) => a * b, 1); h += G.t(310, 200, S.ns.join(" × ") + " = " + prod, "a big"); }
    // pool
    const m = S.pool.length, cw = 54, px0 = 310 - (m - 1) * cw / 2;
    h += G.he(600, 252, S.rep ? "המאגר (מותר לחזור)" : "המאגר (בלי חזרה)", "b", "right");
    S.pool.forEach((c, i) => {
      const x = px0 + (S.rtl ? m - 1 - i : i) * cw, ok = cur < n && allowed(S, i, cur), used = !S.rep && S.picks.includes(i), z = S.zeroWarn && S.noZero && cur === 0 && c === "0";
      const cls = z ? "fwarn" : used ? "ghost" : cur >= n ? "box" : ok ? "fsoft hot" : "ghost";
      h += G.tap(G.circle(x, 300, 23, cls), "c:" + i);
      h += c.match(/\d/) ? G.t(x, 306, c, used ? "m" : "b", "middle", { "pointer-events": "none" }) : G.he(x, 306, c, used ? "m" : "b", "middle", { "pointer-events": "none" });
    });
    if (S.zeroWarn && S.noZero && cur === 0) h += G.he(310, 352, "ספרה ראשונה לא יכולה להיות 0", "w", "middle");
    return h;
  }
  function drawGrid(S) {
    let h = ""; const R = S.rows.length, C = S.cols.length, cw = 72, ch = 50, x0 = 300 - C * cw / 2, y0 = 92;
    if (S.title) h += G.he(600, 28, S.title, "b", "right");
    h += G.he(x0 + C * cw / 2, 56, S.colHead, "m", "middle");
    h += G.he(x0 + C * cw + 12, y0 - 14, S.rowHead, "m", "left");
    S.cols.forEach((c, j) => h += G.he(x0 + (C - 1 - j) * cw + cw / 2, y0 - 12, c, "b", "middle"));
    S.rows.forEach((r, i) => {
      h += G.he(x0 + C * cw + 12, y0 + i * ch + ch / 2 + 6, r, "b", "left");
      S.cols.forEach((c, j) => {
        const on = S.sel[i + ":" + j], x = x0 + (C - 1 - j) * cw, y = y0 + i * ch;
        h += G.tap(G.rect(x, y, cw, ch, (on ? "fa" : "box") + " hot"), i + ":" + j);
        if (S.text) h += G.he(x + cw / 2, y + ch / 2 + 6, r + c, on ? "inv" : "", "middle", { "pointer-events": "none" });
      });
    });
    const k = Object.keys(S.sel).filter(q => S.sel[q]).length;
    h += G.he(x0 - 16, y0 + 18, "סומנו: " + k, "a", "right");
    h += G.he(x0 - 16, y0 + 44, "בטבלה: " + R * C, "m", "right");
    return h;
  }
  const CP = (S, i) => { const n = S.names.length, a = -Math.PI / 2 + 2 * Math.PI * i / n; return [310 + 125 * Math.cos(a), 190 + 125 * Math.sin(a)]; };
  function drawCircle(S) {
    let h = ""; const n = S.names.length;
    for (const e of Object.keys(S.edges)) { const [a, b] = e.split("-").map(Number), [x1, y1] = CP(S, a), [x2, y2] = CP(S, b); h += G.line(x1, y1, x2, y2, "sa"); }
    S.names.forEach((nm, i) => {
      const [x, y] = CP(S, i), deg = Object.keys(S.edges).filter(e => e.split("-").map(Number).includes(i)).length;
      h += G.tap(G.circle(x, y, 22, (S.sel === i ? "fa" : "fblue-soft") + " hot"), "p:" + i);
      h += G.t(x, y + 6, String(deg), S.sel === i ? "inv" : "b", "middle", { "pointer-events": "none" });
      const lx = x + (x - 310) * .32, ly = y + (y - 190) * .32 + 6;
      h += G.he(lx, ly, nm, "b", "middle");
    });
    h += G.he(600, 30, "לחיצות ידיים: " + Object.keys(S.edges).length, "a", "right");
    h += G.he(600, 54, "המספר בעיגול = כמה ידיים לחץ", "m", "right");
    return h;
  }
  const draw = L => { const S = L.state; return S.mode === "grid" ? drawGrid(S) : S.mode === "circle" ? drawCircle(S) : drawSlots(S); };
  function tap(L, key) {
    const S = L.state; S.err = null;
    if (S.mode === "slots") {
      const i = +key.slice(2), cur = S.picks.length; if (cur >= S.n) return false;
      if (!S.rep && S.picks.includes(i)) { S.err = "used"; return; }
      if (S.noZero && cur === 0 && S.pool[i] === "0") { S.err = "zero"; S.zeroWarn = true; return; }
      S.ns.push(nAllowed(S, cur)); S.picks.push(i); return;
    }
    if (S.mode === "grid") { S.sel[key] = !S.sel[key]; S.last = key; return; }
    const i = +key.slice(2);
    if (S.sel === null) { S.sel = i; return; }
    if (S.sel === i) { S.sel = null; return false; }
    const e = [Math.min(S.sel, i), Math.max(S.sel, i)].join("-");
    if (S.edges[e]) S.err = "dup"; else S.edges[e] = true;
    S.sel = null;
  }
  const clear = L => { const S = L.state; S.picks = []; S.ns = []; S.err = null; };
  const clearTool = () => [["נקה", L => clear(L)]];
  const fill = (L, idx) => { clear(L); idx.forEach(i => tap(L, "c:" + i)); L.act({ type: "tap" }); };
  const built = (L, e, extra) => { if (e.type !== "tap") return null; const S = L.state;
    if (S.err === "used") return "הספרה הזאת כבר בשימוש. בלי חזרה, כל מה שבחרת יוצא מהמאגר.";
    if (S.err === "zero") return "מספר לא מתחיל ב־0: ‏012 הוא בעצם 12, מספר דו־ספרתי. בחר ספרה אחרת לתא הראשון.";
    if (S.picks.length < S.n) return null; return extra ? extra(S) : true; };
  const pick = (right, hints) => (L, e) => e.type !== "choice" ? null : e.j === right ? true : (hints[e.j] || "נסה שוב.");
  const selKeys = S => Object.keys(S.sel).filter(k => S.sel[k]);
  const MEALS = { rows: ["מרק", "סלט", "חומוס"], cols: ["עוף", "דג", "פסטה", "שניצל"] }, LET = ["א", "ב", "ג", "ד"];

  Lab.register({
    id: "prb-comb", title: "המחשה: צירופים", viewBox: "0 0 620 380",
    chapters: ["וגם = כפל", "עם או בלי חזרה", "הספרה 0", "סידור וזוגות", "או, ואסור", "שאלת מבחן"],
    draw, tap,
    steps: [
      { ch: 0, setup: L => { L.state = grid({ ...MEALS, title: "ארוחה = מנה ראשונה וגם מנה עיקרית", rowHead: "ראשונה", colHead: "עיקרית" }); },
        say: "במסעדה בוחרים מנה ראשונה <b>וגם</b> מנה עיקרית. כל משבצת בטבלה היא ארוחה אחת אפשרית.",
        task: "לחץ על כל הארוחות שמתחילות במרק.",
        demo: L => { L.state.sel = { "0:0": true, "0:1": true, "0:2": true, "0:3": true }; L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const ks = selKeys(L.state), bad = ks.find(k => k[0] !== "0");
          if (bad) return "הארוחה הזאת מתחילה ב" + MEALS.rows[+bad[0]] + ", לא במרק. לחץ עליה שוב כדי לבטל."; return ks.length === 4 ? true : null; },
        ok: "4 ארוחות עם מרק: אחת לכל מנה עיקרית. כל מנה ראשונה פותחת שורה שלמה של 4." },
      { ch: 0, task: "כמה ארוחות שונות יש בסך הכול?", choices: ["7 (3 + 4)", "12", "4", "3"],
        check: pick(1, { 0: "חיברת. אבל כל מנה ראשונה מתחברת לכל אחת מ־4 העיקריות. כמה שורות של 4 יש?", 2: "4 זה רק השורה של המרק. יש עוד שתי שורות.", 3: "3 זה מספר המנות הראשונות. כל אחת מהן פותחת שורה של 4." }),
        ok: "3 שורות × 4 = 12. <b>\"וגם\" → כופלים</b>: מפרקים לשלבי בחירה וכופלים את מספר האפשרויות בכל שלב." },
      { ch: 1, setup: L => { L.state = slots({ pool: ["1", "2", "3", "4", "5"], n: 3, rep: true }); },
        say: "עכשיו תאים. קוד של 3 ספרות מהספרות 1–5, ו<b>מותר</b> לחזור על ספרה. התא הוורוד הוא התא שממלאים עכשיו.",
        task: "בנה קוד כלשהו: לחץ על ספרות מהמאגר.", tools: clearTool,
        demo: L => fill(L, [2, 2, 4]),
        check: (L, e) => built(L, e),
        ok: "בכל תא היו לך 5 אפשרויות, כי הספרות לא נגמרות. 5 × 5 × 5 = 125 קודים." },
      { ch: 1, setup: L => clear(L), say: "עכשיו <b>אסור</b> לחזור על ספרה.", task: "כמה קודים יהיו לדעתך?",
        choices: ["125, כמו קודם", "60", "15", "12"],
        check: (L, e) => { if (e.type !== "choice") return null; L.memo.rep = e.j; return true; }, ok: "בוא נבנה ונראה." },
      { ch: 1, setup: L => { L.state = slots({ pool: ["1", "2", "3", "4", "5"], n: 3, rep: false }); },
        task: "בנה קוד בלי חזרה. שים לב מה קורה למאגר.", tools: clearTool,
        demo: L => fill(L, [3, 0, 4]),
        check: (L, e) => built(L, e),
        ok: L => (L.memo.rep === 1 ? "צדקת. " : "") + "כל ספרה שבחרת יצאה מהמאגר: 5, אחר כך 4, אחר כך 3. <b>בלי חזרה המאגר קטן ב־1 בכל שלב</b>: 5 × 4 × 3 = 60." },
      { ch: 2, setup: L => { L.state = slots({ pool: ["0", "1", "2", "3", "4"], n: 3, rep: false, noZero: true, hideN: true, names: ["מאות", "עשרות", "יחידות"] }); },
        say: "מספר תלת־ספרתי מהספרות 0–4, בלי חזרה.",
        task: "בנה את המספר הקטן ביותר שאפשר.", tools: clearTool,
        demo: L => fill(L, [1, 0, 2]),
        check: (L, e) => built(L, e, S => S.picks.join("") === "102" ? true : "יש מספר תלת־ספרתי קטן יותר. לחץ 'נקה' ונסה שוב."),
        ok: "102. בתא הראשון אסור 0, אבל בתאים האחרים 0 מותר, ולכן הוא נכנס מיד בעשרות." },
      { ch: 2, task: "כמה מספרים כאלה יש בסך הכול (תלת־ספרתיים, ספרות 0–4, בלי חזרה)?", choices: ["60", "48", "64", "36"],
        check: pick(1, { 0: "5 × 4 × 3 סופר גם 'מספרים' שמתחילים ב־0. כמה ספרות מותרות בתא הראשון?", 2: "בתא האחרון כבר יצאו שתי ספרות מתוך 5. כמה נשארו?", 3: "בתא השני 0 כבר מותר. מתוך 5 ספרות יצאה רק אחת." }),
        ok: "תא ראשון: 4 (בלי 0). תא שני: 4 (חזר ה־0, יצאה ספרה אחת). תא שלישי: 3. ‏4 × 4 × 3 = 48. מתחילים תמיד מהתא עם ההגבלה." },
      { ch: 3, setup: L => { L.state = slots({ pool: LET, n: 4, rep: false, rtl: true, names: ["מקום 1", "מקום 2", "מקום 3", "מקום 4"] }); },
        say: "4 ספרים, א עד ד, מסודרים על מדף. כל סידור הוא שורה של ארבעה מקומות.",
        task: "סדר את כל הספרים על המדף.", tools: clearTool,
        demo: L => fill(L, [2, 0, 3, 1]),
        check: (L, e) => { const r = built(L, e); return r === "הספרה הזאת כבר בשימוש. בלי חזרה, כל מה שבחרת יוצא מהמאגר." ? "הספר הזה כבר על המדף. בחר ספר אחר." : r; },
        ok: "4 × 3 × 2 × 1 = 24. זה <b>4!</b> (\"4 עצרת\"): מספר הסידורים של 4 דברים שונים בשורה." },
      { ch: 3, task: "בכמה דרכים אפשר לסדר 5 ספרים שונים בשורה?", choices: ["25", "120", "20", "60"],
        check: pick(1, { 0: "5 × 5 זה עם חזרה, אבל ספר לא יכול לעמוד בשני מקומות.", 2: "עצרת על אחרי שני שלבים. יש 5 מקומות למלא.", 3: "5 × 4 × 3 ממלא רק 3 מקומות. המשך עד 1." }),
        ok: "5! = 5 × 4 × 3 × 2 × 1 = 120. כדאי לזכור: 3! = 6, ‏4! = 24, ‏5! = 120." },
      { ch: 3, setup: L => { L.state = circle(); },
        say: "5 חברים נפגשים, וכל אחד לוחץ יד לכל אחד מהאחרים.", task: "כמה לחיצות ידיים יהיו לדעתך?",
        choices: ["25", "20", "10", "5"],
        check: (L, e) => { if (e.type !== "choice") return null; L.memo.hs = e.j; return true; }, ok: "בוא נצייר אותן." },
      { ch: 3, task: "צייר את כל לחיצות הידיים: לחץ על שני אנשים כדי לחבר ביניהם בקו.",
        demo: L => { const S = L.state; for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) S.edges[a + "-" + b] = true; S.sel = null; L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const S = L.state;
          if (S.err === "dup") return "השניים האלה כבר לחצו ידיים. לחיצה של דנה עם יוסי היא אותה לחיצה כמו של יוסי עם דנה.";
          return Object.keys(S.edges).length === 10 ? true : null; },
        ok: L => (L.memo.hs === 1 ? "20 זו המלכודת. " : L.memo.hs === 2 ? "צדקת. " : "") + "10 קווים. כל אחד לוחץ 4 ידיים, ו־5 × 4 = 20, אבל כל לחיצה נספרה פעמיים, פעם אצל כל צד. לכן 20 ÷ 2 = 10. <b>פעולה הדדית: n(n−1)/2</b>." },
      { ch: 3, say: "אותם 5 אנשים. הפעם בוחרים מהם יו\"ר וסגן.", task: "כמה אפשרויות יש?", choices: ["10", "20", "25", "5"],
        check: pick(1, { 0: "כאן יש סדר: דנה יו\"ר ויוסי סגן זה לא כמו יוסי יו\"ר ודנה סגן. אז לא מחלקים ב־2.", 2: "אדם אחד לא יכול להיות גם יו\"ר וגם סגן.", 3: "יש 5 אפשרויות ליו\"ר, ולכל אחת מהן כמה אפשרויות לסגן?" }),
        ok: "5 × 4 = 20, ולא מחלקים כי יש סדר. אילו בחרנו סתם ועדה של 2, בלי תפקידים, היו 10, כמו לחיצות הידיים." },
      { ch: 4, setup: L => { L.state = grid({ rows: LET, cols: LET, text: true, title: "סיסמה של 2 אותיות, מותר לחזור", rowHead: "אות 1", colHead: "אות 2" }); },
        say: "כל הסיסמאות של 2 אותיות מתוך א–ד, עם חזרה: 4 × 4 = 16.",
        task: "סמן את כל הסיסמאות שאין בהן א בכלל.",
        demo: L => { const S = L.state; S.sel = {}; for (let i = 1; i < 4; i++) for (let j = 1; j < 4; j++) S.sel[i + ":" + j] = true; L.act({ type: "tap" }); },
        check: (L, e) => { if (e.type !== "tap") return null; const ks = selKeys(L.state), bad = ks.find(k => k.includes("0"));
          if (bad) { const [i, j] = bad.split(":").map(Number); return "בסיסמה " + LET[i] + LET[j] + " יש א. לחץ עליה שוב כדי לבטל."; } return ks.length === 9 ? true : null; },
        ok: "9 סיסמאות בלי א, ריבוע של 3 × 3. כל השאר מכילות א." },
      { ch: 4, task: "כמה סיסמאות מכילות לפחות א אחת?", choices: ["8", "7", "9", "6"],
        check: pick(1, { 0: "4 בשורה של א ועוד 4 בעמודה של א, אבל הסיסמה אא נמצאת בשתיהן. ספרת אותה פעמיים.", 2: "9 זה מספר הסיסמאות <b>בלי</b> א.", 3: "ספור שוב את המשבצות הלבנות." }),
        ok: "<b>מותר = סך הכול − אסור</b>: 16 − 9 = 7. כשקשה לספור את מה שרוצים, סופרים את ההפך ומחסירים." },
      { ch: 4, task: "סיסמה יכולה להיות של אות אחת <b>או</b> של שתי אותיות (מא–ד, עם חזרה). כמה סיסמאות יש?", choices: ["64", "20", "16", "8"],
        check: pick(1, { 0: "כפלת 4 × 16. אבל סיסמה היא או באורך 1 או באורך 2, לא שתיהן יחד.", 2: "שכחת את הסיסמאות של אות אחת.", 3: "4 של אות אחת, אבל של שתי אותיות יש 16, כמו בטבלה." }),
        ok: "4 + 16 = 20. <b>\"או\" (מקרים נפרדים) → מחברים</b>. \"וגם\" (שלבים) → כופלים." },
      { ch: 5, setup: L => { L.state = slots({ pool: ["0", "1", "2", "3", "4", "5"], n: 3, rep: false, noZero: true, names: ["מאות", "עשרות", "יחידות"] }); },
        say: "שאלה ברמת מבחן. התאים פתוחים לשימוש חופשי.", tools: clearTool,
        task: "כמה מספרים זוגיים בני 3 ספרות שונות זו מזו אפשר ליצור מהספרות 0, 1, 2, 3, 4, 5?",
        choices: ["60", "52", "48", "40"],
        check: pick(1, { 0: "בדקת מה קורה כשהספרה הראשונה היא 0?", 2: "כשהספרה האחרונה היא 0, לספרה הראשונה נשארות 5 אפשרויות, לא 4. פצל למקרים.", 3: "פצל לשני מקרים: יחידות 0, או יחידות 2/4. חשב כל אחד וחבר." }),
        ok: "מקרה א, יחידות 0: מאות 5 × עשרות 4 = 20. מקרה ב, יחידות 2 או 4: מאות 4 (לא 0 ולא ספרת היחידות) × עשרות 4 × 2 = 32. ‏\"או\" → 20 + 32 = <b>52</b>." },
      { ch: 5, say: "<b>סיכום ההמחשה:</b><br>1. מפרקים לשלבים. \"וגם\" → כופלים, \"או\" → מחברים.<br>2. בלי חזרה המאגר קטן ב־1 בכל שלב. n דברים בשורה: n!.<br>3. מתחילים מהתא המוגבל (ספרה ראשונה ≠ 0).<br>4. פעולה הדדית או קבוצה בלי סדר: מחלקים ב־2. מותר = סך הכול − אסור.", next: "סיום ההמחשה" },
    ],
  });
})();
