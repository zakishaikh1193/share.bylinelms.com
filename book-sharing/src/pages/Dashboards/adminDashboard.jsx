import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import "../../styles/AdminDashboard.css";
import logo from "../../assests/images/logo.jpg";
import { FaChevronDown, FaChevronUp, FaUserCircle } from "react-icons/fa";
import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import booksImage from "../../assests/images/books.jpg";
import books1Image from "../../assests/images/books1.jpg";
 
function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const location = useLocation();
 
  const isDashboardHome = location.pathname === "/admin";
 
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setSidebarCollapsed(savedState === "true");
    }
  }, []);
 
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
        <header className="top-navbar">
          <div className={`user-info ${showDropdown ? "active" : ""}`} onClick={toggleDropdown} ref={dropdownRef}>
            <span className="user-avatar">{user?.name?.charAt(0).toUpperCase() || "A"}</span>
            <span className="username">{user?.name || "Admin"}</span>
 
            {showDropdown && (
              <div className="user-dropdown">
                <div className="dropdown-profile">
                  <div className="dropdown-info">
                    <strong>{user?.name || "Admin"}</strong>
                    <p>{user?.email || "admin@example.com"}</p>
                  </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </header>
 
        <section className="content-wrapper">
          {isDashboardHome ? (
            <div className="dashboard-row">
              <div className="dashboard-box">
                <div className="dashboard-flex">
                  <img src={books1Image} alt="Books Collection" className="book-img" />
                  <div className="dashboard-text">
                    <div className="dashboard-bg"><h1 className="text-white">Explore Books</h1></div>
                    
                    <p>
                      Every page you open is a door to something new, a chance to grow, connect, and inspire. From local insights to global knowledge, these are treasures not hidden — but uploaded, waiting for you. Go beyond textbooks and step into a world where your next breakthrough is just one click away.
                    </p>
                    <Link to="/admin/explore-books" className="dashboard-button">Explore Books</Link>
                  </div>
                </div>
              </div>
              <div className="dashboard-box">
                <div className="dashboard-flex">
                 
                  <div className="dashboard-text">
                    <div className="dashboard-bg"><h1 className="text-white">Books</h1></div>
                    
                    <p>"Dive into your comprehensive book repository to organize, update, and oversee your educational materials across countries, grades, and subjects."   </p>
                    <Link to="/admin/books" className="dashboard-button">Books</Link>
                   
                  </div>
                  <img src={booksImage} alt="Book Collection" className="book-img" />
                </div>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </section>
      </main>
    </div>
  );
}
 
export default Dashboard;