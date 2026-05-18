import { json, requireUser } from "../lib/auth";
import { seedUserData } from "../lib/seed";

export async function handleSeed(request: Request) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  const result = await seedUserData(auth.id);
  return json(result);
}
