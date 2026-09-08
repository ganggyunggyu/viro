export const OPERATIONS = {
  output: '게시글 ID와 작업 상태',
  outputDetail: '처리 중인 작업, 게시가 확인된 결과, 확인이 더 필요한 작업을 나누어 확인합니다.',
  stepList: [
    { title: '대상과 원고 준비', detail: '사용할 계정과 카페를 정하고 다붓으로 원고를 생성합니다.' },
    { title: '작업 접수', detail: '작업을 대기열에 등록하고 처리 상태를 확인합니다.' },
    { title: '브라우저에서 게시', detail: '연결된 워커가 본문을 입력하고 게시를 진행합니다.' },
    { title: '결과 확인', detail: '게시글 ID를 확인하고 설정된 후속 댓글로 이어갑니다.' },
  ],
  ply: 'Ply에서 계정과 카페를 관리하고 워커 작업을 요청할 수 있습니다. 반환된 작업 ID로 상태를 다시 조회하며, 상세 관리는 바이로 화면에서 이어갑니다.',
  boundary: '작업 실행에는 로그인된 계정과 연결된 워커가 필요합니다. 작업 접수만으로 게시가 완료된 것은 아니며, 추가 인증이 필요한 경우 사용자 확인을 거칩니다.',
  sourceUrl: 'https://github.com/ganggyunggyu/viro', sourceLabel: '바이로 구현 보기',
};
