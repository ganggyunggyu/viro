export interface ActivityHours {
  start: number;
  end: number;
}

export interface NaverAccount {
  id: string;
  password: string;
  nickname?: string;
  isMain?: boolean;
  activityHours?: ActivityHours;
  restDays?: number[];
  dailyPostLimit?: number;
  personaId?: string;
  campaignTag?: string;
  excludeFromAutoComment?: boolean;
}

export type Account = NaverAccount;

export interface AccountData extends Omit<NaverAccount, 'password'> {
  hasPassword: boolean;
  fromConfig?: boolean;
}

export interface AccountInput {
  accountId: string;
  password: string;
  nickname?: string;
  isMain?: boolean;
  activityHours?: ActivityHours;
  restDays?: number[];
  dailyPostLimit?: number;
  personaId?: string;
  campaignTag?: string;
  excludeFromAutoComment?: boolean;
}
