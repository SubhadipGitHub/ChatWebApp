import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // For redirecting

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    // Call the FastAPI backend to register the user
    const response = await fetch('http://localhost:8000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await response.json();
    if (data.msg === 'User registered successfully') {
      navigate('/login'); // Redirect to login page on successful registration
    } else {
      alert(data.detail || 'Registration failed');
    }
  };

  return (
    <div className="container d-flex justify-content-center mt-5">
      <div className="card p-4">
        <h2 className="card-title text-center">Register</h2>
        <input
          type="text"
          className="form-control my-2"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          className="form-control my-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="form-control my-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleRegister}>
          Register
        </button>
      </div>
    </div>
  );
};

export default Register;
