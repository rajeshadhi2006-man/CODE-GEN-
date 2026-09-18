import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Plus,
  Search,
  Bell,
  Database,
  Cpu,
  Globe,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Activity,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { useNexusStore } from '../../store/useNexusStore';
import { UserRole } from '../../data/types';
import { TrafficLight } from '../ui/TrafficLight';

export const DynamicIslandHeader: React.FC = () => {
  const {
    currentUser,
    setRole,
    selectedRegion,
    setSelectedRegion,
    toggleCommandPalette,
    toggleNotifications,
    recommendations,
    isAIOptimizing,
    optimizeAll,
    isPythonOnline,
    pythonVersion,
    toggleSupabaseModal,
    toggleCreateTaskModal,
    toggleCreateEmployeeModal,
    tasks,
    employees
  } = useNexusStore();

  const [isRegionMenuOpen, setIsRegionMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);

  const regions = ['All', 'Americas', 'EMEA', 'APAC', 'South Asia', 'LATAM'];
  const roles: UserRole[] = [
    'Super Admin',
    'Workforce Manager',
    'Project Manager',
    'Team Lead',
    'Employee',
    'Executive'
  ];

  const pendingRecommendations = recommendations.filter(r => r.status === 'Pending');
  const atRiskTasks = tasks.filter(t => t.status === 'AtRisk' || t.status === 'Escalated');

  return (
    <header className="sticky top-0 z-30 w-full px-4 py-2.5 bg-[#090E1C]/95 backdrop-blur-xl border-b border-[#1D2D4A] shadow-[0_4px_24px_rgba(0,0,0,0.5)] select-none">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity & Telemetry Chips */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0284C7] to-[#0D162B] border border-[#38BDF8]/40 flex items-center justify-center shadow-[0_2px_12px_rgba(2,132,199,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]">
              <Sparkles size={16} className="text-[#38BDF8] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-[#F8FAFC]">NEXUS</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono-data bg-[#0284C7]/25 text-[#38BDF8] border border-[#0284C7]/50 font-semibold">
                  OS 3.0
                </span>
              </div>
              <div className="text-[10px] font-mono-data text-[#38BDF8]/80 tracking-wider">
                DARK BLUE WORKSTATION
              </div>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-white/10 hidden sm:block mx-1" />

          {/* Supabase Live Telemetry Badge */}
          <button
            type="button"
            onClick={() => toggleSupabaseModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[11px] font-mono-data border bg-[#10B981]/15 border-[#10B981]/40 text-[#34D399] hover:bg-[#10B981]/25 transition-all font-semibold shadow-sm"
            title="Click to manage live Supabase connection"
          >
            <Database size={12} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
            <span className="hidden md:inline">Supabase Live</span>
          </button>

          {/* Python AI Engine Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[11px] font-mono-data border select-none font-semibold transition-all ${
              isPythonOnline
                ? 'bg-[#0284C7]/20 border-[#0284C7]/50 text-[#38BDF8]'
                : 'bg-[#111C35] border-[#1D2D4A] text-[#64748B]'
            }`}
            title={isPythonOnline ? `FastAPI Python ${pythonVersion || '3.12'} Connected on :8000` : 'Python Backend Offline'}
          >
            <Cpu size={12} className={isPythonOnline ? 'text-[#38BDF8]' : 'text-[#64748B]'} />
            <span className={`w-1.5 h-1.5 rounded-full ${isPythonOnline ? 'bg-[#38BDF8] animate-pulse' : 'bg-white/20'}`} />
            <span className="hidden lg:inline">{isPythonOnline ? 'Py Engine 3.12' : 'Py Standby'}</span>
          </div>
        </div>

        {/* Center: Dynamic Island Capsule */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsIslandExpanded(!isIslandExpanded)}
            className="dynamic-island-capsule flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs text-white hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8] animate-pulse" />
            <span className="font-mono-data font-medium text-[11px] text-[#F8FAFC] truncate max-w-[200px] sm:max-w-[320px] md:max-w-[400px]">
              {atRiskTasks.length > 0 
                ? `⚡ ${atRiskTasks.length} At-Risk Tasks • Rebalancing Recommended`
                : pendingRecommendations.length > 0
                  ? `✨ ${pendingRecommendations.length} Autonomous Proposals Ready`
                  : `All Systems Nominal • ${employees.length} Engineers • ${tasks.length} Work Orders`}
            </span>
            <ChevronDown size={12} className={`text-[#38BDF8] transition-transform ${isIslandExpanded ? 'rotate-180' : ''}`} />
          </button>

          {/* Dynamic Island Quick Action Dropdown */}
          <AnimatePresence>
            {isIslandExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-80 p-3 rounded-2xl bg-[#0F172A]/98 backdrop-blur-xl border border-[#38BDF8]/30 shadow-2xl z-50 text-white"
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                  <span className="font-semibold text-[#38BDF8]">Neural Operations Pilot</span>
                  <span className="text-[10px] text-white/50 font-mono-data">Python 3.12 Engine</span>
                </div>

                <div className="py-2.5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#F8FAFC]">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-[#34D399]" />
                      SLA Protection Status
                    </span>
                    <span className="font-mono-data font-bold text-[#34D399]">
                      {atRiskTasks.length === 0 ? 'Optimal' : `${atRiskTasks.length} Guarded`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#F8FAFC]">
                    <span className="flex items-center gap-1.5">
                      <Activity size={13} className="text-[#38BDF8]" />
                      Pending Proposals
                    </span>
                    <span className="font-mono-data font-bold text-[#38BDF8]">
                      {pendingRecommendations.length}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      optimizeAll();
                      setIsIslandExpanded(false);
                    }}
                    disabled={isAIOptimizing}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0369A1] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:brightness-110 transition-all border border-[#38BDF8]/40"
                  >
                    <Zap size={13} />
                    {isAIOptimizing ? 'Computing...' : 'Run Python Optimization'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Create Task */}
          <button
            type="button"
            onClick={() => toggleCreateTaskModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#0284C7] text-white hover:bg-[#0369A1] text-xs font-semibold shadow-[0_2px_8px_rgba(2,132,199,0.3)] border border-[#38BDF8]/40 transition-all"
            title="Create Real Work Order"
          >
            <Plus size={13} />
            <span className="hidden sm:inline">Work Order</span>
          </button>

          {/* Quick Add Employee */}
          <button
            type="button"
            onClick={() => toggleCreateEmployeeModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#131C33] border border-[#1D2D4A] text-white hover:bg-[#1A2644] text-xs font-medium transition-all"
            title="Register Engineer"
          >
            <UserPlus size={13} className="text-[#38BDF8]" />
            <span className="hidden md:inline">Engineer</span>
          </button>

          {/* 1-Click Autonomous Optimization */}
          <button
            type="button"
            onClick={() => optimizeAll()}
            disabled={isAIOptimizing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isAIOptimizing
                ? 'bg-[#0284C7]/50 text-white cursor-wait'
                : 'bg-gradient-to-r from-[#0284C7] to-[#0369A1] text-white shadow-[0_2px_12px_rgba(2,132,199,0.4)] hover:brightness-110 active:translate-y-0.5 border border-[#38BDF8]/40'
            }`}
            title="Run 7-factor rebalancing optimization"
          >
            <Zap size={13} className={isAIOptimizing ? 'animate-spin' : 'fill-current text-[#38BDF8]'} />
            <span className="hidden lg:inline">{isAIOptimizing ? 'Solving...' : 'Rebalance'}</span>
          </button>

          {/* Region Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRegionMenuOpen(!isRegionMenuOpen)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-[#0F172A] border border-[#1D2D4A] text-[#F8FAFC] hover:border-[#38BDF8] transition-all font-mono-data"
            >
              <Globe size={13} className="text-[#38BDF8]" />
              <span className="font-semibold hidden xl:inline">{selectedRegion}</span>
              <ChevronDown size={12} className="text-[#38BDF8]" />
            </button>

            {isRegionMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-[#0F172A]/98 backdrop-blur-xl border border-[#1D2D4A] shadow-2xl p-1 z-50 text-white">
                {regions.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSelectedRegion(r);
                      setIsRegionMenuOpen(false);
                    }}
                    className={`w-full text-left text-xs px-3 py-1.5 rounded-lg font-mono-data transition-colors ${
                      selectedRegion === r
                        ? 'bg-[#0284C7] text-white font-semibold'
                        : 'text-[#94A3B8] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Role Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl bg-[#0F172A] border border-[#1D2D4A] text-[#F8FAFC] hover:border-[#38BDF8] transition-all font-mono-data"
            >
              <UserCheck size={13} className="text-[#38BDF8]" />
              <span className="font-semibold hidden xl:inline truncate max-w-[90px]">{currentUser.role}</span>
              <ChevronDown size={12} className="text-[#38BDF8]" />
            </button>

            {isRoleMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-[#0F172A]/98 backdrop-blur-xl border border-[#1D2D4A] shadow-2xl p-1 z-50 text-white">
                <div className="px-2.5 py-1 text-[10px] font-mono-data text-[#38BDF8] uppercase font-semibold border-b border-white/10">
                  Switch Active Persona
                </div>
                {roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setRole(role);
                      setIsRoleMenuOpen(false);
                    }}
                    className={`w-full text-left text-xs px-3 py-1.5 rounded-lg font-mono-data transition-colors ${
                      currentUser.role === role
                        ? 'bg-[#0284C7] text-white font-semibold'
                        : 'text-[#94A3B8] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Command Palette Trigger */}
          <button
            type="button"
            onClick={() => toggleCommandPalette(true)}
            className="p-2 rounded-xl bg-[#0F172A] border border-[#1D2D4A] text-[#38BDF8] hover:border-[#38BDF8] transition-all"
            title="Search & Quick Actions (⌘K)"
          >
            <Search size={14} />
          </button>

          {/* Notifications Drawer */}
          <button
            type="button"
            onClick={() => toggleNotifications(true)}
            className="relative p-2 rounded-xl bg-[#0F172A] border border-[#1D2D4A] text-[#38BDF8] hover:border-[#38BDF8] transition-all"
            title="Notifications"
          >
            <Bell size={14} />
            {pendingRecommendations.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {pendingRecommendations.length}
              </span>
            )}
          </button>

          {/* Traffic Light */}
          <TrafficLight isAIOptimizing={isAIOptimizing} />
        </div>
      </div>
    </header>
  );
};
