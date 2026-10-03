import { useRef, useState } from 'react'
import { delay } from '../lib/ui'
import type { Shop } from '../lib/parse'
import { readExportFile } from '../lib/readFile'
import { forgetExport, saveExport } from '../lib/storage'

const TESCO_DATA_PAGE = 'https://www.tesco.com/account/data-portability/en-GB/'

export function Upload({ onLoaded }: { onLoaded: (shops: Shop[], remembered: boolean) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [remember, setRemember] = useState(true)

  async function read(file: File | undefined) {
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const { shops, json } = await readExportFile(file)
      await (remember ? saveExport(json) : forgetExport())
      onLoaded(shops, remember)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong reading that file.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="screen screen-upload">
      <div className="upload-inner">
        <p className="eyebrow rise">Your year in baskets</p>
        <h1 className="logo rise" style={delay(80)}>
          Tesco<br />
          <span>Wrapped</span>
        </h1>
        <p className="lede rise" style={delay(160)}>
          Upload your Tesco shopping history and we'll turn it into a story about how you shop.
        </p>

        <button
          type="button"
          className={`dropzone rise ${dragging ? 'is-dragging' : ''}`}
          style={delay(240)}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            read(e.dataTransfer.files[0])
          }}
          disabled={busy}
        >
          <span className="dropzone-icon" aria-hidden>🛒</span>
          <strong>{busy ? 'Reading your receipts…' : 'Choose your Tesco data file'}</strong>
          <span>The .zip Tesco sends you, or the .json inside it</span>
        </button>
        <input
          ref={input}
          type="file"
          accept=".json,.zip,application/json,application/zip"
          hidden
          onChange={(e) => {
            read(e.target.files?.[0])
            e.target.value = ''
          }}
        />

        <label className="remember rise" style={delay(280)}>
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Remember my data on this device, so I don't have to upload it again
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <details className="howto rise" style={delay(320)}>
          <summary>How do I get my Tesco data?</summary>
          <p className="howto-note">It's free and takes a few minutes. Tesco usually emails you within a few hours (up to 48).</p>
          <ol>
            <li>
              Go to Tesco's <a href={TESCO_DATA_PAGE} target="_blank" rel="noreferrer">data portability page</a>, or sign in at
              tesco.com and open <strong>My account → My details → Request your Tesco data</strong>.
            </li>
            <li>Tap <strong>Start your request</strong>. Tesco texts a code to your phone to check it's you.</li>
            <li>Wait for the email from Tesco saying your data is ready, then download it. You may need the code again.</li>
            <li>Upload the download here. The .zip file is fine, no need to unzip it.</li>
          </ol>
          <p className="howto-note">
            Don't have an online account? Register your Clubcard at tesco.com first, or call Tesco on 0800 917 6895.
          </p>
        </details>

        <p className="privacy rise" style={delay(400)}>
          🔒 Your data never leaves your device. Everything is worked out in your browser.
        </p>
      </div>
      <footer className="disclaimer">A fan-made project. Not affiliated with or endorsed by Tesco.</footer>
    </main>
  )
}
