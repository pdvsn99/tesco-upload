import { useRef, useState } from 'react'
import { delay } from '../lib/ui'
import { readUpload, type LoadedData } from '../lib/readFile'
import { forgetUpload, saveUpload } from '../lib/storage'
import { HowItWorks } from './HowItWorks'

export function Upload({ onLoaded }: { onLoaded: (data: LoadedData, remembered: boolean) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [remember, setRemember] = useState(true)
  const [showHow, setShowHow] = useState(false)

  async function read(file: File | undefined) {
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const data = await readUpload(file)
      await (remember ? saveUpload(data.file) : forgetUpload())
      onLoaded(data, remember)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong reading that file.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="screen screen-upload">
      <div className="upload-inner">
        <p className="eyebrow rise">Your supermarket year, unpacked</p>
        <h1 className="logo rise" style={delay(80)}>
          Aisle<br />
          <span>Be Back</span>
        </h1>
        <p className="lede rise" style={delay(160)}>
          Upload your supermarket shopping history and we'll turn it into a story about how you shop.
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
          <strong>{busy ? 'Reading your receipts…' : 'Choose your data file'}</strong>
          <span>The .zip your supermarket sends you, or the file inside it</span>
        </button>
        <input
          ref={input}
          type="file"
          accept=".json,.zip,.csv,application/json,application/zip,text/csv"
          hidden
          onChange={(e) => {
            read(e.target.files?.[0])
            e.target.value = ''
          }}
        />

        <label className="remember rise" style={delay(280)}>
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Remember my data on this device
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button type="button" className="howto-link rise" style={delay(320)} onClick={() => setShowHow(true)}>
          How does it work?
        </button>
        <HowItWorks open={showHow} onClose={() => setShowHow(false)} />

        <p className="privacy rise" style={delay(400)}>🔒 Your data never leaves your device.</p>
      </div>
      <footer className="disclaimer">A fan-made project. Not affiliated with or endorsed by any supermarket.</footer>
    </main>
  )
}
