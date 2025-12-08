import React from 'react';
import { NavLink, Outlet, useOutletContext } from 'react-router-dom';
import '../../styles/patient/Results.css';

const PatientResultsLayout = () => {
  const context = useOutletContext();
  
  return (
    <div className="results-container">
      <header className="results-header">
        <h1 className="results-title">My Results</h1>
        <p className="results-subtitle">View your test results and medical reports</p>
      </header>

      <nav className="results-nav">
        <NavLink 
          to="/patient/results" 
          end
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          All Results
        </NavLink>
        <NavLink 
          to="/patient/results/hematology" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Hematology
        </NavLink>
        <NavLink 
          to="/patient/results/pathology" 
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Pathology
        </NavLink>
      </nav>

      <div className="results-content">
        <Outlet context={context} />
      </div>
    </div>
  );
};

export default PatientResultsLayout;
