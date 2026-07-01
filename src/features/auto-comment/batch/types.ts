import type { NaverAccount } from '@/shared/lib/account-manager';
import type { PostOptions, PostResult } from '@/shared/types';
export type { PostOptions, PostResult } from '@/shared/types';
export type { BatchProgress, ProgressCallback } from '@/shared/types';
export { DEFAULT_POST_OPTIONS } from '@/shared/types';

export interface BatchJobInput {
  service: string;
  keywords: string[];
  ref?: string;
  cafeId?: string;
  commentTemplates?: string[];
  replyTemplates?: string[];
  postOptions?: PostOptions;
  skipComments?: boolean;
  contentPrompt?: string;
  contentModel?: string;
}

export interface CommentResult {
  accountId: string;
  success: boolean;
  commentIndex: number;
  error?: string;
}

export interface ReplyResult {
  accountId: string;
  success: boolean;
  targetCommentIndex: number;
  isAuthor?: boolean;
  error?: string;
}

export interface KeywordResult {
  keyword: string;
  post: PostResult;
  comments: CommentResult[];
  replies: ReplyResult[];
}

export interface BatchJobResult {
  success: boolean;
  totalKeywords: number;
  completed: number;
  failed: number;
  results: KeywordResult[];
  jobLogId?: string;
}

export interface DelayConfig {
  afterPost: number;
  betweenComments: number;
  beforeReplies: number;
  betweenReplies: number;
  betweenKeywords: number;
}

// DB 설정과 동기화 - queue-settings.ts의 DEFAULT_QUEUE_SETTINGS 참조
export const DEFAULT_DELAYS: DelayConfig = {
  afterPost: 10 * 1000,
  betweenComments: 5 * 60 * 1000, // 5분 (3~8분 중간값)
  beforeReplies: 10 * 1000,
  betweenReplies: 10 * 1000,
  betweenKeywords: 45 * 1000,
};

export type ReplyStrategy = 'rotation' | 'random' | 'all-to-first';

export interface BatchJobOptions {
  delays?: Partial<DelayConfig>;
  replyStrategy?: ReplyStrategy;
}

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getWriterAccount = (
  accounts: NaverAccount[]
): NaverAccount => {
  const randomIndex = Math.floor(Math.random() * accounts.length);
  return accounts[randomIndex];
};

export const getCommenterAccounts = (
  accounts: NaverAccount[],
  writerAccountId: string
): NaverAccount[] => {
  const commenters = accounts.filter((a) => a.id !== writerAccountId);
  return shuffleArray(commenters);
};
