import type { Workout } from "@/lib/types";

export function downloadBlob(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function workoutsToCsv(workouts: Workout[]) {
  const headers = ["id", "date", "type", "duration", "calories", "exercises"];
  const rows = workouts.map((w) =>
    [
      w.id,
      w.date,
      w.type,
      w.duration,
      w.calories,
      JSON.stringify(w.exercises),
    ]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}

export function workoutsToJson(workouts: Workout[]) {
  return JSON.stringify(workouts, null, 2);
}
