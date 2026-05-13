export type { ContentBlock, ContentBlockType } from "@/lib/blocks";
import type { ContentBlock } from "@/lib/blocks";

// ── Projects ───────────────────────────────────────────────────────────────────

export type MediaItem = {
  url: string;
  caption?: string;
  type?: "image" | "video";
};

export type Project = {
  id: string;
  title: string;
  category: string;
  location?: string | null;
  projectSize?: string | null;
  timeline?: string | null;
  numberOfUnits?: string | null;
  clientType?: string | null;
  description: string;
  featuredImage?: string | null;
  scopeOfWork: string[];
  toolsAndTech: string[];
  challenge?: string | null;
  solution?: string | null;
  results: string[];
  valueDelivered: string[];
  media: MediaItem[];
  contentBlocks: ContentBlock[];
  status: "draft" | "published";
  featured: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};

// ── Jobs ───────────────────────────────────────────────────────────────────────

export type Job = {
  id: string;
  title: string;
  summary: string;
  department: string;
  location: string;
  type: string;
  description: string;
  active: boolean;
  isGeneral: boolean;
  createdAt: string;
  requirements?: string[];
};

// ── Applications ───────────────────────────────────────────────────────────────

export type ApplicantRanking = {
  id: string;
  score: number | null;
  comments: string | null;
  fitsRoles: string | null;
  doesNotFit: string | null;
  _count: { applications: number };
};

export type Application = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  linkedin: string;
  portfolio: string;
  message: string;
  cvFileName?: string;
  submittedAt: string;
  job?: { id: string; title: string } | null;
  applicant?: ApplicantRanking | null;
};

// Grouped applicant types (used by admin applications page)
export type ApplicationEntry = {
  id: string;
  role: string;
  submittedAt: string;
  cvFileName?: string | null;
  cvDeletable: boolean;
  message?: string | null;
  phone: string;
  linkedin?: string | null;
  portfolio?: string | null;
  job?: { id: string; title: string } | null;
  currentlyEmployed?: boolean | null;
  noticePeriod?: string | null;
  yearsOfExperience?: string | null;
  location?: string | null;
  bimSoftware?: string | null;
};

export type GroupedApplicant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  score: number | null;
  comments: string | null;
  fitsRoles: string | null;
  doesNotFit: string | null;
  applications: ApplicationEntry[];
};

// ── About Team Feature ────────────────────────────────────────────────────────

export type AboutTeamFeature = {
  id: string;
  title: string;
  text: string;
  imageUrl?: string | null;
  enabled: boolean;
};

// ── Team Members ──────────────────────────────────────────────────────────────

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio?: string | null;
  imageUrl?: string | null;
  featured: boolean;
  active: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CompanyContactRanking = {
  id: string;
  score: number | null;
  comments: string | null;
};

export type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  projectType: string;
  service?: string | null;
  projectServices?: string | null;
  message: string;
  submittedAt: string;
  companyContact?: CompanyContactRanking | null;
};
