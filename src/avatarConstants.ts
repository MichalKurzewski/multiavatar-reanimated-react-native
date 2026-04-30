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

/**
 * Top (hair / hat) shape enum. The Rive artboard's `StyleTopEnum` exposes
 * numbered variants for some base shapes (e.g. `Guy1`, `Guy2`, `Guy3`) so the
 * top can change independently of the rest of the face. Clo / eyes / mouth
 * still use {@link AVATAR_SHAPES} — only top has variants.
 *
 * Variants share the base shape's SVG fallback and default colors via
 * {@link TOP_BASE_SHAPE} until their own SVGs are added to the multiavatar
 * source and regenerated.
 */
export const TOP_SHAPES = [
  "Robo",
  "Girl",
  "Blonde",
  "Guy1",
  "Guy2",
  "Guy3",
  "Country",
  "Geeknot",
  "Asian1",
  "Asian2",
  "Punk",
  "Afrohair1",
  "Afrohair2",
  "Female1",
  "Female2",
  "Female3",
  "Older1",
  "Older2",
  "Older3",
  "Firehair",
  "Blond",
  "Ateam1",
  "Ateam2",
  "Rasta",
  "Meta1",
  "Meta2",
  "Meta3",
] as const;

export type TopShape = (typeof TOP_SHAPES)[number];

/**
 * Map a {@link TopShape} variant back to the base {@link AvatarShape} that
 * owns its SVG source and default-color palette. Plain shapes (no variant
 * suffix) map to themselves.
 */
export const TOP_BASE_SHAPE: Record<TopShape, AvatarShape> = {
  Robo: "Robo",
  Girl: "Girl",
  Blonde: "Blonde",
  Guy1: "Guy",
  Guy2: "Guy",
  Guy3: "Guy",
  Country: "Country",
  Geeknot: "Geeknot",
  Asian1: "Asian",
  Asian2: "Asian",
  Punk: "Punk",
  Afrohair1: "Afrohair",
  Afrohair2: "Afrohair",
  Female1: "Female",
  Female2: "Female",
  Female3: "Female",
  Older1: "Older",
  Older2: "Older",
  Older3: "Older",
  Firehair: "Firehair",
  Blond: "Blond",
  Ateam1: "Ateam",
  Ateam2: "Ateam",
  Rasta: "Rasta",
  Meta1: "Meta",
  Meta2: "Meta",
  Meta3: "Meta",
};

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

export type AvatarTopPart = {
  shape: TopShape;
  colors: string[];
};

export type CustomAvatar = {
  top: AvatarTopPart;
  clo: AvatarPart;
  eyes: AvatarPart;
  mouth: AvatarPart;
  background: string;
  skin: string;
};

/** Shape value type per editable part — top has its own variant-aware union. */
export type ShapeForPart<P extends EditablePart> = P extends "top" ? TopShape : AvatarShape;

/** List of shape names available for a given part. */
export function shapesForPart<P extends EditablePart>(part: P): readonly ShapeForPart<P>[] {
  return (part === "top" ? TOP_SHAPES : AVATAR_SHAPES) as readonly ShapeForPart<P>[];
}

/**
 * Resolve a shape value to the base {@link AvatarShape} that owns its SVG
 * source and default colors. Top variants collapse to their base; non-top
 * shapes pass through.
 */
export function baseShapeFor(shape: AvatarShape | TopShape, part: EditablePart): AvatarShape {
  if (part === "top") return TOP_BASE_SHAPE[shape as TopShape];
  return shape as AvatarShape;
}

export const DEFAULT_BACKGROUND_COLOR = "#ff7520";
export const DEFAULT_SKIN_COLOR = "#f5d4a6";
export const SPY34_BACKGROUND_COLOR = "#2a2a2a";
export const SPY34_SKIN_COLOR = "#5a5a5a";

export const RIVE_ENUM_PATH: Record<EditablePart, string> = {
  top: "StyleTopEnum",
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
 *
 * For top variants (e.g. `Guy2`), the override is keyed by the variant name —
 * if no entry matches, lookup falls back to the base shape via
 * {@link TOP_BASE_SHAPE}.
 */
const PART_COLOR_OVERRIDES: Partial<
  Record<AvatarShape | TopShape, Partial<Record<EditablePart, readonly string[]>>>
> = {
  // Robo's top got a separate accent piece in the redesigned Rive file.
  Robo: {
    top: ["#ffffff", "#cccccc"],
  },
};

export function getDefaultPartColors<P extends EditablePart>(
  shape: ShapeForPart<P>,
  part: P
): readonly string[] {
  const override = PART_COLOR_OVERRIDES[shape]?.[part];
  if (override) return override;
  const base = baseShapeFor(shape, part);
  return DEFAULT_PART_COLORS[base][part];
}

function defaultTopPart(shape: TopShape): AvatarTopPart {
  return { shape, colors: [...getDefaultPartColors(shape, "top")] };
}

function defaultBodyPart<P extends Exclude<EditablePart, "top">>(
  shape: AvatarShape,
  part: P
): AvatarPart {
  return { shape, colors: [...getDefaultPartColors(shape as ShapeForPart<P>, part)] };
}

export function buildAvatar(
  shapes: { top: TopShape; clo: AvatarShape; eyes: AvatarShape; mouth: AvatarShape },
  options: { background?: string; skin?: string } = {}
): CustomAvatar {
  return {
    top: defaultTopPart(shapes.top),
    clo: defaultBodyPart(shapes.clo, "clo"),
    eyes: defaultBodyPart(shapes.eyes, "eyes"),
    mouth: defaultBodyPart(shapes.mouth, "mouth"),
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
export function getPartRiveBindingColors<P extends EditablePart>(
  shape: ShapeForPart<P>,
  part: P,
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
