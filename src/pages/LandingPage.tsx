import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Network,
  Search,
  CheckCircle2,
  XCircle,
  Laptop,
  Wifi,
  Router,
  Globe,
  Server,
} from 'lucide-react';

interface LandingPageProps {
  onStartQuestions: (initialSymptom?: string) => void;
  onOpenSimulation: () => void;
  onOpenAbout: () => void;
  onOpenInvestigation: (target: string) => void;
}

const COMMON_SYMPTOMS = [
  {
    id: 'symptom_web_wont_open',
    title: 'A website will not open at all',
    description: 'The browser spins and eventually times out or says the site cannot be reached.',
  },
  {
    id: 'symptom_some_work_others_dont',
    title: 'Some websites work, but others do not',
    description: 'You can reach search engines or chat apps, but specific web pages fail.',
  },
  {
    id: 'symptom_connected_no_internet',
    title: 'Device says "Connected", but there is no internet',
    description: 'Wi-Fi or Ethernet shows connected, but no website or service opens.',
  },
  {
    id: 'symptom_ip_works_name_fails',
    title: 'A website works by IP address, but not by name',
    description: 'Entering numbers like 192.168.0.20 opens the page, but domain names fail.',
  },
  {
    id: 'symptom_dont_know',
    title: 'I do not know what is wrong',
    description: 'Step through 5 quick guided questions to evaluate symptoms methodically.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartQuestions,
  onOpenSimulation,
  onOpenAbout,
  onOpenInvestigation,
}) => {
  const [quickTarget, setQuickTarget] = useState('https://example.com');

  return (
    <div className="mx-auto max-w-6xl space-y-12 py-8 sm:py-12 animate-fadeIn">
      {/* Hero Section */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xs space-y-6">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-brand-800">
            <Activity className="h-4 w-4 text-brand-600" /> Educational Network Diagnostic & Learning System
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight tracking-tight text-slate-900">
            Your device says it's connected. <br className="hidden sm:inline" />
            <span className="text-brand-700">So why isn't the website loading?</span>
          </h1>
          <p className="text-base sm:text-lg leading-relaxed text-slate-600">
            Find out what might be going wrong. Get guided through a connection problem, test a website,
            or explore an interactive network experiment.
          </p>
        </div>

        {/* Three Primary Entry Cards */}
        <div className="grid gap-6 md:grid-cols-3 pt-2">
          {/* Card 1: Diagnose a problem */}
          <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-6 shadow-xs hover:border-brand-400 hover:bg-white transition-all group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <BookOpen className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-brand-900 transition-colors">
                Diagnose a Problem
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Answer a few simple questions to understand what may be wrong with your connection.
                Eliminates working layers and identifies likely causes.
              </p>
            </div>
            <button
              onClick={() => onStartQuestions()}
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-900 cursor-pointer"
            >
              <span>Start Guided Diagnosis</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </article>

          {/* Card 2: Test a website */}
          <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-6 shadow-xs hover:border-brand-400 hover:bg-white transition-all group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-brand-800 flex items-center justify-center">
                <Search className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-brand-900 transition-colors">
                Test a Website
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Check whether a website responds and see which communication steps succeed or fail — from finding the address to establishing contact.
              </p>
            </div>
            <button
              onClick={() => onOpenInvestigation(quickTarget)}
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-900 cursor-pointer"
            >
              <span>Open Website Tester</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </article>

          {/* Card 3: Explore the network lab */}
          <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-6 shadow-xs hover:border-brand-400 hover:bg-white transition-all group">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <Network className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 group-hover:text-brand-900 transition-colors">
                Explore the Network Lab
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Watch how a request moves through a network and discover what happens when a component fails.
                Interactive simulations with step-by-step packet inspection.
              </p>
            </div>
            <button
              onClick={onOpenSimulation}
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-900 cursor-pointer"
            >
              <span>Explore Interactive Experiments</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </article>
        </div>
      </section>

      {/* Visual Explanation of the Multi-Stage Journey */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="max-w-3xl space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-brand-700">
            Why Connected Doesn’t Mean Connected
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            A connection is a path of multiple stages, not a single light switch.
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            When your computer shows a Wi-Fi or network icon, it only proves that the first stage — the link to your local router — is active.
            Every website visit must pass through five distinct stages. Communication can succeed at the beginning and break at any later point.
          </p>
        </div>

        {/* Conceptual Five-Stage Path Demonstration */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          {[
            { stage: '1. Your Device', role: 'Hardware & OS network stack', status: 'pass', icon: <Laptop className="h-5 w-5" /> },
            { stage: '2. Local Connection', role: 'Wi-Fi or Ethernet cable', status: 'pass', icon: <Wifi className="h-5 w-5" /> },
            { stage: '3. Gateway & Router', role: 'Local router & ISP routing', status: 'pass', icon: <Router className="h-5 w-5" /> },
            { stage: '4. Name Resolution', role: 'DNS server lookup', status: 'fail', icon: <Globe className="h-5 w-5" /> },
            { stage: '5. Destination Service', role: 'Web server application', status: 'blocked', icon: <Server className="h-5 w-5" /> },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-4 border text-center space-y-2 transition-all ${
                item.status === 'pass'
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : item.status === 'fail'
                  ? 'bg-rose-50 border-rose-300 text-rose-950 ring-2 ring-rose-400'
                  : 'bg-slate-50 border-slate-200 text-slate-400 opacity-70'
              }`}
            >
              <div
                className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center ${
                  item.status === 'pass'
                    ? 'bg-emerald-200/70 text-emerald-800'
                    : item.status === 'fail'
                    ? 'bg-rose-200 text-rose-800'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {item.icon}
              </div>
              <div className="font-bold text-xs">{item.stage}</div>
              <div className="text-[11px] leading-tight opacity-80">{item.role}</div>

              <div className="pt-1">
                {item.status === 'pass' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Working
                  </span>
                )}
                {item.status === 'fail' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full animate-pulse">
                    <XCircle className="h-3 w-3" /> Fails Here
                  </span>
                )}
                {item.status === 'blocked' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                    Not Reached
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <strong>The Result:</strong> In this common scenario, Stages 1, 2, and 3 are working perfectly, so your operating system reports that you are "Connected".
          However, because Stage 4 (Name Resolution) fails, your browser never reaches Stage 5 (the website).
        </div>
      </section>

      {/* Common Symptoms Selector */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="max-w-2xl space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            What are you experiencing?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Select the symptom that matches your situation to begin guided diagnosis:
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-2">
          {COMMON_SYMPTOMS.map((s) => (
            <button
              key={s.id}
              onClick={() => onStartQuestions(s.id)}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/60 hover:border-brand-400 text-left transition-all cursor-pointer space-y-1.5 group"
            >
              <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-brand-900 flex items-center justify-between">
                <span>{s.title}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand-700 transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{s.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Virtual Experiment Banner */}
      <section className="rounded-3xl bg-slate-900 p-6 sm:p-8 text-white space-y-4 shadow-md">
        <div className="inline-flex items-center gap-2 rounded-md bg-blue-500/20 px-2.5 py-1 text-xs font-mono font-bold text-cyan-300">
          Featured Experiment: DNS Failure vs Direct IP
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          A domain name fails, but direct IP access works perfectly.
        </h2>
        <p className="max-w-3xl text-xs sm:text-sm leading-relaxed text-slate-300">
          In our verified Cisco Packet Tracer experiment (DNS-01), the client reaches the web server at{' '}
          <code className="text-cyan-300 font-mono">192.168.0.20</code> by raw numerical address, while entering{' '}
          <code className="text-cyan-300 font-mono">www.example.edu</code> fails because the DNS resolver address was intentionally misconfigured to{' '}
          <code className="text-rose-300 font-mono">192.168.0.99</code>. Watch how Layer 3 IP routing succeeds while Layer 7 name resolution halts.
        </p>
        <button
          onClick={onOpenSimulation}
          className="rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
        >
          Launch Interactive Experiment & Download .pkt
        </button>
      </section>

      {/* Quick Website Test Bar */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Want to test a specific website right now?</h3>
            <p className="text-xs text-slate-500">
              Check address lookup, connection handshake, and server response from this server.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onOpenInvestigation(quickTarget);
            }}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <input
              value={quickTarget}
              onChange={(e) => setQuickTarget(e.target.value)}
              placeholder="https://example.com"
              className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm font-mono w-full sm:w-64 outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              className="rounded-xl bg-brand-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-brand-800 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
            >
              Test
            </button>
          </form>
        </div>
      </section>

      {/* Technical Specification Link */}
      <div className="text-center">
        <button
          onClick={onOpenAbout}
          className="text-xs sm:text-sm font-semibold text-brand-700 underline decoration-blue-300 underline-offset-4 hover:text-brand-900 cursor-pointer"
        >
          Read How the System Works & Technical Boundaries →
        </button>
      </div>
    </div>
  );
};
