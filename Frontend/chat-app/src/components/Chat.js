import React, { useState, useEffect } from 'react';
import ChatList from './ChatList';
import ChatDetail from './ChatDetail';
import './Chat.css'; // Import CSS for the ChatPage layout
import { ToastContainer } from 'react-toastify';

const ChatPage = () => {
  const [chats, setChats] = useState([]); // State to store chat list
  const [selectedChat, setSelectedChat] = useState(null); // State to store selected chat
  const [loggedInUser, setLoggedInUser] = useState({}); // State for logged-in user

  useEffect(() => {
    // Fetch logged-in user from localStorage
    const user = localStorage.getItem('user');
    if (user) {
      setLoggedInUser(JSON.parse(user));
    }

    // Fetch chats from API when component mounts
    const fetchChats = async () => {
      try {
        const username = localStorage.getItem('username'); // Get username from local storage
        const password = localStorage.getItem('password'); // Get password from local storage

        // Customizable base URI
        const baseURI = 'http://localhost:8000'; // You can change this as needed
        const endpoint = `${baseURI}/chats?user_id=${encodeURIComponent(username)}`; // Complete endpoint with user_id parameter

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + btoa(`${username}:${password}`) // Basic auth
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch chats');
        }

        const data = await response.json();
        // Assuming data is an array of chat objects
  const formattedChats = data.map(chat => {
    // Filter out the logged-in user (username) from the participants list
    const participantsWithoutLoggedInUser = chat.participants.filter(
      participant => participant !== username
    );

    // Join remaining participants into a string with '-' separator
    const participantsString = participantsWithoutLoggedInUser.join('-');

    return {
      id: chat._id,
      name: participantsString,   // Use concatenated participants' names
      image: chat.image,          // Assuming you include an image field in your chat data
      messages: chat.messages || [] // Include messages if available
    };
  });

        setChats(formattedChats); // Set the fetched chats
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };

    fetchChats();
  }, []); // Empty dependency array means this runs once on component mount

  const handleChatSelect = (chat) => {
    setSelectedChat(chat); // Update selected chat
  };

  return (
    <div className="chat-page-container d-flex">
      <ChatList chats={chats} onChatSelect={handleChatSelect} loggedInUser={loggedInUser} />
      {selectedChat && <ChatDetail chatId={selectedChat.id} chatimage={selectedChat.image} chatName={selectedChat.name} loggedInUser={loggedInUser} />} {/* Pass chatId and chatName */} 

      {/* Add the ToastContainer at the end */}
      <ToastContainer />
    </div>
  );
};

export default ChatPage;
