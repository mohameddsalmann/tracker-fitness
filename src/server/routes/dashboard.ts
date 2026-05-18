import { prisma } from "../lib/prisma";
import { json, requireUser } from "../lib/auth";
import { serializeGoal, serializeWorkout } from "../lib/serializers";

export async function handleDashboard(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const startOfDay = new Date(todayStr);
  const endOfDay = new Date(todayStr);
  endOfDay.setHours(23, 59, 59, 999);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const [settings, todayMeals, weekWorkouts, recentWorkouts, goals, workoutCount] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId: auth.id } }),
    prisma.meal.findMany({
      where: { userId: auth.id, date: { gte: startOfDay, lte: endOfDay } },
    }),
    prisma.workout.findMany({
      where: { userId: auth.id, date: { gte: weekStart } },
      orderBy: { date: "asc" },
    }),
    prisma.workout.findMany({
      where: { userId: auth.id },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.goal.findMany({
      where: { userId: auth.id, status: "active" },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.workout.count({ where: { userId: auth.id } }),
  ]);

  const calories = todayMeals.reduce((a, m) => a + m.calories, 0);
  const protein = todayMeals.reduce((a, m) => a + m.protein, 0);
  const carbs = todayMeals.reduce((a, m) => a + m.carbs, 0);
  const fat = todayMeals.reduce((a, m) => a + m.fat, 0);

  const calorieTarget = settings?.calorieTarget ?? 2000;
  const proteinTarget = Math.round(calorieTarget * 0.3) / 4;
  const carbsTarget = Math.round(calorieTarget * 0.45) / 4;
  const fatTarget = Math.round(calorieTarget * 0.25) / 9;

  const activeMinutes = weekWorkouts
    .filter((w) => w.date.toISOString().slice(0, 10) === todayStr)
    .reduce((a, w) => a + w.duration, 0);

  const weeklyBars: { day: string; minutes: number; calories: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const day = d.toLocaleDateString("en", { weekday: "short" });
    const dayWorkouts = weekWorkouts.filter((w) => w.date.toISOString().slice(0, 10) === iso);
    weeklyBars.push({
      day,
      minutes: dayWorkouts.reduce((a, w) => a + w.duration, 0),
      calories: dayWorkouts.reduce((a, w) => a + w.calories, 0),
    });
  }

  return json({
    stats: {
      calories,
      protein,
      carbs,
      fat,
      steps: 8420,
      activeMinutes,
      sleep: 7.4,
      water: 0,
    },
    macroTargets: {
      calories: calorieTarget,
      protein: proteinTarget,
      carbs: carbsTarget,
      fat: fatTarget,
    },
    weeklyBars,
    recentWorkouts: recentWorkouts.map(serializeWorkout),
    goals: goals.map(serializeGoal),
    isEmpty: workoutCount === 0 && todayMeals.length === 0,
  });
}
