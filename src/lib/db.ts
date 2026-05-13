import "server-only";

// Re-export pool utilities for direct use in lib files (adminAuth, etc.)
export { pool, query, queryOne, execute, transaction } from "@/lib/db/pool";

// Re-export helpers
export { generateId, jsonSerialize } from "@/lib/db/helpers";

// Re-export types
export type {
  AdminUser,
  AdminSession,
  LoginAttempt,
  AuditLog,
  Project,
  Job,
  Application,
  Applicant,
  Contact,
  CompanyContact,
  AboutTeamFeature,
  TeamMember,
  PageView,
  PopupClick,
  PopupTemplate,
  SiteSettings,
  PopupConfig,
} from "@/lib/db/types";
