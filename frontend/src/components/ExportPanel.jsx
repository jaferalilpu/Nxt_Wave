import { useState } from 'react';

export default function ExportPanel({ approved, total, onExport, exported, error }) {
  const [copied, setCopied] = useState(false);
  const ready = approved === total && total > 0;

  const copy = async () => {
    await navigator.clipboard.writeText(exported);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([exported], { type: 'text/plain' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'question-group.txt' });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="export">
      <div className="export-bar">
        <p><strong>{approved} of {total}</strong> approved. {ready ? 'Ready to export.' : 'Approve every question to export.'}</p>
        <button className="btn primary" onClick={onExport} disabled={!ready}>Export tagged text</button>
      </div>

      {error && (
        <div className="note warn" role="alert">
          <p>{error.message}</p>
          {error.details?.length > 0 && <ul>{error.details.map((d) => <li key={d}>{d}</li>)}</ul>}
        </div>
      )}

      {exported && (
        <>
          <textarea className="export-text" readOnly value={exported} rows={12} aria-label="Tagged output" />
          <div className="actions">
            <button className="btn" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
            <button className="btn" onClick={download}>Download .txt</button>
          </div>
        </>
      )}
    </section>
  );
}
