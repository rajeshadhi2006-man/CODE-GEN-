import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Plus,
  UserPlus,
  Columns2,
  ShieldAlert,
  Cpu,
  X,
  Sparkles,
  Command
} from 'lucide-react';
import { useNexusStore } from '../../store/useNexusStore';

export const QuickActionHUD: React.FC = () => {
  const {
    isQuickHudOpen,
    toggleQuickHud,
    toggleCreateTaskModal,
    toggleCreateEmployeeModal,
    optimizeAll,
    isAIOptimizing,
    toggleSplitView,
    setActiveTab,
    isPythonOnline,
    tasks,
    employees
  } = useNexusStore();

  if (!isQuickHudOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#040812]/80 backdrop-blur-md"
          onClick={() => toggleQuickHud(false)}
        />

        {/* HUD Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-xl z-10 rounded-3xl bg-[#0F172A]/98 border border-[#38BDF8]/40 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(56,189,248,0.3)] p-6 text-white overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-[#0284C7]/25 border border-[#38BDF8]/50">
                <Sparkles size={16} className="text-[#38BDF8]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">SPATIAL TACTICAL HUD</h3>
                <p className="text-[11px] text-[#38BDF8]/80 font-mono-data">Dark Blue Autonomous Workstation</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => toggleQuickHud(false)}
              className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Real-Time Live Telemetry Bar */}
          <div className="grid grid-cols-3 gap-3 my-5">
            <div className="p-3 rounded-2xl bg-[#111C35] border border-[#1D2D4A] text-center">
              <div className="text-xl font-bold font-mono-data text-[#38BDF8]">{tasks.length}</div>
              <div className="text-[10px] text-[#94A3B8] font-mono-data uppercase mt-0.5">Active Tasks</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#111C35] border border-[#1D2D4A] text-center">
              <div className="text-xl font-bold font-mono-data text-[#34D399]">{employees.length}</div>
              <div className="text-[10px] text-[#94A3B8] font-mono-data uppercase mt-0.5">Engineers</div>
            </div>
            <div className="p-3 rounded-2xl bg-[#111C35] border border-[#1D2D4A] text-center">
              <div className="text-xl font-bold font-mono-data text-[#818CF8]">
                {isPythonOnline ? '3.12 LIVE' : 'STANDBY'}
              </div>
              <div className="text-[10px] text-[#94A3B8] font-mono-data uppercase mt-0.5">AI Backend</div>
            </div>
          </div>

          {/* Rapid Action Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                toggleQuickHud(false);
                toggleCreateTaskModal(true);
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[#111C35] hover:bg-[#162340] border border-[#1D2D4A] hover:border-[#38BDF8]/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#0284C7]/20 text-[#38BDF8]">
                  <Plus size={16} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-white group-hover:text-[#38BDF8] transition-colors">
                    Dispatch Real Work Order
                  </div>
                  <div className="text-[10px] text-[#94A3B8]">Register task with deadline into live SLA pipeline</div>
                </div>
              </div>
              <kbd className="px-2 py-0.5 rounded text-[10px] font-mono-data bg-black/40 border border-white/10 text-[#38BDF8]">
                N
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => {
                toggleQuickHud(false);
                toggleCreateEmployeeModal(true);
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[#111C35] hover:bg-[#162340] border border-[#1D2D4A] hover:border-[#38BDF8]/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#0284C7]/20 text-[#38BDF8]">
                  <UserPlus size={16} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-white group-hover:text-[#38BDF8] transition-colors">
                    Register Global Engineer
                  </div>
                  <div className="text-[10px] text-[#94A3B8]">Onboard verified staff into workforce database</div>
                </div>
              </div>
              <kbd className="px-2 py-0.5 rounded text-[10px] font-mono-data bg-black/40 border border-white/10 text-[#38BDF8]">
                E
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => {
                toggleQuickHud(false);
                optimizeAll();
              }}
              disabled={isAIOptimizing}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-[#0284C7]/30 to-[#0369A1]/30 hover:from-[#0284C7]/50 hover:to-[#0369A1]/50 border border-[#38BDF8]/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#0284C7] text-white">
                  <Zap size={16} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white group-hover:text-[#38BDF8] transition-colors">
                    Run Python 7-Factor Optimization
                  </div>
                  <div className="text-[10px] text-[#94A3B8]">Solve global workforce rebalancing with Hungarian matching</div>
                </div>
              </div>
              <kbd className="px-2 py-0.5 rounded text-[10px] font-mono-data bg-black/40 border border-white/10 text-[#38BDF8]">
                O
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => {
                toggleQuickHud(false);
                toggleSplitView();
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[#111C35] hover:bg-[#162340] border border-[#1D2D4A] hover:border-[#38BDF8]/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#0284C7]/20 text-[#38BDF8]">
                  <Columns2 size={16} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-white group-hover:text-[#38BDF8] transition-colors">
                    Toggle Split-Screen Workstation
                  </div>
                  <div className="text-[10px] text-[#94A3B8]">Simultaneously operate two modules side-by-side</div>
                </div>
              </div>
              <kbd className="px-2 py-0.5 rounded text-[10px] font-mono-data bg-black/40 border border-white/10 text-[#38BDF8]">
                \
              </kbd>
            </button>
          </div>

          {/* Footer note */}
          <div className="mt-4 pt-3 border-t border-white/10 text-center text-[10px] text-[#64748B] font-mono-data">
            Press ESC to close • Powered by Nexus Autonomous Core
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
