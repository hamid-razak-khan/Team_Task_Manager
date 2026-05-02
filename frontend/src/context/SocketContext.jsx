import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useLocation } from 'react-router-dom';

const SocketContext = createContext({ socket: null, connected: false, unreadMessages: 0, clearUnread: () => {} });

export const useSocket = () => useContext(SocketContext);

const BACKEND = import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_URL?.replace('/api', '')) ||
  'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  // Storage keys (per user so multiple accounts don't clash)
  const navKey     = user?._id ? `nav_unread_${user._id}`  : 'nav_unread';
  const chatKey    = user?._id ? `unread_${user._id}`       : 'unread_counts';

  // ── Navbar badge count ────────────────────────────────────────────────────────
  const [unreadMessages, setUnreadMessages] = useState(() => {
    try { return parseInt(localStorage.getItem(navKey) || '0', 10); } catch { return 0; }
  });

  // Sync navbar count → localStorage
  useEffect(() => {
    try { localStorage.setItem(navKey, String(unreadMessages)); } catch {}
  }, [unreadMessages, navKey]);

  // Clear navbar badge when user navigates to /chat
  useEffect(() => {
    if (location.pathname === '/chat') setUnreadMessages(0);
  }, [location.pathname]);

  const clearUnread = useCallback(() => setUnreadMessages(0), []);

  // ── Socket ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const s = io(BACKEND, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    s.on('connect',    () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    s.on('receive_message', (msg) => {
      const senderId = msg.senderId?._id || msg.senderId;
      const chatId   = msg.chatId?._id   || msg.chatId;

      // Never count own messages
      if (senderId === user._id) return;

      const onChatPage = window.location.pathname === '/chat';

      if (!onChatPage) {
        // ── User is away from the chat page ──────────────────────────────────
        // 1) Increment navbar badge
        setUnreadMessages(prev => prev + 1);

        // 2) Increment per-chat sidebar count in localStorage
        //    (Chat.jsx will read this when it mounts)
        try {
          const stored = JSON.parse(localStorage.getItem(chatKey) || '{}');
          stored[chatId] = (stored[chatId] || 0) + 1;
          localStorage.setItem(chatKey, JSON.stringify(stored));
        } catch {}
      }
      // If on /chat, Chat.jsx's own socket listener handles per-chat counts
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected, unreadMessages, clearUnread }}>
      {children}
    </SocketContext.Provider>
  );
};
