// article-modifier.ts에서 오늘 잡은 버그들의 판정 로직을 순수 함수로 뽑아둔 모듈.
// Playwright I/O와 섞여 있으면 회귀를 테스트로 못 박을 수 없어서 분리했다.

export const SMART_EDITOR_PLACEHOLDER_TEXT = '내용을 입력하세요.';

const ZERO_WIDTH_CHARS = /[​-‍﻿]/g;

// SmartEditor 빈 문단은 textContent 자체가 플레이스홀더 문구로 채워져 있다.
// 이걸 실제 잔존 텍스트로 오인하면 지울 게 없는 문단을 계속 지우려 든다.
export const isRealParagraphText = (
  text: string | null | undefined,
  placeholder: string = SMART_EDITOR_PLACEHOLDER_TEXT
): boolean => {
  const trimmed = text?.trim();
  return Boolean(trimmed) && trimmed !== placeholder;
};

// 제출(수정완료) 버튼 클릭 후 리다이렉트 완료 여부 판정.
// 시작 URL 자체가 이미 articles/\d+/modify 형태라 /articles\/\d+/ 만으로는
// 리다이렉트 여부와 무관하게 항상 true가 되어버린다 — /modify가 아닌 진짜
// 상세 페이지로 옮겨갔는지까지 확인해야 한다.
export const isModifyRedirectComplete = (urlHref: string): boolean =>
  /articles\/\d+/.test(urlHref) && !urlHref.includes('/modify');

// 타이핑된 본문이 원본 대비 비정상적으로 짧은지 판정 (커서가 엉뚱한 곳에
// 꽂혀 타이핑이 유실됐을 때 제출 전에 걸러내기 위한 안전장치).
// threshold는 "이 비율 이상이면 안전"의 기준값 — 정확히 threshold일 때는
// 통과(안전)로 취급한다.
export const isTypedContentTooShort = (
  editorText: string,
  plainContent: string,
  threshold = 0.5
): boolean => {
  const editorLength = editorText
    .replace(ZERO_WIDTH_CHARS, '')
    .replace(new RegExp(SMART_EDITOR_PLACEHOLDER_TEXT.replace('.', '\\.'), 'g'), '')
    .trim().length;
  const expectedLength = plainContent.replace(/\s+/g, '').length;
  return editorLength < expectedLength * threshold;
};

// HTML 태그가 섞인 원고를 SmartEditor에 타이핑할 plain text로 변환.
export const convertHtmlContentToPlainText = (html: string): string =>
  html
    .replace(/<\/p>\s*<p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .trim();
