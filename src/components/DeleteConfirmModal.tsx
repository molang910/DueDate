import React from 'react';
import { ScheduleItem } from '../types';
import { Trash2, X, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { calculateDDay, formatDateTime, getSubjectColor, getTypeBadge } from '../utils/dday';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  item: ScheduleItem | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !item) return null;

  const dday = calculateDDay(item.dueDate, item.completed);
  const typeBadge = getTypeBadge(item.type);
  const subjectColor = getSubjectColor(item.subject);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <Trash2 className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 leading-snug">
              학업 일정 삭제
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              선택한 일정을 목록에서 삭제하시겠습니까?
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item preview card */}
        <div className="px-5 sm:px-6 py-3">
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-3.5">
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${subjectColor}`}>
                {item.subject}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${typeBadge.badge}`}>
                {typeBadge.label}
              </span>
              <span className={`ml-auto px-2 py-0.5 rounded-lg text-xs font-black ${dday.badgeBg}`}>
                {dday.dDayText}
              </span>
            </div>

            <h4 className="text-sm font-bold text-slate-900 line-clamp-2">
              {item.title}
            </h4>

            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatDateTime(item.dueDate)}</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-5 sm:p-6 pt-3 flex items-center justify-end gap-2.5 bg-slate-50/50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(item.id);
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-300 hover:shadow-md transition-all cursor-pointer active:scale-97 flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>일정 삭제하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
