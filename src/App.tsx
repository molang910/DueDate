/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { ScheduleItem, ViewMode, FilterState } from './types';
import { loadSchedules, saveSchedules, getSampleSchedules, exportSchedulesToJson } from './utils/storage';
import { calculateDDay } from './utils/dday';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { FilterBar } from './components/FilterBar';
import { ScheduleCard } from './components/ScheduleCard';
import { ScheduleModal } from './components/ScheduleModal';
import { AiNoticeModal } from './components/AiNoticeModal';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { Plus, Sparkles, Inbox, CheckCircle2, RotateCcw, Undo2, AlertTriangle, X } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<ScheduleItem[]>(() => loadSchedules());
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  
  // Filter state
  const [filter, setFilter] = useState<FilterState>({
    subject: 'ALL',
    type: 'ALL',
    hideCompleted: false, // User can toggle this to hide or show
    searchQuery: '',
    sortBy: 'deadline', // 기본: 마감이 가까운 순서로 정렬
  });

  // Urgency filter clicked from StatsBar (e.g. 'd-1', 'd-3', 'd-7', 'normal')
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ScheduleItem | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [deletedBackup, setDeletedBackup] = useState<ScheduleItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save to localStorage whenever items change
  useEffect(() => {
    saveSchedules(items);
  }, [items]);

  // Toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Distinct list of all subjects in items
  const subjects = useMemo(() => {
    const list = Array.from(new Set(items.map((i) => i.subject.trim()))).filter(Boolean);
    return list.sort();
  }, [items]);

  // Handle completion toggle
  const handleToggleComplete = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const willComplete = !item.completed;
          return {
            ...item,
            completed: willComplete,
            completedAt: willComplete ? new Date().toISOString() : undefined,
          };
        }
        return item;
      })
    );
    const target = items.find((i) => i.id === id);
    if (target) {
      showToast(target.completed ? `'${target.title}' 미완료로 변경` : `🎉 '${target.title}' 완료 완료!`);
    }
  };

  // Handle deletion
  const handleDelete = (id: string) => {
    const target = items.find((item) => item.id === id);
    if (target) {
      setDeletedBackup(target);
      setItems((prev) => prev.filter((item) => item.id !== id));
      showToast(`'${target.title}' 일정이 삭제되었습니다.`);
    }
  };

  // Undo delete
  const handleUndoDelete = () => {
    if (deletedBackup) {
      const restored = deletedBackup;
      setItems((prev) => [restored, ...prev]);
      setDeletedBackup(null);
      showToast(`'${restored.title}' 일정이 다시 복원되었습니다.`);
    }
  };

  // Handle saving new or updated item
  const handleSaveItem = (itemData: Omit<ScheduleItem, 'id' | 'createdAt'>, existingId?: string) => {
    if (existingId) {
      setItems((prev) =>
        prev.map((item) => (item.id === existingId ? { ...item, ...itemData } : item))
      );
      showToast('일정이 성공적으로 수정되었습니다.');
    } else {
      const newItem: ScheduleItem = {
        ...itemData,
        id: 'sched-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        createdAt: new Date().toISOString(),
      };
      setItems((prev) => [newItem, ...prev]);
      showToast(`'${newItem.title}' 일정이 등록되었습니다!`);
    }
    setEditingItem(null);
  };

  // Handle batch adding items from Gemini AI Notice Extractor
  const handleAddExtractedItems = (newItems: Omit<ScheduleItem, 'id' | 'createdAt'>[]) => {
    const createdList: ScheduleItem[] = newItems.map((data, idx) => ({
      ...data,
      id: 'sched-ai-' + Date.now() + '-' + idx,
      createdAt: new Date().toISOString(),
    }));
    setItems((prev) => [...createdList, ...prev]);
    showToast(`✨ Gemini AI가 ${createdList.length}개의 학업 일정을 추가했습니다!`);
  };

  // Handle reset to default sample college schedules
  const handleResetSample = () => {
    const samples = getSampleSchedules();
    setItems(samples);
    showToast('대학생 샘플 일정 6건이 새로 불러와졌습니다.');
  };

  // Handle quick add from calendar on specific date
  const handleAddOnDate = (dateStr: string) => {
    setEditingItem({
      id: '',
      title: '',
      subject: subjects[0] || '컴퓨터구조',
      type: '과제',
      dueDate: dateStr,
      memo: '',
      completed: false,
      createdAt: '',
    });
    setIsAddModalOpen(true);
  };

  // Filtered and sorted items
  const filteredAndSortedItems = useMemo(() => {
    const now = new Date();

    return items
      .filter((item) => {
        // Hide completed filter
        if (filter.hideCompleted && item.completed) {
          return false;
        }

        // Subject filter
        if (filter.subject !== 'ALL' && item.subject !== filter.subject) {
          return false;
        }

        // Type filter
        if (filter.type !== 'ALL' && item.type !== filter.type) {
          return false;
        }

        // Urgency filter from stats bar
        if (selectedUrgencyFilter) {
          const dday = calculateDDay(item.dueDate, item.completed, now);
          if (selectedUrgencyFilter === 'd-1') {
            if (dday.urgency !== 'd-1' && dday.urgency !== 'overdue') return false;
          } else if (dday.urgency !== selectedUrgencyFilter) {
            return false;
          }
        }

        // Search query
        if (filter.searchQuery.trim()) {
          const query = filter.searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(query);
          const matchSubject = item.subject.toLowerCase().includes(query);
          const matchMemo = (item.memo || '').toLowerCase().includes(query);
          const matchType = item.type.toLowerCase().includes(query);
          if (!matchTitle && !matchSubject && !matchMemo && !matchType) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // If one is completed and one is not, prioritize incomplete first (unless sorting specifically)
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        if (filter.sortBy === 'deadline') {
          // 마감이 가까운 순서로 정렬 (Default requirement)
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        } else if (filter.sortBy === 'created') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (filter.sortBy === 'subject') {
          return a.subject.localeCompare(b.subject, 'ko');
        } else if (filter.sortBy === 'priority') {
          const pRank = { high: 1, medium: 2, low: 3 };
          return (pRank[a.priority || 'medium'] || 2) - (pRank[b.priority || 'medium'] || 2);
        }
        return 0;
      });
  }, [items, filter, selectedUrgencyFilter]);

  const totalCompletedCount = items.filter((i) => i.completed).length;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col pb-24 sm:pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 bg-slate-900/95 text-white px-5 py-2.5 rounded-2xl shadow-2xl border border-slate-800 text-xs sm:text-sm font-semibold flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          {deletedBackup && toastMessage.includes('삭제') && (
            <button
              onClick={handleUndoDelete}
              className="ml-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 shrink-0 shadow-xs"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>실행 취소</span>
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenAddModal={() => {
          setEditingItem(null);
          setIsAddModalOpen(true);
        }}
        onResetSample={handleResetSample}
        onRequestResetSample={() => setIsResetConfirmOpen(true)}
        onExport={() => exportSchedulesToJson(items)}
      />

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-7 flex-1">
        
        {/* Urgency Statistics & Countdown Summary Bar */}
        <StatsBar
          items={items}
          selectedUrgencyFilter={selectedUrgencyFilter}
          onSelectUrgencyFilter={setSelectedUrgencyFilter}
        />

        {/* View Mode: Calendar View */}
        {viewMode === 'calendar' ? (
          <WeeklyCalendar
            items={items}
            onToggleComplete={handleToggleComplete}
            onEdit={(item) => {
              setEditingItem(item);
              setIsAddModalOpen(true);
            }}
            onAddOnDate={handleAddOnDate}
          />
        ) : null}

        {/* Filters, Search & View Controls */}
        <FilterBar
          filter={filter}
          setFilter={setFilter}
          subjects={subjects}
          totalVisibleCount={filteredAndSortedItems.length}
          totalCompletedCount={totalCompletedCount}
        />

        {/* Schedule Cards List (마감이 가까운 순서로 정렬) */}
        {filteredAndSortedItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-10 text-center shadow-xs my-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              해당하는 학업 일정이 없습니다.
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
              {filter.hideCompleted
                ? '완료된 항목이 숨겨져 있을 수 있습니다. "완료 숨김" 버튼을 누르거나 새로운 일정을 추가해보세요.'
                : '공지문을 붙여넣어 AI로 한 번에 추출하거나 직접 새 과제/시험을 등록해보세요.'}
            </p>
            <div className="flex items-center justify-center gap-2.5">
              <button
                onClick={() => setIsAiModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-sm transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>AI 공지에서 추출하기</span>
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>직접 등록하기</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredAndSortedItems.map((item) => (
              <ScheduleCard
                key={item.id}
                item={item}
                onToggleComplete={handleToggleComplete}
                onEdit={(itemToEdit) => {
                  setEditingItem(itemToEdit);
                  setIsAddModalOpen(true);
                }}
                onDelete={(itemToDel) => setItemToDelete(itemToDel)}
              />
            ))}
          </div>
        )}

      </main>

      {/* Floating Action Buttons for Mobile */}
      <div className="fixed bottom-5 right-5 sm:hidden z-40 flex flex-col items-end gap-2.5">
        <button
          onClick={() => setIsAiModalOpen(true)}
          className="w-12 h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-300 active:scale-95 cursor-pointer"
          title="AI 공지 추출"
        >
          <Sparkles className="w-5 h-5 text-yellow-300" />
        </button>
        <button
          onClick={() => {
            setEditingItem(null);
            setIsAddModalOpen(true);
          }}
          className="w-13 h-13 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-900/30 active:scale-95 cursor-pointer"
          title="새 일정 추가"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Schedule Create/Edit Modal */}
      <ScheduleModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        onDelete={(itemToDel) => setItemToDelete(itemToDel)}
        initialItem={editingItem}
        existingSubjects={subjects}
      />

      {/* Gemini AI Notice Extraction Modal */}
      <AiNoticeModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onAddExtractedItems={handleAddExtractedItems}
      />

      {/* In-App Delete Confirmation Modal (Replaces blocked window.confirm) */}
      <DeleteConfirmModal
        isOpen={Boolean(itemToDelete)}
        item={itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
      />

      {/* In-App Sample Restore Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3.5">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              샘플 일정으로 복원하시겠습니까?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              컴퓨터구조 과제, 경영학원론 시험, 데이터베이스 퀴즈 등 대학생 기본 예시 일정 6건으로 목록이 초기화됩니다.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  handleResetSample();
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer active:scale-97"
              >
                복원하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
