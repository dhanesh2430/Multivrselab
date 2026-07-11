import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  
  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Online users registry (userId -> true)
  const [onlineUsers, setOnlineUsers] = useState({});

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err.message);
    }
  };

  const markAsRead = async (id) => {
    try {
      const { data } = await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      console.error('Failed to mark notification as read:', err.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err.message);
    }
  };

  const clearNotifications = async () => {
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear notifications:', err.message);
    }
  };

  useEffect(() => {
    if (!token) {
      // Disconnect if logged out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      setNotifications([]);
      setUnreadCount(0);
      setOnlineUsers({});
      return;
    }

    // Fetch initial notifications
    fetchNotifications();

    // Create socket with JWT in handshake (strip trailing /api suffix if present)
    const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socketUrl = rawApiUrl.replace(/\/api\/?$/, '');
    const socket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    // Real-time personal notification listener
    socket.on('notification', (payload) => {
      const notifId = payload._id || payload.id;
      const currentUserId = user?.id || user?._id;
      
      // If it is a personal database notification
      if (notifId && payload.userId?.toString() === currentUserId?.toString()) {
        const normalizedPayload = {
          ...payload,
          _id: notifId,
          id: notifId
        };
        setNotifications((prev) => [normalizedPayload, ...prev].slice(0, 30));
      }
    });

    socket.on('unreadCountUpdate', ({ unreadCount: count }) => {
      setUnreadCount(count);
    });

    // Online/Offline tracking events
    socket.on('userOnline', ({ userId }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: true }));
    });

    socket.on('userOffline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token, user?.id]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        notifications,
        unreadCount,
        onlineUsers,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        clearNotifications
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
