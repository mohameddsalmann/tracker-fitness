import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Target, Plus, ArrowLeft, ArrowRight, Check, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadialProgress } from "@/components/RadialProgress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { Goal } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/goals")({ component: GoalsPage });

const schema = z.object({
  title: z.string().min(2),
  type: z.enum(["Weight", "Steps", "Workouts", "Calories", "Sleep"]),
  target: z.coerce.number().positive(),
  deadline: z.string().refine((s) => {
    const d = new Date(s).getTime();
    const now = Date.now();
    return d > now && d < now + 365 * 86400000;
  }, "Date must be in the future and within 365 days"),
});
type FormData = z.infer<typeof schema>;

function GoalsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.goals,
    queryFn: () => api.get<{ items: Goal[] }>("/goals"),
  });
  const goals = data?.items ?? [];

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [progressGoalId, setProgressGoalId] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState("");
  const atLimit = goals.length >= 5;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", type: "Steps", target: 10000, deadline: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) },
    mode: "onChange",
  });
  const { register, handleSubmit, watch, formState: { errors } } = form;

  const createMutation = useMutation({
    mutationFn: (payload: FormData) => api.post("/goals", payload),
    onSuccess: () => {
      toast.success("Goal created");
      qc.invalidateQueries({ queryKey: queryKeys.goals });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      setOpen(false);
      setStep(0);
      form.reset();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create goal"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, current }: { id: string; current: number }) => api.patch(`/goals/${id}`, { current }),
    onSuccess: () => {
      toast.success("Progress updated");
      qc.invalidateQueries({ queryKey: queryKeys.goals });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      setProgressGoalId(null);
      setProgressValue("");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update"),
  });

  const onSubmit = (data: FormData) => createMutation.mutate(data);

  if (isLoading) {
    return <Skeleton className="h-96 w-full max-w-7xl mx-auto rounded-xl" />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Goals</h1>
          <p className="text-sm text-muted-foreground mt-1">{goals.length}/5 active goals</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setStep(0); }}>
          <DialogTrigger asChild>
            <Button className="shadow-glow" disabled={atLimit}><Plus className="h-4 w-4 mr-1" /> New goal</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create a goal · Step {step + 1}/3</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.div key="s0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-3">
                    <Label>Goal type</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["Weight", "Steps", "Workouts", "Calories", "Sleep"] as const).map((t) => {
                        const active = watch("type") === t;
                        return (
                          <button key={t} type="button" onClick={() => form.setValue("type", t)} className={`rounded-xl border p-3 text-sm font-medium transition-colors ${active ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}>{t}</button>
                        );
                      })}
                    </div>
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" placeholder="Hit 10k steps daily" {...register("title")} />
                      {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                    </div>
                  </motion.div>
                )}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-3">
                    <Label htmlFor="target">Target value</Label>
                    <Input id="target" type="number" {...register("target")} />
                    {errors.target && <p className="text-xs text-destructive">{errors.target.message}</p>}
                  </motion.div>
                )}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-3">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input id="deadline" type="date" {...register("deadline")} />
                    {errors.deadline && <p className="text-xs text-destructive">{errors.deadline.message}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex justify-between mt-6">
                <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
                {step < 2 ? (
                  <Button type="button" onClick={() => setStep(step + 1)}>Next <ArrowRight className="h-4 w-4 ml-1" /></Button>
                ) : (
                  <Button type="submit" disabled={createMutation.isPending}><Check className="h-4 w-4 mr-1" /> Create</Button>
                )}
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {atLimit && (
        <div className="flex items-center gap-2 rounded-xl bg-chart-4/10 text-chart-4 px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4" /> You've reached the 5 active goals limit. Complete or archive one to add a new goal.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((g, i) => {
          const pct = Math.min(g.current / g.target, 1);
          return (
            <motion.div key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="glass p-5 flex items-center gap-5 hover:shadow-glow transition-shadow">
                <RadialProgress value={pct} size={100} stroke={10} label={`${Math.round(pct * 100)}%`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{g.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{g.type}</p>
                  <p className="text-sm tabular-nums mt-2">{g.current}<span className="text-muted-foreground"> / {g.target} {g.unit}</span></p>
                  <p className="text-[11px] text-muted-foreground mt-1">By {g.deadline}</p>
                  <Popover open={progressGoalId === g.id} onOpenChange={(v) => { setProgressGoalId(v ? g.id : null); if (v) setProgressValue(String(g.current)); }}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="mt-3 h-8 text-xs">Log progress</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 space-y-2" align="start">
                      <Label className="text-xs">New value ({g.unit})</Label>
                      <Input type="number" value={progressValue} onChange={(e) => setProgressValue(e.target.value)} />
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={updateMutation.isPending}
                        onClick={() => updateMutation.mutate({ id: g.id, current: Number(progressValue) })}
                      >Save</Button>
                    </PopoverContent>
                  </Popover>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="glass p-6">
        <h2 className="text-base font-semibold mb-5 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Milestones</h2>
        <ol className="relative border-l border-border ml-3 space-y-5">
          {goals.map((g, i) => (
            <motion.li key={g.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="ml-5">
              <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary shadow-glow" />
              <p className="text-sm font-medium">{g.title}</p>
              <p className="text-xs text-muted-foreground">Created {g.createdAt} · {Math.round((g.current / g.target) * 100)}% complete</p>
            </motion.li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
