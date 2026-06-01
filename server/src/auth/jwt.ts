import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { UserRole } from "@secondhand/shared/src/index.js";

export type JwtPayload = {
  userId: string;
  role: UserRole;
};

export const signToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, env.jwtSecret) as JwtPayload;
