import { Link, useLocation } from "react-router-dom"
import logo from "../../assets/logo.png"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faUser, faCalendarCheck, faSquarePollHorizontal, faFileInvoiceDollar, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import "../../styles/patient/Patient.css"

export default function PatientSidebar() {
    const location = useLocation()
    
    const handleLogout = () => {
        localStorage.removeItem('token')
        window.location.href = '/login'
    }

    return (
        <div className="patient-sidebar">
            <div className="sidebar-header">
                <img src={logo} alt="PathoScope Logo" />
            </div>

            <nav className="sidebar-nav">
                <Link 
                    to="." 
                    className={`sidebar-feature ${location.pathname === '/patient' || location.pathname === '/patient' ? 'active' : ''}`}
                >
                    <FontAwesomeIcon icon={faHome} className="feature-icon" />
                    <p className="feature-name">Dashboard</p>
                </Link>
                <Link 
                    to="appointments" 
                    className={`sidebar-feature ${location.pathname === '/patient/appointments' ? 'active' : ''}`}
                >
                    <FontAwesomeIcon icon={faCalendarCheck} className="feature-icon" />
                    <p className="feature-name">Appointments</p>
                </Link>

                <div className="sidebar-feature-group">
                    <Link 
                        to="results" 
                        className={`sidebar-feature ${location.pathname.includes('/patient/results') ? 'active' : ''}`}
                    >
                        <FontAwesomeIcon icon={faSquarePollHorizontal} className="feature-icon" />
                        <p className="feature-name">My Results</p>
                    </Link>
                    
                    <div className="sub-features">
                        <Link 
                            to="/patient/results/hematology"
                            className={`sub-feature ${location.pathname === '/patient/results/hematology' ? 'active' : ''}`}
                        >
                            <p>Hematology Results</p>
                        </Link>
                        <Link 
                            to="results/pathology"
                            className={`sub-feature ${location.pathname === '/patient/results/pathology' ? 'active' : ''}`}
                        >
                            <p>Pathology Reports</p>
                        </Link>
                    </div>
                </div>

                <Link 
                    to="billings" 
                    className={`sidebar-feature ${location.pathname === '/patient/billings' ? 'active' : ''}`}
                >
                    <FontAwesomeIcon icon={faFileInvoiceDollar} className="feature-icon" />
                    <p className="feature-name">Billing & Invoices</p>
                </Link>
            </nav>

            <button className="logout-btn" onClick={handleLogout}>
                <FontAwesomeIcon icon={faRightFromBracket} className="feature-icon" />
                <span>Logout</span>
            </button>
        </div>
    )
}