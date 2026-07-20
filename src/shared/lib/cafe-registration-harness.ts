export interface CafeRegistrationRecord {
  userId: string;
  cafeId: string;
  cafeUrl: string;
  menuId: string;
  name: string;
  categories: string[];
  categoryMenuIds?: Record<string, string>;
  categoryAliases?: Record<string, string>;
  commentableMenuIds?: number[];
  ownerAccountId?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CafeRegistrationUpdate {
  $set: Omit<CafeRegistrationRecord, 'userId' | 'cafeId'> & { isActive: true };
  $setOnInsert?: { isDefault: false };
}

export const buildCafeRegistrationUpdate = (
  record: CafeRegistrationRecord,
  options: { preserveExistingDefault?: boolean } = {},
): CafeRegistrationUpdate => {
  const { userId, cafeId, isActive, isDefault, ...fields } = record;
  void userId;
  void cafeId;
  void isActive;

  if (options.preserveExistingDefault) {
    return {
      $set: { ...fields, isActive: true },
      $setOnInsert: { isDefault: false },
    };
  }

  return {
    $set: {
      ...fields,
      isDefault: isDefault ?? false,
      isActive: true,
    },
  };
};

export interface CafeRegistrationDeps {
  findActive: (filter: { userId: string; cafeId: string }) => Promise<unknown | null>;
  upsert: (input: {
    filter: { userId: string; cafeId: string };
    update: CafeRegistrationUpdate;
  }) => Promise<unknown>;
}

export const createCafeRegistration = ({ findActive, upsert }: CafeRegistrationDeps) => {
  return async (record: CafeRegistrationRecord): Promise<{ success: boolean; error?: string }> => {
    const { userId, cafeId } = record;
    const filter = { userId, cafeId };
    const existing = await findActive(filter);
    if (existing) {
      return { success: false, error: '이미 존재하는 카페입니다' };
    }

    await upsert({
      filter,
      update: buildCafeRegistrationUpdate(record),
    });
    return { success: true };
  };
};
