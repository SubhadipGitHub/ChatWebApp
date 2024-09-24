import React, { useState, useMemo } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Import FontAwesome CSS
import './ChatList.css'; // Import custom CSS
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';

const ChatList = ({ chats, selectedChat, onChatSelect, loggedInUser, onAddChat }) => {
  const [showUserModal, setShowUserModal] = useState(false); // Modal for logged-in user
  const [showChatModal, setShowChatModal] = useState(null); // Modal for chat details
  const [searchQuery, setSearchQuery] = useState(''); // State for search query
  const [showAddChatModal, setShowAddChatModal] = useState(false); // Modal for adding a chat
  const [newChatName, setNewChatName] = useState(''); // State for new chat name

  const [isEditing, setIsEditing] = useState(false); // Track editing state
  const [userDetails, setUserDetails] = useState({
    name: loggedInUser.name,
    about: loggedInUser.aboutme, // Dummy data
    timezone: loggedInUser.timezone, // Default timezone
    onlineStatus: loggedInUser.online_status, // Default online status
  });
  console.log(userDetails);
  const timezones = ['GMT', 'UTC', 'PST', 'EST']; // Sample timezones
  const statuses = ['Online', 'Offline', 'Away', 'Busy']; // Sample statuses

  // Function to handle modal open/close for logged-in user
  const handleShowUserModal = () => setShowUserModal(true);
  const handleCloseUserModal = () => setShowUserModal(false);

  // Function to handle modal open/close for chat details
  const handleShowChatModal = (index) => setShowChatModal(index);
  const handleCloseChatModal = () => setShowChatModal(null);

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
    // Perform any save actions here (e.g., call an API to save the updated data)
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


  return (
    <div className="chat-header chat-list-container p-3 d-flex flex-column" style={{ height: '100vh', borderRight: '1px solid #ddd' }}>
      {/* Chats header */}
      <div className="chat-header-title mb-3 d-flex justify-content-between align-items-center p-2 bg-gradient shadow-sm">
        <h5 className="chat-title mb-0 d-flex align-items-center">
          <i className="fas fa-comments me-2 text-primary chat-icon"></i> Chats
        </h5>
        {/* Add Chat Button */}
        <button className="btn btn-success" onClick={handleShowAddChatModal}>
          <i className="fas fa-plus me-2"></i> Add Chat
        </button>
      </div>


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
              className={`list-group-item list-group-item-action d-flex align-items-center mb-2 border-0 rounded ${selectedChat && selectedChat.id === chat.id ? 'active-chat' : ''
                }`}
              onClick={() => onChatSelect(chat)}
            >
              <div className="d-flex align-items-center me-3" onClick={(e) => { e.stopPropagation(); handleShowChatModal(index); }}>
                {/* Render two participant avatars if chat.participants length is 2 */}
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
                <p className="mb-1 text-muted">{chat.latestMessage}</p>
              </div>
              <div className="text-muted">
                <i className="fas fa-chevron-right"></i>
              </div>
            </div>
          ))
        ) : (
          <p>No chats found</p>
        )}
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
              <span className="online-badge"></span>
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
                  placeholder="Enter chat name"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
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
                <h5 className="modal-title">User Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal} // Close button now resets isEditing
                ></button>
              </div>
              <div className="modal-body">
                <div className="profile-image-wrapper-modal">
                  <img
                    src={loggedInUser.avatarUrl || 'https://via.placeholder.com/150'}
                    alt="User Profile"
                    className="rounded-circle mb-3 text-center"
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                  />
                  <span className="online-badge-modal"></span>
                </div>
                <hr></hr>
                {/* Name Field */}
                <div class="mb-3">
                  <label for="logged-username" class="form-label">Username</label>
                  <input type="text" class="form-control" id="logged-username" placeholder="Enter a username" value={loggedInUser.name} readonly></input>
                </div>

                {/* Online Status Dropdown */}
                <p><strong>Online Status:</strong></p>
                {isEditing ? (
                  <select
                    name="onlineStatus"
                    className="form-select mb-2"
                    value={userDetails.onlineStatus}
                    onChange={handleInputChange}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                ) : (
                  <p>{loggedInUser.online_status}</p>
                )}

                {/* About Me Field */}
                <label for="logged-about" class="form-label">About me</label>
                {isEditing ? (<div class="mb-3">
                  <textarea name="about"
                    className="form-control mb-2"
                    rows="3"
                    value={userDetails.about}
                    onChange={handleInputChange}></textarea>
                </div>) : (
                  <textarea name="about"
                    className="form-control mb-2"
                    rows="3"
                    value={loggedInUser.aboutme} readonly></textarea>
                )}


                {/* Timezone Dropdown */}
                <label for="timezone" class="form-label">Timezone</label>
                {isEditing ? (
                  <select
                    name="timezone"
                    className="form-select mb-2"
                    value={userDetails.timezone}
                    onChange={handleInputChange}
                  >
                    {timezones.map((zone) => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                ) : (
                  <p>{loggedInUser.timezone}</p>
                )}

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
                  onClick={handleCloseModal} // Close button now resets isEditing
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for each chat details */}
      {chats.map((chat, index) => (
        showChatModal === index && (
          <div
            key={index}
            className="modal fade show"
            style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{chat.name} Details</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleCloseChatModal}
                  ></button>
                </div>
                <div className="modal-body text-center">
                  <img
                    src={'https://via.placeholder.com/150'}  // Placeholder image for chat user
                    alt="Chat User"
                    className="rounded-circle mb-3"
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                  />
                  <p><strong>Name:</strong> {chat.name}</p>
                  <p><strong>Last Message:</strong> {chat.latestMessage}</p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseChatModal}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      ))}
    </div>
  );
};

export default ChatList;
