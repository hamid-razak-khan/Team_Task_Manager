import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import {
  MessageCircle, Send, Search, Hash,
  ChevronLeft, Loader2, WifiOff, Users, PenSquare, X,
  Check, CheckCheck, LayoutTemplate, Paperclip, File
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
const formatDate = (date) => {
  const d = new Date(date);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString();
};
const getChatName = (chat, me) => {
  if (chat.isGroup) return chat.name || 'Group Chat';
  const other = chat.members?.find(m => (m._id || m) !== me._id);
  return other?.name || 'Unknown';
};
const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);


// ─── Chat list item ───────────────────────────────────────────────────────────
const ChatItem = ({ chat, isActive, me, onClick, unreadCount = 0 }) => {
  const name = getChatName(chat, me);
  const lastMsg = chat.lastMessage;
  const isLastMine = lastMsg?.senderId?._id === me._id || lastMsg?.senderId === me._id;
  const hasUnread = unreadCount > 0 && !isActive;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150
        border-l-2 hover:bg-white/5
        ${isActive
          ? 'bg-primary-500/10 border-primary-500'
          : hasUnread ? 'border-primary-500/50 bg-primary-500/5' : 'border-transparent hover:border-white/10'}`}
    >
      {/* Avatar */}
      <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm
        ${chat.isGroup
          ? 'bg-gradient-to-br from-accent-teal/20 to-primary-500/20 border border-accent-teal/20 text-accent-teal'
          : 'bg-gradient-to-br from-primary-600/20 to-accent-blue/20 border border-primary-500/20 text-primary-300'}`}>
        {chat.isGroup ? <Hash className="w-4 h-4" /> : getInitials(name)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${isActive ? 'text-primary-200 font-semibold' : hasUnread ? 'text-white font-bold' : 'text-white font-semibold'}`}>
            {name}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {lastMsg && (
              <span className={`text-[10px] ${hasUnread ? 'text-primary-400 font-medium' : 'text-slate-500'}`}>
                {formatTime(lastMsg.createdAt)}
              </span>
            )}
            {hasUnread && (
              <span className="min-w-[20px] h-5 px-1.5 bg-primary-500 text-white text-[10px] font-bold
                rounded-full flex items-center justify-center
                shadow-[0_0_8px_rgba(139,92,246,0.5)]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>
        <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
          {lastMsg
            ? `${isLastMine ? 'You: ' : (chat.isGroup ? `${lastMsg.senderId?.name || ''}: ` : '')}${lastMsg.text}`
            : <span className="italic text-slate-600">No messages yet</span>}
        </p>
        {chat.isGroup && (
          <p className="text-[10px] text-slate-600 mt-0.5 flex items-center gap-1">
            <Users className="w-2.5 h-2.5" />
            {chat.members?.length || 0} members
          </p>
        )}
      </div>
    </button>
  );
};

// ─── Main Chat Page ───────────────────────────────────────────────────────────
const Chat = () => {
  const { user } = useAuth();
  const { socket, connected } = useSocket();

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  // Load unread counts from localStorage (persists across refreshes)
  const storageKey = user?._id ? `unread_${user._id}` : 'unread_counts';
  const [unreadCounts, setUnreadCounts] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [msgLoading, setMsgLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [chatSearch, setChatSearch] = useState('');
  const [showList, setShowList] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'projects'
  const [showNewChat, setShowNewChat] = useState(false);
  const [teammates, setTeammates] = useState([]);
  const [dmSearch, setDmSearch] = useState('');

  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert("Only images (JPG, PNG) are supported.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { url, fileName, fileType } = res.data;
      
      // Send message with file
      socket.emit('send_message', {
        chatId: activeChat._id,
        text: '',
        fileUrl: url,
        fileName,
        fileType
      });
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = null;
    }
  };

  // ── Persist unread counts to localStorage on every change ────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(unreadCounts));
    } catch {}
  }, [unreadCounts, storageKey]);

  // ── Init: ensure group chats exist for all projects, then fetch ──────────────
  const fetchChats = useCallback(async () => {
    try {
      await api.post('/chats/init-projects').catch(() => {});
      const [chatsRes, usersRes] = await Promise.all([
        api.get('/chats'),
        api.get('/chats/users'),
      ]);
      setChats(chatsRes.data);
      setTeammates(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Start or open a 1:1 DM ──────────────────────────────────────────────────
  const startDM = async (targetUserId) => {
    try {
      const res = await api.post('/chats', { targetUserId });
      const chat = res.data;
      setChats(prev => {
        const exists = prev.find(c => c._id === chat._id);
        return exists ? prev : [chat, ...prev];
      });
      selectChat(chat);
      setShowNewChat(false);
      setDmSearch('');
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchChats(); }, [fetchChats]);

  // ── Load messages ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeChat) return;
    const load = async () => {
      setMsgLoading(true);
      try {
        const res = await api.get(`/chats/messages/${activeChat._id}`);
        setMessages(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setMsgLoading(false);
      }
    };
    load();
    inputRef.current?.focus();
  }, [activeChat]);

  // ── Mark as read when opening chat ───────────────────────────────────────────
  useEffect(() => {
    if (activeChat && socket && connected) {
      socket.emit('mark_chat_read', { chatId: activeChat._id });
    }
  }, [activeChat, socket, connected]);

  // ── Auto scroll ──────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Socket ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onReceive = (msg) => {
      const chatId = msg.chatId?._id || msg.chatId;
      const senderId = msg.senderId?._id || msg.senderId;
      const isOwnMessage = senderId === user._id;

      if (chatId === activeChat?._id) {
        setMessages(prev => {
          // Remove real-ID duplicate
          const withoutDup = prev.filter(m => m._id !== msg._id);
          if (isOwnMessage) {
            // Remove optimistic copy matched by text
            const withoutOptimistic = withoutDup.filter(
              m => !(m.optimistic && m.text === msg.text)
            );
            return [...withoutOptimistic, msg];
          }
          return [...withoutDup, msg];
        });
        if (!isOwnMessage && socket && connected) {
          socket.emit('mark_chat_read', { chatId });
        }
      } else if (!isOwnMessage) {
        setUnreadCounts(prev => ({ ...prev, [chatId]: (prev[chatId] || 0) + 1 }));
      }
      
      setChats(prev => {
        const exists = prev.find(c => c._id === chatId);
        if (!exists) {
          // New chat we don't have yet — refresh the list
          api.get('/chats').then(res => setChats(res.data)).catch(() => {});
          return prev;
        }
        return prev.map(c => c._id === chatId ? { ...c, lastMessage: msg, updatedAt: msg.createdAt } : c)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    };

    const onTyping = ({ chatId, userId: uid, name }) => {
      if (chatId === activeChat?._id && uid !== user._id)
        setTypingUsers(prev => ({ ...prev, [uid]: name }));
    };
    const onStopTyping = ({ chatId, userId: uid }) => {
      if (chatId === activeChat?._id)
        setTypingUsers(prev => { const n = { ...prev }; delete n[uid]; return n; });
    };

    const onChatRead = ({ chatId, userId: readUserId }) => {
      if (chatId === activeChat?._id && readUserId !== user._id) {
        setMessages(prev => prev.map(m => {
          const isMine = m.senderId?._id === user._id || m.senderId === user._id;
          if (isMine) {
            const currentReadBy = m.readBy || [];
            if (!currentReadBy.includes(readUserId)) {
              return { ...m, readBy: [...currentReadBy, readUserId] };
            }
          }
          return m;
        }));
      }
    };

    socket.on('receive_message', onReceive);
    socket.on('typing', onTyping);
    socket.on('stop_typing', onStopTyping);
    socket.on('chat_read', onChatRead);
    return () => {
      socket.off('receive_message', onReceive);
      socket.off('typing', onTyping);
      socket.off('stop_typing', onStopTyping);
      socket.off('chat_read', onChatRead);
    };
  }, [socket, activeChat, user._id, connected]);

  // ── Send ─────────────────────────────────────────────────────────────────────
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeChat) return;

    const optimistic = {
      _id: `temp-${Date.now()}`,
      chatId: activeChat._id,
      senderId: { _id: user._id, name: user.name },
      text: text.trim(),
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setText('');

    if (socket && connected) {
      socket.emit('send_message', { chatId: activeChat._id, text: optimistic.text });
    } else {
      try {
        const res = await api.post('/chats/messages', { chatId: activeChat._id, text: optimistic.text });
        setMessages(prev => prev.map(m => m._id === optimistic._id ? res.data : m));
      } catch {
        setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      }
    }
    if (socket) socket.emit('stop_typing', { chatId: activeChat._id });
  };

  // ── Typing ───────────────────────────────────────────────────────────────────
  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket || !activeChat) return;
    socket.emit('typing', { chatId: activeChat._id });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() =>
      socket.emit('stop_typing', { chatId: activeChat._id }), 1500);
  };

  // ── Select chat ──────────────────────────────────────────────────────────────
  const selectChat = (chat) => {
    setActiveChat(chat);
    setMessages([]);
    setTypingUsers({});
    setText('');
    setShowList(false);
    setShowMembers(false);
    setUnreadCounts(prev => ({ ...prev, [chat._id]: 0 }));
  };

  // ── Filter by tab ────────────────────────────────────────────────────────────
  const q = chatSearch.toLowerCase();
  const allFiltered = chats.filter(c => getChatName(c, user).toLowerCase().includes(q));
  const tabChats = activeTab === 'projects'
    ? allFiltered.filter(c => c.isGroup)
    : allFiltered;

  // Teammates who do NOT have an existing DM chat yet (for 'All' tab)
  const dmPartnersIds = new Set(
    chats.filter(c => !c.isGroup)
      .flatMap(c => c.members.map(m => m._id || m))
      .filter(id => id !== user._id)
  );
  const unmessaged = teammates.filter(t =>
    !dmPartnersIds.has(t._id) &&
    t.name.toLowerCase().includes(q)
  );

  const filteredTeammates = teammates.filter(t =>
    t.name.toLowerCase().includes(dmSearch.toLowerCase()));

  // Message grouping
  const groupedMessages = messages.reduce((acc, msg) => {
    const key = formatDate(msg.createdAt);
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});
  const typingNames = Object.values(typingUsers);

  return (
    <div className="flex h-[calc(100vh-120px)] rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-fade-in relative">

      {/* ── LEFT PANEL ──────────────────────────────────────────────────────── */}
      <div className={`${showList ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-72 lg:w-80 bg-dark-800/60 backdrop-blur-md border-r border-white/5 shrink-0`}>

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary-400" />
              Messages
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-dark-900/60 p-1 rounded-xl mb-2.5">
            {['all', 'projects'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all duration-200
                  ${activeTab === tab
                    ? 'bg-primary-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.4)]'
                    : 'text-slate-400 hover:text-white'}`}
              >
                {tab === 'all' ? 'All' : 'Projects'}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search chats..."
              value={chatSearch}
              onChange={e => setChatSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-dark-900/60 border border-white/10 rounded-xl text-sm text-white
                placeholder:text-slate-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* New DM picker */}
        {showNewChat && (
          <div className="border-b border-white/5 bg-dark-900/40">
            <div className="px-3 pt-2 pb-1 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search teammates..."
                value={dmSearch}
                onChange={e => setDmSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none py-1.5"
              />
              <button onClick={() => { setShowNewChat(false); setDmSearch(''); }} className="text-slate-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="max-h-44 overflow-y-auto scrollbar-hide pb-1">
              {filteredTeammates.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-3">No teammates found</p>
              ) : filteredTeammates.map(t => (
                <button
                  key={t._id}
                  onClick={() => startDM(t._id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-600/30 to-accent-blue/30 border border-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-300 shrink-0">
                    {getInitials(t.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{t.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{t.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
            </div>
          ) : activeTab === 'projects' ? (
            /* Projects tab — group chats only */
            tabChats.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm px-4">
                <MessageCircle className="w-7 h-7 mx-auto mb-2 opacity-25" />
                No project groups yet
              </div>
            ) : tabChats.map(chat => (
              <ChatItem key={chat._id} chat={chat} isActive={activeChat?._id === chat._id} me={user} onClick={() => selectChat(chat)} unreadCount={unreadCounts[chat._id] || 0} />
            ))
          ) : (
            /* All tab — existing chats + unmessaged teammates */
            <>
              {tabChats.map(chat => (
                <ChatItem key={chat._id} chat={chat} isActive={activeChat?._id === chat._id} me={user} onClick={() => selectChat(chat)} unreadCount={unreadCounts[chat._id] || 0} />
              ))}

              {/* People you haven't messaged yet */}
              {unmessaged.length > 0 && (
                <>
                  {tabChats.length > 0 && <div className="mx-4 my-1 border-t border-white/5" />}
                  <p className="px-4 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                    Start a conversation
                  </p>
                  {unmessaged.map(t => (
                    <button
                      key={t._id}
                      onClick={() => startDM(t._id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150
                        border-l-2 border-transparent hover:bg-white/5 hover:border-white/10"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm
                        ${t.role === 'Admin'
                          ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 text-amber-300'
                          : 'bg-gradient-to-br from-primary-600/20 to-accent-blue/20 border border-primary-500/20 text-primary-300'}`}>
                        {getInitials(t.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white truncate">{t.name}</span>
                          {t.role === 'Admin' && (
                            <span className="text-[9px] font-semibold bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full shrink-0">Admin</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">{t.email}</p>
                        <p className="text-[10px] text-primary-400 mt-0.5">Tap to start chatting</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {tabChats.length === 0 && unmessaged.length === 0 && (
                <div className="py-10 text-center text-slate-500 text-sm px-4">
                  <MessageCircle className="w-7 h-7 mx-auto mb-2 opacity-25" />
                  No chats yet
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────────── */}
      <div className={`${!showList ? 'flex' : 'hidden'} md:flex flex-col flex-1 bg-dark-900/40 backdrop-blur-sm min-w-0`}>
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-primary-400 opacity-60" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Select a project group</p>
              <p className="text-slate-400 text-sm mt-1">Pick a group from the left to start the conversation</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-white/5 bg-dark-800/50">
              <button onClick={() => setShowList(true)} className="md:hidden p-1.5 text-slate-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Group avatar — clickable to open members panel */}
              <button
                type="button"
                onClick={() => activeChat.isGroup && setShowMembers(p => !p)}
                title={activeChat.isGroup ? 'View members' : ''}
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm transition-all duration-200
                  ${activeChat.isGroup
                    ? 'bg-gradient-to-br from-accent-teal/20 to-primary-500/20 border border-accent-teal/20 text-accent-teal hover:from-accent-teal/30 hover:scale-110 cursor-pointer'
                    : 'bg-gradient-to-br from-primary-600/20 to-accent-blue/20 border border-primary-500/20 text-primary-300 cursor-default'}`}
              >
                {activeChat.isGroup ? <Hash className="w-4 h-4" /> : getInitials(getChatName(activeChat, user))}
              </button>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{getChatName(activeChat, user)}</p>
                <button
                  type="button"
                  onClick={() => activeChat.isGroup && setShowMembers(p => !p)}
                  className={`text-xs text-slate-500 flex items-center gap-1 ${ activeChat.isGroup ? 'hover:text-primary-400 transition-colors cursor-pointer' : ''}`}
                >
                  {activeChat.isGroup ? (
                    <><Users className="w-3 h-3" /> {activeChat.members?.length || 0} members — click to view</>
                  ) : (
                    connected ? '● Online' : '○ Offline'
                  )}
                </button>
              </div>

              {/* Stacked member avatars */}
              {activeChat.isGroup && (
                <button
                  type="button"
                  onClick={() => setShowMembers(p => !p)}
                  className="flex items-center hover:opacity-80 transition-opacity"
                  title="View all members"
                >
                  {activeChat.members?.slice(0, 4).map((m, i) => (
                    <div
                      key={m._id || i}
                      style={{ marginLeft: i === 0 ? 0 : -8 }}
                      className="w-7 h-7 rounded-full border-2 border-dark-800 bg-gradient-to-br from-primary-600/40 to-accent-blue/40 flex items-center justify-center text-[10px] font-bold text-primary-300 shrink-0"
                      title={m.name}
                    >
                      {getInitials(m.name || '?')}
                    </div>
                  ))}
                  {activeChat.members?.length > 4 && (
                    <div
                      style={{ marginLeft: -8 }}
                      className="w-7 h-7 rounded-full border-2 border-dark-800 bg-dark-700 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0"
                    >
                      +{activeChat.members.length - 4}
                    </div>
                  )}
                </button>
              )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-4 sm:px-5 py-4 space-y-1">
              {msgLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
                  <Hash className="w-8 h-8 opacity-25" />
                  <p className="text-sm">No messages yet. Start the conversation! 👋</p>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-white/5" />
                      <span className="text-[10px] text-slate-500 px-2 py-0.5 bg-white/5 rounded-full">{date}</span>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    {msgs.map((msg, i) => {
                      const isMe = msg.senderId?._id === user._id || msg.senderId === user._id;
                      const senderName = msg.senderId?.name || 'Unknown';
                      const showName = activeChat.isGroup && !isMe &&
                        (i === 0 || msgs[i - 1]?.senderId?._id !== msg.senderId?._id);
                      const isSystem = msg.isSystem;
                      if (isSystem) {
                        return (
                          <div key={msg._id} className="flex justify-center my-4 animate-fade-in">
                            <div className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-full backdrop-blur-sm shadow-sm">
                              <p className="text-[11px] font-medium text-slate-400 italic">
                                {msg.text}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={msg._id} className={`flex mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {!isMe && (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-600/30 to-accent-blue/30 border border-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-300 shrink-0 mr-2 mt-5">
                              {getInitials(senderName)}
                            </div>
                          )}
                          <div className={`max-w-[72%] sm:max-w-[60%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {showName && (
                              <span className="text-[10px] text-slate-400 mb-1 ml-1 font-medium">{senderName}</span>
                            )}
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words
                              ${isMe
                                ? `bg-gradient-to-br from-primary-600 to-primary-500 text-white rounded-br-sm shadow-[0_2px_16px_rgba(139,92,246,0.35)] ${msg.optimistic ? 'opacity-60' : ''}`
                                : 'bg-dark-800 text-slate-200 border border-white/5 rounded-bl-sm'}`}>
                              {msg.taskRef && (
                                <div className={`flex items-center gap-1.5 mb-1.5 px-2 py-1 rounded-lg border ${
                                  isMe ? 'bg-white/10 border-white/10 text-white/90' : 'bg-dark-900/50 border-white/5 text-primary-400'
                                }`}>
                                  <LayoutTemplate className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">Re: {msg.taskRef.taskTitle}</span>
                                </div>
                              )}
                              {msg.fileUrl && (
                                <div className="mb-2">
                                  {msg.fileType?.startsWith('image') ? (
                                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                                      <img 
                                        src={msg.fileUrl} 
                                        alt={msg.fileName} 
                                        className="max-w-full max-h-60 rounded-lg border border-white/10 shadow-sm object-cover hover:opacity-90 transition-opacity"
                                      />
                                    </a>
                                  ) : (
                                    <a 
                                      href={msg.fileUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-2 p-3 rounded-xl border ${
                                        isMe ? 'bg-white/10 border-white/10 text-white' : 'bg-dark-900/60 border-white/10 text-primary-400'
                                      } hover:bg-white/20 transition-all`}
                                    >
                                      <File className="w-4 h-4 shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">{msg.fileName}</p>
                                        <p className="text-[10px] opacity-60">Click to view</p>
                                      </div>
                                    </a>
                                  )}
                                </div>
                              )}
                              {msg.text && <div>{msg.text}</div>}
                            </div>
                            <span className="text-[10px] text-slate-600 mt-1 mx-1 flex items-center gap-1">
                              {formatTime(msg.createdAt)}
                              {isMe && (
                                msg.optimistic ? (
                                  <Check className="w-3 h-3 text-slate-500" />
                                ) : (msg.readBy && msg.readBy.length > 0) ? (
                                  <CheckCheck className="w-3 h-3 text-primary-400" />
                                ) : (
                                  <CheckCheck className="w-3 h-3 text-slate-500" />
                                )
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}

              {/* Typing */}
              {typingNames.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-dark-800 border border-white/5 flex items-center justify-center shrink-0">
                    <span className="flex gap-0.5">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 italic">
                    {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing…
                  </span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 sm:px-5 py-3.5 border-t border-white/5 bg-dark-800/30">
              <form onSubmit={sendMessage} className="flex items-center gap-3">
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".jpg,.jpeg,.png"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-3 bg-dark-900/60 border border-white/10 text-slate-400 rounded-xl
                    hover:text-white hover:border-white/20 transition-all shrink-0"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={text}
                  onChange={handleTyping}
                  placeholder={`Message ${getChatName(activeChat, user)}...`}
                  className="flex-1 px-4 py-3 bg-dark-900/60 border border-white/10 rounded-xl text-sm text-white
                    placeholder:text-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30
                    outline-none transition-all"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e); }}
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="p-3 bg-gradient-to-br from-primary-600 to-primary-500 text-white rounded-xl
                    hover:from-primary-500 hover:to-primary-400 disabled:opacity-40 disabled:cursor-not-allowed
                    transition-all duration-200 active:scale-95 shadow-[0_0_16px_rgba(139,92,246,0.4)]
                    hover:shadow-[0_0_24px_rgba(139,92,246,0.6)] shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* ── MEMBERS PANEL (slides in from right) ────────────────────────────── */}
      {activeChat?.isGroup && (
        <div
          className={`absolute top-0 right-0 h-full w-72 bg-dark-800/95 backdrop-blur-xl border-l border-white/10
            shadow-2xl flex flex-col transition-transform duration-300 ease-in-out z-20
            ${showMembers ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div>
              <h3 className="text-white font-semibold text-sm">Project Members</h3>
              <p className="text-xs text-slate-500 mt-0.5">{activeChat.members?.length || 0} people in this group</p>
            </div>
            <button
              onClick={() => setShowMembers(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Project badge */}
          <div className="mx-4 my-3 px-3 py-2 bg-primary-500/10 border border-primary-500/20 rounded-xl flex items-center gap-2">
            <Hash className="w-4 h-4 text-primary-400 shrink-0" />
            <span className="text-sm font-medium text-primary-300 truncate">{activeChat.name}</span>
          </div>

          {/* Member list */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-3 pb-4">
            {activeChat.members?.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">No members</p>
            ) : (
              <div className="space-y-1">
                {activeChat.members.map((m, i) => {
                  const name = m.name || 'Unknown';
                  const isMe = (m._id || m) === user._id;
                  const role = m.role || '';
                  return (
                    <div
                      key={m._id || i}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-colors
                        ${isMe ? 'bg-primary-500/10 border border-primary-500/15' : 'hover:bg-white/5'}`}
                    >
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm
                        ${isMe
                          ? 'bg-gradient-to-br from-primary-500 to-accent-blue text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]'
                          : role === 'Admin'
                            ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/20 text-amber-300'
                            : 'bg-gradient-to-br from-primary-600/30 to-accent-blue/30 border border-primary-500/20 text-primary-300'}`}
                      >
                        {getInitials(name)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-white truncate">{name}</span>
                          {isMe && (
                            <span className="text-[9px] font-semibold bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded-full shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        {m.email && (
                          <p className="text-[11px] text-slate-500 truncate">{m.email}</p>
                        )}
                        {role && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 inline-block
                            ${role === 'Admin'
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-slate-700/50 text-slate-400'}`}>
                            {role}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
