import type { CSSProperties } from 'react';
import { cn } from '@/shared';

const ACCOUNT_LIST = ['계정 A', '계정 B', '계정 C'];
const STAGE_LABELS = ['계정 연결', '순서대로 실행', '결과 확인'];
const STAGE_SUMMARIES = [
  '세션은 분리하고 작업은 한곳에서.',
  '앞 작업의 결과에 맞춰 이어갑니다.',
  '완료와 확인이 필요한 작업을 구분합니다.',
];

interface QueueSceneProps { activeStage: number }

export const QueueScene = ({ activeStage }: QueueSceneProps) => (
  <div className={cn('queue-scene')}>
    <div className={cn('queue-overview')}><span>카페 발행 워크스페이스</span><b>{STAGE_LABELS[activeStage]}</b></div>
    {ACCOUNT_LIST.map((account, index) => (
      <div key={account} className={cn('queue-lane')} style={{ '--lane': index } as CSSProperties}>
        <div className={cn('queue-account')}>
          <span>{String.fromCharCode(65 + index)}</span><b>{account}</b><small>독립 세션</small>
        </div>
        <div className={cn('queue-track')}>
          <span className={cn('queue-task', activeStage > 0 && 'filled')}>
            {activeStage === 0 ? '카페 선택' : activeStage === 1
              ? (index === 0 ? '본문 발행' : '댓글 작성') : (index === 2 ? '확인 필요' : '처리 완료')}
          </span>
          <i aria-hidden="true" />
          <span className={cn('queue-task')}>
            {activeStage === 0 ? '게시판 연결' : activeStage === 1
              ? (index === 0 ? '댓글 대기' : '대댓글 대기') : (index === 2 ? '세션 확인' : '게시 결과 확인')}
          </span>
        </div>
      </div>
    ))}
    <div className={cn('queue-summary')}>
      <span className={cn('brand-dot')} aria-hidden="true" /><span>{STAGE_SUMMARIES[activeStage]}</span>
    </div>
  </div>
);
