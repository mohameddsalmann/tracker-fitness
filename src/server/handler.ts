import { handleAuth } from "./routes/auth";
import { handleDashboard } from "./routes/dashboard";
import { handleFoods } from "./routes/foods";
import { handleGoals } from "./routes/goals";
import { handleMeals } from "./routes/meals";
import { handleReports } from "./routes/reports";
import { handleSeed } from "./routes/seed";
import { handleSettings } from "./routes/settings";
import { handleWorkouts } from "./routes/workouts";
import { jsonError } from "./lib/auth";

export async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  let pathname = url.pathname;

  if (pathname.startsWith("/api")) {
    pathname = pathname.slice(4) || "/";
  }
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;

  const segments = pathname.split("/").filter(Boolean);
  const resource = segments[0] ?? "";
  const subpath = segments.slice(1).join("/");
  const method = request.method;

  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  try {
    let response: Response;

    switch (resource) {
      case "auth":
        response = await handleAuth(request, subpath, method);
        break;
      case "workouts":
        response = await handleWorkouts(request, subpath, method);
        break;
      case "meals":
        response = await handleMeals(request, subpath, method);
        break;
      case "goals":
        response = await handleGoals(request, subpath, method);
        break;
      case "settings":
        response = await handleSettings(request, subpath, method);
        break;
      case "dashboard":
        if (method !== "GET") return jsonError("Method not allowed", 405);
        response = await handleDashboard(request);
        break;
      case "reports":
        if (method !== "GET") return jsonError("Method not allowed", 405);
        response = await handleReports(request);
        break;
      case "foods":
        if (method !== "GET") return jsonError("Method not allowed", 405);
        response = await handleFoods(request);
        break;
      case "seed":
        response = await handleSeed(request);
        break;
      default:
        response = jsonError("Not found", 404);
    }

    return withCors(response);
  } catch (error) {
    console.error("[api]", error);
    return withCors(jsonError("Internal server error", 500));
  }
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "access-control-allow-headers": "Content-Type, Authorization",
  };
}

function withCors(response: Response) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders()).forEach(([k, v]) => headers.set(k, v));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
