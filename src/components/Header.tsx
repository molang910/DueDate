import React, { useState } from 'react';
import { Sparkles, Plus, Calendar, LayoutGrid, RotateCcw, Download, BookOpen, Clock } from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenAiModal: () => void;
  onOpenAddModal: () => void;
  onResetSample: () => void;
  onRequestResetSample?: () => void;
  onExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  onOpenAiModal,
  onOpenAddModal,
  onResetSample,
  onRequestResetSample,
  onExport,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  // Format today's date
  const today = new Date();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const formattedToday = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 (${dayNames[today.getDay()]})`;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          
          {/* Logo & Current Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                    대학생 과제·시험 D-Day 알리미
                  </h1>
                  <span className="hidden xs:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                    2학기 학업플래너
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>오늘: {formattedToday}</span>
                </p>
              </div>
            </div>

            {/* Mobile More Actions Menu */}
            <div className="relative sm:hidden">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                title="설정 및 백업"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40">
                  <button
                    onClick={() => {
                      onExport();
                      setShowMenu(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    일정 백업 다운로드
                  </button>
                  <button
                    onClick={() => {
                      if (onRequestResetSample) {
                        onRequestResetSample();
                      } else {
                        onResetSample();
                      }
                      setShowMenu(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-400" />
                    샘플 일정 복원
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Controls: View Switcher & Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
            
            {/* View Switcher: Cards vs Weekly Calendar */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>카드 목록</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>주간 캘린더</span>
              </button>
            </div>

            {/* AI Notice Extractor Button */}
            <button
              onClick={onOpenAiModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-sm shadow-indigo-200 hover:shadow-md transition-all active:scale-97 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin-slow" />
              <span>AI 공지 자동 등록</span>
            </button>

            {/* Direct Add Button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-xs transition-all active:scale-97 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden xs:inline">일정</span> 직접 추가
            </button>

            {/* Desktop Backup / Reset */}
            <div className="hidden sm:flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                onClick={onExport}
                title="일정 백업 다운로드"
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (onRequestResetSample) {
                    onRequestResetSample();
                  } else {
                    onResetSample();
                  }
                }}
                title="샘플 일정 복원"
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
