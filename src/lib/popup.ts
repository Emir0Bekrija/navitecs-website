import "server-only";
import * as popupConfigRepo from "@/lib/db/repositories/popupConfig";
import * as popupTemplateRepo from "@/lib/db/repositories/popupTemplate";

export type PopupConfig = {
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
};

const DEFAULT: PopupConfig = {
  id: 1,
  enabled: false,
  badge: "INSIGHT",
  category: "",
  title: "New BIM Coordination Insight",
  description:
    "See how coordinated Revit models help reduce clashes, improve documentation accuracy, and streamline collaboration across architectural, structural, and MEP teams.",
  buttonText: "Read the article",
  linkUrl: "",
  linkType: "external",
  openInNewTab: true,
};

function serialize(row: Awaited<ReturnType<typeof popupConfigRepo.findUnique>>): PopupConfig {
  if (!row) return DEFAULT;
  return {
    id: row.id,
    enabled: row.enabled,
    badge: row.badge,
    category: row.category,
    title: row.title,
    description: row.description,
    buttonText: row.buttonText,
    linkUrl: row.linkUrl,
    linkType: row.linkType,
    openInNewTab: row.openInNewTab,
  };
}

export async function getPopupConfig(): Promise<PopupConfig> {
  const row = await popupConfigRepo.findUnique();
  return serialize(row);
}

export async function savePopupConfig(data: Partial<Omit<PopupConfig, "id">>): Promise<PopupConfig> {
  const row = await popupConfigRepo.upsert(data);
  return serialize(row);
}

// ── Templates ─────────────────────────────────────────────────────────────────

export type PopupTemplate = {
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
  createdAt: string;
};

function serializeTemplate(row: {
  id: number; name: string; badge: string; category: string; title: string;
  description: string; buttonText: string; linkUrl: string; linkType: string;
  openInNewTab: boolean; createdAt: Date;
}): PopupTemplate {
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export async function listPopupTemplates(): Promise<PopupTemplate[]> {
  const rows = await popupTemplateRepo.findMany({ field: "createdAt", dir: "DESC" });
  return rows.map(serializeTemplate);
}

export async function createPopupTemplate(data: Omit<PopupTemplate, "id" | "createdAt">): Promise<PopupTemplate> {
  const row = await popupTemplateRepo.create(data);
  return serializeTemplate(row);
}

export async function updatePopupTemplate(id: number, data: Partial<Omit<PopupTemplate, "id" | "createdAt">>): Promise<PopupTemplate> {
  const row = await popupTemplateRepo.update(id, data);
  return serializeTemplate(row);
}

export async function deletePopupTemplate(id: number): Promise<void> {
  await popupTemplateRepo.remove(id);
}
