'use client';

import { atom } from 'jotai';

// 글만 발행 탭의 입력 초안 (탭 전환 시에도 유지)
export const postKeywordsTextAtom = atom<string>('');
export const postRefAtom = atom<string>('');
export const postAttachImagesAtom = atom<boolean>(false);
export const postsPerDayAtom = atom<string>('');
