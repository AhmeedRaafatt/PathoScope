import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBullhorn,
  faPlus,
  faEdit,
  faTrash,
  faExclamationTriangle,
  faCheck,
  faTimes,
  faClock,
  faCalendar,
  faSave,
  faEye,
  faEyeSlash,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import "../../styles/admin/SystemBroadcasts.css";
import { getToken } from "../../utls";

export default function SystemBroadcasts() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  
  // Success/Error Modal State
  const [successModal, setSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Fetch broadcasts
  useEffect(() => {
    fetchBroadcasts();
  }, [activeTab]);

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const params = new URLSearchParams();

      if (activeTab === "active") {
        params.append("is_active", "true");
      }

      const response = await fetch(
        `http://127.0.0.1:8000/api/admin/broadcasts/?${params}`,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBroadcasts(data);
      } else {
        throw new Error("Failed to fetch broadcasts");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setIsError(false);
    setSuccessModal(true);
    setTimeout(() => {
      setSuccessModal(false);
    }, 3000);
  };

  const showErrorMessage = (message) => {
    setSuccessMessage(message);
    setIsError(true);
    setSuccessModal(true);
  };

  const handleCreateBroadcast = async (broadcastData) => {
    try {
      const token = getToken();
      const response = await fetch(
        "http://127.0.0.1:8000/api/admin/broadcasts/",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(broadcastData),
        }
      );

      if (response.ok) {
        await fetchBroadcasts();
        setShowCreateModal(false);
        showSuccess(" Broadcast created successfully!");
      } else {
        throw new Error("Failed to create broadcast");
      }
    } catch (err) {
      showErrorMessage(`Error: ${err.message}`);
    }
  };

  const handleUpdateBroadcast = async (broadcastData) => {
    try {
      const token = getToken();
      const response = await fetch(
        `http://127.0.0.1:8000/api/admin/broadcasts/${selectedBroadcast.id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(broadcastData),
        }
      );

      if (response.ok) {
        await fetchBroadcasts();
        setShowEditModal(false);
        setSelectedBroadcast(null);
        showSuccess(" Broadcast updated successfully!");
      } else {
        throw new Error("Failed to update broadcast");
      }
    } catch (err) {
      showErrorMessage(`Error: ${err.message}`);
    }
  };

  const handleToggleStatus = async (broadcast) => {
    try {
      const token = getToken();
      const response = await fetch(
        `http://127.0.0.1:8000/api/admin/broadcasts/${broadcast.id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...broadcast,
            is_active: !broadcast.is_active,
          }),
        }
      );

      if (response.ok) {
        await fetchBroadcasts();
        const action = broadcast.is_active ? "deactivated" : "activated";
        showSuccess(` Broadcast ${action} successfully!`);
      } else {
        throw new Error("Failed to update broadcast status");
      }
    } catch (err) {
      showErrorMessage(`Error: ${err.message}`);
    }
  };

  const handleDeleteBroadcast = async () => {
    if (!selectedBroadcast) return;

    try {
      const token = getToken();
      const response = await fetch(
        `http://127.0.0.1:8000/api/admin/broadcasts/${selectedBroadcast.id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        await fetchBroadcasts();
        setShowDeleteModal(false);
        setSelectedBroadcast(null);
        showSuccess(" Broadcast deleted successfully!");
      } else {
        throw new Error("Failed to delete broadcast");
      }
    } catch (err) {
      showErrorMessage(`Error: ${err.message}`);
    }
  };

  const openEditModal = (broadcast) => {
    setSelectedBroadcast(broadcast);
    setShowEditModal(true);
  };

  const openDeleteModal = (broadcast) => {
    setSelectedBroadcast(broadcast);
    setShowDeleteModal(true);
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

  const formatExpiryDate = (dateString) => {
    if (!dateString) return "No expiry";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading && broadcasts.length === 0) {
    return (
      <main className="system-broadcasts">
        <div className="page-header">
          <h1>System Broadcasts</h1>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading broadcasts...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="system-broadcasts">
      {/* Page Header */}
      <header className="page-header">
        <h1>
          <FontAwesomeIcon icon={faBullhorn} className="header-icon" />
          System Broadcasts
        </h1>
        <button
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <FontAwesomeIcon icon={faPlus} />
          Create Broadcast
        </button>
      </header>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <p>Error: {error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            <FontAwesomeIcon icon={faEye} />
            Active Broadcasts
          </button>
          <button
            className={`tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <FontAwesomeIcon icon={faBullhorn} />
            All Broadcasts
          </button>
        </div>
      </div>

      {/* Broadcasts List */}
      <section className="broadcasts-section">
        {broadcasts.length === 0 ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faBullhorn} className="empty-icon" />
            <h3>No broadcasts found</h3>
            <p>Create your first system broadcast to communicate with all users.</p>
          </div>
        ) : (
          <div className="broadcasts-grid">
            {broadcasts.map((broadcast) => (
              <div
                key={broadcast.id}
                className={`broadcast-card ${broadcast.is_active ? "active" : "inactive"} ${
                  isExpired(broadcast.expires_at) ? "expired" : ""
                }`}
              >
                <div className="broadcast-header">
                  <div className="broadcast-status">
                    <span
                      className={`status-badge ${
                        broadcast.is_active ? "active" : "inactive"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={broadcast.is_active ? faEye : faEyeSlash}
                      />
                      {broadcast.is_active ? "Active" : "Inactive"}
                    </span>
                    {isExpired(broadcast.expires_at) && (
                      <span className="status-badge expired">
                        <FontAwesomeIcon icon={faClock} />
                        Expired
                      </span>
                    )}
                  </div>
                  <div className="broadcast-actions">
                    <button
                      className="action-btn edit"
                      onClick={() => openEditModal(broadcast)}
                      title="Edit Broadcast"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className={`action-btn toggle ${
                        broadcast.is_active ? "deactivate" : "activate"
                      }`}
                      onClick={() => handleToggleStatus(broadcast)}
                      title={broadcast.is_active ? "Deactivate" : "Activate"}
                    >
                      <FontAwesomeIcon
                        icon={broadcast.is_active ? faEye : faEyeSlash}
                      />
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => openDeleteModal(broadcast)}
                      title="Delete Broadcast"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>

                <div className="broadcast-content">
                  <h3 className="broadcast-message">{broadcast.message}</h3>
                </div>

                <div className="broadcast-meta">
                  <div className="meta-item">
                    <FontAwesomeIcon icon={faCalendar} className="meta-icon" />
                    <span>Created: {formatDate(broadcast.created_at)}</span>
                  </div>
                  <div className="meta-item">
                    <FontAwesomeIcon icon={faClock} className="meta-icon" />
                    <span>Expires: {formatExpiryDate(broadcast.expires_at)}</span>
                  </div>
                  <div className="meta-item">
                    <FontAwesomeIcon icon={faCheck} className="meta-icon" />
                    <span>By: {broadcast.created_by_name || "System"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Create Broadcast Modal */}
      {showCreateModal && (
        <BroadcastModal
          title="Create New Broadcast"
          onSubmit={handleCreateBroadcast}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Broadcast Modal */}
      {showEditModal && selectedBroadcast && (
        <BroadcastModal
          title="Edit Broadcast"
          broadcast={selectedBroadcast}
          onSubmit={handleUpdateBroadcast}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBroadcast(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBroadcast && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-icon">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
              <p>Are you sure you want to delete this broadcast?</p>
              <div className="broadcast-preview">
                <p>
                  <strong>Message:</strong> "{selectedBroadcast.message}"
                </p>
              </div>
              <p className="warning-text">
                This action cannot be undone and will permanently remove the broadcast.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDeleteBroadcast}>
                <FontAwesomeIcon icon={faTrash} />
                Delete Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Modal */}
      {successModal && (
        <div className="success-modal-overlay">
          <div className={`success-modal ${isError ? "error" : "success"}`}>
            <div className="success-modal-header">
              <FontAwesomeIcon
                icon={isError ? faExclamationTriangle : faCheckCircle}
                className={`success-icon ${isError ? "error" : ""}`}
              />
              <h2>{isError ? "Error" : "Success"}</h2>
              <button
                className="modal-close"
                onClick={() => setSuccessModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="success-modal-body">
              <p>{successMessage}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Broadcast Modal Component
function BroadcastModal({ title, broadcast, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    message: broadcast?.message || "",
    is_active: broadcast?.is_active ?? true,
    expires_at: broadcast?.expires_at ? broadcast.expires_at.split("T")[0] : "",
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    const newErrors = {};
    if (!formData.message.trim()) newErrors.message = "Message is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const submitData = {
      ...formData,
      expires_at: formData.expires_at
        ? new Date(formData.expires_at).toISOString()
        : null,
    };

    onSubmit(submitData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal broadcast-modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Enter your broadcast message..."
              rows="4"
              className={errors.message ? "error" : ""}
            />
            {errors.message && (
              <span className="error-text">{errors.message}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="expires_at">Expiration Date</label>
              <input
                type="date"
                id="expires_at"
                name="expires_at"
                value={formData.expires_at}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
              />
              <small className="form-help">Leave empty for no expiration</small>
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <span className="checkbox-text">Activate immediately</span>
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <FontAwesomeIcon icon={faSave} />
              {broadcast ? "Update Broadcast" : "Create Broadcast"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
