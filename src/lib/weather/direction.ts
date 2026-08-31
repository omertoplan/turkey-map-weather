/** Shared compass-direction formatting (Turkish abbreviations). */
const DIRS = ["K", "KD", "D", "GD", "G", "GB", "B", "KB"] as const;

export function windDirLabel(deg: number): string {
  return DIRS[Math.round((((deg % 360) + 360) % 360) / 45) % 8]!;
}
