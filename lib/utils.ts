import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

export function generateClubSlug(name: string, city: string | null): string {
  const base = city ? `${name}-${city}` : name;
  return slugify(base);
}

export function formatRating(rating: number | null): string {
  if (rating === null || rating === undefined) return "N/A";
  return rating.toFixed(1);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

