import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, MailOpen, Inbox } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const MessagesInbox = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  // Only show for Admin
  if (user?.role !== 'Admin') return null;

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/messages');
      setMessages(res.data);
      setUnread(res.data.filter(m => !m.read).length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/messages/${id}/read`);
      setMessages(prev => prev.map(m => m._id === id ? { ...m, read: true } : m));
      setUnread(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/messages/mark-all/read');
      setMessages(prev => prev.map(m => ({ ...m, read: true })));
      setUnread(0);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchMessages(); }}
        className="relative p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
        title="Messages"
      >
        <MessageSquare className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-dark-800 border border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-primary-400" />
              <span className="font-semibold text-white text-sm">Member Messages</span>
              {unread > 0 && (
                <span className="px-2 py-0.5 bg-primary-500/20 text-primary-300 text-xs font-bold rounded-full">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-slate-400 hover:text-primary-400 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="max-h-[420px] overflow-y-auto scrollbar-hide">
            {loading ? (
              <div className="py-8 text-center text-slate-500 text-sm">Loading...</div>
            ) : messages.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-3 text-slate-500">
                <MailOpen className="w-8 h-8 opacity-40" />
                <p className="text-sm">No messages yet</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`px-4 py-3 border-b border-white/5 transition-colors ${
                    !msg.read ? 'bg-primary-500/5' : 'hover:bg-white/3'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {/* Avatar */}
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-600 to-accent-blue flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                          {msg.senderName?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-white">{msg.senderName}</span>
                        {!msg.read && (
                          <span className="w-1.5 h-1.5 bg-primary-400 rounded-full shrink-0" />
                        )}
                      </div>
                      {msg.taskTitle && (
                        <p className="text-[10px] text-primary-400 mb-1 font-medium truncate">
                          Re: {msg.taskTitle}
                        </p>
                      )}
                      <p className="text-sm text-slate-300 leading-relaxed break-words">{msg.content}</p>
                      <p className="text-[10px] text-slate-500 mt-1.5">{formatTime(msg.createdAt)}</p>
                    </div>
                    {!msg.read && (
                      <button
                        onClick={() => markRead(msg._id)}
                        className="shrink-0 p-1 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                        title="Mark as read"
                      >
                        <MailOpen className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesInbox;
