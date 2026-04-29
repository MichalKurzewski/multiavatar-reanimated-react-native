import { DEFAULT_PART_COLORS } from "./avatarPartsData.generated";

export const AVATAR_SHAPES = [
  "Robo",
  "Girl",
  "Blonde",
  "Guy",
  "Country",
  "Geeknot",
  "Asian",
  "Punk",
  "Afrohair",
  "Female",
  "Older",
  "Firehair",
  "Blond",
  "Ateam",
  "Rasta",
  "Meta",
] as const;

export type AvatarShape = (typeof AVATAR_SHAPES)[number];

export type EditablePart = "clo" | "top" | "eyes" | "mouth";

export const EDITABLE_PARTS: readonly EditablePart[] = ["top", "clo", "eyes", "mouth"];

export const PART_LABELS: Record<EditablePart, string> = {
  top: "Top",
  clo: "Clothes",
  eyes: "Eyes",
  mouth: "Mouth",
};

export type AvatarPart = {
  shape: AvatarShape;
  colors: string[];
};

export type CustomAvatar = {
  top: AvatarPart;
  clo: AvatarPart;
  eyes: AvatarPart;
  mouth: AvatarPart;
  background: string;
  skin: string;
};

export const DEFAULT_BACKGROUND_COLOR = "#ff7520";
export const DEFAULT_SKIN_COLOR = "#f5d4a6";
export const SPY34_BACKGROUND_COLOR = "#2a2a2a";
export const SPY34_SKIN_COLOR = "#5a5a5a";

export const RIVE_ENUM_PATH: Record<EditablePart, string> = {
  top: "topEnum",
  clo: "clothesEnum",
  eyes: "eyesEnum",
  mouth: "mouthEnum",
};

/**
 * Per-shape overrides for default part colors. Use when the Rive file exposes
 * a bind (e.g. topAccent) that the auto-generated multiavatar defaults paint
 * in a single color, which would make `classifyColorSlots` collapse it to
 * main-only and leave the accent unbound. Listing a 2nd distinct color here
 * exposes the accent in the editor and feeds the Rive bind.
 */
const PART_COLOR_OVERRIDES: Partial<
  Record<AvatarShape, Partial<Record<EditablePart, readonly string[]>>>
> = {
  // Robo's top got a separate accent piece in the redesigned Rive file.
  Robo: {
    top: ["#ffffff", "#cccccc"],
  },
};

export function getDefaultPartColors(shape: AvatarShape, part: EditablePart): readonly string[] {
  return PART_COLOR_OVERRIDES[shape]?.[part] ?? DEFAULT_PART_COLORS[shape][part];
}

function defaultPart(shape: AvatarShape, part: EditablePart): AvatarPart {
  return { shape, colors: [...getDefaultPartColors(shape, part)] };
}

export function buildAvatar(
  shapes: Record<EditablePart, AvatarShape>,
  options: { background?: string; skin?: string } = {}
): CustomAvatar {
  return {
    top: defaultPart(shapes.top, "top"),
    clo: defaultPart(shapes.clo, "clo"),
    eyes: defaultPart(shapes.eyes, "eyes"),
    mouth: defaultPart(shapes.mouth, "mouth"),
    background: options.background ?? DEFAULT_BACKGROUND_COLOR,
    skin: options.skin ?? DEFAULT_SKIN_COLOR,
  };
}

export const DEFAULT_AVATAR: CustomAvatar = buildAvatar({
  top: "Robo",
  clo: "Robo",
  eyes: "Robo",
  mouth: "Robo",
});

// Hardcoded greyish silhouette. Uses Robo shapes for every part (known-good in
// the Rive enum) and grey colors for every bind so all of topMain/topAccent/
// clothesMain/clothesAccent/eyesMain/eyesAccent/mouthMain/mouthAccent + skin
// resolve to a flat dark-grey look — no derivation surprises.
const SPY34_GREY_MAIN = "#5a5a5a";
const SPY34_GREY_ACCENT = "#3a3a3a";
const SPY34_GREY_DARK = "#1a1a1a";

// Country top has 4 slots, Firehair clo has 5, Female eyes has 3, Older mouth
// has 2. Slot counts must match RAW_PART_SVG placeholders so composeAvatarSvg
// can fill them — see colorSlotCount.
export const SPY34_AVATAR: CustomAvatar = {
  top: {
    shape: "Country",
    colors: [SPY34_GREY_MAIN, SPY34_GREY_ACCENT, SPY34_GREY_DARK, SPY34_GREY_ACCENT],
  },
  clo: {
    shape: "Firehair",
    colors: [
      SPY34_GREY_MAIN,
      SPY34_GREY_ACCENT,
      SPY34_GREY_DARK,
      SPY34_GREY_ACCENT,
      SPY34_GREY_ACCENT,
    ],
  },
  eyes: { shape: "Female", colors: [SPY34_GREY_DARK, "none", "none"] },
  mouth: { shape: "Older", colors: [SPY34_GREY_DARK, "#ffffff"] },
  background: SPY34_BACKGROUND_COLOR,
  skin: SPY34_SKIN_COLOR,
};

export const COLOR_PALETTE: readonly string[] = [
  "#000000",
  "#ffffff",
  "#f44336",
  "#ff9800",
  "#ffc107",
  "#4caf50",
  "#2196f3",
  "#9c27b0",
  "#e91e63",
  "none",
];

// Common skin tones — pale → deep — ordered for natural progression.
export const SKIN_PALETTE: readonly string[] = [
  "#ffe0d0",
  "#fee3c5",
  "#f8d9ad",
  "#ffce8b",
  "#f5d4a6",
  "#e2af6b",
  "#d2ad6d",
  "#cc9a5c",
  "#b27e5b",
  "#85492c",
];

// Hair colors: most are realistic (black, browns, blonde, platinum, ginger) plus a
// few wild dye options at the end (red, green, purple) for character.
export const HAIR_PALETTE: readonly string[] = [
  "#1a1a1a",
  "#3d2314",
  "#6b3a1d",
  "#b27e5b",
  "#d2ad6d",
  "#fdff00",
  "#b85a18",
  "#ff0000",
  "#4caf50",
  "#9c27b0",
];

// Mix of bright and neutral single backgrounds (the env circle).
export const BACKGROUND_PALETTE: readonly string[] = [
  "#ff2f2b",
  "#ff7520",
  "#ffc107",
  "#9bb38d",
  "#7a8b8e",
  "#2668dc",
  "#9c27b0",
  "#e91e63",
  "#c9b89c",
  "#5a4a3f",
  "#1a1a1a",
  "#ffffff",
];

export type ColorRole = "main" | "accent";

export type ColorSlotGroup = {
  role: ColorRole;
  indices: number[];
};

/**
 * Colors to skip when classifying mouth slots: white = teeth (uncontrollable).
 * Mouth main = lips, accent = facial hair.
 */
export const MOUTH_IGNORED_COLORS: readonly string[] = ["ffffff"];

export function ignoredColorsFor(part: EditablePart): readonly string[] {
  return part === "mouth" ? MOUTH_IGNORED_COLORS : [];
}

/**
 * Reduce a part's per-slot color array to at most 2 user-facing pickers:
 * - "main"   : every slot whose default color matches the FIRST distinct non-"none" color
 *              (e.g. the hair color — when the user changes it, every hair slot updates together)
 * - "accent" : every slot whose default color matches the SECOND distinct non-"none" color only
 *              (e.g. flower petals — third+ distinct colors like the flower center are NOT
 *              included, so the accent picker only affects one accessory feature)
 * Slots whose default color is "none" or matches a 3rd+ distinct color are left untouched —
 * they preserve whatever color the multiavatar theme authored, and the user cannot edit them.
 */
/** 6-digit hex without leading "#". null for "none" or unparseable values. */
export function toRiveHex(color: string | undefined): string | null {
  if (!color || color === "none") return null;
  let h = color.startsWith("#") ? color.slice(1) : color;
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return h.toLowerCase();
}

/**
 * Pick the user-editable colors for a part as 6-digit hex (no "#") for Rive's
 * `<part>Main` / `<part>Accent` color bindings. Parts with one distinct color
 * return { main, accent: null } — the Rive file ignores the accent bind for
 * those shapes.
 */
export function getPartRiveBindingColors(
  shape: AvatarShape,
  part: EditablePart,
  colors: readonly string[]
): { main: string | null; accent: string | null } {
  const groups = classifyColorSlots(getDefaultPartColors(shape, part), {
    ignored: ignoredColorsFor(part),
  });
  let main: string | null = null;
  let accent: string | null = null;
  for (const g of groups) {
    const hex = toRiveHex(colors[g.indices[0]]);
    if (g.role === "main") main = hex;
    else if (g.role === "accent") accent = hex;
  }
  return { main, accent };
}

export function classifyColorSlots(
  defaultColors: readonly string[],
  options: { ignored?: readonly string[] } = {}
): ColorSlotGroup[] {
  const ignoredSet = new Set((options.ignored ?? []).map((c) => c.toLowerCase()));
  const isIgnored = (c: string): boolean => {
    const hex = toRiveHex(c);
    return hex !== null && ignoredSet.has(hex);
  };
  const mainIndices: number[] = [];
  const accentIndices: number[] = [];
  let mainColor: string | null = null;
  let accentColor: string | null = null;
  for (let i = 0; i < defaultColors.length; i++) {
    const c = defaultColors[i];
    if (c === "none" || isIgnored(c)) continue;
    if (mainColor === null) {
      mainColor = c;
      mainIndices.push(i);
      continue;
    }
    if (c === mainColor) {
      mainIndices.push(i);
      continue;
    }
    if (accentColor === null) {
      accentColor = c;
      accentIndices.push(i);
      continue;
    }
    if (c === accentColor) {
      accentIndices.push(i);
    }
    // 3rd+ distinct color: skipped — stays authored.
  }
  const groups: ColorSlotGroup[] = [];
  if (mainIndices.length > 0) groups.push({ role: "main", indices: mainIndices });
  if (accentIndices.length > 0) groups.push({ role: "accent", indices: accentIndices });
  return groups;
}
