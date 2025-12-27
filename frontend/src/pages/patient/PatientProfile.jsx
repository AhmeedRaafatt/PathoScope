import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Calendar, Heart, Edit2, Save, X } from 'lucide-react';
import '../../styles/patient/Patient.css';
import { getToken } from '../../utls';

// Note: We're not using a React Router action here because forms don't natively support PUT
// Instead, we'll handle the submission in the component

const PatientProfile = () => {
  const { profile, refreshData } = useOutletContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    chronic_diseases: profile?.chronic_diseases || '',
    date_of_birth: profile?.date_of_birth || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlertMessage(null);

    const token = getToken();
    
    const profileData = {
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      chronic_diseases: formData.chronic_diseases,
      date_of_birth: formData.date_of_birth,
    };

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/patient-portal/profile/',
        {
          method: 'PUT',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setAlertMessage({
          type: 'error',
          message: errorData.detail || 'Failed to update profile'
        });
        setIsSubmitting(false);
        return;
      }

      await response.json();
      setAlertMessage({
        type: 'success',
        message: 'Profile updated successfully!'
      });
      setIsEditing(false);
      
      // Refresh the data from the server
      if (refreshData) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setAlertMessage({
        type: 'error',
        message: 'Network error. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      email: profile?.email || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      chronic_diseases: profile?.chronic_diseases || '',
      date_of_birth: profile?.date_of_birth || '',
    });
  };

  // Update form data when profile changes from context
  useEffect(() => {
    if (profile) {
      setFormData({
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        chronic_diseases: profile.chronic_diseases || '',
        date_of_birth: profile.date_of_birth || '',
      });
    }
  }, [profile]);

  return (
    <div className="dashboard">
      <div className="profile-container">
        <div className="profile-header">
          <div>
            <h1 className="profile-title">My Profile</h1>
            <p className="profile-subtitle">Manage your personal information</p>
          </div>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="edit-profile-btn"
            >
              <Edit2 size={18} />
              Edit Profile
            </button>
          )}
        </div>

        {alertMessage?.type === 'success' && (
          <div className="alert alert-success">
            <span>✓</span> {alertMessage.message}
          </div>
        )}

        {alertMessage?.type === 'error' && (
          <div className="alert alert-error">
            <span>✗</span> {alertMessage.message}
          </div>
        )}

        {!isEditing ? (
          <div className="profile-view">
            <div className="profile-card">
              <div className="profile-avatar">
                <User size={48} />
              </div>
              <h2 className="profile-username">{profile?.username || 'N/A'}</h2>
              <p className="profile-id">Patient ID: #{profile?.id || 'N/A'}</p>
            </div>

            <div className="profile-info-grid">
              <div className="info-item">
                <div className="info-icon">
                  <Mail size={20} />
                </div>
                <div className="info-content">
                  <p className="info-label">Email Address</p>
                  <p className="info-value">{profile?.email || 'Not provided'}</p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <Phone size={20} />
                </div>
                <div className="info-content">
                  <p className="info-label">Phone Number</p>
                  <p className="info-value">{profile?.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <Calendar size={20} />
                </div>
                <div className="info-content">
                  <p className="info-label">Date of Birth</p>
                  <p className="info-value">{profile?.date_of_birth || 'Not provided'}</p>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <MapPin size={20} />
                </div>
                <div className="info-content">
                  <p className="info-label">Address</p>
                  <p className="info-value">{profile?.address || 'Not provided'}</p>
                </div>
              </div>

              <div className="info-item full-width">
                <div className="info-icon">
                  <Heart size={20} />
                </div>
                <div className="info-content">
                  <p className="info-label">Chronic Diseases</p>
                  <p className="info-value">{profile?.chronic_diseases || 'None reported'}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-edit">
            <div className="edit-form-card">
              <h3 className="edit-form-title">Edit Profile Information</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="email">
                    <Mail size={16} />
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">
                    <Phone size={16} />
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="date_of_birth">
                    <Calendar size={16} />
                    Date of Birth <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="address">
                    <MapPin size={16} />
                    Address <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="chronic_diseases">
                    <Heart size={16} />
                    Chronic Diseases (Optional)
                  </label>
                  <textarea
                    id="chronic_diseases"
                    name="chronic_diseases"
                    value={formData.chronic_diseases}
                    onChange={handleInputChange}
                    rows={4}
                    className="form-textarea"
                    placeholder="List any chronic conditions or leave blank if none"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-save"
                >
                  <Save size={18} />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="btn-cancel"
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="profile-note">
          <p><strong>Note:</strong> Username cannot be changed. Contact support if you need assistance.</p>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;