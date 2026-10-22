import React from 'react';
import { Activity, BookOpen, Globe, Network, RotateCcw } from 'lucide-react';

export type ActiveView = 'landing' | 'investigation' | 'questionnaire' | 'result' | 'simulation' | 'scenarios' | 'about';

interface NavbarProps {
  currentView: ActiveView;
  setCurrentView: (view: ActiveView) => void;
  hasStarted: boolean;
  onReset: () => void;
  hasAnswers: boolean;
}

const navItems: { view: ActiveView; label: string; icon?: React.ReactNode }[] = [
  { view: 'landing', label: 'Overview' },
  { view: 'investigation', label: 'Test a destination', icon: <Activity className="h-4 w-4" /> },
  { view: 'questionnaire', label: 'Guided diagnosis', icon: <BookOpen className="h-4 w-4" /> },
  { view: 'scenarios', label: 'Scenario library', icon: <Network className="h-4 w-4" /> },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentView, setCurrentView, hasStarted, onReset, hasAnswers,
}) => (
  <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
      <button onClick={() => setCurrentView('landing')} className="flex items-center gap-3 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-brand-500">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white"><Globe className="h-5 w-5" /></span>
        <span>
          <span className="block text-sm font-bold tracking-tight text-slate-900 sm:text-base">Connected Doesn’t Mean Connected</span>
          <span className="hidden text-xs text-slate-500 sm:block">Understand where network communication fails</span>
        </span>
      </button>
      <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-1">
        {navItems.map((item) => (
          <button key={item.view} onClick={() => setCurrentView(item.view)} aria-current={currentView === item.view ? 'page' : undefined}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${currentView === item.view ? 'bg-blue-50 text-brand-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
            {item.icon}{item.label}
            {item.view === 'questionnaire' && hasAnswers && <span className="h-2 w-2 rounded-full bg-blue-600" />}
          </button>
        ))}
        <button onClick={() => setCurrentView('about')} className={`rounded-lg px-3 py-2 text-sm font-medium ${currentView === 'about' ? 'bg-blue-50 text-brand-800' : 'text-slate-600 hover:bg-slate-100'}`}>How it works</button>
        {hasStarted && <button onClick={onReset} title="Start again" className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"><RotateCcw className="h-4 w-4" /></button>}
      </nav>
    </div>
  </header>
);
