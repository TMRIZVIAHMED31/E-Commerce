import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { apiOrigin } from '../api/axios';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
      return;
    }

    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      apiOrigin;

    const socket = io(socketUrl, {
      auth: { token },
    });
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (error) => {
      console.error('Socket connection failed:', error.message);
      setConnected(false);
    });
    socketRef.current = socket;
    setSocket(socket);

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [token]);

  return <SocketContext.Provider value={{ socket, connected }}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
