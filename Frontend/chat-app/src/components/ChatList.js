import React, { useState, useMemo, useEffect, useRef } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Import FontAwesome CSS
import './ChatList.css'; // Import custom CSS
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';

const ChatList = ({ chats, selectedChat, onChatSelect, loggedInUser, setLoggedInUser, onlineUsers, onAddChat }) => {
  const [showUserModal, setShowUserModal] = useState(false); // Modal for logged-in user
  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const [showAddChatModal, setShowAddChatModal] = useState(false); // Modal for adding a chat
  const [newChatName, setNewChatName] = useState(''); // State for new chat name
  const [onlineSearchQuery, setOnlineSearchQuery] = useState('');
  const inputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false); // Track editing state
  const [userDetails, setUserDetails] = useState({
    name: '',
    about: '',
    timezone: '',
    onlineStatus: '',
  });

  const username = localStorage.getItem('username'); // Get username from local storage
  const password = localStorage.getItem('password'); // Get password from local storage

  // Encode the credentials for Basic Auth
  const encodedCredentials = btoa(`${username}:${password}`);

  const timezones = [
    "Africa/Cairo",
    "America/New_York",
    "Asia/Tokyo",
    "Asia/Kolkata",
    "Australia/Sydney",
    "Europe/London",
    "Europe/Berlin",
    "America/Los_Angeles",
    "Asia/Singapore",
    "America/Sao_Paulo"
  ]; // Sample timezones
  const statuses = ['Online', 'Offline']; // Sample statuses ['Online', 'Offline', 'Away', 'Busy']

  // Function to handle modal open/close for logged-in user
  const handleShowUserModal = () => setShowUserModal(true);
  const handleCloseUserModal = () => setShowUserModal(false);

  // Function to handle the 'Add Chat' modal
  const handleShowAddChatModal = () => setShowAddChatModal(true);
  const handleCloseAddChatModal = () => setShowAddChatModal(false);

  const avatar = useMemo(() => {
    return createAvatar(lorelei, {
      size: 128,
      seed: 24,
      // ... other options
    }).toDataUri();
  }, []);

  const handleInputChange = (e) => {
    setUserDetails({ ...userDetails, [e.target.name]: e.target.value });
  };

  const handleEditClick = () => {
    setIsEditing(true); // Enable editing
  };

  const handleSaveClick = () => {
    setIsEditing(false); // Disable editing
    // Prepare the data to send in the API request
    const updatedData = {
      online_status: userDetails.onlineStatus, // Example: "Online"
      timezone: userDetails.timezone, // Example: "IST"
      aboutme: userDetails.about, // Example: "Updated about me text"
    };

    // Call the FastAPI endpoint to update user details
    fetch(`http://localhost:8000/users/${loggedInUser.name}`, {
      method: 'PUT', // The HTTP method for the API call
      headers: {
        'Authorization': `Basic ${encodedCredentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData)
    })
      .then(response => response.json())
      .then(data => {
        // Handle the response from the API
        toast.success('User profile updated successfully!', {
          position: "top-right",
          autoClose: 2000,
        });
        console.log('User updated successfully:', data);

        // Retrieve the user object from localStorage
        const storedUser = JSON.parse(localStorage.getItem('user'));

        // Update the online_status field in the user object
        if (storedUser) {
          storedUser.online_status = updatedData.online_status;
          var refreshpage = false;
          if (storedUser.online_status !== loggedInUser.online_status) {
            refreshpage = true;
          }
          // Update other fields if necessary
          storedUser.timezone = updatedData.timezone;
          storedUser.aboutme = updatedData.aboutme;

          // Save the updated user object back to localStorage
          localStorage.setItem('user', JSON.stringify(storedUser));

          // Optionally, update the state of loggedInUser if needed
          setLoggedInUser(prevState => ({
            ...prevState,
            ...updatedData
          }));
          if (refreshpage === true) {
            window.location.reload();
          }
        }
      })
      .catch(error => {
        // Handle any errors
        toast.warn(`Error updating user: ${error}`, {
          position: "top-right",
          autoClose: 2000,
        });
        console.error('Error updating user:', error);
      });

    console.log('Saved details:', userDetails);
  };


  const handleCloseModal = () => {
    setIsEditing(false); // Reset isEditing when modal closes
    handleCloseUserModal(); // Close the modal
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logged out successfully!', {
      position: "top-right",
      autoClose: 2000,
    });
    setTimeout(() => {
      window.location.reload();
      window.location.href = '/login';
    }, 2000);
  };

  const handleAddChat = async () => {
    if (newChatName.trim()) {
      try {
        const username = localStorage.getItem('username'); // Get username from local storage
        const password = localStorage.getItem('password'); // Get password from local storage

        // Customizable base URI
        const baseURI = 'http://localhost:8000'; // You can change this as needed
        const endpoint = `${baseURI}/chats/`; // Complete endpoint

        //chat participants
        const chatparticipants = [username, newChatName];
        console.log(chatparticipants)

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + btoa(`${username}:${password}`) // Basic auth
          },
          body: JSON.stringify({
            participants: chatparticipants // Add the participants as needed
          }),
        });

        if (!response.ok) {
          // Handle different error cases based on status code
          const errorData = await response.json();
          let errorMessage = 'Failed to create chat.';

          if (response.status === 400) {
            errorMessage = errorData.detail || 'Chat with the same participants already exists.';
          } else if (response.status === 404) {
            errorMessage = errorData.detail || 'One or more participants do not exist.';
          } else if (response.status === 500) {
            errorMessage = 'Internal server error. Please try again later.';
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('New chat created with ID:', data.chat_id);
        // Call the parent function to add the chat to the list dynamically
        onAddChat({ id: data.chat_id, name: data.name, participants: data.participants, image: data.image });
        setNewChatName(''); // Clear the input field
        handleCloseAddChatModal(); // Close the modal
        toast.success('Chat added successfully!', {
          position: 'top-right',
          autoClose: 2000,
        });
      } catch (error) {
        console.error('Error creating chat:', error);
        toast.error(error.message, {
          position: 'top-right',
          autoClose: 2000,
        });
      }
    } else {
      toast.error('Chat name cannot be empty!', {
        position: 'top-right',
        autoClose: 2000,
      });
    }
  };

  // Filter chats based on search query
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOnlineUsers = onlineUsers.filter((user) =>
    user.toLowerCase().includes(onlineSearchQuery.toLowerCase())
  );

  

  useEffect(() => {
    if (loggedInUser) {
      setUserDetails({
        name: loggedInUser.name,
        about: loggedInUser.aboutme || 'No information provided', // Fallback if aboutme is not available
        timezone: loggedInUser.timezone || 'Default Timezone', // Fallback timezone
        onlineStatus: loggedInUser.online_status || 'offline', // Fallback to 'offline'
      });
    }
  }, [loggedInUser]);

  useEffect(() => {
    // Focus the input when the modal is opened
    if (showAddChatModal && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showAddChatModal]);


  return (
    <div className="chat-header chat-list-container p-3 d-flex flex-column" style={{ height: '100vh', borderRight: '1px solid #ddd' }}>
      {/* Chats header */}
      <div className="chat-header-title mb-3 d-flex justify-content-between align-items-center p-2 bg-gradient shadow-sm">
        <h5 className="chat-title mb-0 d-flex align-items-center">
          <i className="fas fa-comments me-2 text-primary chat-icon"></i> Chatify
        </h5>
        {/* Add Chat Button */}
        <button className="btn btn-success" onClick={handleShowAddChatModal}>
          <i className="fas fa-plus me-2"></i> Add Chat
        </button>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs" id="chatTabs" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className="nav-link active"
            id="chats-tab"
            data-bs-toggle="tab"
            data-bs-target="#chats"
            type="button"
            role="tab"
            aria-controls="chats"
            aria-selected="true"
          >
            Chats
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className="nav-link"
            id="online-users-tab"
            data-bs-toggle="tab"
            data-bs-target="#online-users"
            type="button"
            role="tab"
            aria-controls="online-users"
            aria-selected="false"
          >
            Online Users
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content" id="chatTabsContent" style={{ height: '100%', overflow: 'auto' }}>
        {/* Chat List Tab */}
        <div
          className="tab-pane fade show active"
          id="chats"
          role="tabpanel"
          aria-labelledby="chats-tab"
        >
          {/* Search bar */}
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Chat list */}
          <div className="list-group flex-grow-1 overflow-auto">
            {filteredChats.length > 0 ? (
              filteredChats.map((chat, index) => (
                <div
                  key={index}
                  className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between mb-2 border-0 rounded chat-list-item ${selectedChat && selectedChat.id === chat.id ? 'active-chat' : ''}`}
                  onClick={() => onChatSelect(chat)}
                  style={{ height: '80px' }}
                >
                  <div className="d-flex align-items-center me-3">
                    {chat.participants.length === 2 ? (
                      <div className="chat-avatar-container">
                        <img
                          src={chat.participants[0].avatar || avatar}
                          alt={`${chat.participants[0].name} avatar`}
                          className="chat-avatar chat-avatar-1"
                        />
                        <img
                          src={chat.participants[1].avatar || avatar}
                          alt={`${chat.participants[1].name} avatar`}
                          className="chat-avatar chat-avatar-2"
                        />
                      </div>
                    ) : (
                      <img
                        src={loggedInUser.avatarUrl}
                        alt="Chat avatar"
                        className="rounded-circle chat-list-image"
                        style={{ width: '30px', height: '30px' }}
                      />
                    )}
                  </div>

                  <div className="w-100">
                    <h6 className="mb-1">{chat.name}</h6>
                    {selectedChat && selectedChat.id === chat.id ? null : (
                      <p className="mb-1 text-muted">{chat.latestMessage}</p>
                    )}
                  </div>

                  {!selectedChat || selectedChat.id !== chat.id ? (
                    chat.unreadMessages > 0 && (
                      <span className="badge bg-primary rounded-pill">
                        {chat.unreadMessages}
                      </span>
                    )
                  ) : null}
                </div>
              ))
            ) : (
              <p>No chats found</p>
            )}
          </div>
        </div>

        {/* Online Users Tab */}
        <div
          className="tab-pane fade"
          id="online-users"
          role="tabpanel"
          aria-labelledby="online-users-tab"
        >
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search online users..."
              value={onlineSearchQuery}
              onChange={(e) => setOnlineSearchQuery(e.target.value)}
            />
          </div>
          <div className="list-group flex-grow-1 overflow-auto">
            {filteredOnlineUsers.length > 0 ? (
              filteredOnlineUsers.map((user, index) => (
                <div key={index} className="list-group-item d-flex align-items-center justify-content-between mb-2 border-0 rounded">
                  <div className="d-flex align-items-center">
                    <img
                      src={user.avatarUrl || avatar}
                      alt={`${user.name} avatar`}
                      className="rounded-circle me-3"
                      style={{ width: '40px', height: '40px' }}
                    />
                    <span>{user}</span>
                  </div>
                  <span className="badge bg-success">Online</span>
                </div>
              ))
            ) : (
              <p>No users online</p>
            )}
          </div>
        </div>
      </div>



      {/* Logged-in user profile section */}
      <div className="user-profile-section mt-3">
        <div className="d-flex align-items-center justify-content-between p-2">
          <div className="d-flex align-items-center" onClick={handleShowUserModal}>
            <div className="profile-image-wrapper">
              <img
                src={loggedInUser.avatarUrl} // Use loggedInUser.image for user1 and chat.image for others
                alt={loggedInUser.name}
                className="rounded-circle me-2 profile-image"
                style={{ width: '40px', height: '40px' }}
              />
              {/* Online Badge */}
              <span className={`online-badge ${userDetails.onlineStatus.toLowerCase()}-status`}></span>
            </div>

            <span>{loggedInUser.name}</span>
          </div>
          <div className="d-flex align-items-center">
            <button className="btn btn-danger" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Modal for adding a new chat */}
      {showAddChatModal && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Chat</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseAddChatModal}
                ></button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter username"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  ref={inputRef} // Set the input ref to focus on
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleCloseAddChatModal}>
                  Close
                </button>
                <button className="btn btn-primary" onClick={handleAddChat}>
                  Add Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for logged-in user */}
      {showUserModal && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">User Details : {userDetails.name}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal} // Close button now resets isEditing
                ></button>
              </div>
              <div className="modal-body text-center">
                <div className="profile-image-wrapper-modal">
                  <img
                    src={loggedInUser.avatarUrl || 'https://via.placeholder.com/150'}
                    alt="User Profile"
                    className="rounded-circle mb-3 text-center"
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                  />
                  <span
                    className={`online-badge-modal ${userDetails.onlineStatus.toLowerCase()}-status`}>
                  </span>
                </div>

                {/* Online Status Dropdown */}
                {isEditing ? (
                  <div className="form-floating">
                    <select
                      name="onlineStatus"
                      id="logged-status"
                      className="form-select"
                      value={userDetails.onlineStatus}
                      onChange={handleInputChange}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <label for="logged-status">Online Status</label>
                  </div>
                ) : (
                  <p>{userDetails.onlineStatus}</p>
                )}
                <hr></hr>
                {/* Conditionally Render Dashboard Button */}
                {loggedInUser.name === 'admin' && (
                  <button
                    className="btn btn-primary mb-2"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    <i className="fas fa-chart-bar me-2"></i> Dashboard
                  </button>
                )}
                {/* About Me Field */}
                <div className="form-floating">
                  {isEditing ? (
                    <textarea name="about"
                      className="form-control"
                      rows="3"
                      value={userDetails.about}
                      onChange={handleInputChange}></textarea>
                  ) : (
                    <textarea name="about"
                      className="form-control"
                      rows="3"
                      defaultValue={userDetails.about} readOnly></textarea>
                  )}
                  <label htmlFor="logged-about">About me</label>
                </div>

                <br></br>
                {/* Timezone Dropdown */}
                <div className="form-floating">
                  {isEditing ? (
                    <select
                      name="timezone"
                      id="logged-timezone"
                      className="form-select"
                      value={userDetails.timezone}
                      onChange={handleInputChange}
                    >
                      {timezones.map((zone) => (
                        <option key={zone} value={zone}>{zone}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      name="timezone"
                      id="logged-timezone"
                      className="form-select"
                      defaultValue={userDetails.timezone}
                    >
                      {timezones.map((zone) => (
                        <option key={zone} value={zone}>{zone}</option>
                      ))}
                    </select>
                  )}
                  <label htmlFor="logged-timezone">Timezone</label>
                </div>

              </div>
              <div className="modal-footer">

                {!isEditing ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleEditClick}
                  >
                    Edit
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleSaveClick}
                  >
                    Save
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatList;
