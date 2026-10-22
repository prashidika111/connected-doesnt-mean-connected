import { useState } from 'react';
import { Navbar, ActiveView } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { QuestionnairePage } from './pages/QuestionnairePage';
import { ResultPage } from './pages/ResultPage';
import { SimulationGuidePage } from './pages/SimulationGuidePage';
import { AboutPage } from './pages/AboutPage';
import { UserAnswers, QuestionId, EvaluationResult } from './types/diagnosis';
import { evaluateAnswers } from './engine/evaluator';
import { InvestigationPage } from './pages/InvestigationPage';
import { InvestigationResult } from './types/investigation';
import { ScenarioLibraryPage } from './pages/ScenarioLibraryPage';

export function App() {
  const [currentView, setCurrentView] = useState<ActiveView>('landing');
  const [answers, setAnswers] = useState<Partial<UserAnswers>>({});
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [investigationTarget, setInvestigationTarget] = useState('https://example.com');
  const [investigationAutoRunToken, setInvestigationAutoRunToken] = useState(0);
  const [latestInvestigation, setLatestInvestigation] = useState<InvestigationResult | null>(null);

  const hasStarted = Object.keys(answers).length > 0 || currentView !== 'landing';
  const hasAnswers = Object.keys(answers).length > 0;

  const handleAnswerChange = (questionId: QuestionId, optionId: string) => {
    setAnswers((prev) => {
      const updated = { ...prev, [questionId]: optionId };
      // If result is already displayed, live-update it
      if (result) {
        setResult(evaluateAnswers(updated));
      }
      return updated;
    });
  };

  const handleSubmitQuestionnaire = () => {
    const evaluation = evaluateAnswers(answers);
    setResult(evaluation);
    setCurrentView('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setAnswers({});
    setResult(null);
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          if (view === 'investigation') setInvestigationAutoRunToken(0);
          setCurrentView(view);
        }}
        hasStarted={hasStarted}
        onReset={handleReset}
        hasAnswers={hasAnswers}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {currentView === 'landing' && (
          <LandingPage
            onStartQuestions={() => {
              setCurrentView('questionnaire');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenSimulation={() => {
              setCurrentView('scenarios');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenInvestigation={(target) => {
              setInvestigationTarget(target);
              setInvestigationAutoRunToken((token) => token + 1);
              setCurrentView('investigation');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAbout={() => {
              setCurrentView('about');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'investigation' && (
          <InvestigationPage initialTarget={investigationTarget} autoRunToken={investigationAutoRunToken} result={latestInvestigation} onResultChange={setLatestInvestigation} onOpenScenario={() => setCurrentView('simulation')} />
        )}

        {currentView === 'questionnaire' && (
          <QuestionnairePage
            answers={answers}
            onAnswerChange={handleAnswerChange}
            onSubmit={handleSubmitQuestionnaire}
            onReset={handleReset}
            onBackToLanding={() => {
              setCurrentView('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'result' && result && (
          <ResultPage
            result={result}
            onReviseAnswers={() => {
              setCurrentView('questionnaire');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenSimulation={() => {
              setCurrentView('scenarios');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onReset={handleReset}
          />
        )}

        {/* Fallback if user navigates to result without answers */}
        {currentView === 'result' && !result && (
          <div className="text-center py-20 space-y-4">
            <h2 className="text-xl font-bold text-slate-800">
              No Questionnaire Completed Yet
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Please answer the 5 quick guided questions so our deterministic engine can evaluate your symptoms.
            </p>
            <button
              onClick={() => setCurrentView('questionnaire')}
              className="px-6 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors"
            >
              Start Questionnaire
            </button>
          </div>
        )}

        {currentView === 'scenarios' && (
          <ScenarioLibraryPage
            onOpenDnsGuide={() => setCurrentView('simulation')}
            onBackToOverview={() => setCurrentView('landing')}
          />
        )}

        {currentView === 'simulation' && (
          <SimulationGuidePage
            onBackToDiagnosis={result ? () => setCurrentView('result') : undefined}
            onBackToOverview={() => {
              setCurrentView('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'about' && (
          <AboutPage
            onBackToOverview={() => setCurrentView('landing')}
            onOpenQuestions={() => setCurrentView('questionnaire')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-16 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Connected Doesn’t Mean Connected</span>
            <span>•</span>
            <span>Network diagnosis and learning</span>
          </div>
          <div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
