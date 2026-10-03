import type { ReactNode } from 'react'
import type { Shop } from '../lib/types'

export interface UploadedFile {
  name: string
  text: string
}

// Everything the site needs to know about one supermarket.
export interface Source {
  id: string // also used in CSS: [data-shop="tesco"]
  name: string // "Tesco"
  savingsLabel: string // finishes "… saved you £X"
  colors: { brand: string; brand2: string } // accents mixed into the house style
  /** How to get the data, shown on the upload screen. */
  howTo?: { steps: ReactNode[]; notes?: ReactNode[] }
  /**
   * Converts an uploaded file into shops. Returns null if the file isn't this
   * supermarket's format, so the next supermarket can try. Throws (with a
   * friendly message) if it IS this format but something's wrong with it.
   * Leave undefined while we're still waiting for a sample file.
   */
  read?: (file: UploadedFile) => Shop[] | null
}
