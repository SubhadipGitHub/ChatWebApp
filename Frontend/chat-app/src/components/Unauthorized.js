import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Unauthorized = () => {
    const navigate = useNavigate();

    // Logout handler
    const handleLogout = () => {
        localStorage.clear(); // Clear local storage
        toast.success('Logged out successfully!', {
            position: "top-right",
            autoClose: 2000,
        });
        setTimeout(() => {
            navigate('/login'); // Redirect to login page
        }, 2000);
    };

    return (
        <div className="container text-center mt-5">
            <h1 className="display-4 text-danger">403 - Unauthorized Access</h1>
            <p className="lead">You do not have the necessary permissions to view this page.</p>
            
            {/* Logout button */}
            <button className="btn btn-danger mt-3" onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
};

export default Unauthorized;
