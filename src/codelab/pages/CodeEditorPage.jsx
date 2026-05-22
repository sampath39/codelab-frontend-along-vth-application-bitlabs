import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiPlay, FiSend, FiClock, FiChevronLeft, FiChevronRight, FiList, FiSettings, FiMaximize2, FiTrash2 } from 'react-icons/fi';
import { fetchQuestions, fetchQuestionById, submitCode, runCode, fetchSubmissionsByQuestionId } from '../services/api';
import './CodeEditorPage.css';

const LANGUAGES = [
  { value: 'python',     label: 'Python 3',     monacoLang: 'python',     starter: '# Write your code here...\n' },
  { value: 'java',       label: 'Java 17',       monacoLang: 'java',       starter: 'public class Main {\n    public static void main(String[] args) {\n        // Write code here\n    }\n}\n' },
  { value: 'javascript', label: 'JavaScript',    monacoLang: 'javascript', starter: '// Write your code here...\n' },
  { value: 'cpp',        label: 'C++',           monacoLang: 'cpp',        starter: '#include <iostream>\nusing namespace std;\nint main() {\n    // Write code here\n    return 0;\n}\n' },
  { value: 'c',          label: 'C',             monacoLang: 'c',          starter: '#include <stdio.h>\nint main() {\n    // Write code here\n    return 0;\n}\n' },
  { value: 'html',       label: 'HTML',          monacoLang: 'html',       starter: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <title>My Page</title>\n</head>\n<body>\n  <!-- Write your HTML here -->\n</body>\n</html>\n' },
  { value: 'typescript', label: 'TypeScript',    monacoLang: 'typescript', starter: '// Write your TypeScript code here...\n' },
  { value: 'go',         label: 'Go',            monacoLang: 'go',         starter: 'package main\nimport "fmt"\nfunc main() {\n    // Write code here\n    fmt.Println("Hello!")\n}\n' },
];

const getLang = (val) => LANGUAGES.find(l => l.value === val) || LANGUAGES[0];

// ── Reliable manual date/time formatters (avoid toLocale* inconsistencies) ──
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const pad2 = (n) => String(n).padStart(2, '0');
const formatDate = (d) => `${pad2(d.getDate())} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
const formatTime = (d) => {
  let h = d.getHours();
  const m = pad2(d.getMinutes());
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${pad2(h)}:${m} ${ampm}`;
};

const CodeEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion]     = useState(null);
  const [language, setLanguage]     = useState('python');
  const [code, setCode]             = useState(getLang('python').starter);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning]   = useState(false);
  const [result, setResult]         = useState(null);
  const [userOutput, setUserOutput] = useState(null); // actual stdout
  const [activeTab, setActiveTab]   = useState('description'); // 'description' | 'submissions'
  const [submissions, setSubmissions] = useState([]);
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);
  const [allQuestions, setAllQuestions] = useState([]);
  const [consoleTab, setConsoleTab] = useState('testcase'); // 'testcase' | 'result'
  const [selectedTestCase, setSelectedTestCase] = useState(0);
  const [leftWidth, setLeftWidth] = useState(40); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [showWrongPopup, setShowWrongPopup] = useState(false);

  const startResizing = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    fetchQuestions()
      .then(data => {
        // Sort questions by ID so prev/next arrows go in correct order
        const sortedData = [...data].sort((a, b) => a.id - b.id);
        setAllQuestions(sortedData);
      })
      .catch(err => console.error('Failed to load question list:', err));
  }, []);

  useEffect(() => {
    if (id) {
      fetchQuestionById(parseInt(id))
        .then(data => {
          setQuestion(data);
          // If the question has admin-defined starter code, use it
          if (data.starterCode) {
            setCode(data.starterCode);
          }
        })
        .catch(() => toast.error('Failed to load challenge details.'));
    }
  }, [id]);

  const loadSubmissions = async () => {
    if (id) {
      try {
        const data = await fetchSubmissionsByQuestionId(parseInt(id));
        setSubmissions(data);
      } catch (err) {
        console.error('Failed to load submissions:', err);
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'submissions') {
      loadSubmissions();
    }
  }, [activeTab]);

  // When language changes, reset code to starter template
  const handleLanguageChange = (val) => {
    setLanguage(val);
    setCode(getLang(val).starter);
    setResult(null);
    setUserOutput(null);
  };

  // Run code — shows stdout against public test cases
  const handleRun = async () => {
    if (!question) return;
    setIsRunning(true);
    setUserOutput(null);
    const t = toast.loading('Running code...');
    setConsoleTab('result');
    try {
      const res = await runCode(question.id, language, code);
      if (res.results) {
        setUserOutput({ results: res.results });
        // Check if ALL public test cases failed
        const allFailed = res.results.every(r => !r.passed);
        if (allFailed) {
          setShowWrongPopup(true);
        }
      } else {
        // Fallback for direct output comparison
        const out = (res.output ?? res.stdout ?? res.result ?? '').trim();
        const expected = (question.testCases?.[0]?.expectedOutput ?? '').trim();
        const passed = out === expected;
        setUserOutput({ 
          output: out, 
          passed: passed,
          expected: expected,
          error: res.error || null 
        });
        if (!passed) {
          setShowWrongPopup(true);
        }
      }
      toast.dismiss(t);
    } catch (err) {
      setUserOutput({ output: '', error: 'Failed to connect to execution server.' });
      toast.error('Run failed.', { id: t });
    } finally {
      setIsRunning(false);
    }
  };

  // Submit — runs against all test cases
  const handleSubmit = async () => {
    if (!question) return;
    setIsSubmitting(true);
    setResult(null);
    const t = toast.loading('Running code against test cases...');
    setConsoleTab('result');
    try {
      const res = await submitCode(question.id, language, code);
      setResult(res);
      // also capture any output returned with the submission
      if (res.output || res.stdout) {
        setUserOutput({ output: res.output ?? res.stdout, error: res.error || null });
      }
      if (res.status === 'PASSED') {
        toast.success('All test cases passed! 🎉', { id: t });
        
        // Save completion status to localStorage
        try {
          const completedKey = 'codelab_completed_problems';
          const completed = JSON.parse(localStorage.getItem(completedKey) || '[]');
          if (!completed.includes(question.id)) {
            completed.push(question.id);
            localStorage.setItem(completedKey, JSON.stringify(completed));
          }
        } catch (e) {
          console.error('Failed to save completion status', e);
        }
      } else {
        toast.error('Some test cases failed. Keep trying!', { id: t });
      }
      loadSubmissions(); // Refresh history
    } catch (err) {
      setResult({ status: 'ERROR', error: 'Failed to connect to execution server.' });
      toast.error('Execution failed. Please try again.', { id: t });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrev = () => {
    const idx = allQuestions.findIndex(q => q.id === parseInt(id));
    if (idx > 0) {
      navigate(`/codelab/problem/${allQuestions[idx - 1].id}`);
    }
  };

  const handleNext = () => {
    const idx = allQuestions.findIndex(q => q.id === parseInt(id));
    if (idx < allQuestions.length - 1) {
      navigate(`/codelab/problem/${allQuestions[idx + 1].id}`);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your code? This will reset it to the initial template.')) {
      if (question && question.starterCode) {
        setCode(question.starterCode);
      } else {
        setCode(getLang(language).starter);
      }
      toast.success('Code reset to template');
    }
  };

  if (!question) return (
    <div className="codelab-loading-container">
      <div className="loading-spinner"></div>
      <p>Preparing your challenge...</p>
    </div>
  );

  const langMeta = getLang(language);
  const currentIdx = allQuestions.findIndex(q => q.id === parseInt(id));
  const hasPrev = currentIdx > 0;
  const hasNext = currentIdx < allQuestions.length - 1;

  return (
    <div className="editor-page-root">
      {/* ─── Outer Title & Breadcrumbs ─── */}
      <div className="editor-header-outer">
        <h3 className="ql-page-title">CodeLab</h3>
        <div className="editor-breadcrumbs">
          <span className="breadcrumb-link" onClick={() => navigate('/codelab')}>Dashboard</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{question.id}. {question.title}</span>
        </div>
      </div>

      {/* ─── Main White Box Container ─── */}
      <div className="editor-main-container">
        {/* ─── Top Navbar ─── */}
        <nav className="leetcode-nav">
          <div className="nav-left">
            <button className="back-to-codelab-btn" onClick={() => navigate('/codelab')}>
              <FiChevronLeft className="back-icon" />
              <span>Back</span>
            </button>
          </div>

          <div className="nav-right">
            <button className={`nav-arrow ${!hasPrev ? 'disabled' : ''}`} onClick={handlePrev} disabled={!hasPrev}>
              &lt;
            </button>
            <span className="problem-list-label" onClick={() => navigate('/codelab')}>Problem List</span>
            <button className={`nav-arrow ${!hasNext ? 'disabled' : ''}`} onClick={handleNext} disabled={!hasNext}>
              &gt;
            </button>
          </div>
        </nav>

        <div className="editor-layout" style={{ cursor: isResizing ? 'col-resize' : 'default' }}>
          {/* ─── Left Panel: Description & Submissions ─── */}
          <div className="left-panel" style={{ width: `${leftWidth}%`, flex: 'none', maxWidth: 'none' }}>
            <div className="panel-header">
              <button 
                className={`panel-tab ${activeTab === 'description' ? 'active' : ''}`} 
                onClick={() => setActiveTab('description')}
              >
                Description
              </button>
              <button 
                className={`panel-tab ${activeTab === 'submissions' ? 'active' : ''}`} 
                onClick={() => setActiveTab('submissions')}
              >
                Submission
              </button>
            </div>

            <div className="panel-content scrollbar-custom">
              {activeTab === 'description' ? (
                <div className="description-view">
                  <div className="problem-header">
                    <h3 className="problem-title">{question.id}. {question.title}</h3>
                    <div className="problem-meta">
                      <span className="difficulty-badge easy">Easy</span>
                      <span className="meta-item"><FiClock /> 15 mins</span>
                    </div>
                  </div>

                  <div className="problem-body">
                    <div className="content-section">
                      {question.description}
                    </div>

                    {question.constraints && (
                      <div className="content-section">
                        <h4 className="section-title">CONSTRAINTS</h4>
                        <ul className="constraints-list">
                          {question.constraints.split('\n').map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}

                    <div className="content-section">
                      <h4 className="section-title">Examples</h4>
                      {(question.testCases || []).slice(0, 2).map((tc, i) => (
                        <div key={i} className="example-box">
                          <p><strong>Example {i + 1} :</strong></p>
                          <div className="example-data">
                            <p>Input: {tc.inputData}</p>
                            <p>Output: {tc.expectedOutput}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="submissions-view">
                  {submissions.length === 0 ? (
                    <div className="empty-state">No submissions yet.</div>
                  ) : (
                    <>
                    <div className="submissions-list-header">
                      <span className="submissions-list-title">Submission History</span>
                      <span className="submissions-latest-badge">{showAllSubmissions ? 'All Submissions' : 'Latest 5'}</span>
                    </div>
                    <table className="submissions-table">
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Language</th>
                          <th>Runtime</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...submissions]
                          .sort((a, b) => {
                            const toMs = (s) => {
                              if (Array.isArray(s) && s.length >= 3)
                                return new Date(Date.UTC(s[0], s[1] - 1, s[2], s[3] ?? 0, s[4] ?? 0, s[5] ?? 0)).getTime();
                              return s ? new Date(s).getTime() : 0;
                            };
                            return toMs(b.submittedAt) - toMs(a.submittedAt);
                          })
                          .slice(0, showAllSubmissions ? submissions.length : 5)
                          .map(sub => {
                          const parsedDate = (() => {
                            let d;
                            if (Array.isArray(sub.submittedAt) && sub.submittedAt.length >= 3) {
                              // Use nullish coalescing so hour/min/sec of 0 are preserved correctly
                              d = new Date(Date.UTC(
                                sub.submittedAt[0],
                                sub.submittedAt[1] - 1,
                                sub.submittedAt[2],
                                sub.submittedAt[3] ?? 0,
                                sub.submittedAt[4] ?? 0,
                                sub.submittedAt[5] ?? 0
                              ));
                            } else if (sub.submittedAt) {
                              d = new Date(sub.submittedAt);
                            } else {
                              d = new Date();
                            }
                            return isNaN(d.getTime()) ? new Date() : d;
                          })();
                          return (
                            <tr key={sub.id} onClick={() => setCode(sub.code)}>
                              <td className={sub.status === 'PASSED' ? 'status-pass' : 'status-fail'}>
                                {sub.status === 'PASSED' ? '✅ Accepted' : '❌ Wrong Answer'}
                              </td>
                              <td>{sub.language}</td>
                              <td>{sub.testCasesPassed * 10}ms</td>
                              <td style={{ whiteSpace: 'nowrap' }}>
                                <div className="sub-date">{formatDate(parsedDate)}</div>
                                <div className="sub-time">{formatTime(parsedDate)}</div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {submissions.length > 5 && (
                      <div style={{ textAlign: 'center', marginTop: '15px', marginBottom: '10px' }}>
                        <button 
                          onClick={() => setShowAllSubmissions(!showAllSubmissions)}
                          style={{
                            background: 'transparent',
                            color: '#2cbb5d',
                            border: '1px solid #2cbb5d',
                            padding: '6px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          {showAllSubmissions ? 'Show Less' : 'Show More'}
                        </button>
                      </div>
                    )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Resize Handle */}
          <div 
            className={`resize-handle ${isResizing ? 'active' : ''}`} 
            onMouseDown={startResizing}
          />

          {/* ─── Right Panel: Editor & Console ─── */}
          <div className="right-panel" style={{ width: `${100 - leftWidth}%`, flex: 'none' }}>
            <div className="editor-container">
              <div className="editor-header">
                <select 
                  className="lang-select"
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                >
                  {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <button 
                  className="clear-btn" 
                  onClick={handleClear}
                  title="Reset code to template"
                >
                  <FiTrash2 /> Clear Code
                </button>
              </div>
              <div className="editor-body">
                <Editor
                  height="100%"
                  language={langMeta.monacoLang}
                  theme="vs-dark"
                  value={code}
                  onChange={v => setCode(v || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    padding: { top: 10 },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>

            {/* Result / Console Drawer */}
            <div className="console-panel">
              <div className="console-header">
                <div className="console-tabs">
                  <button 
                    className={`console-tab-btn ${consoleTab === 'testcase' ? 'active' : ''}`}
                    onClick={() => setConsoleTab('testcase')}
                  >
                    Test case
                  </button>
                  <button 
                    className={`console-tab-btn ${consoleTab === 'result' ? 'active' : ''}`}
                    onClick={() => setConsoleTab('result')}
                  >
                    Test Result
                  </button>
                </div>
                <div className="console-actions-top">
                  <button className="console-action-btn run-btn" onClick={handleRun} disabled={isRunning || isSubmitting}>
                    Run
                  </button>
                  <button className="console-action-btn submit-btn" onClick={handleSubmit} disabled={isSubmitting || isRunning}>
                    Submit
                  </button>
                </div>
              </div>
              
              <div className="console-body scrollbar-custom">
                {consoleTab === 'testcase' ? (
                  <div className="testcase-view">
                    <div className="testcase-selector" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                      {(question.testCases || []).slice(0, 2).map((_, i) => (
                        <button 
                          key={i}
                          className={`case-btn ${selectedTestCase === i ? 'active' : ''}`}
                          onClick={() => setSelectedTestCase(i)}
                        >
                          Case {i + 1}
                        </button>
                      ))}
                    </div>
                    {question.testCases && question.testCases[selectedTestCase] && (
                      <div className="case-content">
                        <div className="data-group" style={{ marginBottom: '15px' }}>
                          <p style={{ margin: '0 0 5px 0', fontSize: '0.75rem', color: '#888', fontWeight: 'bold' }}>Input</p>
                          <pre className="case-input-pre scrollbar-custom">{question.testCases[selectedTestCase].inputData}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="result-view">
                    {!userOutput && !result ? (
                      <div className="empty-result" style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>
                        You must run your code first.
                      </div>
                    ) : (
                      <>
                        {userOutput?.results ? (
                          <div className="multi-case-results">
                            <div className="testcase-selector" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                              {userOutput.results.map((res, i) => (
                                <button 
                                  key={i}
                                  className={`case-btn ${selectedTestCase === i ? 'active' : ''}`}
                                  onClick={() => setSelectedTestCase(i)}
                                  style={{ color: res.passed ? '#2cbb5d' : '#ef4444' }}
                                >
                                  Case {i + 1}
                                </button>
                              ))}
                            </div>
                            {userOutput.results[selectedTestCase] && (
                              <div className="result-detail">
                                <h3 style={{ color: userOutput.results[selectedTestCase].passed ? '#2cbb5d' : '#ef4444', margin: '0 0 15px 0' }}>
                                  {userOutput.results[selectedTestCase].passed ? 'Accepted' : 'Wrong Answer'}
                                </h3>
                                <div style={{ display: 'grid', gap: '10px' }}>
                                  <div>
                                    <p style={{ margin: '0 0 5px 0', fontSize: '0.75rem', color: '#888' }}>Input</p>
                                    <pre style={{ margin: 0, padding: '10px', background: '#f7f8fa', borderRadius: '6px' }}>{userOutput.results[selectedTestCase].input}</pre>
                                  </div>
                                  <div>
                                    <p style={{ margin: '0 0 5px 0', fontSize: '0.75rem', color: '#888' }}>Output</p>
                                    <pre style={{ margin: 0, padding: '10px', background: '#f7f8fa', borderRadius: '6px', color: userOutput.results[selectedTestCase].passed ? '#2cbb5d' : '#ef4444' }}>{userOutput.results[selectedTestCase].actualOutput}</pre>
                                  </div>
                                  <div>
                                    <p style={{ margin: '0 0 5px 0', fontSize: '0.75rem', color: '#888' }}>Expected</p>
                                    <pre style={{ margin: 0, padding: '10px', background: '#f7f8fa', borderRadius: '6px', color: '#2cbb5d' }}>{userOutput.results[selectedTestCase].expectedOutput}</pre>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : result ? (
                          <div className={`submission-result ${result.status === 'PASSED' ? 'pass' : 'fail'}`}>
                            <div className="res-header">
                              <h3>{result.status === 'PASSED' ? 'Accepted' : 'Wrong Answer'}</h3>
                              <span>{result.testCasesPassed} / {result.totalTestCases} Testcases Passed</span>
                            </div>
                            {result.failedTests && result.failedTests.length > 0 && !result.failedTests[0].isPrivate && (
                              <div className="failed-detail" style={{ marginTop: '15px' }}>
                                <p><strong>Input:</strong> {result.failedTests[0].input}</p>
                                <p><strong>Output:</strong> <span className="red">{result.failedTests[0].actual}</span></p>
                                <p><strong>Expected:</strong> <span className="green">{result.failedTests[0].expected}</span></p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="run-result">
                            <pre className={userOutput?.error ? 'err' : 'out'}>
                              {userOutput?.error || userOutput?.output || 'No output'}
                            </pre>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wrong Answer Popup Modal */}
      {showWrongPopup && (
        <div className="wrong-answer-overlay" onClick={() => setShowWrongPopup(false)}>
          <div className="wrong-answer-modal" onClick={e => e.stopPropagation()}>
            <div className="wrong-modal-icon">✗</div>
            <h2 className="wrong-modal-title">Wrong Answer</h2>
            <p className="wrong-modal-desc">Your output doesn't match the expected result. Review your logic and try again.</p>
            <button className="wrong-modal-btn" onClick={() => setShowWrongPopup(false)}>Try Again</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditorPage;
