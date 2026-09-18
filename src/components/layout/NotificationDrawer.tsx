import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Bell, AlertTriangle, Sparkles, CheckCircle2, Mail, RefreshCw, Send, Lock } from 'lucide-react';
import { useNexusStore } from '../../store/useNexusStore';
import { Button } from '../ui/Button';
import { getNotificationOutbox, EmailDispatchRecord } from '../../services/pythonApiService';

export const NotificationDrawer: React.FC = () => {
  const { 
    isNotificationsOpen, 
    toggleNotifications, 
    notifications, 
    markNotificationsRead
  } = useNexusStore();

  const [activeTab, setActiveDrawerTab] = useState<'alerts' | 'smtp'>('alerts');
  const [outbox, setOutbox] = useState<EmailDispatchRecord[]>([]);
  const [isLoadingOutbox, setIsLoadingOutbox] = useState(false);

  const fetchOutbox = async () => {
    setIsLoadingOutbox(true);
    try {
      const records = await getNotificationOutbox(20);
      setOutbox(records);
    } catch {
      // fallback
    } finally {
      setIsLoadingOutbox(false);
    }
  };

  useEffect(() => {
    if (isNotificationsOpen && activeTab === 'smtp') {
      fetchOutbox();
    }
  }, [isNotificationsOpen, activeTab]);

  if (!isNotificationsOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Critical':
        return <AlertTriangle size={15} className="text-[#FF453A]" />;
      case 'SLA':
        return <AlertTriangle size={15} className="text-[#FF9F0A]" />;
      case 'AI Recommendation':
        return <Sparkles size={15} className="text-[var(--accent-glow)]" />;
      case 'Approval':
        return <CheckCircle2 size={15} className="text-[#30D158]" />;
      default:
        return <Bell size={15} className="text-[#64D2FF]" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => toggleNotifications(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-[10px]"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: 420 }}
          animate={{ x: 0 }}
          exit={{ x: 420 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          className="relative w-[420px] h-full glass-modal border-l border-[var(--hairline-strong)] flex flex-col z-10 shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-[var(--hairline)] flex items-center justify-between bg-[var(--bg-panel)]/60">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-[var(--accent)]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Notification Center
              </h3>
            </div>

            <div className="flex items-center gap-1">
              {activeTab === 'alerts' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markNotificationsRead}
                  icon={<Check size={13} />}
                  className="text-xs"
                >
                  Clear
                </Button>
              )}
              {activeTab === 'smtp' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchOutbox}
                  disabled={isLoadingOutbox}
                  icon={<RefreshCw size={13} className={isLoadingOutbox ? 'animate-spin' : ''} />}
                  className="text-xs"
                >
                  Refresh
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleNotifications(false)}
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex border-b border-[var(--hairline)] bg-[var(--bg-panel)]/40 px-3 pt-2">
            <button
              onClick={() => setActiveDrawerTab('alerts')}
              className={`pb-2 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'alerts'
                  ? 'border-[var(--accent)] text-white'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              <Bell size={13} />
              System Alerts
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 font-mono-data">
                {notifications.length}
              </span>
            </button>
            <button
              onClick={() => {
                setActiveDrawerTab('smtp');
                fetchOutbox();
              }}
              className={`pb-2 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'smtp'
                  ? 'border-[var(--accent)] text-white'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              <Mail size={13} className="text-sky-400" />
              SMTP Email Outbox
              {outbox.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 font-mono-data">
                  {outbox.length}
                </span>
              )}
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scroll">
            {activeTab === 'alerts' ? (
              notifications.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--text-tertiary)]">
                  No active notifications.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-[12px] border transition-all ${
                      n.read 
                        ? 'bg-[var(--bg-elevated)]/50 border-[var(--hairline)] text-[var(--text-secondary)]'
                        : 'bg-[var(--bg-elevated)] border-[var(--accent)]/30 text-[var(--text-primary)] shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="shrink-0 mt-0.5">{getCategoryIcon(n.category)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-semibold truncate">{n.title}</span>
                          <span className="text-[10px] font-mono-data text-[var(--text-tertiary)] shrink-0">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              /* SMTP Outbox View */
              outbox.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--text-tertiary)] space-y-2">
                  <Mail className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p>No assignment emails dispatched yet.</p>
                  <p className="text-[11px] text-slate-500">
                    Assign a task or approve an AI proposal to trigger automated SMTP delivery.
                  </p>
                </div>
              ) : (
                outbox.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 rounded-[12px] bg-[var(--bg-elevated)] border border-[rgba(56,189,248,0.2)] text-white space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
                        <Send size={12} />
                        <span className="truncate">{msg.task_name}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {msg.status.includes('Delivered') ? 'SMTP DELIVERED' : 'OUTBOX DISPATCHED'}
                      </span>
                    </div>

                    <div className="p-2 rounded bg-slate-900/70 border border-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Recipient:</span>
                        <span className="font-semibold text-white flex items-center gap-1">
                          <Lock size={10} className="text-sky-400" />
                          {msg.recipient_name} &lt;{msg.recipient_email}&gt;
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        <span className="text-slate-500">Subject: </span>
                        {msg.subject}
                      </div>
                      <div className="text-[9px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800">
                        <span>Gateway: {msg.smtp_host || 'Live SMTP'}</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

