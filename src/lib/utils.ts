import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const tzNow = () => {
  const n = new Date();
  // Toshkent vaqti (UTC+5)
  return new Date(n.getTime() + (n.getTimezoneOffset() + 300) * 60000);
};

export const fmtD = (d: Date) => {
  return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear();
};

export const todayISO = () => {
  const d = tzNow();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

export const curM = () => {
  const d = tzNow();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
};

export const fmtHM = (d: Date) => {
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};

export const fmtSec = (s: number) => {
  s = Math.max(0, Math.floor(s));
  return String(Math.floor(s / 3600)).padStart(2, '0') + ':' + String(Math.floor((s % 3600) / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};

export const fmtSecMM = (s: number) => {
  s = Math.max(0, Math.floor(s));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};

export const isWorkDay = (ds: string, holidays: string[] = []) => {
  const d = new Date(ds + 'T12:00:00');
  if (d.getDay() === 0) return false; // Yakshanba dam
  return !holidays.includes(ds);
};

export const calcKpi = (ball: number, type: 'senior' | 'junior') => {
  if (type === 'senior') {
    if (ball >= 90) return 560000;
    if (ball >= 80) return 420000;
    if (ball >= 70) return 280000;
    return 0;
  }
  if (ball >= 90) return 400000;
  if (ball >= 80) return 300000;
  if (ball >= 70) return 210000;
  return 0;
};
