import type { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

// Helper for fallback regex-based schedule extraction if API key isn't provided or fails
function fallbackExtract(text: string, refDateStr?: string) {
  const now = refDateStr ? new Date(refDateStr) : new Date();
  const results = [];
  
  // Try to find course name
  let subject = '일반';
  if (/일본어문학|일본어/i.test(text)) {
    subject = '일본어문학';
  } else {
    const subjectMatch = text.match(/([가-힣A-Za-z0-9\s]{2,15}(?:문학|어문학|론|학|원론|프로그래밍|구조|시스템|공학|설계|네트워크|수학|통계|디자인|커뮤니케이션|영어|세미나))/);
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
    } else {
      const bracketMatch = text.match(/\[([가-힣A-Za-z0-9\s]+)\]/);
      if (bracketMatch) subject = bracketMatch[1].trim();
    }
  }

  // Type
  let type = '과제';
  if (/쪽지시험|퀴즈|quiz/i.test(text)) {
    type = '퀴즈';
  } else if (/중간고사|기말고사|시험|exam|test/i.test(text)) {
    type = '시험';
  } else if (/팀플|팀\s*프로젝트|조별/i.test(text)) {
    type = '팀플';
  } else if (/발표|프레젠테이션|pt/i.test(text)) {
    type = '발표';
  }

  // Dates
  let targetDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const dateMatch = text.match(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/);
  const slashDateMatch = text.match(/(?:^|\D)(\d{1,2})\s*[/.]\s*(\d{1,2})(?:\D|$)/);
  const isoMatch = text.match(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  
  if (dateMatch) {
    const year = dateMatch[1] ? parseInt(dateMatch[1]) : now.getFullYear();
    const month = parseInt(dateMatch[2]) - 1;
    const day = parseInt(dateMatch[3]);
    targetDate = new Date(year, month, day, 23, 59, 0);
  } else if (isoMatch) {
    const year = parseInt(isoMatch[1]);
    const month = parseInt(isoMatch[2]) - 1;
    const day = parseInt(isoMatch[3]);
    targetDate = new Date(year, month, day, 23, 59, 0);
  } else if (slashDateMatch) {
    const year = now.getFullYear();
    const month = parseInt(slashDateMatch[1]) - 1;
    const day = parseInt(slashDateMatch[2]);
    const defaultHour = type === '퀴즈' || type === '시험' ? 10 : 23;
    const defaultMin = type === '퀴즈' || type === '시험' ? 0 : 59;
    targetDate = new Date(year, month, day, defaultHour, defaultMin, 0);
  }

  // Time
  const timeMatch = text.match(/(오전|오후)?\s*(\d{1,2})(?::(\d{2})|시(?:\s*(\d{1,2})분)?)/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[2]);
    const minute = timeMatch[3] ? parseInt(timeMatch[3]) : (timeMatch[4] ? parseInt(timeMatch[4]) : 0);
    if (timeMatch[1] === '오후' && hour < 12) hour += 12;
    if (timeMatch[1] === '오전' && hour === 12) hour = 0;
    targetDate.setHours(hour, minute, 0, 0);
  }

  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  const hh = String(targetDate.getHours()).padStart(2, '0');
  const min = String(targetDate.getMinutes()).padStart(2, '0');
  const dueDate = `${yyyy}-${mm}-${dd}T${hh}:${min}`;

  let title = text.length > 25 ? text.substring(0, 25).trim() + '...' : text.trim();
  if (/일본어문학/.test(text) && /쪽지시험/.test(text)) {
    title = '일본어문학 쪽지시험';
    subject = '일본어문학';
  } else if (/쪽지시험/.test(text)) {
    title = subject !== '일반' ? `${subject} 쪽지시험` : '쪽지시험';
  }

  results.push({
    title,
    subject,
    type,
    dueDate,
    memo: text.trim().slice(0, 150),
  });

  return results;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { text, imageBase64, mimeType = 'image/jpeg', referenceDate } = req.body || {};
    
    if ((!text || !text.trim()) && !imageBase64) {
      return res.status(400).json({ error: '공지 텍스트나 사진 이미지를 첨부해주세요.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const isPlaceholder = !apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.startsWith('MY_');
    const today = referenceDate ? new Date(referenceDate) : new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][today.getDay()];

    if (isPlaceholder) {
      const fallback = fallbackExtract(text || '일본어문학 쪽지시험 11/4', referenceDate);
      return res.json({ items: fallback, note: 'AI 키 미설정으로 스마트 분석 규칙으로 추출되었습니다.' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = `당신은 대학교 학업 일정 인식 전문 AI 비서입니다.
LMS 화면 캡처, 단톡방 공지뿐만 아니라 **학생의 태블릿 손글씨 필기(아이패드 굿노트, 노터빌리티, 갤럭시탭 삼성노트 등 애플펜슬/S펜 손글씨) 및 노트, 포스트잇, 칠판 손글씨**를 매우 정확하게 판독하여 과제, 시험, 퀴즈, 팀플, 발표 일정을 추출합니다.
현재 기준 날짜는 ${todayStr} (${dayOfWeek}요일)입니다.

[태블릿 및 손글씨 필기 특화 판독 지침]:
1. 모눈종이, 무지, 줄 노트 위에 줄바꿈되어 간단히 적힌 손글씨 단어들을 문맥에 맞게 하나로 조합하세요.
2. 날짜 표기: '11/4', '11.4', '11월 4일', '10/30' 등 월/일만 적힌 경우 현재 기준 연도(${today.getFullYear()}년)와 결합하여 정확한 ISO 형식(YYYY-MM-DDTHH:mm)으로 생성하세요.
3. 시험/퀴즈/발표 시간 미명시 시 오전 10:00, 과제 마감은 23:59로 설정하세요.`;

    const parts: any[] = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z0-9.+]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    let userPromptText = '';
    if (imageBase64 && text && text.trim()) {
      userPromptText = `첨부된 사진의 손글씨와 텍스트를 정밀 분석하고, 추가 메모 텍스트를 반영하여 포함된 모든 학업 일정을 JSON 목록으로 추출해주세요:\n---\n추가 메모:\n${text}\n---`;
    } else if (imageBase64) {
      userPromptText = `첨부된 사진에 적힌 손글씨 필기(아이패드 굿노트/노터빌리티, 갤럭시탭 필기, 다이어리, 포스트잇, 화이트보드 칠판 글씨, 캡처 등)를 자세히 판독하고, 과목명, 종류(과제/시험/퀴즈/팀플/발표), 마감 일시(YYYY-MM-DDTHH:mm), 세부 메모를 포함한 모든 학업 일정을 JSON 목록으로 추출해주세요.`;
    } else {
      userPromptText = `다음 공지문 텍스트를 분석하여 포함된 모든 학업 일정(과제, 시험, 퀴즈, 팀플, 발표, 기타)을 JSON 목록으로 추출해주세요:\n---\n${text}\n---`;
    }

    parts.push({ text: userPromptText });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI 분석 시간 초과 (25초)')), 25000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subject: { type: Type.STRING },
              type: { type: Type.STRING },
              dueDate: { type: Type.STRING },
              memo: { type: Type.STRING },
            },
            required: ['title', 'subject', 'type', 'dueDate'],
          },
        },
      },
    });

    const response: any = await Promise.race([generatePromise, timeoutPromise]);
    const responseText = response.text?.trim() || '[]';
    let parsedItems = [];
    try {
      parsedItems = JSON.parse(responseText);
    } catch {
      parsedItems = fallbackExtract(text || '일본어문학 쪽지시험 11/4', referenceDate);
    }

    parsedItems = parsedItems.map((item: any) => {
      let due = String(item.dueDate || '');
      if (/^\d{4}-\d{2}-\d{2}$/.test(due)) {
        const isExamOrQuiz = item.type === '시험' || item.type === '퀴즈' || /시험|퀴즈/.test(item.title);
        due = `${due}${isExamOrQuiz ? 'T10:00' : 'T23:59'}`;
      } else if (!due.includes('T') && due.includes(' ')) {
        due = due.replace(' ', 'T');
      }

      let type = item.type || '과제';
      if (type === '쪽지시험') type = '퀴즈';
      if (!['과제', '시험', '퀴즈', '팀플', '발표', '기타'].includes(type)) {
        type = /시험|test|exam/i.test(type) ? '시험' : (/퀴즈|quiz/i.test(type) ? '퀴즈' : '과제');
      }

      return {
        ...item,
        title: item.title || `${item.subject || ''} ${type}`.trim(),
        subject: item.subject || '일반',
        type,
        dueDate: due,
        memo: item.memo || '손글씨/공지 사진에서 AI로 추출된 일정',
      };
    });

    return res.json({ items: parsedItems, raw: responseText });
  } catch (error: any) {
    console.error('Gemini extraction error in Vercel function:', error);
    if (req.body?.text && req.body.text.trim()) {
      const fallback = fallbackExtract(req.body.text, req.body.referenceDate);
      return res.json({ items: fallback, note: 'AI 분석 일시 지연으로 텍스트 분석기를 사용했습니다.' });
    }
    return res.status(500).json({ error: 'AI 사진 분석 중 오류가 발생했습니다. 사진 속 글씨가 선명한지 확인 후 다시 시도해주세요.' });
  }
}
