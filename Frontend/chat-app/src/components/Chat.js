import React, { useState, useEffect } from 'react';
import ChatList from './ChatList';
import ChatDetail from './ChatDetail'; // Assuming you have a ChatDetail component
import './Chat.css'; // Import CSS for the ChatPage layout

const ChatPage = () => {
  const [chats, setChats] = useState([]); // State to store chat list
  const [selectedChat, setSelectedChat] = useState(null); // State to store selected chat

  useEffect(() => {
    // Fetch chats from API when component mounts
    const fetchChats = async () => {
      try {
        // Simulate API response with mock data
        const response = [
          {
            id: 'chat1',
            name: 'Chat with Alice',
            messages: [
              { sender: 'user1', content: 'Hello Alice!', time: '10:00 AM' },
              { sender: 'alice', content: 'Hi there!', time: '10:01 AM' },
            ],
          },
          {
            id: 'chat2',
            name: 'Chat with Bob',
            messages: [
              { sender: 'user1', content: 'Hey Bob, how are you?', time: '10:05 AM' },
              { sender: 'bob', content: 'I’m good, thanks!', time: '10:06 AM' },
            ],
          },
        ];
        setChats(response); // Directly set mock data
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
      <ChatList chats={chats} onChatSelect={handleChatSelect} />
      {selectedChat && <ChatDetail chat={selectedChat} />} {/* Render ChatDetail if a chat is selected */}
    </div>
  );
};

export default ChatPage;
