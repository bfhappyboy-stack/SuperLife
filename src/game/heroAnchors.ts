/**
 * Per-painting anchors for the Mystery hero cutouts (2026-11-16 suits pass), derived from each cutout's alpha mask
 * (`/workspace/pt1116suits/anchors.py`: neck = narrowest row under the head, shoulders = widest row under it; out-of-range
 * picks fall back to heroic 8-head proportions) and checked by eye. Fractions of the image box (0..1, top-left origin).
 * `tone` is the skin tone each painting was painted in (portraits.ts `Tone`), for the skin-tone variant lookup.
 * `cape` marks paintings that already wear a cape, cloak or long coat, so a cape layer is never stacked on top of one.
 * Skin-tone variants (`-s1..4`) have their own rows: they are repaints, so their framing differs a little.
 * Part-fit fields (`sy`..`cy`) come from `/workspace/pt1116suits/fit.py`.
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
  /** Shoulder line (y), shoulder centre (x) and shoulder width (fraction of the image width): where a cape's collar
   * sits and how wide it is. Measured on the alpha mask at 20% of the figure's height when it reads as shoulders,
   * else heroic proportions (shoulders ~ 0.245 of the height for men, 0.215 for women, 7% less for teens). */
  sy: number;
  cx: number;
  sw: number;
  /** Waist (belt) line y, its centre x and width, and the chest (badge) height. */
  wy: number;
  wx: number;
  ww: number;
  cy: number;
  /** The cutout's own aspect (width / height), so parts keep their proportions inside its box. */
  ar: number;
  cape?: boolean;
}

export const HERO_ANCHORS: Record<string, HeroAnchor> = {
  "mystery-arcane-f": { top: 0.01, bottom: 0.999, neck: 0.158, shoulder: 0.207, sl: 0.2985, sr: 0.6189, hx: 0.5, tone: "light", sy: 0.2542, cx: 0.5, sw: 0.3496, wy: 0.4764, wx: 0.5, ww: 0.2098, cy: 0.3375, ar: 0.5722, cape: true },
  "mystery-arcane-f-b": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.172, sl: 0.3534, sr: 0.6617, hx: 0.474, tone: "medium", sy: 0.2, cx: 0.4881, sw: 0.3484, wy: 0.4389, wx: 0.495, ww: 0.209, cy: 0.2903, ar: 0.5542, cape: true },
  "mystery-arcane-f-b-teen": { top: 0.0, bottom: 0.996, neck: 0.149, shoulder: 0.199, sl: 0.3207, sr: 0.6465, hx: 0.5, tone: "medium", sy: 0.1986, cx: 0.5088, sw: 0.3308, wy: 0.4375, wx: 0.5391, ww: 0.1985, cy: 0.2875, ar: 0.55, cape: true },
  "mystery-arcane-f-s2": { top: 0.01, bottom: 0.999, neck: 0.158, shoulder: 0.207, sl: 0.2985, sr: 0.6189, hx: 0.5, tone: "medium", sy: 0.2, cx: 0.5, sw: 0.3483, wy: 0.4389, wx: 0.5, ww: 0.209, cy: 0.2889, ar: 0.6139, cape: true },
  "mystery-arcane-f-s4": { top: 0.01, bottom: 0.999, neck: 0.158, shoulder: 0.207, sl: 0.2985, sr: 0.6189, hx: 0.5, tone: "dark", sy: 0.1986, cx: 0.5, sw: 0.3516, wy: 0.4375, wx: 0.5, ww: 0.211, cy: 0.2889, ar: 0.6097, cape: true },
  "mystery-arcane-f-teen": { top: 0.001, bottom: 0.997, neck: 0.151, shoulder: 0.201, sl: 0.3309, sr: 0.6863, hx: 0.5, tone: "light", sy: 0.2, cx: 0.5208, sw: 0.326, wy: 0.4389, wx: 0.538, ww: 0.1956, cy: 0.2889, ar: 0.5667, cape: true },
  "mystery-arcane-m": { top: 0.0, bottom: 0.999, neck: 0.103, shoulder: 0.19, sl: 0.3311, sr: 0.7438, hx: 0.503, tone: "light", sy: 0.1986, cx: 0.5272, sw: 0.4286, wy: 0.4389, wx: 0.5363, ww: 0.2571, cy: 0.2889, ar: 0.6125, cape: true },
  "mystery-arcane-m-b": { top: 0.001, bottom: 0.997, neck: 0.115, shoulder: 0.201, sl: 0.2915, sr: 0.7563, hx: 0.475, tone: "light", sy: 0.2, cx: 0.5088, sw: 0.4623, wy: 0.4389, wx: 0.5226, ww: 0.2774, cy: 0.2889, ar: 0.5528, cape: true },
  "mystery-arcane-m-b-teen": { top: 0.0, bottom: 0.997, neck: 0.119, shoulder: 0.2, sl: 0.2944, sr: 0.7401, hx: 0.464, tone: "light", sy: 0.2, cx: 0.506, sw: 0.4403, wy: 0.4389, wx: 0.5172, ww: 0.2642, cy: 0.2889, ar: 0.5236, cape: true },
  "mystery-arcane-m-s2": { top: 0.0, bottom: 0.999, neck: 0.103, shoulder: 0.19, sl: 0.3311, sr: 0.7438, hx: 0.503, tone: "medium", sy: 0.1986, cx: 0.5366, sw: 0.4697, wy: 0.4375, wx: 0.548, ww: 0.2818, cy: 0.2875, ar: 0.55, cape: true },
  "mystery-arcane-m-s3": { top: 0.0, bottom: 0.999, neck: 0.103, shoulder: 0.19, sl: 0.3311, sr: 0.7438, hx: 0.503, tone: "brown", sy: 0.2, cx: 0.5247, sw: 0.4721, wy: 0.4389, wx: 0.533, ww: 0.2832, cy: 0.2903, ar: 0.5472, cape: true },
  "mystery-arcane-m-s4": { top: 0.0, bottom: 0.999, neck: 0.103, shoulder: 0.19, sl: 0.3311, sr: 0.7438, hx: 0.503, tone: "dark", sy: 0.1986, cx: 0.5297, sw: 0.481, wy: 0.4389, wx: 0.5494, ww: 0.2886, cy: 0.2889, ar: 0.5486, cape: true },
  "mystery-arcane-m-teen": { top: 0.001, bottom: 0.999, neck: 0.151, shoulder: 0.201, sl: 0.3481, sr: 0.6464, hx: 0.5, tone: "light", sy: 0.2, cx: 0.5214, sw: 0.442, wy: 0.4389, wx: 0.5442, ww: 0.2652, cy: 0.2903, ar: 0.5028, cape: true },
  "mystery-fire-f": { top: 0.0, bottom: 0.999, neck: 0.158, shoulder: 0.219, sl: 0.3209, sr: 0.9189, hx: 0.598, tone: "medium", sy: 0.1986, cx: 0.5625, sw: 0.5236, wy: 0.4389, wx: 0.5473, ww: 0.3851, cy: 0.2889, ar: 0.4111 },
  "mystery-fire-f-b": { top: 0.0, bottom: 0.997, neck: 0.15, shoulder: 0.199, sl: 0.2941, sr: 0.8445, hx: 0.504, tone: "medium", sy: 0.1986, cx: 0.5578, sw: 0.6303, wy: 0.4375, wx: 0.584, ww: 0.3782, cy: 0.2875, ar: 0.3306 },
  "mystery-fire-f-b-teen": { top: 0.001, bottom: 0.999, neck: 0.151, shoulder: 0.201, sl: 0.31, sr: 0.74, hx: 0.517, tone: "medium", sy: 0.2, cx: 0.5017, sw: 0.4785, wy: 0.4389, wx: 0.5017, ww: 0.2871, cy: 0.2903, ar: 0.4167 },
  "mystery-fire-f-s1": { top: 0.0, bottom: 0.999, neck: 0.158, shoulder: 0.219, sl: 0.3209, sr: 0.9189, hx: 0.598, tone: "light", sy: 0.1986, cx: 0.5306, sw: 0.4987, wy: 0.4389, wx: 0.5129, ww: 0.3613, cy: 0.2889, ar: 0.4306 },
  "mystery-fire-f-s3": { top: 0.0, bottom: 0.999, neck: 0.158, shoulder: 0.219, sl: 0.3209, sr: 0.9189, hx: 0.598, tone: "brown", sy: 0.2, cx: 0.5376, sw: 0.5284, wy: 0.4389, wx: 0.5234, ww: 0.3846, cy: 0.2903, ar: 0.4153 },
  "mystery-fire-f-s4": { top: 0.0, bottom: 0.999, neck: 0.158, shoulder: 0.219, sl: 0.3209, sr: 0.9189, hx: 0.598, tone: "dark", sy: 0.2014, cx: 0.5455, sw: 0.5464, wy: 0.4403, wx: 0.5309, ww: 0.3952, cy: 0.2903, ar: 0.4042 },
  "mystery-fire-f-teen": { top: 0.0, bottom: 0.999, neck: 0.16, shoulder: 0.197, sl: 0.2968, sr: 0.8032, hx: 0.542, tone: "medium", sy: 0.2, cx: 0.5556, sw: 0.4419, wy: 0.4389, wx: 0.5887, ww: 0.2652, cy: 0.2903, ar: 0.4306 },
  "mystery-fire-m": { top: 0.0, bottom: 0.999, neck: 0.122, shoulder: 0.21, sl: 0.3013, sr: 0.9199, hx: 0.571, tone: "medium", sy: 0.1986, cx: 0.5913, sw: 0.5897, wy: 0.4389, wx: 0.6058, ww: 0.3538, cy: 0.2889, ar: 0.4333 },
  "mystery-fire-m-b": { top: 0.003, bottom: 0.999, neck: 0.104, shoulder: 0.19, sl: 0.212, sr: 0.8905, hx: 0.459, tone: "medium", sy: 0.2014, cx: 0.5018, sw: 0.544, wy: 0.4403, wx: 0.5018, ww: 0.3264, cy: 0.2903, ar: 0.3931 },
  "mystery-fire-m-b-teen": { top: 0.001, bottom: 0.997, neck: 0.129, shoulder: 0.217, sl: 0.231, sr: 0.8483, hx: 0.462, tone: "medium", sy: 0.2, cx: 0.5095, sw: 0.5828, wy: 0.4389, wx: 0.5466, ww: 0.3497, cy: 0.2903, ar: 0.4028 },
  "mystery-fire-m-s1": { top: 0.0, bottom: 0.999, neck: 0.122, shoulder: 0.21, sl: 0.3013, sr: 0.9199, hx: 0.571, tone: "light", sy: 0.2014, cx: 0.5684, sw: 0.5532, wy: 0.4403, wx: 0.5836, ww: 0.3319, cy: 0.2903, ar: 0.4569 },
  "mystery-fire-m-s3": { top: 0.0, bottom: 0.999, neck: 0.122, shoulder: 0.21, sl: 0.3013, sr: 0.9199, hx: 0.571, tone: "brown", sy: 0.2014, cx: 0.5455, sw: 0.5455, wy: 0.4403, wx: 0.5601, ww: 0.3273, cy: 0.2903, ar: 0.4736 },
  "mystery-fire-m-s4": { top: 0.0, bottom: 0.999, neck: 0.122, shoulder: 0.21, sl: 0.3013, sr: 0.9199, hx: 0.571, tone: "dark", sy: 0.1986, cx: 0.5648, sw: 0.4771, wy: 0.4389, wx: 0.5648, ww: 0.2863, cy: 0.2889, ar: 0.45 },
  "mystery-fire-m-teen": { top: 0.0, bottom: 0.999, neck: 0.122, shoulder: 0.208, sl: 0.2761, sr: 0.8384, hx: 0.505, tone: "medium", sy: 0.1986, cx: 0.5337, sw: 0.5387, wy: 0.4389, wx: 0.5556, ww: 0.3232, cy: 0.2889, ar: 0.4125 },
  "mystery-ice-f": { top: 0.0, bottom: 0.999, neck: 0.151, shoulder: 0.226, sl: 0.322, sr: 0.9545, hx: 0.591, tone: "light", sy: 0.1986, cx: 0.6098, sw: 0.6212, wy: 0.4389, wx: 0.6364, ww: 0.3727, cy: 0.2889, ar: 0.3667 },
  "mystery-ice-f-b": { top: 0.0, bottom: 0.999, neck: 0.131, shoulder: 0.215, sl: 0.2257, sr: 0.8717, hx: 0.518, tone: "light", sy: 0.2, cx: 0.5487, sw: 0.6327, wy: 0.4389, wx: 0.5509, ww: 0.3796, cy: 0.2903, ar: 0.3139 },
  "mystery-ice-f-b-teen": { top: 0.001, bottom: 0.997, neck: 0.151, shoulder: 0.201, sl: 0.3423, sr: 0.8154, hx: 0.542, tone: "light", sy: 0.2, cx: 0.5808, sw: 0.5962, wy: 0.4389, wx: 0.5942, ww: 0.3577, cy: 0.2889, ar: 0.3611 },
  "mystery-ice-f-s2": { top: 0.0, bottom: 0.999, neck: 0.151, shoulder: 0.226, sl: 0.322, sr: 0.9545, hx: 0.591, tone: "medium", sy: 0.2, cx: 0.5525, sw: 0.6849, wy: 0.4389, wx: 0.5735, ww: 0.4109, cy: 0.2903, ar: 0.3306 },
  "mystery-ice-f-s3": { top: 0.0, bottom: 0.999, neck: 0.151, shoulder: 0.226, sl: 0.322, sr: 0.9545, hx: 0.591, tone: "brown", sy: 0.2, cx: 0.614, sw: 0.5719, wy: 0.4389, wx: 0.6333, ww: 0.3432, cy: 0.2903, ar: 0.3958 },
  "mystery-ice-f-s4": { top: 0.0, bottom: 0.999, neck: 0.151, shoulder: 0.226, sl: 0.322, sr: 0.9545, hx: 0.591, tone: "dark", sy: 0.1986, cx: 0.544, sw: 0.6824, wy: 0.4375, wx: 0.5644, ww: 0.4094, cy: 0.2889, ar: 0.3236 },
  "mystery-ice-f-teen": { top: 0.003, bottom: 0.999, neck: 0.156, shoulder: 0.207, sl: 0.2744, sr: 0.8496, hx: 0.523, tone: "light", sy: 0.2014, cx: 0.5423, sw: 0.5677, wy: 0.4403, wx: 0.562, ww: 0.3406, cy: 0.2903, ar: 0.3694 },
  "mystery-ice-m": { top: 0.0, bottom: 0.999, neck: 0.114, shoulder: 0.199, sl: 0.3057, sr: 0.9682, hx: 0.583, tone: "light", sy: 0.2, cx: 0.5693, sw: 0.6561, wy: 0.4389, wx: 0.5271, ww: 0.3662, cy: 0.2903, ar: 0.4361 },
  "mystery-ice-m-b": { top: 0.0, bottom: 0.997, neck: 0.15, shoulder: 0.199, sl: 0.2776, sr: 0.8683, hx: 0.477, tone: "light", sy: 0.1986, cx: 0.5623, sw: 0.6868, wy: 0.4375, wx: 0.5712, ww: 0.4121, cy: 0.2889, ar: 0.3903 },
  "mystery-ice-m-b-teen": { top: 0.0, bottom: 0.994, neck: 0.149, shoulder: 0.179, sl: 0.3551, sr: 0.8841, hx: 0.533, tone: "light", sy: 0.1986, cx: 0.6005, sw: 0.5761, wy: 0.4375, wx: 0.6105, ww: 0.3457, cy: 0.2875, ar: 0.3833 },
  "mystery-ice-m-s2": { top: 0.0, bottom: 0.999, neck: 0.114, shoulder: 0.199, sl: 0.3057, sr: 0.9682, hx: 0.583, tone: "medium", sy: 0.2, cx: 0.525, sw: 0.6833, wy: 0.4389, wx: 0.4833, ww: 0.38, cy: 0.2903, ar: 0.4167 },
  "mystery-ice-m-s3": { top: 0.0, bottom: 0.999, neck: 0.114, shoulder: 0.199, sl: 0.3057, sr: 0.9682, hx: 0.583, tone: "brown", sy: 0.2014, cx: 0.5437, sw: 0.6413, wy: 0.4403, wx: 0.5032, ww: 0.3524, cy: 0.2903, ar: 0.4375 },
  "mystery-ice-m-s4": { top: 0.0, bottom: 0.999, neck: 0.114, shoulder: 0.199, sl: 0.3057, sr: 0.9682, hx: 0.583, tone: "dark", sy: 0.2, cx: 0.4699, sw: 0.6976, wy: 0.4389, wx: 0.4278, ww: 0.3883, cy: 0.2903, ar: 0.4042 },
  "mystery-ice-m-teen": { top: 0.0, bottom: 0.997, neck: 0.122, shoulder: 0.208, sl: 0.3311, sr: 0.9331, hx: 0.558, tone: "light", sy: 0.1986, cx: 0.5527, sw: 0.5619, wy: 0.4375, wx: 0.5234, ww: 0.3512, cy: 0.2889, ar: 0.4153 },
  "mystery-life-f": { top: 0.0, bottom: 0.997, neck: 0.15, shoulder: 0.199, sl: 0.1911, sr: 0.7764, hx: 0.496, tone: "medium", sy: 0.1986, cx: 0.498, sw: 0.6667, wy: 0.4375, wx: 0.5203, ww: 0.4, cy: 0.2875, ar: 0.3417 },
  "mystery-life-f-b": { top: 0.001, bottom: 0.999, neck: 0.119, shoulder: 0.206, sl: 0.1765, sr: 0.7543, hx: 0.422, tone: "medium", sy: 0.2, cx: 0.4533, sw: 0.564, wy: 0.4389, wx: 0.4689, ww: 0.3384, cy: 0.2889, ar: 0.4014, cape: true },
  "mystery-life-f-b-teen": { top: 0.001, bottom: 0.999, neck: 0.151, shoulder: 0.201, sl: 0.1604, sr: 0.6997, hx: 0.444, tone: "medium", sy: 0.2, cx: 0.4283, sw: 0.6075, wy: 0.4389, wx: 0.4369, ww: 0.3645, cy: 0.2903, ar: 0.4069, cape: true },
  "mystery-life-f-s1": { top: 0.0, bottom: 0.997, neck: 0.15, shoulder: 0.199, sl: 0.1911, sr: 0.7764, hx: 0.496, tone: "light", sy: 0.2, cx: 0.5242, sw: 0.6532, wy: 0.4389, wx: 0.5444, ww: 0.3919, cy: 0.2889, ar: 0.3444 },
  "mystery-life-f-s3": { top: 0.0, bottom: 0.997, neck: 0.15, shoulder: 0.199, sl: 0.1911, sr: 0.7764, hx: 0.496, tone: "brown", sy: 0.1986, cx: 0.5342, sw: 0.5878, wy: 0.4389, wx: 0.5342, ww: 0.3527, cy: 0.2889, ar: 0.3653 },
  "mystery-life-f-s4": { top: 0.0, bottom: 0.997, neck: 0.15, shoulder: 0.199, sl: 0.1911, sr: 0.7764, hx: 0.496, tone: "dark", sy: 0.2014, cx: 0.5428, sw: 0.6274, wy: 0.4403, wx: 0.5608, ww: 0.3764, cy: 0.2903, ar: 0.3653 },
  "mystery-life-f-teen": { top: 0.001, bottom: 0.997, neck: 0.151, shoulder: 0.201, sl: 0.2391, sr: 0.779, hx: 0.529, tone: "medium", sy: 0.2, cx: 0.5317, sw: 0.5688, wy: 0.4389, wx: 0.5489, ww: 0.3413, cy: 0.2889, ar: 0.3833 },
  "mystery-life-m": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.2, sl: 0.4209, sr: 0.7374, hx: 0.559, tone: "brown", sy: 0.1986, cx: 0.5412, sw: 0.5926, wy: 0.4375, wx: 0.5051, ww: 0.3771, cy: 0.2889, ar: 0.4125 },
  "mystery-life-m-b": { top: 0.001, bottom: 0.999, neck: 0.151, shoulder: 0.186, sl: 0.2058, sr: 0.8809, hx: 0.498, tone: "medium", sy: 0.2, cx: 0.5271, sw: 0.7148, wy: 0.4389, wx: 0.5379, ww: 0.4289, cy: 0.2889, ar: 0.3847 },
  "mystery-life-m-b-teen": { top: 0.004, bottom: 0.994, neck: 0.124, shoulder: 0.21, sl: 0.1976, sr: 0.8656, hx: 0.478, tone: "medium", sy: 0.2014, cx: 0.5296, sw: 0.6443, wy: 0.4389, wx: 0.5356, ww: 0.3866, cy: 0.2903, ar: 0.3514 },
  "mystery-life-m-s1": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.2, sl: 0.4209, sr: 0.7374, hx: 0.559, tone: "light", sy: 0.1986, cx: 0.5299, sw: 0.6146, wy: 0.4389, wx: 0.5017, ww: 0.3787, cy: 0.2889, ar: 0.4181 },
  "mystery-life-m-s2": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.2, sl: 0.4209, sr: 0.7374, hx: 0.559, tone: "medium", sy: 0.2014, cx: 0.5242, sw: 0.6455, wy: 0.4403, wx: 0.4916, ww: 0.3946, cy: 0.2903, ar: 0.4153 },
  "mystery-life-m-s4": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.2, sl: 0.4209, sr: 0.7374, hx: 0.559, tone: "dark", sy: 0.1986, cx: 0.5281, sw: 0.6358, wy: 0.4389, wx: 0.4983, ww: 0.3874, cy: 0.2889, ar: 0.4194 },
  "mystery-life-m-teen": { top: 0.001, bottom: 0.999, neck: 0.139, shoulder: 0.226, sl: 0.2717, sr: 0.9057, hx: 0.54, tone: "brown", sy: 0.2, cx: 0.5274, sw: 0.5585, wy: 0.4389, wx: 0.4962, ww: 0.3887, cy: 0.2889, ar: 0.3681 },
  "mystery-might-f": { top: 0.0, bottom: 0.999, neck: 0.115, shoulder: 0.203, sl: 0.2437, sr: 0.8817, hx: 0.505, tone: "light", sy: 0.1986, cx: 0.4866, sw: 0.6272, wy: 0.4389, wx: 0.4355, ww: 0.4624, cy: 0.2889, ar: 0.3875 },
  "mystery-might-f-b": { top: 0.001, bottom: 0.996, neck: 0.151, shoulder: 0.2, sl: 0.3531, sr: 0.8741, hx: 0.535, tone: "medium", sy: 0.2014, cx: 0.5953, sw: 0.6329, wy: 0.4389, wx: 0.5892, ww: 0.3797, cy: 0.2903, ar: 0.3972 },
  "mystery-might-f-b-teen": { top: 0.001, bottom: 0.997, neck: 0.122, shoulder: 0.207, sl: 0.2776, sr: 0.9049, hx: 0.528, tone: "light", sy: 0.2, cx: 0.5798, sw: 0.6122, wy: 0.4389, wx: 0.5951, ww: 0.3673, cy: 0.2889, ar: 0.3653 },
  "mystery-might-f-s2": { top: 0.0, bottom: 0.999, neck: 0.115, shoulder: 0.203, sl: 0.2437, sr: 0.8817, hx: 0.505, tone: "medium", sy: 0.2, cx: 0.492, sw: 0.625, wy: 0.4389, wx: 0.4393, ww: 0.45, cy: 0.2903, ar: 0.3889 },
  "mystery-might-f-s3": { top: 0.0, bottom: 0.999, neck: 0.115, shoulder: 0.203, sl: 0.2437, sr: 0.8817, hx: 0.505, tone: "brown", sy: 0.2, cx: 0.4891, sw: 0.6196, wy: 0.4389, wx: 0.4402, ww: 0.4529, cy: 0.2903, ar: 0.3833 },
  "mystery-might-f-s4": { top: 0.0, bottom: 0.999, neck: 0.115, shoulder: 0.203, sl: 0.2437, sr: 0.8817, hx: 0.505, tone: "dark", sy: 0.2, cx: 0.4911, sw: 0.6157, wy: 0.4389, wx: 0.4413, ww: 0.4413, cy: 0.2903, ar: 0.3903 },
  "mystery-might-f-teen": { top: 0.001, bottom: 0.997, neck: 0.118, shoulder: 0.206, sl: 0.25, sr: 0.8846, hx: 0.5, tone: "light", sy: 0.2, cx: 0.5519, sw: 0.6192, wy: 0.4389, wx: 0.5673, ww: 0.3715, cy: 0.2889, ar: 0.3611 },
  "mystery-might-m": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.185, sl: 0.206, sr: 0.8904, hx: 0.495, tone: "brown", sy: 0.1986, cx: 0.4859, sw: 0.711, wy: 0.4389, wx: 0.4468, ww: 0.4419, cy: 0.2889, ar: 0.4181 },
  "mystery-might-m-b": { top: 0.001, bottom: 0.997, neck: 0.101, shoulder: 0.189, sl: 0.1865, sr: 0.8875, hx: 0.463, tone: "medium", sy: 0.2, cx: 0.5048, sw: 0.5648, wy: 0.4389, wx: 0.5048, ww: 0.3389, cy: 0.2889, ar: 0.4319 },
  "mystery-might-m-b-teen": { top: 0.001, bottom: 0.999, neck: 0.118, shoulder: 0.203, sl: 0.2261, sr: 0.908, hx: 0.498, tone: "medium", sy: 0.2, cx: 0.5508, sw: 0.6667, wy: 0.4389, wx: 0.5709, ww: 0.4, cy: 0.2903, ar: 0.3625 },
  "mystery-might-m-s1": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.185, sl: 0.206, sr: 0.8904, hx: 0.495, tone: "light", sy: 0.2014, cx: 0.4817, sw: 0.71, wy: 0.4403, wx: 0.4467, ww: 0.4267, cy: 0.2903, ar: 0.4167 },
  "mystery-might-m-s2": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.185, sl: 0.206, sr: 0.8904, hx: 0.495, tone: "medium", sy: 0.2, cx: 0.4877, sw: 0.7059, wy: 0.4389, wx: 0.4493, ww: 0.4281, cy: 0.2903, ar: 0.425 },
  "mystery-might-m-s4": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.185, sl: 0.206, sr: 0.8904, hx: 0.495, tone: "dark", sy: 0.2014, cx: 0.4883, sw: 0.7057, wy: 0.4403, wx: 0.4532, ww: 0.4247, cy: 0.2903, ar: 0.4153 },
  "mystery-might-m-teen": { top: 0.001, bottom: 0.999, neck: 0.113, shoulder: 0.2, sl: 0.2366, sr: 0.8996, hx: 0.502, tone: "brown", sy: 0.2, cx: 0.5018, sw: 0.6631, wy: 0.4389, wx: 0.4677, ww: 0.4194, cy: 0.2903, ar: 0.3875 },
  "mystery-mind-f": { top: 0.0, bottom: 0.999, neck: 0.186, shoulder: 0.271, sl: 0.1942, sr: 0.741, hx: 0.424, tone: "dark", sy: 0.1986, cx: 0.424, sw: 0.5561, wy: 0.4389, wx: 0.424, ww: 0.3336, cy: 0.2889, ar: 0.3861 },
  "mystery-mind-f-b": { top: 0.003, bottom: 0.999, neck: 0.143, shoulder: 0.231, sl: 0.3034, sr: 0.7079, hx: 0.486, tone: "medium", sy: 0.2014, cx: 0.4972, sw: 0.3792, wy: 0.4403, wx: 0.507, ww: 0.2275, cy: 0.2903, ar: 0.4944, cape: true },
  "mystery-mind-f-b-teen": { top: 0.0, bottom: 0.997, neck: 0.151, shoulder: 0.237, sl: 0.3152, sr: 0.7163, hx: 0.487, tone: "brown", sy: 0.1986, cx: 0.5201, sw: 0.4114, wy: 0.4375, wx: 0.5201, ww: 0.2468, cy: 0.2889, ar: 0.4847, cape: true },
  "mystery-mind-f-s1": { top: 0.0, bottom: 0.999, neck: 0.186, shoulder: 0.271, sl: 0.1942, sr: 0.741, hx: 0.424, tone: "light", sy: 0.2, cx: 0.424, sw: 0.536, wy: 0.4389, wx: 0.424, ww: 0.3216, cy: 0.2903, ar: 0.4 },
  "mystery-mind-f-s2": { top: 0.0, bottom: 0.999, neck: 0.186, shoulder: 0.271, sl: 0.1942, sr: 0.741, hx: 0.424, tone: "medium", sy: 0.2014, cx: 0.424, sw: 0.5906, wy: 0.4403, wx: 0.424, ww: 0.3544, cy: 0.2903, ar: 0.3625 },
  "mystery-mind-f-s3": { top: 0.0, bottom: 0.999, neck: 0.186, shoulder: 0.271, sl: 0.1942, sr: 0.741, hx: 0.424, tone: "brown", sy: 0.2028, cx: 0.424, sw: 0.6199, wy: 0.4403, wx: 0.424, ww: 0.3719, cy: 0.2917, ar: 0.3444 },
  "mystery-mind-f-teen": { top: 0.001, bottom: 0.999, neck: 0.188, shoulder: 0.275, sl: 0.2061, sr: 0.6959, hx: 0.419, tone: "dark", sy: 0.2, cx: 0.419, sw: 0.485, wy: 0.4389, wx: 0.419, ww: 0.291, cy: 0.2903, ar: 0.4111 },
  "mystery-mind-m": { top: 0.0, bottom: 0.999, neck: 0.128, shoulder: 0.215, sl: 0.3438, sr: 0.9219, hx: 0.584, tone: "medium", sy: 0.1986, cx: 0.5656, sw: 0.5344, wy: 0.4389, wx: 0.5422, ww: 0.3531, cy: 0.2889, ar: 0.4444 },
  "mystery-mind-m-b": { top: 0.001, bottom: 0.997, neck: 0.133, shoulder: 0.218, sl: 0.2633, sr: 0.7367, hx: 0.442, tone: "light", sy: 0.2, cx: 0.4887, sw: 0.4441, wy: 0.4389, wx: 0.504, ww: 0.2665, cy: 0.2889, ar: 0.5222, cape: true },
  "mystery-mind-m-b-teen": { top: 0.003, bottom: 0.997, neck: 0.126, shoulder: 0.214, sl: 0.2704, sr: 0.693, hx: 0.425, tone: "light", sy: 0.2014, cx: 0.4655, sw: 0.3944, wy: 0.4403, wx: 0.4873, ww: 0.2366, cy: 0.2903, ar: 0.4931, cape: true },
  "mystery-mind-m-s1": { top: 0.0, bottom: 0.999, neck: 0.128, shoulder: 0.215, sl: 0.3438, sr: 0.9219, hx: 0.584, tone: "light", sy: 0.2, cx: 0.5554, sw: 0.5411, wy: 0.4389, wx: 0.5301, ww: 0.3513, cy: 0.2903, ar: 0.4389 },
  "mystery-mind-m-s3": { top: 0.0, bottom: 0.999, neck: 0.128, shoulder: 0.215, sl: 0.3438, sr: 0.9219, hx: 0.584, tone: "brown", sy: 0.2, cx: 0.5647, sw: 0.5431, wy: 0.4389, wx: 0.5399, ww: 0.3578, cy: 0.2903, ar: 0.4347 },
  "mystery-mind-m-s4": { top: 0.0, bottom: 0.999, neck: 0.128, shoulder: 0.215, sl: 0.3438, sr: 0.9219, hx: 0.584, tone: "dark", sy: 0.2, cx: 0.5617, sw: 0.5812, wy: 0.4389, wx: 0.5328, ww: 0.3656, cy: 0.2903, ar: 0.4444 },
  "mystery-mind-m-teen": { top: 0.0, bottom: 0.997, neck: 0.128, shoulder: 0.215, sl: 0.3692, sr: 0.8862, hx: 0.582, tone: "medium", sy: 0.2014, cx: 0.5685, sw: 0.48, wy: 0.4389, wx: 0.5492, ww: 0.3354, cy: 0.2903, ar: 0.4514 },
  "mystery-storm-f": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.2, sl: 0.0271, sr: 0.6657, hx: 0.434, tone: "light", sy: 0.1986, cx: 0.434, sw: 0.4656, wy: 0.4389, wx: 0.434, ww: 0.2794, cy: 0.2889, ar: 0.4611 },
  "mystery-storm-f-b": { top: 0.003, bottom: 0.999, neck: 0.152, shoulder: 0.202, sl: 0.2479, sr: 0.6781, hx: 0.45, tone: "medium", sy: 0.2014, cx: 0.4573, sw: 0.4274, wy: 0.4403, wx: 0.4815, ww: 0.2564, cy: 0.2903, ar: 0.4875, cape: true },
  "mystery-storm-f-b-teen": { top: 0.003, bottom: 0.997, neck: 0.161, shoulder: 0.242, sl: 0.2628, sr: 0.719, hx: 0.429, tone: "light", sy: 0.2014, cx: 0.466, sw: 0.3988, wy: 0.4389, wx: 0.5015, ww: 0.2393, cy: 0.2903, ar: 0.4597, cape: true },
  "mystery-storm-f-s2": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.2, sl: 0.0271, sr: 0.6657, hx: 0.434, tone: "medium", sy: 0.2, cx: 0.434, sw: 0.5557, wy: 0.4389, wx: 0.434, ww: 0.3334, cy: 0.2889, ar: 0.3847 },
  "mystery-storm-f-s3": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.2, sl: 0.0271, sr: 0.6657, hx: 0.434, tone: "brown", sy: 0.1986, cx: 0.434, sw: 0.5405, wy: 0.4389, wx: 0.434, ww: 0.3243, cy: 0.2889, ar: 0.3972 },
  "mystery-storm-f-s4": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.2, sl: 0.0271, sr: 0.6657, hx: 0.434, tone: "dark", sy: 0.2, cx: 0.434, sw: 0.5787, wy: 0.4389, wx: 0.434, ww: 0.3472, cy: 0.2889, ar: 0.3694 },
  "mystery-storm-f-teen": { top: 0.003, bottom: 0.997, neck: 0.181, shoulder: 0.267, sl: 0.2559, sr: 0.811, hx: 0.531, tone: "light", sy: 0.2014, cx: 0.5315, sw: 0.5636, wy: 0.4403, wx: 0.5315, ww: 0.3382, cy: 0.2903, ar: 0.3528 },
  "mystery-storm-m": { top: 0.0, bottom: 0.999, neck: 0.11, shoulder: 0.197, sl: 0.2656, sr: 0.8531, hx: 0.516, tone: "dark", sy: 0.1986, cx: 0.5, sw: 0.5875, wy: 0.4389, wx: 0.4719, ww: 0.375, cy: 0.2889, ar: 0.4444 },
  "mystery-storm-m-b": { top: 0.001, bottom: 0.997, neck: 0.151, shoulder: 0.176, sl: 0.3585, sr: 0.739, hx: 0.488, tone: "light", sy: 0.2014, cx: 0.5299, sw: 0.4268, wy: 0.4403, wx: 0.5427, ww: 0.2561, cy: 0.2903, ar: 0.5694, cape: true },
  "mystery-storm-m-b-teen": { top: 0.001, bottom: 0.999, neck: 0.122, shoulder: 0.204, sl: 0.3394, sr: 0.7539, hx: 0.5, tone: "light", sy: 0.2, cx: 0.5402, sw: 0.4093, wy: 0.4389, wx: 0.5466, ww: 0.2456, cy: 0.2903, ar: 0.5361, cape: true },
  "mystery-storm-m-s2": { top: 0.0, bottom: 0.999, neck: 0.11, shoulder: 0.197, sl: 0.2656, sr: 0.8531, hx: 0.516, tone: "medium", sy: 0.2, cx: 0.4874, sw: 0.5608, wy: 0.4389, wx: 0.4585, ww: 0.3531, cy: 0.2903, ar: 0.4681 },
  "mystery-storm-m-s3": { top: 0.0, bottom: 0.999, neck: 0.11, shoulder: 0.197, sl: 0.2656, sr: 0.8531, hx: 0.516, tone: "brown", sy: 0.2, cx: 0.5016, sw: 0.5949, wy: 0.4389, wx: 0.4699, ww: 0.3703, cy: 0.2903, ar: 0.4389 },
  "mystery-storm-m-teen": { top: 0.001, bottom: 0.997, neck: 0.132, shoulder: 0.217, sl: 0.2789, sr: 0.8639, hx: 0.517, tone: "dark", sy: 0.2, cx: 0.5043, sw: 0.5544, wy: 0.4389, wx: 0.483, ww: 0.3741, cy: 0.2889, ar: 0.4083 },
  "mystery-swift-f": { top: 0.0, bottom: 0.999, neck: 0.174, shoulder: 0.261, sl: 0.3283, sr: 0.8223, hx: 0.506, tone: "medium", sy: 0.1986, cx: 0.5166, sw: 0.4656, wy: 0.4389, wx: 0.5015, ww: 0.3404, cy: 0.2889, ar: 0.4611 },
  "mystery-swift-f-b": { top: 0.001, bottom: 0.997, neck: 0.151, shoulder: 0.201, sl: 0.336, sr: 0.8024, hx: 0.557, tone: "light", sy: 0.2, cx: 0.5721, sw: 0.585, wy: 0.4389, wx: 0.5692, ww: 0.351, cy: 0.2889, ar: 0.3514 },
  "mystery-swift-f-b-teen": { top: 0.001, bottom: 0.996, neck: 0.161, shoulder: 0.246, sl: 0.2731, sr: 0.8081, hx: 0.509, tone: "light", sy: 0.2, cx: 0.5203, sw: 0.5283, wy: 0.4389, wx: 0.5203, ww: 0.317, cy: 0.2889, ar: 0.3764 },
  "mystery-swift-f-s1": { top: 0.0, bottom: 0.999, neck: 0.174, shoulder: 0.261, sl: 0.3283, sr: 0.8223, hx: 0.506, tone: "light", sy: 0.2, cx: 0.5118, sw: 0.4534, wy: 0.4389, wx: 0.4956, ww: 0.3265, cy: 0.2889, ar: 0.4722 },
  "mystery-swift-f-s3": { top: 0.0, bottom: 0.999, neck: 0.174, shoulder: 0.261, sl: 0.3283, sr: 0.8223, hx: 0.506, tone: "brown", sy: 0.2, cx: 0.5125, sw: 0.4554, wy: 0.4389, wx: 0.4971, ww: 0.3274, cy: 0.2903, ar: 0.4708 },
  "mystery-swift-f-s4": { top: 0.0, bottom: 0.999, neck: 0.174, shoulder: 0.261, sl: 0.3283, sr: 0.8223, hx: 0.506, tone: "dark", sy: 0.2, cx: 0.5037, sw: 0.4561, wy: 0.4389, wx: 0.4882, ww: 0.3314, cy: 0.2889, ar: 0.4694 },
  "mystery-swift-f-teen": { top: 0.001, bottom: 0.999, neck: 0.151, shoulder: 0.201, sl: 0.3323, sr: 0.6586, hx: 0.495, tone: "medium", sy: 0.2014, cx: 0.5211, sw: 0.4331, wy: 0.4403, wx: 0.5211, ww: 0.2599, cy: 0.2903, ar: 0.4597 },
  "mystery-swift-m": { top: 0.0, bottom: 0.999, neck: 0.14, shoulder: 0.225, sl: 0.2493, sr: 0.858, hx: 0.487, tone: "medium", sy: 0.1986, cx: 0.4971, sw: 0.5362, wy: 0.4389, wx: 0.5, ww: 0.3507, cy: 0.2889, ar: 0.4792 },
  "mystery-swift-m-s1": { top: 0.0, bottom: 0.999, neck: 0.14, shoulder: 0.225, sl: 0.2493, sr: 0.858, hx: 0.487, tone: "light", sy: 0.2, cx: 0.4979, sw: 0.5096, wy: 0.4389, wx: 0.5028, ww: 0.3388, cy: 0.2903, ar: 0.5042 },
  "mystery-swift-m-s3": { top: 0.0, bottom: 0.999, neck: 0.14, shoulder: 0.225, sl: 0.2493, sr: 0.858, hx: 0.487, tone: "brown", sy: 0.2014, cx: 0.4979, sw: 0.4931, wy: 0.4403, wx: 0.5014, ww: 0.3306, cy: 0.2903, ar: 0.5042 },
  "mystery-swift-m-s4": { top: 0.0, bottom: 0.999, neck: 0.14, shoulder: 0.225, sl: 0.2493, sr: 0.858, hx: 0.487, tone: "dark", sy: 0.2, cx: 0.4965, sw: 0.55, wy: 0.4389, wx: 0.5014, ww: 0.3417, cy: 0.2903, ar: 0.5 },
  "mystery-swift-m-teen": { top: 0.001, bottom: 0.997, neck: 0.14, shoulder: 0.228, sl: 0.2684, sr: 0.8437, hx: 0.484, tone: "medium", sy: 0.2, cx: 0.5029, sw: 0.531, wy: 0.4389, wx: 0.5177, ww: 0.3451, cy: 0.2889, ar: 0.4708 },
  "mystery-veil-f": { top: 0.0, bottom: 0.999, neck: 0.136, shoulder: 0.222, sl: 0.2746, sr: 0.6448, hx: 0.436, tone: "light", sy: 0.1986, cx: 0.4471, sw: 0.3526, wy: 0.4389, wx: 0.4584, ww: 0.2116, cy: 0.2889, ar: 0.5514, cape: true },
  "mystery-veil-f-b": { top: 0.001, bottom: 0.999, neck: 0.151, shoulder: 0.201, sl: 0.2778, sr: 0.7546, hx: 0.514, tone: "light", sy: 0.2, cx: 0.5498, sw: 0.6204, wy: 0.4389, wx: 0.5833, ww: 0.3722, cy: 0.2889, ar: 0.3, cape: true },
  "mystery-veil-f-b-teen": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.2, sl: 0.2649, sr: 0.7463, hx: 0.511, tone: "light", sy: 0.1986, cx: 0.5224, sw: 0.4776, wy: 0.4375, wx: 0.541, ww: 0.2866, cy: 0.2889, ar: 0.3722, cape: true },
  "mystery-veil-f-s2": { top: 0.0, bottom: 0.999, neck: 0.136, shoulder: 0.222, sl: 0.2746, sr: 0.6448, hx: 0.436, tone: "medium", sy: 0.1986, cx: 0.4495, sw: 0.3657, wy: 0.4375, wx: 0.4514, ww: 0.2194, cy: 0.2889, ar: 0.5431, cape: true },
  "mystery-veil-f-s3": { top: 0.0, bottom: 0.999, neck: 0.136, shoulder: 0.222, sl: 0.2746, sr: 0.6448, hx: 0.436, tone: "brown", sy: 0.2014, cx: 0.4385, sw: 0.3641, wy: 0.4403, wx: 0.4436, ww: 0.2185, cy: 0.2903, ar: 0.5417, cape: true },
  "mystery-veil-f-s4": { top: 0.0, bottom: 0.999, neck: 0.136, shoulder: 0.222, sl: 0.2746, sr: 0.6448, hx: 0.436, tone: "dark", sy: 0.2, cx: 0.4541, sw: 0.3518, wy: 0.4389, wx: 0.4598, ww: 0.2111, cy: 0.2903, ar: 0.5528, cape: true },
  "mystery-veil-f-teen": { top: 0.0, bottom: 0.997, neck: 0.143, shoulder: 0.231, sl: 0.2931, sr: 0.6918, hx: 0.465, tone: "light", sy: 0.2, cx: 0.4789, sw: 0.3807, wy: 0.4389, wx: 0.4955, ww: 0.2284, cy: 0.2889, ar: 0.4597, cape: true },
  "mystery-veil-m": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.183, sl: 0.2553, sr: 0.8617, hx: 0.514, tone: "light", sy: 0.1986, cx: 0.5559, sw: 0.656, wy: 0.4389, wx: 0.5621, ww: 0.3936, cy: 0.2889, ar: 0.3917, cape: true },
  "mystery-veil-m-b": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.2, sl: 0.3162, sr: 0.812, hx: 0.47, tone: "light", sy: 0.2, cx: 0.5192, sw: 0.7051, wy: 0.4389, wx: 0.562, ww: 0.4231, cy: 0.2903, ar: 0.325, cape: true },
  "mystery-veil-m-b-teen": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.2, sl: 0.3348, sr: 0.8155, hx: 0.489, tone: "light", sy: 0.2, cx: 0.5365, sw: 0.6567, wy: 0.4389, wx: 0.5773, ww: 0.394, cy: 0.2903, ar: 0.3236, cape: true },
  "mystery-veil-m-s2": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.183, sl: 0.2553, sr: 0.8617, hx: 0.514, tone: "medium", sy: 0.1986, cx: 0.5421, sw: 0.633, wy: 0.4389, wx: 0.5455, ww: 0.3798, cy: 0.2889, ar: 0.4125, cape: true },
  "mystery-veil-m-s3": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.183, sl: 0.2553, sr: 0.8617, hx: 0.514, tone: "brown", sy: 0.2, cx: 0.5563, sw: 0.5468, wy: 0.4389, wx: 0.5599, ww: 0.3281, cy: 0.2903, ar: 0.475, cape: true },
  "mystery-veil-m-s4": { top: 0.0, bottom: 0.999, neck: 0.15, shoulder: 0.183, sl: 0.2553, sr: 0.8617, hx: 0.514, tone: "dark", sy: 0.2, cx: 0.5579, sw: 0.6376, wy: 0.4389, wx: 0.557, ww: 0.3826, cy: 0.2903, ar: 0.4139, cape: true },
  "mystery-veil-m-teen": { top: 0.001, bottom: 0.999, neck: 0.151, shoulder: 0.201, sl: 0.3156, sr: 0.7143, hx: 0.478, tone: "light", sy: 0.2, cx: 0.5291, sw: 0.5382, wy: 0.4389, wx: 0.5349, ww: 0.3229, cy: 0.2903, ar: 0.4181, cape: true },
};
