import { PageLayout } from '@/widgets';
import { ManualCommentJobUI } from '@/features/manual-comment-job';

export default function CommentJobsPage() {
  return (
    <PageLayout
      title="댓글 작업"
      subtitle="카페 글 URL을 붙여넣고 댓글을 등록하면 로컬 워커가 자동으로 처리합니다"
    >
      <ManualCommentJobUI />
    </PageLayout>
  );
}
