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
import { getToken, getUserRole, clearAuthData } from "../../utls";
import logo from "../../assets/logo.png";
import "../../styles/admin/AdminLayout.css";

export default function AdminLayout() {
  const [activeBroadcast, setActiveBroadcast] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Authentication and Role Check
  useEffect(() => {
    const token = getToken();
    const userRole = getUserRole();
    
    // Check if token exists and user role is admin
    if (!token || userRole !== "admin") {
      // Redirect to login if not authenticated or not admin
      clearAuthData();
      navigate("/login", { replace: true });
      setIsAuthorized(false);
    } else {
      setIsAuthorized(true);
    }
  }, [navigate]);

  const navItems = [
    { path: "/admin", icon: faTachometerAlt, label: "Dashboard" },
    { path: "/admin/users", icon: faUsers, label: "User Management" },
    { path: "/admin/config", icon: faCog, label: "Lab Config" },
    { path: "/admin/audit", icon: faShieldAlt, label: "Audit Logs" },
    { path: "/admin/broadcasts", icon: faBullhorn, label: "Broadcasts" },
  ];

  if (!isAuthorized) {
    return null; // Don't render while checking auth
  }

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
              clearAuthData();
              navigate("/login", { replace: true });
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
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
