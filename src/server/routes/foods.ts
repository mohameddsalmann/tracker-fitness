import { json } from "../lib/auth";
import { searchFoods } from "../lib/food-library";

export async function handleFoods(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const items = searchFoods(q);
  return json({ items });
}
