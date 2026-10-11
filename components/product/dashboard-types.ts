import type { ProfileChecklistItem } from "@/lib/profile";

export type ChecklistSummary = {
  completedCount: number;
  isComplete: boolean;
  items: ProfileChecklistItem[];
  percentage: number;
  remainingItems: ProfileChecklistItem[];
  totalCount: number;
};
