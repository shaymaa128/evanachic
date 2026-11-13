/* ============================================================
   EVANA CHIC – data storage
   Admin edits are saved in this browser (IndexedDB).
   The public site uses: saved admin data -> exported store-data.js -> starter data.
   ============================================================ */
const DB_NAME = 'evanachic', DB_STORE = 'kv';

function idbOpen() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(DB_STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const q = db.transaction(DB_STORE).objectStore(DB_STORE).get(key);
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  });
}
async function idbSet(key, val) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(val, key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
async function idbDelete(key) {
  const db = await idbOpen();
  return new Promise((res, rej) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete(key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function loadStore() {
  let d = null;
  try { d = await idbGet('data'); } catch (e) {}
  if (!d && window.STORE_DATA) d = window.STORE_DATA;
  if (d && Array.isArray(d.products) && Array.isArray(d.categories)) {
    PRODUCTS = d.products;
    CATEGORIES = d.categories;
  }
  PRODUCTS.forEach(p => {
    if (!p.images || !p.images.length) p.images = [ph(p.name, '')];
    if (!Array.isArray(p.options)) p.options = [...DEFAULT_OPTIONS];   // older saved data
    if (!Array.isArray(p.sizes)) p.sizes = [...DEFAULT_SIZES];
    if (!Array.isArray(p.videos)) p.videos = [];                        // videos: {type:'youtube', id} or {type:'file', src}
  });
}
