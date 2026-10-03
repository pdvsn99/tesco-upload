import { useEffect, useRef, type CSSProperties } from 'react'
import { comingSoonSources, readySources } from '../sources'

// The "How does it work?" pop-up: the steps, which supermarkets work, and how
// to get your data from each one.
export function HowItWorks({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      className="modal"
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()} // click the backdrop to close
    >
      <div className="modal-body">
        <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        <h2 className="modal-title">How does it work?</h2>

        <ol className="steps">
          <li><span><strong>Ask your supermarket for your data.</strong> It's free, and it's your right to have it.</span></li>
          <li><span><strong>Upload what they send you here.</strong> The .zip is fine, no need to open it.</span></li>
          <li><span><strong>Tap through your story.</strong> Your data never leaves your device.</span></li>
        </ol>

        <h3 className="modal-subtitle">Supermarkets that work</h3>
        {readySources.map((s) => (
          <details key={s.id} className="shop-howto" style={{ '--chip': s.colors.brand } as CSSProperties} open={readySources.length === 1}>
            <summary>
              <span className="shop-dot" aria-hidden />
              {s.name}
            </summary>
            {s.howTo && (
              <>
                <ol>{s.howTo.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>
                {s.howTo.notes?.map((note, i) => <p key={i} className="howto-note">{note}</p>)}
              </>
            )}
          </details>
        ))}

        <h3 className="modal-subtitle">Coming soon</h3>
        <p className="coming-soon">{comingSoonSources.map((s) => s.name).join(' · ')}</p>
      </div>
    </dialog>
  )
}
