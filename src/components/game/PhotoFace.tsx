/**
 * Painted portrait for a procedural person (2026-11-14 portraits pass): one of the cropped painted heads, picked by
 * `pickPortrait` from the person's seed, age, sex and look, in a rounded frame with a soft rim. Sheets load lazily,
 * one chunk each; until a sheet arrives the SVG bust (`fallback`) shows instead.
 */
import { useEffect, useState, type ReactNode } from "react";
import { pickPortrait, type Sheet } from "@/game/portraits";
import type { Look, Sex } from "@/game/types";

const LOADERS: Record<Sheet, () => Promise<{ default: Record<string, string> }>> = {
  child: () => import("@/assets/art/portraits-child"),
  teen: () => import("@/assets/art/portraits-teen"),
  adult: () => import("@/assets/art/portraits-adult"),
  older: () => import("@/assets/art/portraits-older"),
  capes: () => import("@/assets/art/portraits-capes"),
};
const sheets = new Map<Sheet, Record<string, string>>();
const pending = new Map<Sheet, Promise<Record<string, string>>>();

function loadSheet(sheet: Sheet): Promise<Record<string, string>> {
  const hit = sheets.get(sheet);
  if (hit) return Promise.resolve(hit);
  let job = pending.get(sheet);
  if (!job) {
    job = LOADERS[sheet]().then((mod) => {
      sheets.set(sheet, mod.default);
      return mod.default;
    });
    pending.set(sheet, job);
  }
  return job;
}

export function PhotoFace({
  seed,
  age,
  sex,
  look,
  cape = false,
  className = "h-16 w-16",
  fallback,
  children,
}: {
  seed: number;
  age: number;
  sex: Sex;
  look?: Pick<Look, "skin" | "hair"> | null;
  cape?: boolean;
  className?: string;
  fallback?: ReactNode;
  children?: ReactNode;
}) {
  const meta = pickPortrait(seed, age, sex, look, cape);
  const [table, setTable] = useState(() => sheets.get(meta.sheet));
  useEffect(() => {
    let alive = true;
    loadSheet(meta.sheet).then((t) => alive && setTable(t));
    return () => {
      alive = false;
    };
  }, [meta.sheet]);
  const src = table?.[meta.id];
  if (!src) return <>{fallback}</>;
  return (
    <span className={`relative block overflow-hidden rounded-[26%] bg-[#141a26] ${className}`} data-portrait={meta.id}>
      <img src={src} alt="" draggable={false} decoding="async" className="block size-full object-cover object-top" />
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14),inset_0_-14px_18px_-12px_rgb(0_0_0/0.55)]" aria-hidden />
      {children}
    </span>
  );
}
