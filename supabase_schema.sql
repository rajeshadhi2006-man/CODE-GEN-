-- NEXUS WORKFORCE OS — Supabase Production Database Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor) to initialize all tables and Realtime.

-- 1. EMPLOYEES TABLE
create table if not exists public.employees (
  id text primary key,
  name text not null,
  title text not null,
  email text,
  location text,
  region text not null check (region in ('Americas', 'EMEA', 'APAC', 'LATAM', 'South Asia')),
  timezone text default 'UTC+0',
  skills jsonb default '[]'::jsonb,
  performance jsonb default '{"quality": 90, "on_time": 95, "tasks_completed_30d": 0}'::jsonb,
  capacity_hours numeric default 40,
  utilization_pct numeric default 0,
  status text default 'Available' check (status in ('Available', 'OnLeave', 'Unavailable')),
  shift jsonb default '{"start": "09:00", "end": "18:00"}'::jsonb,
  certifications jsonb default '[]'::jsonb,
  avatar text,
  created_at timestamptz default now()
);

-- 2. PROJECTS TABLE
create table if not exists public.projects (
  id text primary key,
  name text not null,
  client_id text,
  client_name text,
  client_tier text default 'Tier-1',
  sla_target_pct numeric default 98,
  health text default 'Healthy' check (health in ('Healthy', 'AtRisk', 'Critical')),
  region text,
  created_at timestamptz default now()
);

-- 3. TASKS TABLE
create table if not exists public.tasks (
  id text primary key,
  code text not null,
  name text not null,
  project_id text references public.projects(id) on delete set null,
  priority text default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Critical')),
  business_impact_score numeric default 75,
  required_skills jsonb default '[]'::jsonb,
  estimated_effort_min numeric default 120,
  remaining_effort_min numeric default 120,
  sla_deadline timestamptz not null,
  dependency_ids jsonb default '[]'::jsonb,
  assigned_employee_id text references public.employees(id) on delete set null,
  status text default 'Ready' check (status in ('Backlog', 'Ready', 'Assigned', 'InProgress', 'Blocked', 'AtRisk', 'Escalated', 'Completed')),
  created_at timestamptz default now()
);

-- 4. AUDIT LOGS TABLE
create table if not exists public.audit_logs (
  id text primary key,
  timestamp timestamptz default now(),
  actor text not null,
  event_type text not null,
  before text,
  after text,
  reason text,
  approval_outcome text
);

-- 5. RECOMMENDATIONS TABLE
create table if not exists public.recommendations (
  id text primary key,
  task_id text references public.tasks(id) on delete cascade,
  source_employee_id text,
  target_employee_id text,
  score numeric default 90,
  confidence numeric default 0.9,
  status text default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  reasoning_factors jsonb default '{}'::jsonb,
  sla_recovery_min numeric default 0,
  created_at timestamptz default now()
);

-- 6. ALLOCATION WEIGHTS TABLE
create table if not exists public.allocation_weights (
  id text primary key default 'default_weights',
  skill numeric default 30,
  sla numeric default 25,
  availability numeric default 20,
  workload numeric default 15,
  performance numeric default 10,
  updated_at timestamptz default now()
);

-- 7. ENABLE ROW LEVEL SECURITY (RLS) & ALLOW PUBLIC ACCESS FOR DEMO
alter table public.employees enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.audit_logs enable row level security;
alter table public.recommendations enable row level security;
alter table public.allocation_weights enable row level security;

-- Create open policies for anonymous client access
create policy "Allow anon all on employees" on public.employees for all to anon, authenticated using (true) with check (true);
create policy "Allow anon all on projects" on public.projects for all to anon, authenticated using (true) with check (true);
create policy "Allow anon all on tasks" on public.tasks for all to anon, authenticated using (true) with check (true);
create policy "Allow anon all on audit_logs" on public.audit_logs for all to anon, authenticated using (true) with check (true);
create policy "Allow anon all on recommendations" on public.recommendations for all to anon, authenticated using (true) with check (true);
create policy "Allow anon all on allocation_weights" on public.allocation_weights for all to anon, authenticated using (true) with check (true);

-- 8. ENABLE REALTIME REPLICATION (CRITICAL FOR LIVE SUB/PUB)
alter table public.employees replica identity full;
alter table public.projects replica identity full;
alter table public.tasks replica identity full;
alter table public.audit_logs replica identity full;
alter table public.recommendations replica identity full;
alter table public.allocation_weights replica identity full;

-- Add tables to the supabase_realtime publication
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table 
    public.employees, 
    public.projects, 
    public.tasks, 
    public.audit_logs, 
    public.recommendations, 
    public.allocation_weights;
commit;
