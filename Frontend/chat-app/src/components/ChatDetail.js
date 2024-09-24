import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react'; // Emoji Picker library
import './ChatDetail.css'; // Import custom CSS
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Create the socket connection outside of the component to avoid re-connection
const socket = io("http://localhost:8000", {
  path: "/socket.io/", // Ensure the correct Socket.IO path is used
  transports: ['websocket'], // WebSocket transport
  timeout: 5000 // Timeout in milliseconds
});

const username = localStorage.getItem('username'); // Get username from local storage
const password = localStorage.getItem('password'); // Get password from local storage

const ChatDetail = ({ chatId, chatName, chatimage, loggedInUser }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // State to show/hide emoji picker
  const [messages, setMessages] = useState([]); // State for chat messages
  const isConnected = useRef(false); // Track connection status

  // Create a reference to the chat messages container
  const chatMessagesRef = useRef(null);

  // Fetch existing messages whenever the chatId changes
  useEffect(() => {
    // Clear previous chat's messages
    setMessages([]);

    if (!isConnected.current) {
      // Connect the socket (no need for rooms now)
      socket.emit('joinChat', { chatId, username: loggedInUser.name });
      isConnected.current = true; // Mark the socket as connected
    }

    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:8000/chats/${chatId}/messages`, {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + btoa(`${username}:${password}`),
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

    const handleNewMessage = (msg) => {
      if (msg.chat_id === chatId) {
        setMessages((prevMessages) => [...prevMessages, msg]);
        if (msg.sender !== loggedInUser.name) {
          toast.success('Message received!', {
            position: 'top-right',
            autoClose: 2000,
          });
        }
      }
    };

    socket.on("new_message", handleNewMessage);

    // Clean up: remove event listener when component unmounts or chatId changes
    return () => {
      socket.off("new_message", handleNewMessage);
    };
  }, [chatId, loggedInUser]);

  // Scroll to the bottom whenever messages change
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Send a message (no need to reference rooms now)
  const sendMessage = () => {
    if (message.trim()) {
      const messageData = {
        chat_id: chatId,
        content: message,
        sender: loggedInUser.name,
      };
      socket.emit("message", messageData);
      setMessage(''); // Clear input after sending
    }
  };

  const handleEmojiClick = (event) => {
    if (event) {
      setMessage((prevMessage) => prevMessage + event.emoji);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  const formatDate = (utcDate) => {
    const messageDate = new Date(utcDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const messageDateLocalString = messageDate.toLocaleDateString('en-US');
    const todayLocalString = today.toLocaleDateString('en-US');
    const yesterdayLocalString = yesterday.toLocaleDateString('en-US');

    if (messageDateLocalString === todayLocalString) {
      return 'Today';
    } else if (messageDateLocalString === yesterdayLocalString) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  return (
    <div className="chat-detail-container d-flex flex-column flex-grow-1">
      <div className="chat-header p-3 bg-light border-bottom d-flex align-items-center">
        <img
          src={chatimage || 'https://via.placeholder.com/50'}
          alt="Chat"
          className="chat-detail-image rounded-circle me-3"
          style={{ width: '50px', height: '50px' }}
        />
        <h5 className="mb-0">{chatName}</h5>
      </div>

      <div className="chat-messages flex-grow-1 overflow-auto p-3" ref={chatMessagesRef}>
        {messages.map((msg, index) => {
          const currentMessageDate = new Date(msg.time);
          const currentDateLabel = formatDate(currentMessageDate);
          const previousMessageDate = index > 0 ? new Date(messages[index - 1].time) : null;
          const previousDateLabel = previousMessageDate ? formatDate(previousMessageDate) : null;
          const showDateSeparator = index === 0 || currentDateLabel !== previousDateLabel;

          return (
            <div key={index}>
              {showDateSeparator && (
                <div className="date-separator text-center my-2">
                  <span className="badge bg-light text-dark">{currentDateLabel}</span>
                </div>
              )}

              <div className={`message ${msg.sender === loggedInUser.name ? 'message-sent' : 'message-received'} d-flex`}>
                <img
                  src={msg.sender === loggedInUser.name ? loggedInUser.avatarUrl : chatimage}
                  alt={msg.sender}
                  className="rounded-circle me-2"
                  style={{ width: '40px', height: '40px' }}
                />
                <div className="message-content">
                  <p>{msg.content}</p>
                  <span className="message-time">
                    {currentMessageDate.toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                      timeZone: 'Asia/Kolkata'
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="chat-input p-3 d-flex align-items-center bg-light border-top">
        <button className="emoji-picker-button" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          😀
        </button>
        <input
          type="text"
          className="form-control me-2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          onKeyDown={handleKeyDown}
        />
        <button className="btn btn-success ms-2" onClick={sendMessage}>
          Send
        </button>
      </div>

      {showEmojiPicker && (
        <div className="emoji-picker-container">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
};

export default ChatDetail;
