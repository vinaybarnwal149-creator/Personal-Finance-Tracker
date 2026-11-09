import React from 'react';

export default function ProgressBar({
  percent = 0,
  status = 'ok',
  className = '',
  showLabel = false,
}) {
  const cappedPercent = Math.min(100, Math.max(0, percent));

  const colorClasses = {
    ok: 'bg-emerald-500',
    warning: 'bg-amber-500',
    exceeded: 'bg-rose-500',
  };

  const bgClasses = {
    ok: 'bg-emerald-50',
    warning: 'bg-amber-50',
    exceeded: 'bg-rose-50',
  };

  const barColor = colorClasses[status] || colorClasses.ok;
  const trackBg = bgClasses[status] || 'bg-slate-100';

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full h-2.5 rounded-full overflow-hidden ${trackBg}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${cappedPercent}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center mt-1 text-xs text-slate-500">
          <span>{percent}%</span>
          <span>{status === 'exceeded' ? 'Exceeded' : status === 'warning' ? 'Warning' : 'On Track'}</span>
        </div>
      )}
    </div>
  );
}

