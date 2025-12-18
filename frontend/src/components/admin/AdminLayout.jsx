import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTachometerAlt, faUsers, faCog, faShieldAlt, 
  faBullhorn, faSignOutAlt, faUserShield 
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/admin/AdminLayout.css';

export default function AdminLayout() {
  const [activeBroadcast, setActiveBroadcast] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Authentication Check (Keep your existing logic here)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
    // ... rest of your auth logic
  }, [navigate]);

  const navItems = [
    { path: '/admin', icon: faTachometerAlt, label: 'Dashboard' },
    { path: '/admin/users', icon: faUsers, label: 'User Management' },
    { path: '/admin/config', icon: faCog, label: 'Lab Config' },
    { path: '/admin/audit', icon: faShieldAlt, label: 'Audit Logs' },
    { path: '/admin/broadcasts', icon: faBullhorn, label: 'Broadcasts' },
  ];

  return (
    <div className="admin-layout">
      {/* 1. Permanent Desktop Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <span>PATHOSCOPE ADMIN</span>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <FontAwesomeIcon icon={item.icon} fixedWidth />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer" style={{ padding: '1.5rem' }}>
          <button 
            className="nav-link" 
            onClick={() => {
              localStorage.clear();
              navigate('/login');
            }}
            style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <FontAwesomeIcon icon={faSignOutAlt} fixedWidth />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Top Header */}
      <header className="admin-header">
        <div className="header-title">
          {/* Dynamic Breadcrumb could go here */}
          <h1>Admin Portal</h1>
        </div>
        <div className="admin-indicator">
          <FontAwesomeIcon icon={faUserShield} style={{ marginRight: '8px' }}/>
          <span>System Administrator</span>
        </div>
      </header>

      {/* 3. Page Content */}
      <main className="admin-content">
        {activeBroadcast && (
           <div className="broadcast-banner">
             <span>{activeBroadcast.message}</span>
             <button onClick={() => setActiveBroadcast(null)}>Dismiss</button>
           </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}