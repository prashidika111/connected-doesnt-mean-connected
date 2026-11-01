import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Laptop,
  Server,
  Router,
  Layers,
  Download,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  InteractiveScenarioData,
  SimulationPacketEvent,
  TopologyDeviceNode,
} from '../types/simulation';

interface InteractiveScenarioPlayerProps {
  scenarioData: InteractiveScenarioData | null;
  hasVerifiedPkt?: boolean;
  pktFileName?: string;
  onOpenDraftEditor?: () => void;
}

export const InteractiveScenarioPlayer: React.FC<InteractiveScenarioPlayerProps> = ({
  scenarioData,
  hasVerifiedPkt = false,
  pktFileName = 'Scenario 1. DNS Failure Cisco Simulation.pkt',
}) => {
  const [mode, setMode] = useState<'baseline' | 'fault' | 'direct_ip'>('fault');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<TopologyDeviceNode | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [packetProgress, setPacketProgress] = useState<number>(1); // 0 to 1 along path

  // Reset playback and selection state when scenario changes
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setSelectedNode(null);
    if (mode === 'direct_ip' && !scenarioData?.directIpEvents) {
      setMode('fault');
    }
  }, [scenarioData?.scenarioId]);

  if (!scenarioData) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-700">
          Simulation data is not available for this scenario.
        </p>
      </div>
    );
  }

  // Select event sequence based on mode
  const activeEvents: SimulationPacketEvent[] =
    mode === 'baseline'
      ? scenarioData.baselineEvents || []
      : mode === 'direct_ip' && scenarioData.directIpEvents
      ? scenarioData.directIpEvents
      : scenarioData.faultEvents || [];

  const safeStepIndex = Math.min(
    currentStepIndex,
    Math.max(0, activeEvents.length - 1)
  );
  const currentEvent: SimulationPacketEvent | undefined = activeEvents[safeStepIndex];

  // Auto-play timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < activeEvents.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 3200);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, activeEvents.length]);

  // Animate packet progress on step change
  useEffect(() => {
    setPacketProgress(0);
    const start = Date.now();
    const duration = 1200;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / duration);
      setPacketProgress(p);
      if (p >= 1) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [currentStepIndex, mode]);

  // Reset steps when mode changes
  const handleModeChange = (newMode: 'baseline' | 'fault' | 'direct_ip') => {
    setMode(newMode);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handleNextStep = () => {
    if (currentStepIndex < activeEvents.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const getNodeById = (id: string): TopologyDeviceNode | undefined => {
    return scenarioData.nodes.find((n) => n.id === id);
  };

  const renderDeviceIcon = (type: TopologyDeviceNode['type']) => {
    switch (type) {
      case 'PC':
        return <Laptop className="h-6 w-6" />;
      case 'Router':
        return <Router className="h-6 w-6" />;
      case 'Server':
        return <Server className="h-6 w-6" />;
      default:
        return <Layers className="h-6 w-6" />;
    }
  };

  // Compute animated packet coordinates along pathNodeIds
  const computePacketPosition = () => {
    if (!currentEvent || !currentEvent.pathNodeIds || currentEvent.pathNodeIds.length === 0) {
      return null;
    }
    const hops = currentEvent.pathNodeIds.map(getNodeById).filter(Boolean) as TopologyDeviceNode[];
    if (hops.length === 1) {
      return { x: hops[0].x, y: hops[0].y };
    }

    const totalSegments = hops.length - 1;
    const globalProgress = packetProgress * totalSegments;
    const segmentIndex = Math.min(Math.floor(globalProgress), totalSegments - 1);
    const segmentProgress = globalProgress - segmentIndex;

    const fromNode = hops[segmentIndex];
    const toNode = hops[segmentIndex + 1];

    const x = fromNode.x + (toNode.x - fromNode.x) * segmentProgress;
    const y = fromNode.y + (toNode.y - fromNode.y) * segmentProgress;

    return { x, y };
  };

  const packetPos = computePacketPosition();

  return (
    <div className="space-y-6">
      {/* Simulation Header & Mode Controls */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-brand-800">
              <Layers className="h-3.5 w-3.5" /> Interactive Browser Simulation
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {scenarioData.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1">
              {scenarioData.userFacingSymptom}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-center">
            <button
              onClick={() => handleModeChange('fault')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'fault'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Injected Fault (Problem)
            </button>
            <button
              onClick={() => handleModeChange('baseline')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'baseline'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Baseline Working (Control)
            </button>
            {scenarioData.directIpEvents && (
              <button
                onClick={() => handleModeChange('direct_ip')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mode === 'direct_ip'
                    ? 'bg-brand-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Direct IP Access (Bypass DNS)
              </button>
            )}
          </div>
        </div>

        {/* Current State Summary Banner */}
        <div
          className={`rounded-2xl p-4 border text-xs sm:text-sm leading-relaxed ${
            mode === 'baseline'
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : mode === 'direct_ip'
              ? 'bg-blue-50/70 border-blue-200 text-brand-900'
              : 'bg-rose-50/70 border-rose-200 text-rose-900'
          }`}
        >
          <div className="font-bold flex items-center gap-2">
            {mode === 'baseline' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : mode === 'direct_ip' ? (
              <Info className="h-4 w-4 text-brand-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            )}
            <span>
              {mode === 'baseline'
                ? 'Baseline Mode: All configurations and services operational'
                : mode === 'direct_ip'
                ? 'Direct IP Demonstration: Bypassing Name Resolution'
                : `Fault Injected: ${scenarioData.faultDescription}`}
            </span>
          </div>
          <p className="mt-1">
            {mode === 'baseline'
              ? scenarioData.baselineSummary
              : mode === 'direct_ip'
              ? scenarioData.contrastInsight
              : scenarioData.failureSummary}
          </p>
        </div>
      </div>

      {/* Interactive Topology Viewport */}
      <div className="relative rounded-3xl border border-slate-200 bg-slate-900 p-6 sm:p-8 text-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
            Network Topology & Live Packet Path
          </div>
          <div className="text-xs text-slate-400">
            Click any device node to inspect configuration
          </div>
        </div>

        {/* SVG Links Canvas */}
        <div className="relative h-72 sm:h-80 w-full rounded-2xl bg-slate-950/60 border border-slate-800">
          <svg className="absolute inset-0 h-full w-full pointer-events-none">
            {scenarioData.links.map((link) => {
              const src = getNodeById(link.sourceId);
              const tgt = getNodeById(link.targetId);
              if (!src || !tgt) return null;

              const isLinkActive =
                currentEvent &&
                currentEvent.pathNodeIds.includes(link.sourceId) &&
                currentEvent.pathNodeIds.includes(link.targetId);

              const isLinkFailed = mode === 'fault' && link.status === 'down';
              const displayLabel =
                mode === 'baseline'
                  ? link.label?.replace('(DOWN)', '(UP)').replace('(Blocked)', '(Active)')
                  : link.label;

              return (
                <g key={link.id}>
                  <line
                    x1={`${src.x}%`}
                    y1={`${src.y}%`}
                    x2={`${tgt.x}%`}
                    y2={`${tgt.y}%`}
                    stroke={
                      isLinkFailed
                        ? '#ef4444'
                        : isLinkActive
                        ? '#38bdf8'
                        : '#334155'
                    }
                    strokeWidth={isLinkActive ? 3.5 : 2}
                    strokeDasharray={isLinkFailed ? '6,6' : undefined}
                  />
                  {displayLabel && (
                    <text
                      x={`${(src.x + tgt.x) / 2}%`}
                      y={`${(src.y + tgt.y) / 2 - 2}%`}
                      fill="#94a3b8"
                      fontSize="9"
                      textAnchor="middle"
                      className="font-mono select-none"
                    >
                      {displayLabel}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Device Nodes */}
          {scenarioData.nodes.map((node) => {
            const isFaulted =
              mode === 'fault' && scenarioData.faultedNodeId === node.id;
            const isEventSource = currentEvent?.fromNodeId === node.id;
            const isEventDest = currentEvent?.toNodeId === node.id;
            const isPathNode = currentEvent?.pathNodeIds.includes(node.id);
            const isSelected = selectedNode?.id === node.id;

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute cursor-pointer select-none transition-all duration-300 rounded-2xl p-2.5 sm:p-3 flex flex-col items-center border text-center shadow-lg ${
                  isSelected
                    ? 'ring-2 ring-cyan-400 bg-slate-800 border-cyan-400'
                    : isFaulted
                    ? 'bg-rose-950/80 border-rose-500 ring-1 ring-rose-500/50'
                    : isPathNode
                    ? 'bg-slate-800/90 border-sky-400 shadow-sky-500/20'
                    : 'bg-slate-900/90 border-slate-700 hover:border-slate-500'
                }`}
              >
                <div
                  className={`p-2 rounded-xl mb-1.5 ${
                    isFaulted
                      ? 'bg-rose-500/20 text-rose-300'
                      : isEventSource || isEventDest
                      ? 'bg-sky-500/20 text-sky-300'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {renderDeviceIcon(node.type)}
                </div>
                <div className="font-bold text-xs text-slate-100 whitespace-nowrap">
                  {node.name}
                </div>
                <div className="font-mono text-[10px] text-slate-400 whitespace-nowrap">
                  {isFaulted && mode === 'fault'
                    ? `${node.ipAddress} ⚠️`
                    : node.ipAddress}
                </div>

                {isFaulted && (
                  <span className="mt-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wider">
                    Fault Source
                  </span>
                )}
              </div>
            );
          })}

          {/* Animated Packet Token */}
          {packetPos && currentEvent && (
            <div
              style={{
                left: `${packetPos.x}%`,
                top: `${packetPos.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute pointer-events-none transition-transform z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg border text-[10px] font-mono font-bold whitespace-nowrap ${
                currentEvent.outcome === 'failure' || currentEvent.outcome === 'timeout'
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                  : currentEvent.outcome === 'bypassed'
                  ? 'bg-amber-600 text-white border-amber-400'
                  : 'bg-cyan-500 text-slate-950 border-cyan-200'
              }`}
            >
              <span>{currentEvent.protocol}</span>
              {currentEvent.port && <span className="opacity-80">({currentEvent.port})</span>}
            </div>
          )}
        </div>

        {/* Selected Device Inspection Drawer */}
        {selectedNode && (
          <div className="mt-4 rounded-2xl bg-slate-800/90 border border-slate-700 p-4 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                {renderDeviceIcon(selectedNode.type)}
                {selectedNode.name} Configuration Detail
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">IP Address</span>
                <span className="text-slate-100">{selectedNode.ipAddress}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Subnet Mask</span>
                <span className="text-slate-100">{selectedNode.subnetMask}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Default Gateway</span>
                <span className="text-slate-100">{selectedNode.defaultGateway}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">DNS Server</span>
                <span className={mode === 'fault' && scenarioData.faultedNodeId === selectedNode.id ? 'text-rose-400 font-bold' : 'text-slate-100'}>
                  {selectedNode.dnsServer || 'N/A'}
                </span>
              </div>
            </div>
            <p className="text-slate-300 pt-1 text-xs">{selectedNode.role}</p>
          </div>
        )}
      </div>

      {/* Playback Controls & Step Slider */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-700 text-white font-semibold text-xs sm:text-sm hover:bg-brand-800 transition-colors shadow-xs cursor-pointer"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{isPlaying ? 'Pause' : 'Play Sequence'}</span>
            </button>
            <button
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Event"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextStep}
              disabled={currentStepIndex === activeEvents.length - 1}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Next Event"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Step indicator */}
          <div className="text-xs text-slate-600 font-medium">
            Step <span className="font-bold text-slate-900">{currentStepIndex + 1}</span> of{' '}
            <span className="font-bold text-slate-900">{activeEvents.length}</span>: {currentEvent?.name}
          </div>
        </div>

        {/* Step Timeline Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-2">
          {activeEvents.map((ev, idx) => (
            <button
              key={ev.step}
              onClick={() => {
                setCurrentStepIndex(idx);
                setIsPlaying(false);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                idx === currentStepIndex
                  ? 'border-brand-500 bg-blue-50/70 ring-1 ring-brand-500'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-slate-500 font-mono">#{ev.step}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    ev.outcome === 'success'
                      ? 'bg-emerald-100 text-emerald-800'
                      : ev.outcome === 'bypassed'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {ev.protocol}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 truncate">{ev.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Event Explanation Card */}
      {currentEvent && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-bold font-mono text-brand-700 uppercase tracking-wider">
                Event Details — Step {currentEvent.step}
              </span>
              <h3 className="text-lg font-bold text-slate-900">{currentEvent.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                  currentEvent.outcome === 'success'
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentEvent.outcome === 'bypassed'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {currentEvent.outcome === 'success' && <CheckCircle2 className="h-3.5 w-3.5" />}
                {currentEvent.outcome === 'failure' && <XCircle className="h-3.5 w-3.5" />}
                {currentEvent.outcome === 'timeout' && <AlertTriangle className="h-3.5 w-3.5" />}
                {currentEvent.outcome === 'bypassed' && <Info className="h-3.5 w-3.5" />}
                <span className="capitalize">{currentEvent.outcome}</span>
              </span>
            </div>
          </div>

          {/* Simple Explanation */}
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Simple Explanation (What this means)
            </h4>
            <p className="text-sm leading-relaxed text-slate-800">
              {currentEvent.simpleExplanation}
            </p>
          </div>

          {/* Payload Summary */}
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 font-mono text-xs text-slate-700 space-y-1">
            <div className="font-bold text-slate-900">Summary: {currentEvent.summary}</div>
            <div className="text-slate-600">Payload: {currentEvent.payloadDetail}</div>
          </div>

          {/* Progressive Disclosure: Technical Reasoning */}
          <div className="pt-2">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-900 cursor-pointer"
            >
              <span>{showTechnicalDetails ? 'Hide' : 'Show'} Deep Networking & Protocol Evidence</span>
              {showTechnicalDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showTechnicalDetails && (
              <div className="mt-3 rounded-2xl bg-slate-900 p-4 text-xs font-mono text-slate-200 space-y-3 animate-fadeIn">
                <div>
                  <span className="text-cyan-400 block font-bold mb-1">
                    [Protocol Reasoning]
                  </span>
                  <p className="leading-relaxed">{currentEvent.technicalExplanation}</p>
                </div>
                {currentEvent.packetTracerCheckpoint && (
                  <div className="border-t border-slate-800 pt-2">
                    <span className="text-amber-300 block font-bold mb-1">
                      [Packet Tracer Simulation Mode Checkpoint]
                    </span>
                    <p className="leading-relaxed text-slate-300">
                      {currentEvent.packetTracerCheckpoint}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scenario Lab Status & Education Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              {hasVerifiedPkt
                ? 'Cisco Proof-of-Concept Lab Reference'
                : 'Native Interactive Web Simulation'}
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {hasVerifiedPkt
                ? 'Cisco Packet Tracer Reference Topology & Verified Artifact'
                : 'Interactive Scenario Architecture & Educational Takeaways'}
            </h3>
          </div>

          {/* Download Button ONLY for DNS-01 proof of concept */}
          {hasVerifiedPkt ? (
            <a
              href={`/api/pkt-download?file=${encodeURIComponent(pktFileName)}`}
              download={pktFileName}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Download className="h-4 w-4" />
              <span>Download Reference .pkt ({pktFileName})</span>
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-brand-800 text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" />
              Interactive Web Simulation (No .pkt Required)
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 text-xs text-slate-600">
          <div>
            <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide">
              {hasVerifiedPkt
                ? 'Topology & Packet Tracer Verification Notes'
                : 'Scenario Topology & Behavior Notes'}
            </h4>
            <ul className="space-y-1.5 list-disc list-inside">
              {scenarioData.ciscoVerificationNotes.map((note, idx) => (
                <li key={idx} className="leading-relaxed">
                  {note}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wide">
              {hasVerifiedPkt ? 'Model Honesty & Lab Distinction' : 'How to Resolve This Connection Problem'}
            </h4>
            <p className="leading-relaxed">
              {hasVerifiedPkt ? (
                <>
                  This scenario serves as the <strong>project's primary Cisco Packet Tracer proof-of-concept</strong>.
                  The browser player provides immediate interactive verification of the single LAN topology.
                  To inspect discrete-event simulation at the packet header bit-level, download the bundled{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded">.pkt</code> file and run it in Cisco Packet Tracer.
                </>
              ) : (
                <>
                  This scenario is <strong>fully simulated directly in your web browser</strong> without needing
                  Cisco Packet Tracer installed. Use the <em>Baseline</em> vs. <em>Injected Fault</em> toggles above to
                  compare healthy operation against the isolated failure condition.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
