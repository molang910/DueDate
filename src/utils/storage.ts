import { ScheduleItem } from '../types';

const STORAGE_KEY = 'college_dday_schedules_v2';

export function getSampleSchedules(): ScheduleItem[] {
  const now = new Date();
  
  // Helper to construct ISO strings relative to now
  const makeDate = (daysFromNow: number, hours = 23, minutes = 59): string => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hours, minutes, 0, 0);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(hours).padStart(2, '0');
    const min = String(minutes).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  return [
    {
      id: 'sample-1',
      title: '5장 파이프라인 시뮬레이터 보고서',
      subject: '컴퓨터구조',
      type: '과제',
      dueDate: makeDate(1, 23, 59), // D-1 (빨강)
      memo: 'LMS 과제 제출란에 PDF 형식으로 업로드. 하저드(Hazard) 분석 그래프 필수 첨부.',
      completed: false,
      priority: 'high',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-2',
      title: '중간고사 (1장~6장 총정리)',
      subject: '경영학원론',
      type: '시험',
      dueDate: makeDate(3, 14, 0), // D-3 (주황)
      memo: '경영관 301호 대형강의실. 신분증, 컴퓨터용 사인펜 및 수정테이프 지참 필수.',
      completed: false,
      priority: 'high',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-3',
      title: '동적계획법(DP) 깜짝 퀴즈 대비',
      subject: '알고리즘',
      type: '퀴즈',
      dueDate: makeDate(5, 10, 30), // D-5 (노랑)
      memo: '수업 시작 15분 전 온라인 LMS 퀴즈 오픈. 배점 5% 반영되니 주의.',
      completed: false,
      priority: 'medium',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-4',
      title: 'ER 다이어그램 및 스키마 설계 1차 발표',
      subject: '데이터베이스',
      type: '팀플',
      dueDate: makeDate(7, 18, 0), // D-7 (노랑)
      memo: '발표 시간 10분, Q&A 5분. 조원 전원 슬라이드 파트 분담 확인.',
      completed: false,
      priority: 'high',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-5',
      title: 'React Native 모바일 화면 UI 설계서',
      subject: '모바일프로그래밍',
      type: '과제',
      dueDate: makeDate(11, 23, 59), // D-11 (일반)
      memo: 'Figma 프로토타입 링크 및 화면 설명서 제출. 깃허브 리포지토리 링크 포함.',
      completed: false,
      priority: 'low',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-6',
      title: 'TED 토크 5분 자유주제 스피치',
      subject: '실용영어',
      type: '발표',
      dueDate: makeDate(-1, 15, 0), // 완료된 항목 샘플
      memo: '슬라이드 5장 이내. Q&A 준비 완료.',
      completed: true,
      completedAt: new Date().toISOString(),
      priority: 'medium',
      createdAt: new Date().toISOString(),
    },
  ];
}

export function loadSchedules(): ScheduleItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const sample = getSampleSchedules();
      saveSchedules(sample);
      return sample;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return getSampleSchedules();
  } catch (e) {
    console.error('Failed to load schedules from localStorage', e);
    return getSampleSchedules();
  }
}

export function saveSchedules(items: ScheduleItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save schedules to localStorage', e);
  }
}

export function exportSchedulesToJson(items: ScheduleItem[]): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `대학생_과제시험_일정백업_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
