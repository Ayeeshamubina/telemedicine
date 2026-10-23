import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
    if (socket && user?._id) {
      socket.emit('register_user', user._id);
    }
  }, [user, socket]);

  useEffect(() => {
    // In production (Vercel) connect to Render backend URL; locally fallback to window.location.origin
    const backendUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || window.location.origin;
    const newSocket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      if (userRef.current?._id) {
        newSocket.emit('register_user', userRef.current._id);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
