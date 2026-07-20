'use server';

import { connectDB } from '@/shared/lib/mongodb';
import { toCafeSlug } from '@/shared/lib/naver-cafe-membership';
import { Cafe } from '@/shared/models';
import { getCurrentUserId } from '@/shared/config/user';
import { revalidatePath } from 'next/cache';
import type { CafeData, CafeInput } from '../model';

export const getCafesAction = async (): Promise<CafeData[]> => {
  try {
    await connectDB();
  } catch (err) {
    console.error('[CAFE-ACTION] connectDB 에러:', err);
    return [];
  }

  const userId = await getCurrentUserId();
  console.log('[CAFE-ACTION] getCafesAction 호출, userId:', userId);

  const dbCafes = await Cafe.find({ userId, isActive: true }).sort({ isDefault: -1, createdAt: 1 }).lean();
  console.log('[CAFE-ACTION] DB 카페 수:', dbCafes.length);

  return dbCafes.map((c) => {
    const categoryMenuIds = c.categoryMenuIds instanceof Map
      ? Object.fromEntries(c.categoryMenuIds)
      : c.categoryMenuIds;
    const categoryAliases = c.categoryAliases instanceof Map
      ? Object.fromEntries(c.categoryAliases)
      : c.categoryAliases;
    return {
      cafeId: c.cafeId,
      cafeUrl: c.cafeUrl,
      menuId: c.menuId,
      name: c.name,
      categories: c.categories,
      categoryMenuIds,
      categoryAliases,
      isDefault: c.isDefault,
      fromConfig: false,
    };
  });
};

export const addCafeAction = async (input: CafeInput) => {
  await connectDB();
  const userId = await getCurrentUserId();
  const cafeId = input.cafeId.trim();
  const cafeUrl = toCafeSlug(input.cafeUrl) || input.cafeUrl.trim();

  const existing = await Cafe.findOne({ userId, cafeId });
  if (existing) {
    return { success: false, error: '이미 존재하는 카페입니다' };
  }

  if (input.isDefault) {
    await Cafe.updateMany({ userId }, { $set: { isDefault: false } });
  }

  await Cafe.create({
    userId,
    cafeId,
    cafeUrl,
    menuId: input.menuId,
    name: input.name,
    categories: input.categories ?? [],
    categoryMenuIds: input.categoryMenuIds,
    categoryAliases: input.categoryAliases,
    isDefault: input.isDefault ?? false,
  });

  revalidatePath('/accounts');
  return { success: true };
};

export const updateCafeAction = async (cafeId: string, input: Partial<CafeInput>) => {
  await connectDB();
  const userId = await getCurrentUserId();
  const normalizedInput = {
    ...input,
    ...(input.cafeId === undefined ? {} : { cafeId: input.cafeId.trim() }),
    ...(input.cafeUrl === undefined
      ? {}
      : { cafeUrl: toCafeSlug(input.cafeUrl) || input.cafeUrl.trim() }),
  };

  if (input.isDefault) {
    await Cafe.updateMany({ userId }, { $set: { isDefault: false } });
  }

  await Cafe.findOneAndUpdate(
    { userId, cafeId: cafeId.trim() },
    { $set: normalizedInput }
  );

  revalidatePath('/accounts');
  return { success: true };
};

export const deleteCafeAction = async (cafeId: string) => {
  await connectDB();
  const userId = await getCurrentUserId();

  await Cafe.findOneAndUpdate(
    { userId, cafeId },
    { $set: { isActive: false } }
  );

  revalidatePath('/accounts');
  return { success: true };
};
