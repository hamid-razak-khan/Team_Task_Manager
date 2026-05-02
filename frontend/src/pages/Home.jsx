import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare, Users, Bell, LayoutDashboard, FolderKanban,
  CheckCircle2, ArrowRight, Zap, Shield, BarChart3,
  ClipboardList, UserPlus, Mail, Star, Menu, X, MessageCircle
} from 'lucide-react';

// ─── Animated Counter ────────────────────────────────────────────────────────
const Counter = ({ target, suffix = '' }) => {
  const ref = useRef(null);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { start = target; clearInterval(timer); }
      if (ref.current) ref.current.textContent = start + suffix;
    }, 40);
    return () => clearInterval(timer);
  }, [target, suffix]);
  return <span ref={ref}>0{suffix}</span>;
};

// ─── Feature Card ─────────────────────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, title, desc, color, delay }) => (
  <div
    className="glass-card p-5 sm:p-6 lg:p-8 group hover:-translate-y-2 transition-all duration-300 animate-slide-up"
    style={{ animationDelay: delay }}
  >
    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl ${color} flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform shadow-lg shrink-0`}>
      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
    </div>
    <h3 className="text-base sm:text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
  </div>
);

// ─── Step Card ────────────────────────────────────────────────────────────────
const Step = ({ number, icon: Icon, title, desc, color, delay, isLast }) => (
  <div className="flex gap-4 animate-slide-up" style={{ animationDelay: delay }}>
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl ${color} flex items-center justify-center shrink-0 shadow-lg`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
      {!isLast && (
        <div className="w-px flex-1 bg-gradient-to-b from-white/20 to-transparent mt-3" />
      )}
    </div>
    <div className={`${isLast ? 'pb-0' : 'pb-8 sm:pb-10'}`}>
      <div className="text-xs font-bold text-primary-400 uppercase tracking-widest mb-1">Step {number}</div>
      <h3 className="text-base sm:text-lg font-bold text-white mb-1">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);

// ─── Role Badge ───────────────────────────────────────────────────────────────
const RoleBadge = ({ role, perms, color, icon: Icon }) => (
  <div className="glass-card p-5 sm:p-6 hover:-translate-y-1 transition-all duration-300">
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="font-bold text-white text-base">{role}</h3>
    </div>
    <ul className="space-y-2">
      {perms.map((p, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{p}</span>
        </li>
      ))}
    </ul>
  </div>
);

// ─── Smooth scroll helper ─────────────────────────────────────────────────────
const scrollTo = (id, close) => {
  close?.();
  setTimeout(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
};

// ─── Home Navbar (public) ─────────────────────────────────────────────────────
const HomeNav = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  const navLinks = [
    { label: 'Home',         id: 'hero' },
    { label: 'Features',     id: 'features' },
    { label: 'How It Works', id: 'how-it-works' },
  ];

  return (
    <nav className="sticky top-0 z-50 pt-3 sm:pt-4 px-3 sm:px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="bg-dark-800/70 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Logo */}
            <button
              onClick={() => scrollTo('hero')}
              className="flex items-center gap-2 group shrink-0 cursor-pointer"
            >
              <div className="p-1.5 bg-gradient-to-br from-primary-500 to-accent-blue rounded-lg group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                <CheckSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                TaskMaster
              </span>
            </button>

            {/* Desktop nav links + buttons */}
            <div className="hidden sm:flex items-center gap-1 md:gap-3">
              {navLinks.map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
                >
                  {label}
                </button>
              ))}
              <div className="w-px h-5 bg-white/10 mx-1" />
              <Link to="/login" className="px-3 sm:px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary text-sm px-4 sm:px-5 py-2">
                Get Started
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="sm:hidden p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile dropdown */}
          {menuOpen && (
            <div className="sm:hidden border-t border-white/5 pt-2 pb-3 flex flex-col gap-1 animate-fade-in">
              {/* Scroll nav links */}
              {navLinks.map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id, close)}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  {label}
                </button>
              ))}
              {/* Divider */}
              <div className="h-px bg-white/5 my-1 mx-4" />
              {/* Auth links */}
              <Link
                to="/login"
                onClick={close}
                className="px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={close}
                className="btn-primary text-sm px-4 py-3 mx-0"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

// ─── Main Home Page ───────────────────────────────────────────────────────────
const Home = () => {
  return (
    <div className="min-h-screen relative text-slate-200 overflow-x-hidden">

      {/* Background mesh */}
      <div className="bg-mesh" aria-hidden="true" />

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <HomeNav />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative pt-14 sm:pt-20 md:pt-28 pb-16 sm:pb-24 md:pb-32 px-4 text-center overflow-hidden">
        {/* Glow orbs — clamped so they don't cause scroll */}
        <div className="absolute top-16 left-[10%] w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-primary-600/20 rounded-full blur-[100px] -z-0 pointer-events-none" />
        <div className="absolute top-32 right-[10%] w-36 sm:w-56 md:w-72 h-36 sm:h-56 md:h-72 bg-accent-blue/20 rounded-full blur-[80px] -z-0 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-primary-500/10 border border-primary-500/30 rounded-full text-primary-300 text-xs sm:text-sm font-medium mb-6 sm:mb-8">
            <Star className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Collaborative Team Task Manager</span>
          </div>

          {/* Headline — fluid scaling across all screens */}
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-4 sm:mb-6">
            Manage Tasks.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-accent-blue to-accent-teal block sm:inline">
              Ship Faster.
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2 sm:px-0">
            TaskMaster is a real-time team collaboration platform. Assign tasks, track projects,
            get deadline alerts, and keep your team in sync — all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-center gap-3 sm:gap-4 px-4 xs:px-0">
            <Link to="/register" className="btn-primary px-6 py-3 text-sm sm:text-base group">
              Start for Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="btn-secondary px-6 py-3 text-sm sm:text-base">
              Sign In to Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative z-10 mt-12 sm:mt-16 md:mt-20 grid grid-cols-3 gap-3 sm:gap-4 max-w-xs sm:max-w-sm md:max-w-lg mx-auto px-2 sm:px-0">
          {[
            { label: 'Tasks Managed', val: 500, suffix: '+' },
            { label: 'Team Members', val: 100, suffix: '+' },
            { label: 'Projects', val: 50, suffix: '+' },
          ].map(({ label, val, suffix }) => (
            <div key={label} className="glass-card p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white">
                <Counter target={val} suffix={suffix} />
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm text-slate-400 mt-1 leading-tight">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-14 sm:py-20 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10 sm:mb-14">
            <div className="text-primary-400 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3">
              Core Features
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Everything your team needs
            </h2>
            <p className="text-slate-400 mt-3 text-sm sm:text-base max-w-xl mx-auto px-4 sm:px-0">
              From task creation to real-time notifications — TaskMaster covers the full lifecycle of team work.
            </p>
          </div>

          {/* 1 col on mobile, 2 on tablet, 3 on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            <FeatureCard
              icon={FolderKanban} title="Project Workspaces"
              color="bg-gradient-to-br from-primary-600 to-primary-500" delay="0ms"
              desc="Create organizations and projects. Each project acts as an isolated workspace with a dedicated member list and task board."
            />
            <FeatureCard
              icon={ClipboardList} title="Kanban Task Board"
              color="bg-gradient-to-br from-blue-600 to-blue-500" delay="80ms"
              desc="Visualize tasks across three intuitive columns. Set strict deadlines, securely attach files, and update status with a single click."
            />
            <FeatureCard
              icon={MessageCircle} title="Live Direct Messaging"
              color="bg-gradient-to-br from-emerald-600 to-emerald-500" delay="160ms"
              desc="Discuss blockers instantly. Admins and Members can exchange secure, real-time direct messages right from the task board using Socket.io."
            />
            <FeatureCard
              icon={BarChart3} title="Performance Analytics"
              color="bg-gradient-to-br from-violet-600 to-violet-500" delay="240ms"
              desc="Evaluate team productivity. A dynamic dashboard tracks completion times, calculates weighted scores, and ranks users on a live leaderboard."
            />
            <FeatureCard
              icon={Bell} title="Smart Alerts & Emails"
              color="bg-gradient-to-br from-amber-600 to-amber-500" delay="320ms"
              desc="Real-time in-app notifications and automated HTML email alerts keep everyone aligned on new assignments and impending deadlines."
            />
            <FeatureCard
              icon={Shield} title="Role-Based Security"
              color="bg-gradient-to-br from-rose-600 to-rose-500" delay="400ms"
              desc="Robust organization-level silos. Admins manage the workspace while Members execute tasks, all fully protected via JWT authentication."
            />
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-14 sm:py-20 md:py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10 sm:mb-14">
            <div className="text-primary-400 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3">
              How It Works
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Up and running in minutes
            </h2>
            <p className="text-slate-400 mt-3 text-sm sm:text-base max-w-xl mx-auto px-4 sm:px-0">
              Follow these five steps to get your team collaborating on TaskMaster.
            </p>
          </div>

          {/* Single column on all sizes — cleaner and works on every device */}
          <div className="max-w-2xl mx-auto">
            {[
              {
                number: 1, icon: UserPlus, color: 'bg-gradient-to-br from-primary-600 to-primary-500',
                title: 'Register Organization',
                desc: 'Create an account to instantly provision your isolated organization. Admins can then seamlessly invite new team members via email.',
              },
              {
                number: 2, icon: FolderKanban, color: 'bg-gradient-to-br from-blue-600 to-blue-500',
                title: 'Build Workspaces',
                desc: 'Admins create specialized projects and selectively add members, ensuring teams only see the work relevant to them.',
              },
              {
                number: 3, icon: ClipboardList, color: 'bg-gradient-to-br from-teal-600 to-teal-500',
                title: 'Assign & Execute',
                desc: 'Create tasks, upload vital file attachments, and set strict deadlines. Members take ownership and move tasks through the Kanban board.',
              },
              {
                number: 4, icon: MessageCircle, color: 'bg-gradient-to-br from-emerald-600 to-emerald-500',
                title: 'Collaborate Live',
                desc: 'Discuss blockers directly. Use the real-time chat interface or task-specific DMs to communicate with live typing indicators.',
              },
              {
                number: 5, icon: BarChart3, color: 'bg-gradient-to-br from-violet-600 to-violet-500',
                title: 'Analyze Performance',
                desc: 'The smart dashboard automatically calculates weighted productivity scores, identifying top performers on a beautiful, gamified leaderboard.',
              },
            ].map((step, i, arr) => (
              <Step key={step.number} {...step} delay={`${i * 80}ms`} isLast={i === arr.length - 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ───────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 md:py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10 sm:mb-14">
            <div className="text-primary-400 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3">
              Access Control
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Two roles, clear boundaries
            </h2>
          </div>

          {/* 1 col on mobile, 2 on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <RoleBadge
              role="Admin" icon={Shield}
              color="bg-gradient-to-br from-primary-600 to-primary-500"
              perms={[
                'Manage Organization & invite members',
                'Create, edit, and delete projects',
                'Create tasks, set deadlines & upload files',
                'Direct message any task member securely',
                'View org-wide analytics & leaderboard',
              ]}
            />
            <RoleBadge
              role="Member" icon={Users}
              color="bg-gradient-to-br from-teal-600 to-teal-500"
              perms={[
                'Access assigned projects & workflows',
                'Update task statuses (Pending → Done)',
                'Download secure task attachments',
                'Direct message the project Admin',
                'Track personal overdue stats',
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 md:py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="glass-card p-8 sm:p-12 md:p-16 text-center relative overflow-hidden">
            {/* Background glows inside the card */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent-blue/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto bg-gradient-to-br from-primary-500 to-accent-blue rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3">
                Ready to get organized?
              </h2>
              <p className="text-slate-400 mb-8 text-sm sm:text-base max-w-lg mx-auto px-2 sm:px-0">
                Join your team on TaskMaster and take control of every project, task, and deadline — all from one beautiful dashboard.
              </p>

              {/* Buttons — stacked on mobile, row on sm+ */}
              <div className="flex flex-col xs:flex-row gap-3 justify-center items-stretch xs:items-center px-4 xs:px-0">
                <Link to="/register" className="btn-primary px-6 sm:px-8 py-3 text-sm sm:text-base group">
                  Create Free Account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/login" className="btn-secondary px-6 sm:px-8 py-3 text-sm sm:text-base">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="py-8 px-4 border-t border-white/5 text-center text-slate-500 text-xs sm:text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="p-1 bg-gradient-to-br from-primary-500 to-accent-blue rounded-md">
            <CheckSquare className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-400">TaskMaster</span>
        </div>
        <p>Built with React, Node.js, Express &amp; MongoDB &nbsp;·&nbsp; © {new Date().getFullYear()}</p>
      </footer>

    </div>
  );
};

export default Home;
