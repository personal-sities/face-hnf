import React, { useState, useEffect, createContext, useContext } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AppState, Employee, Admin } from './types';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';

const AppContext = createContext<{
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
} | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('aloqa_app_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return { user: null, theme: 'light', lang: 'uz' };
      }
    }
    return { user: null, theme: 'light', lang: 'uz' };
  });

  useEffect(() => {
    localStorage.setItem('aloqa_app_state', JSON.stringify(state));
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state]);

  return (
    <AppContext.Provider value={{ state, setState }}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        {!state.user ? (
          <Login />
        ) : state.user.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <EmployeeDashboard />
        )}
        <ToastContainer position="bottom-right" theme={state.theme as any} aria-label="Notifications" />
      </div>
    </AppContext.Provider>
  );
}
