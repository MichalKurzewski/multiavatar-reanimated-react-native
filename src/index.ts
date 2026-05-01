// Types & constants
export type {
  AvatarPart,
  AvatarShape,
  AvatarTopPart,
  ColorRole,
  ColorSlotGroup,
  CustomAvatar,
  EditablePart,
  PartColorOverride,
  ShapeForPart,
  TopShape,
} from "./avatarConstants";
export {
  AVATAR_SHAPES,
  BACKGROUND_PALETTE,
  baseShapeFor,
  buildAvatar,
  classifyColorSlots,
  COLOR_PALETTE,
  DEFAULT_AVATAR,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_SKIN_COLOR,
  EDITABLE_PARTS,
  getDefaultPartColors,
  getPartRiveBindingColors,
  HAIR_PALETTE,
  ignoredColorsFor,
  MOUTH_IGNORED_COLORS,
  PART_LABELS,
  RIVE_ENUM_PATH,
  shapesForPart,
  SKIN_PALETTE,
  TOP_BASE_SHAPE,
  TOP_SHAPES,
  toRiveHex,
} from "./avatarConstants";

// SVG composition (cross-platform fallback / utilities)
export {
  applyColors,
  colorSlotCount,
  composeAvatarSvg,
  renderPartSvg,
  renderPartThumbnailSvg,
  renderShapeThumbnailSvg,
} from "./avatarSvgComposer";

// Components — controlled
export { RiveAvatar } from "./riveAvatar";

// Components — store-driven
export { UserAvatar } from "./userAvatar";
export { AvatarEditor } from "./avatarEditor";
export type {
  AvatarEditorLocked,
  AvatarEditorLockedTapInfo,
  AvatarEditorProps,
  AvatarEditorTheme,
} from "./avatarEditor";

// State (provider + hooks)
export {
  AvatarProvider,
  sanitizeAvatar,
  useAvatar,
  useAvatarGenerations,
  useAvatarTriggers,
} from "./store";
export type { AvatarProviderProps, AvatarStorageAdapter } from "./store";

// Trigger hooks (subscribe a Rive view to the store's mistake/win counters)
export { useAvatarMistakeTrigger, useAvatarWinTrigger } from "./useAvatarMistakeTrigger";

// Misc utilities
export { useFadeInOpacity } from "./useFadeInOpacity";
export { loadSharedAvatarRiveFile, useSharedAvatarRiveFile } from "./sharedAvatarRiveFile";
export type { SharedRiveFileState } from "./sharedAvatarRiveFile";
