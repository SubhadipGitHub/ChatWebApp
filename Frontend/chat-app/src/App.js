import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Chat from './components/Chat';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';

// Mock authentication check function
const isAuthenticated = () => {
  // This could be a call to your authentication service
  console.log(localStorage.getItem('token'))
  return localStorage.getItem('token') !== null;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/chat" />} /> {/* Redirect from root to /chat */}
        {/* Protecting the chat route */}
        <Route
          path="/chat"
          element={isAuthenticated() ? <Chat /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
