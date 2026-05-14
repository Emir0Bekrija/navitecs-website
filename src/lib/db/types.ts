// TypeScript interfaces for all database models.
// Mirrors prisma/schema.prisma — column names are camelCase in the DB.

export interface AdminUser {
  id: number;
  username: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminSession {
  id: string;
  userId: number;
  tokenHash: string;
  ip: string | null;
  userAgent: string | null;
  expiresAt: Date;
  absoluteExpiresAt: Date;
  createdAt: Date;
}

export interface LoginAttempt {
  id: number;
  ip: string;
  username: string | null;
  success: boolean;
  createdAt: Date;
}

export interface AuditLog {
  id: number;
  action: string;
  ip: string | null;
  username: string | null;
  userId: number | null;
  metadata: unknown;
  createdAt: Date;
}

export interface Project {
  id: string;
  title: string;
  category: string;
  location: string | null;
  projectSize: string | null;
  timeline: string | null;
  numberOfUnits: string | null;
  clientType: string | null;
  description: string;
  featuredImage: string | null;
  scopeOfWork: unknown;
  toolsAndTech: unknown;
  challenge: string | null;
  solution: string | null;
  results: unknown;
  valueDelivered: unknown;
  media: unknown;
  contentBlocks: unknown;
  status: string;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id: string;
  title: string;
  summary: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: unknown;
  active: boolean;
  isGeneral: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Application {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  linkedin: string | null;
  portfolio: string | null;
  message: string | null;
  cvFileName: string | null;
  cvPath: string | null;
  cvDeletable: boolean;
  currentlyEmployed: boolean | null;
  noticePeriod: string | null;
  yearsOfExperience: string | null;
  location: string | null;
  bimSoftware: string | null;
  consentDataSharing: boolean;
  consentFutureUse: boolean;
  submittedAt: Date;
  jobId: string | null;
  applicantId: string | null;
}

export interface Applicant {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  score: number | null;
  comments: string | null;
  fitsRoles: string | null;
  doesNotFit: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  projectType: string | null;
  service: string | null;
  projectServices: string | null;
  message: string;
  consentDataProcessing: boolean;
  submittedAt: Date;
  companyContactId: string | null;
}

export interface CompanyContact {
  id: string;
  email: string;
  name: string;
  company: string | null;
  phone: string | null;
  score: number | null;
  comments: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AboutTeamFeature {
  id: string;
  title: string;
  text: string;
  imageUrl: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  imageUrl: string | null;
  featured: boolean;
  active: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageView {
  id: number;
  path: string;
  referrer: string | null;
  createdAt: Date;
}

export interface PopupClick {
  id: number;
  linkUrl: string;
  linkTitle: string | null;
  createdAt: Date;
}

export interface PopupTemplate {
  id: number;
  name: string;
  badge: string;
  category: string;
  title: string;
  description: string;
  buttonText: string;
  linkUrl: string;
  linkType: string;
  openInNewTab: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteSettings {
  id: number;
  projectsComingSoon: boolean;
  updatedAt: Date;
}

export interface PopupConfig {
  id: number;
  enabled: boolean;
  badge: string;
  category: string;
  title: string;
  description: string;
  buttonText: string;
  linkUrl: string;
  linkType: string;
  openInNewTab: boolean;
  updatedAt: Date;
}
