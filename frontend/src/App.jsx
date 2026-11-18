import { useEffect, useState } from 'react';
import { api } from './api.js';
import MaterialPane from './components/MaterialPane.jsx';
import QuestionCard from './components/QuestionCard.jsx';
import ExportPanel from './components/ExportPanel.jsx';
import sampleMaterial from '../../sample/sample-material.md?raw';

export default function App() {
  const [material, setMaterial] = useState('');
  const [questions, setQuestions] = useState(null);
  const [reviews, setReviews] = useState({}); // id -> pending | approved | rejected
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [cardMessages, setCardMessages] = useState({});
  const [exported, setExported] = useState('');
  const [exportError, setExportError] = useState(null);
  const [attempts, setAttempts] = useState({});
  const [server, setServer] = useState(null);

  useEffect(() => {
    api.health().then(setServer).catch(() => setServer({ offline: true }));
  }, []);

  const generated = questions !== null;
  const selected = questions?.find((q) => q.id === selectedId) || null;
  const approvedCount = questions ? questions.filter((q) => reviews[q.id] === 'approved').length : 0;

  const setMessage = (id, text) => setCardMessages((m) => ({ ...m, [id]: text }));
  const setReview = (id, value) => setReviews((r) => ({ ...r, [id]: value }));

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const result = await api.generate(material);
      setQuestions(result.questions);
      setReviews(Object.fromEntries(result.questions.map((q) => [q.id, 'pending'])));
      setSelectedId(result.questions[0].id);
      setCardMessages({});
      setExported('');
      setAttempts({});
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  function startOver() {
    setQuestions(null);
    setSelectedId(null);
    setExported('');
    setExportError(null);
    setError(null);
  }

  // Any edit sends the question back to "pending" and marks its checks as out of date.
  function editQuestion(id, patch) {
    setQuestions((qs) =>
      qs.map((q) => (q.id === id ? { ...q, ...patch, grounding: { ...q.grounding, stale: true } } : q)),
    );
    setReview(id, 'pending');
    setExported('');
  }

  async function recheck(id) {
    const q = questions.find((x) => x.id === id);
    const { problems, grounding } = await api.verify(material, q);
    setQuestions((qs) => qs.map((x) => (x.id === id ? { ...x, grounding } : x)));
    return { problems, grounding };
  }

  async function runSafely(id, fn) {
    setBusy(true);
    setMessage(id, '');
    try {
      await fn();
    } catch (err) {
      setMessage(id, err.message);
    } finally {
      setBusy(false);
    }
  }

  const approve = (id) =>
    runSafely(id, async () => {
      const { problems, grounding } = await recheck(id);
      if (problems.length) return setMessage(id, `Fix this first: ${problems.join(' ')}`);
      if (grounding.status === 'ungrounded') {
        return setMessage(id, 'This question tests something the material does not teach. Fix the source line or reword it, then re-check.');
      }
      setReview(id, 'approved');
      setExported('');
    });

  const reject = (id) => {
    setReview(id, 'rejected');
    setExported('');
    setMessage(id, 'Rejected. Use "Write a different one" to replace it.');
  };

  const replace = (id) =>
    runSafely(id, async () => {
      const q = questions.find((x) => x.id === id);
      const attempt = (attempts[id] || 0) + 1;
      setAttempts((a) => ({ ...a, [id]: attempt }));
      const others = questions.filter((x) => x.id !== id).map((x) => x.text);
      const { question } = await api.regenerate(material, q.type, others, attempt);
      setQuestions((qs) => qs.map((x) => (x.id === id ? { ...question, id } : x)));
      setReview(id, 'pending');
      setExported('');
    });

  async function exportGroup() {
    setExportError(null);
    try {
      const { text } = await api.exportGroup(material, questions);
      setExported(text);
    } catch (err) {
      setExportError(err);
    }
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>Proofdesk</h1>
          <p className="tagline">Turn reading material into a five-question group, then check every question against the text before it goes out.</p>
        </div>
        {server && (
          <p className={`mode ${server.offline ? 'offline' : server.mode}`}>
            {server.offline ? 'Backend offline' : server.mode === 'demo' ? 'Demo mode: rule-based questions' : `Model: ${server.model}`}
          </p>
        )}
      </header>

      {error && (
        <div className="note warn banner" role="alert">
          <p>{error.message}</p>
          {error.details?.length > 0 && <ul>{error.details.map((d) => <li key={d}>{d}</li>)}</ul>}
        </div>
      )}

      <main className="workspace">
        <MaterialPane
          material={material}
          onChange={setMaterial}
          locked={generated}
          selected={selected}
          busy={busy}
          onLoadSample={() => setMaterial(sampleMaterial)}
          onGenerate={generate}
          onStartOver={startOver}
        />

        <section className="pane questions" aria-label="Questions">
          <header className="pane-head"><h2>Questions</h2></header>

          {!generated ? (
            <div className="empty">
              <p>Paste material on the left and write the group. You will get two theory questions, two true or false questions and one code question.</p>
              <p>Each question comes with the exact line of the material it relies on. If a question cannot be traced back to the text, it cannot be exported.</p>
            </div>
          ) : (
            <>
              {questions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  q={q}
                  index={i}
                  selected={q.id === selectedId}
                  review={reviews[q.id]}
                  busy={busy}
                  message={cardMessages[q.id]}
                  onSelect={() => setSelectedId(q.id === selectedId ? null : q.id)}
                  onChange={(patch) => editQuestion(q.id, patch)}
                  onRecheck={() => runSafely(q.id, () => recheck(q.id))}
                  onApprove={() => approve(q.id)}
                  onReject={() => reject(q.id)}
                  onReplace={() => replace(q.id)}
                />
              ))}
              <ExportPanel approved={approvedCount} total={questions.length} onExport={exportGroup} exported={exported} error={exportError} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
