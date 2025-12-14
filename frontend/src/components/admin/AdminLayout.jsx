import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTachometerAlt,
  faUsers, 
  faCog, 
  faShieldAlt, 
  faBullhorn,
  faBars,
  faTimes,
  faSignOutAlt,
  faUserShield
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/admin/AdminLayout.css';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeBroadcast, setActiveBroadcast] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check user role and authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');

    if (!token) {
      navigate('/login');
      return;
    }

    if (userRole !== 'admin') {
      // Redirect non-admin users to their appropriate dashboard
      switch (userRole) {
        case 'patient':
          navigate('/patient');
          break;
        case 'lab_tech':
          navigate('/hematology');
          break;
        case 'pathologist':
          navigate('/hematology');
          break;
        default:
          navigate('/');
      }
      return;
    }

    setUser({ role: userRole, username });
  }, [navigate]);

  // Fetch active broadcast
  useEffect(() => {
    const fetchActiveBroadcast = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:8000/api/admin/broadcasts/active/', {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          setActiveBroadcast(data);
        }
      } catch (err) {
        console.error('Failed to fetch active broadcast:', err);
      }
    };

    fetchActiveBroadcast();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  if (!user) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Verifying admin access...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Active Broadcast Banner */}
      {activeBroadcast && (
        <div className="layout-broadcast-banner">
          <div className="broadcast-content">
            <FontAwesomeIcon icon={faBullhorn} className="broadcast-icon" />
            <span className="broadcast-message">{activeBroadcast.message}</span>
          </div>
          <button 
            className="dismiss-btn" 
            onClick={() => setActiveBroadcast(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <img src="/src/assets/logo.png" alt="PathoScope" className="logo-img" />
            <span className="logo-text">Admin Panel</span>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(false)}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            <li className="nav-item">
              <Link 
                to="/admin" 
                className={`nav-link ${isActiveRoute('/admin') && location.pathname === '/admin' ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <FontAwesomeIcon icon={faTachometerAlt} className="nav-icon" />
                <span className="nav-text">Dashboard</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link 
                to="/admin/users" 
                className={`nav-link ${isActiveRoute('/admin/users') ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <FontAwesomeIcon icon={faUsers} className="nav-icon" />
                <span className="nav-text">User Management</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link 
                to="/admin/config" 
                className={`nav-link ${isActiveRoute('/admin/config') ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <FontAwesomeIcon icon={faCog} className="nav-icon" />
                <span className="nav-text">Lab Configuration</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link 
                to="/admin/audit" 
                className={`nav-link ${isActiveRoute('/admin/audit') ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <FontAwesomeIcon icon={faShieldAlt} className="nav-icon" />
                <span className="nav-text">Audit Logs</span>
              </Link>
            </li>

            <li className="nav-item">
              <Link 
                to="/admin/broadcasts" 
                className={`nav-link ${isActiveRoute('/admin/broadcasts') ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <FontAwesomeIcon icon={faBullhorn} className="nav-icon" />
                <span className="nav-text">System Broadcasts</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              <FontAwesomeIcon icon={faUserShield} />
            </div>
            <div className="user-details">
              <span className="user-name">{user.username}</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Navigation Bar */}
        <header className="admin-header">
          <button 
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
          
          <div className="header-title">
            <h1>PathoScope Admin</h1>
          </div>

          <div className="header-actions">
            <div className="admin-indicator">
              <FontAwesomeIcon icon={faUserShield} />
              <span>Administrator</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
