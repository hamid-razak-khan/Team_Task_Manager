import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, CheckSquare, AlertTriangle } from 'lucide-react';
import api from '../utils/api';

const Join = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteData, setInviteData] = useState(null);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('No invite token provided.');
        setLoading(false);
        return;
      }
      try {
        const res = await api.get(`/invite/${token}`);
        setInviteData(res.data);
        setEmail(res.data.email);
      } catch (err) {
        if (!err.response) {
          setError('Unable to connect to the server. Please check your internet connection or try again later.');
        } else {
          setError(err.response.data?.error || 'This invite link is invalid or has expired.');
        }
      } finally {
        setLoading(false);
      }
    };
    validateToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitLoading(true);
    try {
      await register(name, email, password, token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4 relative overflow-hidden">
      <div className="bg-mesh"></div>
      
      <div className="glass-card w-full max-w-md p-10 animate-slide-up relative z-10 border border-white/10">
        <div className="flex justify-center mb-8">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-accent-teal rounded-2xl shadow-[0_0_30px_rgba(20,184,166,0.4)]">
            <CheckSquare className="w-8 h-8 text-white" />
          </div>
        </div>

        {error ? (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Invite Error</h1>
            <p className="text-slate-400 mb-8">{error}</p>
            <Link to="/register" className="btn-primary inline-flex">Go to Registration</Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Join {inviteData?.organizationName}</h1>
              <p className="text-slate-400">You're invited as an <strong className="text-primary-400">{inviteData?.role}</strong></p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  disabled
                  className="input-field opacity-50 cursor-not-allowed"
                  value={email}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" disabled={submitLoading} className="btn-primary w-full mt-8 py-3 text-lg">
                {submitLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Joining...
                  </span>
                ) : (
                  <><UserPlus className="w-5 h-5" /> Accept Invite & Join</>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Join;
