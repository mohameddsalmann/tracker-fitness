import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { estimateCalories } from "./calories";
import type { WorkoutType } from "@/lib/types";

const exerciseLibrary: Record<string, string[]> = {
  Strength: ["Bench Press", "Squat", "Deadlift", "Pull-ups", "Overhead Press"],
  Cardio: ["Treadmill Run", "Cycling", "Rowing", "Elliptical"],
  HIIT: ["Burpees", "Mountain Climbers", "Kettlebell Swings", "Box Jumps"],
  Yoga: ["Sun Salutation", "Warrior Flow", "Vinyasa", "Hatha Flow"],
};

const mealPresets = [
  { name: "Oatmeal & Berries", slot: "Breakfast", calories: 380, protein: 14, carbs: 62, fat: 8 },
  { name: "Grilled Chicken Salad", slot: "Lunch", calories: 520, protein: 42, carbs: 28, fat: 22 },
  { name: "Salmon & Quinoa", slot: "Dinner", calories: 620, protein: 38, carbs: 55, fat: 24 },
  { name: "Protein Shake", slot: "Snack", calories: 220, protein: 28, carbs: 18, fat: 4 },
];

export async function seedUserData(userId: string) {
  const existing = await prisma.workout.count({ where: { userId } });
  if (existing > 0) return { seeded: false, reason: "already_has_data" as const };

  const types: WorkoutType[] = ["Strength", "Cardio", "HIIT", "Yoga"];
  const today = new Date();

  for (let i = 13; i >= 0; i--) {
    if (Math.random() < 0.25) continue;
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const type = types[Math.floor(Math.random() * types.length)]!;
    const duration = 25 + Math.floor(Math.random() * 45);
    const lib = exerciseLibrary[type] ?? exerciseLibrary.Strength;
    const exCount = 3 + Math.floor(Math.random() * 2);
    const exercises = Array.from({ length: exCount }, () => {
      const sets = 3 + Math.floor(Math.random() * 2);
      const reps = 6 + Math.floor(Math.random() * 8);
      const weight = type === "Strength" ? 20 + Math.floor(Math.random() * 60) : 0;
      return {
        name: lib[Math.floor(Math.random() * lib.length)]!,
        sets: Array.from({ length: sets }, () => ({ reps, weight })),
      };
    });

    await prisma.workout.create({
      data: {
        userId,
        date: d,
        type,
        duration,
        calories: estimateCalories(type, duration),
        exercises: exercises as unknown as Prisma.InputJsonValue,
      },
    });
  }

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const count = 2 + Math.floor(Math.random() * 2);
    for (let m = 0; m < count; m++) {
      const p = mealPresets[Math.floor(Math.random() * mealPresets.length)]!;
      await prisma.meal.create({
        data: {
          userId,
          date: d,
          slot: p.slot,
          name: p.name,
          calories: p.calories,
          protein: p.protein,
          carbs: p.carbs,
          fat: p.fat,
          quantity: 1,
          unit: "serving",
        },
      });
    }
  }

  const goalCount = await prisma.goal.count({ where: { userId, status: "active" } });
  if (goalCount === 0) {
    await prisma.goal.createMany({
      data: [
        {
          userId,
          title: "Hit 10k steps daily",
          type: "Steps",
          target: 10000,
          current: 8420,
          deadline: new Date(Date.now() + 60 * 86400000),
        },
        {
          userId,
          title: "5 workouts per week",
          type: "Workouts",
          target: 5,
          current: 3,
          deadline: new Date(Date.now() + 30 * 86400000),
        },
      ],
    });
  }

  return { seeded: true as const };
}
