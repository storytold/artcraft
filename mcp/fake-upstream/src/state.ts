/**
 * In-memory state for the fake. Seeded the same way as `infra/fake-storyteller-web` so anyone
 * who has used that fake finds the same account here. Everything resets when the Worker
 * isolate restarts, which is the point.
 */

export interface FakeUser {
  readonly userToken: string;
  readonly username: string;
  readonly displayName: string;
  readonly email: string;
  readonly password: string;
}

export interface FakeStore {
  readonly usersByToken: Map<string, FakeUser>;
  /** signed session → user token */
  readonly sessions: Map<string, string>;
}

export const SEEDED_USER: FakeUser = {
  userToken: "user_localdev1",
  username: "localdev1",
  displayName: "Local Dev",
  email: "localdev1@example.test",
  password: "localdev1pass",
};

export function createStore(): FakeStore {
  return {
    usersByToken: new Map([[SEEDED_USER.userToken, SEEDED_USER]]),
    sessions: new Map(),
  };
}

export function findUserByUsernameOrEmail(store: FakeStore, value: string): FakeUser | undefined {
  const needle = value.trim().toLowerCase();
  for (const user of store.usersByToken.values()) {
    if (user.username === needle || user.email.toLowerCase() === needle) return user;
  }
  return undefined;
}
