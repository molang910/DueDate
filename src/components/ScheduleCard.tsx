import React, { useState } from 'react';
import { ScheduleItem } from '../types';
import { calculateDDay, formatDateTime, getSubjectColor, getTypeBadge } from '../utils/dday';
import { Check, Clock, Edit2, Trash2, ChevronDown, ChevronUp, Copy, CheckCheck } from 'lucide-react';

interface ScheduleCardProps {
  item: ScheduleItem;
  onToggleComplete: (id: string) => void;
  onEdit: (item: ScheduleItem) => void;
  onDelete: (item: ScheduleItem) => void;
}

export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  item,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const dday = calculateDDay(item.dueDate, item.completed);
  const typeBadge = getTypeBadge(item.type);
  const subjectColorClass = getSubjectColor(item.subject);

  const handleCopyMemo = () => {
    if (item.memo) {
      navigator.clipboard.writeText(`${item.subject} [${item.type}] ${item.title}\n마감: ${formatDateTime(item.dueDate)}\n${item.memo}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md ${dday.cardBorder} ${dday.cardBg} ${
        item.completed ? 'opacity-70 bg-slate-50' : ''
      }`}
    >
      {/* Visual top indicator bar */}
      <div className={`h-1.5 w-full rounded-t-2xl ${dday.indicatorColor}`} />

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          
          {/* Complete Checkbox */}
          <button
            type="button"
            onClick={() => onToggleComplete(item.id)}
            title={item.completed ? '완료 취소하기' : '완료 체크하기'}
            className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
              item.completed
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'bg-white border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-transparent hover:text-emerald-500'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
          </button>

          {/* Main Card Content */}
          <div className="flex-1 min-w-0">
            
            {/* Top row: Subject, Type badges & D-Day Badge */}
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Subject tag */}
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${subjectColorClass}`}>
                  {item.subject}
                </span>

                {/* Type tag */}
                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${typeBadge.badge}`}>
                  {typeBadge.label}
                </span>

                {/* Priority star if high */}
                {item.priority === 'high' && !item.completed && (
                  <span className="px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                    중요
                  </span>
                )}
              </div>

              {/* D-Day Badge (Strictly adhering to color requirements) */}
              <div className="flex items-center gap-1.5">
                <div
                  className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-extrabold tracking-tight ${dday.badgeBg}`}
                >
                  {dday.dDayText}
                </div>
              </div>
            </div>

            {/* Title */}
            <h3
              className={`text-base sm:text-lg font-bold leading-snug transition-colors ${
                item.completed ? 'text-slate-400 line-through' : 'text-slate-900'
              }`}
            >
              {item.title}
            </h3>

            {/* Deadline & Remaining Time */}
            <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-slate-600">
              <div className="flex items-center gap-1 text-slate-700 font-semibold bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200/70">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDateTime(item.dueDate)}</span>
              </div>
              <span
                className={`font-semibold ${
                  item.completed
                    ? 'text-emerald-600'
                    : dday.urgency === 'd-1' || dday.urgency === 'overdue'
                    ? 'text-red-600 font-bold'
                    : dday.urgency === 'd-3'
                    ? 'text-amber-700 font-bold'
                    : dday.urgency === 'd-7'
                    ? 'text-yellow-700 font-bold'
                    : 'text-slate-500'
                }`}
              >
                {item.completed ? '✅ 과제 완료됨' : `• ${dday.remainingText}`}
              </span>
            </div>

            {/* Memo / Notes section */}
            {item.memo && (
              <div className="mt-3">
                <div
                  className={`text-xs text-slate-600 bg-white/80 rounded-xl p-2.5 border border-slate-200/60 transition-all ${
                    !isExpanded && item.memo.length > 80 ? 'line-clamp-2' : ''
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{item.memo}</p>
                </div>
                {item.memo.length > 80 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    {isExpanded ? (
                      <>
                        <span>접기</span>
                        <ChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        <span>메모 전체보기</span>
                        <ChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Bottom action buttons */}
            <div className="mt-3.5 pt-2.5 border-t border-slate-200/50 flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px]">
                {item.completed && item.completedAt ? (
                  <span className="text-emerald-700">완료: {formatDateTime(item.completedAt)}</span>
                ) : (
                  <span>마감 카운트다운 진행 중</span>
                )}
              </span>

              <div className="flex items-center gap-1">
                {item.memo && (
                  <button
                    onClick={handleCopyMemo}
                    title="일정 정보 복사"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
                <button
                  onClick={() => onEdit(item)}
                  title="일정 수정"
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item);
                  }}
                  title="일정 삭제"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
