import { prisma } from "../lib/prisma";
import { json, jsonError, readJson, requireUser } from "../lib/auth";
import { serializeMeal } from "../lib/serializers";
import { mealCreateSchema } from "../lib/validators";

export async function handleMeals(request: Request, subpath: string, method: string) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  if (subpath === "" && method === "GET") {
    const url = new URL(request.url);
    const dateStr = url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
    const start = new Date(dateStr);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);

    const meals = await prisma.meal.findMany({
      where: { userId: auth.id, date: { gte: start, lte: end } },
      orderBy: { createdAt: "asc" },
    });

    return json({ items: meals.map(serializeMeal) });
  }

  if (subpath === "" && method === "POST") {
    const body = await readJson<unknown>(request);
    if (body instanceof Response) return body;
    const parsed = mealCreateSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);

    const date = parsed.data.date ? new Date(parsed.data.date) : new Date();
    const meal = await prisma.meal.create({
      data: {
        userId: auth.id,
        date,
        slot: parsed.data.slot,
        name: parsed.data.name,
        calories: Math.round(parsed.data.calories),
        protein: parsed.data.protein,
        carbs: parsed.data.carbs,
        fat: parsed.data.fat,
        quantity: parsed.data.quantity,
        unit: parsed.data.unit,
      },
    });

    return json(serializeMeal(meal), 201);
  }

  const deleteMatch = subpath.match(/^([^/]+)$/);
  if (deleteMatch && method === "DELETE") {
    const id = deleteMatch[1]!;
    const existing = await prisma.meal.findFirst({ where: { id, userId: auth.id } });
    if (!existing) return jsonError("Not found", 404);
    await prisma.meal.delete({ where: { id } });
    return json({ ok: true });
  }

  return jsonError("Not found", 404);
}
