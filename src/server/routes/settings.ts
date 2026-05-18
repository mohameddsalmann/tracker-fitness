import { prisma } from "../lib/prisma";
import { json, jsonError, readJson, requireUser } from "../lib/auth";
import { settingsPatchSchema } from "../lib/validators";

function serializeSettings(s: {
  dietType: string;
  allergens: string[];
  calorieTarget: number;
  notifyPush: boolean;
  notifyEmail: boolean;
  quietHoursOn: boolean;
  quietStart: string;
  quietEnd: string;
}) {
  return {
    dietType: s.dietType,
    allergens: s.allergens,
    calorieTarget: s.calorieTarget,
    notifyPush: s.notifyPush,
    notifyEmail: s.notifyEmail,
    quietHoursOn: s.quietHoursOn,
    quietStart: s.quietStart,
    quietEnd: s.quietEnd,
  };
}

export async function handleSettings(request: Request, subpath: string, method: string) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  if (subpath === "" && method === "GET") {
    let settings = await prisma.userSettings.findUnique({ where: { userId: auth.id } });
    if (!settings) {
      settings = await prisma.userSettings.create({ data: { userId: auth.id } });
    }
    return json(serializeSettings(settings));
  }

  if (subpath === "" && method === "PATCH") {
    const body = await readJson<unknown>(request);
    if (body instanceof Response) return body;
    const parsed = settingsPatchSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);

    const settings = await prisma.userSettings.upsert({
      where: { userId: auth.id },
      create: { userId: auth.id, ...parsed.data },
      update: parsed.data,
    });

    return json(serializeSettings(settings));
  }

  return jsonError("Not found", 404);
}
