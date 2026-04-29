import * as React from "react";
import { create } from "zustand";

import {
  type AvatarShape,
  type CustomAvatar,
  AVATAR_SHAPES,
  DEFAULT_AVATAR,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_SKIN_COLOR,
  EDITABLE_PARTS,
  type EditablePart,
  getDefaultPartColors,
} from "./avatarConstants";
import { colorSlotCount } from "./avatarSvgComposer";

/**
 * Pluggable storage adapter. Supply this from your host app (e.g. wrapping
 * react-native-mmkv, AsyncStorage, IndexedDB) and persistence will turn on.
 * Omit and the avatar lives in memory only.
 */
export type AvatarStorageAdapter = {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
};

const DEFAULT_KEY = "multiavatar.user_avatar.v1";

const isAvatarShape = (v: unknown): v is AvatarShape =>
  typeof v === "string" && (AVATAR_SHAPES as readonly string[]).includes(v);

export function sanitizeAvatar(input: unknown): CustomAvatar | null {
  if (!input || typeof input !== "object") return null;
  const obj = input as Record<string, unknown>;
  const out: Partial<CustomAvatar> = {};
  for (const part of EDITABLE_PARTS) {
    const entry = obj[part];
    if (!entry || typeof entry !== "object") return null;
    const { shape, colors } = entry as { shape: unknown; colors: unknown };
    if (!isAvatarShape(shape)) return null;
    if (!Array.isArray(colors) || !colors.every((c) => typeof c === "string")) return null;
    const expected = colorSlotCount(shape, part);
    const fixed = (colors as string[]).slice(0, expected);
    while (fixed.length < expected) {
      fixed.push(getDefaultPartColors(shape, part)[fixed.length] ?? "#000");
    }
    out[part] = { shape, colors: fixed };
  }
  out.background = typeof obj.background === "string" ? obj.background : DEFAULT_BACKGROUND_COLOR;
  out.skin = typeof obj.skin === "string" ? obj.skin : DEFAULT_SKIN_COLOR;
  return out as CustomAvatar;
}

/**
 * Internal zustand store backing the {@link AvatarProvider} / {@link useAvatar}
 * helpers. Library-private — consumers normally never touch this directly.
 */
type State = {
  avatar: CustomAvatar;
  noGeneration: number;
  yesGeneration: number;
  setAvatar: (avatar: CustomAvatar) => void;
  setAvatarPart: (part: EditablePart, shape: AvatarShape, colors: string[]) => void;
  triggerNo: () => void;
  triggerYes: () => void;
};

function createAvatarStore(initialAvatar: CustomAvatar) {
  return create<State>((set) => ({
    avatar: initialAvatar,
    noGeneration: 0,
    yesGeneration: 0,
    setAvatar: (avatar) => set({ avatar }),
    setAvatarPart: (part, shape, colors) =>
      set((s) => ({ avatar: { ...s.avatar, [part]: { shape, colors: [...colors] } } })),
    triggerNo: () => set((s) => ({ noGeneration: s.noGeneration + 1 })),
    triggerYes: () => set((s) => ({ yesGeneration: s.yesGeneration + 1 })),
  }));
}

type AvatarStore = ReturnType<typeof createAvatarStore>;

const StoreContext = React.createContext<AvatarStore | null>(null);

export type AvatarProviderProps = {
  children: React.ReactNode;
  /** Initial avatar before any persisted value loads. Defaults to DEFAULT_AVATAR. */
  initialAvatar?: CustomAvatar;
  /** Optional persistence. Provide both methods to enable load/save. */
  storage?: AvatarStorageAdapter;
  /** Storage key. Defaults to "multiavatar.user_avatar.v1". */
  storageKey?: string;
};

export const AvatarProvider = ({
  children,
  initialAvatar,
  storage,
  storageKey = DEFAULT_KEY,
}: AvatarProviderProps): React.ReactElement => {
  const [store] = React.useState(() => createAvatarStore(initialAvatar ?? DEFAULT_AVATAR));

  // Load persisted avatar on mount.
  React.useEffect(() => {
    if (!storage) return;
    let cancelled = false;
    void (async () => {
      try {
        const raw = await storage.getItem(storageKey);
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw) as unknown;
        const sanitized = sanitizeAvatar(parsed);
        if (sanitized) store.setState({ avatar: sanitized });
      } catch {
        // ignore — keep initial avatar if storage is unreadable/corrupt
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store, storage, storageKey]);

  // Persist on change.
  React.useEffect(() => {
    if (!storage) return;
    let firstFire = true;
    const unsub = store.subscribe((state, prev) => {
      // Skip the initial subscription tick.
      if (firstFire) {
        firstFire = false;
        return;
      }
      if (state.avatar === prev.avatar) return;
      try {
        const result = storage.setItem(storageKey, JSON.stringify(state.avatar));
        if (result && typeof (result as Promise<void>).then === "function") {
          (result as Promise<void>).catch(() => {
            // ignore async write failure
          });
        }
      } catch {
        // ignore sync write failure
      }
    });
    return unsub;
  }, [store, storage, storageKey]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};

function useAvatarStore<T>(selector: (state: State) => T): T {
  const store = React.useContext(StoreContext);
  if (!store)
    throw new Error("useAvatar/* hooks must be used inside <AvatarProvider />.");
  return store(selector);
}

/** Read + write the current avatar. */
export function useAvatar() {
  const avatar = useAvatarStore((s) => s.avatar);
  const setAvatar = useAvatarStore((s) => s.setAvatar);
  const setAvatarPart = useAvatarStore((s) => s.setAvatarPart);
  return { avatar, setAvatar, setAvatarPart };
}

/** Counters that bump when {@link useAvatarTriggers} actions are called. */
export function useAvatarGenerations(): { no: number; yes: number } {
  const no = useAvatarStore((s) => s.noGeneration);
  const yes = useAvatarStore((s) => s.yesGeneration);
  return { no, yes };
}

/**
 * Imperative actions to fire avatar reactions. Call `triggerNo()` on a wrong
 * input, `triggerYes()` on a win — every Rive avatar mounted under the
 * provider plays the corresponding state-machine trigger.
 */
export function useAvatarTriggers(): { triggerNo: () => void; triggerYes: () => void } {
  const triggerNo = useAvatarStore((s) => s.triggerNo);
  const triggerYes = useAvatarStore((s) => s.triggerYes);
  return { triggerNo, triggerYes };
}
