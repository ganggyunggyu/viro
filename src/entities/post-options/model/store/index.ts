'use client';

import { atom } from 'jotai';
import type { PostOptions } from '@/shared/types';
import { DEFAULT_POST_OPTIONS } from '@/shared/types';

export const postOptionsAtom = atom<PostOptions>(DEFAULT_POST_OPTIONS);

export const allowCommentAtom = atom(
  (get) => get(postOptionsAtom).allowComment,
  (get, set, value: boolean) =>
    set(postOptionsAtom, { ...get(postOptionsAtom), allowComment: value })
);

export const allowScrapAtom = atom(
  (get) => get(postOptionsAtom).allowScrap,
  (get, set, value: boolean) =>
    set(postOptionsAtom, { ...get(postOptionsAtom), allowScrap: value })
);

export const resetPostOptionsAtom = atom(null, (_get, set) => {
  set(postOptionsAtom, DEFAULT_POST_OPTIONS);
});
