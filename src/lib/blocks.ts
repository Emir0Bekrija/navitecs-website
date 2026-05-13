// ── Block system ────────────────────────────────────────────────────────────────

export const FIXED_BLOCK_TYPES = ["challenge", "solution", "results"] as const;
export type FixedBlockType = (typeof FIXED_BLOCK_TYPES)[number];

export const CONTENT_BLOCK_TYPES = [
  "text",
  "image",
  "gallery",
  "challenge",
  "solution",
  "results",
  "value-delivered",
  "bim-embed",
  "video",
  "before-after",
  "cta",
] as const;

export type ContentBlockType = (typeof CONTENT_BLOCK_TYPES)[number];

export type ContentBlock = {
  id: string;
  type: ContentBlockType;
  order: number;
  data: Record<string, unknown>;
};

export const BLOCK_TYPE_LABELS: Record<ContentBlockType, string> = {
  text: "Text",
  image: "Image",
  gallery: "Image Gallery",
  challenge: "The Challenge",
  solution: "The Solution",
  results: "Impact & Results",
  "value-delivered": "Value Delivered",
  "bim-embed": "BIM / 3D Model Embed",
  video: "Video",
  "before-after": "Before / After",
  cta: "Call to Action",
};

export function createBlock(type: ContentBlockType, order: number): ContentBlock {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const defaults: Record<ContentBlockType, Record<string, unknown>> = {
    text: { content: "" },
    image: { url: "", caption: "", alt: "" },
    gallery: { images: [] },
    challenge: {},
    solution: {},
    results: {},
    "value-delivered": { items: [] },
    "bim-embed": { url: "", title: "", height: 500 },
    video: { url: "", title: "", poster: "" },
    "before-after": { beforeUrl: "", afterUrl: "", beforeLabel: "Before", afterLabel: "After" },
    cta: {
      heading: "Ready to start your project?",
      subtext: "Partner with us to bring your vision to life through innovative BIM coordination.",
      buttonText: "Contact Us",
      buttonHref: "/contact",
    },
  };

  return { id, type, order, data: defaults[type] };
}

export function blockSummary(block: ContentBlock): string {
  const d = block.data;
  switch (block.type) {
    case "text":
      return String(d.content ?? "").slice(0, 80) || "Empty text block";
    case "image":
      return String(d.url ?? "").replace(/^https?:\/\//, "").slice(0, 80) || "No image URL";
    case "gallery": {
      const imgs = (d.images as unknown[]) ?? [];
      return `${imgs.length} image${imgs.length !== 1 ? "s" : ""}`;
    }
    case "challenge":
      return "Displays the project challenge text";
    case "solution":
      return "Displays the project solution text";
    case "results":
      return "Displays the impact & results list";
    case "value-delivered": {
      const items = (d.items as unknown[]) ?? [];
      return items.length
        ? `${items.length} item${items.length !== 1 ? "s" : ""}`
        : "Uses value delivered list";
    }
    case "bim-embed":
      return String(d.url ?? "").replace(/^https?:\/\//, "").slice(0, 80) || "No embed URL";
    case "video":
      return String(d.url ?? "").replace(/^https?:\/\//, "").slice(0, 80) || "No video URL";
    case "before-after":
      return `${String(d.beforeLabel ?? "Before")} / ${String(d.afterLabel ?? "After")}`;
    case "cta":
      return String(d.heading ?? "").slice(0, 80);
  }
}
