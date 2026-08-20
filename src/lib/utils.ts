import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generarPinAleatorio(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function getOrdenPin(id: string, existingPin?: string | null): string {
  if (existingPin && typeof existingPin === 'string' && existingPin.trim().length >= 4) {
    return existingPin.trim();
  }
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return String((Math.abs(hash) % 9000) + 1000);
}
