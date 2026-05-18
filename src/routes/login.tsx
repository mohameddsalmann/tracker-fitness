import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/store";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "", remember: true } });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await api.post<{ user: { id: string; email: string; name: string }; token: string }>("/auth/login", {
        email: data.email,
        password: data.password,
      });
      setSession(res.user, res.token);
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Sign in failed");
    }
  };

  return (
    <motion.div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative overflow-hidden gradient-hero">
        <motion.div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.72_0.17_162/0.3),transparent_60%)]" />
        <div className="relative z-10 m-auto p-16 max-w-lg">
          <h2 className="text-5xl font-bold tracking-tight leading-tight">
            Train smarter. <span className="text-gradient">Live stronger.</span>
          </h2>
          <p className="mt-6 text-muted-foreground text-lg">
            Your personal command center for workouts, nutrition, sleep and goals — beautifully tracked, instantly visualized.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-2 mb-10">
            <motion.div layoutId="brand-logo" className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </motion.div>
            <span className="text-xl font-semibold tracking-tight">FitPulse</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to continue your journey.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox defaultChecked {...(register("remember") as object)} /> Remember me
              </label>
              <button type="button" className="text-sm text-primary hover:underline">Forgot password?</button>
            </div>
            <Button type="submit" className="w-full h-11 text-base shadow-glow" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            New here? <Link to="/register" className="text-primary font-medium hover:underline">Create an account</Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
