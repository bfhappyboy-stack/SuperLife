/**
 * Per-painting anchors for the Mystery hero cutouts (2026-11-16 suits pass), derived from each cutout's alpha mask
 * (`/workspace/pt1116suits/anchors.py`: neck = narrowest row under the head, shoulders = widest row under it; out-of-range
 * picks fall back to heroic 8-head proportions) and checked by eye. Fractions of the image box (0..1, top-left origin).
 * `tone` is the skin tone each painting was painted in (portraits.ts `Tone`), for the skin-tone variant lookup.
 * `cape` marks paintings that already wear a cape or long coat, so a cape layer is never stacked on top of one.
 */
import type { Tone } from "./portraits";

export interface HeroAnchor {
  top: number;
  bottom: number;
  neck: number;
  shoulder: number;
  sl: number;
  sr: number;
  hx: number;
  tone: Tone;
  cape?: boolean;
}

export const HERO_ANCHORS: Record<string, HeroAnchor> = {
  "mystery-arcane-f": { top: 0.01, bottom: 0.999, neck: 0.158, shoulder: 0.207, sl: 0.2985, sr: 0.6189, hx: 0.5, tone: "light", cape: true },
  "mystery-arcane-f-b": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.172, sl: 0.3534, sr: 0.6617, hx: 0.474, tone: "medium", cape: true },
  "mystery-arcane-f-b-teen": { top: 0.0, bottom: 0.996, neck: 0.149, shoulder: 0.199, sl: 0.3207, sr: 0.6465, hx: 0.5, tone: "medium", cape: true },
  "mystery-arcane-f-teen": { top: 0.001, bottom: 0.997, neck: 0.151, shoulder: 0.201, sl: 0.3309, sr: 0.6863, hx: 0.5, tone: "light", cape: true },
  "mystery-arcane-m": { top: 0.0, bottom: 0.999, neck: 0.103, shoulder: 0.19, sl: 0.3311, sr: 0.7438, hx: 0.503, tone: "light", cape: true },
  "mystery-arcane-m-b": { top: 0.001, bottom: 0.997, neck: 0.115, shoulder: 0.201, sl: 0.2915, sr: 0.7563, hx: 0.475, tone: "light", cape: true },
  "mystery-arcane-m-b-teen": { top: 0.0, bottom: 0.997, neck: 0.119, shoulder: 0.2, sl: 0.2944, sr: 0.7401, hx: 0.464, tone: "light", cape: true },
  "mystery-arcane-m-teen": { top: 0.001, bottom: 0.999, neck: 0.151, shoulder: 0.201, sl: 0.3481, sr: 0.6464, hx: 0.5, tone: "light", cape: true },
  "mystery-fire-f": { top: 0.0, bottom: 0.999, neck: 0.158, shoulder: 0.219, sl: 0.3209, sr: 0.9189, hx: 0.598, tone: "medium" },
  "mystery-fire-f-b": { top: 0.0, bottom: 0.997, neck: 0.15, shoulder: 0.199, sl: 0.2941, sr: 0.8445, hx: 0.504, tone: "medium" },
  "mystery-fire-f-b-teen": { top: 0.001, bottom: 0.999, neck: 0.151, shoulder: 0.201, sl: 0.31, sr: 0.74, hx: 0.517, tone: "medium" },
  "mystery-fire-f-teen": { top: 0.0, bottom: 0.999, neck: 0.16, shoulder: 0.197, sl: 0.2968, sr: 0.8032, hx: 0.542, tone: "medium" },
  "mystery-fire-m": { top: 0.0, bottom: 0.999, neck: 0.122, shoulder: 0.21, sl: 0.3013, sr: 0.9199, hx: 0.571, tone: "medium" },
  "mystery-fire-m-b": { top: 0.003, bottom: 0.999, neck: 0.104, shoulder: 0.19, sl: 0.212, sr: 0.8905, hx: 0.459, tone: "medium" },
  "mystery-fire-m-b-teen": { top: 0.001, bottom: 0.997, neck: 0.129, shoulder: 0.217, sl: 0.231, sr: 0.8483, hx: 0.462, tone: "medium" },
  "mystery-fire-m-teen": { top: 0.0, bottom: 0.999, neck: 0.122, shoulder: 0.208, sl: 0.2761, sr: 0.8384, hx: 0.505, tone: "medium" },
  "mystery-ice-f": { top: 0.0, bottom: 0.999, neck: 0.151, shoulder: 0.226, sl: 0.322, sr: 0.9545, hx: 0.591, tone: "light" },
  "mystery-ice-f-b": { top: 0.0, bottom: 0.999, neck: 0.131, shoulder: 0.215, sl: 0.2257, sr: 0.8717, hx: 0.518, tone: "light" },
  "mystery-ice-f-b-teen": { top: 0.001, bottom: 0.997, neck: 0.151, shoulder: 0.201, sl: 0.3423, sr: 0.8154, hx: 0.542, tone: "light" },
  "mystery-ice-f-teen": { top: 0.003, bottom: 0.999, neck: 0.156, shoulder: 0.207, sl: 0.2744, sr: 0.8496, hx: 0.523, tone: "light" },
  "mystery-ice-m": { top: 0.0, bottom: 0.999, neck: 0.114, shoulder: 0.199, sl: 0.3057, sr: 0.9682, hx: 0.583, tone: "light" },
  "mystery-ice-m-b": { top: 0.0, bottom: 0.997, neck: 0.15, shoulder: 0.199, sl: 0.2776, sr: 0.8683, hx: 0.477, tone: "light" },
  "mystery-ice-m-b-teen": { top: 0.0, bottom: 0.994, neck: 0.149, shoulder: 0.179, sl: 0.3551, sr: 0.8841, hx: 0.533, tone: "light" },
  "mystery-ice-m-teen": { top: 0.0, bottom: 0.997, neck: 0.122, shoulder: 0.208, sl: 0.3311, sr: 0.9331, hx: 0.558, tone: "light" },
  "mystery-life-f": { top: 0.0, bottom: 0.997, neck: 0.15, shoulder: 0.199, sl: 0.1911, sr: 0.7764, hx: 0.496, tone: "medium" },
  "mystery-life-f-b": { top: 0.001, bottom: 0.999, neck: 0.119, shoulder: 0.206, sl: 0.1765, sr: 0.7543, hx: 0.422, tone: "medium" },
  "mystery-life-f-b-teen": { top: 0.001, bottom: 0.999, neck: 0.151, shoulder: 0.201, sl: 0.1604, sr: 0.6997, hx: 0.444, tone: "medium" },
  "mystery-life-f-teen": { top: 0.001, bottom: 0.997, neck: 0.151, shoulder: 0.201, sl: 0.2391, sr: 0.779, hx: 0.529, tone: "medium" },
  "mystery-life-m": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.2, sl: 0.4209, sr: 0.7374, hx: 0.559, tone: "brown" },
  "mystery-life-m-b": { top: 0.001, bottom: 0.999, neck: 0.151, shoulder: 0.186, sl: 0.2058, sr: 0.8809, hx: 0.498, tone: "medium" },
  "mystery-life-m-b-teen": { top: 0.004, bottom: 0.994, neck: 0.124, shoulder: 0.21, sl: 0.1976, sr: 0.8656, hx: 0.478, tone: "medium" },
  "mystery-life-m-teen": { top: 0.001, bottom: 0.999, neck: 0.139, shoulder: 0.226, sl: 0.2717, sr: 0.9057, hx: 0.54, tone: "brown" },
  "mystery-might-f": { top: 0.0, bottom: 0.999, neck: 0.115, shoulder: 0.203, sl: 0.2437, sr: 0.8817, hx: 0.505, tone: "light" },
  "mystery-might-f-b": { top: 0.001, bottom: 0.996, neck: 0.151, shoulder: 0.2, sl: 0.3531, sr: 0.8741, hx: 0.535, tone: "medium" },
  "mystery-might-f-b-teen": { top: 0.001, bottom: 0.997, neck: 0.122, shoulder: 0.207, sl: 0.2776, sr: 0.9049, hx: 0.528, tone: "light" },
  "mystery-might-f-teen": { top: 0.001, bottom: 0.997, neck: 0.118, shoulder: 0.206, sl: 0.25, sr: 0.8846, hx: 0.5, tone: "light" },
  "mystery-might-m": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.185, sl: 0.206, sr: 0.8904, hx: 0.495, tone: "brown" },
  "mystery-might-m-b": { top: 0.001, bottom: 0.997, neck: 0.101, shoulder: 0.189, sl: 0.1865, sr: 0.8875, hx: 0.463, tone: "medium" },
  "mystery-might-m-b-teen": { top: 0.001, bottom: 0.999, neck: 0.118, shoulder: 0.203, sl: 0.2261, sr: 0.908, hx: 0.498, tone: "medium" },
  "mystery-might-m-teen": { top: 0.001, bottom: 0.999, neck: 0.113, shoulder: 0.2, sl: 0.2366, sr: 0.8996, hx: 0.502, tone: "brown" },
  "mystery-mind-f": { top: 0.0, bottom: 0.999, neck: 0.186, shoulder: 0.271, sl: 0.1942, sr: 0.741, hx: 0.424, tone: "dark", cape: true },
  "mystery-mind-f-b": { top: 0.003, bottom: 0.999, neck: 0.143, shoulder: 0.231, sl: 0.3034, sr: 0.7079, hx: 0.486, tone: "medium", cape: true },
  "mystery-mind-f-b-teen": { top: 0.0, bottom: 0.997, neck: 0.151, shoulder: 0.237, sl: 0.3152, sr: 0.7163, hx: 0.487, tone: "brown", cape: true },
  "mystery-mind-f-teen": { top: 0.001, bottom: 0.999, neck: 0.188, shoulder: 0.275, sl: 0.2061, sr: 0.6959, hx: 0.419, tone: "dark", cape: true },
  "mystery-mind-m": { top: 0.0, bottom: 0.999, neck: 0.128, shoulder: 0.215, sl: 0.3438, sr: 0.9219, hx: 0.584, tone: "medium", cape: true },
  "mystery-mind-m-b": { top: 0.001, bottom: 0.997, neck: 0.133, shoulder: 0.218, sl: 0.2633, sr: 0.7367, hx: 0.442, tone: "light", cape: true },
  "mystery-mind-m-b-teen": { top: 0.003, bottom: 0.997, neck: 0.126, shoulder: 0.214, sl: 0.2704, sr: 0.693, hx: 0.425, tone: "light", cape: true },
  "mystery-mind-m-teen": { top: 0.0, bottom: 0.997, neck: 0.128, shoulder: 0.215, sl: 0.3692, sr: 0.8862, hx: 0.582, tone: "medium", cape: true },
  "mystery-storm-f": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.2, sl: 0.0271, sr: 0.6657, hx: 0.434, tone: "light" },
  "mystery-storm-f-b": { top: 0.003, bottom: 0.999, neck: 0.152, shoulder: 0.202, sl: 0.2479, sr: 0.6781, hx: 0.45, tone: "medium" },
  "mystery-storm-f-b-teen": { top: 0.003, bottom: 0.997, neck: 0.161, shoulder: 0.242, sl: 0.2628, sr: 0.719, hx: 0.429, tone: "light" },
  "mystery-storm-f-teen": { top: 0.003, bottom: 0.997, neck: 0.181, shoulder: 0.267, sl: 0.2559, sr: 0.811, hx: 0.531, tone: "light" },
  "mystery-storm-m": { top: 0.0, bottom: 0.999, neck: 0.11, shoulder: 0.197, sl: 0.2656, sr: 0.8531, hx: 0.516, tone: "dark" },
  "mystery-storm-m-b": { top: 0.001, bottom: 0.997, neck: 0.151, shoulder: 0.176, sl: 0.3585, sr: 0.739, hx: 0.488, tone: "light" },
  "mystery-storm-m-b-teen": { top: 0.001, bottom: 0.999, neck: 0.122, shoulder: 0.204, sl: 0.3394, sr: 0.7539, hx: 0.5, tone: "light" },
  "mystery-storm-m-teen": { top: 0.001, bottom: 0.997, neck: 0.132, shoulder: 0.217, sl: 0.2789, sr: 0.8639, hx: 0.517, tone: "dark" },
  "mystery-swift-f": { top: 0.0, bottom: 0.999, neck: 0.174, shoulder: 0.261, sl: 0.3283, sr: 0.8223, hx: 0.506, tone: "medium" },
  "mystery-swift-f-b": { top: 0.001, bottom: 0.997, neck: 0.151, shoulder: 0.201, sl: 0.336, sr: 0.8024, hx: 0.557, tone: "light" },
  "mystery-swift-f-b-teen": { top: 0.001, bottom: 0.996, neck: 0.161, shoulder: 0.246, sl: 0.2731, sr: 0.8081, hx: 0.509, tone: "light" },
  "mystery-swift-f-teen": { top: 0.001, bottom: 0.999, neck: 0.151, shoulder: 0.201, sl: 0.3323, sr: 0.6586, hx: 0.495, tone: "medium" },
  "mystery-swift-m": { top: 0.0, bottom: 0.999, neck: 0.14, shoulder: 0.225, sl: 0.2493, sr: 0.858, hx: 0.487, tone: "medium" },
  "mystery-swift-m-teen": { top: 0.001, bottom: 0.997, neck: 0.14, shoulder: 0.228, sl: 0.2684, sr: 0.8437, hx: 0.484, tone: "medium" },
  "mystery-veil-f": { top: 0.0, bottom: 0.999, neck: 0.136, shoulder: 0.222, sl: 0.2746, sr: 0.6448, hx: 0.436, tone: "light", cape: true },
  "mystery-veil-f-b": { top: 0.001, bottom: 0.999, neck: 0.151, shoulder: 0.201, sl: 0.2778, sr: 0.7546, hx: 0.514, tone: "light", cape: true },
  "mystery-veil-f-b-teen": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.2, sl: 0.2649, sr: 0.7463, hx: 0.511, tone: "light", cape: true },
  "mystery-veil-f-teen": { top: 0.0, bottom: 0.997, neck: 0.143, shoulder: 0.231, sl: 0.2931, sr: 0.6918, hx: 0.465, tone: "light", cape: true },
  "mystery-veil-m": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.183, sl: 0.2553, sr: 0.8617, hx: 0.514, tone: "light", cape: true },
  "mystery-veil-m-b": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.2, sl: 0.3162, sr: 0.812, hx: 0.47, tone: "light", cape: true },
  "mystery-veil-m-b-teen": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.2, sl: 0.3348, sr: 0.8155, hx: 0.489, tone: "light", cape: true },
  "mystery-veil-m-teen": { top: 0.001, bottom: 0.999, neck: 0.151, shoulder: 0.201, sl: 0.3156, sr: 0.7143, hx: 0.478, tone: "light", cape: true },
};
