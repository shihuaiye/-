import type { User } from "@secondhand/shared/src/index.js";

export type PublicUser = Omit<User, "password">;

export const toPublicUser = (user: User): PublicUser => {
  const { password: _password, ...rest } = user;
  return rest;
};
