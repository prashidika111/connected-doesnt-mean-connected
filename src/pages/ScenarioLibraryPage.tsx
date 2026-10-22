import { ArrowRight, BookOpen, CheckCircle2, CircleHelp } from 'lucide-react';

interface ScenarioLibraryPageProps {
  onOpenDnsGuide: () => void;
  onBackToOverview: () => void;
}

const scenarios = [
  {
    title: 'DNS name lookup failure',
    status: 'Packet Tracer guide included',
    available: true,
    teaches: 'A website name cannot be translated to an IP address, even though direct IP access may still work.',
    observe: 'Compare access through www.example.edu with direct access to 192.168.0.20.',
  },
  {
    title: 'Web service unavailable',
    status: 'Concept guide only',
    available: false,
    teaches: 'A server can be reachable while the requested web service does not respond as expected.',
    observe: 'Separate a TCP connection failure from an HTTP error response.',
  },
  {
    title: 'Incorrect address configuration',
    status: 'Learning concept',
    available: false,
    teaches: 'An incorrect IP address or subnet mask can prevent a device from communicating with the intended network.',
    observe: 'Compare the device address, subnet mask and expected local network.',
  },
  {
    title: 'Default gateway unavailable',
    status: 'Learning concept',
    available: false,
    teaches: 'A device may communicate locally but fail to reach destinations outside its subnet.',
    observe: 'Separate local communication from traffic that requires a gateway.',
  },
  {
    title: 'Routing path failure',
    status: 'Learning concept',
    available: false,
    teaches: 'A destination may be reachable in principle while a missing or incorrect route prevents packets from reaching it.',
    observe: 'Look for the point where forwarding no longer reaches the destination.',
  },
  {
    title: 'Delay or packet loss',
    status: 'Learning concept',
    available: false,
    teaches: 'Intermittent delay or dropped packets can make a connection feel unreliable without being fully disconnected.',
    observe: 'Distinguish a slow or inconsistent response from a complete name lookup failure.',
  },
];

export function ScenarioLibraryPage({ onOpenDnsGuide, onBackToOverview }: ScenarioLibraryPageProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-8 py-8 sm:py-12">
      <header className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800"><BookOpen className="h-4 w-4" /> Scenario library</div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Learn how different network failures behave</h1>
        <p className="text-base leading-7 text-slate-600">Each scenario describes what should work, what may fail, and what evidence helps distinguish the cause. Only the DNS scenario has a supplied Packet Tracer file in this project. The other entries are learning concepts, not verified simulations.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {scenarios.map((scenario) => (
          <article key={scenario.title} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${scenario.available ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {scenario.available ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleHelp className="h-3.5 w-3.5" />}{scenario.status}
              </span>
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">{scenario.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{scenario.teaches}</p>
            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-800">What to observe</p>
              <p className="mt-1 text-sm leading-5 text-slate-600">{scenario.observe}</p>
            </div>
            {scenario.available ? (
              <button onClick={onOpenDnsGuide} className="mt-5 inline-flex items-center gap-2 self-start rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">Open the DNS scenario guide <ArrowRight className="h-4 w-4" /></button>
            ) : (
              <p className="mt-auto pt-5 text-xs text-slate-500">No matching prepared simulation file is included.</p>
            )}
          </article>
        ))}
      </div>
      <div className="border-t border-slate-200 pt-5"><button onClick={onBackToOverview} className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50">Return to overview</button></div>
    </div>
  );
}
