// סנכרון פרויקט נועם בין מכשירים (Firebase דרך sync.js של אתר הפרויקטים).
// הקוד של המשחק לא משתנה: הקובץ הזה "מקשיב" לשמירות ב-localStorage ומעביר אותן לחשבון.
// כל פריט נשמר בנפרד: פרויקט, רשומת דוח, תמונה, מילון תיקונים, התקדמות, הגדרות יצירה אוטומטית.
(function () {
  'use strict';
  const APP = 'noam';
  const K = { data: 'ninjagoData', corr: 'ninjagoCorrections', log: 'ninjagoLog', img: 'ninjagoImages', prog: 'ninjagoProgress', auto: 'ninjagoAutogen' };
  const WATCH = new Set(Object.values(K));
  const BASE_KEY = 'ninjagoSyncBase';
  const MAX_ITEM = 1000000; // מגבלת גודל לפריט אחד בחשבון

  let Z = null, ready = false, applying = false, pushTimer = null, pushing = false, again = false;
  let remote = {}, pendingNotice = false, unsub = null;

  // ---------- עזרים ----------
  const ls = window.localStorage;
  const rawSet = Storage.prototype.setItem, rawRemove = Storage.prototype.removeItem;
  function hash(str) { // cyrb53
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  function parse(s, d) { try { const v = JSON.parse(s); return v == null ? d : v; } catch (e) { return d; } }
  function loadBase() { return parse(ls.getItem(BASE_KEY), {}); }
  function saveBase(b) { try { rawSet.call(ls, BASE_KEY, JSON.stringify(b)); } catch (e) {} }
  let base = loadBase();
  const enc = s => encodeURIComponent(s).replace(/\./g, '%2E');
  const dec = s => decodeURIComponent(s);
  const kind = k => k.startsWith('p~') ? 'data' : k.startsWith('log~') ? 'log' : k.startsWith('img~') ? 'img' : k;

  // ---------- קריאה וכתיבה של הנתונים המקומיים כ"פריטים" ----------
  function readLocal() {
    const u = {};
    const data = parse(ls.getItem(K.data), {});
    if (data && typeof data === 'object') Object.keys(data).forEach(n => { u['p~' + enc(n)] = JSON.stringify(data[n]); });
    const log = parse(ls.getItem(K.log), []);
    if (Array.isArray(log)) log.forEach(r => { if (r && r.id) u['log~' + r.id] = JSON.stringify(r); });
    const img = parse(ls.getItem(K.img), null);
    if (img && img.map) Object.keys(img.map).forEach(id => { if (typeof img.map[id] === 'string') u['img~' + id] = img.map[id]; });
    ['corr', 'prog', 'auto'].forEach(k => { const v = ls.getItem(K[k]); if (v != null) u[k] = v; });
    return u;
  }
  function writeLocal(u, changedKinds) {
    applying = true;
    const dropped = [];
    try {
      if (changedKinds.has('data')) {
        const old = parse(ls.getItem(K.data), {}), out = {};
        const names = Object.keys(u).filter(k => k.startsWith('p~')).map(k => dec(k.slice(2)));
        Object.keys(old).filter(n => names.includes(n)).concat(names.filter(n => !(n in old))).forEach(n => { out[n] = parse(u['p~' + enc(n)], null); });
        safeSet(K.data, JSON.stringify(out));
      }
      if (changedKinds.has('log')) {
        const log = Object.keys(u).filter(k => k.startsWith('log~')).map(k => parse(u[k], null)).filter(Boolean).sort((a, b) => (a.ts || 0) - (b.ts || 0));
        if (log.length) safeSet(K.log, JSON.stringify(log)); else rawRemove.call(ls, K.log);
        try { logCache = null; } catch (e) {}
      }
      if (changedKinds.has('img')) {
        const old = parse(ls.getItem(K.img), null), oldOrder = (old && Array.isArray(old.order)) ? old.order : [];
        const ids = Object.keys(u).filter(k => k.startsWith('img~')).map(k => k.slice(4));
        const order = oldOrder.filter(id => ids.includes(id)).concat(ids.filter(id => !oldOrder.includes(id)).sort());
        const st = { order, map: {} }; order.forEach(id => { st.map[id] = u['img~' + id]; });
        for (let i = 0; i < 400; i++) { // אם אין מקום במכשיר: מוותרים מקומית על הישנות (הן נשארות בחשבון)
          try { rawSet.call(ls, K.img, JSON.stringify(st)); break; }
          catch (e) { if (!st.order.length) break; const id = st.order.shift(); delete st.map[id]; dropped.push('img~' + id); }
        }
        try { imageStore = null; } catch (e) {}
      }
      ['corr', 'prog', 'auto'].forEach(k => {
        if (!changedKinds.has(k)) return;
        if (u[k] != null) safeSet(K[k], u[k]); else rawRemove.call(ls, K[k]);
      });
      if (changedKinds.has('corr')) { const el = document.getElementById('correctionsInput'); if (el) el.value = u.corr || ''; }
    } finally { applying = false; }
    return dropped;
  }
  function safeSet(k, v) { try { rawSet.call(ls, k, v); } catch (e) { console.warn('noam-sync: אין מקום לשמור', k); } }

  // ---------- מיזוג בין המכשיר לחשבון ----------
  function reconcile() {
    const L = readLocal(), Lh = {}, Rh = {};
    Object.keys(L).forEach(k => { Lh[k] = hash(L[k]); });
    Object.keys(remote).forEach(k => { Rh[k] = hash(remote[k]); });
    const keys = new Set(Object.keys(Lh).concat(Object.keys(Rh), Object.keys(base)));
    const out = Object.assign({}, L), changed = new Set();
    let needPush = false;
    keys.forEach(k => {
      const l = Lh[k], r = Rh[k], b = base[k];
      if (l === r) { if (l === undefined) delete base[k]; else base[k] = l; return; }
      const takeRemote = (b === undefined && l !== undefined && r !== undefined) || l === b;
      if (takeRemote) {
        if (r === undefined) delete out[k]; else out[k] = remote[k];
        if (r === undefined) delete base[k]; else base[k] = r;
        changed.add(kind(k));
      } else needPush = true;
    });
    if (changed.size) {
      const dropped = writeLocal(out, changed);
      dropped.forEach(k => { delete base[k]; });
      afterRemoteChange(changed);
    }
    saveBase(base);
    if (needPush) schedulePush();
  }

  async function pushNow() {
    if (!ready || !Z || !Z.user) return;
    if (pushing) { again = true; return; }
    pushing = true;
    try {
      const L = readLocal(), jobs = [];
      Object.keys(L).forEach(k => {
        const h = hash(L[k]);
        if (h === base[k]) return;
        if (L[k].length > MAX_ITEM) { console.warn('noam-sync: פריט גדול מדי', k); return; }
        if (remote[k] === undefined || hash(remote[k]) !== h) jobs.push(Z.saveItem(APP, k, L[k]));
        base[k] = h;
      });
      Object.keys(base).forEach(k => {
        if (L[k] !== undefined) return;
        if (k.startsWith('img~')) { delete base[k]; return; } // תמונה שנמחקה במכשיר נשארת בחשבון
        jobs.push(Z.deleteItem(APP, k)); delete base[k];
      });
      saveBase(base);
      await Promise.all(jobs);
      setStatus();
    } catch (e) { console.error(e); setStatus('הסנכרון נכשל. השינויים שמורים במכשיר ויישלחו שוב.'); }
    finally { pushing = false; if (again) { again = false; schedulePush(); } }
  }
  function schedulePush() { clearTimeout(pushTimer); pushTimer = setTimeout(pushNow, 1200); }

  // כל שמירה של המשחק עוברת כאן
  Storage.prototype.setItem = function (k, v) {
    rawSet.call(this, k, v);
    if (this === ls && WATCH.has(k) && !applying && ready) schedulePush();
  };
  Storage.prototype.removeItem = function (k) {
    rawRemove.call(this, k);
    if (this === ls && WATCH.has(k) && !applying && ready) schedulePush();
  };

  // ---------- תצוגה ----------
  const css = document.createElement('style');
  css.textContent = `
    #zsyncBtn{margin-inline-start:8px}
    #zsyncBtn.on{background:#e8f5e9;border-color:#43a047;color:#1b5e20}
    body.game-active #zsyncBtn{display:none}
    #zsyncBar{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9999;
      background:#1e2a2f;color:#fff;border-radius:12px;padding:10px 14px;display:flex;gap:12px;align-items:center;font-size:16px;box-shadow:0 4px 14px rgba(0,0,0,.25);max-width:calc(100% - 32px)}
    #zsyncBar button{font:inherit;font-weight:700;border:0;border-radius:8px;padding:8px 14px;background:#ffc22e;color:#3a2a00;cursor:pointer}
    #zsyncBar .x{background:transparent;color:#fff;padding:8px}
    body.game-active #zsyncBar{display:none}`;
  document.head.appendChild(css);

  const btn = document.createElement('button');
  btn.id = 'zsyncBtn'; btn.className = 'btn-nav'; btn.type = 'button'; btn.hidden = true;
  const nav = document.querySelector('.top-nav');
  if (nav) nav.appendChild(btn);

  function setStatus(err) {
    if (!Z) return;
    btn.hidden = false;
    if (Z.user) { btn.textContent = '☁️ מסונכרן'; btn.classList.add('on'); btn.title = (Z.user.email || '') + (err ? ' — ' + err : ''); }
    else { btn.textContent = '☁️ התחבר לסנכרון'; btn.classList.remove('on'); btn.title = ''; }
    if (err) showBar(err, false);
  }
  btn.onclick = async () => {
    if (!Z) return;
    if (Z.user) {
      openConfirm('סנכרון', 'מחובר בתור ' + (Z.user.email || '') + '. להתנתק? אחרי ההתנתקות השינויים יישמרו רק במכשיר הזה.', async () => { await Z.signOut(); });
      return;
    }
    try { await Z.signIn(); } catch (e) { if (!e || e.code !== 'auth/popup-closed-by-user') showBar('הכניסה לא הצליחה. נסה שוב.', false); }
  };
  function openConfirm(t, m, cb) { if (typeof openConfirmModal === 'function') openConfirmModal(t, m, cb); }

  let bar = null;
  function showBar(text, withReload) {
    if (!bar) { bar = document.createElement('div'); bar.id = 'zsyncBar'; document.body.appendChild(bar); }
    bar.innerHTML = '';
    const s = document.createElement('span'); s.textContent = text; bar.appendChild(s);
    if (withReload) { const b = document.createElement('button'); b.textContent = 'רענן'; b.onclick = () => location.reload(); bar.appendChild(b); }
    const x = document.createElement('button'); x.className = 'x'; x.textContent = '✕'; x.setAttribute('aria-label', 'סגור'); x.onclick = () => { bar.remove(); bar = null; }; bar.appendChild(x);
  }
  function afterRemoteChange(changed) {
    if (changed.has('data') || changed.has('corr') || changed.has('auto')) pendingNotice = true;
    if ((changed.has('log') || changed.has('img'))) {
      const rep = document.getElementById('tab-report');
      if (rep && rep.classList.contains('active') && typeof renderReport === 'function') { try { renderReport(); } catch (e) {} }
    }
    maybeNotice();
  }
  function maybeNotice() {
    if (!pendingNotice || document.body.classList.contains('game-active')) return;
    pendingNotice = false;
    showBar('יש עדכון ממכשיר אחר', true);
  }
  new MutationObserver(maybeNotice).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // איפוס וניקוי דוח: אזהרה שזה ימחק גם מהחשבון
  function wrapDanger(name, msg) {
    const orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () {
      if (!(Z && Z.user)) return orig.apply(this, arguments);
      const o = window.openConfirmModal; // מוסיפים את האזהרה לחלון האישור של המשחק עצמו
      window.openConfirmModal = function (t, m, cb) { return o.call(this, t, m + '\n\n' + msg, cb); };
      try { return orig.apply(this, arguments); } finally { window.openConfirmModal = o; }
    };
  }
  wrapDanger('resetEntireSystem', '☁️ אתה מחובר לסנכרון: האיפוס ימחק את הפרויקטים גם מהחשבון ומכל המכשירים המחוברים.');
  wrapDanger('clearAllLog', '☁️ אתה מחובר לסנכרון: הדוח יימחק גם מהחשבון ומכל המכשירים המחוברים.');

  // ---------- חיבור ----------
  function onUser(u) {
    if (unsub) { unsub(); unsub = null; }
    ready = false; remote = {};
    setStatus();
    if (!u) return;
    let first = true;
    unsub = Z.watchItems(APP, items => {
      remote = items;
      reconcile();
      if (first) { first = false; ready = true; schedulePush(); }
    });
  }
  function hook() { if (Z || !window.ZSync) return; Z = window.ZSync; Z.onUser(onUser); }
  window.addEventListener('zsync-ready', hook); hook();
})();
