import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, ChevronDown, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/EmptyState";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { Workout, WorkoutType } from "@/lib/types";
import { displayExercise } from "@/lib/workout-display";

export const Route = createFileRoute("/_app/workouts")({ component: WorkoutsPage });

const types: ("All" | WorkoutType)[] = ["All", "Strength", "Cardio", "HIIT", "Yoga", "Custom"];

function HeatmapCalendar({ workouts }: { workouts: Workout[] }) {
  const days = useMemo(() => {
    const map = new Map<string, { minutes: number; count: number; calories: number }>();
    workouts.forEach((w) => {
      const prev = map.get(w.date) ?? { minutes: 0, count: 0, calories: 0 };
      map.set(w.date, {
        minutes: prev.minutes + w.duration,
        count: prev.count + 1,
        calories: prev.calories + w.calories,
      });
    });
    const out: { date: string; minutes: number; count: number; calories: number }[] = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      out.push({ date: iso, minutes: 0, count: 0, calories: 0, ...map.get(iso) });
    }
    return out;
  }, [workouts]);
  const max = Math.max(...days.map((d) => d.minutes), 1);

  return (
    <TooltipProvider delayDuration={100}>
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto scrollbar-thin pb-2">
        {days.map((d, i) => {
          const intensity = d.minutes / max;
          return (
            <Tooltip key={d.date}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.003, duration: 0.2 }}
                  className="h-3.5 w-3.5 rounded-[3px] cursor-default"
                  style={{
                    background: d.minutes === 0
                      ? "var(--color-muted)"
                      : `color-mix(in oklab, var(--color-primary) ${20 + intensity * 80}%, transparent)`,
                  }}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-medium">{d.date}</p>
                <p>{d.count} workout{d.count !== 1 ? "s" : ""} · {d.minutes} min · {d.calories} kcal</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

function WorkoutsPage() {
  const [filter, setFilter] = useState<(typeof types)[number]>("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const from = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().slice(0, 10);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.workouts({ from, type: filter === "All" ? undefined : filter }),
    queryFn: () => {
      const params = new URLSearchParams({ from, page: "1" });
      if (filter !== "All") params.set("type", filter);
      return api.get<{ items: Workout[]; total: number }>(`/workouts?${params}`);
    },
  });

  const workouts = data?.items ?? [];
  const filtered = useMemo(() => [...workouts].reverse(), [workouts]);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Workout history</h1>
          <p className="text-sm text-muted-foreground mt-1">{data?.total ?? 0} sessions</p>
        </div>
      </div>

      <Card className="glass p-6">
        <h2 className="text-sm font-medium mb-4">Activity heatmap · last 90 days</h2>
        <HeatmapCalendar workouts={workouts} />
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          Less
          {[20, 40, 60, 80, 100].map((p) => (
            <span key={p} className="h-3 w-3 rounded-sm" style={{ background: `color-mix(in oklab, var(--color-primary) ${p}%, transparent)` }} />
          ))}
          More
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === t ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {filter === t && (
              <motion.span layoutId="filter-pill" className="absolute inset-0 rounded-full bg-primary shadow-glow" transition={{ type: "spring", stiffness: 320, damping: 30 }} />
            )}
            <span className="relative">{t}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Dumbbell className="h-12 w-12" />} title="No workouts yet" description="Log your first session to start building history." />
      ) : (
        <div className="space-y-2">
          {filtered.map((w) => {
            const open = expanded === w.id;
            return (
              <motion.div key={w.id} layout transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                <Card className="glass overflow-hidden">
                  <button
                    onClick={() => setExpanded(open ? null : w.id)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{w.type}</p>
                        <Badge variant="secondary" className="text-[10px]">{w.exercises.length} exercises</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{w.date} · {w.duration} min · {w.calories} kcal</p>
                    </div>
                    <motion.div animate={{ rotate: open ? 180 : 0 }}>
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden border-t border-border/50"
                      >
                        <div className="p-4 grid gap-2">
                          {w.exercises.map((e, i) => {
                            const ex = displayExercise(e);
                            return (
                              <div key={i} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                                <span className="font-medium">{ex.name}</span>
                                <span className="text-muted-foreground tabular-nums text-xs">
                                  {ex.sets} × {ex.reps}{ex.weight ? ` @ ${ex.weight}kg` : ""}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
