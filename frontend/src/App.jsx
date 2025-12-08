import { useState } from 'react'
import { createBrowserRouter , 
  createRoutesFromElements , 
  Route , RouterProvider
 } from 'react-router-dom'
import LandingPage from "./pages/public/LandingPage"
import LoginPage , {action as loginAction} from "./pages/public/LoginPage"
import RegisterPage ,{action as registerAction}from "./pages/public/RegisterPage"
import Layout from './components/Layout'
import PatientLayout ,{loader as layoutLoader}from './pages/patient/patientLayout'
import PatientDashboard from './pages/patient/PatientDashboard'
import PatientAppoinmentsLayout from './pages/patient/PatientAppoinmentsLayout'
import ViewAppointments from './pages/patient/ViewAppointments'
import BookAppointment  , {action as BookAppointmentAction} from './pages/patient/BookAppointment'
import PatientResultsLayout from './pages/patient/PatientResultsLayout'
import ViewResults from './pages/patient/ViewResults'
import ResultsHematology from './pages/patient/ResultsHematology'
import ResultsPathology from './pages/patient/ResultsPathology'
import PatientResults from './pages/patient/PatientResults'
import Billings from './pages/patient/Billings'
import './styles/global.css'


const router = createBrowserRouter(createRoutesFromElements(
    <Route path="/" element={<Layout/>}>
      <Route index element={<LandingPage/>} />
      <Route path="login" element={<LoginPage />} action={loginAction}/>
      <Route path="register" element={<RegisterPage />} action={registerAction}/>
      <Route path="patient" element={<PatientLayout/>} loader={layoutLoader}>
        <Route index element={<PatientDashboard/>}/>
        <Route path="appointments" element={<PatientAppoinmentsLayout/>}>
         <Route index element={<ViewAppointments/>}/>
         <Route path="book" element={<BookAppointment/>} action ={BookAppointmentAction}/>
        </Route>
        <Route path="results" element={<PatientResultsLayout/>}>
         <Route index element={<ViewResults/>}/>
         <Route path="hematology" element={<ResultsHematology/>}/>
         <Route path="pathology" element={<ResultsPathology/>}/>
        </Route>
        <Route path ="billings"  element={<Billings/>}/>
      </Route>
    </Route>
))

function App() {
  return (<RouterProvider router={router}/>)
}

export default App
