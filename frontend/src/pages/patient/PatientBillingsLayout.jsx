import React from 'react';
import { NavLink, Outlet, useOutletContext } from 'react-router-dom';
import '../../styles/patient/Results.css';

const PatientBillingsLayout = () => {
  const context = useOutletContext();

  return (
    <div className="results-container">
      <header className="results-header">
        <h1 className="results-title">Billing & Invoices</h1>
        <p className="results-subtitle">View and pay your invoices</p>
      </header>

      <nav className="results-nav">
        <NavLink
          to="/patient/billings"
          end
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          Invoices
        </NavLink>
      </nav>

      <div className="results-content">
        <Outlet context={context} />
      </div>
    </div>
  );
};

export default PatientBillingsLayout;
