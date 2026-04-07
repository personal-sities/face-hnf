import { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { Download, FileText, Table as TableIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { calcKpi, fmtSec } from '../lib/utils';

interface KPIDashboardProps {
  attendance: any[];
  employees: any[];
  month: string;
}

export default function KPIDashboard({ attendance, employees, month }: KPIDashboardProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  const kpiData = useMemo(() => {
    return employees.map(emp => {
      const empAtt = attendance.filter(a => a.employee_id === emp.id);
      
      let lateCount = 0;
      let absCount = 0;
      let totalSec = 0;
      let afkSec = 0;
      
      // Assume 22 working days per month for simplicity
      const workDays = 22; 
      const cameDays = new Set(empAtt.map(a => a.work_date)).size;
      absCount = Math.max(0, workDays - cameDays);

      empAtt.forEach(a => {
        if (a.status === 'kechikkan') lateCount++;
        totalSec += a.work_seconds || 0;
        afkSec += a.afk_seconds || 0;
      });

      const afkPenalty = afkSec > 3600 ? 5 : 0; // Penalty if > 1h AFK per day total
      const penalty = lateCount * 10 + absCount * 20 + afkPenalty;
      const score = Math.min(100, Math.max(0, 100 - penalty));
      const bonus = calcKpi(score, emp.kpi_type);

      return {
        name: emp.name,
        score,
        bonus,
        late: lateCount,
        absent: absCount,
        workHours: Math.floor(totalSec / 3600),
        afkHours: (afkSec / 3600).toFixed(1)
      };
    });
  }, [attendance, employees]);

  const exportPDF = () => {
    const doc = new jsPDF() as any;
    doc.text(`KPI Hisoboti - ${month}`, 14, 15);
    
    const tableData = kpiData.map((d, i) => [
      i + 1, d.name, d.score, d.bonus.toLocaleString() + ' UZS', d.late, d.absent, d.workHours + ' soat'
    ]);

    doc.autoTable({
      head: [['#', 'Hodim', 'Ball', 'Bonus', 'Kechikish', 'Kelmagan', 'Ish Soati']],
      body: tableData,
      startY: 20,
    });

    doc.save(`KPI_Hisobot_${month}.pdf`);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(kpiData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KPI');
    XLSX.writeFile(wb, `KPI_Hisobot_${month}.xlsx`);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('bar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            Bar Chart
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              chartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            Pie Chart
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all"
          >
            <FileText className="w-4 h-4" /> PDF Export
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all"
          >
            <TableIcon className="w-4 h-4" /> Excel Export
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 h-[400px]">
          <h3 className="text-sm font-bold mb-6 text-slate-400 uppercase tracking-widest">KPI Ballari</h3>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={kpiData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {kpiData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={kpiData}
                  dataKey="score"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {kpiData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 h-[400px]">
          <h3 className="text-sm font-bold mb-6 text-slate-400 uppercase tracking-widest">Ish Soatlari</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={kpiData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} width={80} />
              <Tooltip />
              <Bar dataKey="workHours" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold">KPI Batafsil</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="p-4 text-left font-bold">Hodim</th>
                <th className="p-4 text-left font-bold">Ball</th>
                <th className="p-4 text-left font-bold">Bonus</th>
                <th className="p-4 text-left font-bold">Kechikish</th>
                <th className="p-4 text-left font-bold">Kelmagan</th>
                <th className="p-4 text-left font-bold">AFK (soat)</th>
                <th className="p-4 text-left font-bold">Ish Soati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {kpiData.map(item => (
                <tr key={item.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-bold">{item.name}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden max-w-[60px]">
                        <div className="bg-blue-500 h-full" style={{ width: `${item.score}%` }} />
                      </div>
                      <span className="font-bold">{item.score}</span>
                    </div>
                  </td>
                  <td className="p-4 text-green-600 font-bold">{item.bonus.toLocaleString()} UZS</td>
                  <td className="p-4">{item.late} marta</td>
                  <td className="p-4">{item.absent} kun</td>
                  <td className="p-4 text-red-500">{item.afkHours}h</td>
                  <td className="p-4">{item.workHours} soat</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
