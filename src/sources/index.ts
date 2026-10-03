// Every supermarket the site knows about. To add one:
//  1. create src/sources/<name>/index.tsx exporting a Source (see types.ts)
//  2. give it a `read` function that converts their data file into shops
//  3. swap its entry below from comingSoon() to the real thing
import { tesco } from './tesco'
import type { Source } from './types'

const comingSoon = (id: string, name: string, brand: string, brand2: string, savingsLabel = 'Offers'): Source => ({
  id,
  name,
  savingsLabel,
  colors: { brand, brand2 },
})

export const SOURCES: Source[] = [
  tesco,
  comingSoon('sainsburys', "Sainsbury's", '#f06c00', '#7f0442', 'Nectar Prices'),
  comingSoon('asda', 'Asda', '#78be20', '#00543c', 'Asda Rewards'),
  comingSoon('morrisons', 'Morrisons', '#00563f', '#ffd400', 'More Card offers'),
  comingSoon('lidl', 'Lidl', '#0050aa', '#e60a14', 'Lidl Plus'),
  comingSoon('aldi', 'Aldi', '#00005f', '#f28b00'),
  comingSoon('coop', 'Co-op', '#00b1e7', '#0d2240', 'Member prices'),
]

export const readySources = SOURCES.filter((s) => s.read)
export const comingSoonSources = SOURCES.filter((s) => !s.read)

export type { Source, UploadedFile } from './types'
