import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Activity, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/store";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Needs an uppercase letter")
    .regex(/[a-z]/, "Needs a lowercase letter")
    .regex(/[0-9]/, "Needs a number"),
});
type FormData = z.infer<typeof schema>;

const checks = [
  { label: "8+ characters", test: (s: string) => s.length >= 8 },
  { label: "Uppercase letter", test: (s: string) => /[A-Z]/.test(s) },
  { label: "Lowercase letter", test: (s: string) => /[a-z]/.test(s) },
  { label: "Number", test: (s: string) => /[0-9]/.test(s) },
];

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const {
    register, handleSubmit, watch, formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", password: "" } });

  const password = watch("password") || "";
  const strength = checks.filter((c) => c.test(password)).length;
  const strengthColors = ["bg-muted", "bg-destructive", "bg-chart-4", "bg-chart-3", "bg-primary"];
  const strengthLabel = ["Too short", "Weak", "Fair", "Good", "Strong"][strength];

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post<{ user: { id: string; email: string; name: string }; token: string }>("/auth/register", data);
      setSession(res.user, res.token);
      toast.success("Account created — let's get moving!");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Registration failed");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="flex items-center justify-center p-6 lg:p-12 order-2 lg:order-1">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-10">
            <motion.div layoutId="brand-logo" className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </motion.div>
            <span className="text-xl font-semibold tracking-tight">FitPulse</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Start tracking in under a minute.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Alex Carter" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
              <div className="flex gap-1 mt-2">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${i < strength ? strengthColors[strength] : "bg-muted"}`}
                    initial={false}
                    animate={{ scaleX: i < strength ? 1 : 0.9 }}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Strength: <span className="font-medium text-foreground">{strengthLabel}</span></p>
              <ul className="grid grid-cols-2 gap-1 mt-2">
                {checks.map((c) => {
                  const ok = c.test(password);
                  return (
                    <li key={c.label} className={`flex items-center gap-1.5 text-xs ${ok ? "text-primary" : "text-muted-foreground"}`}>
                      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {c.label}
                    </li>
                  );
                })}
              </ul>
            </div>
            <Button type="submit" className="w-full h-11 text-base shadow-glow" disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
      <div className="hidden lg:flex relative overflow-hidden gradient-hero order-1 lg:order-2">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,oklch(0.62_0.18_277/0.3),transparent_60%)]" />
        <div className="relative z-10 m-auto p-16 max-w-lg">
          <h2 className="text-5xl font-bold tracking-tight leading-tight">
            Your <span className="text-gradient">strongest year</span> starts now.
          </h2>
          <p className="mt-6 text-muted-foreground text-lg">
            Set goals, log workouts, track macros — and watch every metric move.
          </p>
        </div>
      </div>
    </div>
  );
}
