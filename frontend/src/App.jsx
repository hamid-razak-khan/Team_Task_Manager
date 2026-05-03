import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Chat from './pages/Chat';
import Join from './pages/Join';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// ── Loading spinner ────────────────────────────────────────────────────────────
const Spinner = () => (
  <div className="h-screen flex items-center justify-center bg-dark-900">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-t-2 border-primary-500 animate-spin" />
      <div className="absolute inset-2 rounded-full border-r-2 border-accent-teal animate-spin"
        style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
    </div>
  </div>
);

// ── Persistent authenticated layout (mounts ONCE, never remounts on nav) ──────
const AuthLayout = () => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <NotificationProvider>
      <SocketProvider>
        <div className="min-h-screen relative text-slate-200">
          <Navbar />
          <main className="container mx-auto px-3 sm:px-4 py-5 sm:py-8 max-w-7xl">
            <Outlet /> {/* child pages render here */}
          </main>
        </div>
      </SocketProvider>
    </NotificationProvider>
  );
};

// ── Redirect logged-in users away from public pages ───────────────────────────
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

// ── App ───────────────────────────────────────────────────────────────────────
const App = () => (
  <AuthProvider>
    <div className="bg-mesh" />
    <Router>
      <Routes>
        {/* Public pages */}
        <Route path="/"        element={<PublicRoute><Home /></PublicRoute>} />
        <Route path="/login"   element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register"element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/join"    element={<PublicRoute><Join /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />

        {/* Protected pages — share a single persistent layout */}
        <Route element={<AuthLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects"  element={<Projects />} />
          <Route path="/tasks"     element={<Tasks />} />
          <Route path="/chat"      element={<Chat />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
