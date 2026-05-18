import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain uppercase")
  .regex(/[a-z]/, "Must contain lowercase")
  .regex(/[0-9]/, "Must contain a digit");

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const workoutCreateSchema = z.object({
  type: z.enum(["Strength", "Cardio", "HIIT", "Yoga", "Custom"]),
  duration: z.coerce.number().min(1),
  date: z.string().optional(),
  notes: z.string().optional(),
  exercises: z
    .array(
      z.object({
        name: z.string().min(1),
        sets: z.coerce.number().min(1),
        reps: z.coerce.number().min(1),
        weight: z.coerce.number().min(0),
      }),
    )
    .min(1),
});

export const mealCreateSchema = z.object({
  name: z.string().min(1),
  slot: z.enum(["Breakfast", "Lunch", "Dinner", "Snack"]).default("Snack"),
  date: z.string().optional(),
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fat: z.coerce.number().min(0),
  quantity: z.coerce.number().min(0.1).default(1),
  unit: z.string().default("serving"),
});

export const goalCreateSchema = z.object({
  title: z.string().min(2),
  type: z.enum(["Weight", "Steps", "Workouts", "Calories", "Sleep"]),
  target: z.coerce.number().positive(),
  deadline: z.string(),
});

export const goalPatchSchema = z.object({
  current: z.coerce.number().min(0).optional(),
  status: z.enum(["active", "paused", "archived"]).optional(),
});

export const settingsPatchSchema = z.object({
  dietType: z.string().optional(),
  allergens: z.array(z.string()).optional(),
  calorieTarget: z.coerce.number().min(800).max(10000).optional(),
  notifyPush: z.boolean().optional(),
  notifyEmail: z.boolean().optional(),
  quietHoursOn: z.boolean().optional(),
  quietStart: z.string().optional(),
  quietEnd: z.string().optional(),
});
