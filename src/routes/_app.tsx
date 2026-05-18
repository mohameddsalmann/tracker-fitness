import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { MobileNav } from "@/components/MobileNav";
import { CommandPalette } from "@/components/CommandPalette";
import { PageTransition } from "@/components/PageTransition";
import { useAuth } from "@/lib/store";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const token = useAuth((s) => s.token);
  const user = useAuth((s) => s.user);
  const setSession = useAuth((s) => s.setSession);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  const { isError } = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.get<{ user: { id: string; email: string; name: string } }>("/auth/me"),
    enabled: !!token,
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!token) {
      navigate({ to: "/login" });
    }
  }, [token, navigate]);

  useEffect(() => {
    if (isError) logout();
  }, [isError, logout]);

  useEffect(() => {
    if (token && !user) {
      api.get<{ user: { id: string; email: string; name: string } }>("/auth/me").then((res) => {
        setSession(res.user, token);
      }).catch(() => logout());
    }
  }, [token, user, setSession, logout]);

  if (!token) return null;

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 px-4 lg:px-8 py-6 pb-28 lg:pb-10">
          <AnimatePresence mode="wait">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
      <MobileNav />
      <CommandPalette />
    </div>
  );
}
