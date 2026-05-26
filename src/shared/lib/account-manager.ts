export interface ActivityHours {
  start: number;
  end: number;
}

export type AccountRole = 'writer' | 'commenter';

export interface NaverAccount {
  id: string;
  password: string;
  nickname?: string;
  isMain?: boolean;
  activityHours?: ActivityHours;
  restDays?: number[];
  dailyPostLimit?: number;
  personaId?: string;
  role?: AccountRole;
}

export interface AccountList {
  accounts: NaverAccount[];
}

export const getPersonaId = (account: NaverAccount): string | null => {
  return account.personaId || null;
};

export const isAccountActive = (account: NaverAccount): boolean => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();

  if (account.restDays?.includes(currentDay)) return false;

  if (!account.activityHours) return true;
  const { start, end } = account.activityHours;

  if (start > end) {
    return currentHour >= start || currentHour < end;
  }
  return currentHour >= start && currentHour < end;
};

export const getNextActiveTime = (account: NaverAccount): number => {
  const now = new Date();
  const currentHour = now.getHours();

  if (isAccountActive(account)) return 0;
  if (!account.activityHours) return 0;

  const { start, end } = account.activityHours;
  const targetDate = new Date(now);
  targetDate.setMinutes(0, 0, 0);

  if (start > end) {
    if (currentHour < end) return 0;
    if (currentHour < start) {
      targetDate.setHours(start);
    } else {
      return 0;
    }
  } else {
    if (currentHour < start) {
      targetDate.setHours(start);
    } else {
      targetDate.setDate(targetDate.getDate() + 1);
      targetDate.setHours(start);
    }
  }

  if (account.restDays) {
    let safetyCounter = 0;
    while (account.restDays.includes(targetDate.getDay()) && safetyCounter < 7) {
      targetDate.setDate(targetDate.getDate() + 1);
      safetyCounter++;
    }
  }

  const MAX_DELAY_MS = 24 * 60 * 60 * 1000;
  const delay = targetDate.getTime() - now.getTime();
  return Math.min(Math.max(0, delay), MAX_DELAY_MS);
};
