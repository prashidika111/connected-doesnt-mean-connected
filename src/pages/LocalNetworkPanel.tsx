import { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  CircleHelp,
  Loader2,
  Network,
  RefreshCw,
  Router,
  Route,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type LocalReport = {
  checkedAt: string;
  hostLabel: string;
  platform: string;
  hostname: string;
  interfaces: Array<{
    name: string;
    address: string;
    family: string;
    netmask: string;
    mac: string;
    cidr: string | null;
  }>;
  gateway: string | null;
  gatewayMethod: string;
  gatewayNote: string;
  gatewayRaw: string;
  gatewayPing: null | {
    responded: boolean;
    command: string;
    output: string;
    interpretation: string;
  };
  limitations: string[];
};

type TraceReport = {
  target: string;
  command: string;
  completed: boolean;
  output: string;
  note: string;
  executionLocation: string;
};

export function LocalNetworkPanel({ target }: { target: string }) {
  const [report, setReport] = useState<LocalReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [trace, setTrace] = useState<TraceReport | null>(null);
  const [traceBusy, setTraceBusy] = useState(false);
  const [traceError, setTraceError] = useState('');
  const [showRawRouting, setShowRawRouting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function loadLocal() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/local-diagnostics', { method: 'GET' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not read local network details.');
      setReport(data as LocalReport);
      setIsOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read local network details.');
    } finally {
      setBusy(false);
    }
  }

  async function runTrace() {
    setTraceBusy(true);
    setTraceError('');
    setTrace(null);
    try {
      const response = await fetch('/api/trace-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Route tracing could not run.');
      setTrace(data as TraceReport);
    } catch (e) {
      setTraceError(e instanceof Error ? e.message : 'Route tracing could not run.');
    } finally {
      setTraceBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-brand-800">
            <Network className="h-3.5 w-3.5 text-brand-600" /> Host & Gateway Inspector
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Host Interfaces, Default Gateway & Route Tracing
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Inspect the operating system network interfaces, routing table, and default gateway of the machine running this application.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadLocal}
            disabled={busy}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            <span>{report ? 'Refresh Host Checks' : 'Inspect Host Computer'}</span>
          </button>

          {report && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title={isOpen ? 'Collapse panel' : 'Expand panel'}
            >
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          {error}
        </div>
      )}

      {report && isOpen && (
        <div className="space-y-5 pt-3 border-t border-slate-100 animate-fadeIn">
          {/* Metadata pill */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span>Checked: {new Date(report.checkedAt).toLocaleTimeString()}</span>
            <span>•</span>
            <span>OS: {report.platform}</span>
            <span>•</span>
            <span>Hostname: {report.hostname}</span>
            <span>•</span>
            <span className="text-brand-700 font-sans font-semibold">{report.hostLabel}</span>
          </div>

          {/* 2-column cards: Interfaces vs Gateway */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Interfaces Card */}
            <article className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Activity className="h-4 w-4 text-brand-600" /> Active Network Interfaces
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {report.interfaces.length ? (
                  report.interfaces.map((iface, i) => (
                    <div
                      key={`${iface.name}-${iface.address}-${i}`}
                      className="rounded-xl border border-slate-200 bg-white p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{iface.name}</span>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {iface.family}
                        </span>
                      </div>
                      <div className="font-mono text-slate-700">
                        IP: <span className="font-semibold text-brand-800">{iface.address}</span>
                      </div>
                      <div className="font-mono text-slate-500 text-[11px]">
                        Netmask: {iface.netmask} • MAC: {iface.mac}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No non-internal interfaces found.</p>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                An active interface confirms local configuration, not internet transit.
              </p>
            </article>

            {/* Gateway Card */}
            <article className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Router className="h-4 w-4 text-brand-600" /> Discovered Default Gateway
              </h4>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Gateway IPv4 Address:</span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {report.gateway || 'Not detected'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {report.gatewayNote}
                </p>

                {report.gatewayPing && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {report.gatewayPing.responded ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <CircleHelp className="h-4 w-4 text-amber-600" />
                      )}
                      <span className={report.gatewayPing.responded ? 'text-emerald-800' : 'text-amber-800'}>
                        {report.gatewayPing.responded ? 'Gateway Echo Reply Received' : 'No Ping Reply Observed'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {report.gatewayPing.interpretation}
                    </p>
                  </div>
                )}
              </div>

              {/* Collapsible raw route table */}
              <div className="text-xs">
                <button
                  type="button"
                  onClick={() => setShowRawRouting(!showRawRouting)}
                  className="text-brand-700 hover:text-brand-900 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <span>{showRawRouting ? 'Hide OS Routing Table' : `View OS Routing Table (${report.gatewayMethod})`}</span>
                  {showRawRouting ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showRawRouting && (
                  <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-900 p-2.5 font-mono text-[10px] text-emerald-400">
                    {report.gatewayRaw || 'No command output.'}
                  </pre>
                )}
              </div>
            </article>
          </div>

          {/* Limitations box */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-700" />
              <span>Host Diagnostic Boundaries:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-amber-800">
              {report.limitations.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Traceroute Section */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
              <Route className="h-4 w-4 text-brand-600" /> Trace Hop Route to Destination
            </h4>
            <p className="text-xs text-slate-500">
              Executes the operating system traceroute tool (<code className="font-mono">tracert</code> on Windows) to inspect intermediate hops.
            </p>
          </div>

          <button
            type="button"
            onClick={runTrace}
            disabled={traceBusy || !target.trim()}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            {traceBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Route className="h-3.5 w-3.5" />}
            <span>{traceBusy ? 'Tracing Route Hops…' : 'Trace Route'}</span>
          </button>
        </div>

        {traceError && (
          <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
            {traceError}
          </p>
        )}

        {trace && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 animate-fadeIn text-xs">
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span>Target: {trace.target}</span>
              <span className="font-mono text-[11px] text-slate-500">{trace.command}</span>
            </div>
            <p className="text-slate-600 leading-relaxed">{trace.note}</p>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-900 p-3 font-mono text-[10px] text-emerald-400">
              {trace.output}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
