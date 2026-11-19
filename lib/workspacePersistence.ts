'use client';

import type { ChatMessage, DocumentRecord } from './types';

const DB_NAME = 'voxora_workspace';
const DB_VERSION = 1;

const STORES = {
  DOCUMENTS: 'documents',
  MESSAGES: 'messages',
  METADATA: 'metadata',
} as const;

const FALLBACK_KEYS = {
  DOCS: 'voxora_fallback_docs',
  MSGS: 'voxora_fallback_msgs',
};

function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      return reject(new Error('IndexedDB is not available in this environment.'));
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.DOCUMENTS)) {
          db.createObjectStore(STORES.DOCUMENTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
          db.createObjectStore(STORES.MESSAGES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Failed to open database.'));
      request.onblocked = () => reject(new Error('IndexedDB database open was blocked.'));
    } catch (err) {
      reject(err);
    }
  });
}

function fallbackSave<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`LocalStorage quota exceeded or unavailable for ${key}:`, err);
  }
}

function fallbackLoad<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function fallbackRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore error
  }
}

export async function saveDocumentsToStorage(documents: DocumentRecord[]): Promise<void> {
  if (!isIndexedDBAvailable()) {
    fallbackSave(FALLBACK_KEYS.DOCS, documents);
    return;
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.DOCUMENTS, 'readwrite');
      const store = tx.objectStore(STORES.DOCUMENTS);

      store.clear();
      for (const doc of documents) {
        store.put(doc);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB write failed, using localStorage fallback:', err);
    fallbackSave(FALLBACK_KEYS.DOCS, documents);
  }
}

export async function loadDocumentsFromStorage(): Promise<DocumentRecord[]> {
  if (!isIndexedDBAvailable()) {
    return fallbackLoad<DocumentRecord[]>(FALLBACK_KEYS.DOCS, []);
  }

  try {
    const db = await openDB();
    const docs = await new Promise<DocumentRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORES.DOCUMENTS, 'readonly');
      const store = tx.objectStore(STORES.DOCUMENTS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    if (docs.length === 0) {
      const fallbackDocs = fallbackLoad<DocumentRecord[]>(FALLBACK_KEYS.DOCS, []);
      if (fallbackDocs.length > 0) {
        void saveDocumentsToStorage(fallbackDocs);
        return fallbackDocs;
      }
    }

    return docs;
  } catch (err) {
    console.warn('IndexedDB read failed, using localStorage fallback:', err);
    return fallbackLoad<DocumentRecord[]>(FALLBACK_KEYS.DOCS, []);
  }
}

export async function removeDocumentFromStorage(docId: string): Promise<void> {
  if (!isIndexedDBAvailable()) {
    const docs = fallbackLoad<DocumentRecord[]>(FALLBACK_KEYS.DOCS, []);
    fallbackSave(FALLBACK_KEYS.DOCS, docs.filter((d) => d.id !== docId));
    return;
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.DOCUMENTS, 'readwrite');
      const store = tx.objectStore(STORES.DOCUMENTS);
      const request = store.delete(docId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete failed, using localStorage fallback:', err);
    const docs = fallbackLoad<DocumentRecord[]>(FALLBACK_KEYS.DOCS, []);
    fallbackSave(FALLBACK_KEYS.DOCS, docs.filter((d) => d.id !== docId));
  }
}

export async function clearStorageDocuments(): Promise<void> {
  fallbackRemove(FALLBACK_KEYS.DOCS);

  if (!isIndexedDBAvailable()) return;

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.DOCUMENTS, 'readwrite');
      const store = tx.objectStore(STORES.DOCUMENTS);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB clear failed:', err);
  }
}

export async function saveMessagesToStorage(messages: ChatMessage[]): Promise<void> {
  if (!isIndexedDBAvailable()) {
    fallbackSave(FALLBACK_KEYS.MSGS, messages);
    return;
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.MESSAGES, 'readwrite');
      const store = tx.objectStore(STORES.MESSAGES);

      store.clear();
      for (const msg of messages) {
        store.put(msg);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB write for messages failed, using localStorage fallback:', err);
    fallbackSave(FALLBACK_KEYS.MSGS, messages);
  }
}

export async function loadMessagesFromStorage(): Promise<ChatMessage[]> {
  if (!isIndexedDBAvailable()) {
    return fallbackLoad<ChatMessage[]>(FALLBACK_KEYS.MSGS, []);
  }

  try {
    const db = await openDB();
    const msgs = await new Promise<ChatMessage[]>((resolve, reject) => {
      const tx = db.transaction(STORES.MESSAGES, 'readonly');
      const store = tx.objectStore(STORES.MESSAGES);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    if (msgs.length === 0) {
      const fallbackMsgs = fallbackLoad<ChatMessage[]>(FALLBACK_KEYS.MSGS, []);
      if (fallbackMsgs.length > 0) {
        void saveMessagesToStorage(fallbackMsgs);
        return fallbackMsgs.sort((a, b) => a.createdAt - b.createdAt);
      }
    }

    return msgs.sort((a, b) => a.createdAt - b.createdAt);
  } catch (err) {
    console.warn('IndexedDB read for messages failed, using localStorage fallback:', err);
    return fallbackLoad<ChatMessage[]>(FALLBACK_KEYS.MSGS, []);
  }
}

export async function clearStorageMessages(): Promise<void> {
  fallbackRemove(FALLBACK_KEYS.MSGS);

  if (!isIndexedDBAvailable()) return;

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.MESSAGES, 'readwrite');
      const store = tx.objectStore(STORES.MESSAGES);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB clear for messages failed:', err);
  }
}

export async function clearEntireWorkspace(): Promise<void> {
  await Promise.all([clearStorageDocuments(), clearStorageMessages()]);
}
