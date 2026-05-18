import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LayoutDashboard, History, Plus, Apple, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { isNavActive } from "@/lib/nav-utils";

type NavItem = { to: string; icon: typeof LayoutDashboard; label: string; primary?: boolean };
const items: NavItem[] = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/workouts", icon: History, label: "Workouts" },
  { to: "/workouts/log", icon: Plus, label: "Log", primary: true },
  { to: "/nutrition", icon: Apple, label: "Food" },
  { to: "/goals", icon: Target, label: "Goals" },
];

export function MobileNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass-strong border-t border-border">
      <ul className="flex items-center justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        {items.map((it) => {
          const Icon = it.icon;
          const active = isNavActive(path, it.to);
          if (it.primary) {
            return (
              <li key={it.to}>
                <Link to={it.to} className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-glow">
                  <Icon className="h-6 w-6" />
                </Link>
              </li>
            );
          }
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-3 py-2 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {it.label}
                {active && (
                  <motion.span layoutId="mobile-active" className="absolute -bottom-0.5 h-1 w-6 rounded-full bg-primary" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
