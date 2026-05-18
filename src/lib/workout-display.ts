import type { WorkoutExercise } from "@/lib/types";

export function displayExercise(e: WorkoutExercise) {
  const first = e.sets[0];
  return {
    name: e.name,
    sets: e.sets.length,
    reps: first?.reps ?? 0,
    weight: first?.weight ?? 0,
  };
}
