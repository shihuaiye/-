import bcrypt from "bcryptjs";

const ROUNDS = 10;

export const isPasswordHashed = (password: string) =>
  password.startsWith("$2a$") || password.startsWith("$2b$");

export const hashPassword = async (plain: string) => bcrypt.hash(plain, ROUNDS);

export const verifyPassword = async (plain: string, stored: string) => {
  if (isPasswordHashed(stored)) {
    return bcrypt.compare(plain, stored);
  }
  return plain === stored;
};
