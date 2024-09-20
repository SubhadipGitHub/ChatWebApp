import React, { useState } from 'react';
import EmojiPicker from 'emoji-picker-react'; // Emoji Picker library
import './ChatDetail.css'; // Import custom CSS

const ChatDetail = ({ chat , loggedInUser}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // State to show/hide emoji picker

  const handleSendMessage = async () => {
    console.log('Sending message:', message);
    setMessage(''); // Clear input field after sending
  };

  const handleEmojiClick = (emojiObject) => {
    console.log("Selected Emoji Object:", emojiObject);
    // Correctly append the emoji to the message
    setMessage((prevMessage) => prevMessage + emojiObject.emoji);
  };

  return (
    <div className="chat-detail-container d-flex flex-column flex-grow-3">
      {/* Chat header with participant/group name and image */}
      <div className="chat-header p-3 bg-light border-bottom d-flex align-items-center">
        <img
          src={chat.image || 'https://via.placeholder.com/50'}
          alt="Chat"
          className="rounded-circle me-3"
          style={{ width: '50px', height: '50px' }}
        />
        <h5 className="mb-0">{chat.name}</h5>
      </div>

      {/* Chat messages section */}
<div className="chat-messages flex-grow-1 overflow-auto p-3">
  {chat.messages.map((msg, index) => (
    <div
      key={index}
      className={`message ${msg.sender === 'user1' ? 'message-sent' : 'message-received'} d-flex`}
    >
      {/* Message sender's image */}
      <img
        src={msg.sender === 'user1' ? loggedInUser.profileImage : chat.image} // Use loggedInUser.image for user1 and chat.image for others
        alt={msg.sender}
        className="rounded-circle me-2"
        style={{ width: '40px', height: '40px' }}
      />
      <div className="message-content">
        <p>{msg.content}</p>
        <span className="message-time">{msg.time}</span>
      </div>
    </div>
  ))}
</div>

      {/* Chat input section */}
      <div className="chat-input p-3 d-flex align-items-center">
        <button
          className="btn emoji-picker-button"   onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          😀
        </button>
        <input
          type="text"
          className="form-control me-2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
        />
        <button className="btn btn-success ms-2" onClick={handleSendMessage}>
          Send
        </button>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="emoji-picker-container">
          <EmojiPicker onEmojiClick={(event, emojiObject) => handleEmojiClick(emojiObject)} />
        </div>
      )}
    </div>
  );
};

export default ChatDetail;
