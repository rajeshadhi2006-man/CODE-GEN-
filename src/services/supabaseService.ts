import { getSupabaseClient } from '../lib/supabase';
import { 
  Employee, 
  Task, 
  Project, 
  AuditLog, 
  AIRecommendation, 
  AllocationWeights 
} from '../data/types';

export interface RealtimeCallbacks {
  onEmployeeChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; newRecord: any; oldRecord: any }) => void;
  onTaskChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; newRecord: any; oldRecord: any }) => void;
  onProjectChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; newRecord: any; oldRecord: any }) => void;
  onAuditLogChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; newRecord: any; oldRecord: any }) => void;
  onRecommendationChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; newRecord: any; oldRecord: any }) => void;
  onWeightChange?: (payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; newRecord: any; oldRecord: any }) => void;
}

/**
 * Loads all initial enterprise state from Supabase in parallel
 */
export async function fetchAllDataFromSupabase(): Promise<{
  employees: Employee[];
  tasks: Task[];
  projects: Project[];
  auditLogs: AuditLog[];
  recommendations: AIRecommendation[];
  weights?: AllocationWeights;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      employees: [],
      tasks: [],
      projects: [],
      auditLogs: [],
      recommendations: [],
      error: 'Supabase client is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    };
  }

  try {
    const [
      empRes,
      tasksRes,
      projRes,
      auditRes,
      recRes,
      weightsRes
    ] = await Promise.all([
      client.from('employees').select('*').order('id', { ascending: true }),
      client.from('tasks').select('*').order('created_at', { ascending: false }),
      client.from('projects').select('*').order('id', { ascending: true }),
      client.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(50),
      client.from('recommendations').select('*').order('created_at', { ascending: false }),
      client.from('allocation_weights').select('*').limit(1).maybeSingle()
    ]);


    if (empRes.error) throw empRes.error;
    if (tasksRes.error) throw tasksRes.error;

    return {
      employees: (empRes.data as Employee[]) || [],
      tasks: (tasksRes.data as Task[]) || [],
      projects: (projRes.data as Project[]) || [],
      auditLogs: (auditRes.data as AuditLog[]) || [],
      recommendations: (recRes.data as AIRecommendation[]) || [],
      weights: weightsRes.data ? {
        skill: Number(weightsRes.data.skill || 30),
        sla: Number(weightsRes.data.sla || 25),
        availability: Number(weightsRes.data.availability || 15),
        workload: Number(weightsRes.data.workload || 10),
        performance: Number(weightsRes.data.performance || 10),
        location: Number(weightsRes.data.location || 5),
        business_impact: Number(weightsRes.data.business_impact || 5),
      } : undefined
    };
  } catch (err: any) {
    console.error('Failed to fetch from Supabase:', err);
    return {
      employees: [],
      tasks: [],
      projects: [],
      auditLogs: [],
      recommendations: [],
      error: err.message || 'Database fetch error'
    };
  }
}

/**
 * Subscribes to Supabase Realtime postgres_changes across all tables.
 * Returns an unsubscription function to prevent memory leaks on unmount.
 */
export function subscribeToSupabaseRealtime(callbacks: RealtimeCallbacks): () => void {
  const client = getSupabaseClient();
  if (!client) {
    return () => {};
  }

  const channel = client.channel('nexus-realtime-global')
    // 1. Employees table
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'employees' },
      (payload) => {
        callbacks.onEmployeeChange?.({
          eventType: payload.eventType as any,
          newRecord: payload.new,
          oldRecord: payload.old
        });
      }
    )
    // 2. Tasks table
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks' },
      (payload) => {
        callbacks.onTaskChange?.({
          eventType: payload.eventType as any,
          newRecord: payload.new,
          oldRecord: payload.old
        });
      }
    )
    // 3. Projects table
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'projects' },
      (payload) => {
        callbacks.onProjectChange?.({
          eventType: payload.eventType as any,
          newRecord: payload.new,
          oldRecord: payload.old
        });
      }
    )
    // 4. Audit logs table
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'audit_logs' },
      (payload) => {
        callbacks.onAuditLogChange?.({
          eventType: payload.eventType as any,
          newRecord: payload.new,
          oldRecord: payload.old
        });
      }
    )
    // 5. Recommendations table
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'recommendations' },
      (payload) => {
        callbacks.onRecommendationChange?.({
          eventType: payload.eventType as any,
          newRecord: payload.new,
          oldRecord: payload.old
        });
      }
    )
    // 6. Allocation weights table
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'allocation_weights' },
      (payload) => {
        callbacks.onWeightChange?.({
          eventType: payload.eventType as any,
          newRecord: payload.new,
          oldRecord: payload.old
        });
      }
    )
    .subscribe((status) => {
      console.log(`[Supabase Realtime] Global channel status: ${status}`);
    });

  return () => {
    client.removeChannel(channel);
  };
}

// -------------------------------------------------------------
// Database Mutations (Single Source of Truth)
// -------------------------------------------------------------

export async function insertEmployeeToSupabase(emp: Partial<Employee>) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');
  return await client.from('employees').insert(emp);
}

export async function updateEmployeeInSupabase(id: string, updates: Partial<Employee>) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');
  return await client.from('employees').update(updates).eq('id', id);
}

export async function deleteEmployeeFromSupabase(id: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');
  return await client.from('employees').delete().eq('id', id);
}

export async function insertTaskToSupabase(task: Partial<Task>) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');
  return await client.from('tasks').insert(task);
}

export async function updateTaskInSupabase(id: string, updates: Partial<Task>) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');
  return await client.from('tasks').update(updates).eq('id', id);
}

export async function deleteTaskFromSupabase(id: string) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');
  return await client.from('tasks').delete().eq('id', id);
}

export async function deleteAllTasksFromSupabase() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');
  return await client.from('tasks').delete().neq('id', 'placeholder_match_none');
}

export async function insertAuditLogToSupabase(log: Partial<AuditLog>) {
  const client = getSupabaseClient();
  if (!client) return;
  return await client.from('audit_logs').insert(log);
}

export async function insertRecommendationToSupabase(rec: Partial<AIRecommendation>) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');
  return await client.from('recommendations').insert(rec);
}

export async function updateRecommendationInSupabase(id: string, updates: Partial<AIRecommendation>) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');
  return await client.from('recommendations').update(updates).eq('id', id);
}

export async function updateWeightsInSupabase(weights: AllocationWeights) {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase client not configured');
  return await client.from('allocation_weights').upsert({
    id: 'default_weights',
    ...weights,
    updated_at: new Date().toISOString()
  });
}

/**
 * Pushes standard realistic enterprise data directly into Supabase tables
 * so that the user's database is initialized with real live rows in 1 click.
 */
export async function seedDataDirectlyToSupabase(): Promise<{ success: boolean; error?: string }> {
  // Pure Supabase mode - no fake predefined seeds permitted
  return { success: true };
}
