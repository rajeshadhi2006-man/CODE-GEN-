import React, { useState, useEffect } from 'react';
import { useNexusStore } from './store/useNexusStore';
import { DynamicIslandHeader } from './components/layout/DynamicIslandHeader';
import { Sidebar } from './components/layout/Sidebar';
import { SplitWorkstation, renderModuleComponent } from './components/layout/SplitWorkstation';
import { QuickActionHUD } from './components/layout/QuickActionHUD';
import { CommandPalette } from './components/layout/CommandPalette';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { ExplainabilityModal } from './components/modules/explainability/ExplainabilityModal';
import { CreateTaskModal } from './components/modules/tasks/CreateTaskModal';
import { CreateEmployeeModal } from './components/modules/workforce/CreateEmployeeModal';
import { SpatialBackground3D } from './components/ui/SpatialBackground3D';
import { RefreshCw } from 'lucide-react';

export function App() {
  const { 
    activeTab, 
    secondaryTab,
    isSplitView,
    isLoading, 
    initializeSupabaseSync,
    setActiveTab,
    toggleSplitView,
    toggleQuickHud
  } = useNexusStore();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    initializeSupabaseSync();
  }, [initializeSupabaseSync]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === '1') {
        setActiveTab('command-center');
      } else if (e.key === '2') {
        setActiveTab('tasks');
      } else if (e.key === '3') {
        setActiveTab('workforce');
      } else if (e.key === '4') {
        setActiveTab('simulation');
      } else if (e.key === '\\') {
        e.preventDefault();
        toggleSplitView();
      } else if (e.key === ' ') {
        e.preventDefault();
        toggleQuickHud(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab, toggleSplitView, toggleQuickHud]);

  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-[var(--text-primary)] flex flex-col antialiased selection:bg-[var(--accent)] selection:text-white relative overflow-hidden">
      {/* 3D Moving Animated Neural Background */}
      <SpatialBackground3D />

      {/* Top Futuristic Dynamic Island Header */}
      <DynamicIslandHeader />

      {/* Main Workstation Layout: Left Full-View Sidebar + Main Canvas */}
      <div className="flex-1 flex overflow-hidden h-[calc(100vh-3.5rem)] relative z-10">
        {/* Left Side Full-View Form Navigation */}
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />

        {/* Workstation Main Workspace */}
        <main className="flex-1 overflow-y-auto custom-scroll w-full bg-transparent">
          <div className="max-w-[1680px] mx-auto p-4 sm:p-6 space-y-4">
            {/* Loading Skeleton or Active Workstation View */}
            {isLoading ? (
              <div className="space-y-4 py-16">
                <div className="flex items-center justify-center gap-2.5 text-sm text-[var(--accent)] font-mono-data animate-pulse">
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Connecting to Supabase & Synchronizing Neural Enterprise Pipeline...</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-28 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--hairline)] animate-pulse" />
                  ))}
                </div>
              </div>
            ) : isSplitView ? (
              /* Split Workstation Dual View Mode */
              <SplitWorkstation primaryTab={activeTab} secondaryTab={secondaryTab} />
            ) : (
              /* Single Focus Full-Screen Workstation */
              <div className="w-full transition-all duration-300">
                {renderModuleComponent(activeTab)}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Tactical Quick Action HUD */}
      <QuickActionHUD />

      {/* Global Modals & Overlays */}
      <ExplainabilityModal />
      <CommandPalette />
      <NotificationDrawer />
      <CreateTaskModal />
      <CreateEmployeeModal />
    </div>
  );
}

export default App;
