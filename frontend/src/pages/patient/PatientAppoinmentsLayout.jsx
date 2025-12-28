import React from 'react';
import { NavLink, Outlet, useOutletContext } from 'react-router-dom';
import '../../styles/patient/Appoinments.css';

const PatientAppoinmentsLayout = () => {
  const context = useOutletContext();
  
  return (
    <div className="appointments-container">
      <header className="appointments-header">
        <h1 className="appointments-title">Appointments</h1>
        <p className="appointments-subtitle">Manage your upcoming and past appointments</p>
      </header>

      <nav className="appointments-nav">
        <NavLink 
          to="/patient/appointments" 
          end
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          View Appointments
        </NavLink>
        <NavLink 
          to="/patient/appointments/book" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Book New Appointment
        </NavLink>
      </nav>

      <div className="appointments-content">
        <Outlet context={context} />
      </div>
    </div>
  );
};

export default PatientAppoinmentsLayout;