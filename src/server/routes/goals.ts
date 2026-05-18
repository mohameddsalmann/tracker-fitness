import { prisma } from "../lib/prisma";
import { json, jsonError, readJson, requireUser } from "../lib/auth";
import { serializeGoal } from "../lib/serializers";
import { goalCreateSchema, goalPatchSchema } from "../lib/validators";

export async function handleGoals(request: Request, subpath: string, method: string) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  if (subpath === "" && method === "GET") {
    const goals = await prisma.goal.findMany({
      where: { userId: auth.id, status: "active" },
      orderBy: { createdAt: "desc" },
    });
    return json({ items: goals.map(serializeGoal) });
  }

  if (subpath === "" && method === "POST") {
    const body = await readJson<unknown>(request);
    if (body instanceof Response) return body;
    const parsed = goalCreateSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);

    const activeCount = await prisma.goal.count({
      where: { userId: auth.id, status: "active" },
    });
    if (activeCount >= 5) {
      return jsonError("Maximum of 5 active goals allowed", 400);
    }

    const deadline = new Date(parsed.data.deadline);
    if (deadline.getTime() <= Date.now()) {
      return jsonError("Deadline must be in the future", 400);
    }

    const goal = await prisma.goal.create({
      data: {
        userId: auth.id,
        title: parsed.data.title,
        type: parsed.data.type,
        target: parsed.data.target,
        current: 0,
        deadline,
        status: "active",
      },
    });

    return json(serializeGoal(goal), 201);
  }

  const patchMatch = subpath.match(/^([^/]+)$/);
  if (patchMatch && method === "PATCH") {
    const id = patchMatch[1]!;
    const body = await readJson<unknown>(request);
    if (body instanceof Response) return body;
    const parsed = goalPatchSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);

    const existing = await prisma.goal.findFirst({ where: { id, userId: auth.id } });
    if (!existing) return jsonError("Not found", 404);

    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...(parsed.data.current !== undefined ? { current: parsed.data.current } : {}),
        ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      },
    });

    return json(serializeGoal(goal));
  }

  if (patchMatch && method === "DELETE") {
    const id = patchMatch[1]!;
    const existing = await prisma.goal.findFirst({ where: { id, userId: auth.id } });
    if (!existing) return jsonError("Not found", 404);
    await prisma.goal.delete({ where: { id } });
    return json({ ok: true });
  }

  return jsonError("Not found", 404);
}
