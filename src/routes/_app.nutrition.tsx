import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Droplet, Plus, Apple, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadialProgress } from "@/components/RadialProgress";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useUI } from "@/lib/store";
import type { FoodItem, Meal } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/nutrition")({ component: NutritionPage });

function NutritionPage() {
  const today = new Date().toISOString().slice(0, 10);
  const qc = useQueryClient();
  const water = useUI((s) => s.waterGlasses);
  const setWaterGlasses = useUI((s) => s.setWaterGlasses);

  const { data: settings } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => api.get<{ calorieTarget: number }>("/settings"),
  });

  const { data: mealsData, isLoading } = useQuery({
    queryKey: queryKeys.meals(today),
    queryFn: () => api.get<{ items: Meal[] }>(`/meals?date=${today}`),
  });

  const meals = mealsData?.items ?? [];
  const macroTargets = useMemo(() => {
    const cal = settings?.calorieTarget ?? 2000;
    return {
      calories: cal,
      protein: Math.round((cal * 0.3) / 4),
      carbs: Math.round((cal * 0.45) / 4),
      fat: Math.round((cal * 0.25) / 9),
    };
  }, [settings]);

  const totals = useMemo(() => meals.reduce((a, m) => ({
    calories: a.calories + m.calories,
    protein: a.protein + m.protein,
    carbs: a.carbs + m.carbs,
    fat: a.fat + m.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [meals]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: foodsData } = useQuery({
    queryKey: queryKeys.foods(debouncedSearch),
    queryFn: () => api.get<{ items: FoodItem[] }>(`/foods/search?q=${encodeURIComponent(debouncedSearch)}`),
    enabled: open,
  });

  const filtered = foodsData?.items ?? [];

  const logMealMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      slot: Meal["slot"];
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      quantity: number;
    }) => api.post("/meals", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.meals(today) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      toast.success(`${selected!.name} added`);
      setOpen(false);
      setSelected(null);
      setQty(1);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to log meal"),
  });

  const macros = [
    { key: "calories", label: "Calories", val: totals.calories, target: macroTargets.calories, color: "var(--color-chart-4)", unit: "" },
    { key: "protein", label: "Protein", val: totals.protein, target: macroTargets.protein, color: "var(--color-primary)", unit: "g" },
    { key: "carbs", label: "Carbs", val: totals.carbs, target: macroTargets.carbs, color: "var(--color-accent)", unit: "g" },
    { key: "fat", label: "Fat", val: totals.fat, target: macroTargets.fat, color: "var(--color-chart-3)", unit: "g" },
  ];

  if (isLoading) {
    return <Skeleton className="h-96 w-full max-w-7xl mx-auto rounded-xl" />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Nutrition</h1>
          <p className="text-sm text-muted-foreground mt-1">Today's macros and meals</p>
        </div>
        {macroTargets.calories < 1200 && (
          <p className="text-xs rounded-lg bg-chart-4/10 text-chart-4 px-3 py-1.5">Daily target is below 1,200 kcal — consider reviewing.</p>
        )}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-glow"><Plus className="h-4 w-4 mr-1" /> Log meal</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Log a meal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search foods…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="max-h-56 overflow-y-auto space-y-1 scrollbar-thin">
                {filtered.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => setSelected(f)}
                    className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${selected?.name === f.name ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{f.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{f.calories} kcal</span>
                    </div>
                  </button>
                ))}
              </div>
              {selected && (
                <div className="rounded-xl border border-border/60 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{selected.name}</span>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(Math.max(1, qty - 1))}>−</Button>
                      <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(qty + 1)}>+</Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground grid grid-cols-4 gap-1">
                    <span>{Math.round(selected.calories * qty)} kcal</span>
                    <span>P {Math.round(selected.protein * qty)}g</span>
                    <span>C {Math.round(selected.carbs * qty)}g</span>
                    <span>F {Math.round(selected.fat * qty)}g</span>
                  </div>
                </div>
              )}
              <Button
                className="w-full"
                disabled={!selected || logMealMutation.isPending}
                onClick={() => {
                  if (!selected) return;
                  logMealMutation.mutate({
                    name: selected.name,
                    slot: "Snack",
                    calories: Math.round(selected.calories * qty),
                    protein: selected.protein * qty,
                    carbs: selected.carbs * qty,
                    fat: selected.fat * qty,
                    quantity: qty,
                  });
                }}
              >{logMealMutation.isPending ? "Saving…" : "Add to log"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {macros.map((m, i) => {
          const pct = Math.min(m.val / m.target, 1);
          return (
            <motion.div key={m.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="glass p-5 flex flex-col items-center text-center">
                <RadialProgress value={pct} size={130} stroke={11} color={m.color} label={`${Math.round(pct * 100)}%`} sublabel={m.label} />
                <p className="mt-3 text-sm tabular-nums">
                  <AnimatedNumber value={m.val} /> <span className="text-muted-foreground">/ {m.target}{m.unit}</span>
                </p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Hydration</h2>
            <span className="text-xs text-muted-foreground tabular-nums">{water}/8 glasses</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => {
              const filled = i < water;
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ y: -2 }}
                  onClick={() => setWaterGlasses(i + 1 === water ? i : i + 1)}
                  className={`aspect-[3/4] rounded-xl border-2 grid place-items-center transition-colors ${filled ? "border-primary bg-primary/15" : "border-border bg-muted/30"}`}
                >
                  <motion.div
                    animate={{ scale: filled ? 1 : 0.5, opacity: filled ? 1 : 0.3 }}
                    transition={{ type: "spring", stiffness: 320, damping: 20 }}
                  >
                    <Droplet className={`h-7 w-7 ${filled ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                  </motion.div>
                </motion.button>
              );
            })}
          </div>
        </Card>

        <Card className="glass p-6 lg:col-span-2">
          <h2 className="text-base font-semibold mb-4">Today's meals</h2>
          {meals.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">No meals logged yet — tap "Log meal" to start.</div>
          ) : (
            <ul className="space-y-2">
              <AnimatePresence>
                {meals.map((m, i) => (
                  <motion.li
                    key={m.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 rounded-xl border border-border/60 p-3"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Apple className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.slot} · {m.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">{m.calories} kcal</p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">P{m.protein} · C{m.carbs} · F{m.fat}</p>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
