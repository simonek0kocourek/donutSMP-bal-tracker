export type UserId = "s1xtus" | "6PEKI9";

export const USER_IDS: UserId[] = ["s1xtus", "6PEKI9"];

export function isUserId(value: unknown): value is UserId {
  return value === "s1xtus" || value === "6PEKI9";
}

export type Session = {
  id: string;
  date: string;
  startBalance: number;
  endBalance: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  earned: number;
  hourlyRate: number;
};

export type ActiveSession = {
  startBalance: number;
  startTime: string;
};

export type UserTheme = {
  bg: string;
  accent: string;
  accentDeep: string;
  line: string;
  glow: string;
  gradientFrom: string;
  gradientTo: string;
};

export const USER_THEMES: Record<UserId, UserTheme> = {
  s1xtus: {
    bg: "#0d0a1a",
    accent: "#7c3aed",
    accentDeep: "#4c1d95",
    line: "#a78bfa",
    glow: "rgba(124, 58, 237, 0.45)",
    gradientFrom: "#6d28d9",
    gradientTo: "#4c1d95",
  },
  "6PEKI9": {
    bg: "#0a0a0a",
    accent: "#6b7280",
    accentDeep: "#1f2937",
    line: "#e5e7eb",
    glow: "rgba(107, 114, 128, 0.45)",
    gradientFrom: "#374151",
    gradientTo: "#1f2937",
  },
};

export function otherUser(user: UserId): UserId {
  return user === "s1xtus" ? "6PEKI9" : "s1xtus";
}

export type StashEntry = {
  id: string;
  itemId: string;       // e.g. "netherite_ingot"
  itemName: string;     // display name e.g. "Netherite Ingot"
  quantity: number;
  buyPriceTotal: number; // total USD paid
  buyTime: string;       // ISO string
  sellPriceTotal?: number;
  sellTime?: string;
  note?: string;
  // Crafting chain: IDs of stash entries consumed to produce this item
  consumedEntryIds?: string[];
  // Reverse link: if this entry was consumed as input for another sell
  consumedBySellId?: string;
};
