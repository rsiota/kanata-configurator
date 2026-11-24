import { useMemo, useRef, useState } from 'react'
import type { ProjectConfig } from '../lib/types'
import { exportKanataConfig } from '../lib/kanataExport'
import { importKanataConfig } from '../lib/kanataImport'

interface ExportPanelProps {
  config: ProjectConfig
  onImport: (config: ProjectConfig, warnings: string[]) => void
}

export function ExportPanel({ config, onImport }: ExportPanelProps) {
  const source = useMemo(() => exportKanataConfig(config), [config])
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function copy() {
    await navigator.clipboard.writeText(source)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  function download() {
    const blob = new Blob([source], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'kanata.kbd'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleFile(file: File) {
    setError(null)
    try {
      const text = await file.text()
      const name = file.name.replace(/\.kbd$/i, '')
      const { config: next, warnings } = importKanataConfig(text, { name })
      onImport(next, warnings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import .kbd')
    }
  }

  return (
    <aside className="panel export-panel">
      <header className="export-panel__header">
        <h2>kanata.kbd</h2>
        <div className="export-panel__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => fileRef.current?.click()}
          >
            Import
          </button>
          <button type="button" className="btn btn--ghost" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" className="btn btn--accent" onClick={download}>
            Download
          </button>
        </div>
      </header>

      <input
        ref={fileRef}
        type="file"
        accept=".kbd,text/plain"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />

      {error && <p className="import-error">{error}</p>}

      <pre className="export-panel__code">
        <code>{source}</code>
      </pre>
    </aside>
  )
}
