// Keeps the uploaded export in this browser (IndexedDB) so returning visitors
// don't have to upload again. Nothing is sent anywhere. Every call fails
// quietly: private browsing or blocked storage just means "not remembered".
const DB = 'tesco-wrapped'
const STORE = 'files'
const KEY = 'export'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  try {
    const db = await open()
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return undefined
  }
}

export const saveExport = (json: string) => run('readwrite', (s) => s.put(json, KEY))
export const loadExport = () => run<string>('readonly', (s) => s.get(KEY))
export const forgetExport = () => run('readwrite', (s) => s.delete(KEY))
