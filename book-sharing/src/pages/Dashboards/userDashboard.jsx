import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import "../../styles/userDashboard.css";
import logo from "../../assests/images/logo.jpg";
import { FaUserCircle } from "react-icons/fa";
import img1 from "../../assests/images/img1.jpg";
import img2 from "../../assests/images/img2.jpg";
import axios from "../../axiosConfig";
 
function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
 
  const [openMenus, setOpenMenus] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const dropdownRef = useRef(null);
  const isDashboardHome = location.pathname === "/user/dashboard";

  useEffect(() => {
    // This effect runs whenever the user ID becomes available.
    if (user?.user_id) {
      const fetchUserDetails = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`/api/user/${user.user_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUserDetails(res.data);
        } catch (error) {
          console.error("Failed to fetch user details:", error);
        }
      };

      fetchUserDetails();
    }
  }, [user]);
 
  const toggleMenu = (index) => {
    setOpenMenus((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };
 
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
 
  const toggleUserDropdown = () => {
    setUserDropdownOpen((prev) => !prev);
  };
 
  const handleLogout = () => {
    logout();
    navigate("/");
  };
 
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setUserDropdownOpen(false);
      }
    };
 
    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
 
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownOpen]);
 
  const menuItems = [
    {
      name: "My Books",
      subItems: [
        { name: "Issued Books", link: "/user/dashboard/issued-books" },
      ],
    },
    {
      name: "Client Input",
      subItems: [
        { name: "Books upload", link: "/user/dashboard/upload-book" },
      ],
    },
    // {
    //   name: "Support",
    //   subItems: [
    //     { name: "Contact Us", link: "/user/dashboard/contact-us" },
    //     { name: "FAQ", link: "/user/dashboard/faq" },
    //   ],
    // },
  ];
 
  return (
    <div className={`dashboard-container ${sidebarCollapsed ? "collapsed" : ""}`}>
      <button className="floating-toggle-btn" onClick={toggleSidebar}>
        ☰
      </button>
 
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/user/dashboard">
            <img src={logo} alt="Logo" className="sidebar-logo" />
          </Link>
          <button className="toggle-btn" onClick={toggleSidebar}>
            ☰
          </button>
        </div>
        <ul className="nav-links">
          {menuItems.map((item, index) => (
            <li className="nav-item" key={index}>
              <div
                className="nav-link-with-toggle"
                onClick={() => toggleMenu(index)}
              >
                {item.name}
                <span>{openMenus[index] ? "▲" : "▼"}</span>
              </div>
              {openMenus[index] && (
                <ul className="sub-menu">
                  {item.subItems.map((subItem, subIndex) => (
                    <li key={subIndex}>
                      <Link to={subItem.link}>{subItem.name}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </aside>
 
<main className="main-content">
        <header className="top-navbar">
          <div
            className="user-info"
            onClick={toggleUserDropdown}
            ref={dropdownRef}
          >
            {/* The initial display is fine, so no changes here */}
            <span className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </span>
            <span className="username">{user?.name || "User"}</span>
 
     {userDropdownOpen && (
              <div className="user-dropdown-menu">
                <div className="dropdown-profile">
                  <FaUserCircle size={48} color="#4A5568" />
                  <div className="dropdown-user-details">
                    <div className="dropdown-name">
                      {userDetails?.name || user?.name || "User"}
                    </div>
                    <div className="dropdown-email">
                      {userDetails?.email || "user@example.com"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="logout-button"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>
 
        <section className="content-wrapper">
          {isDashboardHome ? (
            <div className="user-dashboard-home">
              {/* Issued Books Section */}
              <section className="dashboard-section section-light improved-user-layout">
 
                <div className="text-block align-text">
                  <h2>Track Your Books Easily</h2>
                  <p>
                    Stay on top of your reading and responsibilities with a smart book tracking system built just for you.
                    Know exactly which books you've borrowed, when they're due, and get timely updates so you never miss a return.
                    Need more time? Request renewals in just a click — no queues, no paperwork.
 
                  </p>
                  <div className="button-wrapper">
                    <button
                      onClick={() => navigate("/user/dashboard/issued-books")}
                      className="dashboard-button rounded-btn"
                    >
                      View Issued Books
                    </button>
                  </div>
 
                </div>
                <div className="image-block logo-block">
                  <img src={img1} alt="Issued Books" className="logo-image larger-img" />
                </div>
              </section>
 
              {/* Upload Book Section */}
              <section className="dashboard-section section-light improved-user-layout">
                <div className="image-block logo-block">
                  <img src={img2} alt="Upload Books" className="logo-image larger-img" />
                </div>
                <div className="text-block align-text">
                  <h2>Upload Book</h2>
                  <p>
                    Give Your Inputs on Your Issued Books if any changes are required.
                  </p>
                  <div className="button-wrapper">
                    <button
                      onClick={() => navigate("/user/dashboard/upload-book")}
                      className="dashboard-button rounded-btn"
                    >
                      Upload Book
                    </button>
                  </div>
                </div>
              </section>
            </div>
 
          ) : (
            <Outlet />
          )}
 
 
        </section>
      </main>
    </div>
  );
}
 
export default UserDashboard;
 