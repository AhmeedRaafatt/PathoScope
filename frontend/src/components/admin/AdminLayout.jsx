import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faUsers,
  faCog,
  faShieldAlt,
  faBullhorn,
  faSignOutAlt,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import logo from "../../assets/logo.png";
import "../../styles/admin/AdminLayout.css";

export default function AdminLayout() {
  const [activeBroadcast, setActiveBroadcast] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Authentication Check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const navItems = [
    { path: "/admin", icon: faTachometerAlt, label: "Dashboard" },
    { path: "/admin/users", icon: faUsers, label: "User Management" },
    { path: "/admin/config", icon: faCog, label: "Lab Config" },
    { path: "/admin/audit", icon: faShieldAlt, label: "Audit Logs" },
    { path: "/admin/broadcasts", icon: faBullhorn, label: "Broadcasts" },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="PathoScope Logo" className="sidebar-logo" />
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${
                location.pathname === item.path ? "active" : ""
              }`}
            >
              <FontAwesomeIcon icon={item.icon} fixedWidth />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="logout-btn"
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} fixedWidth />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-content">
        {/* Compact Header at Top */}
        <header className="admin-header">
          <div className="header-title">
            <h1>Admin Portal</h1>
          </div>
          <div className="admin-indicator">
            <FontAwesomeIcon icon={faUserShield} />
            <span>System Administrator</span>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: "24px 32px", background: "#FAFAFD", overflowY: "auto" }}>
          {activeBroadcast && (
            <div className="broadcast-banner">
              <span>{activeBroadcast.message}</span>
              <button onClick={() => setActiveBroadcast(null)}>Dismiss</button>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
