export interface AccountRegistrationRecord {
  userId: string;
  accountId: string;
  password: string;
  nickname?: string;
  isMain?: boolean;
  activityHours?: { start: number; end: number };
  restDays?: number[];
  dailyPostLimit?: number;
  personaId?: string;
  campaignTag?: string;
  excludeFromAutoComment?: boolean;
  isActive?: boolean;
}

export interface AccountRegistrationDeps {
  findActive: (filter: { userId: string; accountId: string }) => Promise<unknown | null>;
  upsert: (input: {
    filter: { userId: string; accountId: string };
    set: Omit<AccountRegistrationRecord, 'userId'> & { isActive: true };
  }) => Promise<unknown>;
}

export const createAccountRegistration = ({ findActive, upsert }: AccountRegistrationDeps) => {
  return async (record: AccountRegistrationRecord): Promise<{ success: boolean; error?: string }> => {
    const { userId, accountId, password, ...fields } = record;
    if (!accountId.trim() || !password.trim()) {
      return { success: false, error: '아이디와 비밀번호를 입력해주세요' };
    }

    const filter = { userId, accountId };
    const existing = await findActive(filter);
    if (existing) {
      return { success: false, error: '이미 존재하는 계정입니다' };
    }

    await upsert({
      filter,
      set: {
        accountId,
        password,
        ...fields,
        isActive: true,
      },
    });
    return { success: true };
  };
};
