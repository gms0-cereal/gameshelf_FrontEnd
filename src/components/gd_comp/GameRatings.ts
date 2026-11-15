
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

  if (Array.isArray(descriptors)) {
    return descriptors.map((item) => item.trim()).filter(Boolean);
  }

  return descriptors
    .split(/[,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
