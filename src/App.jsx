import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  LogOut, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  X,
  Briefcase,
  MapPin,
  Calendar,
  UserCheck,
  TrendingUp,
  PieChart,
  BarChart3,
  Shield,
  User as UserIcon,
  UserPlus,
  Save,
  Archive,
  AlertTriangle
} from 'lucide-react';

// --- Konfigurasi Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyB8rtANpBSRWKeNew0s-7WR0Cz9idoh28E",
  authDomain: "dashboard-pekerjaan-ga.firebaseapp.com",
  projectId: "dashboard-pekerjaan-ga",
  storageBucket: "dashboard-pekerjaan-ga.firebasestorage.app",
  messagingSenderId: "53873450884",
  appId: "1:53873450884:web:1b7f1533c9fc62c90c47d1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'job-dashboard-prod';

const App = () => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  
  const [jobs, setJobs] = useState([]);
  const [userProfiles, setUserProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // State Form Lengkap
  const [jobFormData, setJobFormData] = useState({
    uraian: '', jenis: 'Reguler', unitBisnis: 'Cefe De Tuik', lokasi: '',
    eksekutorBagian: '', eksekutorPic: '', tglPengajuan: '', status: 'Belum Dikerjakan',
    tglSelesai: '', lamaPekerjaan: '', totalBiaya: 0, keterangan: '', isDeleted: false
  });

  const [userFormData, setUserFormData] = useState({
    username: '', password: '', role: 'user', fullName: ''
  });

  // Autentikasi
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) { console.error("Auth error:", error); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Sync Cloud
  useEffect(() => {
    if (!user) return;
    const jobsRef = collection(db, 'artifacts', appId, 'public', 'data', 'jobs');
    const unsubscribeJobs = onSnapshot(jobsRef, (snapshot) => {
      setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
    }, (error) => { console.error("Jobs error:", error); setIsLoading(false); });

    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'userProfiles');
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      setUserProfiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error("Users error:", error));

    return () => { unsubscribeJobs(); unsubscribeUsers(); };
  }, [user]);

  // Filter Utama (Soft Delete)
  const activeJobs = useMemo(() => jobs.filter(j => !j.isDeleted), [jobs]);

  const handleLogin = (e) => {
    e.preventDefault();
    const foundProfile = userProfiles.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (!foundProfile && loginForm.username === 'admin' && loginForm.password === 'admin123') {
      setCurrentUserProfile({ id: 'admin-default', username: 'admin', role: 'admin', fullName: 'Super Admin' });
      setIsLoggedIn(true);
      return;
    }
    if (foundProfile) {
      setCurrentUserProfile(foundProfile);
      setIsLoggedIn(true);
      setLoginError('');
      setActiveView('dashboard');
    } else { setLoginError('Username atau password tidak valid!'); }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUserProfile(null);
    setLoginForm({ username: '', password: '' });
  };

  const saveJob = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'jobs', editingItem.id), jobFormData);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'jobs'), { ...jobFormData, isDeleted: false, createdAt: new Date().toISOString() });
      }
      setIsJobModalOpen(false);
    } catch (err) { console.error(err); }
  };

  const triggerDelete = (item, type) => {
    setItemToDelete({ ...item, deleteType: type });
    setIsConfirmModalOpen(true);
  };

  const executeDelete = async () => {
    if (!user || !itemToDelete) return;
    try {
      if (itemToDelete.deleteType === 'job') {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'jobs', itemToDelete.id), { isDeleted: true });
      } else {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'userProfiles', itemToDelete.id));
      }
      setIsConfirmModalOpen(false);
      setItemToDelete(null);
    } catch (err) { console.error("Gagal menghapus:", err); }
  };

  const saveUser = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'userProfiles', editingItem.id), userFormData);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'userProfiles'), userFormData);
      }
      setIsUserModalOpen(false);
    } catch (err) { console.error(err); }
  };

  // Analitik
  const stats = useMemo(() => ({
    total: activeJobs.length,
    proses: activeJobs.filter(j => j.status === 'Proses').length,
    selesai: activeJobs.filter(j => j.status === 'Selesai').length,
    belum: activeJobs.filter(j => j.status === 'Belum Dikerjakan').length,
    totalBiaya: activeJobs.reduce((acc, curr) => acc + (Number(curr.totalBiaya) || 0), 0)
  }), [activeJobs]);

  const chartData = useMemo(() => {
    const counts = {};
    activeJobs.forEach(j => { counts[j.jenis] = (counts[j.jenis] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [activeJobs]);

  const filteredJobs = useMemo(() => {
    return activeJobs.filter(job => {
      const matchesSearch = job.uraian?.toLowerCase().includes(searchTerm.toLowerCase()) || job.unitBisnis?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'Semua' || job.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [activeJobs, searchTerm, filterStatus]);

  const unitAnalysis = useMemo(() => {
    const analysis = {};
    activeJobs.forEach(job => {
      const unit = job.unitBisnis || 'N/A';
      if (!analysis[unit]) analysis[unit] = { name: unit, total: 0, selesai: 0, biaya: 0 };
      analysis[unit].total += 1;
      if (job.status === 'Selesai') analysis[unit].selesai += 1;
      analysis[unit].biaya += (Number(job.totalBiaya) || 0);
    });
    return Object.values(analysis);
  }, [activeJobs]);

  const openJobModal = (job = null) => {
    setEditingItem(job);
    setJobFormData(job || {
      uraian: '', jenis: 'Reguler', unitBisnis: 'Cefe De Tuik', lokasi: '',
      eksekutorBagian: '', eksekutorPic: '', tglPengajuan: new Date().toISOString().split('T')[0],
      status: 'Belum Dikerjakan', tglSelesai: '', lamaPekerjaan: '', totalBiaya: 0, keterangan: '', isDeleted: false
    });
    setIsJobModalOpen(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-100">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard GA</h1>
            <p className="text-slate-500 text-sm mt-1">Sistem Monitoring Terpusat</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="Username" required className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800" value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}/>
            <input type="password" placeholder="Password" required className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}/>
            {loginError && <div className="text-red-500 text-xs font-bold flex items-center gap-2"><AlertCircle size={14}/>{loginError}</div>}
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all">MASUK KE DASHBOARD</button>
          </form>
          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
            <p className="text-[10px] text-blue-500 font-black uppercase mb-1">Admin Default: admin / admin123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col fixed h-full z-30 shadow-sm">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg"><ClipboardList className="text-white w-5 h-5" /></div>
          <span className="font-black text-xl text-slate-800 tracking-tight">Dashboard GA</span>
        </div>
        <nav className="flex-1 px-4 py-2 space-y-1">
          <NavButton active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon={<LayoutDashboard size={18}/>} label="Beranda" />
          <NavButton active={activeView === 'jobs'} onClick={() => setActiveView('jobs')} icon={<ClipboardList size={18}/>} label="Daftar Kerja" />
          {currentUserProfile.role === 'admin' && (
            <NavButton active={activeView === 'users'} onClick={() => setActiveView('users')} icon={<Users size={18}/>} label="Pengguna" />
          )}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-bold"><LogOut size={18} /> Keluar</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{activeView === 'dashboard' ? 'Ringkasan Operasional' : activeView === 'jobs' ? 'Manajemen Kerja' : 'Manajemen User'}</h2>
            <p className="text-slate-500 text-xs font-bold uppercase opacity-60">Penyimpanan Cloud Aktif</p>
          </div>
          <div className="flex gap-2">
            {activeView === 'jobs' && <button onClick={() => openJobModal()} className="bg-blue-600 text-white flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-lg font-bold text-sm"><Plus size={18} /> Data Baru</button>}
            {activeView === 'users' && currentUserProfile.role === 'admin' && <button onClick={() => { setEditingItem(null); setUserFormData({username: '', password: '', role: 'user', fullName: ''}); setIsUserModalOpen(true); }} className="bg-indigo-600 text-white flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-lg font-bold text-sm"><UserPlus size={18} /> Tambah User</button>}
          </div>
        </header>

        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold">Sinkronisasi Data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeView === 'dashboard' && (
              <div className="space-y-6">
                {/* Kartu Statistik Utama - Sekarang lg:grid-cols-5 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <StatCard icon={<ClipboardList className="text-blue-600"/>} label="Total Kerja" value={stats.total} color="bg-blue-50" />
                  <StatCard icon={<TrendingUp className="text-emerald-600"/>} label="Total Biaya" value={`Rp ${stats.totalBiaya.toLocaleString()}`} color="bg-emerald-50" />
                  <StatCard icon={<Clock className="text-amber-600"/>} label="Proses" value={stats.proses} color="bg-amber-50" />
                  <StatCard icon={<CheckCircle className="text-indigo-600"/>} label="Selesai" value={stats.selesai} color="bg-indigo-50" />
                  {/* Kartu Baru: Belum Dikerjakan */}
                  <StatCard icon={<AlertTriangle className="text-rose-600"/>} label="Belum Dikerjakan" value={stats.belum} color="bg-rose-50" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-black text-slate-800 flex items-center gap-2 mb-6 text-xs uppercase"><PieChart size={16} className="text-blue-600" /> Progres Realisasi</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-8">
                      <div className="relative w-32 h-32">
                        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                          <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100" strokeWidth="4"></circle>
                          <circle cx="18" cy="18" r="16" fill="none" className="stroke-emerald-500" strokeWidth="4" strokeDasharray={`${(stats.selesai / (stats.total || 1)) * 100} 100`} strokeDashoffset="0" strokeLinecap="round"></circle>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-black text-slate-800">{Math.round((stats.selesai / (stats.total || 1)) * 100)}%</div>
                      </div>
                      <div className="flex-1 space-y-3 w-full">
                        <LegendItem color="bg-emerald-500" label="Selesai" value={stats.selesai} />
                        <LegendItem color="bg-amber-500" label="Proses" value={stats.proses} />
                        <LegendItem color="bg-rose-400" label="Belum Dikerjakan" value={stats.belum} />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-black text-slate-800 flex items-center gap-2 mb-6 text-xs uppercase"><BarChart3 size={16} className="text-blue-600" /> Kategori Kerja</h3>
                    <div className="space-y-4">
                      {chartData.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase"><span>{item.name}</span><span>{item.value}</span></div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600" style={{ width: `${(item.value / (stats.total || 1)) * 100}%` }}></div></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                   <div className="p-4 bg-slate-50 border-b font-black text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2"><LayoutDashboard size={14} className="text-blue-600" /> Analisis Unit Bisnis</div>
                   <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b">
                        <tr><th className="px-6 py-4">Unit</th><th className="px-6 py-4 text-center">Total</th><th className="px-6 py-4">Biaya</th><th className="px-6 py-4">Progres</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {unitAnalysis.map((unit, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-black text-slate-700">{unit.name}</td>
                            <td className="px-6 py-4 text-center font-bold">{unit.total}</td>
                            <td className="px-6 py-4 font-bold text-slate-600">Rp {unit.biaya.toLocaleString()}</td>
                            <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden min-w-[80px]"><div className="h-full bg-blue-500" style={{ width: `${(unit.selesai / unit.total) * 100}%` }}></div></div><span className="text-[10px] font-black text-slate-400">{Math.round((unit.selesai / unit.total) * 100)}%</span></div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                   </div>
                </div>
              </div>
            )}

            {activeView === 'jobs' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="relative w-full md:w-80"><Search className="absolute left-3 top-2.5 text-slate-400" size={16} /><input type="text" placeholder="Cari..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                  <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
                    {['Semua', 'Belum Dikerjakan', 'Proses', 'Selesai'].map(s => (
                      <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filterStatus === s ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                      <tr><th className="px-6 py-4">Pekerjaan</th><th className="px-6 py-4">Unit/Lokasi</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Aksi</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredJobs.map(job => (
                        <tr key={job.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4"><p className="font-black text-slate-800 text-sm leading-tight">{job.uraian}</p><span className="text-[9px] uppercase font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md mt-1 inline-block">{job.jenis}</span></td>
                          <td className="px-6 py-4"><p className="text-sm font-bold text-slate-700">{job.unitBisnis}</p><p className="text-xs text-slate-400 font-bold">{job.lokasi}</p></td>
                          <td className="px-6 py-4"><StatusBadge status={job.status} /></td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => openJobModal(job)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"><Edit2 size={16}/></button>
                              {currentUserProfile.role === 'admin' && <button onClick={() => triggerDelete(job, 'job')} className="p-2 text-red-600 hover:bg-red-50 rounded-xl" title="Hapus Pekerjaan"><Trash2 size={16}/></button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeView === 'users' && currentUserProfile.role === 'admin' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userProfiles.map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${p.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>{p.role === 'admin' ? <Shield size={24}/> : <UserIcon size={24}/>}</div>
                      <div><h4 className="font-black text-slate-800 truncate">{p.fullName}</h4><p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">@{p.username}</p></div>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-50 pt-4 mt-2">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${p.role === 'admin' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{p.role}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingItem(p); setUserFormData(p); setIsUserModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"><Edit2 size={16}/></button>
                        <button onClick={() => triggerDelete(p, 'user')} className="p-2 text-red-600 hover:bg-red-50 rounded-xl"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL PEKERJAAN */}
      {isJobModalOpen && (
        <Modal title={editingItem ? "Update Detail Pekerjaan" : "Pekerjaan Baru"} onClose={() => setIsJobModalOpen(false)}>
          <form onSubmit={saveJob} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2"><label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"><Briefcase size={12}/> Uraian Pekerjaan</label><input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800" value={jobFormData.uraian} onChange={e => setJobFormData({...jobFormData, uraian: e.target.value})} /></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Jenis Pekerjaan</label><select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700" value={jobFormData.jenis} onChange={e => setJobFormData({...jobFormData, jenis: e.target.value})}><option>Reguler</option><option>Project</option><option>Urgen</option><option>Insidental</option></select></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Unit Bisnis</label><select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700" value={jobFormData.unitBisnis} onChange={e => setJobFormData({...jobFormData, unitBisnis: e.target.value})}><option>Cefe De Tuik</option><option>Padel</option><option>Pakarangan</option><option>Lainnya</option></select></div>
              <div><label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5"><MapPin size={12}/> Lokasi</label><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800" value={jobFormData.lokasi} onChange={e => setJobFormData({...jobFormData, lokasi: e.target.value})} /></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Status Progres</label><select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-black text-slate-700" value={jobFormData.status} onChange={e => setJobFormData({...jobFormData, status: e.target.value})}><option>Belum Dikerjakan</option><option>Proses</option><option>Selesai</option></select></div>
              <div className="md:col-span-2 bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                <p className="text-[10px] font-black text-blue-500 uppercase mb-4 flex items-center gap-2"><UserCheck size={14}/> Detail Eksekutor</p>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Bagian</label><input className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm font-bold" value={jobFormData.eksekutorBagian} onChange={e => setJobFormData({...jobFormData, eksekutorBagian: e.target.value})} /></div>
                  <div><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Nama PIC</label><input className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm font-bold" value={jobFormData.eksekutorPic} onChange={e => setJobFormData({...jobFormData, eksekutorPic: e.target.value})} /></div>
                </div>
              </div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Tgl Pengajuan</label><input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800" value={jobFormData.tglPengajuan} onChange={e => setJobFormData({...jobFormData, tglPengajuan: e.target.value})} /></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Tgl Selesai</label><input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800" value={jobFormData.tglSelesai} onChange={e => setJobFormData({...jobFormData, tglSelesai: e.target.value})} /></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Lama Pekerjaan</label><input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800" value={jobFormData.lamaPekerjaan} onChange={e => setJobFormData({...jobFormData, lamaPekerjaan: e.target.value})} /></div>
              <div><label className="text-[10px] font-black text-emerald-600 uppercase mb-1.5 block">Total Biaya (Rp)</label><input type="number" className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl font-black text-emerald-700" value={jobFormData.totalBiaya} onChange={e => setJobFormData({...jobFormData, totalBiaya: e.target.value})} /></div>
              <div className="md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Keterangan</label><textarea rows="3" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-800 text-sm font-medium" value={jobFormData.keterangan} onChange={e => setJobFormData({...jobFormData, keterangan: e.target.value})}></textarea></div>
            </div>
            <div className="pt-4 border-t flex gap-3"><button type="button" onClick={() => setIsJobModalOpen(false)} className="flex-1 py-4 rounded-2xl font-black uppercase text-[10px] text-slate-400 bg-slate-100 hover:bg-slate-200 transition-all">Batal</button><button type="submit" className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"><Save size={16}/> {editingItem ? 'Simpan Perubahan' : 'Posting Data'}</button></div>
          </form>
        </Modal>
      )}

      {/* MODAL USER */}
      {isUserModalOpen && (
        <Modal title={editingItem ? "Edit User" : "User Baru"} onClose={() => setIsUserModalOpen(false)}>
          <form onSubmit={saveUser} className="space-y-4">
            <div><label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nama Lengkap</label><input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold" value={userFormData.fullName} onChange={e => setUserFormData({...userFormData, fullName: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Username</label><input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800" value={userFormData.username} onChange={e => setUserFormData({...userFormData, username: e.target.value})} /></div>
              <div><label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Password</label><input required type="password" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} /></div>
            </div>
            <div><label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Peran (Role)</label><select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-700" value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value})}><option value="user">USER (Lihat & Update)</option><option value="admin">ADMIN (Kontrol Penuh)</option></select></div>
            <div className="pt-4"><button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">SIMPAN USER</button></div>
          </form>
        </Modal>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden p-8 text-center animate-in zoom-in duration-200">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${itemToDelete?.deleteType === 'job' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
              {itemToDelete?.deleteType === 'job' ? <Archive size={32} /> : <Trash2 size={32} />}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Konfirmasi {itemToDelete?.deleteType === 'job' ? 'Arsip' : 'Hapus'}</h3>
            <p className="text-sm text-slate-500 mb-8">
              {itemToDelete?.deleteType === 'job' 
                ? "Pekerjaan ini akan dipindahkan ke arsip dan tidak ditampilkan lagi di dashboard." 
                : "Akun pengguna ini akan dihapus secara permanen dari sistem."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setIsConfirmModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200 transition-colors">Batal</button>
              <button onClick={executeDelete} className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95 ${itemToDelete?.deleteType === 'job' ? 'bg-amber-600 shadow-amber-100' : 'bg-red-600 shadow-red-100'}`}>Ya, Lanjutkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-black transition-all text-xs uppercase tracking-wider ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>{icon} {label}</button>
);

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4 transition-transform hover:scale-[1.02]"><div className={`p-3.5 rounded-2xl ${color} shadow-inner`}>{icon}</div><div><p className="text-[10px] text-slate-400 font-black uppercase mb-1 leading-none">{label}</p><p className="text-xl font-black text-slate-800 tracking-tight leading-none">{value}</p></div></div>
);

const LegendItem = ({ color, label, value }) => (
  <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest"><div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>{label}</div><span className="text-slate-800 font-bold">{value}</span></div>
);

const StatusBadge = ({ status }) => {
  const styles = { 'Selesai': 'bg-emerald-50 text-emerald-700 border-emerald-100', 'Proses': 'bg-amber-50 text-amber-700 border-amber-100', 'Belum Dikerjakan': 'bg-slate-50 text-slate-500 border-slate-100' };
  return <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${styles[status]}`}>{status}</span>;
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
      <div className="p-7 border-b flex justify-between items-center bg-slate-50/30"><h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3><button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"><X size={24}/></button></div>
      <div className="p-8 max-h-[85vh] overflow-y-auto custom-scrollbar">{children}</div>
    </div>
  </div>
);

export default App;

