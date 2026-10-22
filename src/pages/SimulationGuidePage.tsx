
import React, { useState } from 'react';
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
} from 'lucide-react';

import { DNS_01_SCENARIO } from '../data/scenarios';
import { DisclaimerBanner } from '../components/DisclaimerBanner';

interface SimulationGuidePageProps {
  onBackToDiagnosis?: () => void;
  onBackToOverview: () => void;
}

export const SimulationGuidePage: React.FC<SimulationGuidePageProps> = ({
  onBackToDiagnosis,
  onBackToOverview,
}) => {
  const [activeTab, setActiveTab] = useState<
    'topology' | 'comparison' | 'checkpoints' | 'spec'
  >('topology');

  const [simMode, setSimMode] = useState<'baseline' | 'failure'>('failure');
  const [copiedCli, setCopiedCli] = useState<string | null>(null);

  const scenario = DNS_01_SCENARIO;

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCli(id);
      window.setTimeout(() => setCopiedCli(null), 2000);
    } catch (error) {
      console.error('Could not copy command:', error);
    }
  };

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

    const manualSteps = scenario.fileStatus.manualStepsRequired
      .map((step, index) => `${index + 1}. ${step}`)
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

## 7. Packet Tracer File
The application provides a separate download button for the existing Cisco Packet Tracer .pkt file.

Expected file name: ${scenario.fileStatus.suggestedFileName}

## 8. Manual Lab Steps
${manualSteps}
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

  // Download the existing Packet Tracer file from Vite's public directory.
  const downloadPacketTracerFile = () => {
    const link = document.createElement('a');

    link.href =
      '/Network%20Simulation%20(Cisco%20Demo)/Scenario%201.%20DNS%20Failure%20Cisco%20Simulation.pkt';

    link.download = 'Scenario 1. DNS Failure Cisco Simulation.pkt';

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-8">
      <DisclaimerBanner compact />

      {/* Guide Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-brand-50 text-brand-700 border border-brand-200">
            Scenario {scenario.scenarioId.replace('-', ' ')}
          </span>

          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
            {scenario.category}
          </span>

          <span className="text-xs text-slate-400">•</span>

          <span className="text-xs text-slate-500 font-medium">
            Controlled Virtual Network Experiment
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {scenario.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          {scenario.teachingGoal}
        </p>
      </div>

      {/* Simulation File Notice and Downloads */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl p-5 space-y-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>

          <div className="space-y-3 flex-1 text-sm text-amber-900">
            <h3 className="font-bold text-amber-950">
              About the simulation file
            </h3>

            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
              The Cisco Packet Tracer .pkt file requires the Cisco Packet
              Tracer desktop application to open. Download the existing
              simulation file below, or download the Markdown experiment
              specification for the topology, configuration, and lab steps.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={downloadPacketTracerFile}
                className="px-3.5 py-1.5 rounded-lg bg-[#456A91] hover:bg-[#365578] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Packet Tracer File (.pkt)</span>
              </button>

              <button
                type="button"
                onClick={downloadSpecMarkdown}
                className="px-3.5 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Experiment Sheet (.md)</span>
              </button>
            </div>

            <p className="text-xs text-amber-800">
              Packet Tracer file: {scenario.fileStatus.suggestedFileName}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex min-w-max space-x-4">
          <button
            type="button"
            onClick={() => setActiveTab('topology')}
            className={`py-3 px-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'topology'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Topology & Addressing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`py-3 px-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'comparison'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Baseline vs. Fault State</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('checkpoints')}
            className={`py-3 px-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'checkpoints'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Packet Checkpoints</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('spec')}
            className={`py-3 px-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'spec'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Steps to reproduce the lab</span>
          </button>
        </nav>
      </div>

      {/* Tab 1: Topology & Addressing */}
      {activeTab === 'topology' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
              <span className="font-mono">
                Cisco Packet Tracer DNS demonstration
              </span>
              <span>LAN: 192.168.0.0/24</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center items-center">
              {/* Client PC */}
              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm">Client laptop</div>
                <div className="text-xs font-mono text-slate-400">
                  192.168.0.100
                </div>
                <div className="text-[10px] text-slate-500">
                  Network connection
                </div>
              </div>

              {/* Local LAN and DNS */}
              <div className="space-y-3">
                <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700">
                  <div className="font-semibold text-xs text-slate-300">
                    Local LAN connection
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Same local network
                  </div>
                </div>

                <div className="bg-amber-950/40 rounded-2xl p-3 border border-amber-600/40 space-y-1">
                  <div className="font-bold text-xs text-amber-300 flex items-center justify-center gap-1">
                    <Server className="w-3.5 h-3.5" />
                    <span>DNS server</span>
                  </div>
                  <div className="text-xs font-mono text-amber-200">
                    192.168.0.10
                  </div>
                  <div className="text-[10px] text-amber-400">
                    Port 53 (UDP)
                  </div>
                </div>
              </div>

              {/* Gateway Router */}
              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Router className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm">HomeRouter-PT-AC</div>
                <div className="text-[11px] font-mono text-slate-300">
                  LAN: 192.168.0.1
                </div>
              </div>

              {/* Web Server */}
              <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 space-y-2">
                <div className="w-10 h-10 mx-auto rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Server className="w-5 h-5" />
                </div>
                <div className="font-bold text-sm">Web server</div>
                <div className="text-xs font-mono text-slate-400">
                  192.168.0.20
                </div>
                <div className="text-[10px] text-purple-300">
                  http://www.example.edu
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 text-center italic">
              Notice: All four devices share the same LAN, 192.168.0.0/24.
              The web server is not on a separate subnet.
            </p>
          </div>

          {/* Addressing Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">
              Topology Addressing & Device Configuration Table
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                    <th className="py-2.5 px-3">Device</th>
                    <th className="py-2.5 px-3">Interface</th>
                    <th className="py-2.5 px-3">IP Address</th>
                    <th className="py-2.5 px-3">Subnet Mask</th>
                    <th className="py-2.5 px-3">Default Gateway</th>
                    <th className="py-2.5 px-3">DNS Server</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-mono">
                  {scenario.baselineTopology.devices.map((device, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 font-sans">
                        {device.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {device.type === 'Router' ? 'G0/0 & G0/1' : 'Fa0'}
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
          <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 rounded-xl max-w-sm mx-auto">
            <button
              type="button"
              onClick={() => setSimMode('baseline')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                simMode === 'baseline'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Baseline State (Working)
            </button>

            <button
              type="button"
              onClick={() => setSimMode('failure')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                simMode === 'failure'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fault State (DNS Failure)
            </button>
          </div>

          {simMode === 'baseline' ? (
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Normal State: What Happens When DNS Works</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-1">
                  <span className="font-semibold text-slate-900 block">
                    1. Name Resolution (UDP 53)
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    Client queries 192.168.0.10. DNS server returns the A
                    record 192.168.0.20.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-1">
                  <span className="font-semibold text-slate-900 block">
                    2. Web Browser Display
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    Browser opens TCP port 80 to 192.168.0.20. The expected
                    page says: “Welcome to Example University!”
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-base">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Fault State: What Happens During DNS Failure</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-rose-200 space-y-2 text-xs sm:text-sm">
                <div className="font-bold text-slate-900">
                  Exact Fault Injection:
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {scenario.faultInjection.configurationChange}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="bg-white p-4 rounded-xl border border-rose-200 space-y-1">
                  <span className="font-semibold text-rose-900 block">
                    Name Lookup Fails
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    The browser cannot resolve the hostname. If DNS fails,
                    the client cannot start a TCP connection to the server
                    using that hostname.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-300 space-y-1">
                  <span className="font-semibold text-emerald-900 block">
                    Direct IP Ping
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    Try <code>ping 192.168.0.20</code> in Packet Tracer. A
                    successful reply would show that IP connectivity can
                    work even while name resolution fails.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-xs text-brand-900 font-medium">
                <strong>The key contrast:</strong> A device can have local
                connectivity while name resolution is failing. These are
                separate stages of network communication.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Packet Inspection Checkpoints */}
      {activeTab === 'checkpoints' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="text-xs text-slate-500 mb-2">
            Switch to <strong>Simulation Mode</strong> in Cisco Packet Tracer
            to inspect packet events step by step.
          </div>

          <div className="space-y-3">
            {scenario.packetInspectionCheckpoints.map((checkpoint) => (
              <div
                key={checkpoint.step}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    Step {String(checkpoint.step).padStart(2, '0')} •{' '}
                    {checkpoint.protocol}
                  </span>

                  <span className="text-xs font-semibold text-slate-700 text-right">
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

      {/* Tab 4: Lab Steps and CLI */}
      {activeTab === 'spec' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-base text-slate-900">
              Step-by-Step Lab Verification Commands (CLI)
            </h3>

            <p className="text-xs text-slate-600">
              Run these commands in the client PC's Command Prompt inside
              Cisco Packet Tracer.
            </p>

            {/* CLI Snippet 1 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>1. Verify direct IP connectivity</span>

                <button
                  type="button"
                  onClick={() => handleCopy('ping 192.168.0.20', 'ping1')}
                  className="text-brand-600 hover:text-brand-700 flex items-center gap-1 font-mono cursor-pointer"
                >
                  {copiedCli === 'ping1' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedCli === 'ping1' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap">
{`ping 192.168.0.20
# Expected in a working topology: replies from 192.168.0.20`}
              </pre>
            </div>

            {/* CLI Snippet 2 */}
            <div className="space-y-1 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>2. Test domain-name resolution</span>

                <button
                  type="button"
                  onClick={() => handleCopy('ping www.example.edu', 'ping2')}
                  className="text-brand-600 hover:text-brand-700 flex items-center gap-1 font-mono cursor-pointer"
                >
                  {copiedCli === 'ping2' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedCli === 'ping2' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <pre className="bg-slate-900 text-rose-400 p-3 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap">
{`ping www.example.edu
# In the DNS-failure state, hostname resolution should fail.`}
              </pre>
            </div>

            {/* CLI Snippet 3 */}
            <div className="space-y-1 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>3. Query DNS directly</span>

                <button
                  type="button"
                  onClick={() => handleCopy('nslookup www.example.edu', 'nslookup')}
                  className="text-brand-600 hover:text-brand-700 flex items-center gap-1 font-mono cursor-pointer"
                >
                  {copiedCli === 'nslookup' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedCli === 'nslookup' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <pre className="bg-slate-900 text-amber-300 p-3 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap">
{`nslookup www.example.edu
# In the fault state, the DNS server may time out or fail to resolve the name.`}
              </pre>
            </div>
          </div>

          {/* Manual Steps */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-900">
              Detailed Packet Tracer File Setup Instructions
            </h4>

            <ol className="text-xs sm:text-sm text-slate-700 space-y-2 list-decimal pl-5">
              {scenario.fileStatus.manualStepsRequired.map((step, index) => (
                <li key={index} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        {onBackToDiagnosis ? (
          <button
            type="button"
            onClick={onBackToDiagnosis}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm font-medium transition-colors cursor-pointer"
          >
            ← Return to Diagnostic Explanation
          </button>
        ) : (
          <button
            type="button"
            onClick={onBackToOverview}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm font-medium transition-colors cursor-pointer"
          >
            ← Back to Overview
          </button>
        )}

        <button
          type="button"
          onClick={downloadSpecMarkdown}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Save Experiment Specification (.md)</span>
        </button>
      </div>
    </div>
  );
};
