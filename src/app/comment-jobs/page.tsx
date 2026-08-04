import { PageLayout } from '@/widgets';
import { ManualCommentJobUI } from '@/features/manual-comment-job';

export default function CommentJobsPage() {
  return (
    <PageLayout
      title="댓글 작업"
      subtitle="카페 글 링크를 붙여넣고 버튼만 누르면 됩니다"
    >
      <ManualCommentJobUI />
    </PageLayout>
  );
}
