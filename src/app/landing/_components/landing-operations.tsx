import { cn } from '@/shared';
import { OPERATIONS } from '@/app/landing/_content/operations';
import { LANDING_LINKS } from '@/app/landing/_content/links';

export const LandingOperations = () => (
  <section id="workflow" className={cn('product-operations product-container')}>
    <h2>작업 순서와 확인할 결과</h2>
    <ol aria-label="작업 흐름">
      {OPERATIONS.stepList.map(({ title, detail }) => <li key={title}><h3>{title}</h3><p>{detail}</p></li>)}
    </ol>
    <div className={cn('operation-result')}><h3>{OPERATIONS.output}</h3><p>{OPERATIONS.outputDetail}</p></div>
    <div className={cn('operation-connection')}>
      <div><h3>Ply에서 작업 요청하기</h3><p>{OPERATIONS.ply}</p>
        <a href={LANDING_LINKS.ply}>Ply 브라우저 알아보기 ↗</a>
      </div>
      <div><h3>결과를 확인할 때</h3><p>{OPERATIONS.boundary}</p>
        <a href={OPERATIONS.sourceUrl} target="_blank" rel="noopener noreferrer">{OPERATIONS.sourceLabel} ↗</a>
      </div>
    </div>
  </section>
);
