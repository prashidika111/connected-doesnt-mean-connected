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
} from 'lucide-react';
import { EvaluationResult, CertaintyLevel } from '../types/diagnosis';
import { StagesVisualizer } from '../components/StagesVisualizer';
import { getNetworkStagesForOutcome } from '../data/scenarios';

interface ResultPageProps {
  result: EvaluationResult;
  onReviseAnswers: () => void;
  onOpenSimulation: () => void;
  onReset: () => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({
  result,
  onReviseAnswers,
  onOpenSimulation,
  onReset,
}) => {
  const isDnsMatch = result.outcome === 'DNS_MATCH';
  const isInconclusive = result.outcome === 'INSUFFICIENT_INFO';
  const stages = getNetworkStagesForOutcome(result.outcome);

  const renderCertaintyBadge = (certainty: CertaintyLevel) => {
    switch (certainty) {
      case 'LIKELY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Confidence: likely scenario match
          </span>
        );
      case 'UNKNOWN_INSUFFICIENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            Confidence: not enough evidence
          </span>
        );
      case 'CONTRADICTORY':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            Confidence: symptoms differ
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-10 space-y-10">
      {/* Top Banner / Verdict */}
      <section
        className={`rounded-3xl border p-6 sm:p-8 space-y-4 shadow-sm ${
          isDnsMatch
            ? 'bg-gradient-to-br from-brand-50/80 via-white to-blue-50/50 border-brand-200'
            : isInconclusive
            ? 'bg-blue-50/60 border-amber-200'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          {renderCertaintyBadge(result.certainty)}

          {result.scenarioId && (
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-900 text-white">
              Scenario ID: {result.scenarioId.replace('-', ' ')}
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
        <div className="bg-white/80 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Important limitation:</span>
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
            <span>Which communication stages may be affected</span>
          </h2>
          <span className="text-xs text-slate-500">
            Interactive Visual Model
          </span>
        </div>

        <StagesVisualizer stages={stages} />
      </section>

      {/* Two Column Layout: Educational Explanation + Working/Failing Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plain Language Explanation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
            <span>Plain language explanation</span>
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed">
            {result.plainLanguageExplanation}
          </p>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Technical explanation
            </h4>
            <p className="text-xs text-slate-600 font-mono leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              {result.technicalExplanation}
            </p>
          </div>
        </div>

        {/* Contrast Breakdown: What Works vs What Fails */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span>The Networking Contrast</span>
          </h3>

          <div className="space-y-3">
            {/* What is working */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide flex items-center gap-1">
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
              <span className="text-xs font-semibold text-rose-800 uppercase tracking-wide flex items-center gap-1">
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
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <div className="space-y-1">
          <h3 className="font-bold text-base text-slate-900">
            How the answers support this result
          </h3>
          <p className="text-xs text-slate-500">
            Every conclusion is derived from deterministic rules matching your answers to verifiable network principles.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-2.5 pr-4">Diagnostic Question</th>
                <th className="py-2.5 px-4">Your Answer</th>
                <th className="py-2.5 pl-4">Rule Implication</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.evidence.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    {item.questionTitle}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 font-mono text-xs">
                      {item.answerLabel}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-slate-600">
                    {item.implication}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Limitations Box */}
      <section className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 space-y-1.5">
        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-slate-500" />
          <span>Known Diagnostic Boundaries & Limitations:</span>
        </div>
        <ul className="list-disc pl-5 space-y-0.5">
          {result.limitations.map((lim, idx) => (
            <li key={idx}>{lim}</li>
          ))}
          <li>
            This educational website does not execute terminal commands or ping sweeps against your host operating system.
          </li>
        </ul>
      </section>

      {/* Primary Action Handoff */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={onReviseAnswers}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Change Answers</span>
          </button>

          <button
            onClick={onReset}
            className="px-3 py-2.5 rounded-xl hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-medium text-sm flex items-center gap-1 transition-colors cursor-pointer"
            title="Clear and restart"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart</span>
          </button>
        </div>

        {/* Next step CTA */}
        {isDnsMatch ? (
          <button
            onClick={onOpenSimulation}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-4 focus:ring-brand-200"
          >
            <Network className="w-4 h-4" />
            <span>Open the Cisco Packet Tracer guide</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onOpenSimulation}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Network className="w-4 h-4" />
            <span>Compare with the DNS simulation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
