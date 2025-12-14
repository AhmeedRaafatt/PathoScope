import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFlask, 
  faPlus, 
  faEdit, 
  faTrash, 
  faSearch, 
  faFilter,
  faExclamationTriangle,
  faCheck,
  faTimes,
  faSave,
  faCog
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/admin/LabConfiguration.css';

export default function LabConfiguration() {
  const [analytes, setAnalytes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [testFilter, setTestFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAnalyte, setSelectedAnalyte] = useState(null);
  const [activeTab, setActiveTab] = useState('analytes');

  // Fetch test analytes
  useEffect(() => {
    fetchAnalytes();
  }, [searchTerm, testFilter]);

  const fetchAnalytes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (testFilter !== 'all') params.append('test_name', testFilter);

      const response = await fetch(`http://127.0.0.1:8000/api/admin/analytes/?${params}`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytes(data);
      } else {
        throw new Error('Failed to fetch analytes');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnalyte = async (analyteData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/admin/analytes/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analyteData)
      });

      if (response.ok) {
        await fetchAnalytes();
        setShowCreateModal(false);
        alert('Analyte created successfully');
      } else {
        throw new Error('Failed to create analyte');
      }
    } catch (err) {
      alert(`Error creating analyte: ${err.message}`);
    }
  };

  const handleUpdateAnalyte = async (analyteData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/admin/analytes/${selectedAnalyte.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analyteData)
      });

      if (response.ok) {
        await fetchAnalytes();
        setShowEditModal(false);
        setSelectedAnalyte(null);
        alert('Analyte updated successfully');
      } else {
        throw new Error('Failed to update analyte');
      }
    } catch (err) {
      alert(`Error updating analyte: ${err.message}`);
    }
  };

  const handleDeleteAnalyte = async () => {
    if (!selectedAnalyte) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/admin/analytes/${selectedAnalyte.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        await fetchAnalytes();
        setShowDeleteModal(false);
        setSelectedAnalyte(null);
        alert('Analyte deleted successfully');
      } else {
        throw new Error('Failed to delete analyte');
      }
    } catch (err) {
      alert(`Error deleting analyte: ${err.message}`);
    }
  };

  const openEditModal = (analyte) => {
    setSelectedAnalyte(analyte);
    setShowEditModal(true);
  };

  const openDeleteModal = (analyte) => {
    setSelectedAnalyte(analyte);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUniqueTestNames = () => {
    const testNames = [...new Set(analytes.map(analyte => analyte.test_name))];
    return testNames.sort();
  };

  if (loading && analytes.length === 0) {
    return (
      <main className='lab-configuration'>
        <div className="page-header">
          <h1>Lab Configuration</h1>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading lab configuration...</p>
        </div>
      </main>
    );
  }

  return (
    <main className='lab-configuration'>
      {/* Page Header */}
      <header className="page-header">
        <h1>
          <FontAwesomeIcon icon={faCog} className="header-icon" />
          Lab Configuration
        </h1>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <FontAwesomeIcon icon={faPlus} />
          Add New Analyte
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
            className={`tab ${activeTab === 'analytes' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytes')}
          >
            <FontAwesomeIcon icon={faFlask} />
            Test Analytes
          </button>
          <button 
            className={`tab ${activeTab === 'ranges' ? 'active' : ''}`}
            onClick={() => setActiveTab('ranges')}
          >
            <FontAwesomeIcon icon={faFilter} />
            Normal Ranges
          </button>
          <button 
            className={`tab ${activeTab === 'pricing' ? 'active' : ''}`}
            onClick={() => setActiveTab('pricing')}
          >
            <FontAwesomeIcon icon={faCog} />
            Test Pricing
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'analytes' && (
        <div className="tab-content">
          {/* Filters */}
          <section className="filters-section">
            <div className="search-bar">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Search analytes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-dropdown">
              <FontAwesomeIcon icon={faFilter} className="filter-icon" />
              <select 
                value={testFilter} 
                onChange={(e) => setTestFilter(e.target.value)}
              >
                <option value="all">All Tests</option>
                {getUniqueTestNames().map(testName => (
                  <option key={testName} value={testName}>
                    {testName}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Analytes Table */}
          <section className="analytes-table-section">
            <div className="table-container">
              <table className="analytes-table">
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Analyte</th>
                    <th>Unit</th>
                    <th>Normal Range</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {analytes.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        <FontAwesomeIcon icon={faFlask} className="empty-icon" />
                        <p>No analytes found</p>
                      </td>
                    </tr>
                  ) : (
                    analytes.map(analyte => (
                      <tr key={analyte.id} className="analyte-row">
                        <td className="test-name-cell">{analyte.test_name}</td>
                        <td className="analyte-name-cell">{analyte.analyte_name}</td>
                        <td className="unit-cell">{analyte.unit}</td>
                        <td className="range-cell">
                          <span className="range-value">
                            {analyte.normal_range_low} - {analyte.normal_range_high} {analyte.unit}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button 
                              className="action-btn edit"
                              onClick={() => openEditModal(analyte)}
                              title="Edit Analyte"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button 
                              className="action-btn delete"
                              onClick={() => openDeleteModal(analyte)}
                              title="Delete Analyte"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'ranges' && (
        <div className="tab-content">
          <div className="placeholder-content">
            <FontAwesomeIcon icon={faFilter} className="placeholder-icon" />
            <h3>Normal Ranges Configuration</h3>
            <p>Configure and manage normal value ranges for all test analytes.</p>
            <p className="feature-note">This feature will be available in the next update.</p>
          </div>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="tab-content">
          <div className="placeholder-content">
            <FontAwesomeIcon icon={faCog} className="placeholder-icon" />
            <h3>Test Pricing Configuration</h3>
            <p>Manage pricing for hematology and pathology tests.</p>
            <p className="feature-note">This feature will be available in the next update.</p>
          </div>
        </div>
      )}

      {/* Create Analyte Modal */}
      {showCreateModal && (
        <AnalyteModal
          title="Create New Analyte"
          onSubmit={handleCreateAnalyte}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Analyte Modal */}
      {showEditModal && selectedAnalyte && (
        <AnalyteModal
          title="Edit Analyte"
          analyte={selectedAnalyte}
          onSubmit={handleUpdateAnalyte}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAnalyte(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAnalyte && (
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
              <p>Are you sure you want to delete analyte <strong>{selectedAnalyte.analyte_name}</strong>?</p>
              <p className="warning-text">This action cannot be undone and will permanently remove the analyte configuration.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="btn-danger" onClick={handleDeleteAnalyte}>
                <FontAwesomeIcon icon={faTrash} />
                Delete Analyte
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Analyte Modal Component
function AnalyteModal({ title, analyte, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    test_name: analyte?.test_name || '',
    analyte_name: analyte?.analyte_name || '',
    unit: analyte?.unit || '',
    normal_range_low: analyte?.normal_range_low || '',
    normal_range_high: analyte?.normal_range_high || ''
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors = {};
    if (!formData.test_name) newErrors.test_name = 'Test name is required';
    if (!formData.analyte_name) newErrors.analyte_name = 'Analyte name is required';
    if (!formData.unit) newErrors.unit = 'Unit is required';
    if (!formData.normal_range_low) newErrors.normal_range_low = 'Normal range low is required';
    if (!formData.normal_range_high) newErrors.normal_range_high = 'Normal range high is required';
    
    const low = parseFloat(formData.normal_range_low);
    const high = parseFloat(formData.normal_range_high);
    if (low >= high) {
      newErrors.normal_range_high = 'High value must be greater than low value';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      ...formData,
      normal_range_low: low,
      normal_range_high: high
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal analyte-modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="test_name">Test Name *</label>
            <input
              type="text"
              id="test_name"
              name="test_name"
              value={formData.test_name}
              onChange={handleChange}
              placeholder="e.g., CBC, Blood Glucose"
              className={errors.test_name ? 'error' : ''}
            />
            {errors.test_name && <span className="error-text">{errors.test_name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="analyte_name">Analyte Name *</label>
            <input
              type="text"
              id="analyte_name"
              name="analyte_name"
              value={formData.analyte_name}
              onChange={handleChange}
              placeholder="e.g., White Blood Cell Count"
              className={errors.analyte_name ? 'error' : ''}
            />
            {errors.analyte_name && <span className="error-text">{errors.analyte_name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="unit">Unit *</label>
            <input
              type="text"
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              placeholder="e.g., cells/μL, mg/dL"
              className={errors.unit ? 'error' : ''}
            />
            {errors.unit && <span className="error-text">{errors.unit}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="normal_range_low">Normal Range Low *</label>
              <input
                type="number"
                id="normal_range_low"
                name="normal_range_low"
                value={formData.normal_range_low}
                onChange={handleChange}
                step="0.01"
                className={errors.normal_range_low ? 'error' : ''}
              />
              {errors.normal_range_low && <span className="error-text">{errors.normal_range_low}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="normal_range_high">Normal Range High *</label>
              <input
                type="number"
                id="normal_range_high"
                name="normal_range_high"
                value={formData.normal_range_high}
                onChange={handleChange}
                step="0.01"
                className={errors.normal_range_high ? 'error' : ''}
              />
              {errors.normal_range_high && <span className="error-text">{errors.normal_range_high}</span>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <FontAwesomeIcon icon={faSave} />
              {analyte ? 'Update Analyte' : 'Create Analyte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
