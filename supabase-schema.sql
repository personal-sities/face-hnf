-- Supabase SQL Schema for AloqaPro

-- 1. Employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  login TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  kpi_type TEXT DEFAULT 'senior', -- 'senior' or 'junior'
  face_descriptor JSONB, -- For face recognition (embeddings)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  work_date DATE DEFAULT CURRENT_DATE,
  start_time TIME,
  end_time TIME,
  lunch_start TIME,
  lunch_end TIME,
  work_seconds INTEGER DEFAULT 0,
  lunch_seconds INTEGER DEFAULT 0,
  afk_seconds INTEGER DEFAULT 0,
  afk_count INTEGER DEFAULT 0,
  late_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'kelmadi', -- 'keldi', 'kechikkan', 'kelmadi', 'auto_ended'
  auto_ended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Complaints and Suggestions
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'complaint' or 'suggestion'
  message TEXT NOT NULL,
  admin_reply TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Settings/Allowed IPs
CREATE TABLE IF NOT EXISTS allowed_ips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. KPI Bonuses (Admin adjustments)
CREATE TABLE IF NOT EXISTS kpi_bonuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- 'YYYY-MM'
  bonus INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  login TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Notifications (Optional for history)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
