import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dumbbell, Bike, Zap, Flower, Plus, Trash2, Check, ArrowLeft, ArrowRight, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { estimateCalories } from "@/lib/mock-data";
import type { WorkoutType } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { Confetti } from "@/components/Confetti";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/workouts/log")({ component: LogWorkoutPage });

const schema = z.object({
  type: z.enum(["Strength", "Cardio", "HIIT", "Yoga", "Custom"]),
  duration: z.coerce.number().min(1, "Duration must be positive"),
  exercises: z.array(z.object({
    name: z.string().min(1, "Required"),
    sets: z.coerce.number().min(1),
    reps: z.coerce.number().min(1),
    weight: z.coerce.number().min(0),
  })).min(1, "Add at least one exercise"),
});
type FormData = z.infer<typeof schema>;

const typeMeta: Record<WorkoutType, { icon: any; color: string; desc: string }> = {
  Strength: { icon: Dumbbell, color: "from-primary to-primary/60", desc: "Lift, push, pull" },
  Cardio: { icon: Bike, color: "from-chart-2 to-chart-5", desc: "Run, ride, row" },
  HIIT: { icon: Zap, color: "from-chart-4 to-destructive", desc: "Burst & burn" },
  Yoga: { icon: Flower, color: "from-accent to-accent/60", desc: "Flow & stretch" },
  Custom: { icon: Dumbbell, color: "from-muted-foreground to-muted", desc: "Your own session" },
};

function LogWorkoutPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "Strength",
      duration: 45,
      exercises: [{ name: "", sets: 3, reps: 10, weight: 20 }],
    },
    mode: "onChange",
  });
  const { register, control, watch, handleSubmit, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "exercises" });

  const type = watch("type");
  const duration = watch("duration") || 0;
  const exercises = watch("exercises");
  const calories = estimateCalories(type, Number(duration));

  const next = async () => {
    if (step === 0) setStep(1);
    else if (step === 1) {
      const ok = await form.trigger("exercises");
      if (ok) setStep(2);
    }
  };

  const qc = useQueryClient();
  const saveMutation = useMutation({
    mutationFn: (data: FormData) => api.post("/workouts", data),
    onSuccess: (_, data) => {
      setSuccess(true);
      qc.invalidateQueries({ queryKey: ["workouts"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
      qc.invalidateQueries({ queryKey: queryKeys.reports() });
      setTimeout(() => {
        toast.success(`${data.type} workout saved · ${calories} kcal`);
        navigate({ to: "/workouts" });
      }, 1600);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to save workout"),
  });

  const onSubmit = (data: FormData) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Log workout</h1>
          <p className="text-sm text-muted-foreground mt-1">Step {step + 1} of 3</p>
        </div>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
          <Flame className="h-3.5 w-3.5 text-chart-4" />
          ~{calories} kcal
        </Badge>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {["Type", "Exercises", "Review"].map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1.5 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
            <p className={`text-xs mt-2 font-medium ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{s}</p>
          </div>
        ))}
      </div>

      <Card className="glass p-6 lg:p-8 min-h-[420px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold">Pick a workout type</h2>
                  <p className="text-sm text-muted-foreground mt-1">What did you train today?</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(typeMeta) as WorkoutType[]).map((t) => {
                    const Icon = typeMeta[t].icon;
                    const active = type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => form.setValue("type", t)}
                        className={`relative text-left rounded-2xl border p-5 transition-all ${active ? "border-primary bg-primary/5 shadow-glow" : "border-border hover:border-primary/40"}`}
                      >
                        <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${typeMeta[t].color} text-white mb-3`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="font-semibold">{t}</p>
                        <p className="text-xs text-muted-foreground">{typeMeta[t].desc}</p>
                        {active && (
                          <motion.div layoutId="type-check" className="absolute top-3 right-3 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3.5 w-3.5" />
                          </motion.div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input id="duration" type="number" min={1} {...register("duration")} />
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Add exercises</h2>
                    <p className="text-sm text-muted-foreground mt-1">Track sets, reps, weight.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", sets: 3, reps: 10, weight: 0 })}>
                    <Plus className="h-4 w-4 mr-1" /> Add exercise
                  </Button>
                </div>
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {fields.map((f, i) => (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                        className="grid grid-cols-12 gap-2 items-end rounded-xl border border-border/60 p-3"
                      >
                        <div className="col-span-12 sm:col-span-5">
                          <Label className="text-xs">Exercise</Label>
                          <Input placeholder="Bench press" {...register(`exercises.${i}.name`)} />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-xs">Sets</Label>
                          <Input type="number" min={1} {...register(`exercises.${i}.sets`)} />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-xs">Reps</Label>
                          <Input type="number" min={1} {...register(`exercises.${i}.reps`)} />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-xs">Weight (kg)</Label>
                          <Input type="number" min={0} {...register(`exercises.${i}.weight`)} />
                        </div>
                        <div className="col-span-12 sm:col-span-1 flex justify-end">
                          <Button type="button" variant="ghost" size="icon" onClick={() => fields.length > 1 && remove(i)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                {errors.exercises && <p className="text-xs text-destructive">{errors.exercises.message}</p>}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-semibold">Review & save</h2>
                  <p className="text-sm text-muted-foreground mt-1">Looks good?</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-4">
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-semibold mt-1">{type}</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-semibold mt-1">{duration} min</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs text-muted-foreground">Calories</p>
                    <p className="font-semibold mt-1 text-chart-4">{calories} kcal</p>
                  </Card>
                </div>
                <div className="rounded-xl border border-border/60 divide-y divide-border/50">
                  {exercises.map((e, i) => (
                    <div key={i} className="flex items-center justify-between p-3 text-sm">
                      <span className="font-medium">{e.name || `Exercise ${i + 1}`}</span>
                      <span className="text-muted-foreground tabular-nums text-xs">{e.sets}×{e.reps}{e.weight ? ` @ ${e.weight}kg` : ""}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between border-t border-border/50 pt-5">
            <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step < 2 ? (
              <Button type="button" onClick={next}>
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" className="shadow-glow" disabled={saveMutation.isPending}>
                <Check className="h-4 w-4 mr-1" /> {saveMutation.isPending ? "Saving…" : "Save workout"}
              </Button>
            )}
          </div>
        </form>
      </Card>

      <AnimatePresence>
        {success && (
          <>
            <Confetti />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 grid place-items-center pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary to-accent shadow-glow"
              >
                <Check className="h-12 w-12 text-primary-foreground" />
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
