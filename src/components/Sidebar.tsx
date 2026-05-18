import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Dumbbell,
  History,
  Apple,
  Target,
  BarChart3,
  Settings,
  Activity,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useUI } from "@/lib/store";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/workouts", icon: History, label: "Workouts" },
  { to: "/workouts/log", icon: Dumbbell, label: "Log Workout" },
  { to: "/nutrition", icon: Apple, label: "Nutrition" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
] as const;

export function Sidebar() {
  const collapsed = useUI((s) => s.sidebarCollapsed);
  const toggle = useUI((s) => s.toggleSidebar);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 248 }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className="hidden lg:flex sticky top-0 h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground overflow-hidden"
    >
      <div className="flex h-16 items-center gap-2 px-5">
        <motion.div
          layoutId="brand-logo"
          className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow"
        >
          <Activity className="h-5 w-5 text-primary-foreground" />
        </motion.div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="text-lg font-semibold tracking-tight"
            >
              FitPulse
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {nav.map((item) => {
          const active = path === item.to || (item.to !== "/workouts" && path.startsWith(item.to + "/")) || (item.to === "/workouts" && path === "/workouts");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary to-primary/80 shadow-glow"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                />
              )}
              <Icon className="relative h-[18px] w-[18px] shrink-0" />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="relative truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggle}
        className="m-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </motion.aside>
  );
}
