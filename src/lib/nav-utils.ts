export function isNavActive(pathname: string, to: string): boolean {
  if (to === "/workouts/log") return pathname === "/workouts/log";
  if (to === "/workouts") return pathname === "/workouts";
  if (to === "/dashboard") return pathname === "/dashboard" || pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}
