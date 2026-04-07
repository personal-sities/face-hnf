import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { supabase } from '../lib/supabase';
import { 
  LogOut, Users, Settings, BarChart3, MessageSquare, 
  Search, Filter, Download, Plus, Trash2, Edit, 
  Sun, Moon, CheckCircle, XCircle, Clock, ShieldCheck,
  FileText, Database
} from 'lucide-react';
import { toast } from 'react-toastify';
import { todayISO, curM, fmtSec, calcKpi } from '../lib/utils';
import KPIDashboard from './KPIDashboard';
import Complaints from './Complaints';

export default function AdminDashboard() {
  const { state, setState } = useApp();
  const [tab, setTab] = useState<'main' | 'settings' | 'kpi' | 'complaints'>('main');
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(curM());
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', login: '', password: '', kpi_type: 'senior' });

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    const { data: emps } = await supabase.from('employees').select('*');
    const { data: att } = await supabase
      .from('attendance')
      .select('*, employees(name)')
      .gte('work_date', `${selectedMonth}-01`)
      .lte('work_date', `${selectedMonth}-31`);

    if (emps) setEmployees(emps);
    if (att) setAttendance(att);
    setLoading(false);
  };

  const handleAddEmp = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('employees').insert(newEmp);
    if (!error) {
      toast.success('Hodim qo\'shildi!');
      setShowAddEmp(false);
      setNewEmp({ name: '', login: '', password: '', kpi_type: 'senior' });
      loadData();
    } else toast.error('Xatolik: ' + error.message);
  };

  const handleDeleteEmp = async (id: string) => {
    if (!confirm('Hodimni o\'chirishni tasdiqlaysizmi?')) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (!error) {
      toast.success('Hodim o\'chirildi!');
      loadData();
    }
  };

  const toggleTheme = () => {
    setState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const filteredAtt = attendance.filter(item => {
    const matchesSearch = item.employees?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filterStatus || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const workFinishedCount = attendance.filter(a => a.end_time && !a.auto_ended).length;
  const systemFinishedCount = attendance.filter(a => a.auto_ended).length;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden lg:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <span className="text-xl">A</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">AloqaPro</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setTab('main')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              tab === 'main' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Database className="w-5 h-5" /> Asosiy
          </button>
          <button
            onClick={() => setTab('kpi')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              tab === 'kpi' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-5 h-5" /> KPI Dashboard
          </button>
          <button
            onClick={() => setTab('complaints')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              tab === 'complaints' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-5 h-5" /> Shikoyatlar
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              tab === 'settings' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-5 h-5" /> Sozlamalar
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setState(prev => ({ ...prev, user: null }))}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <LogOut className="w-5 h-5" /> Chiqish
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {tab === 'main' ? 'Asosiy Nazorat' : tab === 'kpi' ? 'KPI Hisoboti' : tab === 'complaints' ? 'Shikoyat va Takliflar' : 'Sozlamalar'}
          </h2>
          <div className="flex items-center gap-4">
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-bold outline-none"
            />
            <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              {state.theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          {tab === 'main' && (
            <div className="space-y-8">
              {/* Top Stats - Updated as requested */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Ish Yakunlandi (Oy)</p>
                    <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{workFinishedCount}</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Tizim Yakunladi (Oy)</p>
                    <p className="text-3xl font-black text-red-600 dark:text-red-400">{systemFinishedCount}</p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="font-bold">Davomat Tarixi</h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Qidirish..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm outline-none w-full md:w-64"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-bold outline-none"
                    >
                      <option value="">Barcha</option>
                      <option value="keldi">Keldi</option>
                      <option value="kechikkan">Kechikkan</option>
                      <option value="auto_ended">Tizim yakunladi</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <th className="p-4 text-left font-bold">Sana</th>
                        <th className="p-4 text-left font-bold">Hodim</th>
                        <th className="p-4 text-left font-bold">Boshlash</th>
                        <th className="p-4 text-left font-bold">Tugash</th>
                        <th className="p-4 text-left font-bold">AFK</th>
                        <th className="p-4 text-left font-bold">Kechikish</th>
                        <th className="p-4 text-left font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredAtt.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-4 font-medium">{item.work_date}</td>
                          <td className="p-4 font-bold">{item.employees?.name}</td>
                          <td className="p-4">{item.start_time?.substring(0, 5) || '-'}</td>
                          <td className="p-4">{item.end_time?.substring(0, 5) || '-'}</td>
                          <td className="p-4 text-red-500 font-bold">{fmtSec(item.afk_seconds)}</td>
                          <td className="p-4">{item.late_minutes} daq</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                              item.status === 'keldi' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                              item.status === 'kechikkan' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' :
                              item.status === 'auto_ended' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-700'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'kpi' && (
            <KPIDashboard 
              attendance={attendance} 
              employees={employees} 
              month={selectedMonth} 
            />
          )}

          {tab === 'complaints' && (
            <Complaints isAdmin={true} onClose={() => setTab('main')} />
          )}

          {tab === 'settings' && (
            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold">Hodimlar Boshqaruvi</h3>
                  <button
                    onClick={() => setShowAddEmp(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all"
                  >
                    <Plus className="w-5 h-5" /> Hodim Qo'shish
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {employees.map(emp => (
                    <div key={emp.id} className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 relative group">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xl">
                          {emp.name[0]}
                        </div>
                        <div>
                          <h4 className="font-bold">{emp.name}</h4>
                          <p className="text-xs text-slate-500">@{emp.login}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded">
                          {emp.kpi_type}
                        </span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteEmp(emp.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Employee Modal */}
      {showAddEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <form onSubmit={handleAddEmp} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6">
            <h2 className="text-2xl font-bold text-center">Yangi Hodim</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Ism Familiya"
                required
                value={newEmp.name}
                onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Login"
                required
                value={newEmp.login}
                onChange={e => setNewEmp({ ...newEmp, login: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Parol"
                required
                value={newEmp.password}
                onChange={e => setNewEmp({ ...newEmp, password: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newEmp.kpi_type}
                onChange={e => setNewEmp({ ...newEmp, kpi_type: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              >
                <option value="senior">Eski Hodim (560K)</option>
                <option value="junior">Yangi Hodim (400K)</option>
              </select>
            </div>
            <div className="flex gap-4">
              <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30">Saqlash</button>
              <button type="button" onClick={() => setShowAddEmp(false)} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl">Bekor</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
