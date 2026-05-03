import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import InviteModal from '../components/InviteModal';
import { 
  CheckCircle2, Clock, AlertCircle, LayoutDashboard, ArrowRight, 
  ArrowUpRight, BarChart3, TrendingUp, Users, Award, Timer, UserPlus
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

const getPerformanceLevel = (percentage) => {
  if (percentage >= 90) return { label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-400/10' };
  if (percentage >= 70) return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-400/10' };
  if (percentage >= 50) return { label: 'Average', color: 'text-amber-400', bg: 'bg-amber-400/10' };
  return { label: 'Needs Improvement', color: 'text-red-400', bg: 'bg-red-400/10' };
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, analyticsRes] = await Promise.all([
          api.get('/tasks'),
          user?.role === 'Admin' ? api.get('/analytics') : Promise.resolve({ data: null })
        ]);
        
        setTasks(tasksRes.data);
        if (analyticsRes.data) {
          setAnalytics(analyticsRes.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    pending: tasks.filter(t => t.status === 'Pending').length,
  };

  const overdueTasks = tasks.filter(t => t.status !== 'Completed' && new Date(t.deadline) < new Date());

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
  const pieData = [
    { name: 'Completed', value: stats.completed },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Pending', value: stats.pending },
    { name: 'Overdue', value: overdueTasks.length },
  ];

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-dark-800 rounded-lg w-1/3"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 sm:h-32 bg-dark-800 rounded-2xl"></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 bg-dark-800 rounded-2xl"></div>
        <div className="h-64 bg-dark-800 rounded-2xl"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            Welcome back, <span className="text-primary-400 font-medium">{user?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'Admin' && (
            <>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-xl text-primary-400 text-sm font-semibold">
                <Award className="w-4 h-4" /> Team Analytics
              </div>
              <button 
                onClick={() => setShowInviteModal(true)}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <UserPlus className="w-4 h-4" /> Invite Team
              </button>
            </>
          )}
        </div>
      </div>

      <InviteModal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
        <StatCard 
          icon={<LayoutDashboard className="w-5 h-5" />} 
          label="Total Tasks" 
          value={stats.total} 
          onClick={() => navigate('/tasks')}
          hovered={hoveredCard === 'total'}
          setHovered={() => setHoveredCard('total')}
          clearHovered={() => setHoveredCard(null)}
        />
        <StatCard 
          icon={<CheckCircle2 className="w-5 h-5" />} 
          label="Completed" 
          value={stats.completed} 
          color="emerald"
          onClick={() => navigate('/tasks?status=Completed')}
          hovered={hoveredCard === 'completed'}
          setHovered={() => setHoveredCard('completed')}
          clearHovered={() => setHoveredCard(null)}
        />
        <StatCard 
          icon={<Clock className="w-5 h-5" />} 
          label="In Progress" 
          value={stats.inProgress} 
          color="blue"
          onClick={() => navigate('/tasks?status=In Progress')}
          hovered={hoveredCard === 'inprogress'}
          setHovered={() => setHoveredCard('inprogress')}
          clearHovered={() => setHoveredCard(null)}
        />
        <StatCard 
          icon={<AlertCircle className="w-5 h-5" />} 
          label="Pending" 
          value={stats.pending} 
          color="amber"
          onClick={() => navigate('/tasks?status=Pending')}
          hovered={hoveredCard === 'pending'}
          setHovered={() => setHoveredCard('pending')}
          clearHovered={() => setHoveredCard(null)}
        />
        <StatCard 
          icon={<Timer className="w-5 h-5" />} 
          label="Overdue" 
          value={overdueTasks.length} 
          color="red"
          onClick={() => navigate('/tasks')}
          hovered={hoveredCard === 'overdue'}
          setHovered={() => setHoveredCard('overdue')}
          clearHovered={() => setHoveredCard(null)}
        />
      </div>

      {/* Analytics Section - Only for Admins */}
      {user?.role === 'Admin' && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Team Productivity Bar Chart */}
          <div className="glass-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-400" /> Team Performance
              </h2>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Productivity Score</span>
            </div>
            <div className="h-64 sm:h-80 w-full">
              {analytics.tasksPerUser?.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.tasksPerUser} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      {CHART_COLORS.map((color, index) => (
                        <linearGradient key={`grad-${index}`} id={`colorUv-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={color} stopOpacity={0.2}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => val.length > 12 ? val.substring(0,12)+'...' : val}
                    />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      cursor={{fill: '#ffffff05'}}
                    />
                    <Bar dataKey="completed" radius={[8, 8, 0, 0]} barSize={48}>
                      {analytics.tasksPerUser?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#colorUv-${index % CHART_COLORS.length})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Leaderboard & Avg Time */}
          <div className="glass-card p-6 sm:p-8 flex flex-col border border-white/5 bg-dark-900 shadow-2xl">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-amber-400" /> Productivity Leaderboard
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {analytics.productivity?.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-slate-500 text-sm">No data available</div>
              ) : (
                analytics.productivity?.slice(0, 5).map((member, i) => {
                  const perf = getPerformanceLevel(member.percentage);
                  return (
                    <div key={member.name} className="relative group">
                      <div className="relative flex items-center justify-between p-4 bg-dark-800/60 rounded-2xl border border-white/5 hover:border-primary-500/30 hover:bg-dark-800 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm
                            ${i === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-600 text-dark-900' : 
                              i === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-dark-900' : 
                              i === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-700 text-dark-900' : 
                              'bg-dark-700 text-slate-400 border border-white/10'}`}>
                            #{i + 1}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-primary-300 transition-colors uppercase">{member.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${perf.bg} ${perf.color}`}>
                                {perf.label}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-tighter">
                                {member.percentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-xl font-black text-white tracking-tight">
                            {Number(member.score).toFixed(1).replace(/\.0$/, '')}
                          </div>
                          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Score</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Task Distribution (Pie Chart) - Global or User Specific */}
        <div className="glass-card p-6 sm:p-8 flex flex-col items-center">
          <h2 className="text-lg font-bold text-white self-start mb-6">Status Overview</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="lg:col-span-2 glass-card p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-primary-400" /> Recent Tasks
            </h2>
            <Link to="/tasks" className="text-xs font-semibold text-primary-400 hover:text-primary-300 uppercase tracking-widest flex items-center gap-1 group">
              View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task, index) => (
              <div key={task._id} className="flex items-center justify-between p-4 bg-dark-900/30 rounded-2xl border border-white/5 hover:bg-white/5 transition-all animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{task.title}</h3>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase font-medium">Project: <span className="text-slate-400">{task.project?.name || 'Unassigned'}</span></p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                  ${task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : task.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {task.status}
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="py-12 text-center text-slate-500 italic text-sm">No tasks assigned yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Overdue Section */}
      {overdueTasks.length > 0 && (
        <div className="glass-card p-6 sm:p-8 border-l-4 border-red-500 bg-red-500/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6 text-red-400">
            <AlertCircle className="w-5 h-5" /> Critical Overdue Tasks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overdueTasks.map((task) => (
              <div key={task._id} className="p-4 bg-dark-900/60 rounded-2xl border border-red-500/20 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-2">{task.title}</h3>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-tighter flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Missed: {new Date(task.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  <button onClick={() => navigate('/tasks')} className="text-[10px] text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg transition-colors font-bold">Resolve</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color, onClick, hovered, setHovered, clearHovered }) => {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    default: 'bg-dark-900 text-slate-400 border-white/5'
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={setHovered}
      onMouseLeave={clearHovered}
      className={`glass-card p-5 sm:p-6 cursor-pointer transition-all duration-300 transform ${hovered ? '-translate-y-1 ring-1 ring-primary-500/30' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl border ${colors[color] || colors.default}`}>
          {icon}
        </div>
        <ArrowUpRight className={`w-4 h-4 transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-30'}`} />
      </div>
      <div>
        <p className="text-xs sm:text-sm font-medium text-slate-400 mb-1">{label}</p>
        <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
};

export default Dashboard;

