import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const NotificationContext = createContext(null);

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      const incoming = res.data;

      setNotifications(incoming);
    } catch (err) {
      // Silently fail — don't log to avoid console spam
    }
  }, [user]);

  // Also check deadlines on each poll
  const checkDeadlines = useCallback(async () => {
    if (!user) return;
    try {
      await api.post('/notifications/check-deadlines');
    } catch (_) {}
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    checkDeadlines();

    const interval = setInterval(async () => {
      await checkDeadlines();
      await fetchNotifications();
    }, 45000); // Every 45 seconds

    return () => clearInterval(interval);
  }, [user, fetchNotifications, checkDeadlines]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (_) {}
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all/read');
      setNotifications([]);
    } catch (_) {}
  };

  return (
    <NotificationContext.Provider value={{ notifications, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};
