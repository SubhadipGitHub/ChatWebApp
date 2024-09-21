import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react'; // Emoji Picker library
import './ChatDetail.css'; // Import custom CSS

// Create the socket connection outside of the component to avoid re-connection
const socket = io("http://localhost:8000", {
  path: "/socket.io/", // Ensure the correct Socket.IO path is used
  transports: ['websocket'], // WebSocket transport
});

const username = localStorage.getItem('username'); // Get username from local storage
const password = localStorage.getItem('password'); // Get password from local storage

const ChatDetail = ({ chatId, chatName, chatimage, loggedInUser }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // State to show/hide emoji picker
  const [messages, setMessages] = useState([]); // State for chat messages

  useEffect(() => {
    // Join the chat room
    socket.emit('joinChat', { chatId, username: loggedInUser.name });

    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:8000/chats/${chatId}/messages`, {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + btoa(`${username}:${password}`), // Adjust as necessary
          },
        });

        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data.messages);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    socket.emit("join_room", chatId);

    // Listen for new messages
    const handleNewMessage = (msg) => {
      console.log(msg);
      if (msg.chat_id === chatId) {
        setMessages((prevMessages) => [...prevMessages, msg]);
      }
    };

    socket.on("new_message", handleNewMessage);

    // Clean up: remove event listener when component unmounts or chatId changes
    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [chatId, loggedInUser]); // Dependencies to ensure effect runs correctly

  // Send a message to the specific room
  const sendMessage = () => {
    if (message.trim()) {
      const messageData = {
        chat_id: chatId,
        text: message,
        sender: loggedInUser.name,
      };
      //console.log(messageData)
      //console.log('Logged in user:', loggedInUser);
      socket.emit("message", messageData);
      setMessage(''); // Clear input after sending
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage((prevMessage) => prevMessage + emojiObject.emoji);
  };

  return (
    <div className="chat-detail-container d-flex flex-column flex-grow-3">
      {/* Chat header */}
      <div className="chat-header p-3 bg-light border-bottom d-flex align-items-center">
        <img
          src={chatimage || 'https://via.placeholder.com/50'} // Display chat image or placeholder
          alt="Chat"
          className="rounded-circle me-3"
          style={{ width: '50px', height: '50px' }}
        />
        <h5 className="mb-0">{chatName}</h5>
      </div>

      {/* Chat messages section */}
      <div className="chat-messages flex-grow-1 overflow-auto p-3">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === loggedInUser.name ? 'message-sent' : 'message-received'} d-flex`}
          >
            <img
              src={msg.sender === loggedInUser.name ? loggedInUser.profileImage : chatimage} // Use user image for logged-in user
              alt={msg.sender}
              className="rounded-circle me-2"
              style={{ width: '40px', height: '40px' }}
            />
            <div className="message-content">
              <p>{msg.content}</p>
              <span className="message-time">{new Date(msg.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chat input section */}
      <div className="chat-input p-3 d-flex align-items-center">
        <button
          className="btn emoji-picker-button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}
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
        <button className="btn btn-success ms-2" onClick={sendMessage}>
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
