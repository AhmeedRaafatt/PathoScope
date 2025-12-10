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
            name: 'Accession',
            to: '/hematology/accession',
            icon: faClipboardCheck
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
            name: 'Results Entry',
            to: '/hematology/results',
            icon: faFileAlt
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