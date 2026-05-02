import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, Menu, X, MessageCircle, User, Settings, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import NotificationBell from './NotificationBell';
import { useSocket } from '../context/SocketContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { unreadMessages } = useSocket();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  ];

  const closeMobile = () => setMobileOpen(false);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when mobile drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <nav className="sticky top-0 z-40 pt-3 px-3 sm:pt-4 sm:px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="bg-dark-800/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl px-4 sm:px-6">
            <div className="flex items-center justify-between h-14 sm:h-16">
              
              {/* Logo */}
              <Link to="/" className="text-xl font-bold text-white tracking-tight flex items-center gap-2 group shrink-0">
                <div className="p-1.5 bg-gradient-to-br from-primary-500 to-accent-blue rounded-lg group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                  <CheckSquare className="w-5 h-5 text-white" />
                </div>
                <span className="hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">TaskMaster</span>
              </Link>

              {/* Desktop & Tablet Nav Links (hidden on < 640px) */}
              <div className="hidden sm:flex items-center gap-1 md:gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      title={item.name}
                      className={clsx(
                        'px-3 lg:px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-300 relative overflow-hidden',
                        isActive
                          ? 'text-white bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      )}
                    >
                      {isActive && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-500 rounded-t-full shadow-[0_-2px_10px_rgba(139,92,246,1)]"></div>
                      )}
                      <Icon className={clsx("w-4 h-4 md:w-5 md:h-5 lg:w-4 lg:h-4", isActive ? "text-primary-400" : "")} />
                      <span className="hidden lg:block">{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Right Side (Chat, Notif, Profile) - hidden on < 640px */}
              <div className="hidden sm:flex items-center gap-2 lg:gap-4">
                <div className="flex items-center gap-1 md:gap-2">
                  <NotificationBell />
                  
                  <Link
                    to="/chat"
                    title="Chat"
                    className={clsx(
                      'relative p-2 rounded-xl transition-all duration-300 flex items-center gap-2',
                      location.pathname === '/chat'
                        ? 'text-primary-400 bg-primary-500/15'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="hidden lg:block text-sm font-medium">Chat</span>
                    {unreadMessages > 0 && location.pathname !== '/chat' && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1
                        bg-red-500 text-white text-[10px] font-bold rounded-full
                        flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.7)]
                        animate-pulse border border-dark-800">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>
                </div>

                <div className="w-px h-6 bg-white/10 mx-1"></div>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button 
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-3 bg-dark-900/50 hover:bg-dark-900 px-2 py-1.5 lg:px-3 lg:py-1.5 rounded-full border border-white/5 hover:border-white/10 transition-all duration-300 focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-600 to-accent-blue flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden lg:flex flex-col items-start pr-1">
                      <p className="text-sm font-medium text-slate-200 leading-tight max-w-[100px] truncate">{user?.name}</p>
                      <p className="text-[10px] text-primary-400 font-bold tracking-wider uppercase">{user?.role}</p>
                    </div>
                    <ChevronDown className={clsx("hidden lg:block w-3.5 h-3.5 text-slate-400 transition-transform duration-300", profileOpen ? "rotate-180" : "")} />
                  </button>

                  {/* Dropdown Menu */}
                  {profileOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-dark-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 animate-slide-up z-50">
                      <div className="px-4 py-3 border-b border-white/5 mb-2 lg:hidden">
                        <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                        <p className="text-xs text-primary-400 mt-0.5">{user?.role}</p>
                      </div>
                      <Link to="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                        <User className="w-4 h-4 text-slate-400" /> My Profile
                      </Link>
                      <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors mt-1">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Hamburger Toggle (Mobile Only) */}
              <div className="flex sm:hidden items-center gap-2">
                <NotificationBell />
                <button
                  onClick={() => setMobileOpen(true)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>

            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar / Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm transition-opacity" 
            onClick={closeMobile}
          />
          
          {/* Drawer */}
          <div className="relative w-[280px] max-w-[80vw] h-full bg-dark-800 border-r border-white/10 shadow-2xl flex flex-col animate-slide-right">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-600 to-accent-blue flex items-center justify-center text-white font-bold text-lg shadow-inner">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-primary-400 font-bold uppercase tracking-widest">{user?.role}</p>
                </div>
              </div>
              <button onClick={closeMobile} className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={closeMobile}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                      isActive
                        ? 'text-white bg-primary-500/15 border border-primary-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <Icon className={clsx("w-5 h-5", isActive ? "text-primary-400" : "")} />
                    {item.name}
                  </Link>
                );
              })}
              <Link
                to="/chat"
                onClick={closeMobile}
                className={clsx(
                  'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  location.pathname === '/chat'
                    ? 'text-white bg-primary-500/15 border border-primary-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className={clsx("w-5 h-5", location.pathname === '/chat' ? "text-primary-400" : "")} />
                  Chat
                </div>
                {unreadMessages > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {unreadMessages}
                  </span>
                )}
              </Link>
            </div>

            <div className="p-4 border-t border-white/5">
              <button
                onClick={() => { closeMobile(); logout(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
