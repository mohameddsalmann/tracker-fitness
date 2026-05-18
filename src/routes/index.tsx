import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Client-side redirect; auth state lives in localStorage via zustand persist
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("fitpulse-auth");
      try {
        const parsed = raw ? JSON.parse(raw) : null;
        const hasToken = !!parsed?.state?.token;
        throw redirect({ to: hasToken ? "/dashboard" : "/login" });
      } catch (e) {
        if (e && typeof e === "object" && "to" in (e as object)) throw e;
        throw redirect({ to: "/login" });
      }
    }
    throw redirect({ to: "/login" });
  },
});
