import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Task, Project, AIRecommendation, AuditLog, TaskStatus } from '../types/database';

export interface UserMetrics {
  totalAssigned: number;
  inProgress: number;
  completed: number;
  blocked: number;
  atRisk: number;
  totalRemainingEffortMin: number;
  effectiveUtilizationPct: number;
  slaBreachRiskCount: number;
}

interface UserStoreContextType {
  tasks: Task[];
  projects: Record<string, Project>;
  recommendations: AIRecommendation[];
  auditLogs: AuditLog[];
  metrics: UserMetrics;
  isLoading: boolean;
  isRealtimeConnected: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus, remainingMin?: number) => Promise<{ success: boolean; error?: string }>;
  requestReallocation: (taskId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
}

const UserStoreContext = createContext<UserStoreContextType | undefined>(undefined);

export const UserStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { employeeProfile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const employeeId = employeeProfile?.id;
  const employeeName = employeeProfile?.name;

  // 1. Fetch user-specific data from Supabase
  const fetchData = useCallback(async () => {
    if (!employeeId) {
      setTasks([]);
      setProjects({});
      setRecommendations([]);
      setAuditLogs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1a. Fetch Tasks assigned to this employee
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_employee_id', employeeId)
        .order('sla_deadline', { ascending: true });

      if (tasksError) throw tasksError;
      const loadedTasks: Task[] = tasksData || [];
      setTasks(loadedTasks);

      // 1b. Fetch associated Projects
      const projectIds = Array.from(new Set(loadedTasks.map((t) => t.project_id).filter(Boolean))) as string[];
      if (projectIds.length > 0) {
        const { data: projData, error: projError } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds);

        if (!projError && projData) {
          const map: Record<string, Project> = {};
          projData.forEach((p) => {
            map[p.id] = p;
          });
          setProjects(map);
        }
      } else {
        setProjects({});
      }

      // 1c. Fetch Recommendations concerning this employee
      const { data: recData, error: recError } = await supabase
        .from('recommendations')
        .select('*')
        .or(`target_employee_id.eq.${employeeId},source_employee_id.eq.${employeeId}`)
        .order('created_at', { ascending: false });

      if (!recError && recData) {
        setRecommendations(recData as AIRecommendation[]);
      }

      // 1d. Fetch Audit Logs involving this employee
      const searchTerms = [employeeId];
      if (employeeName) searchTerms.push(employeeName);

      const { data: auditData, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(30);

      if (!auditError && auditData) {
        // Filter audit logs relevant to the user
        const userAudits = (auditData as AuditLog[]).filter(log => 
          log.actor === employeeName || 
          log.actor === employeeId ||
          (log.before && log.before.includes(employeeId)) ||
          (log.after && log.after.includes(employeeId)) ||
          (employeeName && ((log.before && log.before.includes(employeeName)) || (log.after && log.after.includes(employeeName))))
        );
        setAuditLogs(userAudits);
      }
    } catch (err: any) {
      console.error('Failed to fetch user data from Supabase:', err);
      setError(err.message || 'Error communicating with Supabase');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId, employeeName]);

  // Initial fetch when employee ID changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Realtime Subscriptions
  useEffect(() => {
    if (!employeeId) {
      setIsRealtimeConnected(false);
      return;
    }

    let isMounted = true;
    let retryTimer: any = null;

    // Clean up any stale channel before creating new subscription
    const channelName = `nexus-user-${employeeId}`;
    const existing = supabase.getChannels().find((c) => c.topic === `realtime:${channelName}`);
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase.channel(channelName);

    channel
      // A. Listen to Tasks changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('[Realtime] Tasks payload:', payload.eventType, payload);
          const eventType = payload.eventType;
          const newRecord = payload.new as Task;
          const oldRecord = payload.old as Task;

          setTasks((currentTasks) => {
            if (eventType === 'INSERT') {
              if (newRecord.assigned_employee_id === employeeId) {
                return [newRecord, ...currentTasks.filter((t) => t.id !== newRecord.id)];
              }
              return currentTasks;
            }

            if (eventType === 'UPDATE') {
              if (newRecord.assigned_employee_id === employeeId) {
                const exists = currentTasks.some((t) => t.id === newRecord.id);
                if (exists) {
                  return currentTasks.map((t) => (t.id === newRecord.id ? newRecord : t));
                }
                return [newRecord, ...currentTasks];
              } else {
                return currentTasks.filter((t) => t.id !== newRecord.id);
              }
            }

            if (eventType === 'DELETE') {
              return currentTasks.filter((t) => t.id !== oldRecord.id);
            }

            return currentTasks;
          });

          // Fetch associated project details if newly introduced
          if (newRecord?.project_id) {
            setProjects((prev) => {
              if (!prev[newRecord.project_id!]) {
                fetchData();
              }
              return prev;
            });
          }
        }
      )
      // B. Listen to Recommendations changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recommendations' },
        (payload) => {
          console.log('[Realtime] Recommendation payload:', payload.eventType);
          const eventType = payload.eventType;
          const newRec = payload.new as AIRecommendation;
          const oldRec = payload.old as AIRecommendation;

          if (
            newRec.target_employee_id === employeeId ||
            newRec.source_employee_id === employeeId
          ) {
            setRecommendations((current) => {
              if (eventType === 'INSERT') {
                return [newRec, ...current.filter((r) => r.id !== newRec.id)];
              }
              if (eventType === 'UPDATE') {
                return current.map((r) => (r.id === newRec.id ? newRec : r));
              }
              if (eventType === 'DELETE') {
                return current.filter((r) => r.id !== oldRec.id);
              }
              return current;
            });
          }
        }
      )
      // C. Listen to Audit Logs changes
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload) => {
          console.log('[Realtime] Audit log payload:', payload);
          const newLog = payload.new as AuditLog;
          const isRelevant = 
            newLog.actor === employeeName || 
            newLog.actor === employeeId ||
            (newLog.before && newLog.before.includes(employeeId)) ||
            (newLog.after && newLog.after.includes(employeeId));

          if (isRelevant) {
            setAuditLogs((current) => [newLog, ...current]);
          }
        }
      )
      // D. Listen to Employee profile changes in real time
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        (payload) => {
          if ((payload.new as any)?.id === employeeId) {
            console.log('[Realtime] Employee profile updated live:', payload);
            fetchData();
          }
        }
      );

    const initSubscription = () => {
      channel.subscribe((status, err) => {
        console.log(`[Supabase Realtime] ${channelName} status:`, status, err || '');
        if (!isMounted) return;

        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setIsRealtimeConnected(false);
          // Graceful retry
          if (isMounted) {
            clearTimeout(retryTimer);
            retryTimer = setTimeout(() => {
              if (isMounted) {
                console.log('[Realtime] Attempting reconnection...');
                initSubscription();
              }
            }, 3000);
          }
        }
      });
    };

    initSubscription();

    return () => {
      isMounted = false;
      clearTimeout(retryTimer);
      supabase.removeChannel(channel);
      setIsRealtimeConnected(false);
    };
  }, [employeeId, employeeName, fetchData]);



  // 3. Dynamic Metrics Computation strictly from Supabase Task data
  const metrics: UserMetrics = useMemo(() => {
    const totalAssigned = tasks.length;
    const inProgress = tasks.filter((t) => t.status === 'InProgress').length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const blocked = tasks.filter((t) => t.status === 'Blocked').length;
    const atRisk = tasks.filter((t) => t.status === 'AtRisk').length;

    // Active tasks remaining effort
    const activeTasks = tasks.filter((t) => t.status !== 'Completed');
    const totalRemainingEffortMin = activeTasks.reduce((sum, t) => sum + (Number(t.remaining_effort_min) || 0), 0);

    // Calculate utilization percentage based on user's weekly capacity
    const capacityHours = Number(employeeProfile?.capacity_hours) || 40;
    const capacityMin = capacityHours * 60;
    const effectiveUtilizationPct = capacityMin > 0 
      ? Math.min(100, Math.round((totalRemainingEffortMin / capacityMin) * 100))
      : 0;

    // SLA risk count: active tasks where deadline is less than 60 minutes away or remaining effort exceeds time left
    const now = Date.now();
    const slaBreachRiskCount = activeTasks.filter((t) => {
      const deadline = new Date(t.sla_deadline).getTime();
      const diffMin = (deadline - now) / 60000;
      return diffMin <= 60 || diffMin < (t.remaining_effort_min || 0);
    }).length;

    return {
      totalAssigned,
      inProgress,
      completed,
      blocked,
      atRisk,
      totalRemainingEffortMin,
      effectiveUtilizationPct,
      slaBreachRiskCount
    };
  }, [tasks, employeeProfile]);

  // 4. Update task status in Supabase
  const updateTaskStatus = async (
    taskId: string, 
    newStatus: TaskStatus, 
    remainingMin?: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const currentTask = tasks.find((t) => t.id === taskId);
      const updates: Partial<Task> = { status: newStatus };
      if (remainingMin !== undefined) {
        updates.remaining_effort_min = remainingMin;
      } else if (newStatus === 'Completed') {
        updates.remaining_effort_min = 0;
      }

      // Optimistic update
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));

      const { error: updateErr } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

      if (updateErr) throw updateErr;

      // Log action to audit_logs
      await supabase.from('audit_logs').insert({
        id: `audit-${Date.now()}`,
        actor: employeeName || employeeId || 'Employee',
        event_type: 'TASK_STATUS_UPDATE',
        before: currentTask ? `Status: ${currentTask.status}, Remaining: ${currentTask.remaining_effort_min}m` : 'Unknown',
        after: `Status: ${newStatus}, Remaining: ${updates.remaining_effort_min ?? currentTask?.remaining_effort_min}m`,
        reason: `Employee updated status to ${newStatus}`,
        approval_outcome: 'AUTO_APPROVED'
      });

      return { success: true };
    } catch (err: any) {
      console.error('Failed to update task status in Supabase:', err);
      // Revert with fetch
      fetchData();
      return { success: false, error: err.message || 'Update failed' };
    }
  };

  // 5. Request reallocation / flag task
  const requestReallocation = async (taskId: string, reason: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return { success: false, error: 'Task not found' };

      // Mark task as Blocked or AtRisk in Supabase
      const { error: taskErr } = await supabase
        .from('tasks')
        .update({ status: 'Blocked' })
        .eq('id', taskId);

      if (taskErr) throw taskErr;

      // Create recommendation/request row
      await supabase.from('recommendations').insert({
        id: `rec-${Date.now()}`,
        task_id: taskId,
        source_employee_id: employeeId,
        score: 75,
        confidence: 0.85,
        status: 'Pending',
        reasoning_factors: { user_reported_impediment: reason },
        sla_recovery_min: 60
      });

      // Insert audit log
      await supabase.from('audit_logs').insert({
        id: `audit-${Date.now()}`,
        actor: employeeName || employeeId || 'Employee',
        event_type: 'MANUAL_OVERRIDE',
        before: `Assigned to ${employeeName || employeeId}`,
        after: 'Reallocation Requested / Blocked',
        reason: reason,
        approval_outcome: 'MANAGER_APPROVED'
      });

      // Update local task
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'Blocked' } : t)));

      return { success: true };
    } catch (err: any) {
      console.error('Failed to request reallocation in Supabase:', err);
      return { success: false, error: err.message || 'Request failed' };
    }
  };

  return (
    <UserStoreContext.Provider
      value={{
        tasks,
        projects,
        recommendations,
        auditLogs,
        metrics,
        isLoading,
        isRealtimeConnected,
        error,
        refreshData: fetchData,
        updateTaskStatus,
        requestReallocation
      }}
    >
      {children}
    </UserStoreContext.Provider>
  );
};

export const useUserStore = () => {
  const context = useContext(UserStoreContext);
  if (!context) {
    throw new Error('useUserStore must be used within a UserStoreProvider');
  }
  return context;
};
