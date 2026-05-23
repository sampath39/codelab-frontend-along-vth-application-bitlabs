import { Link, useLocation, useNavigate } from "react-router-dom";
import $ from "jquery";
import "jquery.cookie";
import "metismenu";
import { useState, useEffect } from "react";
import { useUserContext } from "../common/UserProvider";
import apiClient from "../../services/apiClient";
import ModalLogout from "../common/ModalLogout";
import clearJWTToken from "../common/clearJWTToken";
import logos from "../../images/profileIcon.png";
import NotificationToggleWeb from "../../notifications/NotificationToggleWeb";
import shape8 from "../../images/dashboard/side-nav-icons/power.svg";
import shape7 from "../../images/dashboard/side-nav-icons/techVibes.svg";
import shape6 from "../../images/dashboard/side-nav-icons/innovationArena.svg";
import shape5 from "../../images/dashboard/side-nav-icons/techBuzzShorts.svg";
import shape3 from "../../images/dashboard/side-nav-icons/skillValidation.svg";
import shape4 from "../../images/dashboard/side-nav-icons/mentorSphere.svg";
import shape from "../../images/dashboard/side-nav-icons/dashboard.svg";
import shape2 from "../../images/dashboard/side-nav-icons/buildportfolio.svg";
import "./ApplicantNavBar.css";
import notificationIcon from "../../images/notificationIcon.svg";
import { useRefresh } from "../common/RefreshContext"

function ApplicantNavBar() {
  const location = useLocation();
  const hideSidebarRoutes = ["/course"];
  const hiddenRoutes = ["/applicant-interview-prep", "/applicanthome"];
  const [isOpen, setIsOpen] = useState(
    window.innerWidth >= 1302 &&
    !hideSidebarRoutes.some((route) => location.pathname.startsWith(route))
  );
  const { user } = useUserContext();
  const [imageSrc, setImageSrc] = useState("");
  const [alertCount, setAlertCount] = useState(0);
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  const [isSubAccountVisible, setIsSubAccountVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [hamburgerClass, setHamburgerClass] = useState("fa fa-bars");
  const frompath = location.state?.from;
  const { pathname } = useLocation();
  const { refreshKey } = useRefresh();

  const DEFAULT_CARD = {
    applicantId: null,
    name: "",
    mobileNumber: "",
    email: "",
  };
  const [card, setCard] = useState(DEFAULT_CARD);
  const applicantId = user?.id;

  const handleRedirect = () => {
    navigate("/applicant-interview-prep");
  };

  const shouldHide = hiddenRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  const toggleSubAccount = () => {
    setIsSubAccountVisible(!isSubAccountVisible);
  };

  const fetchCard = async () => {
    try {
      if (!applicantId) return;

      const { data } = await apiClient.get(`/applicant-card/${applicantId}/getApplciantCard`);

      const mappedCard = {
        applicantId: data.applicantId ?? null,
        name: data.name ?? "",
        mobileNumber: data.mobileNumber ?? "",
        email: data.email ?? "",
      };

      setCard(mappedCard);
    } catch (err) {
      console.error("Card API failed:", err.response || err);
      setCard(DEFAULT_CARD);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("jwtToken")) {
      setShowModal(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchCard();
  }, [applicantId, refreshKey]);

  useEffect(() => {
    const updateSidebarClasses = () => {
      const shouldHide = hideSidebarRoutes.some(
        (route) =>
          location.pathname === route ||
          location.pathname.startsWith(route + "/")
      );

      if (window.innerWidth >= 1301 && !shouldHide) {
        document.body.classList.add("grid-handler");
        document.body.classList.add("hide-hamburger");
      } else {
        document.body.classList.add("close-sidebar");
        document.body.classList.remove("hide-hamburger");
      }
    };

    window.addEventListener("resize", updateSidebarClasses);
    updateSidebarClasses();

    return () => window.removeEventListener("resize", updateSidebarClasses);
  }, [pathname]);

  const handleOutsideClick = (event) => {
    const accountElement = document.querySelector(".account");

    if (accountElement && !accountElement.contains(event.target)) {
      setIsSubAccountVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleOutsideClick);
    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  const [requestData, setRequestData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const response = await apiClient.get(
          `/applicant/getApplicantById/${user.id}`
        );

        const newData = {
          identifier: response.data.email,
          password: response.data.password,
        };
        console.log(response.data);

        setRequestData(newData);
      } catch (error) {
        console.error("Error updating profile status:", error);
      }
    };
    fetchData();
  }, [user?.id]);

  const handleToggleMenu = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    if (hamburgerClass === "fa fa-bars") {
      setHamburgerClass("fa fa-arrow-left");
      document.body.classList.remove("close-sidebar");
      document.body.classList.add("grid-handler");
    } else {
      setHamburgerClass("fa fa-bars");
      document.body.classList.add("close-sidebar");
      document.body.classList.remove("grid-handler");
    }
  };

  const hideMenu = (e) => {
    e.stopPropagation();
    setIsOpen(window.innerWidth >= 1302);
    setHamburgerClass("fa fa-bars");
  };

  useEffect(() => {
    const path = location.pathname;

    const isExcluded =
      path === "/applicant-hackathon" ||
      path.startsWith("/applicant-hackathon-details/");

    if (!isExcluded) {
      localStorage.setItem("applicantHackathonTab", "UPCOMING");
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      const shouldHide = hideSidebarRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (shouldHide) {
        setIsOpen(false);
        document.body.classList.add("close-sidebar");
        document.body.classList.remove("grid-handler");
      } else {
        const open = window.innerWidth >= 1302;
        setIsOpen(open);

        if (open) {
          document.body.classList.remove("close-sidebar");
          document.body.classList.add("grid-handler");
        } else {
          document.body.classList.add("close-sidebar");
          document.body.classList.remove("grid-handler");
        }
      }

      setHamburgerClass("fa fa-bars");
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    $("#left-menu-btn").on("click", function (e) {
      e.preventDefault();
      if ($("body").hasClass("sidebar-enable")) {
        $("body").removeClass("sidebar-enable");
        $.cookie("isButtonActive", "0");
      } else {
        $("body").addClass("sidebar-enable");
        $.cookie("isButtonActive", "1");
      }
      if ($(window).width() >= 1400) {
        $("body").toggleClass("show-job");
      } else {
        $("body").removeClass("show-job");
        $.cookie("isButtonActive", null);
      }
    });

    if ($.cookie("isButtonActive") == 1) {
      $("body").addClass("sidebar-enable show-job");
    }

    if (user?.id) {
      apiClient
        .get(`/applicant-image/getphoto/${user.id}`, { responseType: "blob" })
        .then((response) => {
          const imageUrl = URL.createObjectURL(response.data);
          setImageSrc(imageUrl);
        })
        .catch(() => {
          setImageSrc("../images/user/avatar/image-01.jpg");
        });
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      $("#left-menu-btn").off("click");
    };
  }, [pathname, user?.id]);

  const handleLogout = async () => {
    console.log("🔍 ApplicantNavBar handleLogout called");
    try {
      await clearJWTToken();
      window.location.href = "https://jobs.bitlabs.in/candidate";
    } catch (error) {
      console.error("Logout failed", error);
      window.location.href = "https://jobs.bitlabs.in/candidate";
    }
  };

  useEffect(() => {
    fetchAlertCount();
  }, [location.key]);

  useEffect(() => {
    const handleAlertsUpdate = () => {
      fetchAlertCount();
    };
    window.addEventListener('alerts-updated', handleAlertsUpdate);
    return () => {
      window.removeEventListener('alerts-updated', handleAlertsUpdate);
    };
  }, [user?.id]);

  const fetchAlertCount = async () => {
    if (!user?.id) return;
    try {
      const response = await apiClient.get(
        `/notifications/count/${user.id}`
      );

      const count = Number(response.data) || 0;
      console.log("🔔 Alert count response:", response.data, "Setting count to:", count);
      setAlertCount(count);
    } catch (error) {
      console.error("Error fetching alert count:", error);
      setAlertCount(0);
    }
  };

  useEffect(() => {
    const checkUserData = setInterval(() => {
      const storedData = localStorage.getItem("userData");
      if (storedData) {
        setUserData(JSON.parse(storedData));
        clearInterval(checkUserData);
      }
    }, 200);
    console.log(userData);
    return () => clearInterval(checkUserData);
  }, [user?.id]);

  return (
    <div className="applicant-navbar-wrapper">
      <div>
        <div className="menu-mobile-popup">
          <div className="modal-menu__backdrop" />
          <div className="widget-filter">
            <div className="mobile-header">
              <div id="logo" className="logo">
                <a href="/applicanthome">
                  <img
                    src={imageSrc || "../images/user/avatar/image-01.jpg"}
                    alt="Profile"
                    onError={() =>
                      setImageSrc("../images/user/avatar/image-01.jpg")
                    }
                  />
                </a>
              </div>
              <a className="title-button-group">
                <i className="icon-close" />
              </a>
            </div>
            <div className="header-customize-item button">
              <a href="/applicant-update-profile">Upload Resume</a>
            </div>
          </div>
        </div>
        <header id="header" className="header header-default ">
          <div className="tf-container ct2">
            <div className="row">
              <div className="col-md-12">
                <div className="sticky-area-wrap">
                  <div className="header-ct-left">
                    {window.innerWidth < 2000 && (
                      <span
                        id="hamburger"
                        className={hamburgerClass}
                        onClick={handleToggleMenu}
                      ></span>
                    )}
                    <span style={{ width: "20px", height: "2px" }}></span>
                    <div id="logo" className="logo">
                      <a href="/applicanthome">
                        <img className="site-logo" src={logos} alt="Image" />
                      </a>
                    </div>
                  </div>

                  <div className="header-ct-right">
                    <div
                      style={{
                        position: "relative",
                        display: "inline-block",
                        marginTop: "10px",
                        marginRight: "22px",
                      }}
                    >
                      <Link
                        to="/applicant-job-alerts"
                        className={
                          location.pathname === "/applicant-job-alerts"
                            ? "tf-effect active"
                            : ""
                        }
                      >
                        <span className="notify-bell">
                          <img src={notificationIcon} alt="Notifications" />
                          {alertCount > 0 && (
                            <span className="notify-count position-absolute top-0 start-100 translate-middle badge rounded-pill">
                              {alertCount}
                              <span className="visually-hidden">unread messages</span>
                            </span>
                          )}
                        </span>
                      </Link>
                    </div>

                    <div
                      id="specificDiv"
                      className="header-customize-item account"
                    >
                      <div className="profile-icon">
                        <img
                          width="32px"
                          height="32px"
                          src={imageSrc || "../images/user/avatar/image-01.jpg"}
                          alt="Profile"
                          onClick={() => navigate("/applicant-view-profile")}
                          onError={() =>
                            setImageSrc("../images/user/avatar/image-01.jpg")
                          }
                        />
                      </div>
                      {userData && (
                        <div className="user-info" onClick={() => navigate("/applicant-view-profile")}>
                          <p>Hi,</p>
                          <h6 className="user-name">{card?.name}</h6>
                          <p className="user-email">{userData.identifier}</p>
                        </div>
                      )}
                      <div>
                        <div
                          className="toggle-subaccount-icon"
                          onClick={toggleSubAccount}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M11.9998 14.6038C11.8844 14.6038 11.7769 14.5833 11.6773 14.5423C11.5776 14.5013 11.4851 14.4365 11.3998 14.348L6.96602 9.91451C6.82769 9.77918 6.75894 9.61601 6.75977 9.42501C6.76077 9.23401 6.83211 9.07026 6.97377 8.93376C7.11544 8.79709 7.27894 8.72876 7.46427 8.72876C7.64944 8.72876 7.81027 8.79709 7.94677 8.93376L11.9998 12.9865L16.0528 8.93376C16.1828 8.80359 16.342 8.73693 16.5305 8.73376C16.719 8.73043 16.8841 8.79709 17.0258 8.93376C17.1674 9.07026 17.2404 9.23243 17.2445 9.42026C17.2487 9.60809 17.1799 9.77284 17.0383 9.91451L12.6045 14.348C12.516 14.4365 12.4219 14.5013 12.3223 14.5423C12.2226 14.5833 12.1151 14.6038 11.9998 14.6038Z"
                              fill="#5F6368"
                            />
                          </svg>
                        </div>
                      </div>

                      <div
                        className={`sub-account ${isSubAccountVisible ? "show" : ""
                          }`}
                      >
                        <div className="sub-account-item">
                          <a href="/applicant-change-password">
                            <span className="icon-change-passwords" /> Change
                            Password
                          </a>
                        </div>
                        <div className="sub-account-item">
                          <NotificationToggleWeb className="icon-change-passwords" />
                        </div>
                        <div className="sub-account-item">
                          <a onClick={() => setShowModal(true)}>
                            <span className="icon-log-out" /> Log Out{" "}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Updated Sidebar */}
        <div className={`left-menu ${isOpen ? "open" : ""}`} style={{ display: "flex", flexDirection: "column" }}>
          <div id="sidebar-menu" style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            <ul className="downmenu list-unstyled" id="side-menu">
              {/* Dashboard */}
              <li id="tour-dashboard">
                <Link
                  onClick={hideMenu}
                  to="/applicanthome"
                  className={
                    location.pathname === "/applicanthome"
                      ? "tf-effect active"
                      : ""
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    textDecoration: "none",
                  }}
                >
                  <span className="dash-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px" }}>
                    <img
                      src={shape}
                      alt="Dashboard Icon"
                      width="24"
                      height="24"
                    />
                  </span>
                  <span className="dash-titles" style={{ textTransform: "none", color: "#333", fontSize: "16px" }}>
                    Dashboard
                  </span>
                </Link>
              </li>

              {/* Build Portfolio */}
              <li>
                <Link
                  onClick={hideMenu}
                  to="/applicant-view-profile"
                  className={
                    location.pathname === "/applicant-view-profile"
                      ? "tf-effect active"
                      : ""
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    textDecoration: "none",
                  }}
                >
                  <span className="dash-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px" }}>
                    <img
                      src={shape2}
                      alt="Dashboard Icon"
                      width="24"
                      height="24"
                    />
                  </span>
                  <span className="dash-titles" style={{ textTransform: "none", color: "#333", fontSize: "16px" }}>
                    Build portfolio
                  </span>
                </Link>
              </li>

              {/* Skill validation */}
              <li>
                <Link
                  id="tour-skill-validation"
                  onClick={hideMenu}
                  to="/applicant-verified-badges"
                  className={
                    location.pathname === "/applicant-verified-badges"
                      ? "tf-effect active"
                      : ""
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    textDecoration: "none",
                  }}
                >
                  <span className="dash-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px" }}>
                    <img
                      src={shape3}
                      alt="Dashboard Icon"
                      width="24"
                      height="24"
                    />
                  </span>
                  <span className="dash-titles" style={{ textTransform: "none", color: "#333", fontSize: "16px" }}>
                    Skill validation
                  </span>
                </Link>
              </li>

              {/* Mentor sphere */}
              <li>
                <Link
                  onClick={hideMenu}
                  to="/applicant-mentorconnect"
                  className={
                    location.pathname === "/applicant-mentorconnect"
                      ? "tf-effect active"
                      : ""
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    textDecoration: "none",
                  }}
                >
                  <span className="dash-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px" }}>
                    <img
                      src={shape4}
                      alt="Dashboard Icon"
                      width="24"
                      height="24"
                    />
                  </span>
                  <span className="dash-titles" style={{ textTransform: "none", color: "#333", fontSize: "16px" }}>
                    Mentor sphere
                  </span>
                </Link>
              </li>

              {/* Tech buzz shorts */}
              <li>
                <Link
                  onClick={hideMenu}
                  to="/applicant-verified-videos"
                  className={
                    location.pathname === "/applicant-verified-videos"
                      ? "tf-effect active"
                      : ""
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    textDecoration: "none",
                  }}
                >
                  <span className="dash-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px" }}>
                    <img
                      src={shape5}
                      alt="Dashboard Icon"
                      width="24"
                      height="24"
                    />
                  </span>
                  <span className="dash-titles" style={{ textTransform: "none", color: "#333", fontSize: "16px" }}>
                    Tech buzz shorts
                  </span>
                </Link>
              </li>

              {/* Hackathons */}
              <li>
                <Link
                  onClick={hideMenu}
                  to="/applicant-hackathon"
                  className={
                    location.pathname === "/applicant-hackathon" ||
                      frompath === "/applicant-hackathon" ||
                      location.pathname.includes("/applicant-hackathon")
                      ? "tf-effect active"
                      : ""
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    textDecoration: "none",
                  }}
                >
                  <span className="dash-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px" }}>
                    <img
                      src={shape6}
                      alt="Dashboard Icon"
                      width="24"
                      height="24"
                    />
                  </span>
                  <span className="dash-titles" style={{ textTransform: "none", color: "#333", fontSize: "16px" }}>
                    Hackathons
                  </span>
                </Link>
              </li>

              {/* Tech vibes */}
              <li>
                <Link
                  onClick={hideMenu}
                  to="/applicant-blog-list"
                  className={
                    location.pathname === "/applicant-blog-list"
                      ? "tf-effect active"
                      : ""
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    textDecoration: "none",
                  }}
                >
                  <span className="dash-icon blog-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px" }}>
                    <img
                      src={shape7}
                      alt="Dashboard Icon"
                      width="24"
                      height="24"
                    />
                  </span>
                  <span className="dash-titles" style={{ textTransform: "none", color: "#333", fontSize: "16px" }}>
                    Tech vibes
                  </span>
                </Link>
              </li>

              {/* LMS Assignments */}
              <li>
                <Link
                  onClick={hideMenu}
                  to="/applicant-lmscourses-list"
                  className={
                    location.pathname === "/applicant-lmscourses-list"
                      ? "tf-effect active"
                      : ""
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    textDecoration: "none",
                  }}
                >
                  <span className="dash-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px" }}>
                    <i
                      className="fa fa-graduation-cap"
                      style={{ fontSize: "20px", color: "#ff8a00" }}
                    />
                  </span>
                  <span className="dash-titles" style={{ textTransform: "none", color: "#333", fontSize: "16px" }}>
                    LMS Assignments
                  </span>
                </Link>
              </li>

              {/* CodeLab */}
              <li>
                <Link
                  onClick={hideMenu}
                  to="/codelab"
                  className={
                    location.pathname.startsWith("/codelab")
                      ? "tf-effect active"
                      : ""
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    textDecoration: "none",
                  }}
                >
                  <span className="dash-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px" }}>
                    <i
                      className="fa fa-laptop"
                      style={{ fontSize: "20px", color: "#ff8a00" }}
                    />
                  </span>
                  <span className="dash-titles" style={{ textTransform: "none", color: "#333", fontSize: "16px" }}>
                    CodeLab
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Logout Button */}
          <div style={{ marginTop: "auto", marginBottom: "20px" }}>
            <div
              onClick={() => setShowModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                borderRadius: "8px",
                transition: "all 0.3s ease",
                margin: "0 20px", /* Increased horizontal margin to center it */
                gap: "15px",
                padding: "8px 0"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.querySelector("img").style.filter = "none";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.querySelector("img").style.filter = "none";
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={shape8}
                  alt="Dashboard Icon"
                  width="24"
                  height="24"
                />
              </div>
              <span className="dash-titles" style={{ color: "#333", fontSize: "16px", textTransform: "none" }}>
                Logout
              </span>
            </div>
          </div>
        </div>

        <ModalLogout
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={handleLogout}
        />
      </div>
    </div>
  );
}

export default ApplicantNavBar;