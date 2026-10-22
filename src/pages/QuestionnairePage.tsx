import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  BookmarkCheck,
} from 'lucide-react';
import { QuestionCard } from '../components/QuestionCard';
import { DisclaimerBanner } from '../components/DisclaimerBanner';
import { QUESTIONS } from '../data/questions';
import { UserAnswers, QuestionId } from '../types/diagnosis';

interface QuestionnairePageProps {
  answers: Partial<UserAnswers>;
  onAnswerChange: (questionId: QuestionId, optionId: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  onBackToLanding: () => void;
}

export const QuestionnairePage: React.FC<QuestionnairePageProps> = ({
  answers,
  onAnswerChange,
  onSubmit,
  onReset,
  onBackToLanding,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [showValidationError, setShowValidationError] = useState<boolean>(false);

  const currentQuestion = QUESTIONS[currentStepIndex];
  const totalQuestions = QUESTIONS.length;
  const progressPercent = Math.round(((currentStepIndex + 1) / totalQuestions) * 100);

  const selectedAnswer = answers[currentQuestion.id];

  const handleSelectOption = (optionId: string) => {
    setShowValidationError(false);
    onAnswerChange(currentQuestion.id, optionId);
  };

  const handleNext = () => {
    if (!selectedAnswer) {
      setShowValidationError(true);
      return;
    }
    setShowValidationError(false);
    if (currentStepIndex < totalQuestions - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Completed last question, submit
      onSubmit();
    }
  };

  const handlePrevious = () => {
    setShowValidationError(false);
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    } else {
      onBackToLanding();
    }
  };

  // Demo Presets for Faculty Evaluation
  const loadPreset = (presetName: 'dns' | 'offline' | 'http_error' | 'inconclusive') => {
    if (presetName === 'dns') {
      onAnswerChange('Q_LINK_STATUS', 'LINK_WIFI_ETH_OK');
      onAnswerChange('Q_TARGET_TYPE', 'TARGET_WEBSITE_NAME');
      onAnswerChange('Q_SCOPE', 'SCOPE_ALL_WEBSITES');
      onAnswerChange('Q_SYMPTOM_ERROR', 'ERROR_NAME_RESOLUTION');
      onAnswerChange('Q_DIRECT_IP', 'IP_WORKS');
      setCurrentStepIndex(totalQuestions - 1);
    } else if (presetName === 'offline') {
      onAnswerChange('Q_LINK_STATUS', 'LINK_DISCONNECTED');
      onAnswerChange('Q_TARGET_TYPE', 'TARGET_WEBSITE_NAME');
      onAnswerChange('Q_SCOPE', 'SCOPE_ALL_WEBSITES');
      onAnswerChange('Q_SYMPTOM_ERROR', 'ERROR_NO_INTERNET_BANNER');
      onAnswerChange('Q_DIRECT_IP', 'IP_FAILS');
      setCurrentStepIndex(totalQuestions - 1);
    } else if (presetName === 'http_error') {
      onAnswerChange('Q_LINK_STATUS', 'LINK_WIFI_ETH_OK');
      onAnswerChange('Q_TARGET_TYPE', 'TARGET_WEBSITE_NAME');
      onAnswerChange('Q_SCOPE', 'SCOPE_SINGLE_SPECIFIC');
      onAnswerChange('Q_SYMPTOM_ERROR', 'ERROR_HTTP_STATUS');
      onAnswerChange('Q_DIRECT_IP', 'IP_NOT_TESTED');
      setCurrentStepIndex(totalQuestions - 1);
    } else if (presetName === 'inconclusive') {
      onAnswerChange('Q_LINK_STATUS', 'LINK_NOT_SURE');
      onAnswerChange('Q_TARGET_TYPE', 'TARGET_NOT_SURE');
      onAnswerChange('Q_SCOPE', 'SCOPE_NOT_SURE');
      onAnswerChange('Q_SYMPTOM_ERROR', 'ERROR_NOT_SURE');
      onAnswerChange('Q_DIRECT_IP', 'IP_NOT_TESTED');
      setCurrentStepIndex(totalQuestions - 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 space-y-8">
      {/* Disclaimer reminder */}
      <DisclaimerBanner compact />

      {/* Progress & Stepper Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-bold text-brand-700">
              Question {currentStepIndex + 1} of {totalQuestions}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{progressPercent}% Completed</span>
          </div>

          <div className="flex items-center gap-1">
            {QUESTIONS.map((q, idx) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = idx === currentStepIndex;

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setShowValidationError(false);
                    setCurrentStepIndex(idx);
                  }}
                  title={`Jump to Question ${idx + 1}`}
                  className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'bg-brand-600 text-white ring-2 ring-brand-300'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                  }`}
                >
                  {isAnswered && !isCurrent ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    idx + 1
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress bar line */}
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="bg-brand-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Current Question Card */}
      <QuestionCard
        question={currentQuestion}
        selectedValue={selectedAnswer}
        onSelect={handleSelectOption}
        showError={showValidationError}
      />

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{currentStepIndex === 0 ? 'Back to Overview' : 'Previous'}</span>
          </button>

          <button
            onClick={onReset}
            className="px-3 py-2.5 rounded-xl hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
            title="Reset questionnaire"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>

        <button
          onClick={handleNext}
          className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-brand-200"
        >
          <span>
            {currentStepIndex === totalQuestions - 1
              ? 'Show my explanation'
              : 'Next question'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Fast Demo Presets Toolbar (Ideal for Professor / Faculty review) */}
      <div className="border-t border-slate-200 pt-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <BookmarkCheck className="w-4 h-4 text-brand-600" />
          <span>Example answers for demonstration</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => loadPreset('dns')}
            className="px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 transition-colors font-medium"
          >
            Show a DNS failure example
          </button>
          <button
            onClick={() => loadPreset('offline')}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors font-medium"
          >
            Show a disconnected device example
          </button>
          <button
            onClick={() => loadPreset('http_error')}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors font-medium"
          >
            Show a web server error example
          </button>
          <button
            onClick={() => loadPreset('inconclusive')}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors font-medium"
          >
            Show an uncertain example
          </button>
        </div>
      </div>
    </div>
  );
};
