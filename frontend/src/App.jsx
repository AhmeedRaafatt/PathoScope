import { useState } from 'react'
import { BrowserRouter , Routes , Route  } from 'react-router-dom'
import LandingPage from "./pages/public/LandingPage"
import LoginPage from "./pages/public/LoginPage"
import RegisterPage from "./pages/public/RegisterPage"

import './styles/global.css'

function App() {

  return (
    <>
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage/>}/>
      <Route path="/login" element={<LoginPage />}/>
      <Route path="/register" element={<RegisterPage />}/>
    </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
