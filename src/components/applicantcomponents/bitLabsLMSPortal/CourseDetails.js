import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import "./coursedetails.css";
import WorkingScormPlayer from "./WorkingScormPlayer";
import ProgressAPIService from "../../../services/ProgressAPIService.js";
import { useUserContext } from "../../common/UserProvider";
import CourseCodeLab from "../../../codelab/components/CourseCodeLab";

// ─── Static course data (outside component so it never re-creates) ───────────
// Course mapping to convert course names to actual course IDs
const getCourseId = (courseName) => {
  const courseMap = {
    "html & css": 1,
    "python": 2,
    "java": 3,
    "sql": 4,
    "react": 5,
    "spring boot": 6
  };
  return courseMap[courseName.toLowerCase()] || 0;
};

const COURSE_DATA = {
  "html & css": [
    { topic: "Introduction to Web App", videos: [{ title: "What is a Web Application?", url: "https://bitlabs-app.s3.ap-south-1.amazonaws.com/Staging/ScromPackages/introductiontowebapp_topic1/story.html" }] },
    { topic: "HTML for Beginners", videos: [{ title: "Basics of HTML Structure", url: "https://bitlabs-app.s3.ap-south-1.amazonaws.com/Staging/ScromPackages/htmlforbegginers_topic2/story.html" }] },
    { topic: "CSS Part 1", videos: [{ title: "Introduction to CSS Styling", url: "https://bitlabs-app.s3.ap-south-1.amazonaws.com/Staging/ScromPackages/csspart1_topic3/story.html" }] },
    { topic: "CSS Part 2", videos: [{ title: "Advanced CSS Concepts", url: "https://bitlabs-app.s3.ap-south-1.amazonaws.com/Staging/ScromPackages/csspart2_topic4/story.html" }] },
    { topic: "HTML Forms", videos: [{ title: "Creating Forms in HTML", url: "https://bitlabs-app.s3.ap-south-1.amazonaws.com/Staging/ScromPackages/HTMLFORMS_topic5/story.html" }] },
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
  const { user } = useUserContext();
  const applicantId = user?.id;

  const [selectedTopicIndex, setSelectedTopicIndex] = useState(0);
  const [topicProgress, setTopicProgress] = useState({});
  const [overallProgress, setOverallProgress] = useState(0);
  const [courseProgressId, setCourseProgressId] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("video"); // "video" or "practice"

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

  // ── 2. Load saved progress from backend + restore last visited topic ───────────────────
  useEffect(() => {
    const loadProgress = async () => {
      if (!applicantId) return;
      
      try {
        setLoading(true);
        // Get all courses progress for this applicant
        const applicantCourses = await ProgressAPIService.getApplicantProgress(applicantId);
        
        // Find the current course progress
        const currentCourse = applicantCourses.find(course => 
          course.courseName.toLowerCase() === courseName.toLowerCase()
        );
        
        if (currentCourse) {
          setCourseProgressId(currentCourse.id);
          setOverallProgress(currentCourse.overallProgress);
          
          // Get topics progress for this course
          const topicsProgress = await ProgressAPIService.getCourseTopics(currentCourse.id);
          const progressMap = {};
          topicsProgress.forEach(topic => {
            progressMap[topic.topicIndex] = topic.topicProgress;
          });
          setTopicProgress(progressMap);
          
          // Find the last accessed topic (highest progress that's not 100%)
          const lastTopicIndex = topicsProgress.reduce((lastIdx, topic) => {
            return topic.topicProgress < 100 && topic.topicIndex > lastIdx ? topic.topicIndex : lastIdx;
          }, 0);
          
          // Find the first incomplete topic (progress < 100)
          const firstIncompleteTopic = topicsProgress.reduce((firstIdx, topic) => {
            return topic.topicProgress < 100 && topic.topicIndex < firstIdx ? topic.topicIndex : firstIdx;
          }, topicsProgress.length);
          
          // If there are incomplete topics, go to the first one; otherwise go to last completed
          const targetTopicIndex = firstIncompleteTopic !== topicsProgress.length ? firstIncompleteTopic : lastTopicIndex;
          setSelectedTopicIndex(targetTopicIndex);
        } else {
          // Initialize with zero progress if no course progress exists
          setOverallProgress(0);
          setTopicProgress({});
          setSelectedTopicIndex(0);
        }
      } catch (error) {
        console.error('Error loading progress:', error);
        // Fallback to zero progress
        setOverallProgress(0);
        setTopicProgress({});
        setSelectedTopicIndex(0);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [courseName, applicantId]);

  // ── 3. Progress update — save to backend ────────────────────────────────────
  const handleProgressUpdate = useCallback(async (p) => {
    if (!applicantId) return;
    
    const idx = topicIndexRef.current;
    const currentProgress = topicProgress[idx] || 0;

    if (p <= currentProgress) return; // ✅ progress can only move forward

    try {
      // Update local state immediately for UI responsiveness
      setTopicProgress(prev => ({ ...prev, [idx]: p }));
      
      // Calculate new overall progress
      const newTopicProgress = { ...topicProgress, [idx]: p };
      const totalProgress = Object.values(newTopicProgress).reduce((a, b) => a + b, 0);
      const newOverallProgress = Math.round(totalProgress / courseContent.length);
      setOverallProgress(newOverallProgress);
      
      // Save to backend
      await ProgressAPIService.saveProgress({
        applicantId,
        courseId: getCourseId(courseName), // Map courseName to actual courseId
        courseName,
        topicIndex: idx,
        topicName: courseContent[idx]?.topic || '',
        topicProgress: p
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      // Optionally revert the state if backend save fails
      setTopicProgress(prev => ({ ...prev, [idx]: currentProgress }));
    }
  }, [applicantId, courseName, courseContent, topicProgress]);

  // ── 4. Topic selection — saves last topic to backend ────────────────────────────────
  const selectTopic = (index) => {
    // Check if topic is locked (not first topic AND previous not 100%)
    const isLocked = index > 0 && (topicProgress[index - 1] || 0) < 100;
    if (isLocked) return;

    setSelectedTopicIndex(index);

    // Try to go fullscreen immediately on user gesture
    if (!document.fullscreenElement) {
      toggleFullscreen();
    }
  };

  // ── 5. Overall progress from backend ───────────────────────────────────────────
  const averageProgress = overallProgress;

  const selectedVideo = courseContent[selectedTopicIndex]?.videos?.[0]?.url || "";

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

  return (
    <div className="border-style">
      <div className="blur-border-style"></div>
      <div className="dashboard__content">
        <div className="row extraSpace">
          <div className="col-lg-12 col-md-12">
            <div className="course-container">
              <div className="course-layout">
                <div className="course-sidebar">
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

                  {/* ─── Practice & Assignments Section ─── */}
                  <div className="cd-practice-sidebar-section">
                    <h4 className="cd-topics-heading">Practice & Assignments</h4>
                    
                    <div 
                      className={`topic-block ${activeTab === "practice" ? "topic-active" : ""}`}
                      onClick={() => setActiveTab("practice")}
                    >
                      <div className="topic-info">
                        <strong>💻 Coding Practice</strong>
                      </div>
                      <p style={{ fontSize: "12px", color: "#666" }}>Practice course problems</p>
                    </div>
                  </div>
                </div>
                <div className="course-player" ref={playerRef}>
                  <div className="cd-tabs">
                    <button 
                      className={`cd-tab-btn ${activeTab === "video" ? "active" : ""}`}
                      onClick={() => setActiveTab("video")}
                    >
                      📺 Video Lessons
                    </button>
                    <button 
                      className={`cd-tab-btn ${activeTab === "practice" ? "active" : ""}`}
                      onClick={() => setActiveTab("practice")}
                    >
                      💻 Practice (CodeLab)
                    </button>
                  </div>

                  {activeTab === "video" ? (
                    <>
                      {!isFullscreen && (
                        <div className="immersive-overlay" onClick={toggleFullscreen}>
                          <div className="overlay-msg">
                            <span>⛶ Click anywhere to start Fullscreen Learning</span>
                          </div>
                        </div>
                      )}
                      <WorkingScormPlayer
                        courseId={`${courseName}_${selectedTopicIndex}`}
                        onProgressUpdate={handleProgressUpdate}
                      />
                      <iframe
                        key={`${courseName}_${selectedTopicIndex}`}
                        src={selectedVideo}
                        className="video-frame"
                        title="Course Player"
                        allowFullScreen
                      />
                      <button
                        onClick={toggleFullscreen}
                        className="fullscreen-btn"
                      >
                        {isFullscreen ? "✕ Exit Fullscreen" : "⛶ Fullscreen"}
                      </button>
                    </>
                  ) : (
                    <div className="cd-practice-area">
                      <CourseCodeLab courseName={courseName} />
                    </div>
                  )}
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