import Sidebar from "./Sidebar";
import '../styles/pathology/Layout.css'; // or shared style if you prefer
import {
    faTachometerAlt,
    faCalendarCheck,
    faUpload,
    faMicroscope,
    faClipboardList
} from '@fortawesome/free-solid-svg-icons';

export default function PathologySidebar() {
    const pathologyFeatures = [
        {
            name: 'Dashboard',
            to: '/pathology',
            icon: faTachometerAlt
        },
        {
            type: 'group',
            name: 'Pathologist',
            to: '/pathology/queue', // optional parent link
            icon: faMicroscope,
            subFeatures: [
                {
                    name: 'Review Queue',
                    to: '/pathology/queue'
                },
                {
                    name: 'All Cases',
                    to: '/pathology/cases'
                }
            ]
        }
    ];

    return (
        <Sidebar
            title="Pathology Department"
            features={pathologyFeatures}
            logoutPath="/login"
        />
    );
}