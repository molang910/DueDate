export type ScheduleType = '과제' | '시험' | '퀴즈' | '팀플' | '발표' | '기타';

export type Priority = 'high' | 'medium' | 'low';

export interface ScheduleItem {
  id: string;
  title: string;
  subject: string;
  type: ScheduleType;
  dueDate: string; // ISO format: YYYY-MM-DDTHH:mm
  memo: string;
  completed: boolean;
  completedAt?: string;
  priority?: Priority;
  color?: string; // Optional custom color tag
  createdAt: string;
}

export type DDayUrgency = 'd-1' | 'd-3' | 'd-7' | 'normal' | 'overdue';

export interface DDayStatus {
  diffDays: number;
  diffHours: number;
  diffMinutes: number;
  isOverdue: boolean;
  isToday: boolean;
  dDayText: string; // e.g. "D-Day", "D-1", "D-3", "D+2"
  remainingText: string; // e.g. "오늘 23:59 마감", "1일 5시간 남음", "3일 남음", "마감 2시간 경과"
  urgency: DDayUrgency;
  badgeBg: string;
  badgeText: string;
  cardBorder: string;
  cardBg: string;
  indicatorColor: string;
}

export type ViewMode = 'cards' | 'calendar';

export interface FilterState {
  subject: string; // 'ALL' or specific subject
  type: string; // 'ALL' or ScheduleType
  hideCompleted: boolean;
  searchQuery: string;
  sortBy: 'deadline' | 'created' | 'subject' | 'priority';
}
