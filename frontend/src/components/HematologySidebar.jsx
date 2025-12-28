import Sidebar from "./Sidebar"
import '../styles/hematology/Layout.css'
import { 
    faHome, 
    faCalendarCheck, 
    faClipboardCheck, 
    faTachometerAlt, 
    faFlask, 
    faCheckCircle, 
    faFileAlt 
} from '@fortawesome/free-solid-svg-icons'

export default function HematologySidebar() {
    const hematologyFeatures = [
        {
            name: 'Dashboard',
            to: '/hematology',
            icon: faHome
        },
        {
            name: 'Scheduled Patients',
            to: '/hematology/scheduled',
            icon: faCalendarCheck
        },
        {
            name: 'Upload Slides',
            to: '/hematology/upload',
            icon: faCalendarCheck
        },
        {
            name: 'Samples Dashboard',
            to: '/hematology/samples',
            icon: faTachometerAlt
        },
        {
            name: 'Instrument Queue',
            to: '/hematology/queue',
            icon: faFlask
        },
        {
            name: 'Validation',
            to: '/hematology/validation',
            icon: faCheckCircle
        }
    ]

    return (
        <Sidebar 
            title="Lab Technician Portal"
            features={hematologyFeatures}
            logoutPath="/login"
        />
    )
}