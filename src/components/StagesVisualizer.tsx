import React, { useState } from 'react';
import {
  Laptop,
  Wifi,
  Router,
  Search,
  Server,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { NetworkStage, StageProvenance, StageStatus } from '../types/scenario';

interface StagesVisualizerProps {
  stages: NetworkStage[];
  highlightStageId?: string;
  interactive?: boolean;
}

export const StagesVisualizer: React.FC<StagesVisualizerProps> = ({
  stages,
  highlightStageId,
  interactive = true,
}) => {
  const [selectedStageId, setSelectedStageId] = useState<string>(
    highlightStageId || (stages.find((s) => s.status === 'error')?.id ?? stages[0]?.id)
  );

  const selectedStage = stages.find((s) => s.id === selectedStageId) || stages[0];

  const getStageIcon = (id: string, className = 'w-5 h-5') => {
    switch (id) {
      case 'device':
        return <Laptop className={className} />;
      case 'local_link':
        return <Wifi className={className} />;
      case 'gateway_router':
        return <Router className={className} />;
      case 'dns':
        return <Search className={className} />;
      case 'destination':
        return <Server className={className} />;
      default:
        return <HelpCircle className={className} />;
    }
  };

  const getProvenanceBadge = (provenance?: StageProvenance) => {
    if (!provenance) return null;
    const labels: Record<StageProvenance, string> = {
      measured: 'Measured',
      inferred: 'Inferred',
      simulated: 'Simulated lab',
      conceptual: 'Conceptual',
      'not-tested': 'Not tested',
    };
    return (
      <span className="inline-flex items-center text-[10px] font-medium text-slate-600 bg-white/80 border border-slate-200 px-1.5 py-0.5 rounded">
        {labels[provenance]}
      </span>
    );
  };

  const getStatusBadge = (status: StageStatus) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Working
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse">
            <XCircle className="w-3 h-3 text-rose-600" />
            Failing Stage
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Impaired
          </span>
        );
      case 'bypassed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            Not Reached
          </span>
        );
      case 'untested':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            Unverified
          </span>
        );
    }
  };

  const getNodeStyles = (status: StageStatus, isSelected: boolean) => {
    const base = 'transition-all duration-200 cursor-pointer rounded-2xl p-3 sm:p-4 border text-center flex flex-col items-center justify-between min-h-[140px]';
    if (isSelected) {
      return `${base} ring-2 ring-brand-500 shadow-md ${
        status === 'error'
          ? 'bg-rose-50/80 border-rose-300'
          : status === 'success'
          ? 'bg-emerald-50/80 border-emerald-300'
          : 'bg-white border-brand-300'
      }`;
    }
    switch (status) {
      case 'error':
        return `${base} bg-rose-50/40 border-rose-200 hover:border-rose-400`;
      case 'success':
        return `${base} bg-emerald-50/40 border-emerald-200 hover:border-emerald-400`;
      case 'warning':
        return `${base} bg-amber-50/40 border-amber-200 hover:border-amber-400`;
      default:
        return `${base} bg-white border-slate-200 hover:border-slate-300`;
    }
  };

  return (
    <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
            <span>Network communication stages</span>
            <span className="text-xs font-normal text-slate-500">
              (Click any stage to inspect)
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            A network connection is a multi-step chain. A failure at any one stage prevents loading the final service.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Working
          </span>
          <span className="flex items-center gap-1 text-rose-700">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Failing
          </span>
        </div>
      </div>

      {/* Grid / flow of stages */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 relative">
        {stages.map((stage, idx) => {
          const isSelected = stage.id === selectedStageId;
          return (
            <div
              key={stage.id}
              onClick={() => interactive && setSelectedStageId(stage.id)}
              className={getNodeStyles(stage.status, isSelected)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedStageId(stage.id);
                }
              }}
            >
              <div className="w-full flex items-center justify-between text-slate-400 text-[11px] font-mono gap-1">
                <span>0{idx + 1}</span>
                <span className="flex flex-col items-end gap-0.5">
                  {getStatusBadge(stage.status)}
                  {getProvenanceBadge(stage.provenance)}
                </span>
              </div>

              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center my-2 ${
                  stage.status === 'error'
                    ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-300'
                    : stage.status === 'success'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {getStageIcon(stage.id, 'w-6 h-6')}
              </div>

              <div className="w-full">
                <div className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">
                  {stage.name}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {stage.role}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed stage inspect callout */}
      {selectedStage && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-start gap-3 transition-all animate-fadeIn">
          <div
            className={`p-2.5 rounded-lg shrink-0 ${
              selectedStage.status === 'error'
                ? 'bg-rose-100 text-rose-700'
                : selectedStage.status === 'success'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {getStageIcon(selectedStage.id, 'w-5 h-5')}
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900">
                {selectedStage.name}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 text-xs font-mono">
                {selectedStage.role}
              </span>
              {getStatusBadge(selectedStage.status)}
              {getProvenanceBadge(selectedStage.provenance)}
            </div>
            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">
              {selectedStage.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
