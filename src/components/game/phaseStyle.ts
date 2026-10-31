import { Baby, Compass, Briefcase, TrendingUp, Flame, Landmark, GraduationCap, Moon, type LucideIcon } from "lucide-react";

/** Per-chapter-phase accent: colour, icon and the motif drawn over the chapter art. Kept subtle on purpose. */
export interface PhaseStyle {
  accent: string;
  icon: LucideIcon;
  motif: "sparks" | "rise" | "grid" | "beams" | "rain" | "laurel" | "stars" | "moon";
}

export const PHASE_STYLE: Record<string, PhaseStyle> = {
  origin: { accent: "#ffc478", icon: Baby, motif: "sparks" },
  coming: { accent: "#50dcc8", icon: Compass, motif: "rise" },
  early: { accent: "#78a0ff", icon: Briefcase, motif: "grid" },
  rising: { accent: "#ffc85a", icon: TrendingUp, motif: "beams" },
  crisis: { accent: "#ff5a5a", icon: Flame, motif: "rain" },
  legacy: { accent: "#ffaa5a", icon: Landmark, motif: "laurel" },
  mentor: { accent: "#be8cff", icon: GraduationCap, motif: "stars" },
  final: { accent: "#ff82a0", icon: Moon, motif: "moon" },
};

export const phaseStyle = (phase: string | undefined): PhaseStyle => PHASE_STYLE[phase ?? ""] ?? PHASE_STYLE.origin;
