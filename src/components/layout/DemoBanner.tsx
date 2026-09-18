import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw, 
  ArrowRight, 
  FileText, 
  HelpCircle 
} from 'lucide-react';
import { useNexusStore } from '../../store/useNexusStore';
import { Button } from '../ui/Button';

export const DemoBanner: React.FC = () => {
  const { 
    demoStep, 
    advanceDemoBeat, 
    resetToInitialSeed, 
    openExplainModal, 
    recommendations,
    tasks,
    employees,
    clearAllData,
    seedRealisticLiveBatch,
    toggleCreateTaskModal,
    toggleCreateEmployeeModal,
    setActiveTab 
  } = useNexusStore();

  const activeRec = recommendations[0];
  const t104 = tasks.find(t => t.code === 'T-104');

  return (
    <div className="w-full bg-[var(--bg-elevated)] border-b border-[var(--hairline)] px-4 py-2.5 flex items-center justify-between shadow-sm relative z-10 select-none">
      {/* Beat State Description */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono-data px-2 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] uppercase font-semibold">
          Guided Demo Script
        </span>

        <AnimatePresence mode="wait">
          {demoStep === 0 && (
            <motion.div
              key="beat0"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"
            >
              <span>Beat 1: Baseline Command Center established. Ready to simulate operational disruption.</span>
            </motion.div>
          )}

          {demoStep === 1 && (
            <motion.div
              key="beat1"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-2 text-xs text-[#FF9F0A]"
            >
              <AlertTriangle size={15} className="text-[#FF453A] animate-bounce" />
              <span className="font-semibold text-white">DISRUPTION DETECTED:</span>
              <span>E-023 (Priya Nair) unavailable. 3 critical tasks impacted. SLA risk spikes 64% → 94%.</span>
            </motion.div>
          )}

          {demoStep === 2 && (
            <motion.div
              key="beat2"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-2 text-xs text-[var(--accent-glow)]"
            >
              <Sparkles size={15} className="animate-spin text-[var(--accent-glow)]" />
              <span className="font-semibold">AI OPTIMIZATION RUNNING…</span>
              <span>Evaluating 350+ candidate profiles, skills, workloads, and SLA safety buffers.</span>
            </motion.div>
          )}

          {demoStep === 3 && (
            <motion.div
              key="beat3"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-2 text-xs text-white"
            >
              <span className="px-1.5 py-0.5 rounded bg-[#30D158]/20 text-[#30D158] font-mono-data text-[10px] font-bold">
                OPTIMAL MATCH
              </span>
              <span>T-104 Proposal: Reallocate <strong className="text-white">E-023 → E-017 (Marcus Vance)</strong>. Projected SLA Risk: <span className="text-[#FF453A] line-through font-mono-data">94%</span> → <span className="text-[#30D158] font-mono-data font-bold">41%</span></span>
            </motion.div>
          )}

          {demoStep >= 4 && (
            <motion.div
              key="beat4"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-2 text-xs text-[#30D158]"
            >
              <CheckCircle2 size={16} />
              <span className="font-semibold text-white">AI successfully stabilized the workforce.</span>
              <span className="text-[var(--text-secondary)]">SLA compliance recovered to 97.2%, at-risk tasks reduced to 5.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {demoStep === 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={advanceDemoBeat}
            icon={<AlertTriangle size={14} />}
          >
            Simulate Employee Unavailable (E-023)
          </Button>
        )}

        {demoStep === 1 && (
          <Button
            variant="filled"
            size="sm"
            onClick={advanceDemoBeat}
            icon={<Sparkles size={14} className="text-[var(--accent-glow)]" />}
          >
            Run AI Optimization
          </Button>
        )}

        {demoStep === 3 && activeRec && (
          <>
            <Button
              variant="bordered"
              size="sm"
              icon={<HelpCircle size={14} />}
              onClick={() => {
                if (t104) openExplainModal(t104.id, activeRec.id);
              }}
            >
              Explain Decision
            </Button>
            <Button
              variant="filled"
              size="sm"
              icon={<CheckCircle2 size={14} />}
              onClick={advanceDemoBeat}
            >
              Approve Reallocation
            </Button>
          </>
        )}

        {demoStep >= 4 && (
          <Button
            variant="tinted"
            size="sm"
            icon={<FileText size={14} />}
            onClick={() => setActiveTab('audit')}
          >
            View Audit Log
          </Button>
        )}

        {/* Real-time CRUD quick action buttons */}
        <div className="h-4 w-px bg-[var(--hairline-strong)] mx-1" />

        <Button
          variant="tinted"
          size="sm"
          onClick={() => toggleCreateTaskModal(true)}
          className="text-xs"
        >
          + Add Real Task
        </Button>

        <Button
          variant="bordered"
          size="sm"
          onClick={() => toggleCreateEmployeeModal(true)}
          className="text-xs"
        >
          + Add Person
        </Button>

        {employees.length === 0 ? (
          <Button
            variant="filled"
            size="sm"
            onClick={seedRealisticLiveBatch}
            className="text-xs"
          >
            Load Live Team
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllData}
            title="Clear all tasks and personnel to work from a completely blank real-time state"
            className="text-xs text-[var(--text-tertiary)] hover:text-[#FF453A]"
          >
            Clear to Blank
          </Button>
        )}

        {demoStep > 0 && (
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw size={13} />}
            onClick={resetToInitialSeed}
            title="Reset demo scenario"
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};
