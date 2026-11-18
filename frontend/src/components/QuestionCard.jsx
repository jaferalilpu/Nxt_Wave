import GroundingReport, { GroundingStamp } from './GroundingReport.jsx';

const TYPE_LABELS = { mcq: 'Theory MCQ', true_false: 'True or false', code_analysis: 'Code analysis' };
const LETTERS = ['A', 'B', 'C', 'D'];

export default function QuestionCard({
  q, index, selected, review, busy, message,
  onSelect, onChange, onRecheck, onApprove, onReject, onReplace,
}) {
  const setOption = (i, patch) =>
    onChange({ options: q.options.map((o, j) => (j === i ? { ...o, ...patch } : o)) });
  const setCorrect = (i) =>
    onChange({ options: q.options.map((o, j) => ({ ...o, correct: j === i })) });

  const reviewLabel = { pending: 'Waiting for review', approved: 'Approved', rejected: 'Rejected' }[review];

  return (
    <article className={`card ${selected ? 'open' : ''} ${review}`}>
      <button className="card-head" onClick={onSelect} aria-expanded={selected}>
        <span className="card-meta">
          <span className="qnum">Question {index + 1}</span>
          <span className="qtype">{TYPE_LABELS[q.type]}</span>
        </span>
        <span className="card-title">{q.text}</span>
        <span className="card-status">
          <GroundingStamp grounding={q.grounding} />
          <span className={`review-tag ${review}`}>{reviewLabel}</span>
        </span>
      </button>

      {selected && (
        <div className="card-body">
          <label className="field">
            <span>Question</span>
            <textarea rows={3} value={q.text} onChange={(e) => onChange({ text: e.target.value })} />
          </label>

          {q.type === 'code_analysis' && (
            <label className="field">
              <span>Code from the material</span>
              <textarea className="code" rows={Math.min(10, q.code.split('\n').length + 1)} value={q.code} onChange={(e) => onChange({ code: e.target.value })} spellCheck={false} />
            </label>
          )}

          {q.type === 'true_false' ? (
            <fieldset className="field">
              <legend>Correct answer</legend>
              <div className="choice-row">
                {[true, false].map((v) => (
                  <label key={String(v)} className="choice">
                    <input type="radio" name={`${q.id}-answer`} checked={q.answer === v} onChange={() => onChange({ answer: v })} />
                    {v ? 'True' : 'False'}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <fieldset className="field">
              <legend>Options (select the correct one)</legend>
              {q.options.map((o, i) => (
                <div className="option" key={i}>
                  <input type="radio" name={`${q.id}-correct`} checked={o.correct} onChange={() => setCorrect(i)} aria-label={`Option ${LETTERS[i]} is correct`} />
                  <span className="letter">{LETTERS[i]}</span>
                  <input type="text" value={o.text} onChange={(e) => setOption(i, { text: e.target.value })} aria-label={`Option ${LETTERS[i]} text`} />
                </div>
              ))}
            </fieldset>
          )}

          <label className="field">
            <span>Explanation shown after answering</span>
            <textarea rows={2} value={q.explanation} onChange={(e) => onChange({ explanation: e.target.value })} />
          </label>

          <label className="field">
            <span>Source line from the material</span>
            <textarea rows={2} value={q.evidence} onChange={(e) => onChange({ evidence: e.target.value })} />
            <small>Must be copied from the material. The highlighted text on the left is what this question is checked against.</small>
          </label>

          <GroundingReport grounding={q.grounding} />
          {message && <p className="note warn" role="status">{message}</p>}

          <div className="actions">
            <button className="btn primary" disabled={busy} onClick={onApprove}>Approve</button>
            <button className="btn" disabled={busy} onClick={onRecheck}>Re-check against material</button>
            <button className="btn" disabled={busy} onClick={onReject}>Reject</button>
            <button className="btn quiet" disabled={busy} onClick={onReplace}>Write a different one</button>
          </div>
        </div>
      )}
    </article>
  );
}
