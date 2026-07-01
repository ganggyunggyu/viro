export interface BatchProgress {
  currentKeyword: string;
  keywordIndex: number;
  totalKeywords: number;
  phase: 'post' | 'comments' | 'replies' | 'waiting' | 'done';
  message: string;
  success?: boolean;
  error?: string;
  title?: string;
}

export type ProgressCallback = (progress: BatchProgress) => void;
