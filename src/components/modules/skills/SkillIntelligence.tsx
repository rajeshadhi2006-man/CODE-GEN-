import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Filter, 
  Check, 
  ArrowUpDown, 
  Cpu,
  Layers
} from 'lucide-react';
import { useNexusStore } from '../../../store/useNexusStore';
import { SKILLS_LIST } from '../../../data/seed';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

export const SkillIntelligence: React.FC = () => {
  const { employees, selectedRegion, setActiveTab } = useNexusStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Cloud', 'DevOps', 'Backend', 'Data & AI', 'Security'];

  // Parse natural language query: e.g. "AWS + Kubernetes", "PostgreSQL", "Terraform"
  const terms = searchQuery
    .toLowerCase()
    .split(/[+,|]/)
    .map(t => t.trim())
    .filter(Boolean);

  // Match skills against terms
  const matchedSkills = SKILLS_LIST.filter(s => {
    if (terms.length === 0) return true;
    return terms.some(term => 
      s.name.toLowerCase().includes(term) || s.category.toLowerCase().includes(term) || s.id.toLowerCase().includes(term)
    );
  });

  const targetSkillIds = matchedSkills.map(s => s.id);

  // Filter & rank employees by matched skill proficiency and availability
  const rankedEmployees = employees
    .filter(e => selectedRegion === 'All' || e.region === selectedRegion)
    .map(emp => {
      let totalMatch = 0;
      let matchCount = 0;

      for (const skillId of targetSkillIds) {
        const found = emp.skills.find(s => s.skill_id === skillId);
        if (found) {
          totalMatch += found.proficiency_pct;
          matchCount++;
        }
      }

      const matchRatio = targetSkillIds.length > 0 ? matchCount / targetSkillIds.length : 1;
      const avgProficiency = matchCount > 0 ? totalMatch / matchCount : 0;
      // Combined match score
      const suitability = Math.round(avgProficiency * matchRatio * 0.7 + (100 - emp.utilization_pct) * 0.3);

      return {
        emp,
        matchCount,
        avgProficiency: Math.round(avgProficiency),
        suitability
      };
    })
    .sort((a, b) => b.suitability - a.suitability);

  // Shading helper
  const getProficiencyColor = (pct: number) => {
    if (pct >= 90) return 'bg-[#30D158]/30 text-[#30D158] font-bold border-[#30D158]/40';
    if (pct >= 75) return 'bg-[var(--accent)]/25 text-[var(--accent-glow)] font-semibold border-[var(--accent)]/30';
    if (pct >= 50) return 'bg-white/10 text-white border-white/10';
    return 'text-[var(--text-tertiary)]';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
              Enterprise Skill Intelligence & Search
            </span>
            <Badge variant="accent">Semantic Capability Matrix</Badge>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Multi-Skill Cross-Matching & Real-time Proficiency Shading
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Evaluate workforce depth across 12 core competencies with natural query parsing and availability blending.
          </p>
        </div>
      </div>

      {/* Search Bar with Natural Query Parser */}
      <div className="p-4 rounded-[14px] bg-[var(--bg-panel)] border border-[var(--hairline)] space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--accent)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Try query terms like: "AWS + Kubernetes", "PostgreSQL + Kafka", "Security"...'
              className="w-full pl-10 pr-4 py-2 rounded-[10px] bg-[var(--bg-elevated)] border border-[var(--hairline)] text-xs text-white placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['AWS + Kubernetes', 'PostgreSQL + Cloud', 'Terraform + SecOps'].map(quickQuery => (
              <button
                key={quickQuery}
                onClick={() => setSearchQuery(quickQuery)}
                className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/10 text-[11px] font-mono-data text-[var(--text-secondary)] hover:text-white transition-colors shrink-0"
              >
                {quickQuery}
              </button>
            ))}
          </div>
        </div>

        {matchedSkills.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span className="font-semibold text-white">Parsed Target Skills:</span>
            {matchedSkills.map(s => (
              <span key={s.id} className="px-2 py-0.5 rounded-[6px] bg-[var(--accent)]/15 border border-[var(--accent)]/30 font-mono-data text-[var(--accent-glow)] text-[11px]">
                {s.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Skill Matrix Grid */}
      <div className="rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[var(--bg-panel)] border-b border-[var(--hairline)] text-[var(--text-secondary)] font-mono-data">
                <th className="py-3 px-4 font-medium sticky left-0 bg-[var(--bg-panel)] z-10">Engineer / ID</th>
                <th className="py-3 px-4 font-medium">Headroom</th>
                <th className="py-3 px-4 font-medium">Match Suitability</th>
                {SKILLS_LIST.map(skill => (
                  <th key={skill.id} className="py-3 px-3 font-medium text-center truncate max-w-[100px]" title={skill.name}>
                    {skill.name.split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline)]">
              {rankedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={3 + SKILLS_LIST.length} className="py-12 text-center text-[var(--text-tertiary)]">
                    <Cpu size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="font-medium text-white/70">0 Engineers Indexed</p>
                    <p className="text-[11px] mt-0.5">Live workforce skill matrix is currently at 0 records.</p>
                  </td>
                </tr>
              ) : (
                rankedEmployees.slice(0, 25).map(({ emp, suitability }) => (
                <tr key={emp.id} className="hover:bg-white/[0.04] transition-colors">
                  {/* Employee Name */}
                  <td className="py-3 px-4 sticky left-0 bg-[var(--bg-elevated)] z-10">
                    <div className="font-semibold text-white">{emp.name}</div>
                    <div className="text-[10px] font-mono-data text-[var(--text-tertiary)]">
                      {emp.id} • {emp.region}
                    </div>
                  </td>

                  {/* Headroom / Utilization */}
                  <td className="py-3 px-4 font-mono-data">
                    <span className={emp.utilization_pct > 85 ? 'text-[#FF9F0A]' : 'text-[#30D158]'}>
                      {100 - emp.utilization_pct}% free
                    </span>
                  </td>

                  {/* Match Suitability */}
                  <td className="py-3 px-4 font-mono-data">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{suitability}</span>
                      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-[var(--accent)]"
                          style={{ width: `${suitability}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Skill Columns Shading */}
                  {SKILLS_LIST.map(skill => {
                    const prof = emp.skills.find(s => s.skill_id === skill.id)?.proficiency_pct;
                    const isTargeted = targetSkillIds.includes(skill.id);

                    return (
                      <td key={skill.id} className="py-3 px-2 text-center font-mono-data">
                        {prof !== undefined ? (
                          <span 
                            className={`inline-block px-1.5 py-0.5 rounded text-[11px] border ${getProficiencyColor(prof)} ${
                              isTargeted ? 'ring-1 ring-[var(--accent-glow)]' : ''
                            }`}
                          >
                            {prof}%
                          </span>
                        ) : (
                          <span className="text-[var(--text-tertiary)] text-[10px]">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
