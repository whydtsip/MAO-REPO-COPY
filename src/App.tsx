import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Users, 
  Layers, 
  ClipboardList, 
  FileBadge, 
  Map, 
  Clock, 
  Wifi, 
  Menu, 
  X, 
  AlertCircle,
  Database,
  Sparkles,
  LogOut,
  ShieldAlert,
  User,
  FileSpreadsheet,
  Briefcase,
  Folder,
  Archive,
  Key
} from 'lucide-react';

import { Farmer, Cooperative, AgriculturalProgram, DistributionRecord, ArchivalDocument, UserAccount, PPMP } from './types';

// Component imports
import Dashboard from './components/Dashboard';
import FarmersList from './components/FarmersList';
import CooperativesList from './components/CooperativesList';
import ProgramsList from './components/ProgramsList';
import CertificatesDocuments from './components/CertificatesDocuments';
import Profile from './components/Profile';
import AuthScreen from './components/AuthScreen';
import PPMPList from './components/PPMPList';
import OfficeFiles from './components/OfficeFiles';
import ManageAccounts from './components/ManageAccounts';

type ActiveView = 'dashboard' | 'farmers' | 'cooperatives' | 'programs' | 'documents' | 'profile' | 'ppmp' | 'office_files' | 'archives' | 'manage_accounts';

export default function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState<UserAccount | null>(() => {
    const stored = localStorage.getItem('mao_authenticated_user');
    return stored ? JSON.parse(stored) : null;
  });

  // Navigation
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showArchivesSidebar, setShowArchivesSidebar] = useState(false);

  // Toggle Archives via Ctrl + Shift + A keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setShowArchivesSidebar(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Safe fallback if archives is hidden while active
  useEffect(() => {
    if (!showArchivesSidebar && activeView === 'archives') {
      setActiveView('office_files');
    }
  }, [showArchivesSidebar, activeView]);

  // Auto-hide Archives Vault after 9 seconds if not clicked (i.e. activeView !== 'archives')
  useEffect(() => {
    if (showArchivesSidebar && activeView !== 'archives') {
      const timer = setTimeout(() => {
        setShowArchivesSidebar(false);
      }, 9000); // 9 seconds (between 8 and 10 seconds)
      return () => clearTimeout(timer);
    }
  }, [showArchivesSidebar, activeView]);

  // Repository States
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [programs, setPrograms] = useState<AgriculturalProgram[]>([]);
  const [distributions, setDistributions] = useState<DistributionRecord[]>([]);
  const [documents, setDocuments] = useState<ArchivalDocument[]>([]);
  const [ppmpList, setPpmpList] = useState<PPMP[]>([]);

  // Loading / Error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Storage usage status state
  const [storageStatus, setStorageStatus] = useState<{ usedBytes: number; totalBytes: number; year: number } | null>(null);

  const fetchStorageStatus = async () => {
    try {
      const res = await fetch('/api/storage/status');
      if (res.ok) {
        const data = await res.json();
        setStorageStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch storage status:', err);
    }
  };

  useEffect(() => {
    fetchStorageStatus();
    // Poll every 10 seconds
    const interval = setInterval(fetchStorageStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleStorageUpdate = () => {
      fetchStorageStatus();
    };
    window.addEventListener('storage-update', handleStorageUpdate);
    return () => window.removeEventListener('storage-update', handleStorageUpdate);
  }, []);

  // Digital clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial database load
  const loadDatabase = async () => {
    setLoading(true);
    setError(null);
    try {
      const [farmersRes, coopsRes, programsRes, distsRes, docsRes, ppmpRes] = await Promise.all([
        fetch('/api/farmers'),
        fetch('/api/cooperatives'),
        fetch('/api/programs'),
        fetch('/api/distributions'),
        fetch('/api/documents'),
        fetch('/api/ppmp')
      ]);

      if (!farmersRes.ok || !coopsRes.ok || !programsRes.ok || !distsRes.ok || !docsRes.ok || !ppmpRes.ok) {
        throw new Error('Failed to query database registries.');
      }

      const [farmersData, coopsData, programsData, distsData, docsData, ppmpData] = await Promise.all([
        farmersRes.json(),
        coopsRes.json(),
        programsRes.json(),
        distsRes.json(),
        docsRes.json(),
        ppmpRes.json()
      ]);

      setFarmers(farmersData);
      setCooperatives(coopsData);
      setPrograms(programsData);
      setDistributions(distsData);
      setDocuments(docsData);
      setPpmpList(ppmpData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connecting to database server failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  // CRUD Operations
  
  // Farmers
  const handleAddFarmer = async (newFarmer: Omit<Farmer, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/farmers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFarmer)
      });
      if (!res.ok) throw new Error('Failed to add farmer profile.');
      const data = await res.json();
      setFarmers(prev => [...prev, data]);
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const handleUpdateFarmer = async (id: string, updatedFields: Partial<Farmer>) => {
    try {
      const res = await fetch(`/api/farmers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (!res.ok) throw new Error('Failed to update farmer profile.');
      const data = await res.json();
      setFarmers(prev => prev.map(f => f.id === id ? data : f));
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const handleDeleteFarmer = async (id: string) => {
    try {
      const res = await fetch(`/api/farmers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete farmer profile.');
      setFarmers(prev => prev.filter(f => f.id !== id));
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  // Cooperatives
  const handleAddCooperative = async (newCoop: Omit<Cooperative, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/cooperatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoop)
      });
      if (!res.ok) throw new Error('Failed to create cooperative profile.');
      const data = await res.json();
      setCooperatives(prev => [...prev, data]);
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const handleUpdateCooperative = async (id: string, updatedFields: Partial<Cooperative>) => {
    try {
      const res = await fetch(`/api/cooperatives/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (!res.ok) throw new Error('Failed to update cooperative profile.');
      const data = await res.json();
      setCooperatives(prev => prev.map(c => c.id === id ? data : c));
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const handleDeleteCooperative = async (id: string) => {
    try {
      const res = await fetch(`/api/cooperatives/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete cooperative.');
      setCooperatives(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  // Programs
  const handleAddProgram = async (newProg: Omit<AgriculturalProgram, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProg)
      });
      if (!res.ok) throw new Error('Failed to create agricultural program.');
      const data = await res.json();
      setPrograms(prev => [...prev, data]);
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const handleUpdateProgram = async (id: string, updatedFields: Partial<AgriculturalProgram>) => {
    try {
      const res = await fetch(`/api/programs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (!res.ok) throw new Error('Failed to update program guidelines.');
      const data = await res.json();
      setPrograms(prev => prev.map(p => p.id === id ? data : p));
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const handleDeleteProgram = async (id: string) => {
    try {
      const res = await fetch(`/api/programs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete program.');
      setPrograms(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  // Distributions
  const handleAddDistribution = async (newDist: Omit<DistributionRecord, 'id'>) => {
    try {
      const res = await fetch('/api/distributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDist)
      });
      if (!res.ok) throw new Error('Failed to log material distribution.');
      const data = await res.json();
      setDistributions(prev => [...prev, data]);
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const handleDeleteDistribution = async (id: string) => {
    try {
      const res = await fetch(`/api/distributions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove distribution entry.');
      setDistributions(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  // Documents
  const handleAddDocument = async (newDoc: Omit<ArchivalDocument, 'id' | 'uploadedAt'>) => {
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc)
      });
      if (!res.ok) throw new Error('Failed to archive document metadata.');
      const data = await res.json();
      setDocuments(prev => [...prev, data]);
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete archived document.');
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  // PPMP CRUD
  const handleAddPPMP = async (newPPMP: Omit<PPMP, 'id' | 'createdAt' | 'items' | 'totalBudget'>) => {
    try {
      const res = await fetch('/api/ppmp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPPMP)
      });
      if (!res.ok) throw new Error('Failed to create procurement plan.');
      const data = await res.json();
      setPpmpList(prev => [data, ...prev]);
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const handleUpdatePPMP = async (id: string, updatedFields: Partial<PPMP>) => {
    try {
      const res = await fetch(`/api/ppmp/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      if (!res.ok) throw new Error('Failed to update procurement plan.');
      const data = await res.json();
      setPpmpList(prev => prev.map(p => p.id === id ? data : p));
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  const handleDeletePPMP = async (id: string) => {
    try {
      const res = await fetch(`/api/ppmp/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete procurement plan.');
      setPpmpList(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  if (!authenticatedUser) {
    return <AuthScreen onLoginSuccess={(user) => setAuthenticatedUser(user)} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('mao_authenticated_user');
    setAuthenticatedUser(null);
    setActiveView('dashboard');
  };

  const userInitials = authenticatedUser.name
    ? authenticatedUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'MA';

  const userDisplayRole = authenticatedUser.role === 'admin' 
    ? 'Admin Director' 
    : 'Staff Member';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased">
      {/* Mobile Top Header Bar */}
      <header className="md:hidden flex items-center justify-between bg-white px-4 py-4 border-b border-slate-200 shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-indigo-600 p-2 text-white">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold tracking-tight text-gray-900 font-display">MAO AgriCloud</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleLogout}
            className="text-slate-500 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
            title="Log Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-gray-500 hover:text-gray-700 focus:outline-hidden"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Primary Navigation Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out flex flex-col justify-between border-r border-slate-800
        md:relative md:translate-x-0 shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-5 flex flex-col h-full justify-between">
          <div>
            {/* Logo area */}
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-5">
              <div className="rounded-xl bg-indigo-600 p-2.5 text-white shadow-md">
                <Sprout className="h-6 w-6" />
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-wide font-display block">MAO AgriCloud</span>
                <span className="text-[10px] text-indigo-400 font-mono font-semibold tracking-wider uppercase">San Jose, Occ. Mindoro</span>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="mt-6 space-y-1.5">
              <button 
                onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all ${
                  activeView === 'dashboard' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Database className="h-4 w-4 shrink-0" />
                <span>Dashboard Overview</span>
              </button>

              <button 
                onClick={() => { setActiveView('office_files'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all ${
                  activeView === 'office_files' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Folder className="h-4 w-4 shrink-0" />
                <span>Office Files</span>
              </button>

              {showArchivesSidebar && (
                <button 
                  onClick={() => { setActiveView('archives'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all ${
                    activeView === 'archives' 
                      ? 'bg-amber-600 text-white shadow-sm' 
                      : 'text-amber-400 hover:bg-amber-950/40 hover:text-amber-200 bg-amber-500/10 border border-amber-500/20'
                  }`}
                >
                  <Archive className="h-4 w-4 shrink-0" />
                  <span>Archives Vault</span>
                </button>
              )}

              <button 
                onClick={() => { setActiveView('farmers'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all ${
                  authenticatedUser.role === 'admin' ? 'flex' : 'hidden'
                } ${
                  activeView === 'farmers' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Users className="h-4 w-4 shrink-0" />
                <span>Farmer Registry</span>
              </button>

              <button 
                onClick={() => { setActiveView('documents'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all ${
                  activeView === 'documents' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileBadge className="h-4 w-4 shrink-0" />
                <span>Certification</span>
              </button>

              <button 
                onClick={() => { setActiveView('cooperatives'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all ${
                  authenticatedUser.role === 'admin' ? 'flex' : 'hidden'
                } ${
                  activeView === 'cooperatives' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Layers className="h-4 w-4 shrink-0" />
                <span>Cooperatives</span>
              </button>

              <button 
                onClick={() => { setActiveView('programs'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all ${
                  authenticatedUser.role === 'admin' ? 'flex' : 'hidden'
                } ${
                  activeView === 'programs' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <ClipboardList className="h-4 w-4 shrink-0" />
                <span>Programs & Inputs</span>
              </button>

              <button 
                onClick={() => { setActiveView('ppmp'); setIsSidebarOpen(false); }}
                className={`w-full items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all ${
                  authenticatedUser.role === 'admin' ? 'flex' : 'hidden'
                } ${
                  activeView === 'ppmp' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4 shrink-0" />
                <span>Procurement (PPMP)</span>
              </button>

              <button 
                onClick={() => { setActiveView('manage_accounts'); setIsSidebarOpen(false); }}
                className={`w-full items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all ${
                  authenticatedUser.role === 'admin' ? 'flex' : 'hidden'
                } ${
                  activeView === 'manage_accounts' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Key className="h-4 w-4 shrink-0" />
                <span>Manage Accounts</span>
              </button>

              <button 
                onClick={() => { setActiveView('profile'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all ${
                  activeView === 'profile' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <User className="h-4 w-4 shrink-0" />
                <span>Profile Settings</span>
              </button>
            </nav>
          </div>

          {/* System Environment Nodes */}
          <div className="border-t border-slate-800 pt-5 space-y-4">
            
            {/* Storage Usage Indicator for Admin */}
            {authenticatedUser.role === 'admin' && storageStatus && (
              <div className="rounded-xl bg-slate-800/40 border border-slate-800/70 p-3 space-y-2 text-left">
                <div className="flex justify-between items-center text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  <span>Storage Used</span>
                  <span className={
                    (storageStatus.usedBytes / storageStatus.totalBytes) > 0.9 
                      ? "text-rose-500 font-black" 
                      : (storageStatus.usedBytes / storageStatus.totalBytes) > 0.7 
                        ? "text-amber-500 font-bold" 
                        : "text-emerald-400 font-bold"
                  }>
                    {((storageStatus.usedBytes / storageStatus.totalBytes) * 100).toFixed(1)}%
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/50">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      (storageStatus.usedBytes / storageStatus.totalBytes) > 0.9 
                        ? "bg-rose-500" 
                        : (storageStatus.usedBytes / storageStatus.totalBytes) > 0.7 
                          ? "bg-amber-500" 
                          : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, (storageStatus.usedBytes / storageStatus.totalBytes) * 100)}%` }}
                  />
                </div>
                
                {/* Visual numbers info */}
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                  <span>{(storageStatus.usedBytes / (1024 * 1024)).toFixed(1)} MB</span>
                  <span>1.0 GB limit</span>
                </div>
              </div>
            )}

            {/* Log out sidebar button */}
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 border border-transparent hover:border-rose-950/65 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Log Out Account</span>
            </button>

            <div className="rounded-xl bg-slate-800/40 border border-slate-800 p-3 text-[11px] space-y-1.5 text-slate-400">
              <div className="flex items-center gap-1.5 text-indigo-400 font-semibold uppercase tracking-wider text-[10px]">
                <Wifi className="h-3.5 w-3.5" /> Core Systems Online
              </div>
              <div className="font-mono text-[10px]">ROLE: {authenticatedUser.role.toUpperCase()}</div>
              <div className="font-mono text-[10px] flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-indigo-400" /> GEMINI ENGINE: READY
              </div>
            </div>
            
            <div className="text-center text-[10px] text-slate-500">
              © MAO Repository System
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Controls Bar */}
        <header className="hidden md:flex items-center justify-between bg-white px-8 py-4 border-b border-slate-200 shrink-0 sticky top-0 z-30 shadow-xs">
          {/* Left: Section Details */}
          <div className="flex items-center gap-2">
            <span className="text-xs bg-indigo-50 text-indigo-800 font-semibold px-2.5 py-1 rounded-md border border-indigo-100">
              Official MAO Node
            </span>
          </div>

          {/* Right: Info nodes & Clock */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2 font-mono text-xs bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 font-medium">
              <Clock className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>{currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              <span>•</span>
              <span>{currentTime.toLocaleTimeString()}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full overflow-hidden bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs uppercase">
                {authenticatedUser.avatar ? (
                  <img src={authenticatedUser.avatar} alt="Avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  userInitials
                )}
              </div>
              <div className="text-left leading-none">
                <div className="font-bold text-gray-950 text-xs">{authenticatedUser.name}</div>
                <span className="text-[10px] text-gray-400">{userDisplayRole}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body Stage */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 py-24">
              <div className="inline-flex rounded-full bg-indigo-100 p-4 text-indigo-600 animate-spin">
                <Sprout className="h-8 w-8" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Synchronizing database repositories...</h3>
              <p className="text-xs text-gray-500">Connecting to secure file-based storage modules.</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-6 text-center max-w-md mx-auto my-12 space-y-4">
              <AlertCircle className="h-10 w-10 text-rose-600 mx-auto" />
              <h3 className="text-base font-bold text-rose-950">System Offline</h3>
              <p className="text-xs text-rose-700/80 leading-relaxed">{error}</p>
              <button 
                onClick={loadDatabase}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-500"
              >
                Retry Database Query
              </button>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto animate-in fade-in duration-200">
              {activeView === 'dashboard' && (
                <Dashboard 
                  farmers={farmers}
                  cooperatives={cooperatives}
                  programs={programs}
                  distributions={distributions}
                  documents={documents}
                  onViewChange={setActiveView}
                  userRole={authenticatedUser.role}
                />
              )}

              {activeView === 'farmers' && (
                <FarmersList 
                  farmers={farmers}
                  onAddFarmer={handleAddFarmer}
                  onUpdateFarmer={handleUpdateFarmer}
                  onDeleteFarmer={handleDeleteFarmer}
                  userRole={authenticatedUser.role}
                />
              )}

              {activeView === 'cooperatives' && (
                <CooperativesList 
                  cooperatives={cooperatives}
                  onAddCooperative={handleAddCooperative}
                  onUpdateCooperative={handleUpdateCooperative}
                  onDeleteCooperative={handleDeleteCooperative}
                  userRole={authenticatedUser.role}
                />
              )}

              {activeView === 'programs' && (
                <ProgramsList 
                  programs={programs}
                  farmers={farmers}
                  distributions={distributions}
                  onAddProgram={handleAddProgram}
                  onUpdateProgram={handleUpdateProgram}
                  onDeleteProgram={handleDeleteProgram}
                  onAddDistribution={handleAddDistribution}
                  onDeleteDistribution={handleDeleteDistribution}
                  userRole={authenticatedUser.role}
                />
              )}

              {activeView === 'documents' && (
                <CertificatesDocuments 
                  farmers={farmers}
                  userRole={authenticatedUser.role}
                  userName={authenticatedUser.name}
                />
              )}

              {activeView === 'office_files' && (
                <OfficeFiles 
                  userRole={authenticatedUser.role}
                  userName={authenticatedUser.name}
                  initialViewingArchives={false}
                />
              )}

              {activeView === 'archives' && (
                <OfficeFiles 
                  userRole={authenticatedUser.role}
                  userName={authenticatedUser.name}
                  initialViewingArchives={true}
                />
              )}

              {activeView === 'profile' && (
                <Profile 
                  user={authenticatedUser}
                  onUpdateUser={(updatedUser) => setAuthenticatedUser(updatedUser)}
                />
              )}

              {activeView === 'manage_accounts' && (
                <ManageAccounts 
                  user={authenticatedUser}
                />
              )}

              {activeView === 'ppmp' && (
                <PPMPList 
                  ppmpList={ppmpList}
                  onAddPPMP={handleAddPPMP}
                  onUpdatePPMP={handleUpdatePPMP}
                  onDeletePPMP={handleDeletePPMP}
                  userRole={authenticatedUser.role}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
