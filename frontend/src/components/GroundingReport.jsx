const LABELS = {
  grounded: 'Taught in the material',
  weak: 'Check this one',
  ungrounded: 'Not supported by the material',
};

export function GroundingStamp({ grounding }) {
  if (!grounding) return null;
  if (grounding.stale) return <span className="stamp stale">Edited, re-check needed</span>;
  return <span className={`stamp ${grounding.status}`}>{LABELS[grounding.status]}</span>;
}

// The reasons behind the stamp, so the reviewer is not asked to trust a label.
export default function GroundingReport({ grounding }) {
  if (!grounding || grounding.stale) return null;
  return (
    <ul className="checks">
      {grounding.checks.map((c) => (
        <li key={c.name} className={c.pass ? 'pass' : 'fail'}>
          <span className="mark" aria-hidden="true">{c.pass ? '✓' : '✗'}</span>
          <span>{c.detail}</span>
        </li>
      ))}
    </ul>
  );
}
