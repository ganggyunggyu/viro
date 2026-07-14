// 카페 DB의 categoryAliases는 카페마다 채워진 정도가 달라 신뢰할 수 없어서,
// 실제 소스인 카페 이름(cafe.name)에서 서비스 카테고리(육아/건강/생활/일상)를 추론한다.
// scripts/rewrite-with-tete.ts의 CAFES 배열이 카페별로 고정해둔 service 태그와 같은 값을 내도록
// 동일한 키워드 집합을 사용한다.
const SERVICE_KEYWORDS = ['육아', '건강', '생활', '일상'] as const;

export const inferCafeService = (cafeName: string): string => {
  for (const keyword of SERVICE_KEYWORDS) {
    if (cafeName.includes(keyword)) return keyword;
  }
  return '일반';
};
