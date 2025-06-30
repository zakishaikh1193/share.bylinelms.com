import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import "../../styles/userDashboard.css";
import logo from "../../assests/images/logo.jpg";
import img1 from "../../assests/images/img1.png";
import { FaUserCircle, FaChevronDown, FaChevronUp } from "react-icons/fa";
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
 
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [combinedStats, setCombinedStats] = useState({});
 
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsedUser");
    if (savedState !== null) {
      setSidebarCollapsed(savedState === "true");
    }
  }, []);
 
  useEffect(() => {
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
  }, [user?.user_id]);
 
  useEffect(() => {
    const fetchIssuedBooks = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("User ID:", user?.user_id);
 
        const res = await axios.get(`/api/user/${user.user_id}/issued-books`, {
          headers: { Authorization: `Bearer ${token}` },
        });
 
        console.log("Issued Books Response:", res.data);
        const books = Array.isArray(res.data) ? res.data : [];
        setIssuedBooks(books);
 
        const combined = {};
        books.forEach((book) => {
          const subject = book.subject || "Unknown Subject";
          const grade = book.grade || "Unknown Grade";
          const key = `${subject} (Grade ${grade})`;
          combined[key] = (combined[key] || 0) + 1;
        });
 
        console.log("Combined Stats:", combined);
        setCombinedStats(combined);
      } catch (err) {
        console.error("Failed to fetch issued books:", err);
      }
    };
 
    if (user?.user_id) {
      fetchIssuedBooks();
    } else {
      console.warn("User ID not available yet.");
    }
  }, [user?.user_id]);
 
  const toggleMenu = (index) => {
    setOpenMenus((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };
 
  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem("sidebarCollapsedUser", newState);
      return newState;
    });
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
 
  const menuItems = [
    {
      name: "My Books",
      subItems: [{ name: "Issued Books", link: "/user/dashboard/issued-books" }],
    },
    {
      name: "Client Input",
      subItems: [{ name: "Books Upload", link: "/user/dashboard/upload-book" }],
    },
  ];
 
  return (
    <div className={`dashboard-container ${sidebarCollapsed ? "collapsed" : ""}`}>
      {sidebarCollapsed && (
        <button className="floating-toggle-btn" onClick={toggleSidebar}>☰</button>
      )}
 
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/user/dashboard">
            <img src={logo} alt="Logo" className="sidebar-logo" />
          </Link>
          {!sidebarCollapsed && (
            <button className="toggle-btn" onClick={toggleSidebar}>×</button>
          )}
        </div>
 
        <ul className="nav-links">
          {menuItems.map((item, index) => (
            <li className="nav-item" key={index}>
              {index !== 0 && <hr style={{ border: "0.5px solid #ccc", margin: "10px 0" }} />}
              <div className="nav-link-with-toggle" onClick={() => toggleMenu(index)}>
                <span>{item.name}</span>
                {item.subItems.length > 0 &&
                  (openMenus[index] ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />)}
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
        <div className="background">
          <header className="top-navbar">
            <div
              className={`user-info ${userDropdownOpen ? "active" : ""}`}
              onClick={toggleUserDropdown}
              ref={dropdownRef}
            >
              <span className="user-avatar">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
              <span className="username">{user?.name || "User"}</span>
 
              {userDropdownOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-avatar-icon">
                    <FaUserCircle size={48} />
                  </div>
                  <div className="dropdown-info">
                    <strong>{userDetails?.name || user?.name || "User"}</strong>
                    <p>{userDetails?.email || "user@example.com"}</p>
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
                          <h1>Your Books</h1>
                        </div>
                        <p>
                          Stay organized with your issued books, track due dates, and upload any feedback.
                          Empower your reading journey with one simple dashboard.
                        </p>
                        <div className="button-container">
                          <Link to="/user/dashboard/issued-books" className="dashboard-button">
                            View Issued Books
                          </Link>
                        </div>
                      </div>
                      <img src={img1} alt="Issued Books" className="book-img" />
                    </div>
                  </div>
                </div>
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
 
export default UserDashboard;