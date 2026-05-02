import React, { useState, useMemo, useEffect } from "react";
import "./applicantcourses.css";
import python from "./assets/python.jfif";
import htmlandcss from "./assets/html&css.jfif";
import java from "./assets/java.jfif";
import sql from "./assets/sql.jfif";
import react from "./assets/reactjs.jfif";
import springboot from "./assets/springboot.jfif";

import { useNavigate } from "react-router-dom";
import ProgressAPIService from "../../../services/ProgressAPIService.js";
import { useUserContext } from "../../common/UserProvider";

const ApplicantCourses = () => {
  const [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(false);
  const [coursesProgress, setCoursesProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useUserContext();
  const applicantId = user?.id;

  const coursesData = [
    { id: 1, name: "Python", img: python },
    { id: 2, name: "HTML & CSS", img: htmlandcss },
    { id: 3, name: "Java", img: java },
    { id: 4, name: "SQL", img: sql },
    { id: 5, name: "Spring Boot", img: springboot },
    { id: 6, name: "React", img: react },
  ];

  const coursesMap = {
    "html & css": 5,
    "python": 13,
  };

  // Load progress from backend on component mount
  useEffect(() => {
    const loadCoursesProgress = async () => {
      if (!applicantId) return;
      
      try {
        setLoading(true);
        // Get all courses progress for this applicant
        const applicantCourses = await ProgressAPIService.getApplicantProgress(applicantId);
        
        // Convert to object with course names as keys for easy lookup
        const progressMap = {};
        applicantCourses.forEach(course => {
          progressMap[course.courseName.toLowerCase()] = course.overallProgress;
        });
        
        setCoursesProgress(progressMap);
      } catch (error) {
        console.error('Error loading courses progress:', error);
        // Fallback to empty progress
        setCoursesProgress({});
      } finally {
        setLoading(false);
      }
    };

    loadCoursesProgress();
  }, [applicantId, refresh]);

  const getCourseProgress = (courseName) => {
    const key = courseName.toLowerCase();
    return coursesProgress[key] || 0;
  };

  const filteredCourses = useMemo(() => {
    return coursesData.filter((course) =>
      course.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, refresh]);

  return (
    <div className="lms-courses-page">
      <div className="border-style">
        <div className="blur-border-style"></div>

        <div className="dashboard__content">
          <div className="row extraSpace">
            <div className="col-lg-12 col-md-12">

              <div className="main-header-row">
                <h1 className="main-heading">Tech Courses</h1>

                <div className="hackathon-search-box">
                  <input
                    type="text"
                    placeholder="Search Courses...."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="hackathon-search-input"
                  />
                </div>
              </div>

              <div className="tv-grid">
                {filteredCourses.map((course) => {
                  const progress = getCourseProgress(course.name);

                  return (
                    <article
                      key={course.id}
                      className="tv-card"
                      onClick={() =>
                        navigate(`/course/${course.name.toLowerCase()}`)
                      }
                    >
                      <div className="tv-media">
                        <img src={course.img} alt={course.name} />
                      </div>

                      <div className="tv-content">
                        <h4>{course.name}</h4>

                        {/* Progress Bar */}
                        <div style={{
                          height: "6px",
                          background: "#eee",
                          borderRadius: "10px",
                          overflow: "hidden"
                        }}>
                          <div
                            style={{
                              width: `${progress}%`,
                              height: "100%",
                              background: "#e49723ff"
                            }}
                          />
                        </div>

                        <p style={{ fontSize: "12px" }}>
                          {progress}% completed
                        </p>

                        {/* Start / Continue Button */}
                        <div style={{ marginTop: "8px" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/course/${course.name.toLowerCase()}`);
                            }}
                            style={{
                              fontSize: "13px",
                              background: parseInt(progress) > 0
                                ? "linear-gradient(90deg, #f7c191ff 0%, #f7c191ff 100%)"
                                : "linear-gradient(90deg, #FBBB5C 0%, #E66A0E 100%)",
                              color: parseInt(progress) > 0 ? "#b85809ff" : "#fff",
                              cursor: "pointer",
                              border: "none",
                              borderRadius: "4px",
                              padding: "6px 20px",
                              width: "100%",
                              boxShadow: parseInt(progress) > 0
                                ? "0px 0px 12px #f7c191ff"
                                : "0px 0px 15px #F7AA4B",
                              height: "32px",
                              fontWeight: "600",
                            }}
                          >
                            {parseInt(progress) > 0 ? "▶ Continue" : "▶ Start Course"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantCourses;