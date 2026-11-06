type WithBirthday = { birth_day?: string | null } | null | undefined;

/** Where users go to add or change their birthday. */
export const BIRTHDAY_PATH = "/profile/edit";

export function getBirthday(user: WithBirthday): string | null {
  return user?.birth_day ?? null;
}

export function ageFrom(birth?: string | null): number | null {
  if (!birth) return null;
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const beforeBirthday =
    now.getMonth() < b.getMonth() ||
    (now.getMonth() === b.getMonth() && now.getDate() < b.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}