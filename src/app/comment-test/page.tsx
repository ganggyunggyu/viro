'use client';

import { useState } from 'react';
import { FileText, MessageSquare } from 'lucide-react';
import { cn } from '@/shared';
import { PageLayout } from '@/widgets';

interface GeneratedComment {
  user: string;
  text: string;
  persona: string;
  personaId: string;
  type: 'comment' | 'reply';
  parentUser?: string;
}

// 페르소나 ID 기반 목록
const PERSONAS = [
  // 긍정
  { id: 'cute_f', label: '친근 발랄', category: '긍정' },
  { id: 'warm_f', label: '따뜻한 30대', category: '긍정' },
  { id: 'enthusiast', label: '열정파', category: '긍정' },
  { id: 'grateful', label: '감사형', category: '긍정' },
  { id: 'supporter', label: '응원형', category: '긍정' },
  // 중립
  { id: 'chill_m', label: '무심 20대', category: '중립' },
  { id: 'dry', label: '담백함', category: '중립' },
  { id: 'quiet', label: '조용한 단답', category: '중립' },
  { id: 'curious', label: '궁금형', category: '중립' },
  { id: 'passerby', label: '그냥 지나감', category: '중립' },
  // 냉소
  { id: 'cynical', label: '시니컬', category: '냉소' },
  { id: 'skeptic', label: '의심 많음', category: '냉소' },
  { id: 'tired', label: '지침', category: '냉소' },
  // 비판
  { id: 'doubter', label: '반신반의', category: '비판' },
  { id: 'critic', label: '살짝 까는 편', category: '비판' },
  { id: 'nitpicker', label: '디테일 지적', category: '비판' },
  // 광고의심
  { id: 'ad_detector', label: '광고 감별사', category: '광고의심' },
  { id: 'ad_skeptic', label: '홍보 의심', category: '광고의심' },
  { id: 'ad_tired', label: '광고 피로', category: '광고의심' },
  // 커뮤니티
  { id: 'dc_style', label: '디씨 스타일', category: '커뮤니티' },
  { id: 'fm_style', label: '에펨 스타일', category: '커뮤니티' },
  { id: 'naver_cafe', label: '네카페 스타일', category: '커뮤니티' },
  { id: 'blind', label: '블라인드', category: '커뮤니티' },
  { id: 'ruriweb', label: '루리웹 덕후', category: '커뮤니티' },
  { id: 'ppomppu', label: '뽐뿌 가성비', category: '커뮤니티' },
  // 맘카페
  { id: 'mom_cafe', label: '맘카페', category: '맘카페' },
  { id: 'mom_senior', label: '선배맘', category: '맘카페' },
  { id: 'beauty_cafe', label: '뷰티카페', category: '맘카페' },
  // 연령대
  { id: 'teen', label: '10대', category: '연령대' },
  { id: '20s_m', label: '20대 남성', category: '연령대' },
  { id: '20s_f', label: '20대 여성', category: '연령대' },
  { id: '30s', label: '30대', category: '연령대' },
  { id: '40s', label: '40대', category: '연령대' },
  { id: '50s', label: '50대 이상', category: '연령대' },
  // 생활
  { id: 'office_worker', label: '직장인', category: '생활' },
  { id: 'student', label: '대학생', category: '생활' },
  { id: 'single_life', label: '자취생', category: '생활' },
  // 말투
  { id: 'formal', label: '격식체', category: '말투' },
  { id: 'casual', label: '반말', category: '말투' },
  { id: 'short', label: '극단적 짧음', category: '말투' },
];

const BASE_URL = process.env.NEXT_PUBLIC_COMMENT_API_URL || 'http://localhost:8000';

export default function CommentTestPage() {
  const [keyword, setKeyword] = useState('호박차');
  const [postContent, setPostContent] = useState('');
  const [authorName, setAuthorName] = useState('글쓴이');
  const [contentPersonaId, setContentPersonaId] = useState<string | null>(null);
  const [commentPersonaId, setCommentPersonaId] = useState('chill_m');
  const [replyPersonaIds, setReplyPersonaIds] = useState<Record<number, string>>({});
  const [comments, setComments] = useState<GeneratedComment[]>([]);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  const getReplyPersonaId = (idx: number) => replyPersonaIds[idx] ?? 'quiet';
  const setReplyPersonaId = (idx: number, personaId: string) => {
    setReplyPersonaIds(prev => ({ ...prev, [idx]: personaId }));
  };

  // 원고 생성
  const handleGenerateContent = async () => {
    setIsGeneratingContent(true);
    try {
      const res = await fetch(`${BASE_URL}/generate/gemini-cafe-daily`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: '카페',
          keyword,
          ref: '',
          persona_id: contentPersonaId,
        }),
      });
      const data = await res.json();
      setPostContent(data.content || '');
      setComments([]);
      setReplyPersonaIds({});
    } catch (error) {
      console.error('원고 생성 실패:', error);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // 댓글 생성
  const handleGenerateComment = async () => {
    if (!keyword.trim()) return;
    setIsLoading('comment');
    try {
      const userNum = comments.filter(c => c.type === 'comment').length + 1;
      const userName = `유저${userNum}`;

      const res = await fetch(`${BASE_URL}/generate/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      const data = await res.json();

      setComments(prev => [...prev, {
        user: userName,
        text: data.comment,
        persona: '기본',
        personaId: 'default',
        type: 'comment',
      }]);
    } catch (error) {
      console.error('댓글 생성 실패:', error);
    } finally {
      setIsLoading(null);
    }
  };

  // 대댓글 생성
  const handleGenerateReply = async (parentComment: GeneratedComment, parentIndex: number) => {
    if (!keyword.trim()) return;
    setIsLoading(`reply-${parentIndex}`);
    try {
      const replyCount = comments.filter(c => c.type === 'reply' && c.parentUser === parentComment.user).length + 1;
      const replyerName = `답글러${parentIndex + 1}-${replyCount}`;
      const res = await fetch(`${BASE_URL}/generate/recomment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_comment: parentComment.text,
          keyword,
        }),
      });
      const data = await res.json();

      setComments(prev => [...prev, {
        user: replyerName,
        text: data.comment,
        persona: '기본',
        personaId: 'default',
        type: 'reply',
        parentUser: parentComment.user,
      }]);
    } catch (error) {
      console.error('대댓글 생성 실패:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const topLevelComments = comments.filter(c => c.type === 'comment');
  const getReplies = (parentUser: string) =>
    comments.filter(c => c.type === 'reply' && c.parentUser === parentUser);

  // 카테고리별 그룹핑
  const categories = [...new Set(PERSONAS.map(p => p.category))];

  return (
    <PageLayout
      title="댓글 생성 테스트"
      subtitle="원고/댓글/대댓글 생성 API를 페르소나별로 직접 호출해 확인하는 개발용 도구"
    >
      {/* 설정 영역 */}
      <div className={cn('bg-surface rounded-xl p-4 mb-6 space-y-4')}>
        <div className={cn('grid grid-cols-2 gap-4')}>
          <div>
            <label className={cn('block text-sm font-medium mb-1')}>키워드</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className={cn('w-full px-3 py-2 rounded-lg bg-surface-muted border border-border')}
              placeholder="호박차"
            />
          </div>
          <div>
            <label className={cn('block text-sm font-medium mb-1')}>글쓴이 이름</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className={cn('w-full px-3 py-2 rounded-lg bg-surface-muted border border-border')}
              placeholder="글쓴이"
            />
          </div>
        </div>

        <div>
          <label className={cn('block text-sm font-medium mb-2')}>원고 페르소나 (선택)</label>
          <div className={cn('space-y-2')}>
            <button
              onClick={() => setContentPersonaId(null)}
              className={cn(
                'px-2 py-1 rounded text-xs transition-colors mr-2',
                contentPersonaId === null
                  ? 'bg-accent text-background'
                  : 'bg-surface-muted hover:bg-(--surface-elevated)'
              )}
            >
              랜덤
            </button>
            {categories.map(cat => (
              <div key={cat} className={cn('flex flex-wrap gap-1 items-center')}>
                <span className={cn('text-xs text-ink-muted w-16')}>{cat}:</span>
                {PERSONAS.filter(p => p.category === cat).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setContentPersonaId(p.id)}
                    className={cn(
                      'px-2 py-0.5 rounded text-xs transition-colors',
                      contentPersonaId === p.id
                        ? 'bg-accent text-background'
                        : 'bg-surface-muted hover:bg-(--surface-elevated)'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerateContent}
          disabled={isGeneratingContent || !keyword}
          className={cn(
            'w-full py-2 rounded-lg font-medium transition-colors',
            'bg-accent text-background hover:bg-accent-hover',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isGeneratingContent ? '원고 생성 중...' : '원고 생성'}
        </button>
      </div>

      {/* 원고 표시 */}
      {postContent && (
        <div className={cn('bg-surface rounded-xl p-4 mb-6')}>
          <h2 className={cn('font-bold mb-2 flex items-center gap-1.5')}>
            <FileText className="h-4 w-4" strokeWidth={2} />
            생성된 원고
          </h2>
          <div className={cn('text-sm text-ink-muted whitespace-pre-wrap max-h-48 overflow-y-auto')}>
            {postContent}
          </div>
        </div>
      )}

      {/* 댓글 생성 */}
      {postContent && (
        <div className={cn('bg-surface rounded-xl p-4 mb-6')}>
          <h2 className={cn('font-bold mb-3 flex items-center gap-1.5')}>
            <MessageSquare className="h-4 w-4" strokeWidth={2} />
            새 댓글 추가
          </h2>
          <div className={cn('space-y-2 mb-3')}>
            {categories.map(cat => (
              <div key={cat} className={cn('flex flex-wrap gap-1 items-center')}>
                <span className={cn('text-xs text-ink-muted w-16')}>{cat}:</span>
                {PERSONAS.filter(p => p.category === cat).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setCommentPersonaId(p.id)}
                    className={cn(
                      'px-2 py-0.5 rounded text-xs transition-colors',
                      commentPersonaId === p.id
                        ? 'bg-accent text-background'
                        : 'bg-surface-muted hover:bg-(--surface-elevated)'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className={cn('flex items-center gap-3')}>
            <button
              onClick={handleGenerateComment}
              disabled={isLoading !== null}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                'bg-success text-background hover:brightness-95',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isLoading === 'comment' ? '생성 중...' : '+ 댓글 추가'}
            </button>
            <span className={cn('text-xs text-ink-muted')}>
              선택: {commentPersonaId}
            </span>
          </div>
        </div>
      )}

      {/* 댓글 목록 */}
      {topLevelComments.length > 0 && (
        <div className={cn('space-y-4')}>
          <h2 className={cn('font-bold')}>댓글 목록 ({topLevelComments.length}개)</h2>

          {topLevelComments.map((comment, idx) => (
            <div key={idx} className={cn('bg-surface rounded-xl p-4')}>
              <div className={cn('flex items-start gap-3')}>
                <div className={cn('w-8 h-8 rounded-full bg-(--accent) flex items-center justify-center text-background text-sm font-bold shrink-0')}>
                  {comment.user.charAt(comment.user.length - 1)}
                </div>
                <div className={cn('flex-1 min-w-0')}>
                  <div className={cn('flex items-center gap-2 mb-1 flex-wrap')}>
                    <span className={cn('font-medium')}>{comment.user}</span>
                    <span className={cn('text-xs text-ink-muted bg-surface-muted px-2 py-0.5 rounded')}>
                      요청: {comment.personaId} → 응답: {comment.persona}
                    </span>
                  </div>
                  <p className={cn('text-sm mb-3')}>{comment.text}</p>

                  {/* 대댓글 입력 */}
                  <div className={cn('bg-surface-muted rounded-lg p-3')}>
                    <div className={cn('text-xs text-ink-muted mb-2')}>답글 페르소나:</div>
                    <div className={cn('space-y-1 mb-2')}>
                      {categories.slice(0, 6).map(cat => (
                        <div key={cat} className={cn('flex flex-wrap gap-1 items-center')}>
                          <span className={cn('text-xs text-ink-muted w-14')}>{cat}:</span>
                          {PERSONAS.filter(p => p.category === cat).slice(0, 3).map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setReplyPersonaId(idx, p.id)}
                              className={cn(
                                'px-1.5 py-0.5 rounded text-xs transition-colors',
                                getReplyPersonaId(idx) === p.id
                                  ? 'bg-accent text-background'
                                  : 'bg-surface hover:bg-(--surface-muted)'
                              )}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className={cn('flex items-center gap-3')}>
                      <button
                        onClick={() => handleGenerateReply(comment, idx)}
                        disabled={isLoading !== null}
                        className={cn(
                          'px-3 py-1.5 rounded text-xs font-medium transition-colors',
                          'bg-info text-background hover:brightness-95',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                      >
                        {isLoading === `reply-${idx}` ? '생성 중...' : '답글 달기'}
                      </button>
                      <span className={cn('text-xs text-ink-muted')}>
                        선택: {getReplyPersonaId(idx)}
                      </span>
                    </div>
                  </div>

                  {/* 대댓글 목록 */}
                  {getReplies(comment.user).length > 0 && (
                    <div className={cn('mt-3 pl-4 border-l-2 border-border space-y-3')}>
                      {getReplies(comment.user).map((reply, rIdx) => (
                        <div key={rIdx} className={cn('flex items-start gap-2')}>
                          <div className={cn('w-6 h-6 rounded-full bg-surface-muted flex items-center justify-center text-xs shrink-0')}>
                            R
                          </div>
                          <div className={cn('flex-1 min-w-0')}>
                            <div className={cn('flex items-center gap-2 mb-0.5 flex-wrap')}>
                              <span className={cn('text-sm font-medium')}>{reply.user}</span>
                              <span className={cn('text-xs text-ink-muted')}>
                                요청: {reply.personaId} → 응답: {reply.persona}
                              </span>
                            </div>
                            <p className={cn('text-sm text-ink-muted')}>{reply.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 초기화 */}
      {comments.length > 0 && (
        <button
          onClick={() => { setComments([]); setReplyPersonaIds({}); }}
          className={cn('mt-4 text-sm text-ink-muted hover:underline')}
        >
          전체 초기화
        </button>
      )}
    </PageLayout>
  );
}
