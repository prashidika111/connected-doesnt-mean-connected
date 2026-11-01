import { useState } from 'react';
import { Navbar, ActiveView } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { QuestionnairePage } from './pages/QuestionnairePage';
import { ResultPage } from './pages/ResultPage';
import { SimulationGuidePage } from './pages/SimulationGuidePage';
import { AboutPage } from './pages/AboutPage';
import { LabImporterPage } from './pages/LabImporterPage';
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
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('DNS-01');

  const hasStarted = Object.keys(answers).length > 0 || currentView !== 'landing';
  const hasAnswers = Object.keys(answers).length > 0;

  const handleAnswerChange = (questionId: QuestionId, optionId: string) => {
    setAnswers((prev) => {
      const updated = { ...prev, [questionId]: optionId };
      if (result) {
        setResult(evaluateAnswers(updated));
      }
      return updated;
    });
  };

  const handleStartQuestions = (initialSymptom?: string) => {
    if (initialSymptom === 'symptom_ip_works_name_fails') {
      setAnswers({
        Q_LINK_STATUS: 'LINK_WIFI_ETH_OK',
        Q_TARGET_TYPE: 'TARGET_WEBSITE_NAME',
        Q_SCOPE: 'SCOPE_ALL_WEBSITES',
        Q_SYMPTOM_ERROR: 'ERROR_NAME_RESOLUTION',
        Q_DIRECT_IP: 'IP_WORKS',
      });
    } else if (initialSymptom === 'symptom_connected_no_internet') {
      setAnswers({
        Q_LINK_STATUS: 'LINK_WIFI_ETH_OK',
        Q_TARGET_TYPE: 'TARGET_WEBSITE_NAME',
        Q_SCOPE: 'SCOPE_ALL_APPS_DEAD',
        Q_SYMPTOM_ERROR: 'ERROR_NO_INTERNET_BANNER',
        Q_DIRECT_IP: 'IP_FAILS',
      });
    } else if (initialSymptom === 'symptom_some_work_others_dont') {
      setAnswers({
        Q_LINK_STATUS: 'LINK_WIFI_ETH_OK',
        Q_TARGET_TYPE: 'TARGET_WEBSITE_NAME',
        Q_SCOPE: 'SCOPE_SINGLE_SPECIFIC',
      });
    }
    setCurrentView('questionnaire');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitQuestionnaire = () => {
    const evaluation = evaluateAnswers(answers);
    setResult(evaluation);
    if (evaluation.scenarioId) {
      setSelectedScenarioId(evaluation.scenarioId);
    }
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
            onStartQuestions={handleStartQuestions}
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
          <InvestigationPage
            initialTarget={investigationTarget}
            autoRunToken={investigationAutoRunToken}
            result={latestInvestigation}
            onResultChange={setLatestInvestigation}
            onOpenScenario={(scenId) => {
              if (scenId) setSelectedScenarioId(scenId);
              setCurrentView('simulation');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
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
              if (result.scenarioId) setSelectedScenarioId(result.scenarioId);
              setCurrentView('simulation');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenInvestigation={() => {
              setCurrentView('investigation');
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
              className="px-6 py-2.5 rounded-xl bg-brand-700 text-white font-semibold text-sm hover:bg-brand-800 transition-colors cursor-pointer"
            >
              Start Guided Diagnosis
            </button>
          </div>
        )}

        {currentView === 'scenarios' && (
          <ScenarioLibraryPage
            onOpenScenario={(scenId) => {
              setSelectedScenarioId(scenId);
              setCurrentView('simulation');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBackToOverview={() => setCurrentView('landing')}
            onOpenImporter={() => {
              setCurrentView('importer');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'simulation' && (
          <SimulationGuidePage
            initialScenarioId={selectedScenarioId}
            onBackToDiagnosis={result ? () => setCurrentView('result') : undefined}
            onBackToScenarios={() => {
              setCurrentView('scenarios');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBackToOverview={() => {
              setCurrentView('landing');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'importer' && (
          <LabImporterPage
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

      {/* Product-Oriented Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-20 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-bold text-slate-900 text-sm block">
                Connected Doesn’t Mean Connected
              </span>
              <p className="text-slate-500 max-w-xl text-xs">
                An educational network diagnosis and visual explanation system demonstrating how communication
                fails across multi-stage network paths.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
              <button onClick={() => setCurrentView('landing')} className="hover:text-brand-800 cursor-pointer">
                Home
              </button>
              <button onClick={() => setCurrentView('questionnaire')} className="hover:text-brand-800 cursor-pointer">
                Diagnose
              </button>
              <button onClick={() => setCurrentView('investigation')} className="hover:text-brand-800 cursor-pointer">
                Test Website
              </button>
              <button onClick={() => setCurrentView('scenarios')} className="hover:text-brand-800 cursor-pointer">
                Network Lab
              </button>
              <button onClick={() => setCurrentView('importer')} className="hover:text-brand-800 cursor-pointer">
                Lab Importer
              </button>
              <button onClick={() => setCurrentView('about')} className="hover:text-brand-800 cursor-pointer">
                How It Works
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              Diagnostic probes run from the host Node.js runtime. Packet simulations are modeled representations of verified lab behavior.
            </span>
            <span>Educational System • Verifiable Network Science</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
