import { NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/mongodb';
import { Cafe } from '@/shared/models';
import { getCurrentUserId } from '@/shared/config/user';
import { AuthenticationRequiredError } from '@/shared/config/session-error';

export const GET = async () => {
  try {
    const userId = await getCurrentUserId();
    await connectDB();
    const cafes = await Cafe.find({ userId, isActive: true })
      .sort({ isDefault: -1, createdAt: 1 })
      .select('cafeId name isDefault')
      .lean();

    return NextResponse.json(cafes);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('[API] cafes 조회 실패:', error);
    return NextResponse.json([], { status: 500 });
  }
};
