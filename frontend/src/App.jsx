import React, { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCcw, Send, Shield, Plus, Trash2 } from "lucide-react";

const API = "http://localhost:4000";

function diffHighlight(target, typed) {
  const maxLen = Math.max(target.length, typed.length);
  const out = [];
  for (let i = 0; i < maxLen; i++) {
    const t = target[i];
    const c = typed[i];
    if (c === undefined) break;
    out.push({ ch: c, ok: c === t });
  }
  return out;
}

export default function App() {
  const [sentence, setSentence] = useState(null);
  const [typed, setTyped] = useState("");
  const [running, setRunning] = useState(false);
  const [startAt, setStartAt] = useState(null);
  const [time, setTime] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [adminOpen, setAdminOpen] = useState(false);
  const [adminList, setAdminList] = useState([]);
  const [newSentence, setNewSentence] = useState("");

  const inputRef = useRef(null);

  const highlighted = useMemo(() => {
    if (!sentence) return [];
    return diffHighlight(sentence.text, typed);
  }, [sentence, typed]);

  async function fetchRandom() {
    setLoading(true);
    setResult(null);
    setTyped("");
    setRunning(false);
    setStartAt(null);
    setTime(0);

    const res = await fetch(`${API}/api/sentences/random`);
    if (!res.ok) {
      setSentence({ text: "No sentences found. Add one in Admin panel." });
      setLoading(false);
      return;
    }
    const data = await res.json();
    setSentence(data);
    setLoading(false);

    setTimeout(() => inputRef.current?.focus(), 50);
  }

  useEffect(() => {
    fetchRandom();
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTime(() => {
        const now = performance.now();
        return startAt ? (now - startAt) / 1000 : 0;
      });
    }, 100);
    return () => clearInterval(id);
  }, [running, startAt]);

  function onType(e) {
    const val = e.target.value;
    if (!running && val.length > 0) {
      setRunning(true);
      setStartAt(performance.now());
    }
    setTyped(val);
  }

  async function onSubmit() {
    if (!sentence) return;
    const timeSeconds = running && startAt ? (performance.now() - startAt) / 1000 : 0.0001;

    const res = await fetch(`${API}/api/typing/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sentenceText: sentence.text,
        typedText: typed,
        timeSeconds
      })
    });

    const data = await res.json();
    setResult(data);
    setRunning(false);
  }

  function onReset() {
    setTyped("");
    setResult(null);
    setRunning(false);
    setStartAt(null);
    setTime(0);
    inputRef.current?.focus();
  }

  async function loadAdmin() {
    const res = await fetch(`${API}/api/sentences`);
    const data = await res.json();
    setAdminList(data);
  }

  async function addSentence() {
    const text = newSentence.trim();
    if (text.length < 5) return;

    const res = await fetch(`${API}/api/sentences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    if (res.ok) {
      setNewSentence("");
      await loadAdmin();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err?.error || "Failed to add sentence");
    }
  }

  async function deleteSentence(id) {
    const res = await fetch(`${API}/api/sentences/${id}`, { method: "DELETE" });
    if (res.ok) await loadAdmin();
  }

  useEffect(() => {
    if (adminOpen) loadAdmin();
  }, [adminOpen]);

  const doneDisabled = typed.trim().length === 0 || !sentence;

  return (
    <div className="page">
      <div className="bg-blur" />

      <header className="topbar">
        <div className="brand">
          <div className="logo">⌨️</div>
          <div>
            <div className="title">Speed Typing Test</div>
            <div className="subtitle">WPM • Accuracy • Errors</div>
          </div>
        </div>

        <button className="ghost" onClick={() => setAdminOpen((v) => !v)}>
          <Shield size={18} />
          Admin
        </button>
      </header>

      <main className="grid">
        <section className="card">
          <div className="cardHead">
            <h2>Test</h2>
            <div className="pill">{loading ? "Loading..." : `Time: ${time.toFixed(1)}s`}</div>
          </div>

          <div className="sentence">
            <div className="label">Type this sentence</div>
            <div className="sentenceBox">{sentence?.text || "—"}</div>
          </div>

          <div className="typing">
            <div className="label">Your input</div>
            <textarea
              ref={inputRef}
              className="input"
              value={typed}
              onChange={onType}
              placeholder="Start typing to begin..."
              rows={4}
            />
            <div className="liveRow">
              <div className="live">
                {highlighted.length === 0 ? (
                  <span className="muted">Live accuracy preview…</span>
                ) : (
                  highlighted.map((x, idx) => (
                    <span key={idx} className={x.ok ? "ok" : "bad"}>
                      {x.ch}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="actions">
            <button className="btn" onClick={fetchRandom} title="New sentence">
              <RefreshCcw size={18} />
              New
            </button>

            <button className="btn secondary" onClick={onReset} title="Reset current test">
              <RefreshCcw size={18} />
              Reset
            </button>

            <button className="btn primary" onClick={onSubmit} disabled={doneDisabled} title="Submit result">
              <Send size={18} />
              Submit
            </button>
          </div>
        </section>

        <section className="card">
          <div className="cardHead">
            <h2>Results</h2>
            <div className="pill">{result ? "Completed" : running ? "Running" : "Idle"}</div>
          </div>

          {!result ? (
            <div className="empty">
              <div className="big">📈</div>
              <div className="muted">
                Type the sentence and hit <b>Submit</b> to see WPM and accuracy.
              </div>
            </div>
          ) : (
            <div className="stats">
              <div className="stat">
                <div className="statLabel">WPM</div>
                <div className="statValue">{result.wpm}</div>
              </div>
              <div className="stat">
                <div className="statLabel">Accuracy</div>
                <div className="statValue">{result.accuracy}%</div>
              </div>
              <div className="stat">
                <div className="statLabel">Errors</div>
                <div className="statValue">{result.errors}</div>
              </div>
              <div className="stat wide">
                <div className="statLabel">Time</div>
                <div className="statValue">{result.timeSeconds}s</div>
              </div>

              <div className="note">Tip: Speed is nice, but try to keep accuracy above 95%.</div>
            </div>
          )}
        </section>

        {adminOpen && (
          <section className="card admin">
            <div className="cardHead">
              <h2>Admin: Sentences</h2>
              <div className="pill">{adminList.length} items</div>
            </div>

            <div className="adminAdd">
              <input
                className="adminInput"
                value={newSentence}
                onChange={(e) => setNewSentence(e.target.value)}
                placeholder="Add a new sentence (min 5 chars)..."
              />
              <button className="btn primary" onClick={addSentence}>
                <Plus size={18} />
                Add
              </button>
            </div>

            <div className="adminList">
              {adminList.map((s) => (
                <div className="adminItem" key={s.id}>
                  <div className="adminText">{s.text}</div>
                  <button className="iconBtn" onClick={() => deleteSentence(s.id)} title="Delete">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            <div className="note muted">Admin endpoints are open for simplicity. For production, add auth.</div>
          </section>
        )}
      </main>

      <footer className="footer">Built with React + Express + SQLite • Local dev</footer>
    </div>
  );
}
