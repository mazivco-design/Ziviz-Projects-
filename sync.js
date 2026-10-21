// ZSync — shared sync for all of Ziviz projects.
// Each app keeps its data in Firestore at users/{uid}/apps/{appName},
// plus optional big items (like images) at users/{uid}/apps/{appName}/items/{id}.
// Usage from any page on mazivco-design.github.io:
//   <script src="https://mazivco-design.github.io/Ziviz-Projects-/firebase-config.js"></script>
//   <script type="module" src="https://mazivco-design.github.io/Ziviz-Projects-/sync.js"></script>
//   window.addEventListener('zsync-ready', () => { ZSync.onUser(u => ...) })
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, setDoc, deleteDoc, onSnapshot, collection, getDoc, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const app = initializeApp(window.FIREBASE_CONFIG);
const auth = getAuth(app);
let db;
try { db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
catch (e) { db = initializeFirestore(app, {}); }

let user = null;
const userListeners = [];
onAuthStateChanged(auth, u => { user = u; userListeners.forEach(f => { try { f(u) } catch (e) { console.error(e) } }); });

const appDoc = (name) => doc(db, 'users', user.uid, 'apps', name);
const itemDoc = (name, id) => doc(db, 'users', user.uid, 'apps', name, 'items', id);

window.ZSync = {
  get user() { return user; },
  onUser(f) { userListeners.push(f); f(user); },
  async signIn() { return signInWithPopup(auth, new GoogleAuthProvider()); },
  async signOut() { return signOut(auth); },
  // main data of an app (must stay under ~900KB)
  async load(name) { const s = await getDoc(appDoc(name)); return s.exists() ? s.data().data : null; },
  async save(name, data) { await setDoc(appDoc(name), { data, updated: serverTimestamp() }); },
  watch(name, f) { return onSnapshot(appDoc(name), s => f(s.exists() ? s.data().data : null, s.metadata.hasPendingWrites)); },
  // separate items (images etc.)
  async saveItem(name, id, value) { await setDoc(itemDoc(name, id), { value, updated: serverTimestamp() }); },
  async deleteItem(name, id) { await deleteDoc(itemDoc(name, id)); },
  watchItems(name, f) {
    return onSnapshot(collection(db, 'users', user.uid, 'apps', name, 'items'), s => {
      const out = {}; s.forEach(d => { out[d.id] = d.data().value; }); f(out);
    });
  }
};
window.dispatchEvent(new Event('zsync-ready'));
