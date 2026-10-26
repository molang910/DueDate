import { DDayStatus, DDayUrgency } from '../types';

/**
 * Calculates D-Day information and styling based on user rules:
 * - D-1 이하 (D-Day, D-1, 또는 마감 지난 것): 빨강 (Red)
 * - D-3 이하 (D-2, D-3): 주황 (Orange/Amber)
 * - D-7 이하 (D-4 ~ D-7): 노랑 (Yellow)
 * - D-8 이상: 기본 안정적인 컬러 (Normal/Slate)
 */
export function calculateDDay(dueDateStr: string, completed = false, now = new Date()): DDayStatus {
  const due = new Date(dueDateStr);
  const nowTime = now.getTime();
  const dueTime = due.getTime();

  // Reset hours to calculate calendar day diff accurately
  const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  
  const diffDays = Math.round((dueDateOnly - todayDateOnly) / (1000 * 60 * 60 * 24));
  const diffMs = dueTime - nowTime;
  const isOverdue = diffMs < 0;
  const isToday = diffDays === 0;

  const totalMinutesRemaining = Math.floor(Math.abs(diffMs) / (1000 * 60));
  const diffHours = Math.floor(totalMinutesRemaining / 60);
  const diffMinutes = totalMinutesRemaining % 60;

  let dDayText = '';
  let urgency: DDayUrgency = 'normal';

  if (isOverdue) {
    const overdueDays = Math.abs(diffDays);
    dDayText = overdueDays === 0 ? '마감 지남' : `D+${overdueDays} 지남`;
    urgency = 'overdue';
  } else if (diffDays === 0) {
    dDayText = 'D-Day';
    urgency = 'd-1'; // D-1 이하 빨강
  } else if (diffDays === 1) {
    dDayText = 'D-1';
    urgency = 'd-1'; // D-1 이하 빨강
  } else if (diffDays <= 3) {
    dDayText = `D-${diffDays}`;
    urgency = 'd-3'; // D-3 이하 주황
  } else if (diffDays <= 7) {
    dDayText = `D-${diffDays}`;
    urgency = 'd-7'; // D-7 이하 노랑
  } else {
    dDayText = `D-${diffDays}`;
    urgency = 'normal';
  }

  // Friendly remaining text
  let remainingText = '';
  if (isOverdue) {
    if (diffHours < 24) {
      remainingText = `${diffHours}시간 ${diffMinutes}분 전 마감`;
    } else {
      const days = Math.floor(diffHours / 24);
      remainingText = `${days}일 전 마감됨`;
    }
  } else {
    if (diffDays === 0) {
      if (diffHours === 0) {
        remainingText = `${diffMinutes}분 후 마감 (오늘)`;
      } else {
        remainingText = `${diffHours}시간 ${diffMinutes}분 후 마감 (오늘)`;
      }
    } else if (diffDays === 1) {
      remainingText = `내일 ${formatTime(due)} 마감 (${diffHours}시간 남음)`;
    } else if (diffDays <= 3) {
      remainingText = `${diffDays}일 남음 (${formatMonthDay(due)})`;
    } else {
      remainingText = `${diffDays}일 남음 (${formatMonthDay(due)})`;
    }
  }

  // Visual style classes
  let badgeBg = 'bg-slate-600 text-white';
  let badgeText = 'text-white';
  let cardBorder = 'border-slate-200';
  let cardBg = 'bg-white';
  let indicatorColor = 'bg-slate-400';

  if (completed) {
    badgeBg = 'bg-slate-200 text-slate-600';
    badgeText = 'text-slate-600';
    cardBorder = 'border-slate-200';
    cardBg = 'bg-slate-50/60';
    indicatorColor = 'bg-slate-300';
  } else {
    switch (urgency) {
      case 'overdue':
        badgeBg = 'bg-rose-700 text-white';
        cardBorder = 'border-rose-400 ring-1 ring-rose-200';
        cardBg = 'bg-rose-50/40';
        indicatorColor = 'bg-rose-600';
        break;
      case 'd-1': // Red
        badgeBg = 'bg-red-600 text-white font-extrabold shadow-sm animate-pulse';
        cardBorder = 'border-red-400 ring-1 ring-red-200 shadow-sm';
        cardBg = 'bg-red-50/30';
        indicatorColor = 'bg-red-600';
        break;
      case 'd-3': // Orange
        badgeBg = 'bg-amber-600 text-white font-bold shadow-sm';
        cardBorder = 'border-amber-300 ring-1 ring-amber-100';
        cardBg = 'bg-amber-50/20';
        indicatorColor = 'bg-amber-500';
        break;
      case 'd-7': // Yellow
        badgeBg = 'bg-yellow-400 text-yellow-950 font-bold';
        cardBorder = 'border-yellow-300';
        cardBg = 'bg-yellow-50/20';
        indicatorColor = 'bg-yellow-400';
        break;
      case 'normal':
      default:
        badgeBg = 'bg-indigo-600 text-white font-semibold';
        cardBorder = 'border-slate-200 hover:border-slate-300';
        cardBg = 'bg-white';
        indicatorColor = 'bg-indigo-400';
        break;
    }
  }

  return {
    diffDays,
    diffHours,
    diffMinutes,
    isOverdue,
    isToday,
    dDayText,
    remainingText,
    urgency,
    badgeBg,
    badgeText,
    cardBorder,
    cardBg,
    indicatorColor,
  };
}

export function formatDateTime(dateInput: string | Date): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = dayNames[d.getDay()];
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}(${dayName}) ${hh}:${min}`;
}

export function formatMonthDay(d: Date): string {
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  return `${mm}월 ${dd}일(${dayNames[d.getDay()]})`;
}

export function formatTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

// Generate distinct soft colors for courses/subjects
const SUBJECT_COLORS = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-violet-100 text-violet-800 border-violet-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-orange-100 text-orange-800 border-orange-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
];

export function getSubjectColor(subject: string): string {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SUBJECT_COLORS.length;
  return SUBJECT_COLORS[index];
}

// Preset icon or badge styling for ScheduleType
export function getTypeBadge(type: string): { label: string; badge: string } {
  switch (type) {
    case '시험':
      return { label: '시험 ✍️', badge: 'bg-rose-100 text-rose-700 border-rose-200' };
    case '퀴즈':
      return { label: '퀴즈 ⚡', badge: 'bg-amber-100 text-amber-800 border-amber-200' };
    case '팀플':
      return { label: '팀플 👥', badge: 'bg-purple-100 text-purple-700 border-purple-200' };
    case '발표':
      return { label: '발표 🎤', badge: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
    case '과제':
    default:
      return { label: '과제 📝', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
  }
}
