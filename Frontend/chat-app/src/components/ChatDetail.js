import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react'; // Emoji Picker library
import './ChatDetail.css'; // Import custom CSS

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
  // In the component
  const isConnected = useRef(false); // This ref will help track the connection status.

  // Create a reference to the chat messages container
  const chatMessagesRef = useRef(null);

  useEffect(() => {
    if (!isConnected.current) {
        // Join the chat room
        socket.emit('joinChat', { chatId, username: loggedInUser.name });
        socket.emit("join_room", chatId);
        
        isConnected.current = true; // Mark the socket as connected
    }

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

  // Scroll to the bottom whenever messages change
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Send a message to the specific room
  const sendMessage = () => {
    if (message.trim()) {
      const messageData = {
        chat_id: chatId,
        content: message,
        sender: loggedInUser.name,
      };
      console.log(messageData)
      //console.log('Logged in user:', loggedInUser);
      socket.emit("message", messageData);
      setMessage(''); // Clear input after sending
    }
  };

  const handleEmojiClick = (event, emojiObject) => {
    console.log('Event:', event); // Log the event object
    console.log('Emoji Object:', emojiObject); // Log the emoji object
    if (event) {
      setMessage((prevMessage) => prevMessage + event.emoji);
    }
  };

  // Handle the key press event to trigger login on "Enter"
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      sendMessage(); // Call send message function when Enter key is pressed
    }
  };

  // Helper function to format the date
const formatDate = (utcDate) => {
  // Convert UTC date string to a local date
  const messageDate = new Date(utcDate); // Parse the UTC date
  const today = new Date(); // Get today's date in local time

  // Create a new date for yesterday by setting the date to one day prior
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1); 

  // Convert the dates to local date strings for comparison
  const messageDateLocalString = messageDate.toLocaleDateString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  const todayLocalString = today.toLocaleDateString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  const yesterdayLocalString = yesterday.toLocaleDateString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });

  // Debugging logs
  console.log("Message Date (Local):", messageDate.toString());
  console.log("Today (Local):", today.toString());
  console.log("Yesterday (Local):", yesterday.toString());
  console.log("Message Date Local String:", messageDateLocalString);
  console.log("Today's Local Date String:", todayLocalString);
  console.log("Yesterday's Local Date String:", yesterdayLocalString);

  // Compare the local date equivalents
  if (messageDateLocalString === todayLocalString) {
    console.log("Date matches 'Today'");
    return 'Today';
  } else if (messageDateLocalString === yesterdayLocalString) {
    console.log("Date matches 'Yesterday'");
    return 'Yesterday';
  } else {
    const formattedDate = messageDate.toLocaleDateString(); // Format as per user's locale (MM/DD/YYYY or DD/MM/YYYY)
    console.log("Formatted Date:", formattedDate);
    return formattedDate;
  }
};


  return (
    <div className="chat-detail-container d-flex flex-column flex-grow-1">
  {/* Chat header - Stuck at the top */}
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
    // Parse the current message time (stored in ISO UTC format)
    const currentMessageDate = new Date(msg.time);

    // Get the date label for the current message in local time
    const currentDateLabel = formatDate(currentMessageDate);

    // Check the previous message date (if it exists)
    const previousMessageDate = index > 0 ? new Date(messages[index - 1].time) : null;
    const previousDateLabel = previousMessageDate ? formatDate(previousMessageDate) : null;

    // Check if we need to show the date separator
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
              {/* Format the UTC time to the user's local time */}
              {currentMessageDate.toLocaleTimeString([], { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true, 
                timeZone: 'Asia/Kolkata' // Specify the exact time zone
              })}
            </span>
          </div>
        </div>
      </div>
    );
  })}
</div>


  {/* Chat input section - Stuck at the bottom */}
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
      onKeyDown={handleKeyDown} // Attach the enter key listener
    />
    <button className="btn btn-success ms-2" onClick={sendMessage}>
      Send
    </button>
  </div>

  {/* Emoji Picker */}
  {showEmojiPicker && (
    <div className="emoji-picker-container">
      {showEmojiPicker && (
        <EmojiPicker onEmojiClick={handleEmojiClick} />
      )}
    </div>
  )}
</div>

  );
};

export default ChatDetail;
