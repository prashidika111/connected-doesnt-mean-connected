import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

interface DisclaimerBannerProps {
  compact?: boolean;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-blue-50 border border-amber-200/80 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0" />
        <span>
          <strong>Learning model:</strong> Evaluates your answers against deterministic network rules. No live packet capture or device inspection is performed.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 via-blue-50 to-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-amber-900">
            What this tool can tell you
          </h4>
          <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
            This system helps you understand <em>why</em> a device can show “connected” while failing to reach websites. It matches your reported symptoms to verified networking scenarios using transparent rules. <strong>The website does not scan your live hardware, run raw socket tests, or inspect your home router.</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
