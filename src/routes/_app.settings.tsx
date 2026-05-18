import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/store";
import { api, ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { UserSettings } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({ component: SettingsPage });

const diets = ["Omnivore", "Vegetarian", "Vegan", "Pescatarian", "Keto", "Paleo"];
const allergens = ["Peanuts", "Dairy", "Gluten", "Shellfish", "Eggs", "Soy"];

const dietMap: Record<string, string> = {
  Omnivore: "omnivore",
  Vegetarian: "vegetarian",
  Vegan: "vegan",
  Pescatarian: "pescatarian",
  Keto: "keto",
  Paleo: "paleo",
};

const dietReverse: Record<string, string> = Object.fromEntries(
  Object.entries(dietMap).map(([k, v]) => [v, k]),
);

function SettingsPage() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => api.get<UserSettings>("/settings"),
  });

  const [diet, setDiet] = useState("Omnivore");
  const [allergy, setAllergy] = useState<string[]>([]);
  const [notify, setNotify] = useState({ pushWorkout: true, pushMeal: false, emailWeekly: true, emailGoals: true });
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");

  useEffect(() => {
    if (!settings) return;
    setDiet(dietReverse[settings.dietType] ?? "Omnivore");
    setAllergy(settings.allergens);
    setNotify({
      pushWorkout: settings.notifyPush,
      pushMeal: settings.notifyPush,
      emailWeekly: settings.notifyEmail,
      emailGoals: settings.notifyEmail,
    });
    setQuietStart(settings.quietStart);
    setQuietEnd(settings.quietEnd);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.patch("/settings", {
        dietType: dietMap[diet] ?? "none",
        allergens: allergy,
        notifyPush: notify.pushWorkout || notify.pushMeal,
        notifyEmail: notify.emailWeekly || notify.emailGoals,
        quietHoursOn: true,
        quietStart,
        quietEnd,
      }),
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: queryKeys.settings });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to save"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete("/auth/me"),
    onSuccess: () => {
      logout();
      toast.success("Account deleted");
      navigate({ to: "/login" });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete account"),
  });

  if (isLoading) {
    return <Skeleton className="h-96 w-full max-w-4xl mx-auto rounded-xl" />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Profile, diet and notifications</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass p-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20 border-2 border-primary/30">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-2xl font-semibold">
                {(user?.name || "U").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="grid sm:grid-cols-2 gap-3 flex-1">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue={user?.name || ""} readOnly />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={user?.email || ""} readOnly />
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </Card>
      </motion.div>

      <Card className="glass p-6 space-y-5">
        <h2 className="text-base font-semibold">Dietary preferences</h2>
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Diet type</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {diets.map((d) => (
              <button key={d} onClick={() => setDiet(d)} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${diet === d ? "bg-primary text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{d}</button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Allergens</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {allergens.map((a) => {
              const on = allergy.includes(a);
              return (
                <button key={a} onClick={() => setAllergy(on ? allergy.filter((x) => x !== a) : [...allergy, a])} className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${on ? "border-destructive bg-destructive/10 text-destructive" : "border-border text-muted-foreground hover:text-foreground"}`}>{a}</button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card className="glass p-6 space-y-4">
        <h2 className="text-base font-semibold">Notifications</h2>
        {[
          { key: "pushWorkout", label: "Workout reminders", desc: "Push notifications for scheduled training" },
          { key: "pushMeal", label: "Meal logging", desc: "Push reminders to log meals" },
          { key: "emailWeekly", label: "Weekly summary email", desc: "Sunday recap with trends" },
          { key: "emailGoals", label: "Goal milestones", desc: "Email when you cross a milestone" },
        ].map((n) => (
          <div key={n.key} className="flex items-center justify-between gap-4 py-2 border-b border-border/50 last:border-0">
            <div className="min-w-0">
              <p className="text-sm font-medium">{n.label}</p>
              <p className="text-xs text-muted-foreground">{n.desc}</p>
            </div>
            <Switch
              checked={(notify as Record<string, boolean>)[n.key]}
              onCheckedChange={(v) => setNotify({ ...notify, [n.key]: v })}
            />
          </div>
        ))}

        <div className="pt-3 border-t border-border/50">
          <Label className="text-sm font-medium">Quiet hours</Label>
          <p className="text-xs text-muted-foreground mb-2">No notifications during this window</p>
          <div className="flex items-center gap-3">
            <Input type="time" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} className="w-32" />
            <span className="text-muted-foreground text-sm">to</span>
            <Input type="time" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} className="w-32" />
            <Badge variant="secondary">{quietStart}–{quietEnd}</Badge>
          </div>
        </div>
      </Card>

      <Card className="glass p-6 border-destructive/30">
        <h2 className="text-base font-semibold text-destructive">Danger zone</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Permanently delete your account and all associated data.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove all workouts, meals, and goals. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
}
