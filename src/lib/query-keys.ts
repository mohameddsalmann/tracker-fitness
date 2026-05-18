export const queryKeys = {
  me: ["auth", "me"] as const,
  dashboard: ["dashboard"] as const,
  workouts: (params?: { from?: string; to?: string; type?: string; page?: number }) =>
    ["workouts", params] as const,
  meals: (date: string) => ["meals", date] as const,
  goals: ["goals"] as const,
  settings: ["settings"] as const,
  reports: (days?: number) => ["reports", days] as const,
  foods: (q: string) => ["foods", q] as const,
};
