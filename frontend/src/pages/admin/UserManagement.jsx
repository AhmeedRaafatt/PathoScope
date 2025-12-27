import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faFilter,
  faExclamationTriangle,
  faCheck,
  faTimes,
  faUserShield,
  faUserMd,
  faVial,
} from "@fortawesome/free-solid-svg-icons";
import "../../styles/admin/UserManagement.css";
import { getToken } from "../../utls";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState("success"); // 'success' or 'error'
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const USER_ROLES = [
    { value: "patient", label: "Patient", icon: faUsers },
    { value: "lab_tech", label: "Lab Technician", icon: faVial },
    { value: "pathologist", label: "Pathologist", icon: faUserMd },
    { value: "admin", label: "Administrator", icon: faUserShield },
  ];

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const params = new URLSearchParams();

      if (searchTerm) params.append("search", searchTerm);
      if (roleFilter !== "all") params.append("role", roleFilter);

      const response = await fetch(
        `http://127.0.0.1:8000/api/admin/users/?${params}`,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        throw new Error("Failed to fetch users");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (message, type = "success") => {
    setFeedbackMessage(message);
    setFeedbackType(type);
    setShowFeedbackModal(true);
    setTimeout(() => {
      setShowFeedbackModal(false);
    }, 3000);
  };

  const handleCreateUser = async (userData) => {
    try {
      const token = getToken();
      const response = await fetch("http://127.0.0.1:8000/api/admin/users/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        await fetchUsers();
        setShowCreateModal(false);
        showFeedback("User created successfully!", "success");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.username?.[0] || errorData.email?.[0] || "Failed to create user");
      }
    } catch (err) {
      showFeedback(err.message, "error");
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      const token = getToken();
      
      // For edit: only send password if it's not empty
      const updateData = {
        username: userData.username,
        email: userData.email,
        role: userData.role,
        is_active: userData.is_active,
      };
      
      // Only add password if it's provided (not empty)
      if (userData.password && userData.password.trim() !== "") {
        updateData.password = userData.password;
      }

      const response = await fetch(
        `http://127.0.0.1:8000/api/admin/users/${selectedUser.id}/`,
        {
          method: "PUT",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (response.ok) {
        await fetchUsers();
        setShowEditModal(false);
        setSelectedUser(null);
        showFeedback("User updated successfully!", "success");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.username?.[0] || errorData.email?.[0] || "Failed to update user");
      }
    } catch (err) {
      showFeedback(err.message, "error");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const token = getToken();
      const response = await fetch(
        `http://127.0.0.1:8000/api/admin/users/${selectedUser.id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        await fetchUsers();
        setShowDeleteModal(false);
        setSelectedUser(null);
        showFeedback("User deleted successfully!", "success");
      } else {
        throw new Error("Failed to delete user");
      }
    } catch (err) {
      showFeedback(err.message, "error");
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const getRoleInfo = (role) => {
    return USER_ROLES.find((r) => r.value === role) || USER_ROLES[0];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && users.length === 0) {
    return (
      <main className="user-management">
        <div className="page-header">
          <h1>User Management</h1>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="user-management">
      <header className="page-header">
        <h1>
          <FontAwesomeIcon icon={faUsers} className="header-icon" />
          User Management
        </h1>
        <button
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <FontAwesomeIcon icon={faPlus} />
          Add New User
        </button>
      </header>

      {error && (
        <div className="error-message">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <p>Error: {error}</p>
        </div>
      )}

      <section className="filters-section">
        <div className="search-bar">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search users by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-dropdown">
          <FontAwesomeIcon icon={faFilter} className="filter-icon" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            {USER_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="users-table-section">
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <FontAwesomeIcon icon={faUsers} className="empty-icon" />
                    <p>No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const roleInfo = getRoleInfo(user.role);
                  return (
                    <tr key={user.id} className="user-row">
                      <td className="user-cell">
                        <div className="user-info">
                          <div className="user-avatar">
                            <FontAwesomeIcon icon={roleInfo.icon} />
                          </div>
                          <div className="user-details">
                            <span className="username">{user.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="email-cell">{user.email}</td>
                      <td className="role-cell">
                        <span className={`role-badge ${user.role}`}>
                          <FontAwesomeIcon icon={roleInfo.icon} />
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="status-cell">
                        <span
                          className={`status-badge ${
                            user.is_active ? "active" : "inactive"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={user.is_active ? faCheck : faTimes}
                          />
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="date-cell">{formatDate(user.date_joined)}</td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button
                            className="action-btn edit"
                            onClick={() => openEditModal(user)}
                            title="Edit User"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => openDeleteModal(user)}
                            title="Delete User"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showCreateModal && (
        <UserModal
          title="Create New User"
          onSubmit={handleCreateUser}
          onClose={() => setShowCreateModal(false)}
          roles={USER_ROLES}
        />
      )}

      {showEditModal && selectedUser && (
        <UserModal
          title="Edit User"
          user={selectedUser}
          onSubmit={handleUpdateUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          roles={USER_ROLES}
        />
      )}

      {showDeleteModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-icon">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
              <p>
                Are you sure you want to delete user{" "}
                <strong>{selectedUser.username}</strong>?
              </p>
              <p className="warning-text">
                This action cannot be undone and will permanently remove the
                user and all associated data.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDeleteUser}>
                <FontAwesomeIcon icon={faTrash} />
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {showFeedbackModal && (
        <FeedbackModal
          message={feedbackMessage}
          type={feedbackType}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}
    </main>
  );
}

function UserModal({ title, user, onSubmit, onClose, roles }) {
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    role: user?.role || "patient",
    password: "",
    is_active: user?.is_active ?? true,
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.username) newErrors.username = "Username is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!user && !formData.password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal user-modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? "error" : ""}
            />
            {errors.username && (
              <span className="error-text">{errors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "error" : ""}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {!user && (
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? "error" : ""}
              />
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>
          )}

          {user && (
            <div className="form-group">
              <label htmlFor="password">Password (leave empty to keep current)</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Leave empty to keep current password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              <span className="checkbox-text">Active Account</span>
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {user ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FeedbackModal({ message, type, onClose }) {
  const isSuccess = type === "success";
  return (
    <div className="modal-overlay">
      <div className={`modal ${isSuccess ? 'success-modal' : 'error-modal'}`}>
        <div className="modal-header">
          <h2>{isSuccess ? 'Success' : 'Error'}</h2>
          <button className="modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="modal-body">
          <div className={isSuccess ? 'success-icon' : 'error-icon'}>
            <FontAwesomeIcon icon={isSuccess ? faCheck : faExclamationTriangle} />
          </div>
          <p className={isSuccess ? 'success-message' : 'error-message'}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
