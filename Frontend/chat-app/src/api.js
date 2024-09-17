import axios from 'axios';

// Base URL for API requests
const BASE_URL = 'http://localhost:8000'; // Update to your FastAPI base URL

// Function to handle user registration
export const registerUser = async (userData) => {
    try {
      const response = await axios.post(`${BASE_URL}/register`, userData);
      return response.data; // Success response
    } catch (error) {
      if (error.response && error.response.data) {
        // Return error response from FastAPI
        return { error: error.response.data.detail };
      } else {
        return { error: 'Something went wrong, please try again later' };
      }
    }
};

// Function to handle user login
export const loginUser = async (username, password) => {
    const response = await axios.post(`${BASE_URL}/login`, {
        username,
        password,
    });
    return response.data;
};

// Function to get chat list for authenticated user
export const getChatList = async (token) => {
    const response = await axios.get(`${BASE_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

// Function to get chat details by chat_id
export const getChatDetails = async (chatId, token) => {
    const response = await axios.get(`${BASE_URL}/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};


// Function to send a message in a chat
export const sendMessage = async (chatId, message, token) => {
    const response = await axios.post(
        `${BASE_URL}/chats/${chatId}/send_message`,
        { content: message },
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    return response.data;
};
