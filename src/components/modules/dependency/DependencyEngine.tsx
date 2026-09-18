import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { 
  Network, 
  AlertTriangle, 
  Clock, 
  Play, 
  RotateCcw, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useNexusStore } from '../../../store/useNexusStore';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Task } from '../../../data/types';

interface NodeData extends d3.SimulationNodeDatum {
  id: string;
  code: string;
  name: string;
  priority: string;
  isDelayed?: boolean;
  isImpacted?: boolean;
}

interface LinkData extends d3.SimulationLinkDatum<NodeData> {
  source: string | NodeData;
  target: string | NodeData;
}

export const DependencyEngine: React.FC = () => {
  const { tasks, openExplainModal } = useNexusStore();
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '');
  const [simulatedDelayMin, setSimulatedDelayMin] = useState<number>(60);
  const [impactSummary, setImpactSummary] = useState<string>('');

  const selectedTask = tasks.find(t => t.id === selectedTaskId) || tasks[0] || null;

  // Real dependencies
  const upstreamBlockers = selectedTask?.dependency_ids?.map(depId => {
    const found = tasks.find(t => t.id === depId);
    return found ? found.code : depId;
  }) || [];

  const downstreamTasks = selectedTask 
    ? tasks.filter(t => t.dependency_ids?.includes(selectedTask.id))
    : [];

  const triggerDelaySimulation = () => {
    if (!selectedTask) return;
    setImpactSummary(
      `Simulated delay on ${selectedTask.code} (+${simulatedDelayMin}m) affects ${downstreamTasks.length} downstream dependencies.`
    );
  };

  const resetDelay = () => {
    setImpactSummary('');
  };

  // D3 Graph Render
  useEffect(() => {
    if (!svgRef.current || tasks.length === 0) return;

    const width = 640;
    const height = 400;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const displayTasks = tasks.slice(0, 15);
    const nodes: NodeData[] = displayTasks.map(t => ({
      id: t.id,
      code: t.code,
      name: t.name,
      priority: t.priority,
      isDelayed: impactSummary !== '' && t.id === selectedTask?.id,
      isImpacted: impactSummary !== '' && downstreamTasks.some(d => d.id === t.id)
    }));

    const nodeIds = new Set(nodes.map(n => n.id));
    const links: LinkData[] = [];
    displayTasks.forEach(t => {
      (t.dependency_ids || []).forEach(depId => {
        if (nodeIds.has(depId)) {
          links.push({ source: depId, target: t.id });
        }
      });
    });

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<NodeData, LinkData>(links).id(d => d.id).distance(110))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Arrow markers for directed edges
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', 'rgba(255,255,255,0.3)');

    // Render Links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', 'rgba(255,255,255,0.2)')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrow)');

    // Render Nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .on('click', (_, d) => setSelectedTaskId(d.id));

    // Node Circle
    node.append('circle')
      .attr('r', 22)
      .attr('fill', d => {
        if (d.isDelayed) return '#FF453A';
        if (d.isImpacted) return '#FF9F0A';
        if (d.priority === 'Critical') return '#0A84FF';
        return '#1B1F2B';
      })
      .attr('stroke', d => {
        if (d.isDelayed) return '#FF453A';
        if (d.isImpacted) return '#FF9F0A';
        return 'rgba(255,255,255,0.3)';
      })
      .attr('stroke-width', 2);

    // Node Code Label
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#FFFFFF')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('font-family', 'var(--font-mono)')
      .text(d => d.code);

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as NodeData).x || 0)
        .attr('y1', d => (d.source as NodeData).y || 0)
        .attr('x2', d => (d.target as NodeData).x || 0)
        .attr('y2', d => (d.target as NodeData).y || 0);

      node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [tasks, impactSummary, selectedTask]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data">
              Critical Path & Cascading Topology
            </span>
            <Badge variant="accent">{tasks.length} Tasks in Scope</Badge>
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Dependency Graph Engine & Upstream Blocker Analysis
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Models task precedence constraints and calculates ripple effects across downstream delivery paths.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {impactSummary ? (
            <Button variant="ghost" size="sm" onClick={resetDelay} icon={<RotateCcw size={13} />}>
              Reset Simulation
            </Button>
          ) : (
            <Button
              variant="filled"
              size="md"
              icon={<Play size={14} />}
              onClick={triggerDelaySimulation}
              disabled={!selectedTask}
            >
              Simulate Delay (+{simulatedDelayMin}m)
            </Button>
          )}
        </div>
      </div>

      {/* Cascading Impact Alert */}
      {impactSummary && (
        <div className="p-4 rounded-[12px] bg-[rgba(255,159,10,0.1)] border border-[#FF9F0A]/30 flex items-start gap-3">
          <AlertTriangle size={18} className="text-[#FF9F0A] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-semibold text-white mb-1">
              Cascading Downstream Disruption Detected
            </h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {impactSummary}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: D3 Force Graph & Task Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: D3 Graph Canvas */}
        <div className="lg:col-span-2 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] p-4 flex flex-col items-center justify-center relative overflow-hidden min-h-[420px]">
          {tasks.length === 0 ? (
            <div className="text-center space-y-2 p-8">
              <Network size={32} className="text-[var(--text-tertiary)] mx-auto" />
              <h4 className="text-sm font-semibold text-white">No Dependency Nodes Tracked</h4>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                Dependency topology and precedence paths will map here when tasks with prerequisite constraints are created.
              </p>
            </div>
          ) : (
            <>
              <div className="absolute top-4 left-4 z-10 flex items-center gap-3 text-[11px] font-mono-data text-[var(--text-tertiary)]">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0A84FF]" /> Upstream Critical</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FF453A]" /> Simulated Delayed</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#FF9F0A]" /> Downstream Impacted</span>
              </div>

              <svg ref={svgRef} width="640" height="400" className="w-full h-auto max-w-[640px]" />
            </>
          )}
        </div>

        {/* Right: Selected Node Details */}
        <div className="p-5 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--hairline)] space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] font-mono-data block">
            Selected Node Inspector
          </span>

          {selectedTask ? (
            <>
              <div className="p-4 rounded-[10px] bg-[var(--bg-panel)] border border-[var(--hairline)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-white font-mono-data">{selectedTask.code}</span>
                  <Badge variant={selectedTask.priority === 'Critical' ? 'critical' : 'high'}>
                    {selectedTask.priority} Priority
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {selectedTask.name}
                </p>

                <div className="pt-3 border-t border-[var(--hairline)] text-xs space-y-1.5 font-mono-data">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">Upstream Blockers:</span>
                    <span className="text-white">{upstreamBlockers.length > 0 ? upstreamBlockers.join(', ') : 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">Direct Downstream:</span>
                    <span className={downstreamTasks.length > 0 ? 'text-[#FF9F0A]' : 'text-[var(--text-tertiary)]'}>
                      {downstreamTasks.length > 0 ? downstreamTasks.map(d => d.code).join(', ') : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-tertiary)]">Dependent Tasks:</span>
                    <span className="text-white">{downstreamTasks.length}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[var(--text-secondary)] block">
                  Simulate Delay Magnitude
                </label>
                <div className="flex items-center gap-2">
                  {[30, 60, 120].map(mins => (
                    <button
                      key={mins}
                      onClick={() => setSimulatedDelayMin(mins)}
                      className={`flex-1 py-1.5 rounded-[8px] border text-xs font-mono-data ${
                        simulatedDelayMin === mins
                          ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                          : 'bg-[var(--bg-panel)] border-[var(--hairline)] text-[var(--text-secondary)] hover:text-white'
                      }`}
                    >
                      +{mins}m
                    </button>
                  ))}
                </div>
              </div>

              <Button
                variant="tinted"
                size="md"
                className="w-full"
                onClick={() => openExplainModal(selectedTask.id)}
              >
                Inspect Reallocation Options
              </Button>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-[var(--text-secondary)] space-y-2">
              <Clock size={20} className="text-[var(--text-tertiary)] mx-auto" />
              <p className="font-semibold text-white">No Work Order Selected</p>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                Create or select a task to inspect its dependency structure.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
