import { useState, useEffect } from 'react';
import { Link, useLoaderData } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faUserMd, 
  faCalendarCheck, 
  faFileAlt, 
  faDollarSign, 
  faExclamationTriangle,
  faChartLine,
  faCog,
  faBullhorn,
  faShieldAlt,
  faDatabase
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/admin/Dashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeBroadcast, setActiveBroadcast] = useState(null);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:8000/api/admin/stats/', {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          throw new Error('Failed to fetch stats');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const dismissBroadcast = () => {
    setActiveBroadcast(null);
  };

  if (loading) {
    return (
      <main className='admin-dashboard'>
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className='admin-dashboard'>
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
        </div>
        <div className="error-message">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <p>Error loading dashboard: {error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className='admin-dashboard'>
      {/* Active Broadcast Banner */}
      {activeBroadcast && (
        <div className="broadcast-banner">
          <div className="broadcast-content">
            <FontAwesomeIcon icon={faBullhorn} className="broadcast-icon" />
            <span className="broadcast-message">{activeBroadcast.message}</span>
          </div>
          <button className="dismiss-btn" onClick={dismissBroadcast}>
            ×
          </button>
        </div>
      )}

      {/* Dashboard Header */}
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Laboratory Management & System Overview</p>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card patients">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats?.total_patients || 0}</h3>
            <p className="stat-label">Total Patients</p>
          </div>
        </div>

        <div className="stat-card staff">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faUserMd} />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats?.total_staff || 0}</h3>
            <p className="stat-label">Total Staff</p>
            <div className="stat-breakdown">
              <span>{stats?.total_lab_tech || 0} Lab Techs</span>
              <span>{stats?.total_pathologist || 0} Pathologists</span>
            </div>
          </div>
        </div>

        <div className="stat-card appointments">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faCalendarCheck} />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats?.pending_appointments || 0}</h3>
            <p className="stat-label">Pending Appointments</p>
            <div className="stat-secondary">
              {stats?.completed_appointments || 0} completed
            </div>
          </div>
        </div>

        <div className="stat-card lab">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faDatabase} />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">{stats?.reports_completed || 0}</h3>
            <p className="stat-label">Reports Ready</p>
            <div className="stat-breakdown">
              <span>{stats?.samples_received || 0} received</span>
              <span>{stats?.samples_in_analysis || 0} in analysis</span>
            </div>
          </div>
        </div>

        <div className="stat-card revenue">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faDollarSign} />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">${stats?.total_revenue?.toFixed(2) || '0.00'}</h3>
            <p className="stat-label">Total Revenue</p>
            <div className="stat-secondary">
              {stats?.pending_invoices || 0} pending invoices
            </div>
          </div>
        </div>

        <div className="stat-card security">
          <div className="stat-icon">
            <FontAwesomeIcon icon={faShieldAlt} />
          </div>
          <div className="stat-content">
            <h3 className="stat-number">100%</h3>
            <p className="stat-label">System Status</p>
            <div className="stat-secondary">
              All systems operational
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section (Placeholder for future implementation) */}
      <section className="charts-section">
        <h2 className="section-title">
          <FontAwesomeIcon icon={faChartLine} className="section-icon" />
          System Analytics
        </h2>
        <div className="charts-grid">
          <div className="chart-container">
            <h3>Revenue Trend</h3>
            <div className="chart-placeholder">
              <p>Chart implementation coming soon</p>
            </div>
          </div>
          <div className="chart-container">
            <h3>Appointment Volume</h3>
            <div className="chart-placeholder">
              <p>Chart implementation coming soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/admin/users" className="action-card">
            <div className="action-icon">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div className="action-content">
              <h3>Manage Users</h3>
              <p>Create, edit, and manage user accounts</p>
            </div>
          </Link>

          <Link to="/admin/config" className="action-card">
            <div className="action-icon">
              <FontAwesomeIcon icon={faCog} />
            </div>
            <div className="action-content">
              <h3>Lab Configuration</h3>
              <p>Configure test analytes and normal ranges</p>
            </div>
          </Link>

          <Link to="/admin/audit" className="action-card">
            <div className="action-icon">
              <FontAwesomeIcon icon={faShieldAlt} />
            </div>
            <div className="action-content">
              <h3>Audit Logs</h3>
              <p>Review system activity and changes</p>
            </div>
          </Link>

          <Link to="/admin/broadcasts" className="action-card">
            <div className="action-icon">
              <FontAwesomeIcon icon={faBullhorn} />
            </div>
            <div className="action-content">
              <h3>System Broadcasts</h3>
              <p>Send announcements to all users</p>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
