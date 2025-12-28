import { Link, useLocation } from "react-router-dom"
import logo from "../assets/logo.png"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import '../styles/hematology/Layout.css'
import { clearAuthData } from '../utls'

export default function Sidebar({ title, features, logoutPath = '/login' }) {
    const location = useLocation()
    
    const handleLogout = () => {
        clearAuthData()
        window.location.href = logoutPath
    }

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <img src={logo} alt="PathoScope Logo" />
                {title && <p className="sidebar-title">{title}</p>}
            </div>

            <nav className="sidebar-nav">
                {features.map((feature, index) => {
                    if (feature.type === 'group') {
                        // Feature group with sub-features
                        return (
                            <div key={index} className="sidebar-feature-group">
                                <Link 
                                    to={feature.to} 
                                    className={`sidebar-feature ${location.pathname.includes(feature.to) ? 'active' : ''}`}
                                >
                                    <FontAwesomeIcon icon={feature.icon} className="feature-icon" />
                                    <p className="feature-name">{feature.name}</p>
                                </Link>
                                
                                {feature.subFeatures && (
                                    <div className="sub-features">
                                        {feature.subFeatures.map((subFeature, subIndex) => (
                                            <Link 
                                                key={subIndex}
                                                to={subFeature.to}
                                                className={`sub-feature ${location.pathname === subFeature.to ? 'active' : ''}`}
                                            >
                                                <p>{subFeature.name}</p>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    } else {
                        // Regular feature
                        return (
                            <Link 
                                key={index}
                                to={feature.to} 
                                className={`sidebar-feature ${location.pathname === feature.to ? 'active' : ''}`}
                            >
                                <FontAwesomeIcon icon={feature.icon} className="feature-icon" />
                                <p className="feature-name">{feature.name}</p>
                            </Link>
                        )
                    }
                })}

                <button className="logout-btn" onClick={handleLogout}>
                    <FontAwesomeIcon icon={faRightFromBracket} className="feature-icon" />
                    <span>Logout</span>
                </button>
            </nav>
        </div>
    )
}