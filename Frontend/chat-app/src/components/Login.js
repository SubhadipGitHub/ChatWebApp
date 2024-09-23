import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // For redirecting and linking to register page
import { toast,ToastContainer  } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    // Clear local storage
    localStorage.clear();
    // Call the FastAPI backend to authenticate
    const response = await fetch(`http://localhost:8000/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (data.status === 'success') {
      localStorage.setItem('token', 'test');
      localStorage.setItem('user', JSON.stringify(data.user)); // Store user info
      localStorage.setItem('username', username); // Store creds
      localStorage.setItem('password', password); // Store creds
      toast.success('Login successfull');
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/chat'; // Replace with your login route
      }, 2000); // Wait 2 seconds to show toast before redirect
    } else {
      toast.error('Invalid login');
    }
  };

  // Handle the keypress event for Enter key
  const handleKeyPress = (e) => {
    if (e.keyCode === 13 || e.which === 13) {
      handleLogin(); // Trigger login on Enter key
    }
  };

  return (
    <div className="container d-flex justify-content-center mt-5">
      <div className="card shadow-lg p-4" style={{ width: '400px' }}>
        <h2 className="card-title text-center mb-4">Welcome Back</h2>
        <hr></hr> 
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyPress} // Attach the enter key listener
          />
        </div>

        <div className="mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyPress} // Attach the enter key listener
          />
        </div>

        <button className="btn btn-primary w-100 mb-3" onClick={handleLogin}>
          Login
        </button>

        <div className="text-center">
          <p className="mb-0">Don't have an account?</p>
          <Link to="/register" className="text-decoration-none">Register here</Link>
        </div>
      </div>

      {/* Add the ToastContainer at the end */}
      <ToastContainer />
    </div>
  );
};

export default Login;
