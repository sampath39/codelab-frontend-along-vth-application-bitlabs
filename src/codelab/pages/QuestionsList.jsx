import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchQuestions } from '../services/api';
import './QuestionsList.css';

const difficultyMap = {
  0: { label: 'Easy', color: '#10b981' },
  1: { label: 'Medium', color: '#f59e0b' },
  2: { label: 'Hard', color: '#ef4444' },
};

const getDifficulty = (id) => difficultyMap[id % 3];

const QuestionsList = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topicOption, setTopicOption] = useState('all');
  const [levelOption, setLevelOption] = useState('all');
  const [completedProblems, setCompletedProblems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const completed = JSON.parse(localStorage.getItem('codelab_completed_problems') || '[]');
      setCompletedProblems(completed);
    } catch (e) {
      console.error('Failed to load completed problems', e);
    }
  }, []);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setError(null);
        console.log('Fetching questions...');
        const data = await fetchQuestions();
        console.log('Fetched data:', data);
        setQuestions(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load questions. Make sure the backend server is running.');
      } finally {
        setLoading(false);
      }
    };
    loadQuestions();
  }, []);

  const filtered = questions.filter(q => {
    const diff = getDifficulty(q.id);
    if (levelOption !== 'all' && diff.label.toLowerCase() !== levelOption.toLowerCase()) {
      return false;
    }
    return true;
  }).sort((a, b) => a.id - b.id);

  if (loading) return <div className="codelab-loading">Loading CodeLab...</div>;

  return (
    <div className="ql-root">
      <div className="ql-header-section">
        <div className="ql-top-row">
          <h3 className="ql-page-title">CodeLab</h3>
          <div className="ql-search-container">
            <select
              className="ql-sort-select"
              value={topicOption}
              onChange={e => setTopicOption(e.target.value)}
            >
              <option value="all">All Topics</option>
            </select>
            <select
              className="ql-sort-select"
              value={levelOption}
              onChange={e => setLevelOption(e.target.value)}
            >
              <option value="all">Code Level</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="ql-error glass-card">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="ql-grid">
        {!error && filtered.length === 0 && (
          <div className="ql-empty-state">
            <div className="ql-empty-icon">📂</div>
            <h3>No Challenges Found</h3>
            <p>Make sure the CodeLab backend server is running and accessible.</p>
            <button className="ql-view-btn" onClick={() => window.location.reload()}>Refresh Page</button>
          </div>
        )}
        {filtered.map((q, idx) => {
          const diff = getDifficulty(q.id);
          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              className="ql-hack-card"
            >
              <div className="ql-card-content">
                <div className="ql-card-status-row">
                  <span className={`ql-status-tag ${diff.label.toLowerCase()}`}>{diff.label}</span>
                </div>

                <h3 className="ql-card-title">
                  {q.id}. {q.title}
                </h3>
                <p className="ql-card-author">By bitLabs Team</p>

                <div className="ql-card-tags">
                  <span className="ql-tag tag-python">Python</span>
                  <span className="ql-tag tag-java">Java</span>
                  <span className="ql-tag tag-c">C</span>
                  <span className="ql-tag tag-cpp">C++</span>
                  <span className="ql-tag tag-js">JavaScript</span>
                </div>

                <div className="ql-card-footer-row">
                  <button
                    className={`ql-solve-btn ${completedProblems.includes(q.id) ? 'completed' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/codelab/problem/${q.id}`);
                    }}
                  >
                    {completedProblems.includes(q.id) ? 'View Result' : 'Solve Now'}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionsList;

