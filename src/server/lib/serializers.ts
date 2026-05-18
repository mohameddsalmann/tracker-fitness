import type { Goal as PrismaGoal, Meal as PrismaMeal, Workout as PrismaWorkout } from "@prisma/client";
import type { Goal, Meal, Workout, WorkoutExercise } from "@/lib/types";

export function serializeWorkout(w: PrismaWorkout): Workout {
  const exercises = w.exercises as unknown as WorkoutExercise[];
  return {
    id: w.id,
    date: w.date.toISOString().slice(0, 10),
    type: w.type as Workout["type"],
    duration: w.duration,
    calories: w.calories,
    exercises,
    notes: w.notes,
  };
}

export function serializeMeal(m: PrismaMeal): Meal {
  return {
    id: m.id,
    date: m.date.toISOString().slice(0, 10),
    name: m.name,
    slot: m.slot as Meal["slot"],
    calories: m.calories,
    protein: m.protein,
    carbs: m.carbs,
    fat: m.fat,
    quantity: m.quantity,
    unit: m.unit,
    time: m.createdAt.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

export function serializeGoal(g: PrismaGoal): Goal {
  const unit =
    g.type === "Weight" ? "kg" : g.type === "Sleep" ? "h" : g.type === "Steps" ? "steps" : g.type === "Workouts" ? "sessions" : "";
  return {
    id: g.id,
    title: g.title,
    type: g.type as Goal["type"],
    target: g.target,
    current: g.current,
    unit,
    deadline: g.deadline.toISOString().slice(0, 10),
    status: g.status,
    createdAt: g.createdAt.toISOString().slice(0, 10),
  };
}

export function flattenExercisesForDisplay(exercises: WorkoutExercise[]) {
  return exercises.map((e) => {
    const first = e.sets[0];
    return {
      name: e.name,
      sets: e.sets.length,
      reps: first?.reps ?? 0,
      weight: first?.weight ?? 0,
    };
  });
}
