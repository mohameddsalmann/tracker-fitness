import { prisma } from "../lib/prisma";
import {
  getBearerToken,
  hashPassword,
  json,
  jsonError,
  readJson,
  requireUser,
  signToken,
  verifyPassword,
  verifyToken,
} from "../lib/auth";
import { loginSchema, registerSchema } from "../lib/validators";

export async function handleAuth(request: Request, subpath: string, method: string) {
  if (subpath === "register" && method === "POST") {
    const body = await readJson<unknown>(request);
    if (body instanceof Response) return body;
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) return jsonError("Email already registered", 409);

    const password = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        password,
        settings: { create: {} },
      },
    });

    const authUser = { id: user.id, email: user.email, name: user.name };
    const token = await signToken(authUser);
    return json({ user: authUser, token });
  }

  if (subpath === "login" && method === "POST") {
    const body = await readJson<unknown>(request);
    if (body instanceof Response) return body;
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid input", 400);

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || !(await verifyPassword(parsed.data.password, user.password))) {
      return jsonError("Invalid email or password", 401);
    }

    const authUser = { id: user.id, email: user.email, name: user.name };
    const token = await signToken(authUser);
    return json({ user: authUser, token });
  }

  if (subpath === "logout" && method === "POST") {
    return json({ ok: true });
  }

  if (subpath === "me" && method === "GET") {
    const auth = await requireUser(request);
    if (auth instanceof Response) return auth;
    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { id: true, email: true, name: true },
    });
    if (!user) return jsonError("User not found", 404);
    return json({ user });
  }

  if (subpath === "me" && method === "DELETE") {
    const auth = await requireUser(request);
    if (auth instanceof Response) return auth;
    await prisma.user.delete({ where: { id: auth.id } });
    return json({ ok: true });
  }

  return jsonError("Not found", 404);
}

export async function optionalUser(request: Request) {
  const token = getBearerToken(request);
  if (!token) return null;
  return verifyToken(token);
}
