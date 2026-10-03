// Keeps the uploaded data file in this browser (IndexedDB) so returning
// visitors don't have to upload again. Nothing is sent anywhere. Every call
// fails quietly: private browsing or blocked storage just means "not remembered".
import type { UploadedFile } from '../sources'

const DB = 'aisle-be-back'
const STORE = 'files'
const KEY = 'upload'

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

export const saveUpload = (file: UploadedFile) => run('readwrite', (s) => s.put(file, KEY))
export const loadUpload = () => run<UploadedFile>('readonly', (s) => s.get(KEY))
export const forgetUpload = () => run('readwrite', (s) => s.delete(KEY))
