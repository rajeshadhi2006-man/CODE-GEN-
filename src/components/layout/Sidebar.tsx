import React from 'react';
import { 
  Compass,
  LayoutDashboard,
  ShieldAlert,
  Globe,
  FileSpreadsheet,
  CheckSquare,
  FolderKanban,
  GitMerge,
  Inbox,
  Users,
  Sparkles,
  Flame,
  Shuffle,
  Cpu,
  BarChart3,
  Sliders,
  ScrollText,
  Settings,
  Columns2,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import { useNexusStore } from '../../store/useNexusStore';
import { UserRole } from '../../data/types';

interface NavSection {
  title: string;
  shortcut: string;
  items: {
    id: string;
    label: string;
    desc: string;
    icon: React.ElementType;
    rolesAllowed?: UserRole[];
    badge?: string | number;
    badgeColor?: string;
  }[];
}

export const Sidebar: React.FC<{ isCollapsed: boolean; toggleCollapse: () => void }> = ({
  isCollapsed,
  toggleCollapse
}) => {
  const { 
    activeTab, 
    setActiveTab, 
    currentUser, 
    recommendations, 
    metrics,
    isSplitView,
    toggleSplitView,
    isPythonOnline,
    tasks
  } = useNexusStore();

  const pendingApprovalsCount = recommendations.filter(r => r.status === 'Pending').length;
  const atRiskCount = metrics.at_risk_tasks_count || tasks.filter(t => t.status === 'AtRisk' || t.status === 'Escalated').length;

  const sections: NavSection[] = [
    {
      title: 'Mission Control',
      shortcut: '1',
      items: [
        { id: 'command-center', label: 'Command Center', desc: 'Real-time Operations Deck', icon: LayoutDashboard },
        { 
          id: 'sla-risk', 
          label: 'SLA Risk Radar', 
          desc: 'Predictive Breach Engine', 
          icon: ShieldAlert,
          badge: atRiskCount > 0 ? atRiskCount : undefined,
          badgeColor: 'bg-[#EF4444]'
        },
        { id: 'world-map', label: 'Global Delivery Map', desc: 'Regional Hub Telemetry', icon: Globe },
        { id: 'executive-report', label: 'Executive Brief', desc: 'Board-Level Reporting', icon: FileSpreadsheet },
      ]
    },
    {
      title: 'Delivery & Tasks',
      shortcut: '2',
      items: [
        { id: 'tasks', label: 'Task Intelligence', desc: 'Work Order Allocation', icon: CheckSquare },
        { id: 'projects', label: 'Projects & Accounts', desc: 'Portfolio Health & Velocity', icon: FolderKanban },
        { id: 'dependency', label: 'Dependency Graph', desc: 'Critical Path Topology', icon: GitMerge },
        { 
          id: 'approvals', 
          label: 'Approvals Inbox', 
          desc: 'Human-in-the-Loop Signoff', 
          icon: Inbox,
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
          badgeColor: 'bg-[#0284C7]'
        },
      ]
    },
    {
      title: 'Workforce & Talent',
      shortcut: '3',
      items: [
        { id: 'workforce', label: 'Workforce 360', desc: 'Engineer Profiles & Skills', icon: Users },
        { id: 'skills', label: 'Skill Intelligence', desc: 'Competency Gap Matrix', icon: Sparkles },
        { id: 'heatmap', label: 'Workload Heatmap', desc: 'Burnout & Capacity Radar', icon: Flame },
        { id: 'live-allocation', label: 'Live Allocation', desc: 'Autonomous Rebalancing Engine', icon: Shuffle },
      ]
    },
    {
      title: 'AI & Digital Twin',
      shortcut: '4',
      items: [
        { id: 'simulation', label: 'Disruption Simulator', desc: 'Blast-Radius Stress Testing', icon: Cpu },
        { id: 'analytics', label: 'Forecasting Analytics', desc: 'Monte Carlo & Capacity', icon: BarChart3 },
        { id: 'governance', label: 'Fairness & Policy', desc: '7-Factor Scoring Weights', icon: Sliders },
        { id: 'audit', label: 'Audit Trail', desc: 'Immutable Compliance Log', icon: ScrollText },
        { 
          id: 'admin', 
          label: 'Admin Controls', 
          desc: 'DB Sync & System Config', 
          icon: Settings,
          rolesAllowed: ['Super Admin']
        },
      ]
    }
  ];

  const checkRoleAccess = (rolesAllowed?: UserRole[]): boolean => {
    if (!rolesAllowed) return true;
    return rolesAllowed.includes(currentUser.role);
  };

  return (
    <aside 
      className={`relative h-[calc(100vh-3.5rem)] bg-[#0B1120] border-r border-[#1D2D4A] flex flex-col justify-between transition-all duration-300 z-20 select-none ${
        isCollapsed ? 'w-16' : 'w-64 sm:w-72'
      }`}
    >
      {/* Navigation Groups (Full View Form) */}
      <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4 custom-scrollbar">
        {sections.map((sec) => (
          <div key={sec.title} className="space-y-1">
            {/* Section Header */}
            {!isCollapsed && (
              <div className="px-2.5 py-1 text-[11px] font-mono-data font-bold text-[#38BDF8] uppercase tracking-wider flex items-center justify-between opacity-85">
                <span>{sec.title}</span>
                <span className="text-[10px] text-[#64748B] font-mono-data">⌘{sec.shortcut}</span>
              </div>
            )}

            {/* Section Items */}
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                if (!checkRoleAccess(item.rolesAllowed)) return null;

                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-[#0284C7]/25 via-[#0284C7]/15 to-transparent text-white font-semibold border-l-2 border-[#38BDF8] shadow-sm'
                        : 'text-[#94A3B8] hover:bg-white/5 hover:text-white'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {/* Icon */}
                    <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                      isActive ? 'bg-[#0284C7] text-white shadow-sm' : 'bg-[#111C35] text-[#94A3B8] group-hover:text-[#38BDF8]'
                    }`}>
                      <Icon size={15} />
                    </div>

                    {/* Labels in Full View Form */}
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="text-xs leading-tight truncate font-medium">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-[#64748B] truncate leading-tight mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                    )}

                    {/* Badge */}
                    {item.badge !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm shrink-0 animate-pulse ${
                        item.badgeColor || 'bg-[#0284C7]'
                      } ${isCollapsed ? 'absolute -top-1 -right-1' : ''}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Controls: Split Workstation Toggle & Collapse Button */}
      <div className="p-2.5 border-t border-[#1D2D4A] bg-[#090E1C]/80 space-y-2">
        {/* Split Workstation Mode Button */}
        <button
          type="button"
          onClick={toggleSplitView}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
            isSplitView
              ? 'bg-[#38BDF8] text-[#080D1A] font-bold shadow-[0_0_15px_rgba(56,189,248,0.5)]'
              : 'bg-[#111C35] border border-[#1D2D4A] text-[#94A3B8] hover:text-white hover:border-[#38BDF8]/50'
          }`}
          title="Toggle Split-Screen Workstation (\)"
        >
          <Columns2 size={16} className="shrink-0" />
          {!isCollapsed && (
            <div className="flex-1 flex items-center justify-between text-left">
              <span>Split Workstation</span>
              <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono-data bg-black/40 border border-white/10">
                \
              </kbd>
            </div>
          )}
        </button>

        {/* Sidebar Collapse Toggle */}
        <div className="flex items-center justify-between px-1 text-[11px] font-mono-data text-[#64748B]">
          {!isCollapsed && (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
              <span>Python 3.12 Live</span>
            </div>
          )}
          <button
            type="button"
            onClick={toggleCollapse}
            className="p-1 rounded-lg hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>
      </div>
    </aside>
  );
};
