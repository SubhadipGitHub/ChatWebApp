import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUserCheck, faPlug, faTrash } from '@fortawesome/free-solid-svg-icons';

const Dashboard = () => {
    const [totalUsers, setTotalUsers] = useState(0);
    const [onlineUsers, setOnlineUsers] = useState(0);
    const [activeSockets, setActiveSockets] = useState(0);

    // Fetch data from the server-status API
    useEffect(() => {
        const fetchServerStatus = async () => {
            try {
                const response = await fetch('http://localhost:8000/server_status');
                const data = await response.json();

                setTotalUsers(data.user_count);
                setOnlineUsers(data.user_online_count);
                setActiveSockets(data.db_connections.current);
            } catch (error) {
                console.error("Error fetching server status: ", error);
            }
        };

        fetchServerStatus();
    }, []);

    const handleClearSockets = () => {
        alert('Cleared all socket connections!');
        // Call API to clear socket connections
    };

    const handleDeleteAllData = () => {
        alert('Deleted all data from the database!');
        // Call API to delete all data from DB
    };

    return (
        <>
            {/* Navbar */}
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <div className="container-fluid">
                    <a className="navbar-brand" href="/">Chatify</a>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarNavDropdown">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <a className="nav-link active" href="/dashboard">Dashboard</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="/chat">Chat</a>
                            </li>
                        </ul>
                        <ul className="navbar-nav">
                            <li className="nav-item">Admin
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Main Dashboard Content */}
            <div className="container mt-5">
                <h1 className="text-center mb-4">Dashboard</h1>
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
                                <p className="mb-0 text-dark">Current active socket connections</p>
                            </div>
                        </div>
                    </div>
                </div>

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
            </div>
        </>
    );
};

export default Dashboard;
