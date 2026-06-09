type CachedBook = {
  id: string;
  title: string;
  author: string;
  blocks: { type: string; text: string }[];
  coverUrl?: string;
  cachedAt: number;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("literary-lab", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("books", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveBookToCache(book: CachedBook): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction("books", "readwrite");
    tx.objectStore("books").put({ ...book, cachedAt: Date.now() });
  } catch { /* IndexedDB unavailable */ }
}

export async function getCachedBook(id: string): Promise<CachedBook | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction("books", "readonly");
      const req = tx.objectStore("books").get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function getCachedBooks(): Promise<CachedBook[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction("books", "readonly");
      const req = tx.objectStore("books").getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function removeCachedBook(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction("books", "readwrite");
    tx.objectStore("books").delete(id);
  } catch { /* IndexedDB unavailable */ }
}

export function isCached(id: string): Promise<boolean> {
  return getCachedBook(id).then((b) => !!b).catch(() => false);
}
