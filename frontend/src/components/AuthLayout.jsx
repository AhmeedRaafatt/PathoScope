import { Outlet, NavLink } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/AuthLayout.css"; 

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      {/* Minimal header: only logo linking to home */}
      <header className="auth-header">
        <NavLink to="/">
          <img src={logo} alt="Home" />
        </NavLink>
      </header>

      {/* Render Login or Register page here */}
      <main className="auth-main">
        <Outlet />
      </main>

      {/* No Footer here */}
    </div>
  );
}