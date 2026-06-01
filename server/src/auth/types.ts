import { Request } from "express";
import type { UserRole } from "@secondhand/shared/src/index.js";

export interface AuthedRequest extends Request {
  userId?: string;
  role?: UserRole;
}
