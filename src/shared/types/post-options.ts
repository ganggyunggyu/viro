export interface PostOptions {
  allowComment: boolean;
  allowScrap: boolean;
  allowCopy: boolean;
  useAutoSource: boolean;
  useCcl: boolean;
  cclCommercial: 'allow' | 'disallow';
  cclModify: 'allow' | 'same' | 'disallow';
}

export const DEFAULT_POST_OPTIONS: PostOptions = {
  allowComment: true,
  allowScrap: true,
  allowCopy: false,
  useAutoSource: false,
  useCcl: false,
  cclCommercial: 'disallow',
  cclModify: 'disallow',
};

export interface PostResult {
  success: boolean;
  articleId?: number;
  articleUrl?: string;
  writerAccountId: string;
  error?: string;
}
