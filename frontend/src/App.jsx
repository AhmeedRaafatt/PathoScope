import { useState } from 'react'
import { createBrowserRouter , 
  createRoutesFromElements , 
  Route , RouterProvider
 } from 'react-router-dom'
import LandingPage from "./pages/public/LandingPage"
import LoginPage , {action as loginAction} from "./pages/public/LoginPage"
import RegisterPage ,{action as registerAction}from "./pages/public/RegisterPage"
import Layout from './components/Layout'
import './styles/global.css'

const router = createBrowserRouter(createRoutesFromElements(
    <Route path="/" element={<Layout/>}>
      <Route index element={<LandingPage/>} />
      <Route path="login" element={<LoginPage />} action={loginAction}/>
      <Route path="register" element={<RegisterPage />} action={registerAction}/>
    </Route>
))

function App() {
  return (<RouterProvider router={router}/>)
}

export default App
