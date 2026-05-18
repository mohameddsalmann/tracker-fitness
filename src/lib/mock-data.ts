import type { WorkoutType } from "@/lib/types";

export const MET: Record<WorkoutType, number> = {
  Strength: 6,
  Cardio: 8,
  HIIT: 10,
  Yoga: 3,
  Custom: 6,
};

export function estimateCalories(type: WorkoutType, durationMin: number, weightKg = 75) {
  const met = MET[type] ?? 6;
  return Math.round(((met * 3.5 * weightKg) / 200) * durationMin);
}
