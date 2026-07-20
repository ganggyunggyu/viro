const BASE_URL = process.env.COMMENT_GEN_API_URL || 'http://localhost:8000';

interface GenerateCommentRequest {
  keyword: string;
}

interface GenerateReplyRequest {
  parent_comment: string;
  keyword?: string;
}

interface GenerateCommentResponse {
  success: boolean;
  comment: string;
  persona_id: string;
  persona: string;
  model: string;
  elapsed: number;
}

export const generateComment = async (
  keyword: string,
): Promise<string> => {
  const body: GenerateCommentRequest = { keyword };

  const res = await fetch(`${BASE_URL}/generate/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`댓글 생성 API 오류: ${res.status}`);
  }

  const data: GenerateCommentResponse = await res.json();

  if (!data.success) {
    throw new Error('댓글 생성 실패');
  }

  return data.comment.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
};

export const generateReply = async (
  keyword: string,
  parentComment: string,
): Promise<string> => {
  const body: GenerateReplyRequest = {
    parent_comment: parentComment,
    keyword,
  };

  const res = await fetch(`${BASE_URL}/generate/recomment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`대댓글 생성 API 오류: ${res.status}`);
  }

  const data: GenerateCommentResponse = await res.json();

  if (!data.success) {
    throw new Error('대댓글 생성 실패');
  }

  return data.comment.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
};

export const generateAuthorReply = async (
  keyword: string,
  parentComment: string,
): Promise<string> => {
  const body: GenerateReplyRequest = {
    parent_comment: parentComment,
    keyword,
  };

  const res = await fetch(`${BASE_URL}/generate/recomment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`글쓴이 대댓글 생성 API 오류: ${res.status}`);
  }

  const data: GenerateCommentResponse = await res.json();

  if (!data.success) {
    throw new Error('글쓴이 대댓글 생성 실패');
  }

  return data.comment.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();
};
