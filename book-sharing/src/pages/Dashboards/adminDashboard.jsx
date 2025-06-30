import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import "../../styles/AdminDashboard.css"; // Ensure this CSS file is comprehensive
import logo from "../../assests/images/logo.jpg";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";

import books1Image from "../../assests/images/books1.png"; // Import the image for the dashboard section


// Import axiosConfig for API calls
import axiosConfig from "../../axiosConfig";

// Make sure Font Awesome CSS is linked, e.g., in public/index.html or imported here
import '@fortawesome/fontawesome-free/css/all.min.css';


// --- DashboardStatsCard Component (Moved from its own file) ---
const DashboardStatsCard = ({ title, count, icon, className }) => {
  const [displayCount, setDisplayCount] = useState(0);
  const ref = useRef(null);
  const animationDuration = 1500; // 1.5 seconds for the count animation

  useEffect(() => {
    if (typeof count !== 'number' || isNaN(count)) {
      setDisplayCount(0);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            let startTimestamp;
            const animateCount = (timestamp) => {
              if (!startTimestamp) startTimestamp = timestamp;
              const progress = Math.min((timestamp - startTimestamp) / animationDuration, 1);
              setDisplayCount(Math.floor(progress * count));

              if (progress < 1) {
                requestAnimationFrame(animateCount);
              }
            };
            requestAnimationFrame(animateCount);
            observer.disconnect(); // Stop observing once animation starts
          }
        });
      },
      { threshold: 0.5 } // Trigger when 50% of the element is visible
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [count, animationDuration]);

  return (
    <div className={`dashboard-stats-card ${className || ''}`} ref={ref}>
      <div className="dashboard-stats-card-icon">
        {icon}
      </div>
      <div className="dashboard-stats-card-content">
        <div className="dashboard-stats-card-title">{title}</div>
        <div className="dashboard-stats-card-count">{displayCount}</div>
      </div>
    </div>
  );
};
// --- End DashboardStatsCard Component ---


function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const location = useLocation();

  const isDashboardHome = location.pathname === "/admin";

  // --- State for Dashboard Counts ---
  const [totalBooksCount, setTotalBooksCount] = useState(0);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);

  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setSidebarCollapsed(savedState === "true");
    }

    // --- Fetch Dashboard Stats on component mount if on dashboard home ---
    if (isDashboardHome) {
      const fetchDashboardStats = async () => {
        setLoadingStats(true);
        setStatsError(null);
        try {
          const token = localStorage.getItem("token");
          const headers = { Authorization: `Bearer ${token}` };

          // Fetch total users
          const usersRes = await axiosConfig.get("/api/user", { headers });
          const fetchedUsers = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.users || [];
          setTotalUsersCount(fetchedUsers.length);

          // Fetch total books
          // Adjust API endpoint as per your backend
          const booksRes = await axiosConfig.get("/api/books", { headers });
          const fetchedBooks = Array.isArray(booksRes.data) ? booksRes.data : booksRes.data.books || [];
          setTotalBooksCount(fetchedBooks.length);

        } catch (err) {
          console.error("Failed to fetch dashboard stats:", err);
          setStatsError("Failed to load dashboard statistics.");
          setTotalBooksCount(0);
          setTotalUsersCount(0);
        } finally {
          setLoadingStats(false);
        }
      };
      fetchDashboardStats();
    }
  }, [isDashboardHome]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebarCollapsed", newState);
      return newState;
    });
  };

  const toggleDropdown = () => setShowDropdown((prev) => !prev);

  const toggleMenu = (itemName) => {
    setOpenMenus((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    {
      name: "Manage User",
      subItems: [
        { label: "Register User", link: "/admin/register" },
        { label: "Users", link: "/admin/users" },
        { label: "Manage Access", link: "/admin/manage-access" },
      ],
    },
    {
      name: "Manage Data",
      subItems: [{ label: "All Data", link: "/admin/manage-data" }],
    },
    {
      name: "Manage Deliverables",
      subItems: [{ label: "Books", link: "/admin/books" }],
    },
    {
      name: "Inputs",
      subItems: [
        { label: "Request Access", link: "/admin/request-access" },
        { label: "Activity Log", link: "/admin/activity-log" },
        { label: "Client Inputs", link: "/admin/client-inputs" },
      ],
    },
    {
      name: "Explore",
      subItems: [
        { label: "Books", link: "/admin/explore-books" },
      ],
    },
  ];

  return (
    <div className={`dashboard-container ${sidebarCollapsed ? "collapsed" : ""}`}>
      {sidebarCollapsed && (
        <button className="floating-toggle-btn" onClick={toggleSidebar}>
          ☰
        </button>
      )}

      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/admin">
            <img src={logo} alt="Logo" className="sidebar-logo" />
          </Link>
          {!sidebarCollapsed && (
            <button className="toggle-btn" onClick={toggleSidebar}>×</button>
          )}
        </div>

        <div className="sidebar-scrollable">
          <ul className="nav-links">
            {navItems.map((item, index) => (
              <li key={item.name} className="nav-item">
                {index !== 0 && <hr style={{ border: "0.5px solid #ccc", margin: "10px 0" }} />}
                <div
                  className="nav-link-with-toggle"
                  onClick={() => item.subItems.length > 0 && toggleMenu(item.name)}
                >
                  <span>{item.name}</span>
                  {item.subItems.length > 0 &&
                    (openMenus[item.name] ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />)}
                </div>

                {item.subItems.length > 0 && openMenus[item.name] && (
                  <ul className="sub-menu">
                    {item.subItems.map((sub, idx) => (
                      <li key={idx}>
                        <Link to={sub.link}>{sub.label}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="main-content">
        <div className="background">
          <header className="top-navbar">
            <div className={`user-info ${showDropdown ? "active" : ""}`} onClick={toggleDropdown} ref={dropdownRef}>
              <span className="user-avatar">{user?.name?.charAt(0).toUpperCase() || "A"}</span>
              <span className="username">{user?.name || "Admin"}</span>

              {showDropdown && (
                <div className="user-dropdown">
                  <div className="dropdown-avatar-icon">👤</div>
                  <div className="dropdown-info">
                    <strong>{user?.name || "Admin"}</strong>
                    <p>{user?.email || "admin@example.com"}</p>
                  </div>
                  <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          </header>

          <section className="wrapper">
            {isDashboardHome ? (
              <>
                <div className="dashboard-row">
                  <div className="dashboard-box">
                    <div className="dashboard-flex">
                      <div className="dashboard-text">
                        <div className="dashboard-bg">
                          <h1>Books</h1>
                        </div>
                        <p>
                          Every page you open is a door to something new, a chance to grow,
                          connect, and inspire. From local insights to global knowledge,
                          these are treasures not hidden — but uploaded, waiting for you. Go
                          beyond textbooks and step into a world where your next breakthrough
                          is just one click away.
                        </p>
                        <div className="button-container">
                          <Link to="/admin/explore-books" className="dashboard-button">
                            Explore Books
                          </Link>
                          <Link to="/admin/books" className="dashboard-button">
                            Manage Books
                          </Link>
                        </div>
                      </div>
                      <img src={books1Image} alt="Books Collection" className="book-img" />
                    </div>
                  </div>
                </div>
                {loadingStats ? (
                  <div className="dashboard-stats-grid"> {/* Still use dashboard-stats-grid for general styling */}
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
                      <div className="loading-spinner small-spinner"></div>
                      <p>Loading dashboard statistics...</p>
                    </div>
                  </div>
                ) : statsError ? (
                  <div className="dashboard-stats-grid"> {/* Still use dashboard-stats-grid for general styling */}
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: 'red' }}>
                      <p>{statsError}</p>
                    </div>
                  </div>
                ) : (
                  <div className="dashboard-stats-grid"> {/* This container will manage the overall grid layout */}
                    <div className="dashboard-stats-horizontal"> {/* NEW: This container ensures side-by-side */}
                      <DashboardStatsCard
                        title="Total Books"
                        count={totalBooksCount}
                        icon={<i className="fas fa-book"></i>}
                        className="total-books"
                      />
                      <DashboardStatsCard
                        title="Total Users"
                        count={totalUsersCount}
                        icon={<i className="fas fa-users"></i>}
                        className="total-users"
                      />
                      {/* Add more DashboardStatsCard components here as needed */}
                      {/* If you add more, they will wrap to the next row if the CSS for .dashboard-stats-horizontal is flex-wrap: wrap */}
                    </div>
                  </div>
                )}
                {/* --- Dashboard Stats Section (Now uses the internally defined component) --- */}

                {/* --- End Dashboard Stats Section --- */}

              </>
            ) : (
              <Outlet />
            )}
          </section>

        </div>

      </main>

    </div>
  );
}

export default Dashboard;