
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import "./coursedetails.css";
import WorkingScormPlayer from "./WorkingScormPlayer";

// ─── Static course data (outside component so it never re-creates) ───────────
const COURSE_DATA = {
  "html & css": [
    { topic: "Introduction to Web App", videos: [{ title: "What is a Web Application?", url: "/html-css/introductiontowebapp_topic1/index_lms.html" }] },
    { topic: "HTML for Beginners", videos: [{ title: "Basics of HTML Structure", url: "/html-css/htmlforbegginers_topic2/index_lms.html" }] },
    { topic: "CSS Part 1", videos: [{ title: "Introduction to CSS Styling", url: "/html-css/csspart1_topic3/index_lms.html" }] },
    { topic: "CSS Part 2", videos: [{ title: "Advanced CSS Concepts", url: "/html-css/csspart2_topic4/index_lms.html" }] },
    { topic: "HTML Forms", videos: [{ title: "Creating Forms in HTML", url: "/html-css/HTML FORMS_topic5/index_lms.html" }] },
  ],
  "python": [
    { topic: "Introduction to python", videos: [{ title: "What is a python?", url: "/python for beginners/Introduction to Python_topic1/index_lms.html" }] },
    { topic: "Python variables and data types", videos: [{ title: "Variables and Data Types", url: "/python for beginners/python variables and data types_topic2/index_lms.html" }] },
    { topic: "Python Operators", videos: [{ title: "Operators", url: "/python for beginners/Python Operators_topic3/index_lms.html" }] },
    { topic: "Python conditional statements", videos: [{ title: "Conditional Statements", url: "/python for beginners/Python conditional statements_topic4/index_lms.html" }] },
    { topic: "Python Loops", videos: [{ title: "Loops", url: "/python for beginners/Python Loops_topic5/index_lms.html" }] },
    { topic: "Python Data Structures Part 1", videos: [{ title: "Data Structures Part 1", url: "/python for beginners/Python Data Structures Part 1_topic6/index_lms.html" }] },
    { topic: "Python Data Structures Part 2", videos: [{ title: "Data Structures Part 2", url: "/python for beginners/Python Data Structures Part 2_topic7/index_lms.html" }] },
    { topic: "Python Data Structures Part 3", videos: [{ title: "Data Structures Part 3", url: "/python for beginners/Python Data Structures Part 3_topic8/index_lms.html" }] },
    { topic: "Python functions", videos: [{ title: "Functions", url: "/python for beginners/python functions_topic9/index_lms.html" }] },
    { topic: "Python modules", videos: [{ title: "Modules", url: "/python for beginners/python modules_topic10/index_lms.html" }] },
    { topic: "Python OOPS", videos: [{ title: "OOPS concepts", url: "/python for beginners/Python OOPS_topic11/index_lms.html" }] },
    { topic: "Python Constructors", videos: [{ title: "Constructors", url: "/python for beginners/Python Constructors_topic12/index_lms.html" }] },
    { topic: "Python Inheritence", videos: [{ title: "Inheritence", url: "/python for beginners/Python Inheritence_topic13/index_lms.html" }] },
  ],
  java: [
    { topic: "Java Basics", videos: [{ title: "Java Course", url: "https://bitlabs-app.s3.ap-south-1.amazonaws.com/Staging/ScromPackages/How+to+Set+Goals_web+2/story.html" }] },
  ],
};

const CourseDetails = () => {
  const { courseName } = useParams();

  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);
  const [topicProgress, setTopicProgress] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Ref keeps the current topic index reachable inside async callbacks/effects
  const playerRef = useRef(null);
  const topicIndexRef = useRef(0);
  topicIndexRef.current = selectedTopicIndex;

  const courseContent = COURSE_DATA[courseName] || [];

  // ── 1. SCORM 1.2 API shim ─────────────────────────────────────────────────
  // Installed/refreshed whenever the course changes.
  // Articulate's scormdriver.js (loaded by index_lms.html) walks up the frame
  // chain looking for window.API.  We sit in window (parent of the iframe) so
  // it finds us first.  All SCORM state is kept per-topic in localStorage so
  // it survives navigation away and back.
  useEffect(() => {
    const storeKey = () => `scorm_${courseName}_${topicIndexRef.current}`;

    const readStore = () => { try { return JSON.parse(localStorage.getItem(storeKey()) || "{}"); } catch { return {}; } };
    const writeStore = (obj) => { localStorage.setItem(storeKey(), JSON.stringify(obj)); };

    window.API = {
      LMSInitialize: (_) => { console.log("[SCORM] Init  topic", topicIndexRef.current); return "true"; },
      LMSFinish: (_) => { console.log("[SCORM] Finish topic", topicIndexRef.current); return "true"; },
      LMSGetValue: (key) => {
        const val = readStore()[key];
        const out = val !== undefined ? String(val) : "";
        console.log("[SCORM] Get", key, "→", out);
        return out;
      },
      LMSSetValue: (key, val) => {
        console.log("[SCORM] Set", key, "=", val);
        const store = readStore();
        store[key] = val;
        writeStore(store);
        return "true";
      },
      LMSCommit: (_) => "true",
      LMSGetLastError: () => "0",
      LMSGetErrorString: (_) => "",
      LMSGetDiagnostic: (_) => "",
    };

    return () => { delete window.API; };
  }, [courseName]); // re-install only when course changes; topic index is read via ref

  // ── 2. Load saved progress + restore last visited topic ───────────────────
  useEffect(() => {
    // Reload all topic progress values from localStorage
    const saved = {};
    courseContent.forEach((_, i) => {
      const v = localStorage.getItem(`progress_${courseName}_${i}`);
      saved[i] = v ? parseInt(v, 10) : 0;
    });
    setTopicProgress(saved);

    // Restore whichever topic the user was on last time
    const raw = localStorage.getItem(`lastTopic_${courseName}`);
    const lastIdx = raw !== null ? parseInt(raw, 10) : 0;
    const idx = lastIdx >= 0 && lastIdx < courseContent.length ? lastIdx : 0;
    setSelectedTopicIndex(idx);
  }, [courseName]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 3. Progress update — NEVER go backward ────────────────────────────────
  // Uses functional setState so the previous value is always fresh even when
  // called from a WorkingScormPlayer interval/message handler.
  const handleProgressUpdate = useCallback((p) => {
    const idx = topicIndexRef.current;
    const key = `progress_${courseName}_${idx}`;
    const current = parseInt(localStorage.getItem(key) || "0", 10);

    if (p <= current) return; // ✅ progress can only move forward

    localStorage.setItem(key, String(p));
    setTopicProgress(prev => ({ ...prev, [idx]: p }));
  }, [courseName]);

  // ── 4. Topic selection — saves last topic ─────────────────────────────────
  const selectTopic = (index) => {
    // Check if topic is locked (not first topic AND previous not 100%)
    const isLocked = index > 0 && (topicProgress[index - 1] || 0) < 100;
    if (isLocked) return;

    setSelectedTopicIndex(index);
    localStorage.setItem(`lastTopic_${courseName}`, String(index));

    // Try to go fullscreen immediately on user gesture
    if (!document.fullscreenElement) {
      toggleFullscreen();
    }
  };

  // ── 5. Overall average progress ───────────────────────────────────────────
  const averageProgress =
    courseContent.length > 0
      ? Math.round(Object.values(topicProgress).reduce((a, b) => a + b, 0) / courseContent.length)
      : 0;

  const selectedVideo = courseContent[selectedTopicIndex]?.videos[0]?.url || "";

  // Listen for fullscreen change events (e.g. user pressing Esc)
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!playerRef.current) return;

    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="border-style">
      <div className="blur-border-style"></div>


      <div className="dashboard__content">
        <div className="row extraSpace">
          <div className="col-lg-12 col-md-12">

            <div className="course-container">
              <div className="course-layout">

                {/* ── Sidebar ── */}
                <div className="course-sidebar">

                  {/* Course title + overall progress inside sidebar */}
                  <div className="cd-sidebar-header">
                    <h3 className="cd-title">{courseName}</h3>
                    <div className="cd-progress-labels">
                      <span>Overall Progress</span>
                      <span className="cd-progress-pct">{averageProgress}%</span>
                    </div>
                    <div className="cd-progress-track">
                      <div className="cd-progress-fill" style={{ width: `${averageProgress}%` }} />
                    </div>
                  </div>


                  <h4 className="cd-topics-heading">Topics</h4>

                  {courseContent.map((t, index) => {
                    const progress = topicProgress[index] || 0;
                    const isLocked = index > 0 && (topicProgress[index - 1] || 0) < 100;
                    const isActive = selectedTopicIndex === index;

                    return (
                      <div
                        key={index}
                        className={`topic-block ${isLocked ? "topic-locked" : ""} ${isActive ? "topic-active" : ""}`}
                        onClick={() => !isLocked && selectTopic(index)}
                      >
                        <div className="topic-info">
                          <strong>
                            {isLocked ? "🔒 " : (progress === 100 ? <span style={{ color: "#D26B15" }}>✔ </span> : "▶ ")}
                            {t.topic}
                          </strong>
                        </div>

                        {/* Per-topic progress bar */}
                        {!isLocked && (
                          <>
                            <div style={{ height: "6px", background: "#eee", borderRadius: "10px", overflow: "hidden", margin: "6px 0" }}>
                              <div style={{ width: `${progress}%`, height: "100%", background: "#e49723ff", transition: "width 0.4s ease" }} />
                            </div>
                            <p style={{ fontSize: "12px", color: "#666" }}>{progress}% completed</p>
                          </>
                        )}

                        {t.videos.map((video, i) => (
                          <p
                            key={i}
                            className={`video-link ${isActive ? "active" : ""} ${isLocked ? "disabled" : ""}`}
                          >
                            {video.title}
                          </p>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {/* ── Player ── */}
                <div className="course-player" ref={playerRef}>
                  {/* Overlay to catch click and go fullscreen (Distraction-free) */}
                  {!isFullscreen && (
                    <div className="immersive-overlay" onClick={toggleFullscreen}>
                      <div className="overlay-msg">
                        <span>⛶ Click anywhere to start Fullscreen Learning</span>
                      </div>
                    </div>
                  )}

                  {/* WorkingScormPlayer listens to postMessage events from index_lms.html */}
                  <WorkingScormPlayer
                    courseId={`${courseName}_${selectedTopicIndex}`}
                    onProgressUpdate={handleProgressUpdate}
                  />

                  {selectedVideo ? (
                    <iframe
                      // key forces a fresh iframe (and SCORM session) when topic changes
                      key={`${courseName}_${selectedTopicIndex}`}
                      src={selectedVideo}
                      className="video-frame"
                      title="Course Player"
                      allowFullScreen
                    />
                  ) : (
                    <div className="empty-state">No video available</div>
                  )}
                  <button
                    onClick={toggleFullscreen}
                    className="fullscreen-btn"
                  >
                    {isFullscreen ? "✕ Exit Fullscreen" : "⛶ Fullscreen"}
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;