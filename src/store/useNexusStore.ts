import { create } from 'zustand';
import { 
  Employee, 
  Task, 
  Project, 
  AuditLog, 
  NotificationItem, 
  AIRecommendation, 
  AllocationWeights, 
  User, 
  UserRole,
  MetricSnapshot
} from '../data/types';
import { DEFAULT_WEIGHTS, findBestSkillMatch } from '../engine/scoring';
import { calculateSLARisk } from '../engine/sla';
import { createReallocationRecommendation } from '../engine/reallocation';
import { realtimeBus } from './realtimeBus';
import { isSupabaseConfigured } from '../lib/supabase';
import { 
  fetchAllDataFromSupabase, 
  subscribeToSupabaseRealtime,
  insertEmployeeToSupabase,
  updateEmployeeInSupabase,
  deleteEmployeeFromSupabase,
  insertTaskToSupabase,
  updateTaskInSupabase,
  deleteTaskFromSupabase,
  deleteAllTasksFromSupabase,
  insertAuditLogToSupabase,
  updateRecommendationInSupabase,
  updateWeightsInSupabase
} from '../services/supabaseService';
import { 
  checkPythonHealth, 
  optimizeWithPython, 
  calculatePythonScore, 
  simulateDisruptionWithPython,
  sendAssignmentEmail
} from '../services/pythonApiService';

export interface MetricHistoryPoint {
  timestamp: number;
  workforce: number;
  utilization: number;
  sla: number;
  atRisk: number;
  critical: number;
  unassigned: number;
  headroom: number;
  recommendations: number;
}

export interface NexusState {
  // Real Enterprise Data from Supabase
  employees: Employee[];
  tasks: Task[];
  projects: Project[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  recommendations: AIRecommendation[];
  weights: AllocationWeights;
  currentUser: User;

  // Supabase Connection & Loading State
  isLoading: boolean;
  supabaseError: string | null;
  isSupabaseConnected: boolean;
  isSupabaseModalOpen: boolean;

  // Python FastAPI AI Backend State
  isPythonOnline: boolean;
  pythonVersion: string | null;
  checkPythonStatus: () => Promise<void>;

  // View & Filter State
  activeTab: string;
  selectedRegion: string;
  isAIOptimizing: boolean;
  selectedTaskIdForExplain: string | null;
  selectedRecommendationId: string | null;
  isCommandPaletteOpen: boolean;
  isNotificationsOpen: boolean;
  isRealTimeActive: boolean;
  isCreateTaskModalOpen: boolean;
  isCreateEmployeeModalOpen: boolean;

  // Spatial Workstation & Split View State
  isSplitView: boolean;
  secondaryTab: string;
  isDockPinned: boolean;
  isQuickHudOpen: boolean;

  // Real-time dynamic clock (ms timestamp updated every second)
  currentTimestamp: number;

  // Scripted Demo Mode (Section 9 Beat Sheet)
  demoStep: number;
  disruptedEmployeeId: string | null;

  // Real Computed metrics and rolling live history
  metrics: MetricSnapshot;
  metricHistory: MetricHistoryPoint[];

  // Actions
  setRole: (role: UserRole) => void;
  setActiveTab: (tab: string) => void;
  setSelectedRegion: (region: string) => void;
  setWeights: (weights: AllocationWeights) => Promise<void>;
  toggleRealTime: () => void;
  
  // Real-time CRUD actions against Supabase
  addEmployee: (emp: Partial<Employee>) => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<void>;
  assignTask: (taskId: string, employeeId: string, customNote?: string) => Promise<boolean>;
  resendTaskEmail: (taskId: string) => Promise<boolean>;
  deleteEmployee: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearAllTasks: () => Promise<void>;
  autoAssignAllUnassignedTasks: () => Promise<number>;
  clearAllData: () => Promise<void>;
  seedRealisticLiveBatch: () => Promise<void>;

  // Reallocation Actions
  triggerDisruption: (employeeId?: string) => Promise<void>;
  optimizeAll: () => Promise<void>;
  optimizeTask: (taskId: string) => Promise<void>;
  approveRecommendation: (recommendationId: string) => Promise<void>;
  rejectRecommendation: (recommendationId: string) => Promise<void>;
  
  // UI Actions
  openExplainModal: (taskId: string, recommendationId?: string) => void;
  closeExplainModal: () => void;
  toggleCommandPalette: (open?: boolean) => void;
  toggleNotifications: (open?: boolean) => void;
  toggleCreateTaskModal: (open?: boolean) => void;
  toggleCreateEmployeeModal: (open?: boolean) => void;
  toggleSupabaseModal: (open?: boolean) => void;
  toggleSplitView: () => void;
  setSecondaryTab: (tab: string) => void;
  toggleDockPinned: () => void;
  toggleQuickHud: (open?: boolean) => void;
  markNotificationsRead: () => void;

  // Supabase Lifecycle Sync
  initializeSupabaseSync: () => Promise<void>;
  teardownRealtime: () => void;

  // Live Real-Time Tick Engine
  tickRealTime: () => void;

  // Demo Beats
  advanceDemoBeat: () => void;
  resetToInitialSeed: () => Promise<void>;
}

/**
 * Computes metrics 100% dynamically from active data arrays - zero hardcoded values
 */
export function computeMetrics(tasks: Task[], employees: Employee[], nowMs: number = Date.now()): MetricSnapshot {
  const total = tasks.length;
  if (total === 0) {
    return {
      sla_compliance_pct: 0,
      average_utilization_pct: employees.length > 0 
        ? Number((employees.reduce((acc, e) => acc + e.utilization_pct, 0) / employees.length).toFixed(1))
        : 0,
      at_risk_tasks_count: 0,
      critical_tasks_count: 0,
      unassigned_count: 0,
      breach_predicted_count: 0
    };
  }

  let atRisk = 0;
  let critical = 0;
  let unassigned = 0;
  let breached = 0;

  for (const t of tasks) {
    if (!t.assigned_employee_id) unassigned++;
    if (t.priority === 'Critical') critical++;
    
    // Evaluate risk mathematically with live nowMs
    const emp = employees.find(e => e.id === t.assigned_employee_id) || null;
    const r = calculateSLARisk(t, emp, nowMs);
    if (r.risk_tier === 'Critical' || r.risk_tier === 'High' || t.status === 'AtRisk') {
      atRisk++;
    }
    if (r.risk_tier === 'Breached') {
      breached++;
    }
  }

  const compliantCount = Math.max(0, total - breached - Math.round(atRisk * 0.35));
  const slaCompliance = Number(((compliantCount / total) * 100).toFixed(1));

  const totalUtil = employees.reduce((acc, e) => acc + e.utilization_pct, 0);
  const avgUtil = employees.length > 0 
    ? Number((totalUtil / employees.length).toFixed(1)) 
    : 0;

  return {
    sla_compliance_pct: slaCompliance,
    average_utilization_pct: avgUtil,
    at_risk_tasks_count: atRisk,
    critical_tasks_count: critical,
    unassigned_count: unassigned,
    breach_predicted_count: breached
  };
}

function appendMetricHistory(
  metrics: MetricSnapshot,
  workforceCount: number,
  recCount: number,
  history: MetricHistoryPoint[] = [],
  now: number = Date.now()
): MetricHistoryPoint[] {
  const newPoint: MetricHistoryPoint = {
    timestamp: now,
    workforce: workforceCount,
    utilization: metrics.average_utilization_pct,
    sla: metrics.sla_compliance_pct,
    atRisk: metrics.at_risk_tasks_count,
    critical: metrics.critical_tasks_count,
    unassigned: metrics.unassigned_count,
    headroom: workforceCount > 0 ? Number((100 - metrics.average_utilization_pct).toFixed(1)) : 0,
    recommendations: recCount
  };
  return [...history, newPoint].slice(-15);
}

let activeRealtimeUnsub: (() => void) | null = null;

export const useNexusStore = create<NexusState>((set, get) => ({
  // ZERO HARDCODED PREDEFINED RECORDS: Starts clean from Supabase
  employees: [],
  tasks: [],
  projects: [],
  auditLogs: [],
  notifications: [],
  recommendations: [],
  weights: DEFAULT_WEIGHTS,
  currentUser: {
    id: 'user-admin',
    name: 'Executive Controller',
    role: 'Super Admin',
    email: 'admin@nexus.corp',
    org_id: 'org-global',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  },

  // Connection & loading state
  isLoading: true,
  supabaseError: null,
  isSupabaseConnected: false,
  isSupabaseModalOpen: false,

  isPythonOnline: false,
  pythonVersion: null,

  checkPythonStatus: async () => {
    const res = await checkPythonHealth();
    set({
      isPythonOnline: res.online,
      pythonVersion: res.data?.python_version || null
    });
  },

  activeTab: 'command-center',
  selectedRegion: 'All',
  isAIOptimizing: false,
  selectedTaskIdForExplain: null,
  selectedRecommendationId: null,
  isCommandPaletteOpen: false,
  isNotificationsOpen: false,
  isRealTimeActive: true,
  isCreateTaskModalOpen: false,
  isCreateEmployeeModalOpen: false,
  isSplitView: false,
  secondaryTab: 'live-allocation',
  isDockPinned: true,
  isQuickHudOpen: false,
  currentTimestamp: Date.now(),

  demoStep: 0,
  disruptedEmployeeId: null,
  metrics: {
    sla_compliance_pct: 0,
    average_utilization_pct: 0,
    at_risk_tasks_count: 0,
    critical_tasks_count: 0,
    unassigned_count: 0,
    breach_predicted_count: 0
  },
  metricHistory: [],

  toggleSupabaseModal: (open?: boolean) => {
    set(state => ({ isSupabaseModalOpen: open !== undefined ? open : !state.isSupabaseModalOpen }));
  },

  setRole: (role: UserRole) => {
    set(state => ({
      currentUser: { ...state.currentUser, role }
    }));
  },

  setActiveTab: (tab: string) => {
    set({ activeTab: tab });
  },

  setSelectedRegion: (region: string) => {
    set({ selectedRegion: region });
  },

  toggleRealTime: () => {
    set(state => ({ isRealTimeActive: !state.isRealTimeActive }));
  },

  toggleCreateTaskModal: (open?: boolean) => {
    set(state => ({ isCreateTaskModalOpen: open !== undefined ? open : !state.isCreateTaskModalOpen }));
  },

  toggleCreateEmployeeModal: (open?: boolean) => {
    set(state => ({ isCreateEmployeeModalOpen: open !== undefined ? open : !state.isCreateEmployeeModalOpen }));
  },

  toggleSplitView: () => {
    set(state => {
      const nextSplit = !state.isSplitView;
      // If turning on split view and secondary is same as primary, pick a complementary tab
      let nextSecondary = state.secondaryTab;
      if (nextSplit && nextSecondary === state.activeTab) {
        nextSecondary = state.activeTab === 'sla-risk' ? 'live-allocation' : 'sla-risk';
      }
      return { isSplitView: nextSplit, secondaryTab: nextSecondary };
    });
  },

  setSecondaryTab: (tab: string) => {
    set({ secondaryTab: tab });
  },

  toggleDockPinned: () => {
    set(state => ({ isDockPinned: !state.isDockPinned }));
  },

  toggleQuickHud: (open?: boolean) => {
    set(state => ({ isQuickHudOpen: open !== undefined ? open : !state.isQuickHudOpen }));
  },

  // --------------------------------------------------------------------------
  // Supabase Realtime Initialization & Lifecycle
  // --------------------------------------------------------------------------

  initializeSupabaseSync: async () => {
    set({ isLoading: true, supabaseError: null });

    const configured = isSupabaseConfigured();
    if (!configured) {
      set({
        isLoading: false,
        isSupabaseConnected: false,
        supabaseError: 'Supabase credentials not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
      });
      return;
    }

    try {
      const result = await fetchAllDataFromSupabase();
      if (result.error) {
        set({
          isLoading: false,
          isSupabaseConnected: false,
          supabaseError: result.error
        });
        return;
      }

      const initialMetrics = computeMetrics(result.tasks, result.employees);
      const initialHistory = appendMetricHistory(
        initialMetrics, 
        result.employees.length, 
        result.recommendations.length, 
        []
      );

      set({
        employees: result.employees,
        tasks: result.tasks,
        projects: result.projects,
        auditLogs: result.auditLogs,
        recommendations: result.recommendations,
        weights: result.weights || get().weights,
        metrics: initialMetrics,
        metricHistory: initialHistory,
        isLoading: false,
        isSupabaseConnected: true,
        supabaseError: null
      });

      // Tear down existing realtime channel if any
      if (activeRealtimeUnsub) {
        activeRealtimeUnsub();
        activeRealtimeUnsub = null;
      }

      // Establish Supabase Realtime pub-sub channel
      activeRealtimeUnsub = subscribeToSupabaseRealtime({
        onEmployeeChange: ({ eventType, newRecord, oldRecord }) => {
          const { employees, tasks } = get();
          let updatedEmps = employees;

          if (eventType === 'INSERT') {
            const normalized: Employee = {
              ...newRecord,
              current_tasks: Array.isArray(newRecord.current_tasks) ? newRecord.current_tasks : [],
              skills: Array.isArray(newRecord.skills) ? newRecord.skills : [],
              capacity_hours: Number(newRecord.capacity_hours) || 40,
              utilization_pct: Number(newRecord.utilization_pct) || 0
            };
            updatedEmps = [normalized, ...employees.filter(e => e.id !== newRecord.id)];
          } else if (eventType === 'UPDATE') {
            updatedEmps = employees.map(e => e.id === newRecord.id ? {
              ...e,
              ...newRecord,
              current_tasks: Array.isArray(newRecord.current_tasks) ? newRecord.current_tasks : (Array.isArray(e.current_tasks) ? e.current_tasks : []),
              skills: Array.isArray(newRecord.skills) ? newRecord.skills : (Array.isArray(e.skills) ? e.skills : [])
            } : e);
          } else if (eventType === 'DELETE') {
            updatedEmps = employees.filter(e => e.id !== oldRecord.id);
          }

          const m = computeMetrics(tasks, updatedEmps);
          const h = appendMetricHistory(m, updatedEmps.length, get().recommendations.length, get().metricHistory);
          set({ employees: updatedEmps, metrics: m, metricHistory: h });
        },

        onTaskChange: ({ eventType, newRecord, oldRecord }) => {
          const { tasks, employees } = get();
          let updatedTasks = tasks;

          if (eventType === 'INSERT') {
            updatedTasks = [newRecord, ...tasks.filter(t => t.id !== newRecord.id)];
            if (newRecord?.assigned_employee_id) {
              const assignedEmp = employees.find(e => e.id === newRecord.assigned_employee_id);
              if (assignedEmp) {
                sendAssignmentEmail(newRecord, assignedEmp, undefined, 'Real-time System Task Insertion').then(record => {
                  if (record) {
                    realtimeBus.publish('NOTIFICATION_RECEIVED', {
                      message: `📧 Direct dispatch email sent to ${assignedEmp.name} (${record.recipient_email}) via SMTP.`
                    });
                  }
                }).catch(err => console.warn('Email dispatch on insert notice:', err));
              }
            }
          } else if (eventType === 'UPDATE') {
            updatedTasks = tasks.map(t => t.id === newRecord.id ? newRecord : t);
            if (newRecord?.assigned_employee_id && newRecord.assigned_employee_id !== oldRecord?.assigned_employee_id) {
              const assignedEmp = employees.find(e => e.id === newRecord.assigned_employee_id);
              if (assignedEmp) {
                sendAssignmentEmail(newRecord, assignedEmp, undefined, 'Real-time Task Allocation Sync').then(record => {
                  if (record) {
                    realtimeBus.publish('NOTIFICATION_RECEIVED', {
                      message: `📧 Direct dispatch email sent to ${assignedEmp.name} (${record.recipient_email}) via SMTP.`
                    });
                  }
                }).catch(err => console.warn('Email dispatch on update notice:', err));
              }
            }
          } else if (eventType === 'DELETE') {
            updatedTasks = tasks.filter(t => t.id !== oldRecord.id);
          }

          const m = computeMetrics(updatedTasks, employees);
          const h = appendMetricHistory(m, employees.length, get().recommendations.length, get().metricHistory);
          set({ tasks: updatedTasks, metrics: m, metricHistory: h });
        },

        onProjectChange: ({ eventType, newRecord, oldRecord }) => {
          const { projects } = get();
          if (eventType === 'INSERT') {
            set({ projects: [newRecord, ...projects.filter(p => p.id !== newRecord.id)] });
          } else if (eventType === 'UPDATE') {
            set({ projects: projects.map(p => p.id === newRecord.id ? newRecord : p) });
          } else if (eventType === 'DELETE') {
            set({ projects: projects.filter(p => p.id !== oldRecord.id) });
          }
        },

        onAuditLogChange: ({ eventType, newRecord }) => {
          if (eventType === 'INSERT') {
            set(state => ({ auditLogs: [newRecord, ...state.auditLogs].slice(0, 100) }));
          }
        },

        onRecommendationChange: ({ eventType, newRecord, oldRecord }) => {
          const { recommendations } = get();
          if (eventType === 'INSERT') {
            set({ recommendations: [newRecord, ...recommendations.filter(r => r.id !== newRecord.id)] });
          } else if (eventType === 'UPDATE') {
            set({ recommendations: recommendations.map(r => r.id === newRecord.id ? newRecord : r) });
          } else if (eventType === 'DELETE') {
            set({ recommendations: recommendations.filter(r => r.id !== oldRecord.id) });
          }
        },

        onWeightChange: ({ newRecord }) => {
          if (newRecord) {
            set({
              weights: {
                skill: Number(newRecord.skill || 30),
                sla: Number(newRecord.sla || 25),
                availability: Number(newRecord.availability || 15),
                workload: Number(newRecord.workload || 10),
                performance: Number(newRecord.performance || 10),
                location: Number(newRecord.location || 5),
                business_impact: Number(newRecord.business_impact || 5)
              }
            });
          }
        }
      });
    } catch (err: any) {
      set({
        isLoading: false,
        isSupabaseConnected: false,
        supabaseError: err.message || 'Initialization failed'
      });
    }
  },

  teardownRealtime: () => {
    if (activeRealtimeUnsub) {
      activeRealtimeUnsub();
      activeRealtimeUnsub = null;
    }
  },

  // --------------------------------------------------------------------------
  // Real-Time CRUD Mutations (Supabase Single Source of Truth)
  // --------------------------------------------------------------------------

  setWeights: async (weights: AllocationWeights) => {
    set({ weights });
    const audit: AuditLog = {
      id: `audit-weight-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: get().currentUser.name,
      event_type: 'POLICY_CHANGE',
      before: 'Default allocation scoring weights',
      after: `Skill:${weights.skill}% SLA:${weights.sla}% Avail:${weights.availability}% Workload:${weights.workload}% Perf:${weights.performance}%`,
      reason: 'Admin Control Center scoring policy reconfiguration',
      approval_outcome: 'AUTO_APPROVED'
    };
    set(state => ({ auditLogs: [audit, ...state.auditLogs] }));

    try {
      await updateWeightsInSupabase(weights);
      await insertAuditLogToSupabase(audit);
    } catch (err) {
      console.warn('Supabase weight update notice:', err);
    }
  },

  addEmployee: async (empData: Partial<Employee>) => {
    const { employees, tasks } = get();
    const newId = empData.id || `E-${(employees.length + 1).toString().padStart(3, '0')}`;
    const newEmp: Employee = {
      id: newId,
      name: empData.name || 'New Engineer',
      title: empData.title || 'Platform Engineer',
      email: empData.email || `${(empData.name || 'engineer').toLowerCase().replace(/\s+/g, '.')}@nexus.corp`,
      location: empData.location || 'Singapore Hub',
      region: (empData.region as any) || 'APAC',
      timezone: empData.timezone || 'UTC+8',
      skills: empData.skills || [{ skill_id: 'sk-aws', proficiency_pct: 85 }],
      performance: empData.performance || { quality: 90, on_time: 95, tasks_completed_30d: 0 },
      capacity_hours: empData.capacity_hours || 40,
      utilization_pct: empData.utilization_pct || 50,
      status: empData.status || 'Available',
      current_tasks: [],
      shift: empData.shift || { start: '09:00', end: '18:00' },
      certifications: empData.certifications || ['Certified Cloud Specialist'],
      avatar: empData.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`
    };

    // Optimistic local state update
    const updated = [newEmp, ...employees];
    const newMetrics = computeMetrics(tasks, updated);
    const updatedHistory = appendMetricHistory(newMetrics, updated.length, get().recommendations.length, get().metricHistory);
    set({ employees: updated, metrics: newMetrics, metricHistory: updatedHistory });

    realtimeBus.publish('NOTIFICATION_RECEIVED', {
      message: `Engineer ${newEmp.name} (${newEmp.id}) added to ${newEmp.region} team.`
    });

    try {
      await insertEmployeeToSupabase(newEmp);
    } catch (err) {
      console.warn('Supabase employee insert notice:', err);
    }
  },

  addTask: async (taskData: Partial<Task>) => {
    const { tasks, employees } = get();
    const validProjectId = taskData.project_id || get().projects[0]?.id || 'proj-nexus-core';
    const newCode = taskData.code || `WO-${Math.floor(100 + Math.random() * 900)}`;
    const newId = taskData.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTask: Task = {
      id: newId,
      code: newCode,
      name: taskData.name || 'Urgent Cloud Work Order',
      project_id: validProjectId,
      priority: taskData.priority || 'High',
      business_impact_score: taskData.business_impact_score || 85,
      required_skills: taskData.required_skills || [{ skill_id: 'sk-aws', min_proficiency: 75 }],
      estimated_effort_min: taskData.estimated_effort_min || 120,
      remaining_effort_min: taskData.remaining_effort_min || 120,
      sla_deadline: taskData.sla_deadline || new Date(Date.now() + 180 * 60 * 1000).toISOString(),
      dependency_ids: taskData.dependency_ids || [],
      assigned_employee_id: taskData.assigned_employee_id || null,
      status: taskData.assigned_employee_id ? 'InProgress' : 'Ready',
      created_at: new Date().toISOString()
    };

    // Autonomous AI Skill Matching Engine: automatically match to top qualified specialist
    let assignedEmpId = taskData.assigned_employee_id || null;
    let matchExplanation = '';
    let autoMatchedEmp: Employee | null = null;

    if (!assignedEmpId && employees.length > 0) {
      const matchResult = findBestSkillMatch(newTask, employees);
      if (matchResult) {
        assignedEmpId = matchResult.employee.id;
        autoMatchedEmp = matchResult.employee;
        matchExplanation = matchResult.reason;
      }
    }

    newTask.assigned_employee_id = assignedEmpId;
    newTask.status = assignedEmpId ? 'InProgress' : 'Ready';

    // Update assigned employee workload and capacity
    let updatedEmployees = employees;
    if (assignedEmpId) {
      const effortHours = (newTask.remaining_effort_min || 60) / 60;
      updatedEmployees = employees.map(e => {
        if (e.id === assignedEmpId) {
          const prevTasks = Array.isArray(e.current_tasks) ? e.current_tasks : [];
          const cur = prevTasks.includes(newTask.id) ? prevTasks : [...prevTasks, newTask.id];
          const capHours = Number(e.capacity_hours) || 40;
          const addUtil = Math.round((effortHours / Math.max(1, capHours)) * 100);
          return {
            ...e,
            current_tasks: cur,
            utilization_pct: Math.min(100, (e.utilization_pct || 0) + addUtil)
          };
        }
        return e;
      });
    }

    const updated = [newTask, ...tasks];
    const newMetrics = computeMetrics(updated, updatedEmployees);
    const updatedHistory = appendMetricHistory(newMetrics, updatedEmployees.length, get().recommendations.length, get().metricHistory);
    set({ tasks: updated, employees: updatedEmployees, metrics: newMetrics, metricHistory: updatedHistory });

    if (autoMatchedEmp) {
      realtimeBus.publish('NOTIFICATION_RECEIVED', {
        message: `🤖 AI Auto-Assigned Task ${newTask.code} to ${autoMatchedEmp.name} (${matchExplanation})`
      });
    } else {
      realtimeBus.publish('NOTIFICATION_RECEIVED', {
        message: `New task ${newTask.code} (${newTask.priority}) logged into delivery queue.`
      });
    }

    // Automated single-recipient assignment email dispatch via SMTP
    if (newTask.assigned_employee_id) {
      const assignedEmp = updatedEmployees.find(e => e.id === newTask.assigned_employee_id);
      if (assignedEmp) {
        sendAssignmentEmail(newTask, assignedEmp, undefined, matchExplanation || 'Autonomous AI Skill Matcher').then(record => {
          if (record) {
            realtimeBus.publish('NOTIFICATION_RECEIVED', {
              message: `📧 Direct dispatch email sent to ${assignedEmp.name} (${record.recipient_email}) via SMTP.`
            });
          }
        }).catch(err => console.warn('Email dispatch notice:', err));
      }
    }

    try {
      await insertTaskToSupabase(newTask);
    } catch (err) {
      console.warn('Supabase task insert notice:', err);
    }
  },

  autoAssignAllUnassignedTasks: async () => {
    const { tasks, employees } = get();
    const unassigned = tasks.filter(t => !t.assigned_employee_id);
    if (unassigned.length === 0 || employees.length === 0) return 0;

    let assignedCount = 0;
    let currentTasks = [...tasks];
    let currentEmployees = [...employees];

    for (const task of unassigned) {
      const match = findBestSkillMatch(task, currentEmployees);
      if (!match) continue;

      const emp = match.employee;
      const effortHours = (task.remaining_effort_min || 60) / 60;

      currentTasks = currentTasks.map(t =>
        t.id === task.id ? { ...t, assigned_employee_id: emp.id, status: 'InProgress' as const } : t
      );

      currentEmployees = currentEmployees.map(e => {
        if (e.id === emp.id) {
          const prevTasks = Array.isArray(e.current_tasks) ? e.current_tasks : [];
          const cur = prevTasks.includes(task.id) ? prevTasks : [...prevTasks, task.id];
          const capHours = Number(e.capacity_hours) || 40;
          const addUtil = Math.round((effortHours / Math.max(1, capHours)) * 100);
          return {
            ...e,
            current_tasks: cur,
            utilization_pct: Math.min(100, (e.utilization_pct || 0) + addUtil)
          };
        }
        return e;
      });

      sendAssignmentEmail(
        { ...task, assigned_employee_id: emp.id, status: 'InProgress' as const },
        emp,
        undefined,
        match.reason
      );

      updateTaskInSupabase(task.id, { assigned_employee_id: emp.id, status: 'InProgress' }).catch(err =>
        console.warn('Supabase auto-assign notice:', err)
      );

      assignedCount++;
    }

    const newMetrics = computeMetrics(currentTasks, currentEmployees);
    const updatedHistory = appendMetricHistory(newMetrics, currentEmployees.length, get().recommendations.length, get().metricHistory);

    set({
      tasks: currentTasks,
      employees: currentEmployees,
      metrics: newMetrics,
      metricHistory: updatedHistory
    });

    realtimeBus.publish('NOTIFICATION_RECEIVED', {
      message: `🤖 AI Auto-Assigned ${assignedCount} tasks based on specialized employee skills.`
    });

    return assignedCount;
  },

  assignTask: async (taskId: string, employeeId: string, customNote?: string) => {
    const { tasks, employees, currentUser } = get();
    const targetTask = tasks.find(t => t.id === taskId);
    const targetEmp = employees.find(e => e.id === employeeId);
    if (!targetTask || !targetEmp) return false;

    const prevAssigneeId = targetTask.assigned_employee_id;
    const prevAssignee = employees.find(e => e.id === prevAssigneeId);

    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, assigned_employee_id: employeeId, status: 'InProgress' as const } : t
    );

    const effortHours = (targetTask.remaining_effort_min || 60) / 60;
    const updatedEmployees = employees.map(e => {
      if (e.id === employeeId) {
        const prevTasks = Array.isArray(e.current_tasks) ? e.current_tasks : [];
        const cur = prevTasks.includes(taskId) ? prevTasks : [...prevTasks, taskId];
        const capHours = Number(e.capacity_hours) || 40;
        const addUtil = Math.round((effortHours / Math.max(1, capHours)) * 100);
        return {
          ...e,
          current_tasks: cur,
          utilization_pct: Math.min(100, (e.utilization_pct || 0) + addUtil)
        };
      }
      if (prevAssigneeId && e.id === prevAssigneeId) {
        const prevTasks = Array.isArray(e.current_tasks) ? e.current_tasks : [];
        const capHours = Number(e.capacity_hours) || 40;
        const subUtil = Math.round((effortHours / Math.max(1, capHours)) * 100);
        return {
          ...e,
          current_tasks: prevTasks.filter(tid => tid !== taskId),
          utilization_pct: Math.max(0, (e.utilization_pct || 0) - subUtil)
        };
      }
      return e;
    });

    const newMetrics = computeMetrics(updatedTasks, updatedEmployees);
    const updatedHistory = appendMetricHistory(newMetrics, updatedEmployees.length, get().recommendations.length, get().metricHistory);

    const audit: AuditLog = {
      id: `audit-assign-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: `${currentUser.role} (${currentUser.name})`,
      event_type: 'MANUAL_OVERRIDE',
      task_id: targetTask.id,
      task_code: targetTask.code,
      before: prevAssignee ? `Assigned to ${prevAssignee.name}` : 'Unassigned',
      after: `Assigned to ${targetEmp.name} (${targetEmp.email})`,
      reason: customNote || 'Direct operator allocation via Global Work Order Registry.',
      approval_outcome: 'AUTO_APPROVED'
    };

    set(state => ({
      tasks: updatedTasks,
      employees: updatedEmployees,
      metrics: newMetrics,
      metricHistory: updatedHistory,
      auditLogs: [audit, ...state.auditLogs]
    }));

    realtimeBus.publish('NOTIFICATION_RECEIVED', {
      message: `Task ${targetTask.code} assigned to ${targetEmp.name}. Dispatching SMTP alert...`
    });

    // Automated single-recipient dispatch email to the assigned employee
    const assignedTaskObj = { ...targetTask, assigned_employee_id: employeeId, status: 'InProgress' as const };
    sendAssignmentEmail(assignedTaskObj, targetEmp, customNote, 'Direct Manager Assignment').then(record => {
      if (record) {
        realtimeBus.publish('NOTIFICATION_RECEIVED', {
          message: `📧 Direct dispatch email sent to ${targetEmp.name} (${record.recipient_email}) via SMTP.`
        });
      }
    }).catch(err => console.warn('Email dispatch on manual assign notice:', err));

    try {
      await updateTaskInSupabase(taskId, { assigned_employee_id: employeeId, status: 'InProgress' });
      await insertAuditLogToSupabase(audit);
    } catch (err) {
      console.warn('Supabase task assign notice:', err);
    }

    return true;
  },

  resendTaskEmail: async (taskId: string) => {
    const { tasks, employees } = get();
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask || !targetTask.assigned_employee_id) return false;

    const targetEmp = employees.find(e => e.id === targetTask.assigned_employee_id);
    if (!targetEmp) return false;

    realtimeBus.publish('NOTIFICATION_RECEIVED', {
      message: `Sending assignment email to ${targetEmp.name} (${targetEmp.email})...`
    });

    const emailResult = await sendAssignmentEmail(
      targetTask,
      targetEmp,
      undefined,
      'Operator Resend / Direct Notification'
    );

    if (emailResult && emailResult.status === 'Delivered via SMTP') {
      realtimeBus.publish('NOTIFICATION_RECEIVED', {
        message: `📧 Email delivered to ${targetEmp.name} (${emailResult.recipient_email}) via SMTP.`
      });
      return true;
    } else if (emailResult) {
      realtimeBus.publish('NOTIFICATION_RECEIVED', {
        message: `ℹ️ Email dispatch recorded: ${emailResult.status} (${emailResult.recipient_email}).`
      });
      return true;
    } else {
      realtimeBus.publish('NOTIFICATION_RECEIVED', {
        message: `⚠️ Email dispatch failed. Ensure Python backend is running.`
      });
      return false;
    }
  },

  deleteEmployee: async (id: string) => {
    const { employees, tasks } = get();
    const updated = employees.filter(e => e.id !== id);
    const unassignedTasks = tasks.map(t => t.assigned_employee_id === id ? { ...t, assigned_employee_id: null, status: 'Ready' as const } : t);
    const newMetrics = computeMetrics(unassignedTasks, updated);
    const updatedHistory = appendMetricHistory(newMetrics, updated.length, get().recommendations.length, get().metricHistory);
    set({ employees: updated, tasks: unassignedTasks, metrics: newMetrics, metricHistory: updatedHistory });

    try {
      await deleteEmployeeFromSupabase(id);
    } catch (err) {
      console.warn('Supabase employee delete notice:', err);
    }
  },

  deleteTask: async (id: string) => {
    const { tasks, employees, currentUser, recommendations } = get();
    const targetTask = tasks.find(t => t.id === id);
    if (!targetTask) return;

    const updatedTasks = tasks.filter(t => t.id !== id);
    
    // Free up assigned employee capacity if task was assigned
    const updatedEmployees = employees.map(e => {
      if (e.id === targetTask.assigned_employee_id) {
        const empTasks = Array.isArray(e.current_tasks) ? e.current_tasks : [];
        const remainingTasks = empTasks.filter(tid => tid !== id);
        const effortHours = targetTask.remaining_effort_min / 60;
        const capHours = Number(e.capacity_hours) || 40;
        const utilReduction = Math.round((effortHours / Math.max(1, capHours)) * 100);
        return {
          ...e,
          current_tasks: remainingTasks,
          utilization_pct: Math.max(0, (e.utilization_pct || 0) - utilReduction)
        };
      }
      return e;
    });

    const updatedRecs = recommendations.filter(r => r.task_id !== id);
    const newMetrics = computeMetrics(updatedTasks, updatedEmployees);
    const updatedHistory = appendMetricHistory(newMetrics, updatedEmployees.length, updatedRecs.length, get().metricHistory);

    const audit: AuditLog = {
      id: `audit-del-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: `${currentUser.role} (${currentUser.name})`,
      event_type: 'MANUAL_OVERRIDE',
      task_id: targetTask.id,
      task_code: targetTask.code,
      before: `Task ${targetTask.code}: ${targetTask.name} (${targetTask.priority})`,
      after: 'Deleted from operational queue',
      reason: 'Work order deleted by operator.',
      approval_outcome: 'AUTO_APPROVED'
    };

    set(state => ({
      tasks: updatedTasks,
      employees: updatedEmployees,
      recommendations: updatedRecs,
      auditLogs: [audit, ...state.auditLogs],
      metrics: newMetrics,
      metricHistory: updatedHistory,
      selectedTaskIdForExplain: state.selectedTaskIdForExplain === id ? null : state.selectedTaskIdForExplain
    }));

    realtimeBus.publish('NOTIFICATION_RECEIVED', {
      message: `Task ${targetTask.code} deleted from operational registry.`
    });

    try {
      await deleteTaskFromSupabase(id);
      await insertAuditLogToSupabase(audit);
    } catch (err) {
      console.warn('Supabase task delete notice:', err);
    }
  },

  clearAllTasks: async () => {
    const { employees, tasks, currentUser } = get();
    
    // Reset all employee workloads to 0
    const updatedEmployees = employees.map(e => ({
      ...e,
      current_tasks: [],
      utilization_pct: 0,
      status: 'Available' as const
    }));

    const count = tasks.length;
    const audit: AuditLog = {
      id: `audit-clear-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: `${currentUser.role} (${currentUser.name})`,
      event_type: 'MANUAL_OVERRIDE',
      before: `${count} active work orders`,
      after: '0 tasks (operational queue cleared)',
      reason: 'Work order queue wiped to 0 by operator.',
      approval_outcome: 'AUTO_APPROVED'
    };

    const newMetrics = computeMetrics([], updatedEmployees);
    const updatedHistory = appendMetricHistory(newMetrics, updatedEmployees.length, 0, get().metricHistory);

    set({
      tasks: [],
      employees: updatedEmployees,
      recommendations: [],
      metrics: newMetrics,
      metricHistory: updatedHistory,
      selectedTaskIdForExplain: null,
      selectedRecommendationId: null,
      auditLogs: [audit, ...get().auditLogs]
    });

    realtimeBus.publish('NOTIFICATION_RECEIVED', {
      message: `Operational task registry purged: 0 tasks remaining.`
    });

    try {
      await deleteAllTasksFromSupabase();
      await insertAuditLogToSupabase(audit);
    } catch (err) {
      console.warn('Supabase clear all tasks notice:', err);
    }
  },

  clearAllData: async () => {
    set({
      employees: [],
      tasks: [],
      projects: [],
      recommendations: [],
      auditLogs: [],
      notifications: [],
      metricHistory: [],
      metrics: {
        sla_compliance_pct: 100,
        average_utilization_pct: 0,
        at_risk_tasks_count: 0,
        critical_tasks_count: 0,
        unassigned_count: 0,
        breach_predicted_count: 0
      }
    });
  },

  seedRealisticLiveBatch: async () => {
    // Pure Supabase mode - no fake seeds permitted
    await get().initializeSupabaseSync();
  },

  triggerDisruption: async (employeeId?: string) => {
    const { employees, tasks } = get();
    const target = employees.find(e => employeeId ? e.id === employeeId : e.status === 'Available');
    if (!target) return;

    const updatedEmployees = employees.map(e => 
      e.id === target.id ? { ...e, status: 'Unavailable' as const, utilization_pct: 0 } : e
    );

    const affectedTasks = tasks.filter(t => t.assigned_employee_id === target.id);
    const updatedTasks = tasks.map(t => 
      t.assigned_employee_id === target.id ? { ...t, status: 'AtRisk' as const } : t
    );

    realtimeBus.publish('DISRUPTION_DETECTED', {
      employeeId: target.id,
      employeeName: target.name,
      affectedTaskCount: affectedTasks.length,
      affectedTasks: affectedTasks.map(t => t.code)
    });

    const audit: AuditLog = {
      id: `audit-disrupt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'System Telemetry Monitor',
      event_type: 'DISRUPTION',
      before: `Engineer ${target.name} (${target.id}) Active`,
      after: 'Sudden Unavailability Triggered',
      reason: 'Automated Disruption Event injected by Controller.',
      approval_outcome: 'AUTO_APPROVED'
    };

    const newMetrics = computeMetrics(updatedTasks, updatedEmployees);
    set(state => ({
      employees: updatedEmployees,
      tasks: updatedTasks,
      metrics: newMetrics,
      auditLogs: [audit, ...state.auditLogs],
      disruptedEmployeeId: target.id
    }));

    try {
      await updateEmployeeInSupabase(target.id, { status: 'Unavailable', utilization_pct: 0 });
      await insertAuditLogToSupabase(audit);
    } catch (err) {
      console.warn('Supabase disruption update notice:', err);
    }
  },

  optimizeAll: async () => {
    set({ isAIOptimizing: true });
    realtimeBus.publish('AI_OPTIMIZATION_STARTED', { scope: 'GLOBAL_FLEET' });

    const { tasks, employees, weights, isPythonOnline } = get();
    const unassignedOrAtRisk = tasks.filter(t => !t.assigned_employee_id || t.status === 'AtRisk' || t.priority === 'Critical');

    // Attempt heavy-compute optimization via Python backend first
    if (isPythonOnline) {
      try {
        const pythonRecs = await optimizeWithPython(unassignedOrAtRisk, employees, weights);
        if (pythonRecs && pythonRecs.length > 0) {
          set({
            recommendations: pythonRecs,
            isAIOptimizing: false,
            selectedRecommendationId: pythonRecs[0]?.id || null
          });
          realtimeBus.publish('RECOMMENDATION_GENERATED', {
            proposalsCount: pythonRecs.length,
            engine: 'Python 3.12 FastAPI'
          });
          return;
        }
      } catch (err) {
        console.warn('Python optimize fallback to TS engine:', err);
      }
    }

    // Fallback to client-side TS deterministic engine
    setTimeout(() => {
      const newRecs: AIRecommendation[] = [];
      for (const t of unassignedOrAtRisk.slice(0, 5)) {
        const rec = createReallocationRecommendation(t, employees, t.assigned_employee_id || null, weights);
        if (rec) newRecs.push(rec);
      }

      set({
        recommendations: newRecs,
        isAIOptimizing: false,
        selectedRecommendationId: newRecs[0]?.id || null
      });

      realtimeBus.publish('RECOMMENDATION_GENERATED', {
        proposalsCount: newRecs.length,
        engine: 'Client TypeScript Engine'
      });
    }, 600);
  },

  optimizeTask: async (taskId: string) => {
    set({ isAIOptimizing: true });
    const { tasks, employees, weights } = get();
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      set({ isAIOptimizing: false });
      return;
    }

    setTimeout(() => {
      const rec = createReallocationRecommendation(task, employees, task.assigned_employee_id || null, weights);
      if (rec) {
        set(state => ({
          recommendations: [rec, ...state.recommendations.filter(r => r.task_id !== taskId)],
          selectedRecommendationId: rec.id,
          isAIOptimizing: false
        }));
      } else {
        set({ isAIOptimizing: false });
      }
    }, 600);
  },

  approveRecommendation: async (recommendationId: string) => {
    const { recommendations, tasks, employees, currentUser } = get();
    const rec = recommendations.find(r => r.id === recommendationId);
    if (!rec) return;

    const task = tasks.find(t => t.id === rec.task_id);
    const targetEmp = employees.find(e => e.id === rec.to_employee_id);
    if (!task || !targetEmp) return;

    const updatedTasks = tasks.map(t => 
      t.id === task.id ? { ...t, assigned_employee_id: targetEmp.id, status: 'InProgress' as const } : t
    );

    const updatedEmployees = employees.map(e => {
      if (e.id === targetEmp.id) {
        const prevTasks = Array.isArray(e.current_tasks) ? e.current_tasks : [];
        const capHours = Number(e.capacity_hours) || 40;
        return {
          ...e,
          utilization_pct: Math.min(100, (e.utilization_pct || 0) + Math.round((task.remaining_effort_min / (capHours * 60)) * 100)),
          current_tasks: Array.from(new Set([...prevTasks, task.id]))
        };
      }
      return e;
    });

    const audit: AuditLog = {
      id: `audit-appr-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: `${currentUser.role} (${currentUser.name})`,
      event_type: 'REALLOCATION',
      task_id: task.id,
      task_code: task.code,
      before: rec.from_employee_id || 'Unassigned',
      after: `${targetEmp.name} (${targetEmp.id})`,
      reason: `Human-in-the-loop sign-off on AI proposed optimal reallocation.`,
      score: rec.score.total_score,
      approval_outcome: 'MANAGER_APPROVED'
    };

    const newMetrics = computeMetrics(updatedTasks, updatedEmployees);

    set(state => ({
      tasks: updatedTasks,
      employees: updatedEmployees,
      recommendations: state.recommendations.filter(r => r.id !== recommendationId),
      auditLogs: [audit, ...state.auditLogs],
      metrics: newMetrics,
      selectedRecommendationId: null
    }));

    realtimeBus.publish('REALLOCATION_APPROVED', {
      taskId: task.id,
      taskCode: task.code,
      newAssigneeId: targetEmp.id,
      newAssigneeName: targetEmp.name
    });

    // Automated single-recipient dispatch email to the approved assignee
    sendAssignmentEmail(task, targetEmp, undefined, rec.reason).then(record => {
      if (record) {
        realtimeBus.publish('NOTIFICATION_RECEIVED', {
          message: `📧 Direct dispatch email sent to ${targetEmp.name} (${record.recipient_email}) via SMTP.`
        });
      }
    }).catch(err => console.warn('Email dispatch on approval notice:', err));

    try {
      await updateTaskInSupabase(task.id, { assigned_employee_id: targetEmp.id, status: 'InProgress' });
      await updateRecommendationInSupabase(recommendationId, { status: 'Approved' });
      await insertAuditLogToSupabase(audit);
    } catch (err) {
      console.warn('Supabase approval update notice:', err);
    }
  },

  rejectRecommendation: async (recommendationId: string) => {
    const { recommendations, tasks, currentUser } = get();
    const rec = recommendations.find(r => r.id === recommendationId);
    if (!rec) return;

    const task = tasks.find(t => t.id === rec.task_id);

    const audit: AuditLog = {
      id: `audit-reject-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: `${currentUser.role} (${currentUser.name})`,
      event_type: 'MANUAL_OVERRIDE',
      task_id: task?.id,
      task_code: task?.code,
      before: `AI Proposed ${rec.to_employee_id}`,
      after: 'Proposal Rejected by User',
      reason: 'Rejected by operational authority; alternatives requested.',
      score: rec.score.total_score,
      approval_outcome: 'REJECTED'
    };

    set(state => ({
      recommendations: state.recommendations.filter(r => r.id !== recommendationId),
      auditLogs: [audit, ...state.auditLogs]
    }));

    try {
      await updateRecommendationInSupabase(recommendationId, { status: 'Rejected' });
      await insertAuditLogToSupabase(audit);
    } catch (err) {
      console.warn('Supabase reject notice:', err);
    }
  },

  openExplainModal: (taskId: string, recommendationId?: string) => {
    set({
      selectedTaskIdForExplain: taskId,
      selectedRecommendationId: recommendationId || null
    });
  },

  closeExplainModal: () => {
    set({
      selectedTaskIdForExplain: null,
      selectedRecommendationId: null
    });
  },

  toggleCommandPalette: (open?: boolean) => {
    set(state => ({ isCommandPaletteOpen: open !== undefined ? open : !state.isCommandPaletteOpen }));
  },

  toggleNotifications: (open?: boolean) => {
    set(state => ({ isNotificationsOpen: open !== undefined ? open : !state.isNotificationsOpen }));
  },

  markNotificationsRead: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    }));
  },

  tickRealTime: () => {
    const { tasks, employees, isRealTimeActive } = get();
    const now = Date.now();
    if (!isRealTimeActive) {
      set({ currentTimestamp: now });
      return;
    }

    let changed = false;
    const updatedTasks = tasks.map(t => {
      if (t.status === 'InProgress' && t.assigned_employee_id && t.remaining_effort_min > 0) {
        changed = true;
        const newEffort = Math.max(0, t.remaining_effort_min - 1);
        return {
          ...t,
          remaining_effort_min: newEffort,
          status: newEffort === 0 ? ('Completed' as const) : t.status
        };
      }
      return t;
    });

    const newMetrics = computeMetrics(updatedTasks, employees, now);
    set({ tasks: updatedTasks, metrics: newMetrics, currentTimestamp: now });
  },

  advanceDemoBeat: () => {
    const current = get().demoStep;
    if (current === 0) {
      get().triggerDisruption('E-023');
    } else if (current === 1) {
      set({ isAIOptimizing: true, demoStep: 2 });
      realtimeBus.publish('AI_OPTIMIZATION_STARTED', { scope: 'T-104_CRITICAL' });
      setTimeout(() => {
        set({ isAIOptimizing: false, demoStep: 3 });
        const { tasks, employees, weights } = get();
        const t104 = tasks.find(t => t.code === 'T-104');
        if (t104) {
          const rec = createReallocationRecommendation(t104, employees, 'E-023', weights);
          if (rec) {
            set(state => ({
              recommendations: [rec, ...state.recommendations.filter(r => r.task_id !== t104.id)],
              selectedRecommendationId: rec.id
            }));
          }
        }
      }, 1000);
    } else if (current === 3) {
      const { recommendations } = get();
      const rec = recommendations[0];
      if (rec) {
        get().approveRecommendation(rec.id);
        set({ demoStep: 5 });
      }
    }
  },

  resetToInitialSeed: async () => {
    await get().initializeSupabaseSync();
  }
}));

// Live background ticker running every 1.5 seconds for visible real-time reactivity
if (typeof window !== 'undefined') {
  setInterval(() => {
    useNexusStore.getState().tickRealTime();
  }, 1500);

  // Automatically initialize Supabase sync and Python backend on app boot
  setTimeout(() => {
    useNexusStore.getState().initializeSupabaseSync();
    useNexusStore.getState().checkPythonStatus();
  }, 50);

  setInterval(() => {
    useNexusStore.getState().checkPythonStatus();
  }, 10000);
}
