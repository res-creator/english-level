import { signTelegramInitData } from "@english-level/shared";

/** Never a real bot token — only ever used to sign test fixtures. */
export const TEST_BOT_TOKEN = "test-bot-token:not-a-real-secret";

export interface FixtureUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export function buildValidInitData(
  user: FixtureUser,
  overrides: Partial<Record<string, string>> = {},
): Promise<string> {
  return signTelegramInitData(
    {
      query_id: "AAtest",
      user: JSON.stringify(user),
      auth_date: Math.floor(Date.now() / 1000).toString(),
      ...overrides,
    },
    TEST_BOT_TOKEN,
  );
}
