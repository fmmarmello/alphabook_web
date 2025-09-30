import { Role } from "@/lib/rbac";

export interface JWTPayload {
  userId: number;
  email: string;
  name: string;
  role: Role;
  iat?: number;
  exp?: number;
}
