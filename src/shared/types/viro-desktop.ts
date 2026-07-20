export interface ViroDesktopConfig {
  brokerUrl: string;
  token: string;
}

export interface ViroDesktopStatus {
  running: boolean;
}

export type ViroDesktopAction =
  | { type: 'account-login'; accountId: string }
  | { type: 'cafe-join-all' }
  | {
      type: 'nickname-change';
      mode: 'by-cafe' | 'by-account' | 'all';
      cafeId?: string;
      accountId?: string;
    }
  | {
      type: 'exposure-check';
      accountId: string;
      items: Array<{ cafeId: string; keyword: string; articleId?: number }>;
    }
  | {
      type: 'cafe-create';
      input: {
        ownerAccountId: string;
        name: string;
        slug: string;
        presetKey: string;
        description: string;
        keywords: string[];
      };
    }
  | {
      type: 'manual-publish';
      input: {
        cafeId?: string;
        postOptions?: PostOptions;
        manuscripts: Array<{
          folderName: string;
          title: string;
          body: string;
          htmlContent: string;
          images: string[];
          category?: string;
        }>;
      };
    }
  | {
      type: 'manual-modify';
      input: {
        cafeId?: string;
        daysLimit?: number;
        sortOrder?: 'oldest' | 'newest' | 'random';
        manuscripts: Array<{
          folderName: string;
          title: string;
          htmlContent: string;
          images: string[];
          category?: string;
        }>;
      };
    }
  | {
      type: 'rewrite';
      input: {
        cafeIds: string[];
        dateFrom: string;
        dateTo: string;
        keywordSource: 'pool' | 'custom';
        customKeywords?: string[];
      };
    };

export interface ViroDesktopActionResponse<T = unknown> {
  success: boolean;
  result?: T;
  error?: string;
}

export interface ViroDesktopApi {
  isDesktop: true;
  getConfig: () => Promise<ViroDesktopConfig>;
  getStatus: () => Promise<ViroDesktopStatus>;
  saveConfig: (config: ViroDesktopConfig) => Promise<boolean>;
  ensureChromium: () => Promise<boolean>;
  startAgent: () => Promise<boolean>;
  stopAgent: () => Promise<boolean>;
  executeAction: <T = unknown>(
    action: ViroDesktopAction,
  ) => Promise<ViroDesktopActionResponse<T>>;
  onLog: (callback: (line: string) => void) => void;
  onSetupProgress: (callback: (line: string) => void) => void;
  onStatus: (callback: (status: ViroDesktopStatus) => void) => void;
}

declare global {
  interface Window {
    viroDesktop?: ViroDesktopApi;
  }
}
import type { PostOptions } from './post-options';
