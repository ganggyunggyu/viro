import * as cheerio from 'cheerio';

// 네이버 통합검색 결과 HTML에서 "카페" 콘텐츠 카드만 추출하는 파서.
// blog-cron-bot(src/parser, src/lib/naver-source, src/lib/cafe-exposure-check)의
// 검증된 셀렉터/추출 로직을 카페 노출체크 전용으로 이식한 버전.
// 네이버 검색 결과 DOM 구조가 바뀌면 이 셀렉터들이 가장 먼저 깨진다.

export interface NaverCafeSearchItem {
  title: string;
  link: string;
  cafeName: string;
  cafeId: string;
}

const NAVER_SEARCH_BASE_URL = 'https://search.naver.com/search.naver';

const SELECTORS = {
  singleIntentionList:
    '.fds-ugc-single-intention-item-list, .fds-ugc-single-intention-item-list-rra',
  intentionItem: '[data-template-id="ugcItem"]',
  intentionTitle:
    'a[data-heatmap-target=".link"], a[data-heatmap-target=".imgtitlelink"]',
  intentionHeadline: '.sds-comps-text-type-headline1',
  intentionProfile: '.sds-comps-profile-info-title-text a',

  snippetParagraphList: '.fds-ugc-snippet-paragraph-item-list',
  snippetItem: '[data-template-type="snippetParagraph"]',
  snippetTitle: 'a:has(.sds-comps-text-type-headline1)',
  snippetHeadline: '.sds-comps-text-type-headline1',
  snippetProfile: '.sds-comps-profile-info-title-text a',

  snippetImageList: '.fds-ugc-snippet-image-item-list',
  snippetImageItem: '[data-template-type="snippetImage"]',
  snippetImageTitle: 'a:has(.sds-comps-text-type-headline1)',
  snippetImageHeadline: '.sds-comps-text-type-headline1',
  snippetImageProfile: '.sds-comps-profile-info-title-text a',
} as const;

export const buildNaverSearchUrl = (keyword: string): string =>
  `${NAVER_SEARCH_BASE_URL}?where=nexearch&query=${encodeURIComponent(keyword)}`;

const decodeUrlSafe = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const normalizeCafeName = (value: string): string =>
  String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();

export const extractCafeIdFromUrl = (url: string): string => {
  const candidate = String(url ?? '').trim();
  if (!candidate) return '';

  try {
    const parsedUrl = new URL(candidate, 'https://cafe.naver.com');
    const cafeUrlParam =
      parsedUrl.searchParams.get('cafeUrl') || parsedUrl.searchParams.get('cafeurl');
    if (cafeUrlParam) return cafeUrlParam.toLowerCase();

    const pathSegments = parsedUrl.pathname.replace(/^\/+/, '').split('/');
    if (pathSegments.length >= 3 && pathSegments[0] === 'ca-fe' && pathSegments[1] === 'cafes') {
      return (pathSegments[2] || '').toLowerCase();
    }
    if (pathSegments[0] && pathSegments[0] !== 'ca-fe') {
      return pathSegments[0].toLowerCase();
    }
  } catch {
    // URL 파싱 실패 시 정규식 fallback으로 진행
  }

  const cafeUrlPatterns = [
    /(?:m\.)?cafe\.naver\.com\/ca-fe\/cafes\/([^/?&#]+)/i,
    /(?:m\.)?cafe\.naver\.com\/([^/?&#]+)/i,
    /\/cafes\/([^/?&#]+)/i,
  ];

  for (const pattern of cafeUrlPatterns) {
    const match = candidate.match(pattern);
    if (match?.[1]) return match[1].toLowerCase();
  }

  return '';
};

const isCafeLink = (url: string): boolean => /cafe\.naver\.com/i.test(url);
const isAdLink = (url: string): boolean => url.includes('ader.naver.com');

// 프로필 링크 텍스트에 "새 창 열림" 같은 접근성 전용 라벨이 딸려오는 경우가 있어 제거
const stripAccessibilityLabel = (text: string): string =>
  text.replace(/새\s*창\s*열림\s*$/u, '').trim();

const resolveSearchResultUrl = (href: string, fallbackUrl?: string): string => {
  const preferred = String(fallbackUrl ?? '').trim();
  if (preferred) return decodeUrlSafe(preferred);

  const candidate = String(href ?? '').trim();
  if (!candidate) return '';
  if (/^https?:\/\//i.test(candidate)) return candidate;

  try {
    const parsedUrl = new URL(candidate, 'https://search.naver.com');
    const encodedUrl =
      parsedUrl.searchParams.get('u') ||
      parsedUrl.searchParams.get('url') ||
      parsedUrl.searchParams.get('cru');
    if (encodedUrl) return decodeUrlSafe(encodedUrl);
    return parsedUrl.toString();
  } catch {
    return candidate;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getResolvedLink = ($el: cheerio.Cheerio<any>): string =>
  resolveSearchResultUrl($el.attr('href')?.trim() || '', $el.attr('cru')?.trim() || undefined);

interface SectionSelectors {
  list: string;
  item: string;
  titleLink: string;
  headline: string;
  profile: string;
}

const SECTIONS: SectionSelectors[] = [
  {
    list: SELECTORS.singleIntentionList,
    item: SELECTORS.intentionItem,
    titleLink: SELECTORS.intentionTitle,
    headline: SELECTORS.intentionHeadline,
    profile: SELECTORS.intentionProfile,
  },
  {
    list: SELECTORS.snippetParagraphList,
    item: SELECTORS.snippetItem,
    titleLink: SELECTORS.snippetTitle,
    headline: SELECTORS.snippetHeadline,
    profile: SELECTORS.snippetProfile,
  },
  {
    list: SELECTORS.snippetImageList,
    item: SELECTORS.snippetImageItem,
    titleLink: SELECTORS.snippetImageTitle,
    headline: SELECTORS.snippetImageHeadline,
    profile: SELECTORS.snippetImageProfile,
  },
];

const collectCafeItemsFromSection = (
  $: cheerio.CheerioAPI,
  section: SectionSelectors
): NaverCafeSearchItem[] => {
  const items: NaverCafeSearchItem[] = [];

  $(section.list).each((_, listEl) => {
    $(listEl)
      .find(section.item)
      .each((_, itemEl) => {
        const $item = $(itemEl);
        const $titleLink = $item.find(section.titleLink).first();
        const title = $item.find(section.headline).first().text().trim();
        const postHref = getResolvedLink($titleLink);

        const $profile = $item.find(section.profile).first();
        const profileHref = getResolvedLink($profile) || postHref;

        if (!postHref || !title || isAdLink(postHref)) return;
        if (!isCafeLink(profileHref) && !isCafeLink(postHref)) return;

        items.push({
          title,
          link: postHref,
          cafeName: stripAccessibilityLabel($profile.text().trim()),
          cafeId: extractCafeIdFromUrl(profileHref || postHref),
        });
      });
  });

  return items;
};

/** 네이버 통합검색 결과 HTML에서 카페 카드만 뽑아서 등장 순서대로 반환 (중복 링크 제거) */
export const parseCafeSearchItems = (html: string): NaverCafeSearchItem[] => {
  const $ = cheerio.load(html);
  const collected = SECTIONS.flatMap((section) => collectCafeItemsFromSection($, section));

  const unique = new Map<string, NaverCafeSearchItem>();
  for (const item of collected) {
    if (!unique.has(item.link)) unique.set(item.link, item);
  }

  return Array.from(unique.values());
};
