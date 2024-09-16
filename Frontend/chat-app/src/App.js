import React, { useState } from 'react';
import './App.css';

const App = () => {
  // Dummy data for chat list and messages
  const chatList = [
    { id: 1, name: 'Alice', lastMessage: 'Hello there!' },
    { id: 2, name: 'Bob', lastMessage: 'How are you doing?' },
    { id: 3, name: 'Charlie', lastMessage: 'Are you free tomorrow?' },
  ];

  const [selectedChat, setSelectedChat] = useState(chatList[0]);

  // Dummy messages for selected chat
  const messages = [
    { sender: 'Alice', content: 'Hey, how’s it going?' },
    { sender: 'Me', content: 'Not bad! How about you?' },
    { sender: 'Alice', content: 'I’m good, just checking in.' },
  ];

  return (
    <div className="container-fluid">
      <div className="row vh-100">
        {/* Left Section - Chat List */}
        <div className="col-md-4 col-lg-3 border-end chat-list">
          <h4 className="p-3">Chats</h4>
          <div className="list-group">
            {chatList.map((chat) => (
              <button
                key={chat.id}
                className={`list-group-item list-group-item-action ${selectedChat.id === chat.id ? 'active' : ''}`}
                onClick={() => setSelectedChat(chat)}
              >
                <h5>{chat.name}</h5>
                <p className="text-muted">{chat.lastMessage}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Section - Chat Details */}
        <div className="col-md-8 col-lg-9 chat-details">
          <div className="d-flex flex-column vh-100">
            <div className="border-bottom p-3 bg-light">
              <h4>{selectedChat.name}</h4>
            </div>

            <div className="flex-grow-1 p-3 overflow-auto">
              {messages.map((msg, index) => (
                <div key={index} className={`mb-3 ${msg.sender === 'Me' ? 'text-end' : 'text-start'}`}>
                  <strong>{msg.sender}: </strong>
                  <span>{msg.content}</span>
                </div>
              ))}
            </div>

            <div className="border-top p-3 bg-light">
              <form className="d-flex">
                <input type="text" className="form-control me-2" placeholder="Type a message..." />
                <button className="btn btn-primary" type="submit">
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
