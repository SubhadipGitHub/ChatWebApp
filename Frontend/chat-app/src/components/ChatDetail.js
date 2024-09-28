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

// You can import the sound file or reference it from the public folder
const notificationSound = new Audio('/noti_sound.mp3'); // Change to your sound file path

const playSound = () => {
  // Attempt to play the sound and handle any potential errors
  notificationSound.play().catch(error => {
    console.error('Playback failed:', error);
  });
};

const username = localStorage.getItem('username'); // Get username from local storage
const password = localStorage.getItem('password'); // Get password from local storage

// Encode the credentials for Basic Auth
const encodedCredentials = btoa(`${username}:${password}`);

const ChatDetail = ({ chatId, chatName, chatimage, chatparticipants, loggedInUser, onlineusers }) => {
  const [message, setMessage] = useState('');
  const [onlinestatus, setOnlineStatus] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // State to show/hide emoji picker
  const [messages, setMessages] = useState([]); // State for chat messages
  const isConnected = useRef(false); // Track connection status
  const [receiverDetails, setReceiverDetails] = useState(
    {
      name: '',
      about: '',
      avatarUrl: '',
    }
  );
  const [showModal, setShowModal] = useState(false);

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  console.log(onlineusers);

  useEffect(() => {
    // This logic filters the chat participants to find the receiver's name
    let receiverName = '';
    if (chatparticipants.length > 1) {
      receiverName = chatparticipants.filter(item => item !== loggedInUser.name).toString();
    } else {
      receiverName = chatparticipants.toString();
    }

    // Update receiver name first
    setReceiverDetails(prevDetails => ({
      ...prevDetails,
      name: receiverName,
    }));

    // Fetch receiver details from the API
    const fetchReceiverDetails = async (name) => {
      try {
        const baseURI = 'http://localhost:8000';
        const endpoint = `${baseURI}/users/${name}`;

        const response = await fetch(endpoint, { method: 'GET' ,headers: {
          'Authorization': `Basic ${encodedCredentials}`,
          'Content-Type': 'application/json',
      },});
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        // Set receiver details after fetching from the API
        setReceiverDetails(prevDetails => ({
          ...prevDetails,
          about: data.aboutme,
          avatarUrl: data.avatarUrl,
        }));

      } catch (err) {
        console.error("Error fetching user details: ", err);
      }
    };

    // Call fetchReceiverDetails only if receiverName is set
    if (receiverName) {
      fetchReceiverDetails(receiverName);
    }
  }, [loggedInUser.name, chatparticipants]); // Ensures it only runs when `chatparticipants` or `loggedInUser.name` changes


  // Create a reference to the chat messages container
  const chatMessagesRef = useRef(null);

  // Update online status
  useEffect(() => {
    if (onlineusers.find(item => item === receiverDetails.name)) {
      setOnlineStatus(true);
    } else {
      setOnlineStatus(false);  // Ensure the status is updated correctly
    }
  }, [onlineusers, receiverDetails.name]);  // Add `receivername` as a dependency

  // Fetch existing messages whenever the chatId changes
  useEffect(() => {
    // Clear previous chat's messages
    setMessages([]);

    if (!isConnected.current) {
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
      console.log(msg);
      console.log(loggedInUser.name);
      if (Array.isArray(msg.receiver) && msg.receiver.includes(loggedInUser.name)) {
        //console.log(chatId);
        if (msg.chat_id !== chatId) {
          // Strip the message content to the first 50 characters
          const truncatedContent = msg.content.length > 50
            ? msg.content.slice(0, 50) + '...'
            : msg.content;
          const received_msg = `${truncatedContent}`;
          //console.log(received_msg);
          playSound(); // Play the sound when the toast is triggered
          toast.success(
            <div style={{ padding: '10px', lineHeight: '1.5' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontWeight: 'bold' }}>{msg.sender}</h4>
              <p style={{ margin: '0', color: '#f0f0f0' }}>{received_msg}</p>
            </div>,
            {
              position: 'top-right',
              autoClose: 5000, // Closes after 5 seconds
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              style: {
                backgroundColor: '#333', // Dark background color
                color: '#fff', // White text
                borderRadius: '8px', // Rounded corners
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Subtle shadow
              },
              icon: false, // Disable default icon, you can add your own below if needed
            }
          );
        }
      }
      if (msg.chat_id === chatId) {
        setMessages((prevMessages) => [...prevMessages, msg]);
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
        chatparticipants: chatparticipants,
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
      <div className="chat-header p-3 bg-light border-bottom d-flex align-items-center" onClick={handleOpenModal}>
        <img
          src={receiverDetails.avatarUrl || 'https://via.placeholder.com/50'}
          alt="Chat"
          className="chat-detail-image rounded-circle me-3"
          style={{ width: '50px', height: '50px',cursor: 'pointer' }}
        />
        <div className="chat-header-info">
          <h5 className="mb-0">{receiverDetails.name}</h5>
          {/* Online status */}
          <div className="d-flex align-items-center mt-1">
            <span
              className={`me-1 rounded-circle ${onlinestatus ? 'bg-success' : 'bg-secondary'}`}
              style={{ width: '8px', height: '8px' }}
            />
            <span className={`text-${onlinestatus ? 'success' : 'muted'} small`}>
              {onlinestatus ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Modal for receiver details */}
      <div className={`modal fade ${showModal ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Receiver Details : {receiverDetails.name}</h5>
              <button type="button" className="btn-close" onClick={handleCloseModal}></button>
            </div>
            <div className="modal-body align-items-center text-center">
            <div className="profile-image-wrapper">
              <img
                src={receiverDetails.avatarUrl || 'https://via.placeholder.com/100'}
                alt="User"
                className="rounded-circle me-3 profile-image"
                style={{ width: '100px', height: '100px' }}
              />
               {/* Online status badge */}
               <span className={`online-badge-receiver ${onlinestatus ? 'online' : 'offline'}-status`}></span>
               </div>
               <hr></hr>
               <div className="form-floating">                  
                  <input
                    type="text"
                    className="form-control"
                    id="aboutInput"
                    value={receiverDetails.about}
                    readOnly
                  />
                  <label htmlFor="aboutInput">About</label>
            </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Close</button>
            </div>
          </div>
        </div>
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
                  src={msg.sender === loggedInUser.name ? loggedInUser.avatarUrl : receiverDetails.avatarUrl}
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
        <textarea
          type="text"
          className="form-control me-2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          maxLength="200"
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
