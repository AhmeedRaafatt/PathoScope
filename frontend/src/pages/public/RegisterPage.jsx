import { Form, Link, redirect, useActionData } from "react-router-dom"; // <--- Added useActionData
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
      // Optional: Add an alert or toast here if you want before redirecting
      return redirect('/login');

    } else {
      // We pass the full 'data' object back as 'details' so we can show specific field errors
      return {
        error: "Registration failed. Please check the fields.",
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
  const actionData = useActionData(); // <--- Hook to get the errors

  return (
    <main className="register">
      <img src={logo} alt="PathoScope Logo"/>
      <h1>Sign Up</h1>

      {/* 1. Main Error Banner (if connection fails or generic error) */}
      {actionData && actionData.error && (
         <div style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>
            {actionData.error}
         </div>
      )}

      <Form method="post" replace>
        <label>
          Username :
          <input
            type="text"
            name="username"
            required
            placeholder="Choose a username"
          />
          {/* Specific Username Error */}
          {actionData?.details?.username && (
            <span style={{color: 'red', fontSize: '0.8rem'}}>
              {actionData.details.username[0]}
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
          {/* Specific Email Error (e.g. "Must end in @mail.com") */}
          {actionData?.details?.email && (
            <span style={{color: 'red', fontSize: '0.8rem'}}>
              {actionData.details.email[0]}
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
          {/* Specific Password Error (e.g. "Too weak") */}
          {actionData?.details?.password && (
            <span style={{color: 'red', fontSize: '0.8rem'}}>
              {actionData.details.password[0]}
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
      </Form>
    </main>
  )
}