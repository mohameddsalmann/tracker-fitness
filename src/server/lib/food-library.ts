import type { FoodItem } from "@/lib/types";

export const foodLibrary: FoodItem[] = [
  { name: "Chicken Breast (100g)", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "Brown Rice (1 cup)", calories: 216, protein: 5, carbs: 45, fat: 1.8 },
  { name: "Banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { name: "Egg (large)", calories: 72, protein: 6, carbs: 0.4, fat: 5 },
  { name: "Avocado (half)", calories: 160, protein: 2, carbs: 9, fat: 15 },
  { name: "Salmon (100g)", calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: "Greek Yogurt (1 cup)", calories: 100, protein: 17, carbs: 6, fat: 0.7 },
  { name: "Oatmeal (1 cup)", calories: 158, protein: 6, carbs: 27, fat: 3 },
  { name: "Almonds (28g)", calories: 164, protein: 6, carbs: 6, fat: 14 },
  { name: "Sweet Potato", calories: 112, protein: 2, carbs: 26, fat: 0.1 },
  { name: "Broccoli (1 cup)", calories: 55, protein: 4, carbs: 11, fat: 0.6 },
  { name: "Whey Protein (1 scoop)", calories: 120, protein: 24, carbs: 3, fat: 1.5 },
];

export function searchFoods(query: string, limit = 12): FoodItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return foodLibrary.slice(0, limit);
  return foodLibrary.filter((f) => f.name.toLowerCase().includes(q)).slice(0, limit);
}
