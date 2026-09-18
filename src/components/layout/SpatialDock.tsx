import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  CheckSquare,
  Users,
  Cpu,
  Columns2,
  ChevronLeft,
  LayoutDashboard,
  ShieldAlert,
  Globe,
  FileSpreadsheet,
  FolderKanban,
  GitMerge,
  Inbox,
  Flame,
  Shuffle,
  BarChart3,
  Sliders,
  ScrollText,
  Settings,
  Sparkles,
  Layers
} from 'lucide-react';
import { useNexusStore } from '../../store/useNexusStore';

export interface WorkspaceGroup {
  id: string;
  label: string;
  shortcut: string;
  icon: React.ElementType;
  color: string;
  tabs: {
    id: string;
    label: string;
    desc: string;
    icon: React.ElementType;
  }[];
}

export const WORKSPACE_GROUPS: WorkspaceGroup[] = [
  {
    id: 'mission',
    label: 'Mission Control',
    shortcut: '1',
    icon: Compass,
    color: '#38BDF8',
    tabs: [
      { id: 'command-center', label: 'Command Center', desc: 'Real-time Operations Deck', icon: LayoutDashboard },
      { id: 'sla-risk', label: 'SLA Risk Radar', desc: 'Predictive Breach Engine', icon: ShieldAlert },
      { id: 'world-map', label: 'Global Delivery Map', desc: 'Regional Hub Telemetry', icon: Globe },
      { id: 'executive-report', label: 'Executive Brief', desc: 'Board-Level Reporting', icon: FileSpreadsheet },
    ]
  },
  {
    id: 'delivery',
    label: 'Delivery & Tasks',
    shortcut: '2',
    icon: CheckSquare,
    color: '#10B981',
    tabs: [
      { id: 'tasks', label: 'Task Intelligence', desc: 'Work Order Allocation', icon: CheckSquare },
      { id: 'projects', label: 'Projects & Accounts', desc: 'Portfolio Health & Velocity', icon: FolderKanban },
      { id: 'dependency', label: 'Dependency Graph', desc: 'Critical Path Topology', icon: GitMerge },
      { id: 'approvals', label: 'Approvals Inbox', desc: 'Human-in-the-Loop Signoff', icon: Inbox },
    ]
  },
  {
    id: 'workforce',
    label: 'Workforce & Talent',
    shortcut: '3',
    icon: Users,
    color: '#818CF8',
    tabs: [
      { id: 'workforce', label: 'Workforce 360', desc: 'Engineer Profiles & Skills', icon: Users },
      { id: 'skills', label: 'Skill Intelligence', desc: 'Competency Gap Matrix', icon: Sparkles },
      { id: 'heatmap', label: 'Workload Heatmap', desc: 'Burnout & Capacity Radar', icon: Flame },
      { id: 'live-allocation', label: 'Live Allocation', desc: 'Autonomous Rebalancing Engine', icon: Shuffle },
    ]
  },
  {
    id: 'digital-twin',
    label: 'AI & Digital Twin',
    shortcut: '4',
    icon: Cpu,
    color: '#F43F5E',
    tabs: [
      { id: 'simulation', label: 'Disruption Simulator', desc: 'Blast-Radius Stress Testing', icon: Cpu },
      { id: 'analytics', label: 'Forecasting Analytics', desc: 'Monte Carlo & Capacity', icon: BarChart3 },
      { id: 'governance', label: 'Fairness & Policy', desc: '7-Factor Scoring Weights', icon: Sliders },
      { id: 'audit', label: 'Audit Trail', desc: 'Immutable Compliance Log', icon: ScrollText },
      { id: 'admin', label: 'Admin Controls', desc: 'DB Sync & System Config', icon: Settings },
    ]
  }
];

export const SpatialDock: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    isSplitView, 
    toggleSplitView,
    recommendations
  } = useNexusStore();

  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);

  // Find active group based on current activeTab
  const currentGroup = WORKSPACE_GROUPS.find(group => 
    group.tabs.some(t => t.id === activeTab)
  ) || WORKSPACE_GROUPS[0];

  const pendingApprovalsCount = recommendations.filter(r => r.status === 'Pending').length;

  return (
    <div className="fixed right-3 sm:right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center pointer-events-none">
      <motion.div 
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        className="pointer-events-auto relative flex flex-col items-center gap-2 p-2 rounded-2xl spatial-dock"
      >
        {/* Workspace Groups */}
        {WORKSPACE_GROUPS.map((group) => {
          const isGroupActive = currentGroup.id === group.id;
          const GroupIcon = group.icon;
          const isFlyoutOpen = activeFlyout === group.id;

          return (
            <div key={group.id} className="relative group/btn">
              {/* Flyout Sub-menu (Opens to the LEFT) */}
              <AnimatePresence>
                {isFlyoutOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: 12, scale: 0.94 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 8, scale: 0.94 }}
                    transition={{ duration: 0.16 }}
                    className="absolute right-full mr-3 top-1/2 -translate-y-1/2 w-64 p-2 rounded-2xl bg-[#0F172A]/95 backdrop-blur-xl border border-[#38BDF8]/30 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_0_1px_rgba(56,189,248,0.2)] z-50 text-white"
                  >
                    <div className="px-2.5 py-1.5 text-[11px] font-mono-data text-[#38BDF8] uppercase tracking-wider font-semibold border-b border-white/10 flex items-center justify-between">
                      <span>{group.label}</span>
                      <span className="text-[10px] text-white/50">⌘{group.shortcut}</span>
                    </div>

                    <div className="mt-1.5 space-y-1">
                      {group.tabs.map((tab) => {
                        const isTabActive = activeTab === tab.id;
                        const TabIcon = tab.icon;

                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(tab.id);
                              setActiveFlyout(null);
                            }}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all ${
                              isTabActive
                                ? 'bg-gradient-to-r from-[#0284C7] to-[#0369A1] text-white shadow-md font-medium border border-[#38BDF8]/40'
                                : 'text-[#94A3B8] hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg ${isTabActive ? 'bg-white/20' : 'bg-[#1E293B]'}`}>
                              <TabIcon size={14} className={isTabActive ? 'text-white' : 'text-[#38BDF8]'} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold leading-tight truncate">{tab.label}</div>
                              <div className="text-[10px] text-[#64748B] truncate leading-tight mt-0.5">{tab.desc}</div>
                            </div>
                            {tab.id === 'approvals' && pendingApprovalsCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EF4444] text-white shadow-sm animate-pulse">
                                {pendingApprovalsCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Workspace Main Button */}
              <button
                type="button"
                onClick={() => {
                  if (isGroupActive) {
                    setActiveFlyout(isFlyoutOpen ? null : group.id);
                  } else {
                    setActiveTab(group.tabs[0].id);
                    setActiveFlyout(null);
                  }
                }}
                onMouseEnter={() => setActiveFlyout(group.id)}
                className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-xl text-xs font-medium transition-all group ${
                  isGroupActive
                    ? 'bg-gradient-to-b from-[#0284C7] to-[#0369A1] text-white shadow-[0_4px_16px_rgba(2,132,199,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] border border-[#38BDF8]/60'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/10'
                }`}
                title={group.label}
              >
                <GroupIcon size={18} className={isGroupActive ? 'text-white' : 'text-[#94A3B8] group-hover:text-[#38BDF8] transition-colors'} />
                
                {/* Hotkey tag */}
                <span className="text-[9px] font-mono-data opacity-70 mt-0.5">
                  {group.shortcut}
                </span>

                {/* Active Indicator on Left Edge */}
                {isGroupActive && (
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-[#38BDF8] shadow-[0_0_10px_#38BDF8]" />
                )}

                {/* Notification Badge */}
                {group.id === 'delivery' && pendingApprovalsCount > 0 && (
                  <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center animate-pulse shadow-sm">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            </div>
          );
        })}

        {/* Horizontal Divider */}
        <div className="w-6 h-[1px] bg-white/15 my-0.5" />

        {/* Split-Screen Dual Workstation Mode Button */}
        <button
          type="button"
          onClick={toggleSplitView}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl text-xs font-medium transition-all ${
            isSplitView
              ? 'bg-[#38BDF8] text-[#080D1A] font-bold shadow-[0_0_16px_rgba(56,189,248,0.6)]'
              : 'text-[#94A3B8] hover:text-white hover:bg-white/10'
          }`}
          title="Toggle Split-Screen Workstation (\)"
        >
          <Columns2 size={18} />
          <span className="text-[9px] font-mono-data opacity-80 mt-0.5">Split</span>
        </button>

        {/* Active Module Indicator Pip */}
        <div 
          className="p-1.5 rounded-lg text-[#38BDF8] opacity-60 hover:opacity-100 transition-opacity"
          title={`Active: ${WORKSPACE_GROUPS.flatMap(g => g.tabs).find(t => t.id === activeTab)?.label || 'Overview'}`}
        >
          <Layers size={14} />
        </div>
      </motion.div>
    </div>
  );
};
