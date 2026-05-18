import type { Plugin } from "vite";
import { handleApiRequest } from "../src/server/handler";

export function apiDevPlugin(): Plugin {
  return {
    name: "fitpulse-api-dev",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api")) {
          next();
          return;
        }

        try {
          const protocol = "http";
          const host = req.headers.host ?? "localhost";
          const url = `${protocol}://${host}${req.url}`;

          const chunks: Buffer[] = [];
          await new Promise<void>((resolve, reject) => {
            req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
            req.on("end", () => resolve());
            req.on("error", reject);
          });

          const body = chunks.length ? Buffer.concat(chunks).toString("utf8") : undefined;
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (value === undefined) continue;
            headers.set(key, Array.isArray(value) ? value.join(", ") : value);
          }

          const request = new Request(url, {
            method: req.method,
            headers,
            body: req.method !== "GET" && req.method !== "HEAD" ? body : undefined,
          });

          const response = await handleApiRequest(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => {
            if (key.toLowerCase() === "transfer-encoding") return;
            res.setHeader(key, value);
          });
          const text = await response.text();
          res.end(text);
        } catch (error) {
          console.error("[api-dev]", error);
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      });
    },
  };
}
