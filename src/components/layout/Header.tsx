import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Sparkles, 
  Globe, 
  ChevronDown, 
  UserCheck, 
  Layers,
  Database,
  Cpu
} from 'lucide-react';
import { useNexusStore } from '../../store/useNexusStore';
import { TrafficLight } from '../ui/TrafficLight';
import { Button } from '../ui/Button';
import { UserRole } from '../../data/types';

export const Header: React.FC = () => {
  const { 
    currentUser, 
    setRole, 
    selectedRegion, 
    setSelectedRegion, 
    isAIOptimizing,
    notifications,
    isRealTimeActive,
    toggleRealTime,
    toggleCommandPalette,
    toggleNotifications,
    isSupabaseConnected,
    isPythonOnline,
    pythonVersion
  } = useNexusStore();

  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isRegionMenuOpen, setIsRegionMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const roles: UserRole[] = [
    'Super Admin',
    'Workforce Manager',
    'Project Manager',
    'Team Lead',
    'Employee',
    'Executive'
  ];

  const regions = ['All', 'Americas', 'EMEA', 'APAC', 'South Asia', 'LATAM'];

  return (
    <header className="sticky top-0 z-30 h-14 w-full bg-gradient-to-r from-[#202646] via-[#2A325A] to-[#202646] border-b border-[#1A1F38] px-4 flex items-center justify-between select-none shadow-[0_4px_24px_rgba(20,25,48,0.45),inset_0_1px_0_rgba(255,255,255,0.1)]">
      {/* Left: Brand Identity & Workspace Pickers */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-[#874EE3] to-[#333D6D] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(114,62,195,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] border border-[#9865E8]/30">
            <Layers size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wider text-[#FFF0D9] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                NEXUS
              </span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-[4px] bg-[#333D6D] text-[#FFCF95] font-mono-data font-bold border border-[#48537D]/50 shadow-inner">
                OS v2.4
              </span>
            </div>
          </div>
        </div>

        <div className="h-4 w-px bg-[#333D6D]" />

        {/* Global Delivery Org selector */}
        <div className="flex items-center gap-1.5 text-xs text-[#FFF0D9]/85 hover:text-white cursor-pointer px-2.5 py-1 rounded-[6px] hover:bg-[#333D6D] transition-all">
          <span className="font-medium">Global Delivery Ops</span>
          <ChevronDown size={13} />
        </div>

        {/* Region Filter Selector */}
        <div className="relative">
          <button
            onClick={() => setIsRegionMenuOpen(!isRegionMenuOpen)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-[8px] bg-[#1E2442] border border-[#3A4577] text-[#FFF0D9] hover:border-[#723EC3] transition-all font-mono-data shadow-[0_1.5px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            <Globe size={13} className="text-[#FFCF95]" />
            <span className="font-semibold">Region: {selectedRegion}</span>
            <ChevronDown size={13} className="text-[#FFCF95]" />
          </button>

          {isRegionMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-36 rounded-[10px] glass-modal shadow-2xl p-1 z-50">
              {regions.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setSelectedRegion(r);
                    setIsRegionMenuOpen(false);
                  }}
                  className={`w-full text-left text-xs px-3 py-1.5 rounded-[6px] font-mono-data transition-colors ${
                    selectedRegion === r
                      ? 'bg-[#723EC3] text-white font-semibold'
                      : 'text-[#1D2447] hover:bg-[#FFF0D9]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <button
        onClick={() => toggleCommandPalette(true)}
        className="hidden md:flex items-center gap-3 w-80 px-3.5 py-1.5 rounded-full bg-[#1A203B] border border-[#3A4577] text-xs text-[#FFF0D9]/80 hover:border-[#723EC3] hover:text-white transition-all shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.35)] group"
      >
        <Search size={14} className="group-hover:text-[#FFCF95] text-[#FFCF95] transition-colors" />
        <span className="flex-1 text-left">Search resources, tasks (⌘K)...</span>
        <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-[#2E3661] border border-[#48537D] font-mono-data text-[#FFCF95] shadow-sm">
          ⌘K
        </kbd>
      </button>

      {/* Right: Real-time Telemetry, Traffic Light, Notifications, Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Supabase Realtime Database Telemetry Status */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-xs font-mono-data border bg-[#1E9E4A]/15 border-[#1E9E4A]/40 text-[#85E39C] select-none shadow-[0_1.5px_3px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(133,227,156,0.2)] font-semibold"
          title="Supabase Integrated & Synchronized in Realtime"
        >
          <Database size={13} />
          <span className="w-1.5 h-1.5 rounded-full bg-[#85E39C] animate-pulse" />
          <span>Supabase Live</span>
        </div>

        {/* Python FastAPI AI Engine Telemetry Status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-xs font-mono-data border select-none shadow-[0_1.5px_3px_rgba(0,0,0,0.25)] font-semibold transition-all ${
            isPythonOnline
              ? 'bg-[#723EC3]/25 border-[#723EC3]/60 text-[#D8B4FE] shadow-[inset_0_1px_0_rgba(216,180,254,0.3)]'
              : 'bg-[#1E2442] border-[#3A4577] text-[#7580AA]'
          }`}
          title={isPythonOnline ? `Python ${pythonVersion || '3.12'} FastAPI AI Engine Connected on :8000` : 'Python Backend Offline (Falling back to TS)'}
        >
          <Cpu size={13} className={isPythonOnline ? 'text-[#FFCF95]' : 'text-[#7580AA]'} />
          <span className={`w-1.5 h-1.5 rounded-full ${isPythonOnline ? 'bg-[#FFCF95] animate-pulse' : 'bg-white/20'}`} />
          <span>{isPythonOnline ? 'Python 3.12 Live' : 'Py Engine Standby'}</span>
        </div>

        {/* Real-time Ticker Engine Toggle */}
        <button
          onClick={() => toggleRealTime()}
          className={`flex items-center gap-2 px-2.5 py-1 rounded-[8px] text-xs font-mono-data border transition-all font-semibold ${
            isRealTimeActive 
              ? 'bg-[#1E9E4A]/15 border-[#1E9E4A]/40 text-[#85E39C] shadow-[0_1.5px_3px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(133,227,156,0.2)]' 
              : 'bg-[#1E2442] border-[#3A4577] text-[#FFCF95] shadow-[0_1.5px_3px_rgba(0,0,0,0.25)]'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isRealTimeActive ? 'bg-[#1E9E4A] animate-pulse' : 'bg-white/30'}`} />
          <span>{isRealTimeActive ? 'REAL-TIME LIVE' : 'STREAM PAUSED'}</span>
        </button>

        {/* Single Traffic Light Repurposed Motif */}
        <TrafficLight isAIOptimizing={isAIOptimizing} />

        {/* Notifications */}
        <button
          onClick={() => toggleNotifications()}
          className="relative p-2 rounded-[8px] text-[#FFF0D9]/85 hover:text-white hover:bg-[#333D6D] transition-colors"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#D9383A] ring-2 ring-[#2A325A] animate-pulse" />
          )}
        </button>

        <div className="h-4 w-px bg-[#333D6D]" />

        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-[8px] bg-[#1E2442] border border-[#3A4577] hover:border-[#723EC3] transition-all text-xs shadow-[0_1.5px_3px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            <UserCheck size={14} className="text-[#FFCF95]" />
            <div className="text-left">
              <span className="text-[10px] text-[#FFCF95] block leading-none">Role View</span>
              <span className="font-medium text-[#FFF0D9] leading-none">{currentUser.role}</span>
            </div>
            <ChevronDown size={13} className="text-[#FFCF95] ml-1" />
          </button>

          {isRoleMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-52 rounded-[12px] glass-modal shadow-2xl p-1.5 z-50">
              <div className="px-2.5 py-1.5 text-[11px] font-medium text-[#48537D] uppercase tracking-wider">
                Switch Perspective
              </div>
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setRole(role);
                    setIsRoleMenuOpen(false);
                  }}
                  className={`w-full text-left text-xs px-3 py-2 rounded-[8px] transition-colors flex items-center justify-between ${
                    currentUser.role === role
                      ? 'bg-[#723EC3] text-white font-semibold'
                      : 'text-[#1D2447] hover:bg-[#FFF0D9]'
                  }`}
                >
                  <span>{role}</span>
                  {currentUser.role === role && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden border border-[#FFCF95] shrink-0">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="w-full h-full object-cover" 
          />
        </div>
      </div>
    </header>
  );
};
