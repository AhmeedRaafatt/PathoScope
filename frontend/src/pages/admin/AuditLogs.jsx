import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldAlt,
  faSearch,
  faFilter,
  faExclamationTriangle,
  faDownload,
  faEye,
  faUser,
  faCog,
  faTrash,
  faEdit,
  faSignInAlt,
} from "@fortawesome/free-solid-svg-icons";
import "../../styles/admin/AuditLogs.css";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    pageSize: 50,
  });

  const ACTION_TYPES = [
    { value: "all", label: "All Actions" },
    { value: "CREATE", label: "Create" },
    { value: "UPDATE", label: "Update" },
    { value: "DELETE", label: "Delete" },
    { value: "LOGIN", label: "Login" },
  ];

  // Fetch audit logs
  useEffect(() => {
    fetchAuditLogs();
  }, [searchTerm, actionFilter, pagination.current]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (searchTerm) params.append("search", searchTerm);
      if (actionFilter !== "all") params.append("action_type", actionFilter);
      params.append("page", pagination.current);
      params.append("page_size", pagination.pageSize);

      const response = await fetch(
        `http://127.0.0.1:8000/api/admin/audit-logs/?${params}`,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLogs(data.results || data);
        if (data.count) {
          setPagination((prev) => ({
            ...prev,
            total: Math.ceil(data.count / prev.pageSize),
          }));
        }
      } else {
        throw new Error("Failed to fetch audit logs");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportLogs = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (searchTerm) params.append("search", searchTerm);
      if (actionFilter !== "all") params.append("action_type", actionFilter);
      params.append("export", "csv");

      const response = await fetch(
        `http://127.0.0.1:8000/api/admin/audit-logs/?${params}`,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error("Failed to export logs");
      }
    } catch (err) {
      alert(`Error exporting logs: ${err.message}`);
    }
  };

  const openDetailsModal = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case "CREATE":
        return faEdit;
      case "UPDATE":
        return faCog;
      case "DELETE":
        return faTrash;
      case "LOGIN":
        return faSignInAlt;
      default:
        return faShieldAlt;
    }
  };

  const getActionColor = (actionType) => {
    switch (actionType) {
      case "CREATE":
        return "create";
      case "UPDATE":
        return "update";
      case "DELETE":
        return "delete";
      case "LOGIN":
        return "login";
      default:
        return "default";
    }
  };

  if (loading && logs.length === 0) {
    return (
      <main className="audit-logs">
        <div className="page-header">
          <h1>Audit Logs</h1>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading audit logs...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="audit-logs">
      {/* Page Header */}
      <header className="page-header">
        <h1>
          <FontAwesomeIcon icon={faShieldAlt} className="header-icon" />
          Audit Logs
        </h1>
        <button className="btn-export" onClick={handleExportLogs}>
          <FontAwesomeIcon icon={faDownload} />
          Export Logs
        </button>
      </header>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <p>Error: {error}</p>
        </div>
      )}

      {/* Filters */}
      <section className="filters-section">
        <div className="search-bar">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-dropdown">
          <FontAwesomeIcon icon={faFilter} className="filter-icon" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            {ACTION_TYPES.map((action) => (
              <option key={action.value} value={action.value}>
                {action.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Audit Logs Table */}
      <section className="audit-table-section">
        <div className="table-container">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Target</th>
                <th>Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <FontAwesomeIcon
                      icon={faShieldAlt}
                      className="empty-icon"
                    />
                    <p>No audit logs found</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="log-row">
                    <td className="timestamp-cell">{formatDate(log.timestamp)}</td>
                    <td className="action-cell">
                      <span
                        className={`action-badge ${getActionColor(
                          log.action_type
                        )}`}
                      >
                        <FontAwesomeIcon
                          icon={getActionIcon(log.action_type)}
                        />
                        {log.action_type}
                      </span>
                    </td>
                    <td className="actor-cell">
                      <div className="actor-info">
                        <FontAwesomeIcon icon={faUser} className="actor-icon" />
                        <span className="actor-name">
                          {log.actor_name || "System"}
                        </span>
                      </div>
                    </td>
                    <td className="target-cell">
                      <div className="target-info">
                        <span className="target-model">{log.target_model}</span>
                        {log.target_id && (
                          <span className="target-id">#{log.target_id}</span>
                        )}
                      </div>
                    </td>
                    <td className="details-cell">
                      <div className="details-preview">
                        {log.details.length > 50
                          ? `${log.details.substring(0, 50)}...`
                          : log.details}
                      </div>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="action-btn view"
                        onClick={() => openDetailsModal(log)}
                        title="View Details"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pagination */}
      {logs.length > 0 && (
        <section className="pagination-section">
          <div>
            <span>
              Page {pagination.current} of {pagination.total}
            </span>
          </div>
          <div>
            <button
              className="pagination-btn"
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  current: Math.max(1, prev.current - 1),
                }))
              }
              disabled={pagination.current === 1}
            >
              Previous
            </button>
            <button
              className="pagination-btn"
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  current: Math.min(prev.total, prev.current + 1),
                }))
              }
              disabled={pagination.current === pagination.total}
            >
              Next
            </button>
          </div>
        </section>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Log Details</h2>
              <button
                className="modal-close"
                onClick={() => setShowDetailsModal(false)}
              >
                
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-group">
                <label>Timestamp</label>
                <span>{formatDate(selectedLog.timestamp)}</span>
              </div>
              <div className="detail-group">
                <label>Action</label>
                <span>{selectedLog.action_type}</span>
              </div>
              <div className="detail-group">
                <label>Actor</label>
                <span>{selectedLog.actor_name || "System"}</span>
              </div>
              <div className="detail-group">
                <label>Target Model</label>
                <span>{selectedLog.target_model}</span>
              </div>
              {selectedLog.target_id && (
                <div className="detail-group">
                  <label>Target ID</label>
                  <span>#{selectedLog.target_id}</span>
                </div>
              )}
              <div className="detail-group">
                <label>Details</label>
                <span>{selectedLog.details}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn close"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
