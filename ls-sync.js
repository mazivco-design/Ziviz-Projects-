// ls-sync — סנכרון כללי של ערכים ב-localStorage דרך ZSync (Firebase).
// מתאים לאפליקציות ששומרות את הנתונים שלהן ב-localStorage בכמה מפתחות.
// שימוש (אחרי שאר הסקריפטים של האפליקציה):
//   <script src="/Ziviz-Projects-/firebase-config.js"></script>
//   <script src="/Ziviz-Projects-/ls-sync.js" data-app="ninja" data-prefix="ninjaVoice"
//           data-exclude="ninjaVoice_mute,ninjaVoice_vlog" data-button="#menu .mtop" data-busy="body.playing"></script>
//   <script type="module" src="/Ziviz-Projects-/sync.js"></script>
// data-button: איפה לשים את כפתור הסנכרון. data-busy: כשהבורר הזה תופס, לא מציגים כפתור/הודעה (למשל בזמן משחק).
(function () {
  'use strict';
  const me = document.currentScript;
  const cfg = {
    app: me.dataset.app,
    prefixes: (me.dataset.prefix || '').split(',').map(s => s.trim()).filter(Boolean),
    exclude: new Set((me.dataset.exclude || '').split(',').map(s => s.trim()).filter(Boolean)),
    button: me.dataset.button || null,
    busy: me.dataset.busy || null
  };
  if (!cfg.app || !cfg.prefixes.length) return;
  const BASE_KEY = '__lssync_base_' + cfg.app;
  const MAX_ITEM = 1000000;
  const ls = window.localStorage;
  const rawSet = Storage.prototype.setItem, rawRemove = Storage.prototype.removeItem;
  const watched = k => !cfg.exclude.has(k) && cfg.prefixes.some(p => k.startsWith(p));

  let Z = null, ready = false, applying = false, pushTimer = null, pushing = false, again = false;
  let remote = {}, unsub = null, pendingNotice = false;

  function hash(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  let base = {}; try { base = JSON.parse(ls.getItem(BASE_KEY) || '{}') || {}; } catch (e) {}
  function saveBase() { try { rawSet.call(ls, BASE_KEY, JSON.stringify(base)); } catch (e) {} }
  const enc = k => 'k~' + encodeURIComponent(k).replace(/\./g, '%2E');
  const dec = id => decodeURIComponent(id.slice(2));

  function readLocal() {
    const u = {};
    for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k && watched(k)) u[enc(k)] = ls.getItem(k); }
    return u;
  }

  function reconcile() {
    const L = readLocal(), out = {};
    const keys = new Set(Object.keys(L).concat(Object.keys(remote), Object.keys(base)));
    let needPush = false, took = false;
    applying = true;
    try {
      keys.forEach(id => {
        const l = L[id] !== undefined ? hash(L[id]) : undefined;
        const r = remote[id] !== undefined ? hash(remote[id]) : undefined;
        const b = base[id];
        if (l === r) { if (l === undefined) delete base[id]; else base[id] = l; return; }
        const takeRemote = (b === undefined && l !== undefined && r !== undefined) || l === b;
        if (!takeRemote) { needPush = true; return; }
        const k = dec(id);
        if (r === undefined) { rawRemove.call(ls, k); delete base[id]; }
        else { try { rawSet.call(ls, k, remote[id]); base[id] = r; } catch (e) { delete base[id]; } }
        took = true;
      });
    } finally { applying = false; }
    saveBase();
    if (took && ready) { pendingNotice = true; maybeNotice(); }
    if (needPush) schedulePush();
    return took;
  }

  async function pushNow() {
    if (!ready || !Z || !Z.user) return;
    if (pushing) { again = true; return; }
    pushing = true;
    try {
      const L = readLocal(), jobs = [];
      Object.keys(L).forEach(id => {
        const h = hash(L[id]);
        if (h === base[id]) return;
        if (L[id].length > MAX_ITEM) { console.warn('ls-sync: ערך גדול מדי לסנכרון', dec(id)); return; }
        if (remote[id] === undefined || hash(remote[id]) !== h) jobs.push(Z.saveItem(cfg.app, id, L[id]));
        base[id] = h;
      });
      Object.keys(base).forEach(id => { if (L[id] === undefined) { jobs.push(Z.deleteItem(cfg.app, id)); delete base[id]; } });
      saveBase();
      await Promise.all(jobs);
    } catch (e) { console.error(e); showBar('הסנכרון נכשל. השינויים שמורים במכשיר ויישלחו שוב.', false); }
    finally { pushing = false; if (again) { again = false; schedulePush(); } }
  }
  function schedulePush() { clearTimeout(pushTimer); pushTimer = setTimeout(pushNow, 1200); }

  Storage.prototype.setItem = function (k, v) {
    rawSet.call(this, k, v);
    if (this === ls && !applying && ready && watched(k)) schedulePush();
  };
  Storage.prototype.removeItem = function (k) {
    rawRemove.call(this, k);
    if (this === ls && !applying && ready && watched(k)) schedulePush();
  };

  // ---------- תצוגה ----------
  const css = document.createElement('style');
  css.textContent = `
    .lssync-btn{font:inherit;font-size:14px;font-weight:700;border-radius:10px;border:2px solid #9aa7b4;background:#fff;color:#1e2a2f;padding:6px 12px;cursor:pointer}
    .lssync-btn.on{border-color:#43a047;background:#e8f5e9;color:#1b5e20}
    .lssync-bar{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:99999;direction:rtl;
      background:#1e2a2f;color:#fff;border-radius:12px;padding:10px 14px;display:flex;gap:12px;align-items:center;font:16px system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25);max-width:calc(100% - 32px)}
    .lssync-bar button{font:inherit;font-weight:700;border:0;border-radius:8px;padding:8px 14px;background:#ffc22e;color:#3a2a00;cursor:pointer}
    .lssync-bar .x{background:transparent;color:#fff;padding:8px}`;
  document.head.appendChild(css);
  const isBusy = () => !!(cfg.busy && document.querySelector(cfg.busy));

  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'lssync-btn'; btn.hidden = true; btn.dir = 'rtl';
  function placeButton() {
    const host = cfg.button && document.querySelector(cfg.button);
    if (host && btn.parentNode !== host) host.appendChild(btn);
  }
  function setUI() {
    if (!Z) return;
    placeButton(); btn.hidden = false;
    if (Z.user) { btn.textContent = '☁️ מסונכרן'; btn.classList.add('on'); btn.title = Z.user.email || ''; }
    else { btn.textContent = '☁️ התחבר לסנכרון'; btn.classList.remove('on'); btn.title = ''; }
  }
  btn.onclick = async () => {
    if (!Z) return;
    if (Z.user) { showBar('מחובר לסנכרון בתור ' + (Z.user.email || ''), false, 'התנתק', async () => { await Z.signOut(); }); return; }
    try { await Z.signIn(); } catch (e) { if (!e || e.code !== 'auth/popup-closed-by-user') showBar('הכניסה לא הצליחה. נסה שוב.', false); }
  };

  let bar = null;
  function showBar(text, withReload, actLabel, act) {
    if (!bar) { bar = document.createElement('div'); bar.className = 'lssync-bar'; document.body.appendChild(bar); }
    bar.innerHTML = '';
    const s = document.createElement('span'); s.textContent = text; bar.appendChild(s);
    if (withReload) { const b = document.createElement('button'); b.textContent = 'רענן'; b.onclick = () => location.reload(); bar.appendChild(b); }
    if (actLabel) { const b = document.createElement('button'); b.textContent = actLabel; b.onclick = () => { closeBar(); act(); }; bar.appendChild(b); }
    const x = document.createElement('button'); x.className = 'x'; x.textContent = '✕'; x.setAttribute('aria-label', 'סגור'); x.onclick = closeBar; bar.appendChild(x);
  }
  function closeBar() { if (bar) { bar.remove(); bar = null; } }
  function maybeNotice() {
    if (!pendingNotice || isBusy()) return;
    pendingNotice = false;
    showBar('יש עדכון ממכשיר אחר', true);
  }
  setInterval(maybeNotice, 1500);

  // ---------- חיבור ----------
  function onUser(u) {
    if (unsub) { unsub(); unsub = null; }
    ready = false; remote = {}; setUI();
    if (!u) return;
    let first = true;
    unsub = Z.watchItems(cfg.app, items => {
      remote = items;
      const took = reconcile();
      if (first) {
        first = false; ready = true; schedulePush();
        if (took) showBar('הנתונים מהחשבון נטענו', true); // בפעם הראשונה: צריך לרענן כדי שהאפליקציה תציג אותם
      }
    });
  }
  function hook() { if (Z || !window.ZSync) return; Z = window.ZSync; Z.onUser(onUser); }
  window.addEventListener('zsync-ready', hook); hook();
  document.addEventListener('DOMContentLoaded', placeButton);
})();
