import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Send, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

interface ComplaintsProps {
  onClose: () => void;
  employeeId?: string;
  isAdmin: boolean;
}

export default function Complaints({ onClose, employeeId, isAdmin }: ComplaintsProps) {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'complaint' | 'suggestion'>('complaint');
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    let query = supabase.from('complaints').select('*, employees(name)');
    if (!isAdmin && employeeId) {
      query = query.eq('employee_id', employeeId);
    }
    const { data } = await query.order('created_at', { ascending: false });
    if (data) setComplaints(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;
    
    const { error } = await supabase.from('complaints').insert({
      employee_id: employeeId,
      type,
      message
    });

    if (!error) {
      toast.success('Xabar yuborildi!');
      setMessage('');
      loadComplaints();
    }
  };

  const handleReply = async (id: string) => {
    if (!reply) return;
    const { error } = await supabase.from('complaints').update({
      admin_reply: reply,
      is_resolved: true
    }).eq('id', id);

    if (!error) {
      toast.success('Javob yuborildi!');
      setReply('');
      setActiveId(null);
      loadComplaints();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 bg-blue-600 text-white flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" /> Shikoyat va Takliflar
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isAdmin && (
            <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setType('complaint')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    type === 'complaint' ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  Shikoyat
                </button>
                <button
                  type="button"
                  onClick={() => setType('suggestion')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    type === 'suggestion' ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                >
                  Taklif
                </button>
              </div>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Xabaringizni yozing..."
                className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              />
              <button
                type="submit"
                className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" /> Yuborish
              </button>
            </form>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Xabarlar Tarixi</h3>
            {loading ? (
              <p className="text-center py-8">Yuklanmoqda...</p>
            ) : complaints.length === 0 ? (
              <p className="text-center py-8 text-slate-500">Hozircha xabarlar yo'q</p>
            ) : (
              complaints.map(item => (
                <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.type === 'complaint' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {item.type === 'complaint' ? 'Shikoyat' : 'Taklif'}
                      </span>
                      {isAdmin && <span className="text-xs font-bold">{item.employees?.name}</span>}
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm mb-3">{item.message}</p>
                  
                  {item.admin_reply ? (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border-l-4 border-blue-500">
                      <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Admin Javobi:</p>
                      <p className="text-sm italic">{item.admin_reply}</p>
                    </div>
                  ) : isAdmin ? (
                    <div className="mt-2">
                      {activeId === item.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={reply}
                            onChange={e => setReply(e.target.value)}
                            placeholder="Javob yozing..."
                            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleReply(item.id)} className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">Yuborish</button>
                            <button onClick={() => setActiveId(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-xs font-bold rounded-lg">Bekor</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setActiveId(item.id)} className="text-xs text-blue-500 font-bold hover:underline">Javob berish</button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                      <Clock className="w-3 h-3" /> Javob kutilmoqda
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
