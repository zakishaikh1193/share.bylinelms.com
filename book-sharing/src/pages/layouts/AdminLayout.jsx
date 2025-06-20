// src/components/layout/AdminLayout.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assests/images/logo.jpg";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { Link, Outlet, useLocation } from "react-router-dom";
import "../../styles/AdminDashboard.css";

const navItems = [
  {
    name: "Manage User",
    subItems: [
      { label: "Register User", link: "/admin/register" },
      { label: "Users", link: "/admin/users" },
      { label: "Manage Access", link: "/admin/manage-access" } 
    ]
  },
  {
    name: "Manage Deliverables",
    subItems: [
      { label: "Books", link: "/admin/books" }
    ]
  },
  {
    name: "Manage Data",
    subItems: [
      { label: "Country", link: "/admin/country" },
      { label: "Grade", link: "/admin/grade" },
      { label: "Subjects", link: "/admin/subject" },
      { label: "Book Type", link: "/admin/book-type" },
      { label: "Languages", link: "/admin/languages" },
      { label: "Version", link: "/admin/versions" }
    ]
  },
  
  {
    name: "Inputs",
    subItems: [
      { label: "Request Access", link: "/admin/request-access" },
      { label: "Activity Log", link: "/admin/activity-log" },
      { label: "Client Inputs", link: "/admin/client-inputs" },
    ]
  },
  {
    name: "Explore",
    subItems: [
      { label: "Covers", link: "/admin/explore-covers" },
      { label: "Books", link: "/admin/explore-books" },
    ]
  }
];

function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const { user } = useAuth();
  const location = useLocation();

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const toggleMenu = (itemName) => {
    setOpenMenus((prev) => ({ ...prev, [itemName]: !prev[itemName] }));
  };

  return (
    <div className={`dashboard-container ${sidebarCollapsed ? "collapsed" : ""}`}>
      {sidebarCollapsed && (
        <button className="floating-toggle-btn" onClick={toggleSidebar}>☰</button>
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/admin">
            <img src={logo} alt="Company Logo" className="sidebar-logo" />
          </Link>
          {!sidebarCollapsed && (
            <button className="toggle-btn" onClick={toggleSidebar}>×</button>
          )}
        </div>

        <ul className="nav-links">
          {navItems.map((item, index) => (
            <li key={item.name} className="nav-item">
              {index !== 0 && <hr style={{ border: "0.5px solid #d0d7e2", margin: "10px 0" }} />}
              <div className="nav-link-with-toggle" onClick={() => toggleMenu(item.name)}>
                <span>{item.name}</span>
                {openMenus[item.name] ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
              </div>
              {openMenus[item.name] && (
                <ul className="sub-menu">
                  {item.subItems.map((sub, idx) => (
                    <li key={idx}>
                      <Link className={location.pathname === sub.link ? 'active' : ''} to={sub.link}>
                        {sub.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-navbar">
          <div
            className="user-info"
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <span className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </span>
            <span className="username">{user?.name || "Admin"}</span>

            {showDropdown && (
              <div className="user-dropdown">
                <div className="dropdown-avatar-icon">👤</div>
                <div className="dropdown-info">
                  <strong>{user?.name || "Admin User"}</strong>
                  <p>{user?.email || "admin@example.com"}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        <section className="content-wrapper">
          <Outlet /> {/* Inject page-specific content here */}
        </section>
      </main>
    </div>
  );
}

export default AdminLayout;
