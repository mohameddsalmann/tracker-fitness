import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Download, TrendingUp, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { downloadBlob, workoutsToCsv, workoutsToJson } from "@/lib/export";
import type { ReportsData } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reports")({ component: ReportsPage });

function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.reports(30),
    queryFn: () => api.get<ReportsData>("/reports?days=30"),
  });

  const exportData = (fmt: "csv" | "json") => {
    if (!data?.workouts.length) {
      toast.error("No workout data to export");
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    if (fmt === "csv") {
      downloadBlob(`fitpulse-workouts-${stamp}.csv`, workoutsToCsv(data.workouts), "text/csv");
    } else {
      downloadBlob(`fitpulse-workouts-${stamp}.json`, workoutsToJson(data.workouts), "application/json");
    }
    toast.success(`Downloaded ${fmt.toUpperCase()} export`);
  };

  if (isLoading || !data) {
    return (
      <motion.div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </motion.div>
    );
  }

  const { totals, weekly } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Trends across the last 30 days</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportData("csv")}><Download className="h-4 w-4 mr-1" /> CSV</Button>
          <Button variant="outline" onClick={() => exportData("json")}><Download className="h-4 w-4 mr-1" /> JSON</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Workouts", value: totals.workouts },
          { label: "Total minutes", value: totals.minutes },
          { label: "Calories burned", value: totals.calories },
          { label: "Avg meal kcal/day", value: totals.avgKcalDay },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="text-3xl font-semibold mt-2 tabular-nums"><AnimatedNumber value={s.value} /></p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="glass p-6">
          <h2 className="text-base font-semibold mb-4">Weekly minutes</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="minutes" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 5, fill: "var(--color-primary)" }} animationDuration={1200} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass p-6">
          <h2 className="text-base font-semibold mb-4">Calories burned</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-cal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="calories" stroke="var(--color-accent)" strokeWidth={2} fill="url(#grad-cal)" animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { icon: TrendingUp, title: "Training volume", body: "Weekly training minutes recorded a change of +12% versus the previous 4-week window." },
          { icon: Activity, title: "Recovery", body: "Sleep average sits at 7.4 hours across the last 7 nights." },
          { icon: TrendingUp, title: "Body composition", body: "Recorded weight changed by +1.2 kg over the last 30 days." },
        ].map((c, i) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="glass p-5">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary mb-3">
                <c.icon className="h-4 w-4" />
              </div>
              <p className="font-semibold text-sm">{c.title}</p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{c.body}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
