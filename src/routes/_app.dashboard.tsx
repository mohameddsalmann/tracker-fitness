import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Flame, Footprints, Timer, Moon, Dumbbell, Apple, TrendingUp, Database } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from "recharts";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { RadialProgress } from "@/components/RadialProgress";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/store";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { DashboardData } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

function StatCard({ icon: Icon, label, value, suffix = "", decimals = 0, accent }: { icon: typeof Flame; label: string; value: number; suffix?: string; decimals?: number; accent: string }) {
  return (
    <motion.div variants={item}>
      <Card className="glass p-5 hover:scale-[1.02] transition-transform duration-300 hover:shadow-glow cursor-default">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">
              <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
            </p>
          </div>
          <div className={`grid h-10 w-10 place-items-center rounded-xl ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function Dashboard() {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => api.get<DashboardData>("/dashboard"),
  });

  const seedMutation = useMutation({
    mutationFn: () => api.post<{ seeded: boolean }>("/seed"),
    onSuccess: (res) => {
      if (res.seeded) {
        toast.success("Sample data loaded");
        qc.invalidateQueries();
      } else {
        toast.info("You already have data");
      }
    },
    onError: () => toast.error("Could not load sample data"),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </motion.div>
      </div>
    );
  }

  const { stats, macroTargets, weeklyBars, recentWorkouts, goals, isEmpty } = data;
  const maxBar = Math.max(...weeklyBars.map((b) => b.minutes), 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-muted-foreground">Good to see you,</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {user?.name?.split(" ")[0] || "Athlete"} <span className="text-muted-foreground">— here's today.</span>
        </h1>
      </motion.div>

      {isEmpty && (
        <Card className="glass p-8 text-center">
          <Database className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Your dashboard is empty</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Load sample workouts and meals to explore charts.</p>
          <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending} className="shadow-glow">
            {seedMutation.isPending ? "Loading…" : "Load sample data"}
          </Button>
        </Card>
      )}

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="Calories" value={stats.calories} accent="bg-chart-4/15 text-chart-4" />
        <StatCard icon={Footprints} label="Steps" value={stats.steps} accent="bg-primary/15 text-primary" />
        <StatCard icon={Timer} label="Active min" value={stats.activeMinutes} suffix=" min" accent="bg-accent/15 text-accent" />
        <StatCard icon={Moon} label="Sleep" value={stats.sleep} decimals={1} suffix=" h" accent="bg-chart-2/15 text-chart-2" />
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="glass p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold">Weekly activity</h2>
              <p className="text-xs text-muted-foreground">Minutes trained per day</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
              <TrendingUp className="h-3.5 w-3.5" /> +12% vs last week
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyBars} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
                  contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="minutes" radius={[8, 8, 0, 0]} animationDuration={900}>
                  {weeklyBars.map((b, i) => (
                    <Cell key={i} fill="var(--color-primary)" fillOpacity={b.minutes === maxBar && maxBar > 0 ? 1 : 0.55} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass p-6">
          <h2 className="text-base font-semibold mb-2">Goal progress</h2>
          <p className="text-xs text-muted-foreground mb-4">Top active goals</p>
          <div className="grid grid-cols-3 gap-4 place-items-center">
            {goals.slice(0, 3).map((g) => {
              const pct = Math.min(g.current / g.target, 1);
              return (
                <div key={g.id} className="flex flex-col items-center text-center">
                  <RadialProgress value={pct} size={92} stroke={9} label={`${Math.round(pct * 100)}%`} />
                  <p className="mt-2 text-xs font-medium truncate max-w-[100px]">{g.type}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="glass p-6 lg:col-span-2">
          <h2 className="text-base font-semibold mb-4">Recent activity</h2>
          {recentWorkouts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No workouts yet.</p>
          ) : (
            <motion.ul variants={container} initial="hidden" animate="show" className="space-y-2">
              {recentWorkouts.map((w) => (
                <motion.li
                  key={w.id}
                  variants={item}
                  className="flex items-center gap-4 rounded-xl border border-border/50 px-4 py-3 hover:bg-muted/40 transition-colors"
                >
                  <motion.div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Dumbbell className="h-5 w-5" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{w.type} session</p>
                    <p className="text-xs text-muted-foreground">{w.exercises.length} exercises · {w.duration} min · {w.date}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{w.calories} kcal</p>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </Card>

        <Card className="glass p-6">
          <h2 className="text-base font-semibold mb-4">Macros today</h2>
          <div className="space-y-3">
            {[
              { label: "Protein", val: stats.protein, target: macroTargets.protein, color: "var(--color-primary)" },
              { label: "Carbs", val: stats.carbs, target: macroTargets.carbs, color: "var(--color-accent)" },
              { label: "Fat", val: stats.fat, target: macroTargets.fat, color: "var(--color-chart-4)" },
            ].map((m) => {
              const pct = Math.min((m.val / m.target) * 100, 100);
              return (
                <div key={m.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="tabular-nums font-medium">{Math.round(m.val)}/{m.target}g</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ background: m.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <Apple className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Calories</span>
            </div>
            <span className="text-sm tabular-nums font-semibold">{Math.round(stats.calories)} / {macroTargets.calories}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
