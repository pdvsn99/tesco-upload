import { useRef, useState } from 'react'
import { delay } from '../lib/ui'
import { parseExport, type Shop } from '../lib/parse'

export function Upload({ onLoaded }: { onLoaded: (shops: Shop[]) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function read(file: File | undefined) {
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const text = await file.text()
      let json: unknown
      try {
        json = JSON.parse(text)
      } catch {
        throw new Error("That file isn't valid JSON. Upload the .json file from your Tesco data download.")
      }
      onLoaded(parseExport(json))
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
          <strong>{busy ? 'Reading your receipts…' : 'Choose your transactions file'}</strong>
          <span>or drag and drop the .json file here</span>
        </button>
        <input
          ref={input}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            read(e.target.files?.[0])
            e.target.value = ''
          }}
        />

        {error && <p className="error" role="alert">{error}</p>}

        <details className="howto rise" style={delay(320)}>
          <summary>Where do I get this file?</summary>
          <ol>
            <li>Sign in to your account on the Tesco website.</li>
            <li>Find the privacy section and request a copy of your data.</li>
            <li>When Tesco emails you the download, open it and find the transactions <code>.json</code> file.</li>
            <li>Upload that file here.</li>
          </ol>
        </details>

        <p className="privacy rise" style={delay(400)}>
          🔒 Your file never leaves your device. Everything is worked out in your browser.
        </p>
      </div>
      <footer className="disclaimer">A fan-made project. Not affiliated with or endorsed by Tesco.</footer>
    </main>
  )
}
