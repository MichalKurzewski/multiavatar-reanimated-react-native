import {
  type AvatarShape,
  type CustomAvatar,
  type EditablePart,
  type ShapeForPart,
  type TopShape,
} from "./avatarConstants";
import {
  RAW_PART_SVG,
  RAW_TOP_SVG,
  SHARED_ENV_SVG,
  SHARED_HEAD_SVG,
} from "./avatarPartsData.generated";

const SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 231 231">';
const SVG_CLOSE = "</svg>";

/**
 * Look up the raw SVG for a shape + part. Top reads from {@link RAW_TOP_SVG}
 * (keyed by the 27 {@link TopShape} variants); body parts (`clo` / `eyes` /
 * `mouth`) read from {@link RAW_PART_SVG} keyed by the 16 base
 * {@link AvatarShape} names.
 */
function rawPartSvg<P extends EditablePart>(shape: ShapeForPart<P>, part: P): string {
  if (part === "top") return RAW_TOP_SVG[shape as TopShape];
  return RAW_PART_SVG[shape as AvatarShape][part as Exclude<EditablePart, "top">];
}

export function colorSlotCount<P extends EditablePart>(shape: ShapeForPart<P>, part: P): number {
  const matches = rawPartSvg(shape, part).match(/#(.*?);/g);
  return matches ? matches.length : 0;
}

export function applyColors(rawSvg: string, colors: readonly string[]): string {
  let i = 0;
  return rawSvg.replace(/#(.*?);/g, () => {
    const c = colors[i++] ?? "transparent";
    return `${c};`;
  });
}

export function renderPartSvg<P extends EditablePart>(
  part: { shape: ShapeForPart<P>; colors: readonly string[] },
  partType: P
): string {
  return applyColors(rawPartSvg(part.shape, partType), part.colors);
}

export function composeAvatarSvg(avatar: CustomAvatar): string {
  const env = applyColors(SHARED_ENV_SVG, [avatar.background]);
  const head = applyColors(SHARED_HEAD_SVG, [avatar.skin]);
  const clo = renderPartSvg(avatar.clo, "clo");
  const top = renderPartSvg(avatar.top, "top");
  const eyes = renderPartSvg(avatar.eyes, "eyes");
  const mouth = renderPartSvg(avatar.mouth, "mouth");
  return SVG_OPEN + env + head + clo + top + eyes + mouth + SVG_CLOSE;
}

export function renderPartThumbnailSvg<P extends EditablePart>(
  shape: ShapeForPart<P>,
  partType: P,
  colors: readonly string[]
): string {
  return SVG_OPEN + applyColors(rawPartSvg(shape, partType), colors) + SVG_CLOSE;
}

/**
 * Render the user's draft avatar with one part swapped to a candidate. Used
 * for shape-picker thumbnails so each tile shows a full face (not just the
 * isolated part floating in empty space). The viewBox is cropped to the
 * relevant region for the active part so the thumbnail zooms in on what's
 * being changed (e.g. eyes tab → focus on eyes, not the whole face).
 */
const PART_VIEWBOX: Record<EditablePart, string> = {
  top: "30 0 170 140",
  clo: "40 175 150 56",
  eyes: "55 80 120 50",
  mouth: "65 130 100 50",
};

export function renderShapeThumbnailSvg<P extends EditablePart>(
  avatar: CustomAvatar,
  partType: P,
  candidateShape: ShapeForPart<P>,
  candidateColors: readonly string[]
): string {
  const next: CustomAvatar = {
    ...avatar,
    [partType]: { shape: candidateShape, colors: [...candidateColors] },
  };
  const fullSvg = composeAvatarSvg(next);
  return fullSvg.replace('viewBox="0 0 231 231"', `viewBox="${PART_VIEWBOX[partType]}"`);
}
