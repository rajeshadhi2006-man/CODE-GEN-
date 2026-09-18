import React, { useState } from 'react';
import { 
  Sliders, 
  ShieldCheck, 
  Check, 
  AlertTriangle, 
  RotateCcw, 
  Save, 
  Lock,
  Zap 
} from 'lucide-react';
import { useNexusStore } from '../../../store/useNexusStore';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { DEFAULT_WEIGHTS, validateWeights } from '../../../engine/scoring';
import { AllocationWeights } from '../../../data/types';

export const AdminControlCenter: React.FC = () => {
  const { weights, setWeights, currentUser } = useNexusStore();

  const [localWeights, setLocalWeights] = useState<AllocationWeights>({ ...weights });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live sum calculation
  const totalSum = 
    localWeights.skill + 
    localWeights.sla + 
    localWeights.availability + 
    localWeights.workload + 
    localWeights.performance + 
    localWeights.location + 
    localWeights.business_impact;

  const isValidSum = Math.abs(totalSum - 100) < 0.001;

  const handleSliderChange = (field: keyof AllocationWeights, value: number) => {
    setLocalWeights(prev => ({
      ...prev,
      [field]: value
    }));
    setSaveSuccess(false);
  };

  const handleSave = () => {
    if (!isValidSum) return;
    setWeights(localWeights);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    setLocalWeights({ ...DEFAULT_WEIGHTS });
    setWeights({ ...DEFAULT_WEIGHTS });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
              Super Admin Policy & Weights Engine
            </span>
            <Badge variant="accent">Governed Execution</Badge>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Autonomous Allocation Weight Configuration
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Calibrate deterministic scoring weights. Total mathematical sum must equal exactly 100%.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetDefaults}
            icon={<RotateCcw size={13} />}
          >
            Reset Defaults
          </Button>

          <Button
            variant={isValidSum ? "filled" : "bordered"}
            size="md"
            disabled={!isValidSum}
            onClick={handleSave}
            icon={saveSuccess ? <Check size={15} /> : <Save size={15} />}
          >
            {saveSuccess ? 'Weights Saved' : 'Apply Configuration'}
          </Button>
        </div>
      </div>

      {/* Live Sum Validation Status Card */}
      <div className={`p-4 rounded-[14px] border flex items-center justify-between ${
        isValidSum 
          ? 'bg-[rgba(48,209,88,0.08)] border-[#30D158]/40' 
          : 'bg-[rgba(255,69,58,0.08)] border-[#FF453A]/40'
      }`}>
        <div className="flex items-center gap-3">
          {isValidSum ? (
            <Check size={20} className="text-[#30D158]" />
          ) : (
            <AlertTriangle size={20} className="text-[#FF453A]" />
          )}
          <div>
            <h4 className="text-xs font-semibold text-white">
              {isValidSum ? 'Policy Weights Sum to Exactly 100%' : 'Policy Weights Invalidation'}
            </h4>
            <p className="text-xs text-[var(--text-secondary)]">
              {isValidSum 
                ? 'Deterministic engine guarantees complete allocation coverage without bias.'
                : `Current sum is ${totalSum}%. Must equal exactly 100% to commit changes.`
              }
            </p>
          </div>
        </div>

        <div className="text-right font-mono-data">
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase block">Sum Total</span>
          <span className={`text-2xl font-bold ${isValidSum ? 'text-[#30D158]' : 'text-[#FF453A]'}`}>
            {totalSum}%
          </span>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="p-6 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] space-y-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Core Algorithmic Weights Calibration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Skill Compatibility */}
          <div className="space-y-2 p-4 rounded-[10px] bg-[var(--bg-panel)] border border-[var(--hairline)]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white">Skill Compatibility</label>
              <span className="font-mono-data text-sm font-bold text-[var(--accent-glow)]">
                {localWeights.skill}%
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Overlap of required task proficiencies vs employee verified certifications.
            </p>
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={localWeights.skill}
              onChange={(e) => handleSliderChange('skill', Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
          </div>

          {/* 2. SLA Protection */}
          <div className="space-y-2 p-4 rounded-[10px] bg-[var(--bg-panel)] border border-[var(--hairline)]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white">SLA Protection</label>
              <span className="font-mono-data text-sm font-bold text-[var(--accent-glow)]">
                {localWeights.sla}%
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Safety buffer margin and effective completion rate against deadlines.
            </p>
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={localWeights.sla}
              onChange={(e) => handleSliderChange('sla', Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
          </div>

          {/* 3. Availability */}
          <div className="space-y-2 p-4 rounded-[10px] bg-[var(--bg-panel)] border border-[var(--hairline)]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white">Schedule Availability</label>
              <span className="font-mono-data text-sm font-bold text-[var(--accent-glow)]">
                {localWeights.availability}%
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Current schedule headroom (100 - utilization) adjusted for leave and shifts.
            </p>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={localWeights.availability}
              onChange={(e) => handleSliderChange('availability', Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
          </div>

          {/* 4. Workload Balance */}
          <div className="space-y-2 p-4 rounded-[10px] bg-[var(--bg-panel)] border border-[var(--hairline)]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white">Workload Balance</label>
              <span className="font-mono-data text-sm font-bold text-[var(--accent-glow)]">
                {localWeights.workload}%
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Penalizes engineers approaching burnout ceiling (&gt;85%).
            </p>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={localWeights.workload}
              onChange={(e) => handleSliderChange('workload', Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
          </div>

          {/* 5. Performance */}
          <div className="space-y-2 p-4 rounded-[10px] bg-[var(--bg-panel)] border border-[var(--hairline)]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white">Historical Performance</label>
              <span className="font-mono-data text-sm font-bold text-[var(--accent-glow)]">
                {localWeights.performance}%
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Blended 30-day on-time delivery rate and QA code quality audit scores.
            </p>
            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={localWeights.performance}
              onChange={(e) => handleSliderChange('performance', Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
          </div>

          {/* 6. Location / Timezone */}
          <div className="space-y-2 p-4 rounded-[10px] bg-[var(--bg-panel)] border border-[var(--hairline)]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white">Location & Timezone</label>
              <span className="font-mono-data text-sm font-bold text-[var(--accent-glow)]">
                {localWeights.location}%
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Working shift overlap and same-region bonus for delivery team cohesion.
            </p>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={localWeights.location}
              onChange={(e) => handleSliderChange('location', Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
          </div>

          {/* 7. Business Impact */}
          <div className="space-y-2 p-4 rounded-[10px] bg-[var(--bg-panel)] border border-[var(--hairline)] md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white">Strategic Business Impact</label>
              <span className="font-mono-data text-sm font-bold text-[var(--accent-glow)]">
                {localWeights.business_impact}%
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Client tier weighting and downstream dependency criticality multiplier.
            </p>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={localWeights.business_impact}
              onChange={(e) => handleSliderChange('business_impact', Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
