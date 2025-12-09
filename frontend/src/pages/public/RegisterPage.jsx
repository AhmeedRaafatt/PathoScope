import { Form, Link, redirect } from "react-router-dom"
import '../../styles/Login.css'
import logo from "../../assets/logo.png"
export async function action({ request }) {
  const formData = await request.formData()
  const username = formData.get("username")
  const email = formData.get("email")
  const password = formData.get("password")
  const role = formData.get("role")

  try {
    const response = await fetch('http://127.0.0.1:8000/api/auth/signup/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password, role }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Registration successful:", data);
      return redirect('/login');
      
    } else {
      return { 
        error: data.username?.[0] || data.email?.[0] || data.password?.[0] || "Registration failed. Please try again.",
        details: data,
        status: response.status 
      };
    }
  } catch (error) {
    console.error("Network Error:", error);
    return { 
      error: "Could not connect to server. Please try again.",
      networkError: true 
    };
  }
}

export default function RegisterPage() {
  return (
    <main className="register">
      <img src={logo}/>
      <h1>Sign Up</h1>
      <Form method="post" replace>
        <label>
          Username :
          <input 
            type="text" 
            name="username" 
            required
            placeholder="Choose a username"
          />
        </label>
        <label>
          Email :
          <input 
            type="email" 
            name="email" 
            required
            placeholder="Enter your email"
          />
        </label>
        <label>
          Password : 
          <input 
            type="password" 
            name="password" 
            required
            placeholder="Create a password"
          />
        </label>
        <label>
          Select Role : 
          <select name="role" defaultValue="patient">
            <option value="patient">Patient</option>
            <option value="lab_tech">Lab Technician</option>
            <option value="pathologist">Pathologist</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <Link to="/login">Already have an account? Login</Link>
        <button type="submit">Register</button>
      </Form>
    </main>
  )
}