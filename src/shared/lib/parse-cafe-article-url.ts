import { Cafe, WorkCafeArticle } from '@/shared/models';

export interface ParsedCafeArticleUrl {
  cafeSlug: string;
  cafeId?: string;
  articleId: number;
}

const DESKTOP_PATTERN = /cafe\.naver\.com\/ca-fe\/cafes\/(\d+)\/articles\/(\d+)/;
const MOBILE_PATTERN = /cafe\.naver\.com\/ca-fe\/web\/cafes\/([a-zA-Z0-9_-]+)\/articles\/(\d+)/;
const LEGACY_SLUG_PATTERN = /cafe\.naver\.com\/([a-zA-Z0-9_-]+)(?:[/?]|$)/;

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
  const shape = parseCafeArticleUrlShape(rawUrl);
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
