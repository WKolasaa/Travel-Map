export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
export const ADMIN_SESSION_COOKIE = "tm_admin_session";
export const ADMIN_SESSION_MAX_AGE = Number(process.env.SESSION_TTL_SECONDS ?? 60 * 60 * 24);

export type AdminRole = "viewer" | "editor" | "admin";
export type AdminGroupStatus = "active" | "archived";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};

export type AdminGroup = {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: AdminGroupStatus;
  memberCount: number;
  createdAt: string;
  updatedAt?: string;
  memberIds: string[];
};

export type AdminDirectoryUser = AdminUser & {
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  groups: AdminGroup[];
};
