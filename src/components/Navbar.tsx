import React from 'react';
import { BookOpen, Globe, Network, RotateCcw, Search, Upload } from 'lucide-react';

export type ActiveView =
  | 'landing'
  | 'investigation'
  | 'questionnaire'
  | 'result'
  | 'simulation'
  | 'scenarios'
  | 'about'
  | 'importer';

interface NavbarProps {
  currentView: ActiveView;
  setCurrentView: (view: ActiveView) => void;
  hasStarted: boolean;
  onReset: () => void;
  hasAnswers: boolean;
}

const navItems: { view: ActiveView; label: string; icon?: React.ReactNode }[] = [
  { view: 'landing', label: 'Home' },
  { view: 'questionnaire', label: 'Diagnose a problem', icon: <BookOpen className="h-4 w-4" /> },
  { view: 'investigation', label: 'Test a website', icon: <Search className="h-4 w-4" /> },
  { view: 'scenarios', label: 'Interactive network lab', icon: <Network className="h-4 w-4" /> },
  { view: 'about', label: 'How it works' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  hasStarted,
  onReset,
  hasAnswers,
}) => {
  const isDiagnoseActive = currentView === 'questionnaire' || currentView === 'result';
  const isLabActive = currentView === 'scenarios' || currentView === 'simulation';

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <button
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-3 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white shadow-xs">
            <Globe className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-tight text-slate-900 sm:text-base">
              Connected Doesn’t Mean Connected
            </span>
            <span className="hidden text-xs text-slate-500 sm:block">
              Understand why network communication fails
            </span>
          </span>
        </button>

        {/* Primary Navigation */}
        <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              (item.view === 'questionnaire' && isDiagnoseActive) ||
              (item.view === 'scenarios' && isLabActive) ||
              currentView === item.view;

            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-brand-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.view === 'questionnaire' && hasAnswers && (
                  <span className="h-2 w-2 rounded-full bg-blue-600" title="Responses saved" />
                )}
              </button>
            );
          })}

          {/* Maintainer Lab Importer Action */}
          <button
            onClick={() => setCurrentView('importer')}
            title="Import a Cisco Packet Tracer (.pkt) lab"
            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold border transition-colors cursor-pointer ${
              currentView === 'importer'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Import Lab</span>
          </button>

          {/* Reset / Restart */}
          {hasStarted && (
            <button
              onClick={onReset}
              title="Start again from beginning"
              className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer ml-1"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
