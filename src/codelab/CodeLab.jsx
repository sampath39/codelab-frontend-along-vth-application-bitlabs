import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import QuestionsList from './pages/QuestionsList';
import CodeEditorPage from './pages/CodeEditorPage';
import './CodeLab.css';

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3 }}
    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes key={location.pathname}>
        <Route path="" element={<PageTransition><QuestionsList /></PageTransition>} />
        <Route path="problem/:id" element={<PageTransition><CodeEditorPage /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};
const CodeLab = () => {
  return (
    <div className="codelab-module-root">
      <div className="border-style">
        <div className="blur-border-style"></div>
        <div className="dashboard__content codelab-content">
          <div className="codelab-app-container">
            <Toaster position="top-right" />
            <main className="codelab-main-content">
              <div className="codelab-page-wrapper">
                <AnimatedRoutes />
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};


export default CodeLab;
