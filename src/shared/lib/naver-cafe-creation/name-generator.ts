/**
 * 카페 이름 자동 추천 — 배틀넷 랜덤 배틀태그 방식(형용사+명사 조합 + 임의 숫자 태그)을
 * 카페 이름/주소 생성에 그대로 적용한 것. 이 파일도 presets.ts처럼 순수 데이터/로직만
 * 있어서 client component에서 바로 import해도 된다 — Playwright 등 Node 전용 코드를
 * 절대 추가하지 말 것 (naver-cafe-creation/index.ts를 통째로 import하면 안 되는 이유는
 * presets.ts 상단 주석 참고).
 *
 * 이름 쪽은 "카테고리 + 개념어" 2어절 한글 조합(기존 카페들과 같은 톤: 건강 체크노트,
 * 생활 살림노트 등), 주소 쪽은 그 개념어에 대응하는 영단어 + 배틀넷 태그 스타일의
 * 임의 3~4자리 숫자로 만든다. 실제 사용 가능 여부(이름 중복·주소 중복)는 네이버 폼에서
 * 최종 확인해야 한다 — 이 함수는 "그럴듯한 후보"를 뽑아줄 뿐 중복까지 보장하지 않는다.
 */

const ADJECTIVES: string[] = [
  '포근한', '다정한', '산뜻한', '느긋한', '알찬', '정겨운', '소소한', '담백한',
  '차분한', '활기찬', '든든한', '살가운', '조용한', '말랑한', '촉촉한', '단단한',
];

// [한글 명사, 대응 영단어] 쌍 — 이름은 한글, 주소는 영단어+숫자로 짝을 맞춘다
const NOUN_PAIRS: Array<[string, string]> = [
  ['노트', 'note'],
  ['수첩', 'diary'],
  ['마당', 'plaza'],
  ['이야기', 'story'],
  ['사랑방', 'haven'],
  ['정거장', 'stop'],
  ['놀이터', 'playground'],
  ['다락방', 'attic'],
  ['서랍', 'drawer'],
  ['창고', 'storage'],
  ['우체통', 'postbox'],
  ['쉼터', 'rest'],
  ['둥지', 'nest'],
  ['골목', 'alley'],
];

export interface CafeNameSuggestion {
  name: string;
  slug: string;
}

const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomTag = (): string => String(Math.floor(1000 + Math.random() * 9000)); // 배틀넷 태그처럼 4자리

/**
 * 카페 이름/주소 후보를 count개 생성한다. category를 주면 이름 앞에 그대로 붙인다
 * (예: category="건강" → "건강 포근한노트"). 같은 (형용사,명사) 조합이 중복되지 않게
 * 최대한 피하되, 조합 수보다 count가 크면 중복이 섞일 수 있다.
 */
export const generateCafeNameSuggestions = (
  category?: string,
  count = 5,
): CafeNameSuggestion[] => {
  const suggestions: CafeNameSuggestion[] = [];
  const usedCombos = new Set<string>();
  const maxAttempts = count * 8;

  for (let attempt = 0; attempt < maxAttempts && suggestions.length < count; attempt += 1) {
    const adjective = pickRandom(ADJECTIVES);
    const [noun, nounEn] = pickRandom(NOUN_PAIRS);
    const comboKey = `${adjective}-${noun}`;
    if (usedCombos.has(comboKey)) continue;
    usedCombos.add(comboKey);

    const prefix = category?.trim() ? `${category.trim()} ` : '';
    const name = `${prefix}${adjective}${noun}`;
    const slug = `${nounEn}${randomTag()}`;

    suggestions.push({ name, slug });
  }

  return suggestions;
};
