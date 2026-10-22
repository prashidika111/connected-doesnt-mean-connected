import React from 'react';
import { Question, Option } from '../types/diagnosis';
import { Check, HelpCircle, Layers } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  selectedValue?: string;
  onSelect: (optionId: string) => void;
  showError?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedValue,
  onSelect,
  showError = false,
}) => {
  const getCategoryBadge = (cat: Question['category']) => {
    switch (cat) {
      case 'physical':
        return { label: 'Layer 1 & 2: Local Link', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'service':
        return { label: 'Layer 7: Destination Type', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'scope':
        return { label: 'Scope & Boundary Check', color: 'bg-blue-50 text-amber-700 border-amber-200' };
      case 'symptom':
        return { label: 'Browser Diagnostic Signal', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'evidence':
        return { label: 'Layer 3: IP Reachability Test', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: 'Network Diagnostic', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const badge = getCategoryBadge(question.category);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-6">
      {/* Category header & why this matters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${badge.color}`}
          >
            <Layers className="w-3.5 h-3.5" />
            {badge.label}
          </span>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Select one option</span>
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {question.title}
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          {question.subtitle}
        </p>
      </div>

      {/* Networking Why this matters hint */}
      <div className="bg-slate-50 border-l-4 border-brand-500 rounded-r-xl p-3.5 text-xs text-slate-600 leading-relaxed">
        <strong className="text-slate-900 font-semibold block mb-0.5">
          Networking Context:
        </strong>
        {question.whyItMatters}
      </div>

      {/* Options grid */}
      <div className="space-y-3" role="radiogroup" aria-label={question.title}>
        {question.options.map((option: Option) => {
          const isSelected = selectedValue === option.id;

          return (
            <div
              key={option.id}
              onClick={() => onSelect(option.id)}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(option.id);
                }
              }}
              className={`group flex items-start gap-4 p-4 rounded-xl border text-left cursor-pointer transition-all ${
                isSelected
                  ? 'bg-brand-50/60 border-brand-500 ring-2 ring-brand-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              {/* Radio circle */}
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  isSelected
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 bg-white group-hover:border-slate-400'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </div>

              {/* Text info */}
              <div className="flex-1 space-y-0.5">
                <div
                  className={`text-sm sm:text-base font-semibold ${
                    isSelected ? 'text-brand-950' : 'text-slate-800'
                  }`}
                >
                  {option.label}
                </div>
                {option.description && (
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Validation warning */}
      {showError && !selectedValue && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex items-center gap-2 animate-shake">
          <span className="font-semibold">Selection required:</span> Please choose an option above to proceed.
        </div>
      )}
    </div>
  );
};
