export const DESKTOP_FEATURES = [
  { id: 'home', label: '홈', localExecution: false },
  { id: 'publish', label: '자동 글 발행', localExecution: true },
  { id: 'manuscript', label: '원고 발행·수정', localExecution: true },
  { id: 'comments', label: '댓글 작업', localExecution: true },
  { id: 'exposure', label: '노출 확인', localExecution: true },
  { id: 'accounts', label: '계정 점검', localExecution: true },
  { id: 'cafes', label: '카페 관리', localExecution: true },
  { id: 'rewrite', label: '글 재작성', localExecution: true },
  { id: 'logs', label: '실행 로그', localExecution: false },
  { id: 'settings', label: '연결 설정', localExecution: false },
] as const;

export type DesktopFeatureId = typeof DESKTOP_FEATURES[number]['id'];
