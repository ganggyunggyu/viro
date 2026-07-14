import { Cafe, WorkCafeArticle } from '@/shared/models';

export interface ParsedCafeArticleUrl {
  cafeSlug: string;
  cafeId?: string;
  articleId: number;
}

const DESKTOP_PATTERN = /cafe\.naver\.com\/ca-fe\/cafes\/(\d+)\/articles\/(\d+)/;
const MOBILE_PATTERN = /cafe\.naver\.com\/ca-fe\/web\/cafes\/([a-zA-Z0-9_-]+)\/articles\/(\d+)/;
// naver.me 단축링크가 리다이렉트되는 실제 형태: m.cafe.naver.com/{slug}/{articleId}?art=... (/ca-fe/, articles/ 접두어 없음)
const M_CAFE_PATTERN = /m\.cafe\.naver\.com\/([a-zA-Z0-9_-]+)\/(\d+)(?:[/?]|$)/;
// PC 카페 대문에서 흔한 축약형: cafe.naver.com/{slug}/{articleId} (ca-fe, articles/ 접두어 없음)
const CAFE_ARTICLE_PATH_PATTERN = /cafe\.naver\.com\/(?!ca-fe\/)([a-zA-Z0-9_-]+)\/(\d+)(?:[/?]|$)/;
const LEGACY_SLUG_PATTERN = /cafe\.naver\.com\/([a-zA-Z0-9_-]+)(?:[/?]|$)/;
const NAVER_ME_PATTERN = /naver\.me\/[a-zA-Z0-9]+/i;

// naver.me 단축링크를 실제 카페 글 URL로 해석한다. Node fetch는 redirect:'manual'일 때
// Location 헤더를 읽을 수 없으므로(WHATWG spec, opaqueredirect) redirect:'follow' + response.url을 사용해야 한다.
const resolveShortLink = async (rawUrl: string): Promise<string> => {
  if (!NAVER_ME_PATTERN.test(rawUrl)) return rawUrl;

  try {
    const res = await fetch(rawUrl, { method: 'HEAD', redirect: 'follow' });
    if (res.url) return res.url;
  } catch {}

  try {
    const res = await fetch(rawUrl, { method: 'GET', redirect: 'follow' });
    if (res.url) return res.url;
  } catch {}

  return rawUrl;
};

export const parseCafeArticleUrlShape = (rawUrl: string): { cafeSlug?: string; cafeId?: string; articleId: number } | null => {
  const url = rawUrl.trim();

  const desktopMatch = url.match(DESKTOP_PATTERN);
  if (desktopMatch) {
    return { cafeId: desktopMatch[1], articleId: Number(desktopMatch[2]) };
  }

  const mobileMatch = url.match(MOBILE_PATTERN);
  if (mobileMatch) {
    return { cafeSlug: mobileMatch[1], articleId: Number(mobileMatch[2]) };
  }

  const mCafeMatch = url.match(M_CAFE_PATTERN);
  if (mCafeMatch) {
    return { cafeSlug: mCafeMatch[1], articleId: Number(mCafeMatch[2]) };
  }

  const cafeArticlePathMatch = url.match(CAFE_ARTICLE_PATH_PATTERN);
  if (cafeArticlePathMatch) {
    return { cafeSlug: cafeArticlePathMatch[1], articleId: Number(cafeArticlePathMatch[2]) };
  }

  const legacySlugMatch = url.match(LEGACY_SLUG_PATTERN);
  const articleIdMatch = url.match(/articleid=(\d+)/i) || url.match(/articles\/(\d+)/);
  if (legacySlugMatch && articleIdMatch) {
    return { cafeSlug: legacySlugMatch[1], articleId: Number(articleIdMatch[1]) };
  }

  return null;
};

export const resolveCafeId = async (userId: string, cafeSlug: string): Promise<string | null> => {
  const fromCafeConfig = await Cafe.findOne({ userId, cafeUrl: { $regex: cafeSlug, $options: 'i' } })
    .select('cafeId')
    .lean<{ cafeId: string } | null>();
  if (fromCafeConfig?.cafeId) return fromCafeConfig.cafeId;

  const fromWorkCafe = await WorkCafeArticle.findOne({ cafeSlug })
    .select('cafeId')
    .lean<{ cafeId: string } | null>();
  if (fromWorkCafe?.cafeId) return fromWorkCafe.cafeId;

  return null;
};

export const parseCafeArticleUrl = async (
  userId: string,
  rawUrl: string,
): Promise<{ success: true; result: ParsedCafeArticleUrl } | { success: false; error: string }> => {
  const resolvedUrl = await resolveShortLink(rawUrl.trim());
  const shape = parseCafeArticleUrlShape(resolvedUrl);
  if (!shape) {
    return { success: false, error: '카페 글 URL 형식을 인식하지 못했습니다 (cafe.naver.com 링크인지 확인해주세요)' };
  }

  if (shape.cafeId) {
    return { success: true, result: { cafeSlug: shape.cafeSlug || shape.cafeId, cafeId: shape.cafeId, articleId: shape.articleId } };
  }

  if (!shape.cafeSlug) {
    return { success: false, error: '카페 슬러그를 URL에서 찾지 못했습니다' };
  }

  const cafeId = await resolveCafeId(userId, shape.cafeSlug);
  if (!cafeId) {
    return {
      success: false,
      error: `카페 ID를 찾지 못했습니다 (슬러그: ${shape.cafeSlug}). 카페 관리에 먼저 등록되어 있어야 합니다`,
    };
  }

  return { success: true, result: { cafeSlug: shape.cafeSlug, cafeId, articleId: shape.articleId } };
};
