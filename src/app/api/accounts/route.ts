import { NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/mongodb';
import { Account } from '@/shared/models';
import { getCurrentUserId } from '@/shared/config/user';
import { AuthenticationRequiredError } from '@/shared/config/session-error';

export const GET = async () => {
  try {
    const userId = await getCurrentUserId();
    await connectDB();
    const accounts = await Account.find({ userId, isActive: true })
      .sort({ isMain: -1, createdAt: 1 })
      .select('accountId nickname isMain')
      .lean();

    return NextResponse.json(accounts);
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('[API] accounts 조회 실패:', error);
    return NextResponse.json([], { status: 500 });
  }
};
