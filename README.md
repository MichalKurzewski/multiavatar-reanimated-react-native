# multiavatar-reanimated-react-native

A customizable, animated avatar component for React Native + Expo. Backed by a
single Rive runtime with full data-binding (16 swappable shapes for clothes /
eyes / mouth, 27 top variants for hair / hats, color binds for hair / clothes /
eyes / mouth / skin, plus `yes` / `no` state-machine triggers). Cross-platform
— falls back to an SVG composer on the web.

The shape catalog (16 characters × 4 parts) is adapted from
[multiavatar.com](https://multiavatar.com) by Gie Katon. The original
multiavatar SVG library generates pseudo-random avatars from a seed; this
package picks 16 of those shapes, exposes them as a switchable, color-bindable
Rive artboard, and wraps them in React components for easy reuse. Big thanks
to multiavatar.com for the original artwork — without it this wouldn't exist.

This will be featured in [coffeesudoku.com](https://coffeesudoku.com) mobile game (freenoads)
also if you want to readjust the avatar.riv here is a marketplace file (i think you can just fork it for your purpose, if not let me know) [avatar rive preview](https://rive.app/community/files/27484-51919-animated-avatars-for-multiavatarcom)
MIT licensed.

## Preview

Four variations × three states. The yes / no clips fire the `yes` and `no`
Rive triggers ~200ms in.

|   | idle (10s loop) | yes (1s) | no (1s) |
| - | --------------- | -------- | ------- |
| **default** (Robo, default colors) | <img src="gifs/default-idle.gif" width="160" /> | <img src="gifs/default-yes.gif" width="160" /> | <img src="gifs/default-no.gif" width="160" /> |
| **spy** (Country / Firehair / Female / Older, greys) | <img src="gifs/spy-idle.gif" width="160" /> | <img src="gifs/spy-yes.gif" width="160" /> | <img src="gifs/spy-no.gif" width="160" /> |
| **tips** (Meta1 top + Meta clo/eyes/mouth, metallic eye accent) | <img src="gifs/tips-idle.gif" width="160" /> | <img src="gifs/tips-yes.gif" width="160" /> | <img src="gifs/tips-no.gif" width="160" /> |
| **toned-warm** (Older / Blond / Blond / Firehair, muted) | <img src="gifs/toned-warm-idle.gif" width="160" /> | <img src="gifs/toned-warm-yes.gif" width="160" /> | <img src="gifs/toned-warm-no.gif" width="160" /> |

## Install

The package is published to **GitHub Packages**. Add this to your project's
`.npmrc` (or `~/.npmrc`):

```
@michalkurzewski:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`GITHUB_TOKEN` is any classic Personal Access Token with the `read:packages`
scope (https://github.com/settings/tokens). Then install:

```sh
bun add @michalkurzewski/multiavatar-reanimated-react-native
# or
npm install @michalkurzewski/multiavatar-reanimated-react-native
```

Peer dependencies (install at versions matching your app):

- `react`, `react-native`
- `@rive-app/react-native` (Rive runtime — reads the bundled `.riv`)
- `react-native-svg` (web fallback + editor thumbnails)
- `zustand` (internal store)
- `@react-native-async-storage/async-storage` (only if you wire AsyncStorage as
  the persistence adapter — optional)

### Metro / .riv asset

The package ships its own `assets/avatar.riv`. Make sure your Metro config
includes `riv` in `resolver.assetExts`:

```js
// metro.config.js
const config = getDefaultConfig(__dirname);
config.resolver.assetExts = [...config.resolver.assetExts, "riv"];
module.exports = config;
```

## Quick start — store mode

Wrap your app in `<AvatarProvider />`, optionally with a storage adapter, then
drop in `<UserAvatar />` anywhere.

```tsx
import {
  AvatarProvider,
  type AvatarStorageAdapter,
  UserAvatar,
} from "multiavatar-reanimated-react-native";
import { MMKV } from "react-native-mmkv";

const mmkv = new MMKV();
const storage: AvatarStorageAdapter = {
  getItem: (key) => mmkv.getString(key) ?? null,
  setItem: (key, value) => mmkv.set(key, value),
};

export default function App() {
  return (
    <AvatarProvider storage={storage}>
      {/* …rest of app… */}
      <UserAvatar size={84} />
    </AvatarProvider>
  );
}
```

State is persisted under the key `multiavatar.user_avatar.v1` (override with
`storageKey`). Omit `storage` and the avatar lives in memory only.

## Editor

`<AvatarEditor />` is an embeddable card — drop it inside your own modal /
sheet. It reads and writes the active avatar through the provider.

```tsx
import { AvatarEditor } from "multiavatar-reanimated-react-native";

<MyModal visible={open} onClose={() => setOpen(false)}>
  <AvatarEditor
    onClose={() => setOpen(false)}
    theme={{
      background: "#fff",
      border: "#e5e5e5",
      text: "#1a1a1a",
      accent: "#1a1a1a",
      buttonBackground: "#1a1a1a",
      buttonText: "#fff",
    }}
  />
</MyModal>;
```

The editor exposes:

- 4 shape tabs (Top / Clothes / Eyes / Mouth) with circular thumbnail grid (27
  variants for Top, 16 for the other parts); each thumbnail zooms in on the
  active part.
- Skin and Background color tabs.
- Per-part Main + (when applicable) Accent color pickers. Single-color shapes
  auto-collapse to Main only.
- Mouth slot picker uses the labels "Lips" + "Facial hair" and treats white as
  uncontrollable teeth.
- Save / Cancel buttons appear once the user makes a change; otherwise a single
  Close button.

## Triggers — yes / no reactions

The bundled Rive artboard has two state-machine triggers: `yes` (celebration)
and `no` (negative reaction). Every Rive avatar mounted under the provider
plays these whenever you bump the corresponding counter:

```tsx
import { useAvatarTriggers } from "multiavatar-reanimated-react-native";

function GameLoop() {
  const { triggerNo, triggerYes } = useAvatarTriggers();

  function onWrongAnswer() { triggerNo(); }
  function onWin() { triggerYes(); }
}
```

Trigger fan-out is automatic — render `<UserAvatar>`, `<SpyAvatar>`, etc.
anywhere and they all react together.

## Controlled mode

If you don't want the provider, use `<RiveAvatar>` directly with a
`CustomAvatar` value:

```tsx
import { RiveAvatar, DEFAULT_AVATAR } from "multiavatar-reanimated-react-native";

<RiveAvatar avatar={DEFAULT_AVATAR} size={84} />;
```

You manage state, persistence, and triggers yourself.

## Building characters with `buildAvatar`

`buildAvatar(shapes, options?)` is the factory for assembling a `CustomAvatar`
without hand-writing per-slot color arrays. Pass shape names per part, optional
`background` / `skin`, and per-part `{ main, accent }` color overrides — the
factory paints every slot tagged as main/accent (per `classifyColorSlots`),
leaving authored 3rd+ colors in place. Drop the result into `<RiveAvatar>` or
seed `AvatarProvider` with it.

```tsx
import { buildAvatar, RiveAvatar } from "multiavatar-reanimated-react-native";

// Mystery / unknown-user silhouette.
const SPY_AVATAR = buildAvatar(
  { top: "Country", clo: "Firehair", eyes: "Female", mouth: "Older" },
  {
    background: "#2a2a2a",
    skin: "#5a5a5a",
    colors: {
      top: { main: "#5a5a5a", accent: "#3a3a3a" },
      clo: { main: "#5a5a5a", accent: "#3a3a3a" },
      eyes: { main: "#1a1a1a" },
      mouth: { main: "#1a1a1a" },
    },
  }
);

// Help / hint character, all-Meta with a silver-blue eye accent.
const TIPS_AVATAR = buildAvatar(
  { top: "Meta1", clo: "Meta", eyes: "Meta", mouth: "Meta" },
  {
    background: "#9a9aa6",
    skin: "#d2ad6d",
    colors: {
      top: { main: "#6a6a6a", accent: "#3a3a3a" },
      clo: { main: "#3a3a3a", accent: "#5a6878" },
      eyes: { main: "#1a1a1a", accent: "#8aa3b0" },
      mouth: { main: "#3a3a3a", accent: "#5a5a5a" },
    },
  }
);

<RiveAvatar avatar={SPY_AVATAR} size={64} noAnimation />;
```

## API reference

### Components

| Component | Mode | Use case |
| --- | --- | --- |
| `<UserAvatar size noAnimation />` | store-driven | Render the active user's avatar |
| `<RiveAvatar avatar size noAnimation />` | controlled | One-off avatar with explicit value |
| `<AvatarEditor onClose theme onDraftChange maxWidth />` | store-driven | Customization UI |
| `<AvatarProvider storage storageKey initialAvatar children />` | — | Wrap your app |

`noAnimation` (default `false`) pauses the artboard's idle loop while leaving
the avatar mounted. `yes` / `no` triggers still fire when invoked — handy for
holding a quiet pose between game actions and only reacting on win / loss.
Web fallback accepts the prop for API parity but is a static SVG snapshot.

### Hooks

| Hook | Returns |
| --- | --- |
| `useAvatar()` | `{ avatar, setAvatar, setAvatarPart }` |
| `useAvatarTriggers()` | `{ triggerNo, triggerYes }` |
| `useAvatarGenerations()` | `{ no, yes }` (raw counters) |
| `useAvatarMistakeTrigger(canRender, riveViewRef)` | imperative fire on counter bumps |
| `useAvatarWinTrigger(canRender, riveViewRef)` | imperative fire on counter bumps |
| `useFadeInOpacity(visible, duration?)` | `Animated.Value` for fade-in helpers |
| `useSharedAvatarRiveFile()` | `{ riveFile, isLoading, error }` — module-level cache |

### Utility / data

- `DEFAULT_AVATAR` — the out-of-the-box `CustomAvatar` (Robo for every part).
- `AVATAR_SHAPES` — readonly list of the 16 base shape names (clo / eyes / mouth).
- `TOP_SHAPES` — readonly list of the 27 top variant names (e.g. `Guy1`, `Asian2`, `Meta3`).
- `TOP_BASE_SHAPE` — record mapping each `TopShape` back to its base `AvatarShape` (for SVG fallback / default colors).
- `shapesForPart(part)` — returns `TOP_SHAPES` for `top`, `AVATAR_SHAPES` otherwise.
- `baseShapeFor(shape, part)` — collapse a top variant to its base `AvatarShape` (passes through for non-top parts).
- `EDITABLE_PARTS` — `["top", "clo", "eyes", "mouth"]`.
- `BACKGROUND_PALETTE`, `SKIN_PALETTE`, `HAIR_PALETTE`, `COLOR_PALETTE` — picker palettes.
- `composeAvatarSvg(avatar)` — compose a full multiavatar SVG string.
- `renderShapeThumbnailSvg(avatar, part, candidateShape, candidateColors)` — same as compose, with one part swapped and the viewBox cropped to the part's region (used by the editor's thumbnails).
- `getDefaultPartColors(shape, part)` / `getPartRiveBindingColors(shape, part, colors)` — helpers used internally; also useful if building a custom UI.
- `classifyColorSlots(defaultColors, options?)` — group a part's color slots into `main` + (optional) `accent`.

### Rive bindings (artboard data binds)

The bundled `.riv` exposes the following named view-model properties.
Component code wires them via `vmi.enumProperty(name)` / `vmi.colorProperty(name)` /
`vmi.triggerProperty(name)`.

| Bind name | Type | Values | Notes |
| --- | --- | --- | --- |
| `topEnum` | enum (`StyleTopEnum`) | one of `TOP_SHAPES` | Hair / hat shape (27 variants) |
| `clothesEnum` | enum | one of `AVATAR_SHAPES` | Clothing shape |
| `eyesEnum` | enum | one of `AVATAR_SHAPES` | Eye style |
| `mouthEnum` | enum | one of `AVATAR_SHAPES` | Mouth style |
| `topMain` | color | RGB | Primary hair color |
| `topAccent` | color | RGB | Highlight / accessory tint |
| `clothesMain` | color | RGB | Primary clothing color |
| `clothesAccent` | color | RGB | Secondary clothing color (optional per shape) |
| `eyesMain` | color | RGB | Pupil / outline |
| `eyesAccent` | color | RGB | Iris / glow (optional per shape) |
| `mouthMain` | color | RGB | Lips |
| `mouthAccent` | color | RGB | Facial hair (optional per shape) |
| `skin` | color | RGB | Face / hand skin tone |
| `yes` | trigger | — | Celebration animation |
| `no` | trigger | — | Negative shake / reaction |
| `noAnimation` | boolean | — | Freeze the idle loop. yes/no triggers still play when fired. |

The 16 base shape names (used by `clo` / `eyes` / `mouth`, and as the fallback
families for top variants): `Robo`, `Girl`, `Blonde`, `Guy`, `Country`,
`Geeknot`, `Asian`, `Punk`, `Afrohair`, `Female`, `Older`, `Firehair`, `Blond`,
`Ateam`, `Rasta`, `Meta`.

The 27 top variants (used by `top` only): `Robo`, `Girl`, `Blonde`, `Guy1`,
`Guy2`, `Guy3`, `Country`, `Geeknot`, `Asian1`, `Asian2`, `Punk`, `Afrohair1`,
`Afrohair2`, `Female1`, `Female2`, `Female3`, `Older1`, `Older2`, `Older3`,
`Firehair`, `Blond`, `Ateam1`, `Ateam2`, `Rasta`, `Meta1`, `Meta2`, `Meta3`.
Variants currently share their base shape's web-SVG fallback and default
colors (resolved via `TOP_BASE_SHAPE`); the Rive artboard renders each variant
distinctly.

### `CustomAvatar` shape

```ts
type CustomAvatar = {
  top:   { shape: TopShape;    colors: string[] }; // 27 variants, see TOP_SHAPES
  clo:   { shape: AvatarShape; colors: string[] };
  eyes:  { shape: AvatarShape; colors: string[] };
  mouth: { shape: AvatarShape; colors: string[] };
  background: string; // hex, applied as the circular bg behind Rive
  skin:       string; // hex, sent to the `skin` color bind
};
```

`colors` is per-slot (each shape has 1–17 SVG slots); the helper
`getPartRiveBindingColors` picks the user-editable Main + Accent values for
the Rive binds. For controlled use, you can build avatars with `buildAvatar({
top: "Robo", clo: "Robo", eyes: "Robo", mouth: "Robo" })`.

## Regenerating the parts catalog

`scripts/genAvatarPartsData.ts` regenerates the SVG catalog from the bundled
`scripts/multiavatar.ts` source. Run from the package root:

```sh
bun run gen:parts
```

Output is written to `src/avatarPartsData.generated.ts`.

## License

MIT — see [LICENSE](./LICENSE). Multiavatar shapes © Gie Katon, MIT.
