/**
 * 카페 개설 카테고리 프리셋 — 순수 데이터만 있는 파일.
 *
 * 이 파일은 UI(client component)에서도 바로 import 하므로 Playwright/멀티세션 등
 * Node 전용 코드를 절대 import 하면 안 된다. `index.ts` 는 multi-session.ts(playwright-core)를
 * 물고 있어서 client component가 그쪽에서 프리셋을 가져오면 Next 빌드가
 * "playwright-core를 브라우저 번들에 넣으려 한다"고 깨진다 — 실제로 겪은 버그.
 *
 * 대분류→소분류는 대분류를 먼저 골라야 소분류 목록이 열려서 전체 조합을 미리
 * 긁어올 수 없다. 실제로 써본(2026-07) 조합만 프리셋으로 고정해둠 — 새 카테고리가
 * 필요하면 카페 만들기 폼에서 직접 열어서 정확한 문구를 확인하고 여기에 추가할 것.
 */
export interface CafeTopicPreset {
  key: string;
  /** 시트 "카페정보 및 링크" 카테고리 칸에 들어갈 짧은 표시 라벨 */
  sheetCategory: string;
  categoryMajor: string;
  categoryMinor: string;
  label: string;
}

export const CAFE_TOPIC_PRESETS: CafeTopicPreset[] = [
  {
    key: 'health-care',
    sheetCategory: '건강',
    categoryMajor: '건강/다이어트',
    categoryMinor: '건강관리/건강식품',
    label: '건강 - 건강관리/건강식품',
  },
  {
    key: 'health-general',
    sheetCategory: '건강',
    categoryMajor: '건강/다이어트',
    categoryMinor: '건강/다이어트일반',
    label: '건강 - 건강/다이어트일반',
  },
  {
    key: 'living-house',
    sheetCategory: '생활',
    categoryMajor: '생활',
    categoryMinor: '주거살림',
    label: '생활 - 주거살림',
  },
  {
    key: 'living-info',
    sheetCategory: '생활',
    categoryMajor: '생활',
    categoryMinor: '생활정보',
    label: '생활 - 생활정보',
  },
  {
    key: 'daily-social',
    sheetCategory: '일상',
    categoryMajor: '친목/모임',
    categoryMinor: '친목/모임일반',
    label: '일상 - 친목/모임일반',
  },
  {
    key: 'family-parenting',
    sheetCategory: '육아',
    categoryMajor: '가족/육아',
    categoryMinor: '가족/육아일반',
    label: '육아 - 가족/육아일반',
  },
];
