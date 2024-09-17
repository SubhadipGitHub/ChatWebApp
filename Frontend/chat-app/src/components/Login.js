import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // For redirecting

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    // Call the FastAPI backend to authenticate
    // Assuming you have an api.js function to handle login
    const response = await fetch('http://localhost:8000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      navigate('/chat'); // Redirect to chat on successful login
    } else {
      alert('Invalid login');
    }
  };

  return (
    <div className="container d-flex justify-content-center mt-5">
      <div className="card p-4">
        <h2 className="card-title text-center">Login</h2>
        <input
          type="text"
          className="form-control my-2"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          className="form-control my-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleLogin}>
          Login
        </button>
      </div>
    </div>
  );
};

export default Login;
