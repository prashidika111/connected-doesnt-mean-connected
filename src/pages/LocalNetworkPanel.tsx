import { useState } from 'react';
import { Activity, CheckCircle2, CircleHelp, Loader2, Network, RefreshCw, Router, Route } from 'lucide-react';

type LocalReport = {
  checkedAt: string; hostLabel: string; platform: string; hostname: string;
  interfaces: Array<{name:string; address:string; family:string; netmask:string; mac:string; cidr:string | null}>;
  gateway: string | null; gatewayMethod: string; gatewayNote: string; gatewayRaw: string;
  gatewayPing: null | {responded:boolean; command:string; output:string; interpretation:string}; limitations: string[];
};
type TraceReport = { target:string; command:string; completed:boolean; output:string; note:string; executionLocation:string };

export function LocalNetworkPanel({ target }: { target: string }) {
  const [report, setReport] = useState<LocalReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [trace, setTrace] = useState<TraceReport | null>(null);
  const [traceBusy, setTraceBusy] = useState(false);
  const [traceError, setTraceError] = useState('');

  async function loadLocal() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/local-diagnostics', { method: 'GET' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not read local network details.');
      setReport(data as LocalReport);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not read local network details.'); }
    finally { setBusy(false); }
  }
  async function runTrace() {
    setTraceBusy(true); setTraceError(''); setTrace(null);
    try {
      const response = await fetch('/api/trace-route', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({target}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Route tracing could not run.');
      setTrace(data as TraceReport);
    } catch (e) { setTraceError(e instanceof Error ? e.message : 'Route tracing could not run.'); }
    finally { setTraceBusy(false); }
  }

  return <section className="space-y-5 rounded-3xl border border-[#ded9d0] bg-[#fffdf9] p-5 sm:p-7">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-3xl space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#c9ddd4] bg-[#edf6f0] px-3 py-1 text-sm font-semibold text-[#345c4b]"><Network className="h-4 w-4"/> Local network checks</div>
        <h2 className="text-2xl font-bold text-[#303b37]">What is this computer connected to?</h2>
        <p className="text-[#5e6964]">Read this computer’s network interfaces and routing table, then check whether its default gateway responds. These checks run on the computer hosting this app.</p>
      </div>
      <button onClick={loadLocal} disabled={busy} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#c9ddd4] bg-[#eaf3ed] px-4 py-3 font-semibold text-[#345c4b] hover:bg-[#dfede3] disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4"/>}{report ? 'Refresh local checks' : 'Inspect this computer'}</button>
    </div>
    {error && <p role="alert" className="rounded-xl border border-[#e7c8c3] bg-[#fbefed] p-3 text-[#854d46]">{error}</p>}
    {report && <div className="space-y-4">
      <div className="rounded-xl border border-[#e5e0d8] bg-white p-4 text-sm text-[#66706b]">Checked {new Date(report.checkedAt).toLocaleString()} · OS: {report.platform} · Host: {report.hostname}</div>
      <div className="grid gap-3 md:grid-cols-2">
        <article className="rounded-2xl border border-[#d9e4dd] bg-[#f2f7f2] p-4 space-y-2"><h3 className="flex items-center gap-2 font-bold text-[#344d40]"><Activity className="h-5 w-5"/> Network interfaces</h3>
          {report.interfaces.length ? report.interfaces.map((iface, i) => <div key={`${iface.name}-${iface.address}-${i}`} className="rounded-xl border border-[#e0e8e1] bg-white p-3 text-sm"><p className="font-bold text-[#35443c]">{iface.name} <span className="font-normal text-[#66706b]">({iface.family})</span></p><p>IP address: <code>{iface.address}</code></p><p>Netmask: <code>{iface.netmask}</code></p><p>MAC: <code>{iface.mac}</code></p></div>) : <p className="text-sm">No non-internal network interfaces were returned.</p>}
          <p className="text-xs text-[#68736c]">An assigned address shows configuration, not proof of internet access.</p>
        </article>
        <article className="rounded-2xl border border-[#d8dfeb] bg-[#f1f4fa] p-4 space-y-3"><h3 className="flex items-center gap-2 font-bold text-[#3e4e6a]"><Router className="h-5 w-5"/> Default gateway</h3>
          <p className="text-lg font-bold text-[#35445e]">{report.gateway || 'Not detected'}</p><p className="text-sm text-[#626e82]">{report.gatewayNote}</p>
          {report.gatewayPing ? <div className="rounded-xl border border-[#e0e3eb] bg-white p-3"><p className="flex items-center gap-2 font-semibold">{report.gatewayPing.responded ? <CheckCircle2 className="h-4 w-4 text-[#5a8b6c]"/> : <CircleHelp className="h-4 w-4 text-[#a77b53]"/>}{report.gatewayPing.responded ? 'Gateway replied to ping' : 'No ping reply observed'}</p><p className="mt-1 text-sm text-[#667085]">{report.gatewayPing.interpretation}</p><details className="mt-2 text-xs"><summary className="cursor-pointer">Command output</summary><pre className="mt-2 whitespace-pre-wrap break-words">{report.gatewayPing.output}</pre></details></div> : null}
          <details className="text-xs text-[#626e82]"><summary className="cursor-pointer">Routing-table evidence ({report.gatewayMethod})</summary><pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap break-words">{report.gatewayRaw || 'No command output.'}</pre></details>
        </article>
      </div>
      <div className="rounded-xl border border-[#e7d8bd] bg-[#fcf6e9] p-4"><h3 className="font-bold text-[#765b2f]">Read these results carefully</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#76684e]">{report.limitations.map((item, i) => <li key={i}>{item}</li>)}</ul></div>
    </div>}
    <div className="border-t border-[#e5e0d8] pt-5 space-y-3">
      <div><h3 className="flex items-center gap-2 font-bold text-[#303b37]"><Route className="h-5 w-5"/> Trace the route to your destination</h3><p className="mt-1 text-sm text-[#5e6964]">Runs the operating system’s traceroute tool for the destination above, showing hops that respond from this computer.</p></div>
      <button onClick={runTrace} disabled={traceBusy || !target.trim()} className="inline-flex items-center gap-2 rounded-xl border border-[#d8d1e7] bg-[#f2eff9] px-4 py-2.5 font-semibold text-[#5a4c7c] hover:bg-[#e9e3f5] disabled:opacity-60">{traceBusy ? <Loader2 className="h-4 w-4 animate-spin"/> : <Route className="h-4 w-4"/>}{traceBusy ? 'Tracing route…' : `Trace route to ${target || 'destination'}`}</button>
      {traceError && <p role="alert" className="text-sm text-[#854d46]">{traceError}</p>}
      {trace && <div className="rounded-xl border border-[#e5e0d8] bg-white p-4 space-y-2"><p className="font-semibold text-[#3e4e6a]">Route trace: {trace.target}</p><p className="text-sm text-[#66706b]">{trace.note}</p><pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[#f7f5f0] p-3 text-xs text-[#414943]">{trace.output}</pre></div>}
    </div>
  </section>;
}
