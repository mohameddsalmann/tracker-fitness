import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleApiRequest } from "../src/server/handler";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const protocol = (req.headers["x-forwarded-proto"] as string) ?? "https";
  const host = req.headers.host ?? "localhost";
  const url = `${protocol}://${host}${req.url ?? "/api"}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) headers.set(key, value.join(", "));
    else headers.set(key, value);
  }

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
    body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  }

  const request = new Request(url, { method: req.method, headers, body });
  const response = await handleApiRequest(request);

  res.status(response.status);
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") return;
    res.setHeader(key, value);
  });

  const text = await response.text();
  res.send(text);
}
