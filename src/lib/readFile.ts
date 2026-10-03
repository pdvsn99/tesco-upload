import { unzipSync, strFromU8 } from 'fflate'
import { parseExport, type Shop } from './parse'

// Accepts either the transactions .json file or the whole .zip Tesco sends,
// and returns the parsed shops plus the JSON text (so it can be remembered).
export async function readExportFile(file: File): Promise<{ shops: Shop[]; json: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b // every zip starts with "PK"
  if (!isZip) return readJson(new TextDecoder().decode(bytes))

  const candidates = jsonFilesIn(bytes)
  if (!candidates.length) throw new Error("That zip doesn't contain any .json files. Is it the download from Tesco?")
  // The transactions file is usually named "...transactions.json", so try that first.
  candidates.sort((a, b) => Number(/transaction/i.test(b.name)) - Number(/transaction/i.test(a.name)))
  for (const c of candidates) {
    try {
      return readJson(c.text)
    } catch {
      // not the shopping history; try the next file
    }
  }
  throw new Error("We opened the zip but couldn't find your shopping history in it.")
}

function jsonFilesIn(zip: Uint8Array, depth = 0): { name: string; text: string }[] {
  let entries: Record<string, Uint8Array>
  try {
    entries = unzipSync(zip)
  } catch {
    throw new Error("We couldn't open that zip file. If it's password protected, unzip it first and upload the .json file inside.")
  }
  return Object.entries(entries).flatMap(([name, data]) => {
    if (/\.json$/i.test(name)) return [{ name, text: strFromU8(data) }]
    if (/\.zip$/i.test(name) && depth < 2) return jsonFilesIn(data, depth + 1) // zips inside zips
    return []
  })
}

function readJson(text: string): { shops: Shop[]; json: string } {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("That file isn't valid JSON. Upload the .json or .zip file from your Tesco data download.")
  }
  return { shops: parseExport(data), json: text }
}
