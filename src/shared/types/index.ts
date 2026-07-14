export interface NaverTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export type { PostOptions, PostResult } from './post-options';
export { DEFAULT_POST_OPTIONS } from './post-options';
export type { BatchProgress, ProgressCallback } from './batch-progress';
export type { ManuscriptImage } from './manuscript';

export interface CafeJoinResponse {
  message: {
    '@type': string;
    '@service': string;
    '@version': string;
    status: string;
    error?: {
      code: string;
      msg: string;
    };
  };
}

export interface CafePostResponse {
  message: {
    '@type': string;
    '@service': string;
    '@version': string;
    status: string;
    result?: {
      msg: string;
      cafeUrl: string;
      articleId: number;
      articleUrl: string;
    };
    error?: {
      code: string;
      msg: string;
    };
  };
}

export interface CafePostRequest {
  clubId: string;
  menuId: string;
  subject: string;
  content: string;
  openyn?: boolean;
  searchopen?: boolean;
  replyyn?: boolean;
  scrapyn?: boolean;
}

export interface GenerateContentRequest {
  service: string;
  keyword: string;
  ref?: string;
  personaId?: string | null; // 페르소나 ID (null이면 랜덤)
}

export interface GenerateContentResponse {
  _id: string;
  content: string;
  createdAt: string;
  engine: string;
  service: string;
  category: string;
  keyword: string;
  ref: string;
}

export interface TeteContentRequest {
  keyword: string;
  ref?: string;
  /** '정보성' | '후기성'. 비우면 서버가 키워드로 자동 판정 */
  contentType?: '정보성' | '후기성' | '';
}

export interface TeteContentResponse {
  _id: string;
  content: string;
  createdAt: string;
  engine: string;
  service: string;
  category: string;
  keyword: string;
  contentType: '정보성' | '후기성';
}

export interface PostArticleInput {
  service: string;
  keyword: string;
  cafeId?: string;
  menuId?: string;
  ref?: string;
}

export interface CommentInput {
  cafeId: string;
  articleId: number;
  content: string;
}

export interface ReplyInput extends CommentInput {
  parentCommentId: string;
}

export interface NaverLoginInput {
  id: string;
  password: string;
}
