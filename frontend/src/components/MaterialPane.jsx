import { useEffect, useMemo, useRef } from 'react';
import { buildSegments } from '../utils/evidence.js';

// Left side. Before generating it is a text box; afterwards it becomes the
// read-only source with the selected question's evidence highlighted.
export default function MaterialPane({ material, onChange, locked, selected, onLoadSample, onGenerate, busy, onStartOver }) {
  const markRef = useRef(null);

  const segments = useMemo(() => {
    if (!locked || !selected) return [{ text: material, marked: false }];
    return buildSegments(material, [selected.evidence, selected.type === 'code_analysis' ? selected.code : '']);
  }, [material, locked, selected]);

  // Bring the highlighted line into view whenever the reviewer picks a question.
  useEffect(() => {
    markRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [selected?.id, selected?.evidence]);

  const foundAny = segments.some((s) => s.marked);

  return (
    <section className="pane source" aria-label="Reading material">
      <header className="pane-head">
        <h2>Reading material</h2>
        {locked ? (
          <button className="btn quiet" onClick={onStartOver}>Use different material</button>
        ) : (
          <button className="btn quiet" onClick={onLoadSample}>Load sample</button>
        )}
      </header>

      {locked ? (
        <>
          <div className="source-text" tabIndex={0}>
            {segments.map((s, i) =>
              s.marked ? (
                <mark key={i} ref={i === segments.findIndex((x) => x.marked) ? markRef : null}>{s.text}</mark>
              ) : (
                <span key={i}>{s.text}</span>
              ),
            )}
          </div>
          {selected && !foundAny && (
            <p className="note warn">The selected question's source line could not be found in the material, so nothing is highlighted.</p>
          )}
        </>
      ) : (
        <>
          <label className="sr-only" htmlFor="material">Reading material in markdown</label>
          <textarea
            id="material"
            className="material-input"
            placeholder="Paste the reading material here (markdown). It needs at least one code block."
            value={material}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="actions">
            <button className="btn primary" onClick={onGenerate} disabled={busy || material.trim().length < 50}>
              {busy ? 'Writing questions…' : 'Write five questions'}
            </button>
            <span className="hint">{material.trim().length.toLocaleString()} characters</span>
          </div>
        </>
      )}
    </section>
  );
}
