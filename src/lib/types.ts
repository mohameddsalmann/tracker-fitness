export type WorkoutType = "Strength" | "Cardio" | "HIIT" | "Yoga" | "Custom";

export interface ExerciseSet {
  reps: number;
  weight: number;
}

export interface WorkoutExercise {
  name: string;
  sets: ExerciseSet[];
}

export interface Workout {
  id: string;
  date: string;
  type: WorkoutType;
  duration: number;
  calories: number;
  exercises: WorkoutExercise[];
  notes?: string | null;
}

export interface Meal {
  id: string;
  date: string;
  name: string;
  slot: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
  time?: string;
}

export interface Goal {
  id: string;
  title: string;
  type: "Weight" | "Steps" | "Workouts" | "Calories" | "Sleep";
  target: number;
  current: number;
  unit: string;
  deadline: string;
  status: string;
  createdAt: string;
}

export interface UserSettings {
  dietType: string;
  allergens: string[];
  calorieTarget: number;
  notifyPush: boolean;
  notifyEmail: boolean;
  quietHoursOn: boolean;
  quietStart: string;
  quietEnd: string;
}

export interface DashboardData {
  stats: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    steps: number;
    activeMinutes: number;
    sleep: number;
    water: number;
  };
  macroTargets: { calories: number; protein: number; carbs: number; fat: number };
  weeklyBars: { day: string; minutes: number; calories: number }[];
  recentWorkouts: Workout[];
  goals: Goal[];
  isEmpty: boolean;
}

export interface ReportsData {
  totals: {
    workouts: number;
    minutes: number;
    calories: number;
    avgKcalDay: number;
  };
  weekly: { week: string; minutes: number; calories: number }[];
  workouts: Workout[];
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}
