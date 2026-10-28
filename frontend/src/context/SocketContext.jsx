import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeOfferUpdates, setActiveOfferUpdates] = useState({});

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize socket connection
    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('Socket.io connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket.io disconnected');
      setIsConnected(false);
    });

    // Real-time notifications
    socketInstance.on('notification', (notif) => {
      console.log('Real-time notification received:', notif);
      setNotifications((prev) => [
        { ...notif, id: Date.now(), timestamp: new Date().toLocaleTimeString() },
        ...prev.slice(0, 19),
      ]);
    });

    // Offer updates inside rooms
    socketInstance.on('offer_updated', (updatedOffer) => {
      console.log('Offer updated live:', updatedOffer);
      setActiveOfferUpdates((prev) => ({
        ...prev,
        [updatedOffer.offer_id]: updatedOffer,
      }));
    });

    socketInstance.on('offer_accepted', (data) => {
      console.log('Offer accepted live:', data);
      setActiveOfferUpdates((prev) => ({
        ...prev,
        [data.offer_id]: { ...prev[data.offer_id], ...data, status: 'Accepted' },
      }));
    });

    socketInstance.on('offer_rejected', (data) => {
      console.log('Offer rejected live:', data);
      setActiveOfferUpdates((prev) => ({
        ...prev,
        [data.offer_id]: { ...prev[data.offer_id], ...data, status: 'Rejected' },
      }));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, user?.id]);

  const joinOfferRoom = (offerId) => {
    if (socket && isConnected) {
      socket.emit('join_offer_room', { offer_id: offerId });
    }
  };

  const leaveOfferRoom = (offerId) => {
    if (socket && isConnected) {
      socket.emit('leave_offer_room', { offer_id: offerId });
    }
  };

  const clearNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        notifications,
        clearNotification,
        activeOfferUpdates,
        joinOfferRoom,
        leaveOfferRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
