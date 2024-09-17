import React from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Import FontAwesome CSS
import './ChatList.css'; // Import custom CSS

const ChatList = ({ chats, onChatSelect }) => {
  return (
    <div className="chat-list-container p-3 d-flex flex-column flex-grow-1">
      <button className="btn btn-primary w-100 mb-3">
        <i className="fas fa-plus me-2"></i> Start New Chat
      </button>
      <div className="list-group flex-grow-1 overflow-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className="list-group-item list-group-item-action d-flex align-items-center mb-2 border-0 rounded"
            onClick={() => onChatSelect(chat)}
          >
            <div className="d-flex align-items-center me-3">
              <i className="fas fa-user-circle fa-2x text-primary"></i>
            </div>
            <div className="w-100">
              <h6 className="mb-1">{chat.name}</h6>
              <p className="mb-1 text-muted">{chat.messages[chat.messages.length - 1]?.content || 'No messages'}</p>
            </div>
            <div className="text-muted">
              <i className="fas fa-chevron-right"></i>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatList;
