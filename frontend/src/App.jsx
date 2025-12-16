import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'

// Public Pages
import LandingPage from "./pages/public/LandingPage"
import LoginPage, { action as loginAction } from "./pages/public/LoginPage"
import RegisterPage, { action as registerAction } from "./pages/public/RegisterPage"
import Layout from './components/Layout'

// Patient Portal
import PatientLayout, { loader as patientLoader } from './pages/patient/patientLayout'
import PatientDashboard from './pages/patient/PatientDashboard'
import PatientProfile from './pages/patient/PatientProfile'
import PatientAppoinmentsLayout from './pages/patient/PatientAppoinmentsLayout'
import ViewAppointments from './pages/patient/ViewAppointments'
import BookAppointment, { action as BookAppointmentAction } from './pages/patient/BookAppointment'
import PatientResultsLayout from './pages/patient/PatientResultsLayout'
import ViewResults from './pages/patient/ViewResults'
import ResultsHematology from './pages/patient/ResultsHematology'
import ResultsPathology from './pages/patient/ResultsPathology'
import PatientBillingsLayout from './pages/patient/PatientBillingsLayout'
import ViewInvoices from './pages/patient/ViewInvoices'

// Hematology Module
import HematologyLayout, { loader as hematologyLoader } from './pages/hematology/HematologyLayout'
import HematologyDashboard from './pages/hematology/HematologyDashboard'
import ScheduledPatients, { action as accessionAction } from './pages/hematology/ScheduledPatients'
import SamplesDashboard, { action as queueAction } from './pages/hematology/SamplesDashboard'
import QueueManagement, { action as completeAction } from './pages/hematology/QueueManagement'
import ValidationResults from './pages/hematology/ValidationResults'

// --- NEW PATHOLOGY IMPORTS ---
import PathologistDashboard from './pages/pathology/PathologistDashboard';
import ViewerPage from './pages/pathology/ViewerPage';
// Add import
import PathologyReport from './pages/pathology/PathologyReport';

import './styles/global.css'

const router = createBrowserRouter(createRoutesFromElements(
    <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} action={loginAction} />
        <Route path="register" element={<RegisterPage />} action={registerAction} />

        {/* Patient Portal */}
        <Route path="patient" element={<PatientLayout />} loader={patientLoader}>
            <Route index element={<PatientDashboard />} />
            <Route path="profile" element={<PatientProfile />} />
            <Route path="appointments" element={<PatientAppoinmentsLayout />}>
                <Route index element={<ViewAppointments />} />
                <Route path="book" element={<BookAppointment />} action={BookAppointmentAction} />
            </Route>
            <Route path="results" element={<PatientResultsLayout />}>
                <Route index element={<ViewResults />} />
                <Route path="hematology" element={<ResultsHematology />} />
                <Route path="pathology" element={<ResultsPathology />} />
            </Route>
            <Route path="billings" element={<PatientBillingsLayout />}>
                <Route index element={<ViewInvoices />} />
            </Route>
        </Route>

        {/* Hematology Module */}
        <Route path="hematology" element={<HematologyLayout />} loader={hematologyLoader}>
            <Route index element={<HematologyDashboard />} />
            <Route path="scheduled" element={<ScheduledPatients />} action={accessionAction} />
            <Route path="accession" element={<ScheduledPatients />} action={accessionAction} />
            <Route path="samples" element={<SamplesDashboard />} action={queueAction} />
            <Route path="queue" element={<QueueManagement />} action={completeAction} />
            <Route path="validation" element={<ValidationResults />} />
            <Route path="results" element={<ValidationResults/>} action={queueAction} />
        </Route>

        {/* --- NEW PATHOLOGY MODULE ROUTES --- */}
        {/* We group them under /pathologist to keep the URL structure clean */}
        <Route path="pathologist">
            <Route path="dashboard" element={<PathologistDashboard />} />
            <Route path="viewer/:id" element={<ViewerPage />} />
            // Add to routes inside the Pathologist or Protected Route area
            <Route path="/pathologist/report/:id" element={<PathologyReport />} />
        </Route>

    </Route>
))

function App() {
    return <RouterProvider router={router} />
}

export default App