// scripts/rewrite-with-tete.ts의 KEYWORD_POOL/assignDiverseKeywords와 동일한 계약을 갖는 공유 모듈.
// 실제 캠페인 스케줄에서 쓰는 키워드 풀(88개)을 셔플해서 대상 전체(카페 무관)에 한 번씩
// 나눠주고, 풀이 모자라면 다시 셔플해서 이어붙인다 — 완전히 못 피하는 극소수 인접 중복만
// 남기고 나머지는 실제로 서로 다른 키워드로 생성되게 만든다.
export const REWRITE_KEYWORD_POOL: string[] = [
  '웨딩밴드브랜드', '결혼반지브랜드', '커플반지', '명품커플링', '프로포즈링',
  '랩다이아가격', '강아지 눈 영양제', '강아지 영양제', '강아지 관절 영양제', '선풍기',
  '인천웨딩홀', '쿼드쎄라 펜타', '에어컨청소업체', '시스템에어컨청소업체', '먹는 위고비',
  '위고비 알약', '베르가못', '마운자로 요요', '파운다요', '알파cd',
  'LDM 디바이스', '무지외반증 교정기', '거북목교정기', '족저근막염깔창', '올리브오일',
  '조문 답례품', '음식물처리기', '음식물분쇄기', 'sat학원', '아치깔창',
  '족저근막염 신발', '신발깔창', '깔창', '평발깔창', '푸룬주스',
  '장에좋은음식', '군대깔창', '군화깔창', '답례품', '랩다이아가드링',
  '다이아몬드시세', '다이아시세', '회사 답례품', '결혼 답례품', '삼척카페',
  '대구 가족사진', '두유제조기', '부평웨딩홀', '대구사진관', '천안내성발톱',
  '아산웨딩홀', '천안웨딩홀', '수원웨딩홀', '인천예식장', '광주웨딩홀',
  '부천웨딩홀', '일산웨딩홀', '아산카페', '신정호카페', '광주예식장',
  '의정부웨딩홀', '인천웨딩홀추천', '청소업체추천', '방역업체', '인천방역업체',
  '해충방역업체', '접이식카트', '장바구니캐리어', '울산위고비', '울산마운자로처방',
  '밀크씨슬', '부천pt', '드라이기', '헤어드라이기', '드라이기 추천',
  '미용실드라이기', '날개없는 선풍기', '다이아몬드가격', '다이아몬드1캐럿가격', '다이아1캐럿가격',
  '헤어에센스추천', '여성청바지', '헤어드라이어', '효성쥬얼리시티', '종로효성주얼리시티',
  '종로웨딩밴드', '종로반지', '종로금은장',
];

export interface KeywordAssignable {
  subject: string;
  keyword?: string;
}

const cleanWord = (word: string): string => word.replace(/[,.!?]/g, '');

export const extractKeywordFromSubject = (subject: string): string =>
  subject.split(/\s+/).slice(0, 3).map(cleanWord).join(' ');

const shuffle = <T,>(arr: T[]): T[] => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const assignDiverseKeywords = <T extends KeywordAssignable>(tasks: T[]): void => {
  let pool: string[] = [];
  const refill = (): void => {
    pool = shuffle(REWRITE_KEYWORD_POOL);
  };
  refill();

  let lastUsed = '';
  for (const task of tasks) {
    if (pool.length === 0) refill();
    let idx = 0;
    if (pool[0] === lastUsed && pool.length > 1) idx = 1;
    const keyword = pool.splice(idx, 1)[0];
    task.keyword = keyword || extractKeywordFromSubject(task.subject);
    lastUsed = task.keyword;
  }
};
