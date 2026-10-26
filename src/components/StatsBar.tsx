import React from 'react';
import { ScheduleItem } from '../types';
import { calculateDDay } from '../utils/dday';
import { AlertCircle, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

interface StatsBarProps {
  items: ScheduleItem[];
  selectedUrgencyFilter: string | null;
  onSelectUrgencyFilter: (urgency: string | null) => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  items,
  selectedUrgencyFilter,
  onSelectUrgencyFilter,
}) => {
  const now = new Date();

  let countD1 = 0;   // D-1 이하 (빨강)
  let countD3 = 0;   // D-3 이하 (주황)
  let countD7 = 0;   // D-7 이하 (노랑)
  let countBeyond = 0; // D-8 이상
  let countCompleted = 0;

  items.forEach((item) => {
    if (item.completed) {
      countCompleted++;
      return;
    }
    const status = calculateDDay(item.dueDate, false, now);
    if (status.urgency === 'd-1' || status.urgency === 'overdue') {
      countD1++;
    } else if (status.urgency === 'd-3') {
      countD3++;
    } else if (status.urgency === 'd-7') {
      countD7++;
    } else {
      countBeyond++;
    }
  });

  const totalItems = items.length;
  const completionRate = totalItems > 0 ? Math.round((countCompleted / totalItems) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5 mb-5">
      
      {/* 🚨 D-1 이하 (빨강) */}
      <button
        onClick={() => onSelectUrgencyFilter(selectedUrgencyFilter === 'd-1' ? null : 'd-1')}
        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
          selectedUrgencyFilter === 'd-1'
            ? 'bg-red-500 text-white border-red-600 shadow-md ring-2 ring-red-300'
            : 'bg-white hover:bg-red-50/50 text-slate-800 border-red-200/80 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${selectedUrgencyFilter === 'd-1' ? 'text-red-100' : 'text-red-600'}`}>
            D-1 이하 (빨강)
          </span>
          <span className={`p-1 rounded-full ${selectedUrgencyFilter === 'd-1' ? 'bg-red-600/60' : 'bg-red-100'}`}>
            <AlertCircle className={`w-3.5 h-3.5 ${selectedUrgencyFilter === 'd-1' ? 'text-white' : 'text-red-600'}`} />
          </span>
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold tracking-tight">{countD1}</span>
          <span className={`text-xs ${selectedUrgencyFilter === 'd-1' ? 'text-red-100' : 'text-slate-500'}`}>건 마감임박</span>
        </div>
      </button>

      {/* ⚠️ D-3 이하 (주황) */}
      <button
        onClick={() => onSelectUrgencyFilter(selectedUrgencyFilter === 'd-3' ? null : 'd-3')}
        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
          selectedUrgencyFilter === 'd-3'
            ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
            : 'bg-white hover:bg-amber-50/50 text-slate-800 border-amber-200/80 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${selectedUrgencyFilter === 'd-3' ? 'text-amber-100' : 'text-amber-700'}`}>
            D-3 이하 (주황)
          </span>
          <span className={`p-1 rounded-full ${selectedUrgencyFilter === 'd-3' ? 'bg-amber-600/60' : 'bg-amber-100'}`}>
            <AlertTriangle className={`w-3.5 h-3.5 ${selectedUrgencyFilter === 'd-3' ? 'text-white' : 'text-amber-600'}`} />
          </span>
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold tracking-tight">{countD3}</span>
          <span className={`text-xs ${selectedUrgencyFilter === 'd-3' ? 'text-amber-100' : 'text-slate-500'}`}>건 집중주의</span>
        </div>
      </button>

      {/* ⏳ D-7 이하 (노랑) */}
      <button
        onClick={() => onSelectUrgencyFilter(selectedUrgencyFilter === 'd-7' ? null : 'd-7')}
        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
          selectedUrgencyFilter === 'd-7'
            ? 'bg-yellow-400 text-yellow-950 border-yellow-500 shadow-md ring-2 ring-yellow-300'
            : 'bg-white hover:bg-yellow-50/50 text-slate-800 border-yellow-200/80 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${selectedUrgencyFilter === 'd-7' ? 'text-yellow-900' : 'text-yellow-800'}`}>
            D-7 이하 (노랑)
          </span>
          <span className={`p-1 rounded-full ${selectedUrgencyFilter === 'd-7' ? 'bg-yellow-500/60' : 'bg-yellow-100'}`}>
            <Clock className={`w-3.5 h-3.5 ${selectedUrgencyFilter === 'd-7' ? 'text-yellow-950' : 'text-yellow-700'}`} />
          </span>
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold tracking-tight">{countD7}</span>
          <span className={`text-xs ${selectedUrgencyFilter === 'd-7' ? 'text-yellow-900' : 'text-slate-500'}`}>건 이번주 마감</span>
        </div>
      </button>

      {/* 📅 D-8 이상 (여유) */}
      <button
        onClick={() => onSelectUrgencyFilter(selectedUrgencyFilter === 'normal' ? null : 'normal')}
        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
          selectedUrgencyFilter === 'normal'
            ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300'
            : 'bg-white hover:bg-indigo-50/50 text-slate-800 border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${selectedUrgencyFilter === 'normal' ? 'text-indigo-100' : 'text-indigo-700'}`}>
            D-8 이상 (여유)
          </span>
          <span className={`p-1 rounded-full ${selectedUrgencyFilter === 'normal' ? 'bg-indigo-700' : 'bg-indigo-50'}`}>
            <Clock className={`w-3.5 h-3.5 ${selectedUrgencyFilter === 'normal' ? 'text-white' : 'text-indigo-600'}`} />
          </span>
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold tracking-tight">{countBeyond}</span>
          <span className={`text-xs ${selectedUrgencyFilter === 'normal' ? 'text-indigo-100' : 'text-slate-500'}`}>건 일정 대비</span>
        </div>
      </button>

      {/* ✅ 완료율 프로그레스 */}
      <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-3 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-white shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            학업 달성률
          </span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-emerald-700 tracking-tight">{completionRate}%</span>
          </div>
          <span className="text-xs text-emerald-800 font-medium">
            {countCompleted}/{totalItems}건 완료
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-emerald-100/80 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

    </div>
  );
};
