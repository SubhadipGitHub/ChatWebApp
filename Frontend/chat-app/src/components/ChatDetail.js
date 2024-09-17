import React, { useState } from 'react';
import './ChatDetail.css'; // Import custom CSS

const ChatDetail = ({ chat }) => {
  const [message, setMessage] = useState('');

  const handleSendMessage = async () => {
    // Add functionality to send message
    console.log('Sending message:', message);
    setMessage(''); // Clear input field after sending
  };

  return (
    <div className="chat-detail-container d-flex flex-column flex-grow-3">
      <div className="chat-messages flex-grow-1 overflow-auto p-3">
        {chat.messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === 'user1' ? 'message-sent' : 'message-received'}`}
          >
            <div className="message-content">
              <p>{msg.content}</p>
              <span className="message-time">{msg.time}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="chat-input p-3">
        <input
          type="text"
          className="form-control"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
        />
        <button className="btn btn-primary mt-2" onClick={handleSendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatDetail;
