import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'emerald' }) {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-100 text-emerald-700',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      iconBg: 'bg-amber-100 text-amber-700',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      iconBg: 'bg-rose-100 text-rose-700',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      iconBg: 'bg-blue-100 text-blue-700',
    },
    slate: {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      iconBg: 'bg-slate-100 text-slate-700',
    },
  };

  const scheme = colorMap[color] || colorMap.emerald;

  return (
    <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1.5">{value}</h3>
        </div>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg ${scheme.iconBg} flex items-center justify-center shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {subtitle && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500">
          {subtitle}
        </div>
      )}
    </div>
  );
}
