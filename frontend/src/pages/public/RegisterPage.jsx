import { Form, Link, redirect, useActionData } from "react-router-dom";
import '../../styles/Login.css';
import logo from "../../assets/logo.png";

export async function action({ request }) {
  const formData = await request.formData();
  const username = formData.get("username");
  const email = formData.get("email");
  const password = formData.get("password");
  const role = formData.get("role");

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
        error: "Registration failed. Please check the fields below.",
        details: data,
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

export default function RegisterPage() {
  const actionData = useActionData();

  return (
    <main className="register">
      <img src={logo} alt="PathoScope Logo"/>

      <Form method="post" replace>
        <div className="form-content">
          <h1>Sign Up</h1>

          {/* Main Error Alert */}
          {actionData && actionData.error && (
            <div className="alert alert-error">
              {actionData.error}
            </div>
          )}

          <label>
            Username :
            <input
              type="text"
              name="username"
              required
              placeholder="Choose a username"
            />
            {actionData?.details?.username && (
              <span className="field-error">
                {Array.isArray(actionData.details.username) 
                  ? actionData.details.username[0] 
                  : actionData.details.username}
              </span>
            )}
          </label>

          <label>
            Email :
            <input
              type="email"
              name="email"
              required
              placeholder="Enter your email"
            />
            {actionData?.details?.email && (
              <span className="field-error">
                {Array.isArray(actionData.details.email) 
                  ? actionData.details.email[0] 
                  : actionData.details.email}
              </span>
            )}
          </label>

          <label>
            Password :
            <input
              type="password"
              name="password"
              required
              placeholder="Create a password"
            />
            {actionData?.details?.password && (
              <span className="field-error">
                {Array.isArray(actionData.details.password) 
                  ? actionData.details.password[0] 
                  : actionData.details.password}
              </span>
            )}
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
        </div>
      </Form>
    </main>
  )
}