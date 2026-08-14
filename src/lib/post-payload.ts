import matter from "gray-matter";

export type PostPayload = {
  title: string;
  date: string;
  description: string;
  category: string;
  slug: string;
  cover: string;
  content: string;
};

function stringValue(value: unknown, fallback = "") {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function normalizeCategory(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => stringValue(item).trim()).filter(Boolean).join(", ");
  }
  return stringValue(value);
}

export function normalizePostSlug(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function derivePostSlug(explicit: string, date: string, uniqueValue = crypto.randomUUID()) {
  const explicitSlug = normalizePostSlug(explicit);
  if (explicitSlug) return explicitSlug;

  const datePart = (date || new Date().toISOString().slice(0, 10)).replace(/-/g, "").slice(2);
  const uniquePart = normalizePostSlug(uniqueValue).replace(/-/g, "").slice(0, 8) || "post";
  return `${datePart || "post"}-${uniquePart}`;
}

export function firstMarkdownHeading(content: string) {
  let fence: { marker: string; length: number } | null = null;

  for (const line of content.replace(/\r\n/g, "\n").split("\n")) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1][0];
      const length = fenceMatch[1].length;
      if (!fence) fence = { marker, length };
      else if (marker === fence.marker && length >= fence.length) fence = null;
      continue;
    }

    if (fence) continue;
    const heading = line.match(/^#\s+(.+)$/);
    if (heading?.[1]) return heading[1].trim();
  }

  return "";
}

export function postPayloadFromJson(
  body: Record<string, unknown>,
  uniqueValue?: string,
): PostPayload {
  const date = stringValue(body.date).split("T")[0] || new Date().toISOString().slice(0, 10);
  const content = stringValue(body.content);
  return {
    title: stringValue(body.title) || firstMarkdownHeading(content) || "Untitled",
    date,
    description: stringValue(body.description),
    category: normalizeCategory(body.category),
    slug: derivePostSlug(stringValue(body.slug), date, uniqueValue),
    cover: stringValue(body.cover),
    content,
  };
}

export function postPayloadFromMarkdown(raw: string, uniqueValue?: string): PostPayload {
  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;
  const content = parsed.content;
  const date = stringValue(data.date).split("T")[0] || new Date().toISOString().slice(0, 10);
  return {
    title: stringValue(data.title) || firstMarkdownHeading(content) || "Untitled",
    date,
    description: stringValue(data.description),
    category: normalizeCategory(data.category ?? data.categories),
    slug: derivePostSlug(stringValue(data.slug), date, uniqueValue),
    cover: stringValue(data.cover),
    content,
  };
}
