import { useState, useEffect, useRef } from 'react';
import { useApp } from '../App';
import { supabase } from '../lib/supabase';
import { 
  LogOut, Clock, Coffee, Play, Square, AlertCircle, 
  MessageSquare, History, User, Sun, Moon, Download, 
  Bell, CheckCircle, XCircle 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { 
  tzNow, todayISO, fmtHM, fmtSec, fmtSecMM, 
  isWorkDay, calcKpi 
} from '../lib/utils';
import { checkReminders, requestNotificationPermission } from '../lib/notifications';
import FaceWidget from './FaceWidget';
import Complaints from './Complaints';

export default function EmployeeDashboard() {
  const { state, setState } = useApp();
  const user = state.user as any;
  const [empState, setEmpState] = useState<'not_started' | 'working' | 'lunch' | 'ended'>('not_started');
  const [wAccum, setWAccum] = useState(0);
  const [lAccum, setLAccum] = useState(0);
  const [afkSeconds, setAfkSeconds] = useState(0);
  const [afkCount, setAfkCount] = useState(0);
  const [faceDetected, setFaceDetected] = useState(true);
  const [faceMissCount, setFaceMissCount] = useState(0);
  const [isAfk, setIsAfk] = useState(false);
  const [showComplaints, setShowComplaints] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const wStartRef = useRef<Date | null>(null);
  const lStartRef = useRef<Date | null>(null);
  const afkStartRef = useRef<Date | null>(null);

  useEffect(() => {
    requestNotificationPermission();
    loadTodayState();
    loadHistory();
  }, []);

  const loadTodayState = async () => {
    const today = todayISO();
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', user.id)
      .eq('work_date', today)
      .maybeSingle();

    if (data) {
      setWAccum(data.work_seconds || 0);
      setLAccum(data.lunch_seconds || 0);
      setAfkSeconds(data.afk_seconds || 0);
      setAfkCount(data.afk_count || 0);
      if (data.end_time) setEmpState('ended');
      else if (data.lunch_start && !data.lunch_end) setEmpState('lunch');
      else if (data.start_time) setEmpState('working');
    }
    setLoading(false);
  };

  const loadHistory = async () => {
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', user.id)
      .order('work_date', { ascending: false })
      .limit(30);
    if (data) setHistory(data);
  };

  // Main Timers
  useEffect(() => {
    const interval = setInterval(() => {
      const now = tzNow();
      
      // Auto-end check (18:15)
      if (empState !== 'ended' && empState !== 'not_started') {
        if (now.getHours() === 18 && now.getMinutes() >= 15) {
          handleEnd(true);
        }
      }

      // Reminders
      checkReminders(now);

      // Accumulate time
      if (empState === 'working') {
        setWAccum(prev => prev + 1);
      } else if (empState === 'lunch') {
        setLAccum(prev => prev + 1);
      }

      // AFK Logic
      if (empState === 'working') {
        if (!faceDetected) {
          setFaceMissCount(prev => prev + 1);
          // If no face for 5 minutes (300s)
          if (faceMissCount >= 300) {
            if (!isAfk) {
              setIsAfk(true);
              setAfkCount(prev => prev + 1);
              toast.warning('Yuz aniqlanmadi! AFK vaqti hisoblanmoqda.');
            }
            setAfkSeconds(prev => {
              const newVal = prev + 1;
              if (newVal === 1800) { // 30 minutes
                toast.error('Kunlik AFK limiti (30 daqiqa) oshib ketdi!');
              }
              return newVal;
            });
          }
        } else {
          setFaceMissCount(0);
          if (isAfk) {
            setIsAfk(false);
            toast.success('Xush kelibsiz! AFK to\'xtatildi.');
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [empState, faceDetected, faceMissCount, isAfk]);

  const handleStart = async () => {
    const now = tzNow();
    const today = todayISO();
    const startTime = fmtHM(now);
    const lateMin = Math.max(0, now.getHours() * 60 + now.getMinutes() - 9 * 60);

    const { error } = await supabase.from('attendance').insert({
      employee_id: user.id,
      work_date: today,
      start_time: startTime,
      late_minutes: lateMin,
      status: lateMin > 0 ? 'kechikkan' : 'keldi'
    });

    if (!error) {
      setEmpState('working');
      toast.success('Ish boshlandi!');
    }
  };

  const handleLunch = async () => {
    const now = tzNow();
    const time = fmtHM(now);
    
    if (empState === 'working') {
      await supabase.from('attendance').update({ lunch_start: time }).eq('employee_id', user.id).eq('work_date', todayISO());
      setEmpState('lunch');
    } else {
      await supabase.from('attendance').update({ lunch_end: time }).eq('employee_id', user.id).eq('work_date', todayISO());
      setEmpState('working');
    }
  };

  const handleEnd = async (auto = false) => {
    const now = tzNow();
    const time = fmtHM(now);
    
    await supabase.from('attendance').update({ 
      end_time: time,
      work_seconds: wAccum,
      lunch_seconds: lAccum,
      afk_seconds: afkSeconds,
      afk_count: afkCount,
      auto_ended: auto,
      status: auto ? 'auto_ended' : undefined
    }).eq('employee_id', user.id).eq('work_date', todayISO());

    setEmpState('ended');
    if (auto) toast.info('Ish vaqti tizim tomonidan yakunlandi!');
    else toast.success('Ish yakunlandi!');
    loadHistory();
  };

  const toggleTheme = () => {
    setState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Yuklanmoqda...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <span className="text-xl">A</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">AloqaPro</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
            {state.theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button onClick={() => setState(prev => ({ ...prev, user: null }))} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Control Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
              <div>
                <h2 className="text-2xl font-bold mb-2">Bugungi Ish Jarayoni</h2>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    empState === 'working' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    empState === 'lunch' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    empState === 'ended' ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {empState === 'working' ? 'Ishda' : empState === 'lunch' ? 'Tushlikda' : empState === 'ended' ? 'Yakunlandi' : 'Boshlanmagan'}
                  </span>
                  {isAfk && <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-bold animate-pulse">AFK</span>}
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="text-4xl font-black font-mono tracking-tighter text-blue-600 dark:text-blue-400">
                  {fmtSec(wAccum)}
                </div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Ish Vaqti</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <button
                onClick={handleStart}
                disabled={empState !== 'not_started'}
                className="flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5" /> Boshlash
              </button>
              <button
                onClick={handleLunch}
                disabled={empState === 'not_started' || empState === 'ended'}
                className="flex items-center justify-center gap-2 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Coffee className="w-5 h-5" /> {empState === 'lunch' ? 'Qaytish' : 'Tushlik'}
              </button>
              <button
                onClick={() => handleEnd(false)}
                disabled={empState === 'not_started' || empState === 'ended'}
                className="flex items-center justify-center gap-2 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Square className="w-5 h-5" /> Yakunlash
              </button>
            </div>

            {/* AFK Stats */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold">AFK Vaqti</p>
                  <p className="font-bold text-red-600 dark:text-red-400">{fmtSec(afkSeconds)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-bold">AFK Soni</p>
                <p className="font-bold">{afkCount} marta</p>
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" /> Oxirgi 30 kun
              </h3>
              <button className="text-blue-500 hover:underline text-sm font-bold">Hammasi</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-700">
                    <th className="pb-4 text-left font-bold">Sana</th>
                    <th className="pb-4 text-left font-bold">Boshlash</th>
                    <th className="pb-4 text-left font-bold">Tugash</th>
                    <th className="pb-4 text-left font-bold">Vaqt</th>
                    <th className="pb-4 text-left font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {history.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="py-4 font-medium">{item.work_date}</td>
                      <td className="py-4">{item.start_time?.substring(0, 5) || '-'}</td>
                      <td className="py-4">{item.end_time?.substring(0, 5) || '-'}</td>
                      <td className="py-4 font-mono">{fmtSec(item.work_seconds)}</td>
                      <td className="py-4">
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

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          {/* Face Detection Widget */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" /> Yuz Nazorati
            </h3>
            <div className="flex justify-center mb-4">
              <FaceWidget 
                isActive={empState === 'working'} 
                onFaceDetected={setFaceDetected} 
              />
            </div>
            <div className={`text-center p-3 rounded-xl text-xs font-bold ${
              faceDetected ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'
            }`}>
              {faceDetected ? '✅ Yuz aniqlandi' : '❌ Yuz aniqlanmadi'}
            </div>
          </div>

          {/* Complaints/Suggestions */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" /> Shikoyat va Takliflar
            </h3>
            <button
              onClick={() => setShowComplaints(true)}
              className="w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-sm font-bold transition-colors"
            >
              Yangi yuborish
            </button>
            <div className="mt-4 space-y-3">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Oxirgi xabarlar</p>
              {/* Simplified list */}
              <div className="text-xs text-slate-500 italic">Xabarlar yuklanmoqda...</div>
            </div>
          </div>

          {/* KPI Summary */}
          <div className="bg-blue-600 rounded-3xl p-6 shadow-xl text-white">
            <h3 className="text-sm font-bold mb-4">Oylik KPI Hisoboti</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] opacity-70 font-bold uppercase">Jami Ball</p>
                  <p className="text-3xl font-black">92</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] opacity-70 font-bold uppercase">Bonus</p>
                  <p className="text-lg font-bold">560,000 UZS</p>
                </div>
              </div>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div className="bg-white h-full w-[92%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Complaints Modal */}
      {showComplaints && (
        <Complaints 
          onClose={() => setShowComplaints(false)} 
          employeeId={user.id} 
          isAdmin={false}
        />
      )}
    </div>
  );
}
