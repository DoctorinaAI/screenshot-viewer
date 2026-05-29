import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine class names with Tailwind-aware deduplication. Later utilities
 * win when they conflict — this is how variant + caller override works
 * without `!important`.
 *
 * @example
 *   <div class={cn("rounded-lg border p-4", local.class)}>
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
