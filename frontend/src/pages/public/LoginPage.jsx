import { Form, Link, redirect, useActionData } from "react-router-dom"
import '../../styles/Login.css'
import logo from "../../assets/logo.png"

export async function action({ request }) {
  const formData = await request.formData()
  const username = formData.get("username")
  const password = formData.get("password")

  try {
    const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // 1. Store Credentials
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('userRole', data.role);
      console.log("Login successful:", data);

      // 2. Traffic Cop Logic (Corrected)
      if (data.role === 'patient') {
        return redirect('/patient');
      } else if (data.role === 'admin'){
        return redirect('/admin');
      } else if (data.role === 'lab_tech' || data.role === 'pathologist' || data.role === 'admin') {
      }
      else if (data.role === 'lab_tech' || data.role === 'admin') {
        return redirect('/hematology');
      }
      else if (data.role === 'pathologist') {
        return redirect('/pathology');
      }
      else {
        // Fallback for unknown roles
        return redirect('/');
      }

    } else {
      return {
        error: data.error || data.detail || "Invalid username or password. Please try again.",
        status: response.status
      };
    }
  } catch (error) {
    console.error("Network Error:", error);
    return {
      error: "Could not connect to server. Please check your connection and try again.",
      networkError: true
    };
  }
}

export default function LoginPage() {
  const actionData = useActionData();

  return (
    <main className="login">
      <img src={logo} alt="PathoScope Logo"/>

      <Form method="post" replace>
        <div className="form-content">
          <h1>Login</h1>

          {/* Error Alert */}
          {actionData && actionData.error && (
            <div className="alert alert-error" style={{ color: 'red', fontWeight: 'bold', marginBottom: '1rem' }}>
              {actionData.error}
            </div>
          )}

          <label>
            Username :
            <input 
              type="text" 
              name="username" 
              required 
              placeholder="Enter your username"
            />
          </label>

          <label>
            Password : 
            <input 
              type="password" 
              name="password" 
              required
              placeholder="Enter your password"
            />
          </label>

          <Link to="/register">Don't have an account? Sign up</Link>
          
          <button type="submit">Login</button>
        </div>
      </Form>
    </main>
  )
}
