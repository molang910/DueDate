import React, { useState } from 'react';
import { ScheduleItem } from '../types';
import { calculateDDay, formatTime, getTypeBadge, getSubjectColor } from '../utils/dday';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Check } from 'lucide-react';

interface WeeklyCalendarProps {
  items: ScheduleItem[];
  onToggleComplete: (id: string) => void;
  onEdit: (item: ScheduleItem) => void;
  onAddOnDate: (dateStr: string) => void;
}

export const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  items,
  onToggleComplete,
  onEdit,
  onAddOnDate,
}) => {
  // Current reference week offset (0 = current week, -1 = last week, 1 = next week)
  const [weekOffset, setWeekOffset] = useState(0);

  // Helper to get Monday of the target week
  const getMonday = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset * 7);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  };

  const monday = getMonday(weekOffset);
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    return dayDate;
  });

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const dayNames = ['월', '화', '수', '목', '금', '토', '일'];

  // Format week range label: e.g. "2026.10.26(월) ~ 11.01(일)"
  const firstDay = weekDays[0];
  const lastDay = weekDays[6];
  const weekLabel = `${firstDay.getFullYear()}년 ${firstDay.getMonth() + 1}월 ${firstDay.getDate()}일 ~ ${
    lastDay.getMonth() + 1
  }월 ${lastDay.getDate()}일`;

  // Filter items for each day
  const getItemsForDay = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return items.filter((item) => {
      const itemDate = item.dueDate.split('T')[0];
      return itemDate === dateStr;
    });
  };

  // Count items for the week
  let weekTotalCount = 0;
  weekDays.forEach((d) => {
    weekTotalCount += getItemsForDay(d).length;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs mb-8">
      
      {/* Calendar Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>주간 학업 캘린더</span>
              {weekOffset === 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  이번 주
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{weekLabel} • 주간 {weekTotalCount}개 마감</p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="이전 주"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              weekOffset === 0
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            오늘이 속한 주
          </button>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="다음 주"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week Grid (Monday ~ Sunday) */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {weekDays.map((dayDate, i) => {
          const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
          const isToday = dateStr === todayStr;
          const isWeekend = i === 5 || i === 6;
          const dayItems = getItemsForDay(dayDate);

          return (
            <div
              key={dateStr}
              className={`rounded-2xl border transition-all flex flex-col min-h-[220px] ${
                isToday
                  ? 'border-indigo-400 bg-indigo-50/30 ring-2 ring-indigo-200/70 shadow-xs'
                  : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50/80'
              }`}
            >
              {/* Day Header */}
              <div
                className={`p-3 border-b flex items-center justify-between rounded-t-2xl ${
                  isToday
                    ? 'bg-indigo-600 text-white'
                    : isWeekend
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-white text-slate-800 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold ${isToday ? 'text-white' : isWeekend ? 'text-rose-500' : 'text-slate-700'}`}>
                    {dayNames[i]}
                  </span>
                  <span className={`text-sm font-extrabold ${isToday ? 'text-white' : 'text-slate-900'}`}>
                    {dayDate.getDate()}일
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {isToday && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white">
                      TODAY
                    </span>
                  )}
                  {/* Quick Add Button on this day */}
                  <button
                    onClick={() => onAddOnDate(`${dateStr}T23:59`)}
                    title={`${dayNames[i]}요일 마감 일정 추가`}
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                      isToday
                        ? 'hover:bg-white/20 text-white'
                        : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Day Body with Schedules */}
              <div className="p-2.5 flex-1 space-y-2 overflow-y-auto max-h-[300px]">
                {dayItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-6 text-slate-300">
                    <span className="text-xs">일정 없음</span>
                  </div>
                ) : (
                  dayItems.map((item) => {
                    const status = calculateDDay(item.dueDate, item.completed, now);
                    const subjectColor = getSubjectColor(item.subject);
                    const typeBadge = getTypeBadge(item.type);
                    const dueObj = new Date(item.dueDate);

                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-xl border text-left transition-all relative group cursor-pointer shadow-2xs ${
                          status.cardBorder
                        } ${status.cardBg} ${item.completed ? 'opacity-60 bg-slate-100' : ''}`}
                        onClick={() => onEdit(item)}
                      >
                        {/* Top row: D-day badge and complete check */}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-black tracking-tight ${status.badgeBg}`}
                          >
                            {status.dDayText}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleComplete(item.id);
                            }}
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                              item.completed
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white border-slate-300 text-transparent hover:text-emerald-500'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </button>
                        </div>

                        {/* Subject & Type */}
                        <div className="flex items-center gap-1 flex-wrap mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${subjectColor}`}>
                            {item.subject}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {typeBadge.label}
                          </span>
                        </div>

                        {/* Title */}
                        <div
                          className={`text-xs font-bold line-clamp-2 leading-tight ${
                            item.completed ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {item.title}
                        </div>

                        {/* Time */}
                        <div className="mt-1.5 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                          <span>{formatTime(dueObj)} 마감</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
