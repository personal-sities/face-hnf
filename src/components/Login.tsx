import React, { useState } from 'react';
import { useApp } from '../App';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Login() {
  const { setState } = useApp();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login || !password) return toast.error('Login va parolni kiriting!');
    
    setLoading(true);
    try {
      // Check Admin
      const { data: admin, error: adminErr } = await supabase
        .from('admins')
        .select('*')
        .eq('login', login)
        .eq('password', password)
        .maybeSingle();

      if (admin) {
        setState(prev => ({ ...prev, user: { ...admin, role: 'admin' } }));
        toast.success('Xush kelibsiz, Admin!');
        return;
      }

      // Check Employee
      const { data: emp, error: empErr } = await supabase
        .from('employees')
        .select('*')
        .eq('login', login)
        .eq('password', password)
        .maybeSingle();

      if (emp) {
        setState(prev => ({ ...prev, user: { ...emp, role: 'employee' } }));
        toast.success(`Xush kelibsiz, ${emp.name}!`);
        return;
      }

      toast.error('Login yoki parol noto\'g\'ri!');
    } catch (err) {
      toast.error('Xatolik yuz berdi!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-100 dark:bg-slate-950">
      <div className="mb-8 flex flex-col items-center">
        {/* Logo Placeholder - Large as requested */}
        <div className="w-64 h-40 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl mb-6 text-white font-bold text-4xl overflow-hidden">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <span>AloqaPro</span>
        </div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Monitoring Tizimi</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Nazorat va KPI boshqaruvi</p>
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold mb-6 text-center">Kirish</h2>
        
        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Login"
              value={login}
              onChange={e => setLogin(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Parol"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-500 transition-colors"
            >
              {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Yuklanmoqda...' : 'Kirish'}
        </button>
      </form>
    </div>
  );
}
