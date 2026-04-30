import {
  type CustomAvatar,
  type EditablePart,
  type ShapeForPart,
  baseShapeFor,
} from "./avatarConstants";
import { RAW_PART_SVG, SHARED_ENV_SVG, SHARED_HEAD_SVG } from "./avatarPartsData.generated";

const SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 231 231">';
const SVG_CLOSE = "</svg>";

/**
 * Look up the raw SVG for a shape + part, resolving top variants (e.g. `Guy2`)
 * back to their base {@link AvatarShape} since variants currently share the
 * base shape's SVG fallback.
 */
function rawPartSvg<P extends EditablePart>(shape: ShapeForPart<P>, part: P): string {
  return RAW_PART_SVG[baseShapeFor(shape, part)][part];
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
