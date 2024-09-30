import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatList from './ChatList';
import ChatDetail from './ChatDetail';
import './Chat.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { io } from 'socket.io-client';

// Initialize the socket connection outside the component to ensure only one instance
let socket = null;

const ChatPage = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);

  const isConnected = useRef(false); // Track connection status

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
        latestMessage: chat.latestMessage,
        unreadMessages: chat.unreadMessageCounter
      }));

      setChats(formattedChats);

      // Set the first chat as the selected chat if any exist
      if (formattedChats.length > 0) {
        setSelectedChat(formattedChats[0]);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem('user');

    if (user) {          
      const parsedUser = JSON.parse(user); 

      // Ensure socket is only initialized once
      if (!socket) {
        socket = io("http://localhost:8000", {
          path: "/socket.io/",
          transports: ['websocket'],
          timeout: 5000,
        });

        if (!isConnected.current) {
          console.log('Socket connected. Emitting user_connected...');
          socket.emit('user_connected', { username: parsedUser.name });          
          
          setLoggedInUser(parsedUser);
          console.log(loggedInUser);
          isConnected.current = true; // Mark the socket as connected
        };

        // Listen for users going online
        socket.on('user_online', (data) => {
          if (parsedUser.name !== data.username) {
            toast.success(`${data.username} is online!`);
          }
          // Update the onlineUsers state with the list returned from data.online_users
          setOnlineUsers(data.online_users);
          console.log(`${data.username} is online`);
        });

        // Listen for users going offline
        socket.on('user_offline', (data) => {
          toast.warn(`${data.username} is offline!`);
          // Update the onlineUsers state with the list returned from data.online_users
          setOnlineUsers(data.online_users);
          console.log(`${data.username} is offline`);
        });

        // Listen for the new chat event
        socket.on('new_chat', (chatData) => {
          // Check if the logged-in user is the receiver of the new chat
          console.log('New chat received:', chatData);
          console.log(loggedInUser);
          if (chatData.participants.includes(loggedInUser.name)) {
            console.log('New chat received:', chatData);
            // Add the new chat to the list
            setChats((prevChats) => [...prevChats, {
              id: chatData.chat_id,
              name: chatData.name,
              image: chatData.image,
              participants: chatData.participants,
              unreadMessages:0
            }]);
          }
        });
      }

      fetchChats();  // Assuming this is a function to fetch chats


    } else {
      console.warn("User is not logged in. Socket connection will not be established.");
    }

    // Cleanup socket listeners when the component unmounts
    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('user_online');
        socket.off('user_offline');
        socket.off('new_chat');
        socket = null;  // Clear the socket variable to prevent reinitialization
      }
    };
  }, [loggedInUser]);  // Empty dependency ensures it runs only once

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
  };

  const handleAddChatToList = (newChat) => {
    setChats((prevChats) => [...prevChats, newChat]); // Add the new chat dynamically
    fetchChats();
  };

  // Memoize the update function using useCallback
  const updateLatestMessage = useCallback((chat_id, newMessage, read) => {
    //console.log("update latest message");
    //console.log(`Before update`);
    //console.log(chats);
    if (read === true) {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chat_id ? { ...chat, unreadMessages: 0 } : chat
        )
      );
    }
    else {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chat_id ? { ...chat, latestMessage: newMessage, unreadMessages: chat.unreadMessages + 1 } : chat
        )
      );
    }
    //console.log(`After update ${chat_id}-${newMessage}`);
    //console.log(chats);
  }, [setChats]); // Dependency array should include setChats

  return (
    <div className="chat-page-container">
      <div className="chat-list-container">
        <ChatList chats={chats} onUpdateMessage={updateLatestMessage} onChatSelect={handleChatSelect} loggedInUser={loggedInUser} setLoggedInUser={setLoggedInUser} onlineUsers={onlineUsers} selectedChat={selectedChat} onAddChat={handleAddChatToList} />
      </div>

      <div className={`col-md-8 chat-detail-container d-flex align-items-center justify-content-center ${selectedChat ? 'active' : ''}`}>
        {selectedChat ? (
          <ChatDetail
            chatId={selectedChat.id}
            chatimage={selectedChat.image}
            chatName={selectedChat.name}
            loggedInUser={loggedInUser}
            onlineusers={onlineUsers}
            chatparticipants={selectedChat.participants}
            onUpdateMessage={updateLatestMessage}
          />
        ) : (
          // Render Help Text when no chat is selected        
          <div className="help-text text-center animate-fade-in">
            <h2 className="h4 mb-3 text-primary">No Chat Selected</h2>
            <div className="mb-4">
              <i className="bi bi-chat-dots-fill icon-style"></i>
            </div>
            <p className="text-muted">Please select a chat from the list to start messaging.</p>
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
};

export default ChatPage;
