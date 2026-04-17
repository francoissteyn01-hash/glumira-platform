import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function glucoseStatus(mmol: number): "low" | "normal" | "high" | "critical" {
  if (mmol < 3.9)  return "low";
  if (mmol <= 10.0) return "normal";
  if (mmol <= 13.9) return "high";
  return "critical";
}
export function timeAgo(date: Date | string): string {
  const d    = typeof date === "string" ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}
export function clamp(v: number, min: number, max: number) { return Math.min(Math.max(v, min), max); }
