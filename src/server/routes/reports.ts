import { prisma } from "../lib/prisma";
import { json, requireUser } from "../lib/auth";
import { serializeWorkout } from "../lib/serializers";

export async function handleReports(request: Request) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const days = Number(url.searchParams.get("days") ?? 30);
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);

  const [workouts, meals] = await Promise.all([
    prisma.workout.findMany({
      where: { userId: auth.id, date: { gte: from } },
      orderBy: { date: "desc" },
    }),
    prisma.meal.findMany({
      where: { userId: auth.id, date: { gte: from } },
    }),
  ]);

  const totals = {
    workouts: workouts.length,
    minutes: workouts.reduce((a, w) => a + w.duration, 0),
    calories: workouts.reduce((a, w) => a + w.calories, 0),
    avgKcalDay: meals.length
      ? Math.round(meals.reduce((a, m) => a + m.calories, 0) / Math.max(1, Math.ceil(days / 7)))
      : 0,
  };

  const weekly = Array.from({ length: 4 }).map((_, i) => {
    const start = 28 - i * 7;
    const slice = workouts.filter((w) => {
      const dayOffset = Math.floor((Date.now() - w.date.getTime()) / 86400000);
      return dayOffset >= start - 7 && dayOffset < start;
    });
    return {
      week: `W${4 - i}`,
      minutes: slice.reduce((a, w) => a + w.duration, 0),
      calories: slice.reduce((a, w) => a + w.calories, 0),
    };
  }).reverse();

  return json({
    totals,
    weekly,
    workouts: workouts.map(serializeWorkout),
  });
}
