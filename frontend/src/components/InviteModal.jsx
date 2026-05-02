import React, { useState } from 'react';
import { X, UserPlus, Mail, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const InviteModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      await api.post('/invite', { email, role });
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setEmail('');
      }, 2000);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.error || 'Failed to send invite');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="glass-card w-full max-w-md relative z-10 animate-scale-in flex flex-col p-6 border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary-400" /> Invite Team Member
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-white">Invite Sent!</h3>
            <p className="text-slate-400 text-center mt-2">An email has been sent to {email} with join instructions.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {errorMsg}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  className="w-full pl-9 pr-4 py-2 bg-dark-900 border border-white/10 rounded-lg text-sm text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                />
              </div>
            </div>
            

            
            <button 
              type="submit" 
              disabled={status === 'loading'} 
              className="w-full py-2.5 mt-4 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
            >
              {status === 'loading' ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Send Invite</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default InviteModal;
