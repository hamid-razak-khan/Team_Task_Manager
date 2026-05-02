import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Plus, Users, LayoutList, X, Edit2, Search, Trash2, Eye, Info, Loader2, Paperclip, File } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');

  // Confirm delete state
  const [confirmDelete, setConfirmDelete] = useState(null);
  // View project info state
  const [viewProject, setViewProject] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [fileUploading, setFileUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleProjectFileUpload = async (e) => {
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
      setAttachments(prev => [...prev, { 
        url: res.data.url, 
        fileName: res.data.fileName, 
        fileType: res.data.fileType,
        uploadedBy: user._id
      }]);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setFileUploading(false);
    }
  };

  const openModal = (project = null) => {
    if (project) {
      setEditProject(project);
      setName(project.name);
      setDescription(project.description || '');
      setSelectedMembers(project.members.map(m => m._id || m));
      setAttachments(project.attachments || []);
    } else {
      setEditProject(null);
      setName('');
      setDescription('');
      setSelectedMembers([]);
      setAttachments([]);
    }
    setMemberSearch('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditProject(null);
    setName('');
    setDescription('');
    setSelectedMembers([]);
    setMemberSearch('');
    setAttachments([]);
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  useEffect(() => {
    fetchProjects();
    if (user?.role === 'Admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (editProject) {
        await api.put(`/projects/${editProject._id}`, { name, description, members: selectedMembers, attachments });
      } else {
        await api.post('/projects', { name, description, members: selectedMembers, attachments });
      }
      closeModal();
      fetchProjects();
    } catch (err) {
      console.error(err);
      alert('Error saving project');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleMemberToggle = (userId) => {
    setSelectedMembers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleDelete = async (projectId, projectName) => {
    setConfirmDelete({ id: projectId, name: projectName });
  };

  const doDelete = async () => {
    try {
      await api.delete(`/projects/${confirmDelete.id}`);
      fetchProjects();
    } catch (err) {
      console.error(err);
      alert('Failed to delete project');
    } finally {
      setConfirmDelete(null);
    }
  };

  const availableUsers = users.filter(u => u._id !== user._id);
  const filteredUsers = availableUsers.filter(u => 
    u.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="h-10 bg-dark-800 rounded-lg w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="h-40 bg-dark-800 rounded-2xl"></div><div className="h-40 bg-dark-800 rounded-2xl"></div></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex justify-between items-end">
        <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Projects</h1>
        <p className="text-slate-400 mt-1 text-sm sm:text-base">Manage your team's workspaces</p>
      </div>
        {user?.role === 'Admin' && (
          <button onClick={() => openModal()} className="btn-primary">
            <Plus className="w-5 h-5" /> New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <div key={project._id} className="glass-card p-6 group animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="flex items-start justify-between mb-6">
              <div
                className="w-12 h-12 rounded-xl bg-dark-900 border border-white/10 flex items-center justify-center text-primary-400 group-hover:scale-110 group-hover:bg-primary-500/20 transition-all duration-300 cursor-pointer"
                onClick={() => setViewProject(project)}
                title="View project info"
              >
                <LayoutList className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                {user?.role === 'Admin' && (
                  <>
                    <button onClick={() => openModal(project)} className="p-1.5 text-slate-400 hover:text-white bg-dark-900 border border-white/10 rounded-lg hover:border-white/20 transition-all" title="Edit Project">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(project._id, project.name)} className="p-1.5 text-slate-400 hover:text-red-400 bg-dark-900 border border-white/10 rounded-lg hover:border-red-500/30 transition-all" title="Delete Project">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setViewProject(project)}
                  className="p-1.5 text-slate-400 hover:text-primary-400 bg-dark-900 border border-white/10 rounded-lg hover:border-primary-500/30 transition-all"
                  title="View Info"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-medium px-3 py-1 bg-dark-900 border border-white/10 text-slate-300 rounded-full flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> {project.members.length}
                </span>
                {project.attachments?.length > 0 && (
                  <span className="text-xs font-medium px-3 py-1 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-full flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" /> {project.attachments.length}
                  </span>
                )}
              </div>
            </div>
            <h3
              className="text-xl font-bold text-white mb-2 cursor-pointer hover:text-primary-300 transition-colors"
              onClick={() => setViewProject(project)}
            >
              {project.name}
            </h3>
            {project.description && <p className="text-sm text-slate-400 mb-4 line-clamp-2">{project.description}</p>}
            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/5">
              <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue text-xs font-bold">A</div>
              <p className="text-sm text-slate-400 flex items-center gap-1">
                <span className="text-slate-500">Admin:</span> {project.admin?.name || 'Unknown'}
              </p>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-dark-800/30 rounded-2xl border border-dashed border-white/10">
            No projects available.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4">
          <div className="glass-card w-full sm:max-w-md max-h-[92vh] overflow-y-auto scrollbar-hide p-5 sm:p-8 animate-slide-up border border-white/10 rounded-t-3xl sm:rounded-2xl">
            <div className="flex justify-between items-center mb-5 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">{editProject ? 'Edit Project' : 'New Project'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Project Name</label>
                <input required type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Marketing Campaign" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description (Optional)</label>
                <textarea className="input-field resize-none" rows="2" value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this project about?"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Assign Members</label>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    className="w-full pl-9 pr-4 py-2 bg-dark-900 border border-white/10 rounded-lg text-sm text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                    placeholder="Search by name or email..."
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
                        checked={selectedMembers.includes(u._id)}
                        onChange={() => handleMemberToggle(u._id)}
                      />
                      <div className="flex flex-col">
                        <span className="text-slate-200 font-medium">{u.name}</span>
                        <span className="text-slate-500 text-xs">{u.email}</span>
                      </div>
                    </label>
                  ))}
                  {filteredUsers.length === 0 && <p className="text-sm text-slate-500 p-2">No users found.</p>}
                </div>
              </div>

              {/* Attachments Section */}
              <div className="pt-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Attachments</label>
                <div className="space-y-2">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-dark-900 border border-white/5 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <File className="w-4 h-4 text-primary-400 shrink-0" />
                        <span className="text-xs text-slate-300 truncate">{file.fileName}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
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
                    onChange={handleProjectFileUpload}
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
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editProject ? 'Save Changes' : 'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Project Info Modal ─────────────────────────────────────────── */}
      {viewProject && (
        <div
          className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4"
          onClick={() => setViewProject(null)}
        >
          <div
            className="glass-card w-full sm:max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide animate-slide-up border border-white/10 rounded-t-3xl sm:rounded-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-5 sm:p-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 shrink-0">
                  <LayoutList className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-white truncate">{viewProject.name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Created by <span className="text-primary-400">{viewProject.admin?.name}</span>
                  </p>
                </div>
                <button
                  onClick={() => setViewProject(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="px-5 sm:px-6 py-4 border-b border-white/5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Description
              </p>
              {viewProject.description ? (
                <p className="text-sm text-slate-300 leading-relaxed">{viewProject.description}</p>
              ) : (
                <p className="text-sm text-slate-600 italic">No description provided.</p>
              )}
            </div>

            {/* Admin */}
            <div className="px-5 sm:px-6 py-4 border-b border-white/5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Admin</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-300">
                  {(viewProject.admin?.name || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{viewProject.admin?.name || 'Unknown'}</p>
                  {viewProject.admin?.email && (
                    <p className="text-xs text-slate-500">{viewProject.admin.email}</p>
                  )}
                </div>
                <span className="ml-auto text-[10px] font-semibold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">Admin</span>
              </div>
            </div>

            {/* Members */}
            <div className="px-5 sm:px-6 py-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Members
                <span className="ml-1 text-[10px] bg-white/5 px-1.5 py-0.5 rounded-full">{viewProject.members?.length || 0}</span>
              </p>
              {viewProject.members?.length === 0 ? (
                <p className="text-sm text-slate-600 italic">No members assigned.</p>
              ) : (
                <div className="space-y-2">
                  {viewProject.members.map((m, i) => {
                    const name = m.name || m.email || 'Member';
                    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                    return (
                      <div key={m._id || i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-600/30 to-accent-blue/30 border border-primary-500/20 flex items-center justify-center text-sm font-bold text-primary-300 shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{name}</p>
                          {m.email && <p className="text-xs text-slate-500 truncate">{m.email}</p>}
                        </div>
                        <span className="text-[10px] font-medium bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded-full shrink-0">Member</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Attachments */}
            {viewProject.attachments?.length > 0 && (
              <div className="px-5 sm:px-6 py-4 border-t border-white/5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" /> Shared Files
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {viewProject.attachments.map((file, i) => (
                    <a 
                      key={i} 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-dark-900 border border-white/5 rounded-xl hover:bg-white/5 transition-all group"
                    >
                      <div className="p-2 bg-primary-500/10 rounded-lg text-primary-400">
                        <File className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200 truncate group-hover:text-primary-300">{file.fileName}</p>
                        <p className="text-[10px] text-slate-500 uppercase">{file.fileType?.split('/')[1] || 'File'}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ───────────────────────────────────────── */}
      <ConfirmModal
        open={!!confirmDelete}
        title={`Delete "${confirmDelete?.name}"?`}
        message="This project and all its associated data will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete Project"
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};

export default Projects;
