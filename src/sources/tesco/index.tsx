import type { Source } from '../types'
import { parseExport } from './parse'

const DATA_PAGE = 'https://www.tesco.com/account/data-portability/en-GB/'

export const tesco: Source = {
  id: 'tesco',
  name: 'Tesco',
  savingsLabel: 'Clubcard prices and offers',
  colors: { brand: '#00539f', brand2: '#ee1c2e' },
  howTo: {
    steps: [
      <>
        Go to Tesco's <a href={DATA_PAGE} target="_blank" rel="noreferrer">data portability page</a>, or sign in at tesco.com and
        open <strong>My account → My details → Request your Tesco data</strong>.
      </>,
      <>Tap <strong>Start your request</strong>. Tesco texts a code to your phone to check it's you.</>,
      <>Wait for the email from Tesco saying your data is ready (usually a few hours, up to 48), then download it. You may need the code again.</>,
      <>Upload the download here. The .zip file is fine, no need to unzip it.</>,
    ],
    notes: [<>No online account? Register your Clubcard at tesco.com first, or call Tesco on 0800 917 6895.</>],
  },
  read: ({ text }) => {
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      return null
    }
    // Tesco's export is an object with "purchases" (in store) and/or "orders" (online).
    if (!data || typeof data !== 'object' || !('purchases' in data || 'orders' in data)) return null
    return parseExport(data)
  },
}
