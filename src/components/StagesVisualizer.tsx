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
  Info,
  ArrowRight,
} from 'lucide-react';
import { NetworkStage, StageProvenance, StageStatus } from '../types/scenario';

interface StagesVisualizerProps {
  stages: NetworkStage[];
  highlightStageId?: string;
  interactive?: boolean;
  onSelectScenario?: (scenarioId: string) => void;
}

export const StagesVisualizer: React.FC<StagesVisualizerProps> = ({
  stages,
  highlightStageId,
  interactive = true,
  onSelectScenario,
}) => {
  const [selectedStageId, setSelectedStageId] = useState<string>(
    highlightStageId ||
      stages.find((s) => s.status === 'error')?.id ||
      stages.find((s) => s.status === 'warning')?.id ||
      stages[0]?.id ||
      'device'
  );

  const selectedStage =
    stages.find((s) => s.id === selectedStageId) || stages[0];

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

  const getStageLayerInfo = (id: string) => {
    switch (id) {
      case 'device':
        return 'Operating System & Network Interface Card (NIC)';
      case 'local_link':
        return 'Layer 1 Physical & Layer 2 Data Link (802.11 Wi-Fi / 802.3 Ethernet)';
      case 'gateway_router':
        return 'Layer 3 Network Routing (Default Gateway / ISP WAN Transit)';
      case 'dns':
        return 'Layer 7 Name Resolution (UDP Port 53 / RFC 1035)';
      case 'destination':
        return 'Layer 4 Transport (TCP 80/443) & Layer 7 HTTP/HTTPS Service';
      default:
        return 'Network Stage';
    }
  };

  const getRelatedScenarioId = (id: string, status: StageStatus): string | null => {
    if (id === 'dns' && status === 'error') return 'DNS-01';
    if (id === 'destination' && status === 'error') return 'SRV-04';
    if (id === 'destination' && status === 'warning') return 'HTTP-05';
    if (id === 'gateway_router' && status === 'error') return 'IND-07';
    if (id === 'local_link' && status === 'error') return 'LAN-03';
    return null;
  };

  const getProvenanceBadge = (provenance?: StageProvenance) => {
    if (!provenance) return null;
    const labels: Record<StageProvenance, { label: string; desc: string; color: string }> = {
      measured: {
        label: 'Measured',
        desc: 'Directly verified by executed diagnostic check',
        color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      },
      inferred: {
        label: 'Inferred',
        desc: 'Deduced logically from supporting evidence',
        color: 'bg-blue-50 text-brand-800 border-blue-200',
      },
      simulated: {
        label: 'Simulated Lab',
        desc: 'Observed in controlled virtual network lab',
        color: 'bg-purple-50 text-purple-800 border-purple-200',
      },
      conceptual: {
        label: 'Conceptual',
        desc: 'Standard architectural model representation',
        color: 'bg-slate-100 text-slate-700 border-slate-200',
      },
      'not-tested': {
        label: 'Not Tested',
        desc: 'No observation available from this vantage point',
        color: 'bg-amber-50 text-amber-800 border-amber-200',
      },
    };
    const info = labels[provenance] || labels['not-tested'];
    return (
      <span
        title={info.desc}
        className={`inline-flex items-center text-[10px] font-semibold border px-1.5 py-0.5 rounded ${info.color}`}
      >
        {info.label}
      </span>
    );
  };

  const getStatusBadge = (status: StageStatus) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Working
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-full animate-pulse">
            <XCircle className="w-3 h-3 text-rose-600" />
            Failing Stage
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Impaired / App Error
          </span>
        );
      case 'bypassed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
            Bypassed / Not Reached
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
    const base =
      'transition-all duration-200 cursor-pointer rounded-2xl p-3 sm:p-4 border text-center flex flex-col items-center justify-between min-h-[148px]';
    if (isSelected) {
      return `${base} ring-2 ring-brand-500 shadow-md ${
        status === 'error'
          ? 'bg-rose-50/90 border-rose-400'
          : status === 'success'
          ? 'bg-emerald-50/90 border-emerald-400'
          : status === 'warning'
          ? 'bg-amber-50/90 border-amber-400'
          : 'bg-white border-brand-400'
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

  const relatedScenario = selectedStage
    ? getRelatedScenarioId(selectedStage.id, selectedStage.status)
    : null;

  return (
    <div className="bg-slate-50/90 rounded-3xl border border-slate-200 p-4 sm:p-6 space-y-5 shadow-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Five-Stage Network Path Model</span>
            <span className="text-xs font-normal text-slate-500">
              (Click any stage to inspect evidence)
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            A network connection requires every stage in the path to succeed.
            Success at one stage never guarantees that subsequent stages are operational.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Working
          </span>
          <span className="flex items-center gap-1.5 text-rose-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Failing
          </span>
          <span className="flex items-center gap-1.5 text-amber-800 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Impaired
          </span>
          <span className="flex items-center gap-1.5 text-slate-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-300"></span> Unverified
          </span>
        </div>
      </div>

      {/* Grid of Stages */}
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
                <div className="flex flex-col items-end gap-0.5">
                  {getStatusBadge(stage.status)}
                  {getProvenanceBadge(stage.provenance)}
                </div>
              </div>

              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center my-2 shadow-xs transition-transform ${
                  stage.status === 'error'
                    ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-300 scale-105'
                    : stage.status === 'success'
                    ? 'bg-emerald-100 text-emerald-700'
                    : stage.status === 'warning'
                    ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {getStageIcon(stage.id, 'w-6 h-6')}
              </div>

              <div className="w-full">
                <div className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  {stage.name}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate" title={stage.role}>
                  {stage.role}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Stage Inspect Callout */}
      {selectedStage && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm transition-all animate-fadeIn space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  selectedStage.status === 'error'
                    ? 'bg-rose-100 text-rose-700'
                    : selectedStage.status === 'success'
                    ? 'bg-emerald-100 text-emerald-700'
                    : selectedStage.status === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {getStageIcon(selectedStage.id, 'w-5 h-5')}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    {selectedStage.name}
                  </h4>
                  {getStatusBadge(selectedStage.status)}
                  {getProvenanceBadge(selectedStage.provenance)}
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {getStageLayerInfo(selectedStage.id)}
                </p>
              </div>
            </div>

            {relatedScenario && onSelectScenario && (
              <button
                type="button"
                onClick={() => onSelectScenario(relatedScenario)}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
              >
                <span>Explore in Scenario {relatedScenario}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Description & Diagnostic Limits */}
          <div className="space-y-2 text-xs sm:text-sm">
            <p className="text-slate-700 leading-relaxed">
              {selectedStage.description}
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Observation Vantage Point Note: </strong>
                {selectedStage.provenance === 'measured'
                  ? 'This state was directly measured via native socket/HTTP operations from the host runtime running this diagnostic service.'
                  : selectedStage.provenance === 'inferred'
                  ? 'This state is an educational inference derived from higher-layer results. It does not represent an isolated hardware probe.'
                  : 'This stage represents a conceptual model or is unverified from the current testing vantage point.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
