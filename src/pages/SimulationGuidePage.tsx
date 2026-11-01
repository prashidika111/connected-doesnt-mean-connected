import React, { useState, useEffect } from 'react';
import {
  Network,
  Laptop,
  Server,
  Router,
  Terminal,
  FileText,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Download,
  Info,
  Layers,
  HelpCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Play,
} from 'lucide-react';
import { getScenarioById, getAllScenarios } from '../data/scenarios';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { InteractiveScenarioPlayer } from '../components/InteractiveScenarioPlayer';
import { getInteractiveScenarioData } from '../data/simulationEvents';

interface SimulationGuidePageProps {
  initialScenarioId?: string;
  onBackToDiagnosis?: () => void;
  onBackToOverview: () => void;
  onBackToScenarios?: () => void;
}

export const SimulationGuidePage: React.FC<SimulationGuidePageProps> = ({
  initialScenarioId = 'DNS-01',
  onBackToDiagnosis,
  onBackToOverview,
  onBackToScenarios,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(initialScenarioId);
  const [activeTab, setActiveTab] = useState<
    'interactive' | 'topology' | 'comparison' | 'checkpoints' | 'spec' | 'viva'
  >('interactive');
  const [simMode, setSimMode] = useState<'baseline' | 'failure'>('failure');
  const [copiedCli, setCopiedCli] = useState<string | null>(null);
  const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(0);

  // Sync state if initialScenarioId changes from navigation
  useEffect(() => {
    if (initialScenarioId) {
      setSelectedScenarioId(initialScenarioId);
    }
  }, [initialScenarioId]);

  const allScenarios = getAllScenarios();
  const scenario = getScenarioById(selectedScenarioId);
  const scenarioData = getInteractiveScenarioData(selectedScenarioId);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCli(id);
      window.setTimeout(() => setCopiedCli(null), 2000);
    } catch (error) {
      console.error('Could not copy command:', error);
    }
  };

  if (!scenario || !scenarioData) {
    return (
      <div className="mx-auto max-w-4xl py-12 px-4 space-y-6 animate-fadeIn">
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-8 text-center space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-rose-100 text-rose-700">
            <XCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Scenario Not Found: "{selectedScenarioId}"
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            The requested scenario ID does not exist in the educational catalog. Please select a valid scenario from the library.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onBackToScenarios && (
              <button
                onClick={onBackToScenarios}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs sm:text-sm hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Return to Scenario Library
              </button>
            )}
            <button
              onClick={() => setSelectedScenarioId('DNS-01')}
              className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Open Default Scenario (DNS-01)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Download the experiment specification as Markdown.
  const downloadSpecMarkdown = () => {
    const deviceRows = scenario.baselineTopology.devices
      .map(
        (device) =>
          `| ${device.name} | ${device.type} | ${device.ipAddress} | ${device.subnetMask} | ${device.defaultGateway} | ${device.dnsServer || 'N/A'} | ${device.role} |`
      )
      .join('\n');

    const connections = scenario.baselineTopology.connections
      .map((connection) => `- ${connection}`)
      .join('\n');

    const checkpoints = scenario.packetInspectionCheckpoints
      .map(
        (checkpoint) =>
          `#### Step ${checkpoint.step}: ${checkpoint.protocol} - ${checkpoint.event}\n\n` +
          `**What to observe in Simulation Mode:** ${checkpoint.whatToObserve}`
      )
      .join('\n\n');

    const manualSteps = (scenario.fileStatus.manualStepsRequired || [])
      .map((step, index) => `${index + 1}. ${step}`)
      .join('\n');

    const studyQuestions = (scenario.studyQuestions || [])
      .map(
        (q, idx) =>
          `### Question ${idx + 1}: ${q.question}\n` +
          `- **Key Concept:** ${q.networkingConcept}\n` +
          `- **Explanation:** ${q.answer}\n`
      )
      .join('\n');

    const content = `# Cisco Packet Tracer Experiment Specification

## Title
${scenario.title}

## Scenario ID
${scenario.scenarioId}

## Category
${scenario.category}

## 1. Teaching Goal
${scenario.teachingGoal}

## 2. Topology Overview
${scenario.baselineTopology.description}

### Device Configuration Table
| Device Name | Device Type | IP Address | Subnet Mask | Default Gateway | DNS Server | Role |
|---|---|---|---|---|---|---|
${deviceRows}

### Cable Interconnections
${connections}

## 3. Normal Baseline State
- **User Action:** ${scenario.baselineBehavior.userAction}
- **Expected DNS Query:** ${scenario.baselineBehavior.expectedDnsQuery}
- **Expected Browser Result:** ${scenario.baselineBehavior.expectedBrowserOutput}

## 4. Controlled Fault State
- **Fault Introduced:** ${scenario.faultInjection.faultType}
- **Exact Configuration Change:** ${scenario.faultInjection.configurationChange}
- **Affected Component:** ${scenario.faultInjection.affectedComponent}

## 5. Observed Failure Behavior
- **User Action:** ${scenario.failureBehavior.userAction}
- **DNS Result:** ${scenario.failureBehavior.observedDnsResult}
- **Browser Output:** ${scenario.failureBehavior.observedBrowserOutput}
- **Ping Contrast Result:** ${scenario.failureBehavior.observedPingResult}
- **Contrast Insight:** ${scenario.failureBehavior.contrastInsight}

## 6. Packet Inspection Checkpoints
${checkpoints}

## 7. Simulation Status
- **Interactive Web Simulation:** Fully interactive in-browser simulation
- **Cisco Proof-of-Concept Artifact:** ${scenario.fileStatus.hasVerifiedPkt ? 'Yes (Scenario 1. DNS Failure Cisco Simulation.pkt)' : 'Simulated natively in website'}

## 8. Step-by-Step Lab & Verification Instructions
${manualSteps}

${studyQuestions ? `## 9. Viva and Discussion Questions\n${studyQuestions}` : ''}
`;

    const blob = new Blob([content], {
      type: 'text/markdown;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${scenario.scenarioId}-Experiment-Specification.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Download the existing Packet Tracer file from Vite's public directory (for DNS-01 proof of concept).
  const downloadPacketTracerFile = () => {
    const link = document.createElement('a');
    link.href =
      '/Network%20Simulation%20(Cisco%20Demo)/Scenario%201.%20DNS%20Failure%20Cisco%20Simulation.pkt';
    link.download = scenario.fileStatus.suggestedFileName || 'Scenario 1. DNS Failure Cisco Simulation.pkt';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-8">
      {/* Breadcrumbs & Navigation Back */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
        <button
          onClick={onBackToOverview}
          className="hover:text-brand-700 cursor-pointer"
        >
          Home
        </button>
        <span>/</span>
        {onBackToScenarios && (
          <>
            <button
              onClick={onBackToScenarios}
              className="hover:text-brand-700 cursor-pointer"
            >
              Network Lab
            </button>
            <span>/</span>
          </>
        )}
        {onBackToDiagnosis && (
          <>
            <button
              onClick={onBackToDiagnosis}
              className="hover:text-brand-700 cursor-pointer text-brand-700 font-bold"
            >
              ← Back to Diagnosis
            </button>
            <span>/</span>
          </>
        )}
        <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">
          {scenario.title}
        </span>
      </div>

      <DisclaimerBanner compact />

      {/* Scenario Selector & Guide Header */}
      <div className="space-y-4">
        {/* Scenario Switcher Dropdown / Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
          <label htmlFor="scenario-select" className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-brand-600" />
            <span>Select Failure Scenario:</span>
          </label>
          <select
            id="scenario-select"
            value={selectedScenarioId}
            onChange={(e) => {
              setSelectedScenarioId(e.target.value);
              setSimMode('failure');
            }}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-brand-500"
          >
            {allScenarios.map((s) => (
              <option key={s.scenarioId} value={s.scenarioId}>
                {s.scenarioId}: {s.title} {s.fileStatus.hasVerifiedPkt ? '★ (Cisco Reference)' : '(Browser Sim)'}
              </option>
            ))}
          </select>
        </div>

        {/* Title & Metadata */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-900 text-white">
              {scenario.scenarioId}
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              {scenario.category}
            </span>
            {scenario.fileStatus.hasVerifiedPkt ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Cisco Reference Lab (.pkt included)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-100 text-brand-800 border border-blue-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                Interactive Browser Simulation
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {scenario.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {scenario.teachingGoal}
          </p>
        </div>
      </div>

      {/* Simulation File Notice and Downloads */}
      <div className="bg-gradient-to-r from-blue-50/70 via-slate-50 to-indigo-50/50 border border-brand-200 rounded-2xl p-5 space-y-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-100 text-brand-800 shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>

          <div className="space-y-3 flex-1 text-sm text-slate-800">
            <h3 className="font-bold text-slate-900">
              {scenario.fileStatus.hasVerifiedPkt
                ? 'Cisco Packet Tracer Reference Lab (Proof-of-Concept)'
                : 'Native Browser Network Simulation'}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {scenario.fileStatus.hasVerifiedPkt
                ? 'A tested Cisco Packet Tracer (.pkt) file is bundled in this repository as the project physical simulation reference. Download the file to run the simulation, or explore the interactive simulation directly above.'
                : 'This scenario is fully simulated directly inside your web browser. You can inspect all devices, links, packet movements, and failure points without needing Cisco Packet Tracer installed.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {scenario.fileStatus.hasVerifiedPkt && (
                <button
                  type="button"
                  onClick={downloadPacketTracerFile}
                  className="px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Reference .pkt File</span>
                </button>
              )}

              <button
                type="button"
                onClick={downloadSpecMarkdown}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download Experiment Sheet (.md)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex min-w-max space-x-2 sm:space-x-4">
          <button
            type="button"
            onClick={() => setActiveTab('interactive')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'interactive'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Interactive Experiment</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('topology')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'topology'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Topology & Addressing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'comparison'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Baseline vs. Fault State</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('checkpoints')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'checkpoints'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Packet Checkpoints</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('spec')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'spec'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Lab Steps & CLI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('viva')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'viva'
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Viva & Study Questions</span>
          </button>
        </nav>
      </div>

      {/* Tab 0: Interactive Browser Experiment */}
      {activeTab === 'interactive' && (
        <div className="space-y-6 animate-fadeIn">
          <InteractiveScenarioPlayer
            scenarioData={scenarioData}
            hasVerifiedPkt={scenario.fileStatus.hasVerifiedPkt}
            pktFileName={scenario.fileStatus.suggestedFileName}
          />
        </div>
      )}

      {/* Tab 1: Topology & Addressing */}
      {activeTab === 'topology' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Topology Description Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
              <span className="font-mono">Scenario {scenario.scenarioId} Topology Architecture</span>
              <span className="font-semibold">{scenario.category}</span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              {scenario.baselineTopology.description}
            </p>

            {/* Device Nodes Visual Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {scenario.baselineTopology.devices.map((device, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-2 text-center"
                >
                  <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    {device.type === 'PC' ? (
                      <Laptop className="w-5 h-5" />
                    ) : device.type === 'Router' ? (
                      <Router className="w-5 h-5" />
                    ) : (
                      <Server className="w-5 h-5" />
                    )}
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-white truncate">
                    {device.name}
                  </div>
                  <div className="text-xs font-mono text-cyan-300">
                    {device.ipAddress}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {device.role}
                  </div>
                </div>
              ))}
            </div>

            {/* Interconnections list */}
            <div className="border-t border-slate-800 pt-4 space-y-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Cable Interconnections:
              </span>
              <ul className="text-xs text-slate-300 space-y-1 list-disc pl-5">
                {scenario.baselineTopology.connections.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Addressing Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">
              Device Configuration & Addressing Table
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                    <th className="py-2.5 px-3">Device Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">IP Address</th>
                    <th className="py-2.5 px-3">Subnet Mask</th>
                    <th className="py-2.5 px-3">Default Gateway</th>
                    <th className="py-2.5 px-3">DNS Server</th>
                    <th className="py-2.5 px-3">Role</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-mono">
                  {scenario.baselineTopology.devices.map((device, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 font-sans">
                        {device.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-sans">
                        {device.type}
                      </td>
                      <td className="py-2.5 px-3 text-brand-700 font-bold">
                        {device.ipAddress}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {device.subnetMask}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {device.defaultGateway}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {device.dnsServer || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-sans text-[11px]">
                        {device.role}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Baseline vs. Fault State */}
      {activeTab === 'comparison' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Toggle buttons */}
          <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-100 rounded-2xl max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => setSimMode('baseline')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                simMode === 'baseline'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Baseline State (Normal)
            </button>

            <button
              type="button"
              onClick={() => setSimMode('failure')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                simMode === 'failure'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fault Injected State
            </button>
          </div>

          {simMode === 'baseline' ? (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Normal Baseline Operation (Control State)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-1">
                  <span className="font-semibold text-slate-900 block">
                    Expected User Action & DNS
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {scenario.baselineBehavior.userAction}
                  </p>
                  <p className="text-xs text-slate-500 font-mono pt-1">
                    {scenario.baselineBehavior.expectedDnsQuery}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-1">
                  <span className="font-semibold text-slate-900 block">
                    Expected Application / Browser Result
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {scenario.baselineBehavior.expectedBrowserOutput}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {scenario.baselineBehavior.status}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-base">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Isolated Fault State (Observed Failure)</span>
              </div>

              {/* Exact Fault Injection box */}
              <div className="bg-white p-4 rounded-xl border border-rose-200 space-y-1.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    Fault Type: {scenario.faultInjection.faultType}
                  </span>
                  <span className="text-[11px] font-mono text-rose-700 font-semibold">
                    Target: {scenario.faultInjection.affectedComponent}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                  {scenario.faultInjection.configurationChange}
                </p>
              </div>

              {/* Observed results grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="bg-white p-4 rounded-xl border border-rose-200 space-y-1">
                  <span className="font-semibold text-rose-900 block">
                    Observed DNS / Name Resolution:
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {scenario.failureBehavior.observedDnsResult}
                  </p>
                  <p className="text-xs text-slate-500 pt-1">
                    Browser Output: {scenario.failureBehavior.observedBrowserOutput}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-1">
                  <span className="font-semibold text-emerald-900 block">
                    Observed Ping / Layer 3 Result:
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {scenario.failureBehavior.observedPingResult}
                  </p>
                </div>
              </div>

              {/* The Core Contrast Insight */}
              <div className="p-4 bg-white border border-brand-200 rounded-xl space-y-1.5">
                <span className="text-xs font-bold text-brand-900 uppercase tracking-wide block">
                  The Key Networking Contrast:
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {scenario.failureBehavior.contrastInsight}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Packet Inspection Checkpoints */}
      {activeTab === 'checkpoints' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <strong>How to use Packet Inspection Checkpoints:</strong>{' '}
            {scenario.fileStatus.hasVerifiedPkt ? (
              <>
                Use the <strong>Interactive Browser Simulation</strong> above, or switch to <strong>Simulation Mode</strong> (Shift+S)
                in Cisco Packet Tracer using the reference <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">.pkt</code> file. Click <strong>Capture / Forward</strong> to inspect packets hop-by-hop.
              </>
            ) : (
              <>
                Step through these checkpoints in the <strong>Interactive Browser Simulation</strong> above to observe packet movements, protocol headers, and failure states hop-by-hop.
              </>
            )}
          </div>

          <div className="space-y-3">
            {scenario.packetInspectionCheckpoints.map((checkpoint) => (
              <div
                key={checkpoint.step}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-brand-800 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200 font-mono">
                    Step {String(checkpoint.step).padStart(2, '0')} • {checkpoint.protocol}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 text-right">
                    {checkpoint.event}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {checkpoint.whatToObserve}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Lab Steps & CLI Commands */}
      {activeTab === 'spec' && (
        <div className="space-y-6 animate-fadeIn">
          {/* CLI Commands Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-base text-slate-900">
              Verification Commands (CLI)
            </h3>
            <p className="text-xs text-slate-600">
              {scenario.fileStatus.hasVerifiedPkt
                ? 'Run these commands in your workstation terminal or in the client Command Prompt inside Cisco Packet Tracer.'
                : 'Run these commands in your workstation terminal to test similar network behavior on your system.'}
            </p>

            {/* CLI Snippet 1: ping */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>1. Verify Layer 3 IP Reachability</span>
                <button
                  type="button"
                  onClick={() => handleCopy(`ping ${scenario.baselineTopology.devices[1]?.ipAddress || '192.168.0.1'}`, 'cli1')}
                  className="text-brand-600 hover:text-brand-700 flex items-center gap-1 font-mono cursor-pointer"
                >
                  {copiedCli === 'cli1' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCli === 'cli1' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap">
{`ping ${scenario.baselineTopology.devices[1]?.ipAddress?.split(':')[0]?.trim() || '192.168.0.1'}
# Tests direct IP reachability without relying on DNS name translation.`}
              </pre>
            </div>

            {/* CLI Snippet 2: nslookup */}
            <div className="space-y-1 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>2. Test DNS Resolution</span>
                <button
                  type="button"
                  onClick={() => handleCopy('nslookup www.example.edu', 'cli2')}
                  className="text-brand-600 hover:text-brand-700 flex items-center gap-1 font-mono cursor-pointer"
                >
                  {copiedCli === 'cli2' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCli === 'cli2' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-cyan-300 p-3 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap">
{`nslookup www.example.edu
# Queries the configured resolver directly to isolate Layer 7 name resolution.`}
              </pre>
            </div>
          </div>

          {/* Manual Steps Ordered List */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-3">
            <h4 className="text-sm font-bold text-slate-900">
              Step-by-Step Lab & Simulation Guide
            </h4>

            <ol className="text-xs sm:text-sm text-slate-700 space-y-2.5 list-decimal pl-5">
              {(scenario.fileStatus.manualStepsRequired || []).map((step, index) => (
                <li key={index} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Tab 5: Viva & Study Questions */}
      {activeTab === 'viva' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-brand-900 space-y-1">
            <span className="font-bold block">Academic Viva / Examination Preparation</span>
            <p className="text-slate-700 leading-relaxed">
              Use these conceptual questions to prepare for your project demonstration.
              Click any question to view its detailed networking explanation.
            </p>
          </div>

          <div className="space-y-3">
            {(scenario.studyQuestions || []).map((q, idx) => {
              const isOpen = openQuestionIndex === idx;

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenQuestionIndex(isOpen ? null : idx)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono font-bold text-brand-700 block">
                        Concept: {q.networkingConcept}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {q.question}
                      </h4>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-xs sm:text-sm text-slate-700 bg-slate-50/50 border-t border-slate-100 leading-relaxed">
                      <p className="p-3 bg-white rounded-xl border border-slate-200">
                        {q.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          {onBackToDiagnosis ? (
            <button
              type="button"
              onClick={onBackToDiagnosis}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Diagnosis</span>
            </button>
          ) : onBackToScenarios ? (
            <button
              type="button"
              onClick={onBackToScenarios}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Scenario Library</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onBackToOverview}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Overview</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={downloadSpecMarkdown}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Save Experiment Sheet (.md)</span>
        </button>
      </div>
    </div>
  );
};
