import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlay, FiSend, FiChevronLeft } from 'react-icons/fi';
import { fetchQuestions, submitCode, runCode } from '../services/api';
import './CourseCodeLab.css';

// Map LMS course names → CodeLab default language
const COURSE_LANG_MAP = {
  'html & css':  'html',
  'python':      'python',
  'java':        'java',
  'sql':         'javascript',   // closest Monaco lang
  'react':       'javascript',
  'spring boot': 'java',
};

const STARTERS = {
  python:     '# Write your Python solution here\n',
  java:       'public class Main {\n    public static void main(String[] args) {\n        // Write Java solution here\n    }\n}\n',
  javascript: '// Write your JavaScript solution here\n',
  html:       '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <title>Solution</title>\n</head>\n<body>\n  <!-- Write your HTML here -->\n</body>\n</html>\n',
  cpp:        '#include <iostream>\nusing namespace std;\nint main() {\n    return 0;\n}\n',
  c:          '#include <stdio.h>\nint main() {\n    return 0;\n}\n',
  typescript: '// Write your TypeScript solution here\n',
  go:         'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello!")\n}\n',
};

const DIFFICULTY = { 0: { label: 'Easy', color: '#10b981' }, 1: { label: 'Medium', color: '#f59e0b' }, 2: { label: 'Hard', color: '#ef4444' } };
const getDiff = (id) => DIFFICULTY[id % 3];

const LANGUAGES = [
  { value: 'python',     label: 'Python 3',  monacoLang: 'python' },
  { value: 'java',       label: 'Java 17',   monacoLang: 'java' },
  { value: 'javascript', label: 'JavaScript',monacoLang: 'javascript' },
  { value: 'html',       label: 'HTML',      monacoLang: 'html' },
  { value: 'cpp',        label: 'C++',       monacoLang: 'cpp' },
  { value: 'c',          label: 'C',         monacoLang: 'c' },
  { value: 'typescript', label: 'TypeScript',monacoLang: 'typescript' },
  { value: 'go',         label: 'Go',        monacoLang: 'go' },
];
const getLang = (val) => LANGUAGES.find(l => l.value === val) || LANGUAGES[0];

// ── Sub-component: inline code editor for one challenge ──────────────────────
const InlineEditor = ({ question, defaultLang, onBack }) => {
  const [language, setLanguage]       = useState(defaultLang);
  const [code, setCode]               = useState(STARTERS[defaultLang] || '// code here\n');
  const [userOutput, setUserOutput]   = useState(null);
  const [result, setResult]           = useState(null);
  const [isRunning, setIsRunning]     = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLangChange = (val) => {
    setLanguage(val);
    setCode(STARTERS[val] || '// code here\n');
    setResult(null);
    setUserOutput(null);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setUserOutput(null);
    try {
      const res = await runCode(question.id, language, code);
      if (res.results) {
        setUserOutput({ results: res.results });
      } else {
        const out = res.output ?? res.stdout ?? res.result ?? JSON.stringify(res);
        setUserOutput({ output: out, error: res.error || null });
      }
    } catch {
      setUserOutput({ output: '', error: 'Failed to connect to execution server.' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setResult(null);
    try {
      const res = await submitCode(question.id, language, code);
      setResult(res);
      if (res.output || res.stdout) {
        setUserOutput({ output: res.output ?? res.stdout, error: res.error || null });
      }
    } catch {
      setResult({ status: 'ERROR', error: 'Failed to connect to execution server.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ccl-editor-view">
      {/* Header */}
      <div className="ccl-editor-header">
        <button className="ccl-back-btn" onClick={onBack}>
          <FiChevronLeft /> All Challenges
        </button>
        <h3 className="ccl-problem-title">{question.title}</h3>
        <span className="ccl-diff-badge" style={{ background: `${getDiff(question.id).color}18`, color: getDiff(question.id).color }}>
          {getDiff(question.id).label}
        </span>
      </div>

      <div className="ccl-editor-body">
        {/* Problem description panel */}
        <div className="ccl-desc-panel">
          <h4>Description</h4>
          <p>{question.description}</p>

          {question.constraints && (
            <><h4>Constraints</h4><pre className="ccl-code">{question.constraints}</pre></>
          )}

          <h4 className="ccl-examples-header">Examples</h4>
          {question.testCases && question.testCases.length > 0 ? (
            question.testCases.slice(0, 3).map((tc, i) => (
              <div key={tc.id || i} className="ccl-example-block">
                <div className="ccl-example-title">Example {i + 1}</div>
                <div className="ccl-example-label">Input</div>
                <pre className="ccl-example-value">{(tc.inputData || '').replace(/\\n/g, '\n')}</pre>
                <div className="ccl-example-label">Output</div>
                <pre className="ccl-example-value">{(tc.expectedOutput || '').replace(/\\n/g, '\n')}</pre>
              </div>
            ))
          ) : (
            // Fallback to sample input if testcases aren't loaded properly
            <div className="ccl-example-block">
              <div className="ccl-example-title">Example 1</div>
              <div className="ccl-example-label">Input</div>
              <pre className="ccl-example-value">{question.sampleInput?.replace(/\\n/g, '\n')}</pre>
              <div className="ccl-example-label">Output</div>
              <pre className="ccl-example-value">{question.sampleOutput?.replace(/\\n/g, '\n')}</pre>
            </div>
          )}

          {/* Test Case Execution Results for RUN */}
          {userOutput !== null && (
            <div className="ccl-test-result-block">
              <h4 style={{ margin: '0 0 1rem' }}>Run Results</h4>
              {userOutput.error ? (
                 <pre className="ccl-code ccl-output-error">{userOutput.error}</pre>
              ) : userOutput.results ? (
                 userOutput.results.map((res, idx) => (
                   <div key={idx} className={`ccl-run-result-item ${res.passed ? 'ccl-run-passed' : 'ccl-run-failed'}`}>
                     <div style={{ fontWeight: '800', marginBottom: '0.5rem', color: res.passed ? '#10b981' : '#ef4444' }}>
                        {res.passed ? '✅ Example ' + (idx+1) + ' Passed' : '❌ Example ' + (idx+1) + ' Failed'}
                     </div>
                     <div className="ccl-example-label" style={{marginTop: 0}}>Actual Output</div>
                     <pre className="ccl-example-value" style={{marginBottom: '0.5rem'}}>{(res.actualOutput || '(no output)').replace(/\\n/g, '\n')}</pre>
                     {!res.passed && (
                       <>
                         <div className="ccl-example-label">Expected Output</div>
                         <pre className="ccl-example-value">{(res.expectedOutput || '').replace(/\\n/g, '\n')}</pre>
                       </>
                     )}
                     {res.error && (
                         <>
                           <div className="ccl-example-label">Error</div>
                           <pre className="ccl-code ccl-output-error" style={{marginTop: '0.2rem'}}>{res.error}</pre>
                         </>
                     )}
                   </div>
                 ))
              ) : (
                 <pre className="ccl-code ccl-output-ok">{userOutput.output?.trim() || '(no output)'}</pre>
              )}
            </div>
          )}

          {/* Final Submit result */}
          {result && (
            <div className={`ccl-result ${result.status === 'PASSED' ? 'ccl-passed' : 'ccl-failed'}`}>
              <strong>{result.status === 'PASSED' ? '✅ All test cases passed!' : '❌ Submission failed'}</strong>
              {result.status !== 'ERROR' && (
                <p>Passed <b>{result.testCasesPassed}</b> / <b>{result.totalTestCases}</b> test cases.</p>
              )}
              {result.status === 'ERROR' && <p className="ccl-error-msg">{result.error}</p>}
            </div>
          )}
        </div>

        {/* Editor panel */}
        <div className="ccl-editor-panel">
          <div className="ccl-controls">
            <select className="ccl-lang-select" value={language} onChange={e => handleLangChange(e.target.value)}>
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <button className="ccl-btn-run" onClick={handleRun} disabled={isRunning || isSubmitting}>
              <FiPlay /> {isRunning ? 'Running…' : 'Run'}
            </button>
            <button className="ccl-btn-submit" onClick={handleSubmit} disabled={isSubmitting || isRunning}>
              <FiSend /> {isSubmitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
          <div className="ccl-monaco-wrap">
            <Editor
              height="100%"
              language={getLang(language).monacoLang}
              theme="vs-dark"
              value={code}
              onChange={v => setCode(v || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 },
                fontFamily: "'Fira Code', monospace",
                smoothScrolling: true,
                cursorSmoothCaretAnimation: 'on',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const CourseCodeLab = ({ courseName }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);   // chosen question

  const defaultLang = COURSE_LANG_MAP[courseName?.toLowerCase()] || 'python';

  useEffect(() => {
    fetchQuestions()
      .then(data => setQuestions(data))
      .catch(() => setError('Could not load challenges. Make sure the CodeLab backend is running.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = questions.filter(q =>
    (q.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (q.description || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="ccl-loading">Loading challenges…</div>;

  if (selected) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="editor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <InlineEditor question={selected} defaultLang={defaultLang} onBack={() => setSelected(null)} />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="ccl-root">
      <div className="ccl-header-row">
        <div className="ccl-title-section">
          <h3 className="ccl-title">💻 CodeLab Challenges</h3>
          <p className="ccl-subtitle">Practice coding while you learn — default language: <strong>{getLang(defaultLang).label}</strong></p>
        </div>
        <div className="ccl-search-container">
          <input
            className="ccl-search"
            type="text"
            placeholder="Search challenges…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="ccl-error-banner">⚠️ {error}</div>}

      {!error && filtered.length === 0 && (
        <div className="ccl-empty">No challenges found. Make sure the CodeLab backend is running on port 8080.</div>
      )}

      <div className="ccl-grid">
        {filtered.map((q, idx) => {
          const diff = getDiff(q.id);
          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.05 }}
              className="ccl-card"
              onClick={() => setSelected(q)}
            >
              <div className="ccl-card-top">
                <span className="ccl-badge" style={{ background: `${diff.color}18`, color: diff.color }}>{diff.label}</span>
                <span className="ccl-num">#{idx + 1}</span>
              </div>
              <h4 className="ccl-card-title">{q.title}</h4>
              <p className="ccl-card-desc">{q.description.substring(0, 90)}…</p>
              <div className="ccl-card-footer">
                <span className="ccl-lang-hint">{getLang(defaultLang).label}</span>
                <button className="ccl-solve-btn">Solve →</button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseCodeLab;
