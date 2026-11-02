import { createContext } from "react";

/** Online matches name the other player; vs the computer it's just "Rival". */
export const RivalName = createContext("Rival");

export function buzz(pattern: number[]) {
  try {
    // Browsers refuse (and log) vibration before the first tap.
    const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
    if (ua && !ua.hasBeenActive) return;
    navigator.vibrate?.(pattern);
  } catch {
    /* no haptics */
  }
}
