import React, { useState } from 'react';
import { Activity, ArrowRight, BookOpen, Network, ShieldCheck } from 'lucide-react';

interface LandingPageProps {
  onStartQuestions: () => void;
  onOpenSimulation: () => void;
  onOpenAbout: () => void;
  onOpenInvestigation: (target: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartQuestions, onOpenSimulation, onOpenAbout, onOpenInvestigation,
}) => {
  const [target, setTarget] = useState('https://example.com');

  return (
    <div className="mx-auto max-w-6xl space-y-12 py-8 sm:py-12">
      <section className="grid items-center gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800">
            <Activity className="h-4 w-4" /> Network diagnosis and learning
          </div>
          <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
            Find where a network connection may be failing.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Test a website, describe a connection problem, or explore a controlled network scenario. See what the available evidence shows and what it cannot prove.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={onStartQuestions} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50">
              <BookOpen className="h-4 w-4" /> Answer guided questions
            </button>
            <button onClick={onOpenSimulation} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 font-semibold text-brand-800 hover:bg-blue-50">
              <Network className="h-4 w-4" /> Explore network scenarios
            </button>
          </div>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); onOpenInvestigation(target); }} className="rounded-2xl border border-blue-100 bg-slate-50 p-5 sm:p-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-white"><Activity className="h-5 w-5" /></div>
          <h2 className="text-xl font-bold text-slate-900">Test a website or IP address</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Run DNS, connection and web response checks where applicable.</p>
          <label htmlFor="home-target" className="mt-5 block text-sm font-semibold text-slate-800">Website address or IP address</label>
          <input id="home-target" value={target} onChange={(event) => setTarget(event.target.value)} maxLength={2048} required
            placeholder="https://example.com or 8.8.8.8"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-3 font-semibold text-white hover:bg-brand-800 focus:outline-none focus:ring-4 focus:ring-blue-200">
            Run network checks <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-3 text-xs leading-5 text-slate-500">Checks run from the computer hosting this application, not directly from your phone or laptop.</p>
        </form>
      </section>

      <section className="space-y-4">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Three ways to understand a connection</h2>
          <p className="text-slate-600">Choose the approach that matches what you know about the problem.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
            <Activity className="h-6 w-6 text-brand-700" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">Test a destination</h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">Check name resolution, connection attempts and web responses. Each result includes its source and limitations.</p>
            <button onClick={() => onOpenInvestigation(target)} className="mt-5 inline-flex items-center gap-2 self-start font-semibold text-brand-800 hover:text-brand-950">Open destination checks <ArrowRight className="h-4 w-4" /></button>
          </article>
          <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
            <BookOpen className="h-6 w-6 text-brand-700" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">Understand a connection problem</h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">Answer five guided questions and receive a cautious explanation based on your answers.</p>
            <button onClick={onStartQuestions} className="mt-5 inline-flex items-center gap-2 self-start font-semibold text-brand-800 hover:text-brand-950">Start guided diagnosis <ArrowRight className="h-4 w-4" /></button>
          </article>
          <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
            <Network className="h-6 w-6 text-brand-700" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">Explore network scenarios</h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">Learn how a controlled DNS failure can stop domain access even when direct IP access still works.</p>
            <button onClick={onOpenSimulation} className="mt-5 inline-flex items-center gap-2 self-start font-semibold text-brand-800 hover:text-brand-950">Open scenario guide <ArrowRight className="h-4 w-4" /></button>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><ShieldCheck className="h-5 w-5" /></div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">What these checks can and cannot tell you</h2>
            <p className="text-sm leading-6 text-slate-600">The diagnostic service checks a public destination from the computer running this application. It cannot directly inspect your device Wi Fi, home router, local gateway or the entire route your traffic takes.</p>
            <div className="flex flex-wrap gap-2 pt-1 text-xs font-medium text-slate-700">
              <span className="rounded-full bg-slate-100 px-3 py-1.5">DNS lookup</span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5">TCP connection</span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5">Web response</span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5">Evidence and uncertainty</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-[#456A91] p-6 text-white sm:p-8">
        <p className="text-sm font-semibold text-cyan-300">Learning scenario</p>
        <h2 className="mt-2 text-2xl font-bold">A website name fails, but its IP address works</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">In the DNS demonstration, the client can reach the web server by its numerical address while the incorrect DNS setting prevents the domain name from resolving. The simulation guide explains how to reproduce and restore this state in Cisco Packet Tracer.</p>
        <button onClick={onOpenSimulation} className="mt-5 rounded-xl bg-white px-4 py-3 font-semibold text-slate-950 hover:bg-slate-100">Read the DNS scenario guide</button>
      </section>

      <div className="text-center"><button onClick={onOpenAbout} className="text-sm font-semibold text-brand-800 underline decoration-blue-200 underline-offset-4 hover:text-brand-950">Read how the diagnostic system works</button></div>
    </div>
  );
};
