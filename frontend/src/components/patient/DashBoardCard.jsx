import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../../styles/patient/Dashboard.css';

export default function DashBoardCard(props) {
    return (
        <div className={`dashboard-card ${props.type || ''}`}>
            <div>
                <FontAwesomeIcon icon={props.icon} className="card-icon" />
                {props.status && <p className={`status ${props.status.toLowerCase()}`}>{props.status}</p>}
            </div>
            <h1 className="number">{props.number}</h1>
            <p className="text">{props.text}</p>
        </div>
    );
}