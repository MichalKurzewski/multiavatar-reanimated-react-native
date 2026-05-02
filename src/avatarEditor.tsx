import * as React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SvgXml } from "react-native-svg";

import {
  type AvatarPart,
  type AvatarShape,
  type AvatarTopPart,
  BACKGROUND_PALETTE,
  classifyColorSlots,
  COLOR_PALETTE,
  type ColorRole,
  type CustomAvatar,
  type EditablePart,
  getDefaultPartColors,
  HAIR_PALETTE,
  ignoredColorsFor,
  PART_LABELS,
  type ShapeForPart,
  shapesForPart,
  SKIN_PALETTE,
  type TopShape,
} from "./avatarConstants";
import { renderShapeThumbnailSvg } from "./avatarSvgComposer";
import { RiveAvatar } from "./riveAvatar";
import { useAvatar } from "./store";

export type AvatarEditorTheme = {
  background?: string;
  border?: string;
  text?: string;
  accent?: string;
  buttonBackground?: string;
  buttonText?: string;
};

/**
 * Lock state for shapes / backgrounds. All keys optional. Entries listed here
 * render grayscale + padlock and sort to the end of their grid; tapping them
 * fires {@link AvatarEditorProps.onLockedTap} instead of selecting. The
 * currently-selected shape/color is never locked-rendered (grandfathered),
 * so changing the lock list never breaks an in-use avatar.
 */
export type AvatarEditorLocked = {
  top?: ReadonlyArray<TopShape>;
  clo?: ReadonlyArray<AvatarShape>;
  eyes?: ReadonlyArray<AvatarShape>;
  mouth?: ReadonlyArray<AvatarShape>;
  /** Hex strings matching {@link BACKGROUND_PALETTE}. */
  backgrounds?: ReadonlyArray<string>;
  /** Hex strings locked in the top "main" palette ({@link HAIR_PALETTE}). */
  topColors?: ReadonlyArray<string>;
};

export type AvatarEditorLockedTapInfo =
  | { part: "top"; value: TopShape }
  | { part: "clo" | "eyes" | "mouth"; value: AvatarShape }
  | { part: "background"; value: string }
  | { part: "topColor"; value: string };

export type AvatarEditorLabels = {
  cancel?: string;
  save?: string;
  close?: string;
  /** Used as accessibilityHint on shape/color buttons. */
  selectHint?: string;
  /** Used as accessibilityHint on locked entries. */
  lockedHint?: string;
};

export type AvatarEditorProps = {
  /** Called when the user clicks Close/Cancel/Save and the editor wants to dismiss. */
  onClose?: () => void;
  /** Theme tokens — wire up to your design system. Sensible defaults provided. */
  theme?: AvatarEditorTheme;
  /** Called every time the user changes a value. Useful for live previews outside the editor. */
  onDraftChange?: (draft: CustomAvatar) => void;
  /**
   * Override the maximum width. By default the editor adapts to orientation
   * (≈360 portrait, ≈680 landscape) and caps to the available viewport width.
   */
  maxWidth?: number;
  /**
   * Override the maximum height. By default the editor caps to the available
   * viewport height (minus a small safety margin) so the body becomes
   * scrollable when content exceeds the viewport.
   */
  maxHeight?: number;
  /** Optional: which shapes/backgrounds are locked. All enabled by default. */
  locked?: AvatarEditorLocked;
  /** Optional: fired when the user taps a locked entry (instead of selecting it). */
  onLockedTap?: (info: AvatarEditorLockedTapInfo) => void;
  /**
   * Optional: current player name. When provided, an editable name field is
   * rendered to the left of the avatar preview and the field participates in
   * the editor's hasChanges / Save / Cancel flow.
   */
  name?: string;
  /** Optional: placeholder + accessibility label for the name field. Defaults to "Name". */
  nameLabel?: string;
  /** Optional: max characters for the name input. Defaults to 30. */
  nameMaxLength?: number;
  /**
   * Optional: fired on Save when the trimmed name draft differs from the
   * `name` prop. Receives the trimmed new name. Only fired if `name` is set.
   */
  onNameSave?: (name: string) => void;
  /** Optional: fired whenever Save is clicked, regardless of which field changed. */
  onSave?: () => void;
  /** Optional: override the default English button labels and accessibility hints. */
  labels?: AvatarEditorLabels;
};

const DEFAULT_THEME: Required<AvatarEditorTheme> = {
  background: "#ffffff",
  border: "#dddddd",
  text: "#1a1a1a",
  accent: "#1a1a1a",
  buttonBackground: "#1a1a1a",
  buttonText: "#ffffff",
};

const EMPTY_LOCKED: Required<AvatarEditorLocked> = {
  top: [],
  clo: [],
  eyes: [],
  mouth: [],
  backgrounds: [],
  topColors: [],
};

const DEFAULT_LABELS: Required<AvatarEditorLabels> = {
  cancel: "Cancel",
  save: "Save",
  close: "Close",
  selectHint: "Double tap to select",
  lockedHint: "Locked. Double tap for unlock requirements.",
};

/** Padding kept between the editor card and the screen edges. */
const SCREEN_PADDING = 32;

const padlockSvg = (color: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="9" x="5" y="11" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;

type ShapeTabId = EditablePart;
type ColorTabId = "skin" | "background";
type TabId = ShapeTabId | ColorTabId;

const TABS: { id: TabId; label: string }[] = [
  { id: "top", label: PART_LABELS.top },
  { id: "clo", label: PART_LABELS.clo },
  { id: "eyes", label: PART_LABELS.eyes },
  { id: "mouth", label: PART_LABELS.mouth },
  { id: "skin", label: "Skin" },
  { id: "background", label: "BG" },
];

const isShapeTab = (id: TabId): id is ShapeTabId =>
  id === "top" || id === "clo" || id === "eyes" || id === "mouth";

const ROLE_LABEL: Record<ColorRole, string> = { main: "Main", accent: "Accent" };
const MOUTH_LABEL: Record<ColorRole, string> = { main: "Lips", accent: "Facial hair" };

function paletteFor(part: EditablePart, role: ColorRole): readonly string[] {
  if (part === "top" && role === "main") return HAIR_PALETTE;
  return COLOR_PALETTE;
}

function labelFor(part: EditablePart, role: ColorRole): string {
  if (part === "mouth") return MOUTH_LABEL[role];
  return ROLE_LABEL[role];
}

function colorAccessibilityName(c: string): string {
  if (c === "none") return "transparent";
  return c;
}

/**
 * Self-contained avatar editor. Embed inside your own modal/sheet wrapper —
 * the editor doesn't render its own backdrop. Reads and writes the avatar via
 * {@link useAvatar} (so wrap your app in {@link AvatarProvider}).
 */
export const AvatarEditor = ({
  onClose,
  theme,
  onDraftChange,
  maxWidth,
  maxHeight,
  locked,
  onLockedTap,
  name,
  nameLabel,
  nameMaxLength = 30,
  onNameSave,
  onSave,
  labels,
}: AvatarEditorProps): React.ReactElement => {
  const t = { ...DEFAULT_THEME, ...theme };
  const l = { ...DEFAULT_LABELS, ...labels };
  const lockedSets = { ...EMPTY_LOCKED, ...(locked ?? {}) };
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const defaultMaxWidth = isLandscape ? 680 : 360;
  const cardWidth = Math.min(maxWidth ?? defaultMaxWidth, screenWidth - SCREEN_PADDING);
  const cardMaxHeight = Math.min(
    maxHeight ?? Number.POSITIVE_INFINITY,
    screenHeight - SCREEN_PADDING
  );
  const { avatar: stored, setAvatar } = useAvatar();
  const [draft, setDraft] = React.useState<CustomAvatar>(stored);
  const [activeTab, setActiveTab] = React.useState<TabId>("top");
  const storedRef = React.useRef(stored);
  storedRef.current = stored;
  const nameEnabled = name !== undefined;
  const [draftName, setDraftName] = React.useState<string>(name ?? "");
  React.useEffect(() => {
    if (nameEnabled) setDraftName(name ?? "");
  }, [name, nameEnabled]);

  React.useEffect(() => {
    onDraftChange?.(draft);
  }, [draft, onDraftChange]);

  const updatePart = React.useCallback(
    <P extends EditablePart>(part: P, next: AvatarPart | AvatarTopPart) => {
      setDraft((prev) => ({ ...prev, [part]: next }));
    },
    []
  );
  const updateBackground = React.useCallback((color: string) => {
    setDraft((prev) => ({ ...prev, background: color }));
  }, []);
  const updateSkin = React.useCallback((color: string) => {
    setDraft((prev) => ({ ...prev, skin: color }));
  }, []);

  const trimmedDraftName = draftName.trim();
  const nameChanged = nameEnabled && trimmedDraftName.length > 0 && trimmedDraftName !== (name ?? "");

  const hasChanges = React.useMemo(() => {
    if (JSON.stringify(draft) !== JSON.stringify(stored)) return true;
    return nameChanged;
  }, [draft, stored, nameChanged]);

  const handleSave = () => {
    setAvatar(draft);
    if (nameEnabled && nameChanged) {
      onNameSave?.(trimmedDraftName);
    }
    onSave?.();
  };
  const handleCancel = () => {
    setDraft(stored);
    if (nameEnabled) setDraftName(name ?? "");
  };
  const handleClose = () => onClose?.();

  return (
    <View
      accessibilityViewIsModal={true}
      style={{
        backgroundColor: t.background,
        borderColor: t.border,
        borderWidth: 1,
        borderRadius: 12,
        width: cardWidth,
        maxHeight: cardMaxHeight,
        overflow: "hidden",
      }}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 }}>
        {nameEnabled ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                accessibilityRole="header"
                style={{ color: t.text, fontSize: 12, opacity: 0.7 }}
              >
                {nameLabel ?? "Name"}
              </Text>
              <TextInput
                value={draftName}
                onChangeText={setDraftName}
                maxLength={nameMaxLength}
                placeholder={nameLabel ?? "Name"}
                placeholderTextColor={`${t.text}80`}
                accessibilityLabel={nameLabel ?? "Name"}
                style={{
                  borderWidth: 1,
                  borderColor: t.border,
                  borderRadius: 6,
                  paddingHorizontal: 10,
                  color: t.text,
                  fontSize: 14,
                  ...(Platform.OS === "ios"
                    ? { paddingVertical: 10 }
                    : { paddingVertical: 6, textAlignVertical: "center", includeFontPadding: false }),
                }}
              />
            </View>
            <View
              accessible={true}
              accessibilityRole="image"
              accessibilityLabel="Avatar preview"
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                borderWidth: 1,
                borderColor: t.border,
                overflow: "hidden",
              }}
            >
              <RiveAvatar avatar={draft} size={120} />
            </View>
          </View>
        ) : (
          <View
            accessible={true}
            accessibilityRole="image"
            accessibilityLabel="Avatar preview"
            style={{
              alignSelf: "center",
              width: 120,
              height: 120,
              borderRadius: 60,
              borderWidth: 1,
              borderColor: t.border,
              overflow: "hidden",
            }}
          >
            <RiveAvatar avatar={draft} size={120} />
          </View>
        )}

        <View
          accessibilityRole="tablist"
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            borderBottomWidth: 1,
            borderBottomColor: t.border,
          }}
        >
          {TABS.map(({ id, label }) => {
            const isActive = id === activeTab;
            return (
              <Pressable
                key={id}
                onPress={() => setActiveTab(id)}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityHint={`Show ${label} options`}
                accessibilityState={{ selected: isActive }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: "center",
                  borderBottomWidth: 2,
                  borderBottomColor: isActive ? t.accent : "transparent",
                }}
              >
                <Text style={{ color: t.text, fontSize: 12, fontWeight: isActive ? "600" : "400" }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ flexShrink: 1, minHeight: 0 }}>
        {isShapeTab(activeTab) ? (
          activeTab === "top" ? (
            <PartTab
              part="top"
              value={draft.top}
              avatar={draft}
              theme={t}
              labels={l}
              onChange={updatePart}
              lockedShapes={lockedSets.top}
              lockedTopColors={lockedSets.topColors}
              onLockedTap={onLockedTap}
            />
          ) : (
            <PartTab
              part={activeTab}
              value={draft[activeTab]}
              avatar={draft}
              theme={t}
              labels={l}
              onChange={updatePart}
              lockedShapes={lockedSets[activeTab]}
              onLockedTap={onLockedTap}
            />
          )
        ) : activeTab === "skin" ? (
          <ColorOnlyTab
            label="Skin"
            value={draft.skin}
            palette={SKIN_PALETTE}
            theme={t}
            labels={l}
            onChange={updateSkin}
          />
        ) : (
          <ColorOnlyTab
            label="Background"
            value={draft.background}
            palette={BACKGROUND_PALETTE}
            theme={t}
            labels={l}
            onChange={updateBackground}
            lockedColors={lockedSets.backgrounds}
            onLockedTap={
              onLockedTap
                ? (color) => onLockedTap({ part: "background", value: color })
                : undefined
            }
          />
        )}
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: 12,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 16,
          borderTopWidth: 1,
          borderTopColor: t.border,
          backgroundColor: t.background,
        }}
      >
        {hasChanges ? (
          <>
            <Pressable
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel={l.cancel}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: t.border,
              }}
            >
              <Text style={{ color: t.text }}>{l.cancel}</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              accessibilityRole="button"
              accessibilityLabel={l.save}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 6,
                backgroundColor: t.buttonBackground,
              }}
            >
              <Text style={{ color: t.buttonText }}>{l.save}</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel={l.close}
            style={{
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 6,
              backgroundColor: t.buttonBackground,
            }}
          >
            <Text style={{ color: t.buttonText }}>{l.close}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

function colorRoleEntries<P extends EditablePart>(
  part: { shape: ShapeForPart<P>; colors: readonly string[] },
  partType: P
): {
  key: string;
  role: ColorRole;
  indices: number[];
  color: string;
  label: string;
  palette: readonly string[];
}[] {
  const groups = classifyColorSlots(getDefaultPartColors(part.shape, partType), {
    ignored: ignoredColorsFor(partType),
  });
  return groups.map((group) => ({
    key: `${part.shape}:${partType}:${group.role}`,
    role: group.role,
    indices: group.indices,
    color: part.colors[group.indices[0]] ?? "#000",
    label: labelFor(partType, group.role),
    palette: paletteFor(partType, group.role),
  }));
}

type PartTabProps<P extends EditablePart> = {
  part: P;
  value: { shape: ShapeForPart<P>; colors: string[] };
  avatar: CustomAvatar;
  theme: Required<AvatarEditorTheme>;
  labels: Required<AvatarEditorLabels>;
  onChange: (part: P, next: { shape: ShapeForPart<P>; colors: string[] }) => void;
  lockedShapes?: ReadonlyArray<ShapeForPart<P>>;
  /** Locked colors for the top "main" palette. Only meaningful when part==="top". */
  lockedTopColors?: ReadonlyArray<string>;
  onLockedTap?: (info: AvatarEditorLockedTapInfo) => void;
};

const PartTab = <P extends EditablePart>({
  part,
  value,
  avatar,
  theme,
  labels,
  onChange,
  lockedShapes,
  lockedTopColors,
  onLockedTap,
}: PartTabProps<P>): React.ReactElement => {
  const partLabel = PART_LABELS[part];
  const pickShape = (shape: ShapeForPart<P>) => {
    onChange(part, { shape, colors: [...getDefaultPartColors(shape, part)] });
  };
  const setColorForIndices = (indices: readonly number[], color: string) => {
    const next = value.colors.slice();
    for (const i of indices) next[i] = color;
    onChange(part, { ...value, colors: next });
  };

  const orderedShapes = React.useMemo(() => {
    const all = shapesForPart(part);
    const lockedSet = new Set<string>(lockedShapes ?? []);
    if (lockedSet.size === 0) return all;
    const isShapeLocked = (s: ShapeForPart<P>): boolean =>
      lockedSet.has(s as unknown as string) && s !== value.shape;
    const unlocked: ShapeForPart<P>[] = [];
    const locked: ShapeForPart<P>[] = [];
    for (const s of all) {
      if (isShapeLocked(s)) locked.push(s);
      else unlocked.push(s);
    }
    return [...unlocked, ...locked];
  }, [part, lockedShapes, value.shape]);

  const lockedSet = React.useMemo(() => new Set<string>(lockedShapes ?? []), [lockedShapes]);

  const handleShapePress = (shape: ShapeForPart<P>) => {
    const isLocked = lockedSet.has(shape as unknown as string) && shape !== value.shape;
    if (isLocked) {
      if (part === "top") {
        onLockedTap?.({ part: "top", value: shape as TopShape });
      } else {
        onLockedTap?.({
          part: part as "clo" | "eyes" | "mouth",
          value: shape as AvatarShape,
        });
      }
      return;
    }
    pickShape(shape);
  };

  return (
    <ScrollView
      style={{ flexShrink: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
      showsVerticalScrollIndicator={true}
      accessibilityLabel={`${partLabel} options`}
    >
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={`${partLabel} styles`}
        style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 }}
      >
        {orderedShapes.map((shape, idx) => {
          const isActive = shape === value.shape;
          const isLocked = lockedSet.has(shape as unknown as string) && !isActive;
          const xml = renderShapeThumbnailSvg(
            avatar,
            part,
            shape,
            isActive ? value.colors : getDefaultPartColors(shape, part)
          );
          const a11yLabel = `${partLabel} style ${idx + 1} of ${orderedShapes.length}`;
          return (
            <Pressable
              key={shape}
              onPress={() => handleShapePress(shape)}
              accessibilityRole="radio"
              accessibilityLabel={a11yLabel}
              accessibilityHint={isLocked ? labels.lockedHint : labels.selectHint}
              accessibilityState={{ selected: isActive, disabled: isLocked }}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                borderWidth: 2,
                borderColor: isActive ? theme.accent : theme.border,
                overflow: "hidden",
                backgroundColor: avatar.background,
              }}
            >
              <View style={{ width: "100%", height: "100%", opacity: isLocked ? 0.35 : 1 }}>
                <SvgXml xml={xml} width="100%" height="100%" />
              </View>
              {isLocked ? <LockOverlay color={theme.text} /> : null}
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: 16, gap: 12 }}>
        {colorRoleEntries(value, part).map(({ key, color, indices, label, palette, role }) => {
          const isTopMainRow = part === "top" && role === "main";
          const lockedForRow = isTopMainRow ? lockedTopColors : undefined;
          const lockedTapForRow =
            isTopMainRow && onLockedTap
              ? (c: string) => onLockedTap({ part: "topColor", value: c })
              : undefined;
          return (
            <ColorSlotRow
              key={key}
              label={label}
              groupLabel={`${partLabel} ${label.toLowerCase()} color`}
              value={color}
              palette={palette}
              theme={theme}
              labels={labels}
              onChange={(c) => setColorForIndices(indices, c)}
              lockedColors={lockedForRow}
              onLockedTap={lockedTapForRow}
            />
          );
        })}
      </View>
    </ScrollView>
  );
};

type ColorOnlyTabProps = {
  label: string;
  value: string;
  palette: readonly string[];
  theme: Required<AvatarEditorTheme>;
  labels: Required<AvatarEditorLabels>;
  onChange: (color: string) => void;
  lockedColors?: ReadonlyArray<string>;
  onLockedTap?: (color: string) => void;
};

const ColorOnlyTab = ({
  label,
  value,
  palette,
  theme,
  labels,
  onChange,
  lockedColors,
  onLockedTap,
}: ColorOnlyTabProps): React.ReactElement => (
  <ScrollView
    style={{ flexShrink: 1 }}
    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
    showsVerticalScrollIndicator={true}
    accessibilityLabel={`${label} options`}
  >
    <View style={{ marginTop: 4 }}>
      <ColorSlotRow
        label={label}
        groupLabel={`${label} color`}
        value={value}
        palette={palette}
        theme={theme}
        labels={labels}
        onChange={onChange}
        lockedColors={lockedColors}
        onLockedTap={onLockedTap}
      />
    </View>
  </ScrollView>
);

type ColorSlotRowProps = {
  label: string;
  groupLabel: string;
  value: string;
  palette: readonly string[];
  theme: Required<AvatarEditorTheme>;
  labels: Required<AvatarEditorLabels>;
  onChange: (color: string) => void;
  lockedColors?: ReadonlyArray<string>;
  onLockedTap?: (color: string) => void;
};

const ColorSlotRow = ({
  label,
  groupLabel,
  value,
  palette,
  theme,
  labels,
  onChange,
  lockedColors,
  onLockedTap,
}: ColorSlotRowProps): React.ReactElement => {
  const lockedSet = React.useMemo(() => new Set(lockedColors ?? []), [lockedColors]);
  const orderedPalette = React.useMemo(() => {
    if (lockedSet.size === 0) return palette;
    const unlocked: string[] = [];
    const locked: string[] = [];
    for (const c of palette) {
      if (lockedSet.has(c) && c !== value) locked.push(c);
      else unlocked.push(c);
    }
    return [...unlocked, ...locked];
  }, [palette, lockedSet, value]);

  return (
    <View style={{ gap: 6 }} accessibilityRole="radiogroup" accessibilityLabel={groupLabel}>
      <Text accessibilityRole="header" style={{ fontSize: 12, color: theme.text }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {orderedPalette.map((c, idx) => {
          const isActive = c === value;
          const isLocked = lockedSet.has(c) && !isActive;
          const colorName = colorAccessibilityName(c);
          const a11yLabel = `${label} color ${idx + 1} of ${orderedPalette.length}, ${colorName}`;
          return (
            <Pressable
              key={c}
              onPress={() => {
                if (isLocked) {
                  onLockedTap?.(c);
                  return;
                }
                onChange(c);
              }}
              accessibilityRole="radio"
              accessibilityLabel={a11yLabel}
              accessibilityHint={isLocked ? labels.lockedHint : labels.selectHint}
              accessibilityState={{ selected: isActive, disabled: isLocked }}
              hitSlop={4}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: c === "none" ? "transparent" : c,
                borderWidth: isActive ? 2 : 1,
                borderColor: isActive ? theme.accent : theme.border,
                opacity: isLocked ? 0.35 : 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {c === "none" ? <View style={styles.noneSlash} /> : null}
              {isLocked ? <LockOverlay color={theme.text} small /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const LockOverlay = ({
  color,
  small,
}: {
  color: string;
  small?: boolean;
}): React.ReactElement => {
  const size = small ? 12 : 18;
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.18)",
      }}
    >
      <SvgXml xml={padlockSvg(color)} width={size} height={size} />
    </View>
  );
};

const styles = StyleSheet.create({
  noneSlash: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 12,
    height: 2,
    backgroundColor: "#d33",
    transform: [{ rotate: "45deg" }],
  },
});
