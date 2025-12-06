import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png"
import "../styles/NavBar.css"
export default function NavBar (){
    const style = {

    }
    return(
        <header>
        <NavLink to="/"><img src={logo} alt="website logo"/></NavLink>
        <nav>
            <a href="#service"className="section-link"> Service</a>
            <a href="#about" className="section-link"> About us</a>
            <a href="#contact" className="section-link">Contact</a>
            <div className="login-buttons">
                <NavLink to="./login" className={({isActive})=>isActive ? "login-btn active" :"login-btn"}>Patient Login</NavLink>
                <NavLink to="./register" className={()=>{return "login-btn"}}>Staff Login</NavLink>
            </div>
        </nav>
        </header>
    )

}