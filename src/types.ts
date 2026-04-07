export type KPIType = 'senior' | 'junior';

export interface Employee {
  id: string;
  name: string;
  login: string;
  kpi_type: KPIType;
  face_descriptor?: number[];
  created_at: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  work_date: string;
  start_time: string | null;
  end_time: string | null;
  lunch_start: string | null;
  lunch_end: string | null;
  work_seconds: number;
  lunch_seconds: number;
  afk_seconds: number;
  afk_count: number;
  late_minutes: number;
  status: 'keldi' | 'kechikkan' | 'kelmadi' | 'auto_ended';
  auto_ended: boolean;
}

export interface Complaint {
  id: string;
  employee_id: string;
  type: 'complaint' | 'suggestion';
  message: string;
  admin_reply: string | null;
  is_resolved: boolean;
  created_at: string;
}

export interface KPIBonus {
  id: string;
  employee_id: string;
  month: string;
  bonus: number;
}

export interface Admin {
  id: string;
  name: string;
  login: string;
}

export interface AppState {
  user: (Employee & { role: 'employee' }) | (Admin & { role: 'admin' }) | null;
  theme: 'light' | 'dark';
  lang: 'uz' | 'ru';
}
