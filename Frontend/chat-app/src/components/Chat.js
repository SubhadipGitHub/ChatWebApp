import React, { useState, useEffect } from 'react';
import ChatList from './ChatList';
import ChatDetail from './ChatDetail';
import './Chat.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { io } from 'socket.io-client';

// Initialize the socket connection once outside the component
let socket;

const ChatPage = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    // Fetch logged-in user from localStorage
    const user = localStorage.getItem('user');

    if (user) {
      const parsedUser = JSON.parse(user);
      setLoggedInUser(parsedUser);

      // Initialize the socket only if it's not already connected
      if (!socket) {
        socket = io("http://localhost:8000", {
          path: "/socket.io/",
          transports: ['websocket'],
          timeout: 5000,
        });

        socket.on('connect', () => {
          console.log('Socket connected. Emitting user_connected...');
          socket.emit('user_connected', { username: parsedUser.name });
        });

        // Listen for users going online
        socket.on('user_online', (data) => {
          if (parsedUser.name !== data.username) {
            toast.success(`${data.username} is online!`);
          }
          setOnlineUsers((prevOnlineUsers) => [...prevOnlineUsers, data.username]);
        });

        // Listen for users going offline
        socket.on('user_offline', (data) => {
          toast.warn(`${data.username} is offline!`);
          setOnlineUsers((prevOnlineUsers) => 
            prevOnlineUsers.filter(user => user !== data.username)
          );
        });
      }

      // Fetch chats after confirming the user is logged in
      const fetchChats = async () => {
        try {
          const username = localStorage.getItem('username');
          const password = localStorage.getItem('password');
          const baseURI = 'http://localhost:8000';
          const endpoint = `${baseURI}/chats?user_id=${encodeURIComponent(username)}`;

          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': 'Basic ' + btoa(`${username}:${password}`)
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch chats');
          }

          const data = await response.json();
          const formattedChats = data.map(chat => ({
            id: chat._id,
            name: chat.name,
            image: chat.image,
            participants: chat.participants || [],
          }));

          setChats(formattedChats);
        } catch (error) {
          console.error('Error fetching chats:', error);
        }
      };

      fetchChats();

    } else {
      console.warn("User is not logged in. Socket connection will not be established.");
    }

    // Cleanup socket listeners when the component unmounts
    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('user_online');
        socket.off('user_offline');
        socket.disconnect(); // Disconnect the socket
        socket = null; // Clear the socket variable to prevent reinitialization
      }
    };
  }, []);  // Empty dependency ensures it runs only once


  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
  };

  return (
    <div className="chat-page-container">
      <div className="chat-list-container">
        <ChatList chats={chats} onChatSelect={handleChatSelect} loggedInUser={loggedInUser} selectedChat={selectedChat} />
      </div>

      <div className={`chat-detail-container ${selectedChat ? 'active' : ''}`}>
        {selectedChat && (
          <ChatDetail 
            chatId={selectedChat.id}
            chatimage={selectedChat.image}
            chatName={selectedChat.name}
            loggedInUser={loggedInUser}
          />
        )}
      </div>

      <ToastContainer />
    </div>
  );
};

export default ChatPage;
