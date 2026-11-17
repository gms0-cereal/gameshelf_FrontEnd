export const RATING_SYSTEM_NAMES: Record<string, string> = {
  esrb: "ESRB (North America)",
  pegi: "PEGI (Europe)",
  usk: "USK (Germany)",
  cero: "CERO (Japan)",
  grac: "GRAC (South Korea)",
  class_ind: "ClassInd (Brazil)",
  dejus: "DJCTQ (Brazil)",
  oflc: "OFLC (Australia)",
  acb: "ACB (Australia)",
};

export function formatRating(rating: string | number): string {
  return String(rating).trim() || "Not rated";
}

export function getRatingDescriptors(
  descriptors?: string | string[] | null
): string[] {
  if (!descriptors) return [];

  const rawList = Array.isArray(descriptors)
    ? descriptors
    : descriptors.split(/[,;\n]|<br\s*\/?>/i);

  return rawList
    .map((item) =>
      item
        // Strip Steam BBCode [img]...[/img] tags and raw image URLs
        .replace(/\[img\].*?\[\/img\]/gi, "")
        .replace(/https?:\/\/\S+/gi, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);
}