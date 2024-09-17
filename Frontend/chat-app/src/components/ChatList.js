import React, { useState } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Import FontAwesome CSS
import './ChatList.css'; // Import custom CSS

const ChatList = ({ chats, onChatSelect, loggedInUser }) => {
  const [showUserModal, setShowUserModal] = useState(false); // Modal for logged-in user
  const [showChatModal, setShowChatModal] = useState(null); // Modal for chat details

  // Function to handle modal open/close for logged-in user
  const handleShowUserModal = () => setShowUserModal(true);
  const handleCloseUserModal = () => setShowUserModal(false);

  // Function to handle modal open/close for chat details
  const handleShowChatModal = (index) => setShowChatModal(index);
  const handleCloseChatModal = () => setShowChatModal(null);

  return (
    <div className="chat-list-container p-3 d-flex flex-column" style={{ height: '100vh', borderRight: '1px solid #ddd' }}>
      {/* Chats header */}
      <div className="chat-header mb-3">
        <h5>Chats</h5>
      </div>

      {/* Chat list */}
      <div className="list-group flex-grow-1 overflow-auto">
        {chats.map((chat, index) => (
          <div
            key={index}
            className="list-group-item list-group-item-action d-flex align-items-center mb-2 border-0 rounded"
            onClick={() => onChatSelect(chat)}
          >
            <div className="d-flex align-items-center me-3" onClick={(e) => {e.stopPropagation(); handleShowChatModal(index);}}>
              <i className="fas fa-user-circle fa-2x text-primary"></i>
            </div>
            <div className="w-100">
              <h6 className="mb-1">{chat.name}</h6>
              <p className="mb-1 text-muted">{chat.latestMessage}</p>
            </div>
            <div className="text-muted">
              <i className="fas fa-chevron-right"></i>
            </div>
          </div>
        ))}
      </div>

      {/* Logged-in user profile section */}
      <div className="user-profile-section mt-3">
        <div className="d-flex align-items-center justify-content-between p-2">
          <div className="d-flex align-items-center" onClick={handleShowUserModal}>
            <i className="fas fa-user-circle fa-2x text-primary me-2"></i>
            <span>{loggedInUser.name}</span>
          </div>
        </div>
      </div>

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
                  onClick={handleCloseUserModal}
                ></button>
              </div>
              <div className="modal-body text-center">
                {/* User profile image */}
                <img
                  src={loggedInUser.profileImage || 'https://via.placeholder.com/150'}
                  alt="User Profile"
                  className="rounded-circle mb-3"
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                />
                <p><strong>Name:</strong> {loggedInUser.name}</p>
                <p><strong>Created At:</strong> Jan 1, 2022</p> {/* Dummy data */}
                <p><strong>About Me:</strong> This is a dummy about me section.</p> {/* Dummy data */}
                <p><strong>Status:</strong> Online</p> {/* Dummy data */}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseUserModal}
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
                  {/* Chat user profile image */}
                  <img
                    src={'https://via.placeholder.com/150'}  // Placeholder image for chat user
                    alt="Chat User"
                    className="rounded-circle mb-3"
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                  />
                  <p><strong>Chat Name:</strong> {chat.name}</p>
                  <p><strong>Latest Message:</strong> {chat.latestMessage}</p>
                  <p><strong>Chat Started At:</strong> {chat.startedAt || 'Unknown'}</p> {/* Dummy data */}
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
