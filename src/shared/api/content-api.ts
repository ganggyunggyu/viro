import { GoogleGenAI } from '@google/genai';
import type {
  GenerateContentRequest,
  GenerateContentResponse,
  TeteContentRequest,
  TeteContentResponse,
} from '@/shared/types';

const CONTENT_API_URL = process.env.CONTENT_API_URL || process.env.TEXT_GEN_HUB_URL || 'http://localhost:8000';
const DIRECT_TETE_MODEL = 'gemini-3.1-pro-preview';

const normalizeText = (value: string): string =>
  value.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const getGeminiApiKey = (): string => {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing');
  }

  return apiKey;
};

export const isLocalContentApiUrl = (value: string): boolean =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(value.trim());

export const shouldUseDirectContentFallback = (
  error: unknown,
  apiUrl: string = CONTENT_API_URL,
): boolean => {
  const message = getErrorMessage(error);

  if (isLocalContentApiUrl(apiUrl)) {
    return true;
  }

  return [
    'fetch failed',
    'ECONNREFUSED',
    'ENOTFOUND',
    'EHOSTUNREACH',
    'ETIMEDOUT',
    'localhost:8000',
    '127.0.0.1:8000',
  ].some((token) => message.includes(token));
};

export const resolveWithDirectContentFallback = async <T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  apiUrl: string = CONTENT_API_URL,
): Promise<T> => {
  try {
    return await primary();
  } catch (error) {
    if (!shouldUseDirectContentFallback(error, apiUrl)) {
      throw error;
    }

    console.warn('[CONTENT API] direct fallback activated:', getErrorMessage(error));
    return fallback();
  }
};

export const isTeteRouteUnavailable = (error: unknown): boolean => {
  const message = getErrorMessage(error);
  return /테테 원고 생성 실패(?:\(service=.*\))?: (404|405)\b/.test(message);
};

const buildDirectTetePrompt = ({
  service,
  keyword,
  ref,
  contentType,
}: {
  service: string;
  keyword: string;
  ref?: string;
  contentType?: '정보성' | '후기성' | '';
}): string => {
  const styleLabel = contentType === '후기성' ? '후기성' : '정보성';

  return normalizeText(`
너는 네이버 카페에 올릴 한국어 게시글 초안을 작성한다.
출력 형식은 반드시 다음과 같다.
1) 첫 줄: 제목 한 줄
2) 둘째 줄부터: 본문 4~6개 단락

공통 규칙:
- 제목은 18~34자, 과장 없이 자연스럽게 작성
- 본문은 각 단락 2~4문장
- 광고 문구, 구매 유도, 연락 유도, 과장, 허위 체험담 금지
- 검색 키워드를 억지로 반복하지 말고 자연스럽게 녹인다
- HTML, 불릿, 번호 목록, 해시태그, 이모지 사용 금지
- 의학/법률/세무처럼 민감한 주제는 단정하지 말고 확인이 필요하다는 표현을 포함

이번 글 조건:
- 서비스 분류: ${service}
- 키워드: ${keyword}
- 글 성격: ${styleLabel}
${ref ? `- 참고 메모: ${ref}` : '- 참고 메모: 없음'}

문체 규칙:
- 카페 글처럼 부드럽고 담백한 존댓말
- 후기성이어도 실제 본인 치료·구매 경험을 단정해서 꾸미지 말 것
- 정보성 글이면 핵심 포인트, 확인할 점, 정리 문장으로 마무리

지금 바로 최종 원고만 출력한다.
  `);
};

const generateDirectTeteContent = async ({
  service,
  keyword,
  ref,
  contentType,
}: {
  service: string;
  keyword: string;
  ref?: string;
  contentType?: '정보성' | '후기성' | '';
}): Promise<TeteContentResponse> => {
  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  const response = await ai.models.generateContent({
    model: DIRECT_TETE_MODEL,
    contents: buildDirectTetePrompt({ service, keyword, ref, contentType }),
  });
  const content = normalizeText(response.text ?? '');

  if (!content) {
    throw new Error('Gemini direct fallback returned empty content');
  }

  return {
    _id: `direct-${Date.now()}`,
    content,
    createdAt: new Date().toISOString(),
    engine: DIRECT_TETE_MODEL,
    service,
    category: service,
    keyword,
    contentType: contentType === '후기성' ? '후기성' : '정보성',
  };
};

const generateCafeTotalTeteContent = async ({
  service,
  keyword,
  ref,
  contentType,
}: {
  service: string;
  keyword: string;
  ref?: string;
  contentType?: '정보성' | '후기성' | '';
}): Promise<TeteContentResponse> => {
  const fallbackKeyword = service === 'tete' ? keyword : `${keyword}:${service}`;
  const response = await fetch(`${CONTENT_API_URL}/generate/cafe-total`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      keyword: fallbackKeyword,
      ref: ref || '',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[CAFE TOTAL API] 에러 응답:', response.status, errorBody);
    throw new Error(`카페 원고 생성 실패: ${response.status} - ${errorBody}`);
  }

  const data = await response.json() as { content?: unknown; model?: unknown };
  const content = typeof data.content === 'string' ? normalizeText(data.content) : '';
  if (!content) {
    throw new Error('카페 원고 생성 실패: 빈 원고가 반환됐습니다');
  }

  return {
    _id: `cafe-total-${Date.now()}`,
    content,
    createdAt: new Date().toISOString(),
    engine: typeof data.model === 'string' ? data.model : 'cafe-total',
    service,
    category: service,
    keyword,
    contentType: contentType === '후기성' ? '후기성' : '정보성',
  };
};

export const generateContent = async (
  request: GenerateContentRequest
): Promise<GenerateContentResponse> => {
  const response = await fetch(
    `${CONTENT_API_URL}/generate/gemini-cafe-daily`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service: request.service,
        keyword: request.keyword,
        ref: request.ref || '',
        persona_id: request.personaId ?? null,
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[CONTENT API] 에러 응답:', response.status, errorBody);
    throw new Error(
      `Content generation failed: ${response.status} - ${errorBody}`
    );
  }

  return response.json();
};

/**
 * 테테 — 범용 naver-blog-writing 스킬 원고 생성 (대표님 업로드 지침, 브랜드 고정 없음).
 * hanryeo-skill과 달리 특정 제품을 강제하지 않아 임의 키워드에 씀. STEP0(정보성/후기성)은
 * contentType을 안 넘기면 서버가 키워드로 자동 판정한다.
 */
export const generateTeteContent = async (
  request: TeteContentRequest
): Promise<TeteContentResponse> => {
  const response = await fetch(`${CONTENT_API_URL}/generate/tete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service: 'tete',
      keyword: request.keyword,
      ref: request.ref || '',
      content_type: request.contentType || '',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[TETE API] 에러 응답:', response.status, errorBody);
    throw new Error(`테테 원고 생성 실패: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  return { ...data, contentType: data.contentType };
};

export const generateTeteContentWithFallback = async (
  request: TeteContentRequest,
): Promise<TeteContentResponse> => {
  const directFallback = () => generateDirectTeteContent({
      service: 'tete',
      keyword: request.keyword,
      ref: request.ref,
      contentType: request.contentType,
    });

  try {
    return await generateTeteContent(request);
  } catch (error) {
    if (isTeteRouteUnavailable(error)) {
      console.warn('[CONTENT API] /generate/tete 없음, /generate/cafe-total 사용');
      return resolveWithDirectContentFallback(
        () => generateCafeTotalTeteContent({
          service: 'tete',
          keyword: request.keyword,
          ref: request.ref,
          contentType: request.contentType,
        }),
        directFallback,
      );
    }

    return resolveWithDirectContentFallback(
      () => Promise.reject(error),
      directFallback,
    );
  }
};

interface TeteContentByServiceRequest {
  service: string;
  keyword: string;
  ref?: string;
}

interface TeteContentByServiceResponse {
  content: string;
  contentType?: string;
}

/**
 * 카페 실제 카테고리(service)를 그대로 백엔드에 전달하는 테테 생성 — generateTeteContent와 달리
 * service를 'tete'로 고정하지 않고 호출부에서 지정한 카페 카테고리(육아/건강/생활/일상 등)를 그대로
 * 보낸다. scripts/rewrite-with-tete.ts의 generateTete()와 동일한 계약(카페 글 재작성 기능 전용).
 */
export const generateTeteContentByService = async (
  request: TeteContentByServiceRequest
): Promise<TeteContentByServiceResponse> => {
  const response = await fetch(`${CONTENT_API_URL}/generate/tete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service: request.service,
      keyword: request.keyword,
      ref: request.ref || '',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[TETE API] 에러 응답:', response.status, errorBody);
    throw new Error(`테테 원고 생성 실패(service=${request.service}): ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  return { content: data.content, contentType: data.contentType };
};

export const generateTeteContentByServiceWithFallback = async (
  request: TeteContentByServiceRequest,
): Promise<TeteContentByServiceResponse> => {
  const directFallback = async (): Promise<TeteContentByServiceResponse> => {
      const direct = await generateDirectTeteContent({
        service: request.service,
        keyword: request.keyword,
        ref: request.ref,
      });
      return { content: direct.content, contentType: direct.contentType };
    };

  try {
    return await generateTeteContentByService(request);
  } catch (error) {
    if (isTeteRouteUnavailable(error)) {
      console.warn('[CONTENT API] /generate/tete 없음, /generate/cafe-total 사용');
      return resolveWithDirectContentFallback(
        async () => {
          const fallback = await generateCafeTotalTeteContent({
            service: request.service,
            keyword: request.keyword,
            ref: request.ref,
          });
          return { content: fallback.content, contentType: fallback.contentType };
        },
        directFallback,
      );
    }

    return resolveWithDirectContentFallback(
      () => Promise.reject(error),
      directFallback,
    );
  }
};

interface GenerateContentWithPromptRequest {
  prompt: string;
  model?: string;
}

interface GenerateContentWithPromptResponse {
  success?: boolean;
  content?: string;
  model?: string;
  elapsed?: number;
}

export const generateContentWithPrompt = async (
  request: GenerateContentWithPromptRequest
): Promise<GenerateContentWithPromptResponse> => {
  const response = await fetch(`${CONTENT_API_URL}/generate/test/cafe-daily`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: request.prompt,
      model: request.model,
    }),
  });

  if (!response.ok) {
    throw new Error(`Prompted content generation failed: ${response.status}`);
  }

  return response.json();
};

interface ViralContentRequest {
  prompt: string;
  ref?: string;
  model?: string;
}

interface ViralContentResponse {
  content: string;
  keyword?: string;
  model?: string;
  char_count?: number;
  elapsed?: number;
}

export const generateViralContent = async (
  request: ViralContentRequest
): Promise<ViralContentResponse> => {
  const response = await fetch(
    `${CONTENT_API_URL}/generate/cafe-total`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyword: request.prompt,
        ref: request.ref || '',
        model: request.model,
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[VIRAL API] 에러 응답:', response.status, errorBody);
    throw new Error(
      `Viral content generation failed: ${response.status} - ${errorBody}`
    );
  }

  return response.json();
};

// 이미지 생성 API
interface ImageGenerateRequest {
  keyword: string;
  category?: string;
  count?: number;
}

interface ImageGenerateResponse {
  success: boolean;
  images?: string[]; // Base64 또는 URL 배열
  error?: string;
}

// URL에서 이미지를 다운로드하여 base64로 변환
const downloadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('[IMAGE API] 이미지 다운로드 실패:', url, response.status);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    // MIME 타입 추정 (URL 확장자 기반)
    const ext = url.split('.').pop()?.toLowerCase() || 'png';
    const mimeType =
      ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('[IMAGE API] 이미지 다운로드 오류:', url, error);
    return null;
  }
};

export const generateImages = async (
  request: ImageGenerateRequest
): Promise<ImageGenerateResponse> => {
  try {
    const response = await fetch(`${CONTENT_API_URL}/generate/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyword: request.keyword,
        category: request.category || '',
        count: request.count || 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[IMAGE API] 이미지 생성 실패:', response.status, errorText);
      return { success: false, error: `이미지 생성 실패: ${response.status}` };
    }

    const data = await response.json();
    const rawImages = data.images || [];

    // URL만 추출 (base64로 변환하지 않음 - Job 크기 제한 때문)
    const imageUrls: string[] = [];
    for (const img of rawImages) {
      if (typeof img === 'object' && img !== null && 'url' in img) {
        imageUrls.push((img as { url: string }).url);
        console.log(`[IMAGE API] 이미지 URL: ${(img as { url: string }).url}`);
      } else if (typeof img === 'string' && img.startsWith('http')) {
        imageUrls.push(img);
        console.log(`[IMAGE API] 이미지 URL: ${img}`);
      }
    }

    return {
      success: imageUrls.length > 0,
      images: imageUrls,
      error: imageUrls.length === 0 ? '이미지 URL 추출 실패' : undefined,
    };
  } catch (error) {
    console.error('[IMAGE API] 이미지 생성 네트워크 오류:', getErrorMessage(error));
    return { success: false, images: [], error: '이미지 생성 네트워크 오류' };
  }
};

// 이미지 URL을 다운로드하여 base64로 변환 (업로드 시점에 사용)
export { downloadImageAsBase64 };

// Google 검색 이미지 API는 google-image-api.ts로 분리됨
export { searchRandomImages } from './google-image-api';
