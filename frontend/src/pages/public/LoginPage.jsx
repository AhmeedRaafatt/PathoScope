import { Form, Link, redirect } from "react-router-dom"
import '../../styles/Login.css'

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
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('role', data.role);
      console.log("Login successful:", data);
      return redirect('/'); 
      
    } else {
      return { 
        error: data.error || "Login Failed",
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

export default function LoginPage() {
  return (
    <main className="login">
      <h1>Login</h1>
      <Form method="post" replace>
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
      </Form>
    </main>
  )
}