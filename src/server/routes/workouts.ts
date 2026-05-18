import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { estimateCalories } from "../lib/calories";
import { json, jsonError, readJson, requireUser } from "../lib/auth";
import { serializeWorkout } from "../lib/serializers";
import { workoutCreateSchema } from "../lib/validators";
import type { WorkoutExercise } from "@/lib/types";

export async function handleWorkouts(request: Request, subpath: string, method: string) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  if (subpath === "" && method === "GET") {
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const type = url.searchParams.get("type");
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = 20;

    const where: {
      userId: string;
      date?: { gte?: Date; lte?: Date };
      type?: string;
    } = { userId: auth.id };

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    if (type && type !== "All") where.type = type;

    const [items, total] = await Promise.all([
      prisma.workout.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.workout.count({ where }),
    ]);

    return json({
      items: items.map(serializeWorkout),
      total,
      page,
      pageSize,
    });
  }

  if (subpath === "" && method === "POST") {
    const body = await readJson<unknown>(request);
    if (body instanceof Response) return body;
    const parsed = workoutCreateSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);

    const exercises: WorkoutExercise[] = parsed.data.exercises.map((e) => ({
      name: e.name,
      sets: Array.from({ length: e.sets }, () => ({ reps: e.reps, weight: e.weight })),
    }));

    const date = parsed.data.date ? new Date(parsed.data.date) : new Date();
    const calories = estimateCalories(parsed.data.type, parsed.data.duration);

    const workout = await prisma.workout.create({
      data: {
        userId: auth.id,
        date,
        type: parsed.data.type,
        duration: parsed.data.duration,
        calories,
        notes: parsed.data.notes,
        exercises: exercises as unknown as Prisma.InputJsonValue,
      },
    });

    return json(serializeWorkout(workout), 201);
  }

  const deleteMatch = subpath.match(/^([^/]+)$/);
  if (deleteMatch && method === "DELETE") {
    const id = deleteMatch[1]!;
    const existing = await prisma.workout.findFirst({ where: { id, userId: auth.id } });
    if (!existing) return jsonError("Not found", 404);
    await prisma.workout.delete({ where: { id } });
    return json({ ok: true });
  }

  return jsonError("Not found", 404);
}
