import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // For redirecting and navigation link
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Added confirmPassword state
  const [gender, setGender] = useState('');
  const navigate = useNavigate();

  // Email validation function
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleRegister = async () => {
    // Validate fields
    if (!username || !email || !password || !confirmPassword || !gender) {
      toast.error('Please fill in all fields.');
      return;
    }

    if (username.length > 15) {
      toast.error('Username cannot be longer than 15 characters.');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    // Call the FastAPI backend to register the user
    const response = await fetch('http://localhost:8000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, gender }),
    });
    const data = await response.json();
    
    if (data.status === 'success') {
      toast.success('Registration successful!');
      setTimeout(() => {
        navigate('/login'); // Redirect to login page on successful registration
      }, 1500); // Delay for the toast to be shown
    } else {
      toast.error(data.detail || 'Registration failed');
    }
  };

  return (
    <div className="container d-flex justify-content-center mt-5">
      <div className="card shadow-lg p-4" style={{ width: '400px' }}>
        <h2 className="card-title text-center mb-4">Create an Account</h2>

        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Username (max 15 characters)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={15} // Restrict length
            required
          />
        </div>

        <div className="mb-3">
          <input
            type="email"
            className="form-control"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <input
            type="password"
            className="form-control"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <div className="mb-3 d-flex align-items-center">
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              id="genderMale"
              value="Male"
              onChange={(e) => setGender(e.target.value)}
              checked={gender === 'Male'}
              required
            />
            <label className="form-check-label" htmlFor="genderMale">
              Male
            </label>
          </div>

          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              id="genderFemale"
              value="Female"
              onChange={(e) => setGender(e.target.value)}
              checked={gender === 'Female'}
              required
            />
            <label className="form-check-label" htmlFor="genderFemale">
              Female
            </label>
          </div>
        </div>

        <button className="btn btn-primary w-100 mb-3" onClick={handleRegister}>
          Register
        </button>

        <div className="text-center">
          <p className="mb-0">Already have an account?</p>
          <Link to="/login" className="text-decoration-none">Login here</Link>
        </div>
      </div>

      {/* Toast container for showing toast messages */}
      <ToastContainer />
    </div>
  );
};

export default Register;
