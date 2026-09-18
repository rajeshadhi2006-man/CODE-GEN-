import React from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  ArrowLeftRight, 
  Maximize2, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useNexusStore } from '../../store/useNexusStore';
import { WORKSPACE_GROUPS } from './SpatialDock';

// Feature Modules
import { CommandCenter } from '../modules/command-center/CommandCenter';
import { LiveAllocation } from '../modules/live-allocation/LiveAllocation';
import { SlaRiskCenter } from '../modules/sla-risk/SlaRiskCenter';
import { SimulationLab } from '../modules/simulation/SimulationLab';
import { Workforce360 } from '../modules/workforce/Workforce360';
import { SkillIntelligence } from '../modules/skills/SkillIntelligence';
import { WorkloadHeatmap } from '../modules/heatmap/WorkloadHeatmap';
import { ProjectsDashboard } from '../modules/projects/ProjectsDashboard';
import { TaskIntelligence } from '../modules/tasks/TaskIntelligence';
import { DependencyEngine } from '../modules/dependency/DependencyEngine';
import { GlobalWorkforceMap } from '../modules/world-map/GlobalWorkforceMap';
import { ApprovalsInbox } from '../modules/approvals/ApprovalsInbox';
import { AnalyticsView } from '../modules/analytics/AnalyticsView';
import { GovernanceView } from '../modules/governance/GovernanceView';
import { AuditTrail } from '../modules/audit/AuditTrail';
import { AdminControlCenter } from '../modules/admin/AdminControlCenter';
import { ExecutiveReport } from '../modules/executive-report/ExecutiveReport';

interface SplitWorkstationProps {
  primaryTab: string;
  secondaryTab: string;
}

export const renderModuleComponent = (tab: string) => {
  switch (tab) {
    case 'command-center':
      return <CommandCenter />;
    case 'live-allocation':
      return <LiveAllocation />;
    case 'sla-risk':
      return <SlaRiskCenter />;
    case 'simulation':
      return <SimulationLab />;
    case 'workforce':
      return <Workforce360 />;
    case 'skills':
      return <SkillIntelligence />;
    case 'heatmap':
      return <WorkloadHeatmap />;
    case 'projects':
      return <ProjectsDashboard />;
    case 'tasks':
      return <TaskIntelligence />;
    case 'dependency':
      return <DependencyEngine />;
    case 'world-map':
      return <GlobalWorkforceMap />;
    case 'approvals':
      return <ApprovalsInbox />;
    case 'analytics':
      return <AnalyticsView />;
    case 'governance':
      return <GovernanceView />;
    case 'audit':
      return <AuditTrail />;
    case 'admin':
      return <AdminControlCenter />;
    case 'executive-report':
      return <ExecutiveReport />;
    default:
      return <CommandCenter />;
  }
};

const allTabsList = WORKSPACE_GROUPS.flatMap(g => g.tabs);

export const SplitWorkstation: React.FC<SplitWorkstationProps> = ({
  primaryTab,
  secondaryTab
}) => {
  const { 
    setActiveTab, 
    setSecondaryTab, 
    toggleSplitView 
  } = useNexusStore();

  const [isPrimarySelectorOpen, setIsPrimarySelectorOpen] = React.useState(false);
  const [isSecondarySelectorOpen, setIsSecondarySelectorOpen] = React.useState(false);

  const primaryLabel = allTabsList.find(t => t.id === primaryTab)?.label || 'Primary Workspace';
  const secondaryLabel = allTabsList.find(t => t.id === secondaryTab)?.label || 'Secondary Workspace';

  const handleSwapPanes = () => {
    const temp = primaryTab;
    setActiveTab(secondaryTab);
    setSecondaryTab(temp);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-8.5rem)] min-h-[700px] w-full pb-8">
      {/* Left Pane (Primary Workspace) */}
      <motion.div 
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        className="split-workstation-pane relative"
      >
        {/* Pane Toolbar */}
        <div className="px-4 py-2.5 bg-[#0F172A] border-b border-[#1D2D4A] flex items-center justify-between select-none">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPrimarySelectorOpen(!isPrimarySelectorOpen)}
              className="flex items-center gap-2 text-xs font-bold text-[#F8FAFC] px-2.5 py-1 rounded-lg bg-[#162340] border border-[#1D2D4A] hover:border-[#38BDF8] transition-colors"
            >
              <Sparkles size={13} className="text-[#38BDF8]" />
              <span>Left Pane: {primaryLabel}</span>
              <ChevronDown size={12} className="text-[#94A3B8]" />
            </button>

            {isPrimarySelectorOpen && (
              <div className="absolute left-0 mt-1 w-56 max-h-64 overflow-y-auto rounded-xl bg-[#0F172A] border border-[#1D2D4A] shadow-2xl p-1 z-50 text-[#F8FAFC]">
                {allTabsList.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(t.id);
                      setIsPrimarySelectorOpen(false);
                    }}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                      primaryTab === t.id ? 'bg-[#0284C7] text-white font-bold' : 'text-[#94A3B8] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <t.icon size={13} />
                    <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleSwapPanes}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors"
              title="Swap Panes"
            >
              <ArrowLeftRight size={13} />
            </button>
            <button
              type="button"
              onClick={toggleSplitView}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors"
              title="Maximize Left Pane (Exit Split View)"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>

        {/* Pane Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[var(--bg-void)]">
          {renderModuleComponent(primaryTab)}
        </div>
      </motion.div>

      {/* Right Pane (Secondary Workspace) */}
      <motion.div 
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        className="split-workstation-pane relative"
      >
        {/* Pane Toolbar */}
        <div className="px-4 py-2.5 bg-[#0F172A] border-b border-[#1D2D4A] flex items-center justify-between select-none">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSecondarySelectorOpen(!isSecondarySelectorOpen)}
              className="flex items-center gap-2 text-xs font-bold text-[#F8FAFC] px-2.5 py-1 rounded-lg bg-[#162340] border border-[#1D2D4A] hover:border-[#38BDF8] transition-colors"
            >
              <Sparkles size={13} className="text-[#38BDF8]" />
              <span>Right Pane: {secondaryLabel}</span>
              <ChevronDown size={12} className="text-[#94A3B8]" />
            </button>

            {isSecondarySelectorOpen && (
              <div className="absolute left-0 mt-1 w-56 max-h-64 overflow-y-auto rounded-xl bg-[#0F172A] border border-[#1D2D4A] shadow-2xl p-1 z-50 text-[#F8FAFC]">
                {allTabsList.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSecondaryTab(t.id);
                      setIsSecondarySelectorOpen(false);
                    }}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                      secondaryTab === t.id ? 'bg-[#0284C7] text-white font-bold' : 'text-[#94A3B8] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <t.icon size={13} />
                    <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleSplitView}
              className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/15 transition-colors"
              title="Close Split View"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Pane Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[var(--bg-void)]">
          {renderModuleComponent(secondaryTab)}
        </div>
      </motion.div>
    </div>
  );
};
