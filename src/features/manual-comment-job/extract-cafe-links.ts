/**
 * 붙여넣은 아무 텍스트에서 네이버 카페 글 링크만 골라낸다.
 * 카톡/시트/메모에서 통째로 복사해 넣어도 링크만 추려서 한 번에 작업을 걸 수 있게 하는 게 목적이라,
 * 프로토콜 생략(cafe.naver.com/...)과 문장부호가 붙은 링크까지 받아준다.
 */
const CAFE_LINK_PATTERN = /(?:https?:\/\/)?(?:m\.)?(?:cafe\.naver\.com|naver\.me)\/[^\s<>"']+/gi;
const TRAILING_NOISE_PATTERN = /[.,;:)\]}>"'」』]+$/;

const normalizeLink = (rawLink: string): string => {
  const trimmed = rawLink.replace(TRAILING_NOISE_PATTERN, '');
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export const extractCafeLinks = (rawText: string): string[] => {
  const matches = rawText.match(CAFE_LINK_PATTERN) || [];

  const seen = new Set<string>();
  const links: string[] = [];
  for (const match of matches) {
    const link = normalizeLink(match);
    if (seen.has(link)) continue;
    seen.add(link);
    links.push(link);
  }

  return links;
};
