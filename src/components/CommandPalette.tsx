import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { LayoutDashboard, Dumbbell, Apple, Target, BarChart3, Settings, History } from "lucide-react";
import { useUI } from "@/lib/store";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { Workout } from "@/lib/types";

const items = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/workouts", icon: History, label: "Workout History" },
  { to: "/workouts/log", icon: Dumbbell, label: "Log Workout" },
  { to: "/nutrition", icon: Apple, label: "Nutrition" },
  { to: "/goals", icon: Target, label: "Goals" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
] as const;

export function CommandPalette() {
  const open = useUI((s) => s.commandOpen);
  const setOpen = useUI((s) => s.setCommandOpen);
  const navigate = useNavigate();

  const { data: recentData } = useQuery({
    queryKey: queryKeys.workouts({ page: 1 }),
    queryFn: () => api.get<{ items: Workout[] }>("/workouts?page=1"),
    enabled: open,
    staleTime: 30_000,
  });

  const recent = recentData?.items?.slice(0, 5) ?? [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, actions…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        {recent.length > 0 && (
          <CommandGroup heading="Recent workouts">
            {recent.map((w) => (
              <CommandItem
                key={w.id}
                value={`${w.type} ${w.date}`}
                onSelect={() => {
                  setOpen(false);
                  navigate({ to: "/workouts" });
                }}
              >
                <Dumbbell className="mr-2 h-4 w-4" />
                {w.type} · {w.date} · {w.duration} min
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        <CommandGroup heading="Navigate">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <CommandItem
                key={it.to}
                value={it.label}
                onSelect={() => {
                  setOpen(false);
                  navigate({ to: it.to });
                }}
              >
                <Icon className="mr-2 h-4 w-4" />
                {it.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
