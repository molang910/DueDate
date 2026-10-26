import React, { useState, useEffect } from 'react';
import { ScheduleItem, ScheduleType, Priority } from '../types';
import { X, Calendar, Clock, AlertCircle, Trash2 } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<ScheduleItem, 'id' | 'createdAt'>, existingId?: string) => void;
  onDelete?: (item: ScheduleItem) => void;
  initialItem?: ScheduleItem | null;
  existingSubjects: string[];
}

const COMMON_SUBJECT_SUGGESTIONS = [
  '컴퓨터구조',
  '경영학원론',
  '자료구조',
  '알고리즘',
  '데이터베이스',
  '운영체제',
  '실용영어',
  '교양세미나',
];

const SCHEDULE_TYPES: { type: ScheduleType; label: string; icon: string }[] = [
  { type: '과제', label: '과제', icon: '📝' },
  { type: '시험', label: '시험', icon: '✍️' },
  { type: '퀴즈', label: '퀴즈', icon: '⚡' },
  { type: '팀플', label: '팀플', icon: '👥' },
  { type: '발표', label: '발표', icon: '🎤' },
  { type: '기타', label: '기타', icon: '📌' },
];

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialItem,
  existingSubjects,
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<ScheduleType>('과제');
  const [dueDate, setDueDate] = useState('');
  const [memo, setMemo] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [error, setError] = useState('');

  // Combine unique subject suggestions
  const subjectSuggestions = Array.from(
    new Set([...existingSubjects, ...COMMON_SUBJECT_SUGGESTIONS])
  ).slice(0, 8);

  // Helper to set deadline preset
  const setPresetDate = (daysFromNow: number, hours = 23, minutes = 59) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hours, minutes, 0, 0);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(hours).padStart(2, '0');
    const min = String(minutes).padStart(2, '0');
    setDueDate(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
  };

  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.title);
      setSubject(initialItem.subject);
      setType(initialItem.type);
      setDueDate(initialItem.dueDate);
      setMemo(initialItem.memo || '');
      setPriority(initialItem.priority || 'medium');
    } else {
      // Default to 3 days later 23:59
      setTitle('');
      setSubject(existingSubjects[0] || '컴퓨터구조');
      setType('과제');
      setPresetDate(2, 23, 59);
      setMemo('');
      setPriority('medium');
    }
    setError('');
  }, [initialItem, isOpen, existingSubjects]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('과제 또는 시험 명칭을 입력해주세요.');
      return;
    }
    if (!subject.trim()) {
      setError('과목명을 입력해주세요.');
      return;
    }
    if (!dueDate) {
      setError('마감 일시를 선택해주세요.');
      return;
    }

    onSave(
      {
        title: title.trim(),
        subject: subject.trim(),
        type,
        dueDate,
        memo: memo.trim(),
        completed: initialItem ? initialItem.completed : false,
        priority,
      },
      initialItem?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {initialItem ? '학업 일정 수정하기' : '새 학업 일정 추가'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              과목, 마감일시, 메모를 입력하면 D-Day 카드가 자동으로 생성됩니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Schedule Type Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              일정 종류 <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {SCHEDULE_TYPES.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setType(t.type)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    type === t.type
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="text-sm">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              과목명 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="예: 컴퓨터구조, 경영학원론, 자료구조"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
            />
            {/* Quick subject suggestion chips */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400">추천 과목:</span>
              {subjectSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s)}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200/60 transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              일정 / 과제명 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="예: 5장 파이프라인 과제 보고서 제출, 중간고사 1~5장"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
            />
          </div>

          {/* Due Date & Time Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              마감 일시 (날짜 및 시간) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-mono"
              />
            </div>

            {/* Quick Date Presets */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400">빠른 설정:</span>
              <button
                type="button"
                onClick={() => setPresetDate(0, 23, 59)}
                className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
              >
                오늘 23:59 (D-Day)
              </button>
              <button
                type="button"
                onClick={() => setPresetDate(1, 23, 59)}
                className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
              >
                내일 23:59 (D-1)
              </button>
              <button
                type="button"
                onClick={() => setPresetDate(3, 23, 59)}
                className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                3일 뒤 (D-3)
              </button>
              <button
                type="button"
                onClick={() => setPresetDate(7, 23, 59)}
                className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200 hover:bg-yellow-100 transition-colors cursor-pointer"
              >
                1주일 뒤 (D-7)
              </button>
            </div>
          </div>

          {/* Priority & Importance */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              중요도
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                  priority === 'high'
                    ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🚨 매우 중요 (High)
              </button>
              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                  priority === 'medium'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-indigo-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                📌 보통 (Medium)
              </button>
            </div>
          </div>

          {/* Memo / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              메모 및 상세 안내사항
            </label>
            <textarea
              rows={3}
              placeholder="제출 장소(LMS, 이메일), 파일 형식(PDF), 분량, 시험 범위, 준비물 등을 자유롭게 적어두세요."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5">
            {initialItem && initialItem.id && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialItem);
                  onClose();
                }}
                className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>이 일정 삭제</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all cursor-pointer active:scale-97"
              >
                {initialItem ? '수정 완료' : '일정에 등록하기'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
