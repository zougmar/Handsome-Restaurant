import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

// Mock socket for serverless environments (Vercel doesn't support Socket.io)
const createMockSocket = () => {
  return {
    on: () => {},
    off: () => {},
    emit: () => {},
    disconnect: () => {},
    connected: false
  };
};

export const initSocket = () => {
  // In serverless environment (Vercel), use mock socket
  // Check if we're in production and using relative URLs (serverless)
  const isServerless = !process.env.REACT_APP_SOCKET_URL && typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
  
  if (isServerless) {
    console.warn('Socket.io not supported in serverless. Using mock socket.');
    socket = createMockSocket();
    return socket;
  }

  if (!socket) {
    try {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
      });
      
      socket.on('connect_error', (error) => {
        console.warn('Socket connection error:', error.message);
        // Fallback to mock socket if connection fails
        socket = createMockSocket();
      });
    } catch (error) {
      console.warn('Failed to initialize socket:', error);
      socket = createMockSocket();
    }
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket && socket.disconnect) {
    socket.disconnect();
    socket = null;
  }
};
