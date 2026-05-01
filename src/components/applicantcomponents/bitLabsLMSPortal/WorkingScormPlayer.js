import { useEffect, useState, useCallback } from "react";

const WorkingScormPlayer = ({ courseId, onProgressUpdate }) => {
  const [totalCount, setTotalCount] = useState(0);

  // ✅ Core reusable calculation
  const updateProgressState = useCallback((visited, total) => {
    if (!total || total === 0) return;

    const progress = Math.min(Math.round((visited / total) * 100), 100);

    console.log("📊 VISITED:", visited, "TOTAL:", total, "PROGRESS:", progress);

    if (onProgressUpdate) onProgressUpdate(progress);
  }, [onProgressUpdate]);

  useEffect(() => {
    const progressKey = `articulate_course_${courseId}_progress`;

    // ✅ Load total + visited from localStorage (Articulate auto stores this)
    const loadInitialProgress = () => {
      const rawData = localStorage.getItem(progressKey);

      if (rawData) {
        try {
          const data = JSON.parse(rawData);

          const visited =
            typeof data.visited === "number"
              ? data.visited
              : data.visited?.length || 0;

          const total = data.total || visited || 1;

          setTotalCount(total);
          updateProgressState(visited, total);
        } catch (e) {
          console.log("Error parsing progress", e);
        }
      }
    };

    // ✅ Listen to SCORM messages
    const handleMessage = (event) => {
      const data = event.data;
      if (!data) return;

      console.log("📥 SCORM:", data);

      // ✅ BEST CASE → SCORM sends both values
      if (data.type === "SCORM_PROGRESS") {
        const visited = data.current || 0;
        const total = data.total || totalCount || 1;

        setTotalCount(total);
        updateProgressState(visited, total);
      }

      // ✅ Articulate / LMS events
      else if (data.type === "SCORM_EVENT") {
        if (
          data.action === "SLIDE_VISIT" ||
          data.action === "PROGRESS_UPDATE"
        ) {
          const visited = data.slideNumber || data.visited || 0;
          const total = data.totalSlides || data.total || totalCount || visited || 1;

          setTotalCount(total);
          updateProgressState(visited, total);
        }

        // fallback (only slide number comes)
        if (data.action === "LMSSetValue") {
          if (
            data.key === "cmi.core.lesson_location" ||
            data.key === "cmi.location"
          ) {
            const visited = parseInt(data.value) || 0;

            updateProgressState(visited, totalCount || visited || 1);
          }
        }
      }

      // ✅ fallback generic
      else if (data.type === "progress") {
        const progress = Math.round(data.value || 0);
        if (onProgressUpdate) onProgressUpdate(progress);
      }
    };

    window.addEventListener("message", handleMessage);

    loadInitialProgress();

    const interval = setInterval(loadInitialProgress, 4000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("message", handleMessage);
    };
  }, [courseId, totalCount, updateProgressState]);

  return null; 
};

export default WorkingScormPlayer;
 