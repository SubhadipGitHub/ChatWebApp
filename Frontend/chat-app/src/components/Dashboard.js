import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUserCheck, faPlug , faTrash} from '@fortawesome/free-solid-svg-icons';

const Dashboard = () => {
    const [totalUsers, setTotalUsers] = useState(0);
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [activeSockets, setActiveSockets] = useState(0);

    // Mock data fetching (replace with API calls)
    useEffect(() => {
        // Simulate fetching data from API
        setTotalUsers(150);
        setOnlineUsers(45);
        setActiveSockets(32);
    }, []);

    // Button Handlers
    const handleClearSockets = () => {
        alert('Cleared all socket connections!');
        // Call the API to clear socket connections here
    };

    const handleDeleteAllData = () => {
        alert('Deleted all data from the database!');
        // Call the API to delete all data from the DB here
    };

    // Render the dashboard
    return (
        <div className="container mt-5">
            <h1 className="text-center mb-4">Dashboard</h1>
            {/* Total Users Section */}
            <div className="row mb-4 p-3">
                <div className="col-md-4 p-3">
                    <div className="card text-white bg-primary mb-3 h-100">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <span>Total Users</span>
                            <FontAwesomeIcon icon={faUsers} />
                        </div>
                        <div className="card-body d-flex align-items-center justify-content-center">
                            <h4 className="card-title">{totalUsers}</h4>
                        </div>
                        <div className="card-footer">
                            <p className="mb-0 text-white">Total registered users</p>
                        </div>
                    </div>
                </div>

                {/* Online Users Section */}
                <div className="col-md-4 p-3">
                    <div className="card text-white bg-success mb-3 h-100">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <span>Online Users</span>
                            <FontAwesomeIcon icon={faUserCheck} />
                        </div>
                        <div className="card-body d-flex align-items-center justify-content-center">
                            <h4 className="card-title">{onlineUsers}</h4>
                        </div>
                        <div className="card-footer">
                            <p className="mb-0 text-white">Users currently active</p>
                        </div>
                    </div>
                </div>

                {/* Active Sockets Section */}
                <div className="col-md-4 p-3">
                    <div className="card text-white bg-warning mb-3 h-100">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <span>Active Sockets</span>
                            <FontAwesomeIcon icon={faPlug} />
                        </div>
                        <div className="card-body d-flex align-items-center justify-content-center">
                            <h4 className="card-title">{activeSockets}</h4>
                        </div>
                        <div className="card-footer">
                            <p className="mb-0 text-dark">Current active socket connections.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Buttons for Socket Management */}
            <div className="row mb-4 p-3">
                <div className="col-md-6 p-2">
                    <button
                        className="btn btn-danger w-100"
                        onClick={handleClearSockets}
                    >
                        <FontAwesomeIcon icon={faPlug} /> Clear Socket Connections
                    </button>
                </div>
                <div className="col-md-6 p-2">
                    <button
                        className="btn btn-danger w-100"
                        onClick={handleDeleteAllData}
                    >
                        <FontAwesomeIcon icon={faTrash} /> Delete All Data
                    </button>
                </div>
            </div>

            {/* Link to Main Chat */}
            <div className="row mt-4 p-3">
                <div className="col-md-12 text-center">
                    <a href="/chat" className="btn btn-primary">
                        Go to Main Chat
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
