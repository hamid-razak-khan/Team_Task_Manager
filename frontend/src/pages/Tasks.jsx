import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Plus, MoreVertical, Calendar, X, LayoutTemplate, Search, Edit2, Trash2, MessageSquare, Send, CheckCircle, ChevronDown, Paperclip, File, Loader2, Timer, CheckCircle2, AlertCircle } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { useSearchParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highlightCol, setHighlightCol] = useState(null);
  const [searchParams] = useSearchParams();
  const colRefs = useRef({});

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', project: '', assignedTo: [], deadline: '', attachments: [] });
  const [memberSearch, setMemberSearch] = useState('');
  const [fileUploading, setFileUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleTaskFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Only images (JPG, PNG) are supported.");
      return;
    }
    
    setFileUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const res = await api.post('/upload', formDataUpload);
      const newAttachment = {
        url: res.data.url,
        fileName: res.data.fileName,
        fileType: res.data.fileType,
        uploadedBy: user._id,
        createdAt: new Date()
      };
      setFormData(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), newAttachment]
      }));
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setFileUploading(false);
      e.target.value = null;
    }
  };

  // Message Modal State
  const [msgModal, setMsgModal] = useState(null);
  const [msgContent, setMsgContent] = useState('');
  const [msgRecipient, setMsgRecipient] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgSent, setMsgSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Confirm delete state
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Project dropdown open state
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');

  const openModal = (task = null) => {
    if (task) {
      setEditTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        project: typeof task.project === 'object' && task.project ? task.project._id : task.project || '',
        assignedTo: task.assignedTo ? task.assignedTo.map(u => typeof u === 'object' ? u._id : u) : [],
        deadline: task.deadline ? new Date(task.deadline) : null,
        attachments: task.attachments || []
      });
    } else {
      setEditTask(null);
      setFormData({ title: '', description: '', project: '', assignedTo: [], deadline: null, attachments: [] });
    }
    setMemberSearch('');
    setShowCreateModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditTask(null);
    setFormData({ title: '', description: '', project: '', assignedTo: [], deadline: null, attachments: [] });
    setMemberSearch('');
    setProjectDropdownOpen(false);
    setProjectSearch('');
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    const isOpen = showCreateModal || !!msgModal;
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showCreateModal, msgModal]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgContent.trim()) return;
    if (user?.role === 'Admin' && !msgRecipient) {
      alert("Please select a member to message.");
      return;
    }
    setMsgSending(true);
    try {
      await api.post('/messages', {
        content: msgContent.trim(),
        taskId: msgModal.taskId,
        taskTitle: msgModal.taskTitle,
        recipientId: msgRecipient || undefined
      });
      setMsgSent(true);
      setMsgContent('');
      setTimeout(() => {
        setMsgModal(null);
        setMsgSent(false);
      }, 1800);
    } catch (err) {
      console.error(err);
    } finally {
      setMsgSending(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    if (user?.role === 'Admin') {
      fetchProjects();
      fetchUsers();
    }
  }, [user]);

  // Scroll to & highlight the column from dashboard deep-link
  useEffect(() => {
    const status = searchParams.get('status');
    if (!status) return;
    setHighlightCol(status);
    // small delay so the board has rendered
    const t = setTimeout(() => {
      const el = colRefs.current[status];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'center' });
    }, 300);
    // remove highlight after animation
    const t2 = setTimeout(() => setHighlightCol(null), 2500);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [searchParams]);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    const res = await api.get('/projects');
    setProjects(res.data);
  };

  const fetchUsers = async () => {
    const res = await api.get('/auth/users');
    setUsers(res.data);
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (formData.assignedTo.length === 0) {
      alert("Please assign at least one member to this task.");
      return;
    }
    setSubmitting(true);
    try {
      if (editTask) {
        await api.put(`/tasks/${editTask._id}`, formData);
      } else {
        await api.post('/tasks', formData);
      }
      closeModal();
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert('Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (taskId) => {
    setConfirmDelete(taskId);
  };

  const doDelete = async () => {
    try {
      await api.delete(`/tasks/${confirmDelete}`);
      fetchTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleMemberToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter(id => id !== userId)
        : [...prev.assignedTo, userId]
    }));
  };

  let availableUsers = [];
  const selectedProject = projects.find(p => p._id === formData.project);
  if (selectedProject) {
    const projectMemberIds = new Set(selectedProject.members.map(m => typeof m === 'object' ? m._id : m));
    availableUsers = users.filter(u => projectMemberIds.has(u._id) && u.role !== 'Admin');
  }

  const filteredUsers = availableUsers.filter(u => 
    u.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 bg-dark-800 rounded-lg w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="h-[500px] bg-dark-800 rounded-2xl"></div><div className="h-[500px] bg-dark-800 rounded-2xl"></div><div className="h-[500px] bg-dark-800 rounded-2xl"></div></div>
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-8 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Board</h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">Track and manage tasks</p>
        </div>
        {user?.role === 'Admin' && (
          <button onClick={() => openModal()} className="btn-primary text-sm px-3 sm:px-5">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">New Task</span>
            <span className="sm:hidden">New</span>
          </button>
        )}
      </div>

      {/* Responsive Kanban — stacks on mobile, 3-col on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {[
          { name: 'Pending', color: 'border-t-amber-500/50', badge: 'bg-amber-500/10 text-amber-400' }, 
          { name: 'In Progress', color: 'border-t-blue-500/50', badge: 'bg-blue-500/10 text-blue-400' }, 
          { name: 'Completed', color: 'border-t-emerald-500/50', badge: 'bg-emerald-500/10 text-emerald-400' }
        ].map((column, colIdx) => (
          <div
            key={column.name}
            ref={el => { colRefs.current[column.name] = el; }}
            className={`bg-dark-800/40 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-t-4 ${column.color} shadow-lg animate-slide-up transition-all duration-500
              ${highlightCol === column.name ? 'border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.08)] scale-[1.01]' : 'border-white/5'}`}
            style={{ animationDelay: `${colIdx * 100}ms` }}
          >
            <h3 className="font-bold text-white mb-5 flex items-center justify-between">
              {column.name}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${column.badge}`}>
                {tasks.filter(t => t.status === column.name).length}
              </span>
            </h3>
            <div className="space-y-4">
              {tasks.filter(t => t.status === column.name).map((task, taskIdx) => (
                <div key={task._id} className="glass-card p-5 cursor-default hover:-translate-y-1 transition-transform group animate-fade-in" style={{ animationDelay: `${taskIdx * 50}ms` }}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-semibold text-primary-400 bg-primary-500/10 border border-primary-500/20 px-2 py-1 rounded-md flex items-center gap-1">
                      <LayoutTemplate className="w-3 h-3" />
                      {task.project?.name || 'No Project'}
                    </span>
                    <div className="flex items-center gap-1">
                      {user?.role === 'Admin' && (
                        <>
                          <button
                            onClick={() => openModal(task)}
                            className="text-slate-500 hover:text-white p-1.5 bg-dark-900/70 rounded-lg border border-white/5 hover:border-white/20 transition-all"
                            title="Edit Task"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(task._id)}
                            className="text-slate-500 hover:text-red-400 p-1.5 bg-dark-900/70 rounded-lg border border-white/5 hover:border-red-500/30 transition-all"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setMsgModal({ taskId: task._id, taskTitle: task.title, taskMembers: task.assignedTo || [] });
                          setMsgContent('');
                          setMsgRecipient('');
                          setMsgSent(false);
                        }}
                        className="text-slate-500 hover:text-primary-400 p-1.5 bg-dark-900/70 rounded-lg border border-white/5 hover:border-primary-500/30 transition-all"
                        title={user?.role === 'Admin' ? "Message Member" : "Message Admin"}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="font-bold text-white mb-2 leading-snug">{task.title}</h4>
                  {task.description && <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>}
                  
                  {/* Task analytics / Time metrics */}
                  {task.status === 'Completed' && task.completedAt && (task.assignedAt || task.createdAt) && (
                    <div className="flex flex-col gap-1.5 mb-3 bg-dark-900/50 p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <Timer className="w-3 h-3 text-primary-400" />
                        Completed in {Math.max(1, Math.round((new Date(task.completedAt) - new Date(task.assignedAt || task.createdAt)) / (1000 * 60 * 60)))}h
                      </span>
                      {task.deadline && (
                        new Date(task.completedAt) <= new Date(task.deadline) ? (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" /> On-Time
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-red-400 flex items-center gap-1 uppercase tracking-wider">
                              <AlertCircle className="w-3 h-3" /> Late
                            </span>
                            <span className="text-[9px] text-slate-500 font-semibold uppercase">
                              (Delayed {Math.max(1, Math.round((new Date(task.completedAt) - new Date(task.deadline)) / (1000 * 60 * 60)))}h)
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {task.status !== 'Completed' && task.deadline && new Date() > new Date(task.deadline) && (
                    <div className="flex items-center gap-1.5 mb-3 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                      <span className="text-[10px] font-bold text-red-400 flex items-center gap-1 uppercase tracking-wider">
                        <AlertCircle className="w-3 h-3" /> Overdue
                      </span>
                      <span className="text-[9px] text-red-400/70 font-semibold uppercase">
                        ({Math.max(1, Math.round((new Date() - new Date(task.deadline)) / (1000 * 60 * 60)))}h late)
                      </span>
                    </div>
                  )}

                  {/* Task attachments preview on card */}
                  {task.attachments?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {task.attachments.slice(0, 2).map((file, idx) => (
                        <a 
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-slate-300 hover:bg-white/10 transition-colors max-w-[120px]"
                        >
                          <File className="w-3 h-3 shrink-0" />
                          <span className="truncate">{file.fileName}</span>
                        </a>
                      ))}
                      {task.attachments.length > 2 && (
                        <span className="text-[10px] text-slate-500 self-center">+{task.attachments.length - 2} more</span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-dark-900/50 px-2 py-1 rounded-md border border-white/5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {task.deadline ? new Date(task.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'No date'}
                      </div>
                      {task.attachments?.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-primary-400 bg-primary-500/5 px-2 py-1 rounded-md border border-primary-500/10">
                          <Paperclip className="w-3 h-3" />
                          {task.attachments.length}
                        </div>
                      )}
                    </div>
                    <select
                      className="text-xs border border-white/10 rounded-md py-1.5 px-2 bg-dark-900 text-slate-300 focus:ring-1 focus:ring-primary-500 outline-none cursor-pointer"
                      value={task.status}
                      onChange={(e) => handleStatusChange(task._id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.status === column.name).length === 0 && (
                <div className="py-6 border-2 border-dashed border-white/5 rounded-xl text-center text-slate-500 text-sm">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
          <div className="glass-card w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto scrollbar-hide p-5 sm:p-8 animate-slide-up border border-white/10 rounded-t-3xl sm:rounded-2xl">
            <div className="flex justify-between items-center mb-5 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">{editTask ? 'Edit Task' : 'Create Task'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitTask} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Task Title</label>
                <input required type="text" className="input-field" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="What needs to be done?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description (Optional)</label>
                <textarea className="input-field resize-none" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Add more details..."></textarea>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Project</label>

                  {/* Trigger button */}
                  <button
                    type="button"
                    onClick={() => {
                      setProjectDropdownOpen(o => !o);
                      setProjectSearch('');
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border
                      bg-dark-900/50 text-left transition-all duration-200 outline-none
                      ${formData.project ? 'border-primary-500/60 text-white' : 'border-white/10 text-slate-500'}
                      ${projectDropdownOpen ? 'ring-2 ring-primary-500/30 border-primary-500' : 'hover:border-white/20'}`}
                  >
                    <span className="truncate text-sm">
                      {formData.project
                        ? projects.find(p => p._id === formData.project)?.name || 'Select Project'
                        : 'Select Project'}
                    </span>
                    <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${projectDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown */}
                  {projectDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-dark-800 border border-white/10 rounded-xl shadow-2xl z-10 overflow-hidden animate-fade-in">
                      {/* Search bar */}
                      <div className="px-3 pt-3 pb-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                          <input
                            type="text"
                            autoFocus
                            placeholder="Search projects..."
                            value={projectSearch}
                            onChange={e => setProjectSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-dark-900/70 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30 outline-none"
                          />
                        </div>
                      </div>

                      {/* Project list */}
                      <div className="max-h-44 overflow-y-auto scrollbar-hide pb-1">
                        {projects
                          .filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()))
                          .length === 0 ? (
                          <div className="px-4 py-3 text-sm text-slate-500 text-center">No projects match</div>
                        ) : (
                          projects
                            .filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()))
                            .map(p => (
                              <button
                                key={p._id}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, project: p._id, assignedTo: [] });
                                  setMemberSearch('');
                                  setProjectDropdownOpen(false);
                                  setProjectSearch('');
                                }}
                                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-all duration-150
                                  hover:bg-primary-500/10 hover:text-white
                                  ${ formData.project === p._id
                                    ? 'bg-primary-500/15 text-primary-300 border-l-2 border-primary-500'
                                    : 'text-slate-300 border-l-2 border-transparent'}`}
                              >
                                <span className="truncate">{p.name}</span>
                                {formData.project === p._id && (
                                  <span className="ml-2 shrink-0 text-primary-400 text-xs font-semibold">✓</span>
                                )}
                              </button>
                            ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Deadline</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                    <DatePicker
                      selected={formData.deadline}
                      onChange={(date) => setFormData({ ...formData, deadline: date })}
                      showTimeSelect
                      timeFormat="h:mm aa"
                      timeIntervals={15}
                      dateFormat="d MMM yyyy, h:mm aa"
                      className="input-field w-full pl-10"
                      placeholderText="Select deadline"
                      minDate={new Date()}
                      wrapperClassName="w-full"
                      popperPlacement="bottom-start"
                      portalId="root"
                      popperClassName="datepicker-portal-popper"
                      popperModifiers={[
                        { name: 'offset', options: { offset: [0, 8] } },
                        { name: 'preventOverflow', options: { boundary: 'viewport', padding: 16 } },
                        { name: 'flip', options: { fallbackPlacements: ['top-start'] } }
                      ]}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Assign Members</label>
                {!formData.project ? (
                  <div className="p-3 bg-dark-900/50 border border-white/5 rounded-xl text-sm text-slate-500 text-center">
                    Please select a project first to see available members.
                  </div>
                ) : (
                  <>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        className="w-full pl-9 pr-4 py-2 bg-dark-900 border border-white/10 rounded-lg text-sm text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                        placeholder="Search project members..."
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2 border border-white/10 bg-dark-900/50 rounded-xl p-3 scrollbar-hide">
                      {filteredUsers.map(u => (
                        <label key={u._id} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors border border-transparent hover:border-white/5">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-600 bg-dark-900 text-primary-500 focus:ring-primary-500/50 focus:ring-offset-0"
                            checked={formData.assignedTo.includes(u._id)}
                            onChange={() => handleMemberToggle(u._id)}
                          />
                          <div className="flex flex-col">
                            <span className="text-slate-200 font-medium">{u.name}</span>
                            <span className="text-slate-500 text-xs">{u.email}</span>
                          </div>
                        </label>
                      ))}
                      {filteredUsers.length === 0 && <p className="text-sm text-slate-500 p-2">No members found in this project.</p>}
                    </div>
                  </>
                )}
              {/* Attachments Section */}
              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Attachments</label>
                <div className="space-y-2">
                  {formData.attachments?.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-dark-900 border border-white/5 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <File className="w-4 h-4 text-primary-400 shrink-0" />
                        <span className="text-xs text-slate-300 truncate">{file.fileName}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }))}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleTaskFileUpload}
                    accept=".jpg,.jpeg,.png"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={fileUploading}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-dark-900/50 border border-dashed border-white/20 rounded-xl text-sm text-slate-400 hover:text-white hover:border-primary-500/50 transition-all"
                  >
                    {fileUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>{fileUploading ? 'Uploading...' : 'Attach File'}</span>
                  </button>
                </div>
              </div>
            </div>
              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 disabled:opacity-70 disabled:cursor-not-allowed relative"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      {editTask ? 'Saving...' : 'Creating...'}
                    </span>
                  ) : (
                    editTask ? 'Save Changes' : 'Create Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Message Admin Modal ─────────────────────────────────────── */}
      {msgModal && (
        <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
          <div className="glass-card w-full sm:max-w-md scrollbar-hide overflow-y-auto p-6 sm:p-8 animate-slide-up border border-white/10 rounded-t-3xl sm:rounded-2xl">

            {msgSent ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-white font-semibold text-lg">Message Sent!</p>
                <p className="text-slate-400 text-sm">The admin will be notified shortly.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">{user?.role === 'Admin' ? 'Message Member' : 'Message Admin'}</h2>
                    {msgModal.taskTitle && (
                      <p className="text-xs text-primary-400 mt-1 flex items-center gap-1">
                        <LayoutTemplate className="w-3 h-3" />
                        Re: {msgModal.taskTitle}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setMsgModal(null)}
                    className="text-slate-400 hover:text-white transition-colors p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSendMessage} className="space-y-4">
                  {user?.role === 'Admin' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Select Member</label>
                      <select 
                        className="input-field cursor-pointer"
                        value={msgRecipient}
                        onChange={e => setMsgRecipient(e.target.value)}
                        required
                      >
                        <option value="" disabled>Select a member...</option>
                        {msgModal.taskMembers?.map(m => (
                          <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Your Message</label>
                    <textarea
                      className="input-field resize-none"
                      rows="5"
                      placeholder="Type your message to the admin..."
                      value={msgContent}
                      onChange={e => setMsgContent(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setMsgModal(null)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={msgSending || !msgContent.trim()}
                      className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {msgSending ? 'Sending...' : <><Send className="w-4 h-4" /> Send</>}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────── */}
      <ConfirmModal
        open={!!confirmDelete}
        title="Delete Task"
        message="This task will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete Task"
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default Tasks;
