import { FormEvent, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  Clock,
  ExternalLink,
  Info,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StagesVisualizer } from '../components/StagesVisualizer';
import { InvestigationResult, CheckOutcome } from '../types/investigation';
import { LocalNetworkPanel } from './LocalNetworkPanel';

function statusIcon(status: CheckOutcome['status']) {
  switch (status) {
    case 'passed':
      return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-rose-600" />;
    case 'inconclusive':
    case 'unavailable':
      return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    case 'not-tested':
    default:
      return <CircleHelp className="w-5 h-5 text-slate-400" />;
  }
}

function label(status: CheckOutcome['status']) {
  return status.replace('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

interface InvestigationPageProps {
  initialTarget?: string;
  autoRunToken?: number;
  result: InvestigationResult | null;
  onResultChange: (result: InvestigationResult | null) => void;
  onOpenScenario?: (scenarioId?: string) => void;
}

export function InvestigationPage({
  initialTarget = 'https://example.com',
  autoRunToken = 0,
  result,
  onResultChange,
  onOpenScenario,
}: InvestigationPageProps) {
  const [target, setTarget] = useState(initialTarget);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);

  useEffect(() => {
    setTarget(initialTarget);
  }, [initialTarget]);

  async function runTarget(value: string) {
    setLoading(true);
    setError('');
    onResultChange(null);
    try {
      const response = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: value.trim() }),
      });
      const payload = await response.json();
      if (!response.ok && !payload?.checks) {
        throw new Error(payload?.error || payload?.message || `Request failed (${response.status})`);
      }
      onResultChange(payload as InvestigationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reach the diagnostic helper.');
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await runTarget(target);
  }

  useEffect(() => {
    if (autoRunToken > 0) void runTarget(initialTarget);
  }, [autoRunToken]);

  // Demo target presets
  const setDemoTarget = (preset: string) => {
    setTarget(preset);
    void runTarget(preset);
  };

  return (
    <section className="py-8 sm:py-12 space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-brand-800">
          <Activity className="w-4 h-4 text-brand-600" /> Destination Diagnostic Workspace
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Investigate Where a Connection Fails
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Enter a public website URL, hostname, or permitted IPv4 address. The diagnostic helper executes
          native DNS resolution, TCP transport handshake (port 80/443), and HTTP(S) exchange, then maps
          the empirical evidence to an educational multi-stage network model.
        </p>
      </div>

      {/* Target Input Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7 space-y-5">
        <form onSubmit={submit} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label htmlFor="target" className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-brand-600" />
              <span>Target Website URL or Public IPv4 Address</span>
            </label>
            <span className="text-xs text-slate-400">
              Permitted ports: 80 (HTTP), 443 (HTTPS)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="target"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="e.g., https://example.com or 1.1.1.1"
              className="flex-1 min-w-0 rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              maxLength={2048}
              required
            />
            <button
              type="submit"
              disabled={loading || !target.trim()}
              className="inline-flex justify-center items-center gap-2 rounded-xl bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-semibold px-6 py-3 text-sm shadow-xs transition-colors cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Executing Diagnostic Probes…' : 'Run Diagnostic Checks'}
            </button>
          </div>

          {/* Quick Demo Test Presets */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500 mr-1">Demo Test Targets:</span>
            <button
              type="button"
              onClick={() => setDemoTarget('https://example.com')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] transition-colors"
            >
              example.com (Valid Web)
            </button>
            <button
              type="button"
              onClick={() => setDemoTarget('1.1.1.1')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] transition-colors"
            >
              1.1.1.1 (Direct IP)
            </button>
            <button
              type="button"
              onClick={() => setDemoTarget('https://nxdomain-failure-test-999.edu')}
              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-mono text-[11px] border border-rose-200 transition-colors"
            >
              nxdomain-test.edu (DNS Fail)
            </button>
            <button
              type="button"
              onClick={() => setDemoTarget('192.168.1.1')}
              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-mono text-[11px] border border-amber-200 transition-colors"
            >
              192.168.1.1 (SSRF Private IP Block)
            </button>
            <button
              type="button"
              onClick={() => setDemoTarget('https://example.com:8080')}
              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-mono text-[11px] border border-amber-200 transition-colors"
            >
              :8080 (Forbidden Port Block)
            </button>
          </div>

          {/* Vantage point explanation banner */}
          <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-3 text-xs text-brand-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
            <div>
              <strong>Diagnostic Vantage Point Notice: </strong>
              All diagnostic probes originate from the local Node.js process serving this application.
              They test reachability from this host runtime to the public destination, NOT from a browser sandbox
              or from an external student client.
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Investigation Request Error</strong>
                <span>{error}</span>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Local Host Diagnostics Panel (Collapsible / Integrated) */}
      <LocalNetworkPanel target={target} />

      {/* Investigation Results & Evidence Dashboard */}
      {result && (
        <div className="space-y-8 animate-fadeIn">
          {/* Section 1: High-Level Diagnosis & Certainty Banner */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Diagnostic Verdict & Evidence Interpretation
                </span>
                {result.accepted ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Target Accepted & Probed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Target Rejected by Safety Policy
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(result.ranAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {result.educationalHeadline}
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                {result.educationalSummary}
              </p>
            </div>

            {/* Target Breakdown Strip */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400">Target: </span>
                <span className="font-bold text-slate-900">{result.target?.display || target}</span>
              </div>
              {result.target && (
                <>
                  <span>•</span>
                  <div>
                    <span className="text-slate-400">Kind: </span>
                    <span className="text-slate-800 uppercase">{result.target.kind}</span>
                  </div>
                  <span>•</span>
                  <div>
                    <span className="text-slate-400">Port: </span>
                    <span className="text-slate-800">{result.target.port}</span>
                  </div>
                  <span>•</span>
                  <div>
                    <span className="text-slate-400">Protocol: </span>
                    <span className="text-slate-800 uppercase">{result.target.protocol}</span>
                  </div>
                </>
              )}
            </div>

            {/* Inferred vs Measured Warning */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-brand-600" />
                <span>Evidence & Uncertainty Boundary:</span>
              </div>
              <p className="leading-relaxed">
                {result.certaintyNote}
              </p>
            </div>
          </div>

          {/* Section 2: Individual Diagnostic Checks (Evidence Table / Cards) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-brand-600" />
                <span>Empirical Diagnostic Checks</span>
              </h3>
              <span className="text-xs text-slate-500">
                Directly measured from local helper
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.checks.map((check) => {
                const isExpanded = expandedCheck === check.id;

                return (
                  <article
                    key={check.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs hover:border-slate-300 transition-all"
                  >
                    <div className="space-y-3">
                      {/* Check title & status badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {statusIcon(check.status)}
                          <h4 className="font-bold text-slate-900 text-sm">{check.title}</h4>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            check.status === 'passed'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : check.status === 'failed'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {label(check.status)}
                        </span>
                      </div>

                      {/* Summary */}
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {check.summary}
                      </p>

                      {/* Duration & Execution location */}
                      <div className="text-[11px] text-slate-500 space-y-1 font-mono pt-1 border-t border-slate-100">
                        {check.durationMs !== null && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Duration: {check.durationMs} ms</span>
                          </div>
                        )}
                        <div className="truncate text-slate-500">
                          Source: {check.executionLocation}
                        </div>
                      </div>
                    </div>

                    {/* Expandable technical details & raw evidence */}
                    <div className="pt-2 border-t border-slate-100 text-xs">
                      <button
                        type="button"
                        onClick={() => setExpandedCheck(isExpanded ? null : check.id)}
                        className="w-full flex items-center justify-between text-brand-700 hover:text-brand-900 font-semibold cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Raw Evidence' : 'Inspect Evidence Details'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 animate-fadeIn">
                          {check.detail && (
                            <div>
                              <strong className="text-slate-700 block">Detail:</strong>
                              <span className="font-mono">{check.detail}</span>
                            </div>
                          )}
                          <div>
                            <strong className="text-slate-700 block">Limitations:</strong>
                            <span>{check.limitations}</span>
                          </div>
                          {check.evidence && Object.keys(check.evidence).length > 0 && (
                            <div>
                              <strong className="text-slate-700 block">Raw Evidence Payload:</strong>
                              <pre className="mt-1 p-2 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto font-mono text-[10px]">
                                {JSON.stringify(check.evidence, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Section 3: Interactive Network Stages Visualizer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Evidence-Driven Network Path
              </h3>
              <span className="text-xs text-slate-500">
                Interactive Multi-Stage Model
              </span>
            </div>

            <StagesVisualizer
              stages={result.pathStages.map((stage) => ({
                id: stage.id,
                name: stage.name,
                role: stage.role,
                status: stage.status,
                description: `${stage.description} [Provenance: ${stage.provenance}]`,
                provenance: stage.provenance,
              }))}
              interactive={true}
              onSelectScenario={(scenId) => {
                if (onOpenScenario) onOpenScenario(scenId);
              }}
            />
          </div>

          {/* Section 4: Related Educational Scenario Callout */}
          {result.mappedScenarioId && onOpenScenario && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/60 p-6 shadow-sm">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                    Related Scenario: {result.mappedScenarioId}
                  </span>
                  <span className="text-xs font-semibold text-brand-800">
                    Cisco Packet Tracer Educational Link
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  Observe and reproduce this failure in a virtual network
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                  The evidence observed in this check corresponds to educational scenario {result.mappedScenarioId}.
                  Open the guided lab to observe packet flow, reproduce the fault step-by-step, and test your understanding.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenScenario(result.mappedScenarioId || undefined)}
                className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-5 py-3 text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <span>Open Scenario {result.mappedScenarioId} Guide</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
