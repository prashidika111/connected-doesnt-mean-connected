import React from 'react';
import { Activity, BookOpen, Network, ShieldCheck } from 'lucide-react';

interface AboutPageProps {
  onBackToOverview: () => void;
  onOpenQuestions: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBackToOverview, onOpenQuestions }) => (
  <div className="mx-auto max-w-4xl space-y-8 py-8 sm:py-12">
    <header className="space-y-3">
      <p className="text-sm font-semibold text-brand-700">How it works</p>
      <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Understand what each network check can tell you</h1>
      <p className="max-w-3xl text-base leading-7 text-slate-600">This application combines measured checks, guided questions and controlled learning scenarios. Each source of information is kept separate so the explanation does not claim more than the evidence supports.</p>
    </header>
    <div className="grid gap-4 sm:grid-cols-2">
      <article className="rounded-2xl border border-slate-200 bg-white p-6">
        <Activity className="h-6 w-6 text-brand-700" />
        <h2 className="mt-4 text-lg font-bold text-slate-900">Test a destination</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">For a public hostname or IP address, the diagnostic helper can check DNS resolution, a TCP connection and an HTTP or HTTPS response where applicable. These checks run on the computer hosting the application.</p>
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-6">
        <BookOpen className="h-6 w-6 text-brand-700" />
        <h2 className="mt-4 text-lg font-bold text-slate-900">Answer guided questions</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">The questionnaire uses predefined rules to interpret the symptoms you report. It is an educational inference, not a live measurement of your network.</p>
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-6">
        <Network className="h-6 w-6 text-brand-700" />
        <h2 className="mt-4 text-lg font-bold text-slate-900">Explore a controlled scenario</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">The DNS scenario demonstrates how incorrect name resolution can stop access by domain name while direct access to the web server IP still works.</p>
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-6">
        <ShieldCheck className="h-6 w-6 text-brand-700" />
        <h2 className="mt-4 text-lg font-bold text-slate-900">Understand the limits</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">A result from the diagnostic helper does not prove the state of your Wi Fi, network adapter, home router or internet provider path. Unchecked stages remain untested.</p>
      </article>
    </div>
    <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
      <h2 className="text-lg font-bold text-slate-900">How to read the result</h2>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
        <li><strong>Passed:</strong> the check completed and observed the expected response.</li>
        <li><strong>Failed:</strong> the check ran and observed a failure.</li>
        <li><strong>Inconclusive:</strong> the check ran but cannot support a firm conclusion.</li>
        <li><strong>Unavailable:</strong> the check could not be performed.</li>
        <li><strong>Not tested:</strong> the check did not run, so no conclusion can be drawn from it.</li>
      </ul>
    </section>
    <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
      <button onClick={onBackToOverview} className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50">Return to overview</button>
      <button onClick={onOpenQuestions} className="rounded-xl bg-brand-700 px-4 py-3 font-semibold text-white hover:bg-brand-800">Answer guided questions</button>
    </div>
  </div>
);
