import React, { useState } from 'react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'patient' // Default role
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // connecting to your Django Backend
      const response = await fetch('http://127.0.0.1:8000/api/auth/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration Successful! Please Login.");
        console.log("Created User:", data);
        // Navigate to login here if you have routing set up
      } else {
        alert("Error: " + JSON.stringify(data));
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert("Could not connect to Django server.");
    }
  };

  return (
    <div style={{ padding: '50px' }}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px' }}>
        <input 
          name="username" 
          placeholder="Username" 
          onChange={handleChange} 
          style={{ marginBottom: '10px', padding: '10px' }}
        />
        <input 
          name="email" 
          placeholder="Email" 
          type="email" 
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
        
        <label>Select Role:</label>
        <select name="role" onChange={handleChange} style={{ marginBottom: '20px', padding: '10px' }}>
          <option value="patient">Patient</option>
          <option value="lab_tech">Lab Technician</option>
          <option value="pathologist">Pathologist</option>
          <option value="admin">Admin</option>
        </select>

        <button type="submit" style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white' }}>
          Register
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;