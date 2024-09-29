# Chat Application Using FastAPI, React, and MongoDB

Welcome to the **Chat Application** project! This is a full-stack web application that combines **FastAPI** for the backend and **React** for the frontend, with real-time communication powered by **Socket.io** and data stored in **MongoDB Atlas**.

## System Overview

This chat system is designed to support real-time messaging, user authentication, and message persistence using modern web technologies. The system comprises:

- **Backend:** FastAPI
- **Frontend:** React with Bootstrap
- **Database:** MongoDB Atlas
- **Real-time Messaging:** Socket.io

### Architecture Diagram

Here is an overview of the system architecture:

![Architecture Diagram](assets/system-architecture.png)

In this architecture:
- The **frontend** is built using **React** and communicates with the backend using **REST API** calls for user management and fetching chat history.
- **Socket.io** is used for real-time communication between clients.
- **FastAPI** serves as the backend REST API and WebSocket server for real-time data.
- **MongoDB Atlas** is used to store user information, chat history, and real-time message persistence.

---

## Backend (FastAPI)

The backend of the application is powered by **FastAPI**, which provides both a REST API for managing users and chat messages, as well as WebSocket for real-time communication. 

Key features of the FastAPI backend:
- **User registration and authentication** using OAuth2 and JWT tokens.
- **Message storage** in MongoDB Atlas.
- **WebSocket support** for real-time messaging.

### Key Endpoints

- **POST /register:** Register a new user.
- **POST /login:** User authentication with OAuth2.
- **GET /chats/{user_id}:** Retrieve all messages for a user.
- **WebSocket /ws/chat:** Real-time communication channel for chat.

![FastAPI Endpoints Diagram](assets/api-endpoints.png)

---

## Frontend (React + Bootstrap)

The **React** frontend is designed to be responsive, leveraging **Bootstrap 5.3** for layout and styling. The application includes two main views:

1. **Chat List View**: Displays all conversations.
2. **Chat Detail View**: Displays the messages in the selected conversation with a message input form for sending messages.

Key components:
- **ChatList:** Shows a list of chats for the current user.
- **ChatDetail:** Displays the conversation for a selected chat.
- **MessageForm:** Allows the user to type and send messages.

### UI Design

Here's an example of how the frontend layout is structured:

![UI Layout](assets/ui-layout.png)

---

## Real-time Messaging (Socket.io)

Real-time messaging is achieved with **Socket.io** on both the backend and frontend. The FastAPI WebSocket route connects clients to the chat room and broadcasts new messages to all participants.

![Socket.io Flow](assets/socket-io-flow.png)

- **Client-Side:** Messages sent from the chat input are transmitted via WebSocket to the backend.
- **Server-Side:** FastAPI WebSocket handles broadcasting the messages to the appropriate chat participants.
  
---

## Database (MongoDB Atlas)

We use **MongoDB Atlas** to store user profiles, chat lists, and message history. The database is structured with collections for **users**, **chats**, and **messages**.

### MongoDB Schema

- **Users Collection:**
  - `username`
  - `password_hash`
  - `email`
  - `created_at`

- **Chats Collection:**
  - `user_id`
  - `participants`
  - `last_message`
  - `created_at`

- **Messages Collection:**
  - `chat_id`
  - `sender_id`
  - `content`
  - `timestamp`

![MongoDB Schema Diagram](assets/mongodb-schema.png)

---

## Running the Application

### Prerequisites

To run this application, ensure that you have the following installed:
- **Node.js** and **npm** (for React frontend)
- **Python 3.8+** (for FastAPI backend)
- **MongoDB Atlas** account (for database)

### Installation and Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/chat-app
   cd chat-app

### Run the Backend

`cd Backend`
`create a .env file`
`
MONGO_URI='xxxxxxxx'
ADMIN_USER='admin'
ADMIN_PASS='password'
ADMIN_EMAIL='admin@admin.com'
ADMIN_GENDER='male'
ADMIN_TIMEZONE='Asia/Kolkata'
`
`uvicorn app:app --reload`

#### Run the Frontend

`cd Frontend`
`cd chat-app`
`npm start`

#### Issues

Sometimes if you are working in Mongo DB Atlas the network access for local might change.Either you add current IP or give it all IP permissionIn production usually give production domain IP permission.