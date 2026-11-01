import { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Filter,
  Layers,
  Download,
  Play,
  Upload,
} from 'lucide-react';
import { getAllScenarios } from '../data/scenarios';
import { ScenarioExperiment } from '../types/scenario';

interface ScenarioLibraryPageProps {
  onOpenScenario: (scenarioId: string) => void;
  onBackToOverview: () => void;
  onOpenImporter?: () => void;
}

const PROBLEM_TITLES: Record<string, string> = {
  'DNS-01': 'A website name cannot be found, but direct IP works',
  'SRV-04': 'Server responds to ping, but web service is down (Port closed)',
  'HTTP-05': 'The website responds with an application error (HTTP 500)',
  'GW-02': 'Local network works, but external websites cannot be reached',
  'LAN-03': 'Ethernet connected, but device gets APIPA (DHCP lease failure)',
  'DNS-06': 'Wi-Fi shows "Connected, Action Needed" (Captive portal redirection)',
  'IND-07': 'Device says "Connected", but there is no internet access (WAN down)',
};

export function ScenarioLibraryPage({
  onOpenScenario,
  onBackToOverview,
  onOpenImporter,
}: ScenarioLibraryPageProps) {
  const scenarios = getAllScenarios();
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'DNS' | 'ROUTING' | 'SERVICE'>('ALL');

  const filteredScenarios = scenarios.filter((s) => {
    if (selectedFilter === 'DNS') return s.category.includes('DNS') || s.category.includes('Name') || s.category.includes('Access');
    if (selectedFilter === 'ROUTING') return s.category.includes('Routing') || s.category.includes('Gateway') || s.category.includes('Subnet') || s.category.includes('Physical') || s.category.includes('WAN') || s.category.includes('Reachability');
    if (selectedFilter === 'SERVICE') return s.category.includes('Service') || s.category.includes('HTTP') || s.category.includes('Transport') || s.category.includes('Application');
    return true;
  });

  const downloadPacketTracer = (e: React.MouseEvent, s: ScenarioExperiment) => {
    e.stopPropagation();
    if (!s.fileStatus.hasVerifiedPkt) return;
    const fileName = s.fileStatus.suggestedFileName || 'Scenario 1. DNS Failure Cisco Simulation.pkt';
    const link = document.createElement('a');
    link.href = `/api/pkt-download?file=${encodeURIComponent(fileName)}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-8 sm:py-12 animate-fadeIn">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-brand-800">
            <BookOpen className="h-4 w-4 text-brand-600" /> Interactive Network Lab
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Explore Network Failure Experiments
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-slate-600">
            Explore seven distinct connection failures simulated directly in your web browser.
            Step through animated packet flows, inspect device configurations, and compare normal operation against isolated faults.
          </p>
        </div>

        {onOpenImporter && (
          <button
            onClick={onOpenImporter}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Upload className="h-4 w-4 text-brand-600" />
            <span>Import a Cisco Lab (.pkt)</span>
          </button>
        )}
      </header>

      {/* Honest Scope & Simulation Distinction Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Layers className="h-4 w-4 text-brand-600" />
            <span>Architecture & Simulation Reference</span>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl">
            <strong>DNS-01</strong> includes the project's physical reference Cisco Packet Tracer (<code className="font-mono text-slate-800">.pkt</code>) lab artifact available for download.
            The remaining six scenarios (<code className="font-mono text-slate-800">SRV-04, HTTP-05, GW-02, LAN-03, DNS-06, IND-07</code>) are fully simulated directly inside the website — no Packet Tracer installation or external files required.
          </p>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="flex items-center gap-1 font-semibold text-slate-500 mr-1 shrink-0">
          <Filter className="h-3.5 w-3.5" /> Problem Category:
        </span>
        {[
          { id: 'ALL', label: 'All Scenarios (7)' },
          { id: 'DNS', label: 'DNS, Names & Access' },
          { id: 'ROUTING', label: 'Gateway & Physical Links' },
          { id: 'SERVICE', label: 'Web Service & Application' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelectedFilter(f.id as any)}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedFilter === f.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Scenarios Grid: Problem-Centric */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredScenarios.map((scenario) => {
          const isVerified = scenario.fileStatus.hasVerifiedPkt;
          const userProblem = PROBLEM_TITLES[scenario.scenarioId] || scenario.title;

          return (
            <article
              key={scenario.scenarioId}
              onClick={() => onOpenScenario(scenario.scenarioId)}
              className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:border-brand-400 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="space-y-4">
                {/* Badges row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-brand-700 uppercase tracking-wide">
                    {scenario.category}
                  </span>

                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      Cisco Reference (.pkt)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3 text-brand-600" />
                      Interactive Web Simulation
                    </span>
                  )}
                </div>

                {/* Primary User Problem Title */}
                <div>
                  <h2 className="text-base font-bold text-slate-900 group-hover:text-brand-900 transition-colors leading-snug">
                    {userProblem}
                  </h2>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    Scenario Ref: {scenario.scenarioId}
                  </div>
                </div>

                {/* What You Will Learn */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    What You Will Learn:
                  </span>
                  <p className="text-xs leading-relaxed text-slate-600">
                    {scenario.teachingGoal}
                  </p>
                </div>

                {/* Interactive Demo Highlights */}
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 text-xs space-y-1">
                  <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wide">
                    Interactive Demonstration Includes:
                  </span>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {scenario.failureBehavior.contrastInsight}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenScenario(scenario.scenarioId);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-4 py-2.5 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Launch Experiment</span>
                </button>

                {isVerified && (
                  <button
                    type="button"
                    onClick={(e) => downloadPacketTracer(e, scenario)}
                    title="Download verified Cisco .pkt reference file"
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 px-3 py-2 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Reference .pkt</span>
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Back button */}
      <div className="border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={onBackToOverview}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          ← Return to Overview
        </button>
      </div>
    </div>
  );
}
