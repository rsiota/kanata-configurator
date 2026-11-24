import { useMemo, useState } from 'react'
import type { ProjectConfig } from '../lib/types'
import { exportKanataConfig } from '../lib/kanataExport'

interface ExportPanelProps {
  config: ProjectConfig
}

export function ExportPanel({ config }: ExportPanelProps) {
  const source = useMemo(() => exportKanataConfig(config), [config])
  const [copied, setCopied] = useState(false)

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

  return (
    <aside className="panel export-panel">
      <header className="export-panel__header">
        <h2>kanata.kbd</h2>
        <div className="export-panel__actions">
          <button type="button" className="btn btn--ghost" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" className="btn btn--accent" onClick={download}>
            Download
          </button>
        </div>
      </header>
      <pre className="export-panel__code">
        <code>{source}</code>
      </pre>
    </aside>
  )
}
