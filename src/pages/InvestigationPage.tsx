import { FormEvent, useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, CircleHelp, Loader2, Search, XCircle } from 'lucide-react';
import { StagesVisualizer } from '../components/StagesVisualizer';
import { InvestigationResult, CheckOutcome } from '../types/investigation';
import { LocalNetworkPanel } from './LocalNetworkPanel';

function statusIcon(status: CheckOutcome['status']) {
  if (status === 'passed') return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
  if (status === 'failed') return <XCircle className="w-5 h-5 text-rose-600" />;
  if (status === 'inconclusive' || status === 'unavailable') return <AlertTriangle className="w-5 h-5 text-amber-600" />;
  return <CircleHelp className="w-5 h-5 text-slate-400" />;
}

function label(status: CheckOutcome['status']) {
  return status.replace('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function InvestigationPage({ initialTarget = 'https://example.com', autoRunToken = 0, result, onResultChange, onOpenScenario }: { initialTarget?: string; autoRunToken?: number; result: InvestigationResult | null; onResultChange: (result: InvestigationResult | null) => void; onOpenScenario?: () => void }) {
  const [target, setTarget] = useState(initialTarget);
  useEffect(() => { setTarget(initialTarget); }, [initialTarget]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    setTarget(initialTarget);
  }, [initialTarget]);

  useEffect(() => {
    if (autoRunToken > 0) void runTarget(initialTarget);
  }, [autoRunToken]);

  return (
    <section className="py-8 sm:py-12 space-y-7">
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
          <Activity className="w-4 h-4" /> Destination diagnostic workspace
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">See where a connection may be failing</h1>
        <p className="text-slate-600 leading-relaxed">
          Enter a public website URL or IP address. The local diagnostic helper checks DNS (for hostnames), TCP connectivity, and HTTP(S) response, then maps the evidence to an explanatory network path.
        </p>
      </div>

      <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <label htmlFor="target" className="block text-sm font-semibold text-slate-800">Website URL or public IP address</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="target"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder="https://example.com or 1.1.1.1"
            className="flex-1 min-w-0 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            maxLength={2048}
            required
          />
          <button type="submit" disabled={loading || !target.trim()} className="inline-flex justify-center items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold px-5 py-3 text-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Checking destination…' : 'Run network checks'}
          </button>
        </div>
        <p className="text-xs text-slate-500">Destination checks run from the machine hosting this app. Local checks below inspect that same computer, not necessarily a different device viewing the website.</p>
        {error && <p role="alert" className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</p>}
      </form>

      <LocalNetworkPanel target={target} />

      {result && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Diagnostic interpretation</p>
            <h2 className="text-xl font-bold text-slate-900">{result.educationalHeadline}</h2>
            <p className="text-slate-700">{result.educationalSummary}</p>
            <p className="text-xs text-slate-500">{result.certaintyNote}</p>
            {result.rejectedReason && <p className="text-sm text-rose-700">{result.rejectedReason}</p>}
            <div className="text-xs text-slate-500">Target: {result.target?.display || target} · Checked: {new Date(result.ranAt).toLocaleString()}</div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Results from each check</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {result.checks.map((check) => (
                <article key={check.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center gap-2">{statusIcon(check.status)}<h3 className="font-semibold text-slate-900">{check.title}</h3></div>
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{label(check.status)}</span>
                  <p className="text-sm text-slate-700">{check.summary}</p>
                  {check.detail && <p className="text-xs text-slate-500">{check.detail}</p>}
                  {check.durationMs !== null && <p className="text-xs text-slate-500">Duration: {check.durationMs} ms</p>}
                  <p className="text-xs text-slate-500">Source: {check.executionLocation}</p>
                  <p className="text-xs text-slate-500">Limitation: {check.limitations}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Network path based on evidence</h2>
            <p className="text-sm text-slate-600">Green/red states describe the checks observed. Local interface and gateway evidence is available in the local network panel above; it still cannot inspect the router internally.</p>
            <StagesVisualizer stages={result.pathStages.map((stage) => ({
              id: stage.id, name: stage.name, role: stage.role, status: stage.status,
              description: `${stage.description} (${stage.provenance.replace('-', ' ')})`, provenance: stage.provenance,
            }))} interactive={true} />
          </div>
          {result.mappedScenarioId && onOpenScenario && (
            <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Learn through a related scenario</h2>
                <p className="mt-1 text-sm text-slate-700">The observed pattern may relate to the DNS learning scenario. Open the guide to compare it with a controlled simulation.</p>
              </div>
              <button type="button" onClick={onOpenScenario} className="shrink-0 rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-800">Open the scenario guide</button>
            </div>
          )}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
            <strong>What this result means:</strong> a failed check from this computer does not prove the same failure exists on your device or network. Firewalls, DNS resolvers, geographic routing and temporary outages can change results.
          </div>
        </div>
      )}
    </section>
  );
}
