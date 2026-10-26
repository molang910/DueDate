import React, { useState, useRef, useEffect } from 'react';
import { ScheduleItem, ScheduleType } from '../types';
import {
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  ArrowRight,
  FileText,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  Camera,
  Trash2,
  PenTool,
} from 'lucide-react';
import { formatDateTime, getTypeBadge, getSubjectColor } from '../utils/dday';

interface ExtractedSchedule {
  title: string;
  subject: string;
  type: string;
  dueDate: string;
  memo: string;
  selected?: boolean;
}

interface AiNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExtractedItems: (items: Omit<ScheduleItem, 'id' | 'createdAt'>[]) => void;
}

const SAMPLE_TEXT_NOTICES = [
  {
    name: '컴퓨터구조 과제 공지',
    text: `[컴퓨터구조 공지] 
안녕하세요 학생 여러분, 5장 파이프라인 시뮬레이터 과제 관련 안내입니다. 
마감 기한은 이번 주 금요일 23:59까지입니다. 
학교 LMS 과제 제출란에 파이프라인 레지스터 분석 보고서(PDF)를 업로드하세요. 지각 제출 시 일자별 감점 적용됩니다.`,
  },
  {
    name: '경영학원론 중간고사',
    text: `[경영학원론 공지] 
중간고사 일정 및 장소를 공지합니다.
일시: 11월 4일(수) 14:00 ~ 15:30 (오후 2시)
장소: 경영관 301호 대형강의실
범위: 1장부터 6장 (경영전략, 마케팅, 조직행동론)
준비물: 신분증, 컴퓨터용 사인펜, 수정테이프. 전자기기 소지 불가.`,
  },
  {
    name: '복합 공지 (퀴즈 + 팀플 2건)',
    text: `[데이터베이스응용 강의 공지]
1. 2차 깜짝 퀴즈: 11월 2일 오전 10:00 수업 시작 직후 20분간 LMS를 통해 실시됩니다. (SQL 질의문 파트)
2. 조별 텀프로젝트 1차 스키마 설계서: 11월 8일 일요일 23:59까지 조장 한 명이 과제함에 zip 파일로 제출해주세요.`,
  },
];

export const AiNoticeModal: React.FC<AiNoticeModalProps> = ({
  isOpen,
  onClose,
  onAddExtractedItems,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image');
  const [noticeText, setNoticeText] = useState('');
  const [imageFile, setImageFile] = useState<{
    dataUrl: string;
    name: string;
    mimeType: string;
    sizeKb: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedList, setExtractedList] = useState<ExtractedSchedule[]>([]);
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [noteInfo, setNoteInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for clipboard image paste (Ctrl+V / Cmd+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            setActiveTab('image');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일(PNG, JPG, WEBP)만 첨부할 수 있습니다.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('파일 용량은 15MB 이하만 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;

      // Optimize and resize large images on client side for fast uploading and OCR
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL(file.type || 'image/jpeg', 0.9);
          setImageFile({
            dataUrl: optimizedDataUrl,
            name: file.name || '공지_사진.png',
            mimeType: file.type || 'image/jpeg',
            sizeKb: Math.round((optimizedDataUrl.length * 3) / 4 / 1024),
          });
        } else {
          setImageFile({
            dataUrl: rawDataUrl,
            name: file.name || '공지_사진.png',
            mimeType: file.type || 'image/png',
            sizeKb: Math.round(file.size / 1024),
          });
        }
        setError(null);
      };
      img.onerror = () => {
        setImageFile({
          dataUrl: rawDataUrl,
          name: file.name || '공지_사진.png',
          mimeType: file.type || 'image/png',
          sizeKb: Math.round(file.size / 1024),
        });
        setError(null);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleExtract = async () => {
    const hasImage = Boolean(imageFile);
    const hasText = Boolean(noticeText.trim());

    if (!hasImage && !hasText) {
      setError('공지 사진이나 손글씨 메모 사진을 첨부하거나 텍스트를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setNoteInfo(null);

    try {
      const payload: any = {
        referenceDate: new Date().toISOString(),
      };

      if (hasText) {
        payload.text = noticeText.trim();
      }
      if (hasImage && imageFile) {
        payload.imageBase64 = imageFile.dataUrl;
        payload.mimeType = imageFile.mimeType;
      }

      const response = await fetch('/api/extract-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '일정 추출에 실패했습니다.');
      }

      const data = await response.json();
      if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
        throw new Error(
          '사진이나 공지에서 마감 일정 및 시험 정보를 인식하지 못했습니다. 글씨나 날짜가 잘 보이는 사진인지 확인해주세요.'
        );
      }

      // Mark all as selected initially
      const itemsWithSelect = data.items.map((item: any) => ({
        title: item.title || '새 학업 일정',
        subject: item.subject || '일반',
        type: item.type || '과제',
        dueDate: item.dueDate || new Date().toISOString().slice(0, 16),
        memo: item.memo || '',
        selected: true,
      }));

      setExtractedList(itemsWithSelect);
      if (data.note) {
        setNoteInfo(data.note);
      }
      setStep('review');
    } catch (err: any) {
      console.error(err);
      setError(err.message || '일정 추출 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (index: number) => {
    setExtractedList((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleUpdateItem = (index: number, field: keyof ExtractedSchedule, value: string) => {
    setExtractedList((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleConfirmAdd = () => {
    const selectedItems = extractedList.filter((it) => it.selected !== false);
    if (selectedItems.length === 0) {
      setError('등록할 일정을 최소 하나 이상 선택해주세요.');
      return;
    }

    const formattedForSave: Omit<ScheduleItem, 'id' | 'createdAt'>[] = selectedItems.map((it) => ({
      title: it.title,
      subject: it.subject,
      type: (['과제', '시험', '퀴즈', '팀플', '발표', '기타'].includes(it.type)
        ? it.type
        : '과제') as ScheduleType,
      dueDate: it.dueDate,
      memo: it.memo,
      completed: false,
      priority: it.type === '시험' ? 'high' : 'medium',
    }));

    onAddExtractedItems(formattedForSave);
    handleResetAndClose();
  };

  const handleResetAndClose = () => {
    setNoticeText('');
    setImageFile(null);
    setExtractedList([]);
    setStep('input');
    setError(null);
    setNoteInfo(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-violet-50 to-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 shrink-0">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>AI 공지 & 손글씨 자동 일정 등록</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  사진 & 손글씨 인식
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {step === 'input'
                  ? '노트 손글씨 필기, 포스트잇, 다이어리, 칠판 사진 또는 공지 캡처를 올리면 Gemini가 자동 파싱합니다.'
                  : 'AI가 추출한 학업 일정을 검토하고 내 캘린더에 바로 등록하세요.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {noteInfo && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{noteInfo}</span>
            </div>
          )}

          {step === 'input' ? (
            <div className="space-y-4">
              
              {/* Mode Switch Tabs: Image vs Text */}
              <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setActiveTab('image')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'image'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>사진 / 손글씨 첨부 {imageFile ? '✓' : ''}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'text'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>텍스트 붙여넣기 {noticeText.trim() ? '✓' : ''}</span>
                </button>
              </div>

              {/* Photo Upload Area */}
              {activeTab === 'image' && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Handwriting highlight tip */}
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-indigo-900">
                    <PenTool className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      <strong>손글씨 & 캡처 인식:</strong> 태블릿(아이패드 굿노트/노터빌리티), 수첩 필기, 포스트잇, 칠판 판서 사진을 올리면 과목명, 종류, 마감일을 자동으로 분석합니다.
                    </span>
                  </div>

                  {!imageFile ? (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/20 rounded-2xl p-7 sm:p-9 text-center transition-all cursor-pointer group"
                    >
                      <div className="w-13 h-13 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-indigo-600 mx-auto mb-3 group-hover:scale-105 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 mb-1">
                        사진 또는 캡처 이미지 업로드
                      </p>
                      <p className="text-xs text-slate-500 mb-2.5">
                        클릭하여 파일 선택(카메라 촬영), 드래그 & 드롭, 또는 <strong className="text-indigo-600">Ctrl+V / Cmd+V</strong>로 바로 붙여넣기
                      </p>
                      <span className="inline-block px-3 py-1 rounded-lg text-[11px] font-medium bg-slate-200/60 text-slate-600">
                        PNG, JPG, WEBP 지원 (태블릿 필기, 스마트폰 촬영 사진 모두 지원)
                      </span>
                    </div>
                  ) : (
                    /* Image Preview Card */
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <ImageIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {imageFile.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({imageFile.sizeKb} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setImageFile(null)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="사진 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Thumbnail */}
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-64 bg-white flex items-center justify-center">
                        <img
                          src={imageFile.dataUrl}
                          alt="공지 미리보기"
                          className="max-h-64 w-auto object-contain mx-auto"
                        />
                      </div>
                    </div>
                  )}

                  {/* Supplementary text memo (optional) */}
                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      추가 설명 메모 (선택사항)
                    </label>
                    <input
                      type="text"
                      placeholder="사진 외에 덧붙일 내용이 있다면 적어주세요 (예: '컴퓨터공학과 3학년')"
                      value={noticeText}
                      onChange={(e) => setNoticeText(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Text Notice Area */}
              {activeTab === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>공지문 텍스트 붙여넣기</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        {noticeText.length} 자
                      </span>
                    </label>
                    <textarea
                      rows={6}
                      placeholder={`여기에 공지문을 그대로 붙여넣으세요.
예시:
"컴퓨터구조 5장 과제는 이번 주 금요일 23:59까지 LMS에 제출바랍니다."
"중간고사는 11월 4일 수요일 14:00 공학관 301호입니다."`}
                      value={noticeText}
                      onChange={(e) => setNoticeText(e.target.value)}
                      className="w-full p-3.5 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 leading-relaxed font-sans placeholder-slate-400"
                    />
                  </div>

                  {/* Sample Notices quick buttons */}
                  <div>
                    <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      <span>빠른 테스트용 샘플 공지글:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {SAMPLE_TEXT_NOTICES.map((sample, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setNoticeText(sample.text)}
                          className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left text-xs transition-all group cursor-pointer"
                        >
                          <div className="font-bold text-slate-800 group-hover:text-indigo-600 mb-0.5">
                            {sample.name}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-2">
                            {sample.text.replace(/\n/g, ' ')}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* Review Step */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  추출된 학업 일정 ({extractedList.length}건)
                </span>
                <button
                  onClick={() => setStep('input')}
                  className="text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
                >
                  ← 공지 사진/글 다시 등록
                </button>
              </div>

              <div className="space-y-3">
                {extractedList.map((item, index) => {
                  const subjectColor = getSubjectColor(item.subject);
                  const typeBadge = getTypeBadge(item.type);

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-2xl border transition-all ${
                        item.selected
                          ? 'border-indigo-300 bg-indigo-50/20 shadow-xs'
                          : 'border-slate-200 bg-slate-50/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={item.selected !== false}
                          onChange={() => handleToggleSelect(index)}
                          className="mt-1 w-4 h-4 rounded-md text-indigo-600 accent-indigo-600 cursor-pointer"
                        />

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${subjectColor}`}>
                              {item.subject}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${typeBadge.badge}`}>
                              {typeBadge.label}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              마감: {formatDateTime(item.dueDate)}
                            </span>
                          </div>

                          {/* Editable fields */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-0.5">과목명</label>
                              <input
                                type="text"
                                value={item.subject}
                                onChange={(e) => handleUpdateItem(index, 'subject', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-0.5">일정 종류</label>
                              <select
                                value={item.type}
                                onChange={(e) => handleUpdateItem(index, 'type', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
                              >
                                <option value="과제">과제</option>
                                <option value="시험">시험</option>
                                <option value="퀴즈">퀴즈</option>
                                <option value="팀플">팀플</option>
                                <option value="발표">발표</option>
                                <option value="기타">기타</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-0.5">과제/시험 제목</label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => handleUpdateItem(index, 'title', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-0.5">마감 일시</label>
                              <input
                                type="datetime-local"
                                value={item.dueDate}
                                onChange={(e) => handleUpdateItem(index, 'dueDate', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-mono"
                              />
                            </div>
                          </div>

                          {item.memo && (
                            <div>
                              <label className="block text-[10px] text-slate-400 font-bold mb-0.5">추출된 메모</label>
                              <textarea
                                rows={2}
                                value={item.memo}
                                onChange={(e) => handleUpdateItem(index, 'memo', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            type="button"
            onClick={handleResetAndClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            닫기
          </button>

          {step === 'input' ? (
            <button
              type="button"
              disabled={isLoading || (!imageFile && !noticeText.trim())}
              onClick={handleExtract}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-97"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gemini AI가 손글씨/공지 사진을 판독하는 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>{imageFile ? '손글씨/사진에서 일정 추출하기' : '공지문 분석 & 일정 추출'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmAdd}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all cursor-pointer active:scale-97"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>선택한 일정 내 캘린더에 등록</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
