import { unzipSync, strFromU8 } from 'fflate'
import { readySources, type Source, type UploadedFile } from '../sources'
import type { Shop } from './types'

export interface LoadedData {
  source: Source
  shops: Shop[]
  file: UploadedFile // kept so it can be remembered in the browser
}

const NOT_RECOGNISED = `We didn't recognise that file. Right now we can read data downloads from ${readySources
  .map((s) => s.name)
  .join(', ')}. More supermarkets are coming soon.`

// Accepts a data file, or a .zip containing one, and works out which supermarket it's from.
export async function readUpload(upload: File): Promise<LoadedData> {
  const bytes = new Uint8Array(await upload.arrayBuffer())
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b // every zip starts with "PK"
  const files = isZip ? filesIn(bytes) : [{ name: upload.name, text: new TextDecoder().decode(bytes) }]
  if (!files.length) throw new Error("That zip doesn't contain any data files we can read.")
  return identify(files)
}

/** Tries every supermarket's converter on every file until one recognises it. */
export function identify(files: UploadedFile[]): LoadedData {
  // Likely names first ("...transactions.json"), so the right file wins quickly.
  const ordered = [...files].sort((a, b) => Number(/transaction|purchase|receipt/i.test(b.name)) - Number(/transaction|purchase|receipt/i.test(a.name)))
  for (const file of ordered)
    for (const source of readySources) {
      const shops = source.read!(file)
      if (shops) return { source, shops, file }
    }
  throw new Error(NOT_RECOGNISED)
}

function filesIn(zip: Uint8Array, depth = 0): UploadedFile[] {
  let entries: Record<string, Uint8Array>
  try {
    entries = unzipSync(zip)
  } catch {
    throw new Error("We couldn't open that zip file. If it's password protected, unzip it first and upload the file inside.")
  }
  return Object.entries(entries).flatMap(([name, data]) => {
    if (/\.(json|csv|txt)$/i.test(name)) return [{ name, text: strFromU8(data) }]
    if (/\.zip$/i.test(name) && depth < 2) return filesIn(data, depth + 1) // zips inside zips
    return []
  })
}
