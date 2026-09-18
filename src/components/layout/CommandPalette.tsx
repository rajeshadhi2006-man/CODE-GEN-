import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  User, 
  CheckSquare, 
  FolderKanban, 
  AlertTriangle, 
  Sparkles, 
  Sliders, 
  FileText,
  ArrowRight
} from 'lucide-react';
import { useNexusStore } from '../../store/useNexusStore';

export const CommandPalette: React.FC = () => {
  const { 
    isCommandPaletteOpen, 
    toggleCommandPalette, 
    tasks, 
    employees, 
    projects, 
    setActiveTab,
    triggerDisruption,
    optimizeAll,
    openExplainModal
  } = useNexusStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Hotkey listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette]);

  if (!isCommandPaletteOpen) return null;

  const q = query.toLowerCase().trim();

  // Search results
  const matchingTasks = tasks.filter(t => 
    t.code.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
  ).slice(0, 4);

  const matchingEmployees = employees.filter(e => 
    e.id.toLowerCase().includes(q) || e.name.toLowerCase().includes(q) || e.title.toLowerCase().includes(q)
  ).slice(0, 4);

  const matchingProjects = projects.filter(p => 
    p.name.toLowerCase().includes(q)
  ).slice(0, 3);

  const systemActions = [
    { 
      id: 'act-disrupt', 
      label: 'Simulate Employee Absence (E-023 Disruption)', 
      icon: AlertTriangle,
      action: () => triggerDisruption('E-023')
    },
    { 
      id: 'act-opt', 
      label: 'Run Autonomous AI Optimization on All At-Risk Tasks', 
      icon: Sparkles,
      action: () => optimizeAll()
    },
    { 
      id: 'act-report', 
      label: 'Open Executive Operational Brief & PDF Export', 
      icon: FileText,
      action: () => setActiveTab('executive-report')
    },
    { 
      id: 'act-admin', 
      label: 'Open Admin Scoring Weight Configuration', 
      icon: Sliders,
      action: () => setActiveTab('admin')
    },
  ].filter(a => a.label.toLowerCase().includes(q));

  const allItems = [
    ...systemActions.map(a => ({ type: 'action' as const, data: a })),
    ...matchingTasks.map(t => ({ type: 'task' as const, data: t })),
    ...matchingEmployees.map(e => ({ type: 'employee' as const, data: e })),
    ...matchingProjects.map(p => ({ type: 'project' as const, data: p })),
  ];

  const handleSelect = (item: typeof allItems[0]) => {
    if (!item) return;
    if (item.type === 'action') {
      item.data.action();
    } else if (item.type === 'task') {
      setActiveTab('live-allocation');
      openExplainModal(item.data.id);
    } else if (item.type === 'employee') {
      setActiveTab('workforce');
    } else if (item.type === 'project') {
      setActiveTab('projects');
    }
    toggleCommandPalette(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => toggleCommandPalette(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-[16px]"
        />

        {/* Palette Card */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: -10 }}
          transition={{ type: "spring", stiffness: 440, damping: 30 }}
          className="relative w-full max-w-2xl glass-modal rounded-[16px] shadow-2xl border border-[var(--hairline-strong)] overflow-hidden z-10 flex flex-col"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--hairline)] bg-[var(--bg-panel)]/50">
            <Search size={18} className="text-[var(--accent)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks (T-104), employees (Marcus), projects, or actions..."
              className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none"
              autoFocus
            />
            <kbd className="text-[11px] px-1.5 py-0.5 rounded bg-white/10 font-mono-data text-[var(--text-tertiary)]">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-96 overflow-y-auto p-2 space-y-1 custom-scroll">
            {allItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-tertiary)]">
                No matching tasks, personnel, or commands found for "{query}".
              </div>
            ) : (
              allItems.map((item, idx) => {
                const isSel = idx === selectedIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-[10px] flex items-center justify-between text-xs transition-colors ${
                      isSel ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {item.type === 'action' && <item.data.icon size={16} className={isSel ? 'text-white' : 'text-[var(--accent)]'} />}
                      {item.type === 'task' && <CheckSquare size={16} className={isSel ? 'text-white' : 'text-[#64D2FF]'} />}
                      {item.type === 'employee' && <User size={16} className={isSel ? 'text-white' : 'text-[#30D158]'} />}
                      {item.type === 'project' && <FolderKanban size={16} className={isSel ? 'text-white' : 'text-[#FFD60A]'} />}

                      <div className="truncate">
                        {item.type === 'action' && <span>{item.data.label}</span>}
                        {item.type === 'task' && (
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-mono-data font-semibold">{item.data.code}</span>
                            <span className="truncate">{item.data.name}</span>
                          </div>
                        )}
                        {item.type === 'employee' && (
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-mono-data font-semibold">{item.data.id}</span>
                            <span>{item.data.name}</span>
                            <span className="opacity-60 text-[11px] truncate">({item.data.title})</span>
                          </div>
                        )}
                        {item.type === 'project' && <span>{item.data.name}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-60 text-[10px] font-mono-data">
                      <span className="capitalize">{item.type}</span>
                      <ArrowRight size={12} />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
