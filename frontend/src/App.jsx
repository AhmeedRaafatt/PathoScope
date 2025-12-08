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
import PatientAppoinments from './pages/patient/PatientAppoinments'
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
        <Route path="appoinments" element={<PatientAppoinments/>}/>
        <Route path ="results" element={<PatientResults/>}/>
        <Route path ="billings"  element={<Billings/>}/>
      </Route>
    </Route>
))

function App() {
  return (<RouterProvider router={router}/>)
}

export default App
