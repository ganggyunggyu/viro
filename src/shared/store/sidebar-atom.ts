'use client';

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const sidebarCollapsedAtom = atomWithStorage<boolean>('sidebar-collapsed', false);
export const mobileSidebarOpenAtom = atom<boolean>(false);
