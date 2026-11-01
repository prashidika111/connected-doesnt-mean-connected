import React from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Network,
  ShieldAlert,
  Layers,
  ArrowLeft,
  Info,
  Search,
} from 'lucide-react';
import { EvaluationResult, CertaintyLevel } from '../types/diagnosis';
import { StagesVisualizer } from '../components/StagesVisualizer';
import { getNetworkStagesForOutcome } from '../data/scenarios';

interface ResultPageProps {
  result: EvaluationResult;
  onReviseAnswers: () => void;
  onOpenSimulation: () => void;
  onOpenInvestigation?: () => void;
  onReset: () => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({
  result,
  onReviseAnswers,
  onOpenSimulation,
  onOpenInvestigation,
  onReset,
}) => {
  const isDnsMatch = result.outcome === 'DNS_MATCH';
  const isInconclusive = result.outcome === 'INSUFFICIENT_INFO';
  const stages = getNetworkStagesForOutcome(result.outcome);

  const renderCertaintyBadge = (certainty: CertaintyLevel) => {
    switch (certainty) {
      case 'CONFIRMED_BY_CHECK':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Confidence: Confirmed by Measured Check
          </span>
        );
      case 'LIKELY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-brand-800 border border-blue-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
            Confidence: Likely Scenario Match
          </span>
        );
      case 'UNKNOWN_INSUFFICIENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            Confidence: Insufficient Observational Clues
          </span>
        );
      case 'CONTRADICTORY':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <Info className="w-3.5 h-3.5 text-slate-600" />
            Confidence: Contrasting Symptoms
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-10 animate-fadeIn">
      {/* Top Banner / Verdict */}
      <section
        className={`rounded-3xl border p-6 sm:p-8 space-y-4 shadow-sm ${
          isDnsMatch
            ? 'bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 border-brand-200'
            : isInconclusive
            ? 'bg-amber-50/60 border-amber-200'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          {renderCertaintyBadge(result.certainty)}

          {result.scenarioId && (
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-900 text-white">
              Scenario ID: {result.scenarioId}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {result.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
            {result.summary}
          </p>
        </div>

        {/* Certainty and honest limitation note */}
        <div className="bg-white/90 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Important Boundary & Uncertainty Notice:</span>
          </div>
          <p className="leading-relaxed">
            {result.certaintyExplanation}
          </p>
        </div>
      </section>

      {/* Interactive Network Stages Diagram */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-600" />
            <span>Which Communication Stages are Affected</span>
          </h2>
          <span className="text-xs text-slate-500">
            Interactive Multi-Stage Model
          </span>
        </div>

        <StagesVisualizer stages={stages} interactive={true} />
      </section>

      {/* Two Column Layout: Educational Explanation + Working/Failing Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plain Language Explanation */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
            <span>Plain Language Explanation</span>
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed">
            {result.plainLanguageExplanation}
          </p>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Technical Specification
            </h4>
            <p className="text-xs text-slate-600 font-mono leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              {result.technicalExplanation}
            </p>
          </div>
        </div>

        {/* Contrast Breakdown: What Works vs What Fails */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span>The Networking Contrast</span>
          </h3>

          <div className="space-y-3">
            {/* What is working */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                What appears to be working:
              </span>
              <ul className="text-xs sm:text-sm text-slate-700 space-y-1 list-disc pl-5">
                {result.whatIsWorking.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* What is failing */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                What appears to be failing or blocked:
              </span>
              <ul className="text-xs sm:text-sm text-slate-700 space-y-1 list-disc pl-5">
                {result.whatIsFailing.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Transparent Evaluation Evidence Table */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <div className="space-y-1">
          <h3 className="font-bold text-base text-slate-900">
            How Your Answers Support This Diagnosis
          </h3>
          <p className="text-xs text-slate-500">
            Every conclusion is derived from deterministic rules matching your reported symptoms to verifiable networking principles.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                <th className="py-2.5 px-3">Diagnostic Question</th>
                <th className="py-2.5 px-3">Your Answer</th>
                <th className="py-2.5 px-3">Rule Implication</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.evidence.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3 font-semibold text-slate-900">
                    {item.questionTitle}
                  </td>
                  <td className="py-3 px-3 text-slate-700">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 font-mono text-xs">
                      {item.answerLabel}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {item.implication}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Limitations Box */}
      <section className="p-5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-slate-600" />
          <span>Known Diagnostic Boundaries & Limitations:</span>
        </div>
        <ul className="list-disc pl-5 space-y-1">
          {result.limitations.map((lim, idx) => (
            <li key={idx}>{lim}</li>
          ))}
          <li>
            This guided questionnaire analyzes symptom fingerprints reported by the user; it does not scan local hardware or execute shell commands.
          </li>
        </ul>
      </section>

      {/* Primary Action Handoff */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReviseAnswers}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Change Answers</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="px-3 py-2.5 rounded-xl hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-medium text-xs sm:text-sm flex items-center gap-1 transition-colors cursor-pointer"
            title="Clear and restart"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart</span>
          </button>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-3">
          {onOpenInvestigation && (
            <button
              type="button"
              onClick={onOpenInvestigation}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              <span>Test Target Live</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSimulation}
            className="px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Network className="w-4 h-4" />
            <span>{result.scenarioId ? `Open Scenario ${result.scenarioId} Guide` : 'Open Scenario Guide'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
