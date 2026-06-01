import type { User } from "@secondhand/shared/src/index.js";
import { getPool } from "../db/pool.js";
import { rowToUser } from "./mappers.js";

export const readUsers = async (): Promise<User[]> => {
  const [rows] = await getPool().query("SELECT * FROM users");
  return rows.map(rowToUser);
};

export const findUserById = async (id: string): Promise<User | null> => {
  const [rows] = await getPool().query("SELECT * FROM users WHERE id = ?", [id]);
  return rows.length > 0 ? rowToUser(rows[0]) : null;
};

export const findUserByUsername = async (username: string): Promise<User | null> => {
  const [rows] = await getPool().query("SELECT * FROM users WHERE username = ?", [
    username,
  ]);
  return rows.length > 0 ? rowToUser(rows[0]) : null;
};

export const createUser = async (user: User): Promise<User> => {
  await getPool().query(
    "INSERT INTO users (id, username, password, role, status, reviewNote, quickReplies, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      user.id,
      user.username,
      user.password,
      user.role,
      user.status,
      user.reviewNote || null,
      user.quickReplies ? JSON.stringify(user.quickReplies) : null,
      new Date(user.createdAt),
    ],
  );
  return user;
};

export const updateUser = async (id: string, fields: Partial<User>): Promise<void> => {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (fields.username !== undefined) {
    sets.push("username = ?");
    values.push(fields.username);
  }
  if (fields.password !== undefined) {
    sets.push("password = ?");
    values.push(fields.password);
  }
  if (fields.role !== undefined) {
    sets.push("role = ?");
    values.push(fields.role);
  }
  if (fields.status !== undefined) {
    sets.push("status = ?");
    values.push(fields.status);
  }
  if (fields.reviewNote !== undefined) {
    sets.push("reviewNote = ?");
    values.push(fields.reviewNote);
  }
  if (fields.quickReplies !== undefined) {
    sets.push("quickReplies = ?");
    values.push(JSON.stringify(fields.quickReplies));
  }
  if (sets.length === 0) return;
  values.push(id);
  await getPool().query(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, values);
};

export const deleteUser = async (id: string): Promise<void> => {
  await getPool().query("DELETE FROM users WHERE id = ?", [id]);
};

export const getQuickReplies = async (userId: string): Promise<string[]> => {
  const user = await findUserById(userId);
  return user?.quickReplies ?? [];
};

export const setQuickReplies = async (userId: string, custom: string[]): Promise<string[]> => {
  const cleaned = custom.map((s) => s.trim()).filter(Boolean).slice(0, 12);
  await updateUser(userId, { quickReplies: cleaned });
  return cleaned;
};
