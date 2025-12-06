import React, { useState } from 'react';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        // Success! We received the Token.
        alert(`Welcome back, ${data.username}! Your Role is: ${data.role}`);
        
        // Store the token in the browser so the user stays logged in
        localStorage.setItem('token', data.token);
        console.log("Token stored:", data.token);
        
      } else {
        alert("Login Failed: " + data.error);
      }
    } catch (error) {
      console.error("Network Error:", error);
    }
  };

  return (
    <div style={{ padding: '50px' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px' }}>
        <input 
          name="username" 
          placeholder="Username" 
          onChange={handleChange} 
          style={{ marginBottom: '10px', padding: '10px' }}
        />
        <input 
          name="password" 
          placeholder="Password" 
          type="password" 
          onChange={handleChange} 
          style={{ marginBottom: '10px', padding: '10px' }}
        />
        <button type="submit" style={{ padding: '10px', backgroundColor: '#008CBA', color: 'white' }}>
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;