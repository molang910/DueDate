import React from 'react';
import { FilterState, ScheduleType } from '../types';
import { Search, EyeOff, Eye, ArrowUpDown, X, Tag } from 'lucide-react';

interface FilterBarProps {
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  subjects: string[];
  totalVisibleCount: number;
  totalCompletedCount: number;
}

const SCHEDULE_TYPES: { label: string; value: string }[] = [
  { label: '전체 종류', value: 'ALL' },
  { label: '과제 📝', value: '과제' },
  { label: '시험 ✍️', value: '시험' },
  { label: '퀴즈 ⚡', value: '퀴즈' },
  { label: '팀플 👥', value: '팀플' },
  { label: '발표 🎤', value: '발표' },
  { label: '기타 📌', value: '기타' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  setFilter,
  subjects,
  totalVisibleCount,
  totalCompletedCount,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 mb-5 shadow-xs space-y-3.5">
      
      {/* Search & Main Selectors */}
      <div className="flex flex-col md:flex-row md:items-center gap-2.5">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="과목명, 과제명, 시험 범위, 메모 검색..."
            value={filter.searchQuery}
            onChange={(e) => setFilter((prev) => ({ ...prev, searchQuery: e.target.value }))}
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder-slate-400 transition-all"
          />
          {filter.searchQuery && (
            <button
              onClick={() => setFilter((prev) => ({ ...prev, searchQuery: '' }))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Type Filter Dropdown & Sort & Hide Completed Toggle */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          
          {/* Type Filter */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={filter.type}
              onChange={(e) => setFilter((prev) => ({ ...prev, type: e.target.value }))}
              className="w-full sm:w-auto text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
            >
              {SCHEDULE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="relative flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filter.sortBy}
              onChange={(e) => setFilter((prev) => ({ ...prev, sortBy: e.target.value as any }))}
              className="bg-transparent border-none focus:outline-hidden text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="deadline">마감 임박순 ⚡</option>
              <option value="created">최신 등록순</option>
              <option value="subject">과목명 가나다순</option>
              <option value="priority">우선순위순</option>
            </select>
          </div>

          {/* Hide Completed Toggle (완료된 항목 숨기기) */}
          <button
            type="button"
            onClick={() => setFilter((prev) => ({ ...prev, hideCompleted: !prev.hideCompleted }))}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              filter.hideCompleted
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {filter.hideCompleted ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
                <span>완료 숨김 켜짐</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>완료 숨김 꺼짐 ({totalCompletedCount})</span>
              </>
            )}
          </button>

        </div>
      </div>

      {/* Subject Filter Chips (과목별 필터) */}
      <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <span className="text-xs font-medium text-slate-400 flex items-center gap-1 shrink-0 mr-1">
          <Tag className="w-3 h-3" />
          과목:
        </span>

        {/* All Subjects Chip */}
        <button
          onClick={() => setFilter((prev) => ({ ...prev, subject: 'ALL' }))}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
            filter.subject === 'ALL'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          전체 과목
        </button>

        {/* Individual Subject Chips */}
        {subjects.map((sub) => {
          const isSelected = filter.subject === sub;
          return (
            <button
              key={sub}
              onClick={() => setFilter((prev) => ({ ...prev, subject: sub }))}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {sub}
            </button>
          );
        })}
      </div>

      {/* Active filter summary if filtered */}
      {(filter.subject !== 'ALL' || filter.type !== 'ALL' || filter.searchQuery) && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            필터 적용 결과: <strong className="text-indigo-600 font-bold">{totalVisibleCount}</strong>개 표시 중
          </span>
          <button
            onClick={() => setFilter({
              subject: 'ALL',
              type: 'ALL',
              hideCompleted: false,
              searchQuery: '',
              sortBy: 'deadline'
            })}
            className="text-xs text-slate-400 hover:text-rose-500 underline cursor-pointer"
          >
            모든 필터 초기화
          </button>
        </div>
      )}

    </div>
  );
};
