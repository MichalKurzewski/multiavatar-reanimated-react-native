import { Fit, RiveColor, RiveView, useRive } from "@rive-app/react-native";
import * as React from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSharedAvatarRiveFile } from "./sharedAvatarRiveFile";
import { useAvatarMistakeTrigger, useAvatarWinTrigger } from "./useAvatarMistakeTrigger";
import { useFadeInOpacity } from "./useFadeInOpacity";

type Props = {
  size?: number;
};

const SPY_BACKGROUND = "#2a2a2a";
const SPY_GREY_MAIN = "5a5a5a";
const SPY_GREY_ACCENT = "3a3a3a";
const SPY_GREY_DARK = "1a1a1a";

const SPY_ENUMS: Record<string, string> = {
  topEnum: "Country",
  clothesEnum: "Firehair",
  eyesEnum: "Female",
  mouthEnum: "Older",
};

const SPY_COLORS: Record<string, string> = {
  topMain: SPY_GREY_MAIN,
  topAccent: SPY_GREY_ACCENT,
  clothesMain: SPY_GREY_MAIN,
  clothesAccent: SPY_GREY_ACCENT,
  eyesMain: SPY_GREY_DARK,
  eyesAccent: SPY_GREY_DARK,
  mouthMain: SPY_GREY_DARK,
  mouthAccent: SPY_GREY_DARK,
  skin: SPY_GREY_MAIN,
};

export const SpyAvatar = ({ size = 64 }: Props): React.ReactElement | null => {
  const { riveFile, isLoading, error } = useSharedAvatarRiveFile();
  const { riveViewRef, setHybridRef } = useRive();
  const [bindingsApplied, setBindingsApplied] = React.useState(false);
  const fadeOpacity = useFadeInOpacity(bindingsApplied);

  const canRender = !isLoading && error === null && !!riveFile;

  useAvatarMistakeTrigger(canRender, riveViewRef);
  useAvatarWinTrigger(canRender, riveViewRef);

  React.useEffect(() => {
    if (!canRender) return;
    let cancelled = false;
    void (async () => {
      const ref = riveViewRef;
      if (!ref) return;
      const ready = await ref.awaitViewReady();
      if (cancelled || !ready) return;
      const vmi = ref.getViewModelInstance();
      if (!vmi) return;
      for (const [name, value] of Object.entries(SPY_ENUMS)) {
        vmi.enumProperty(name)?.set(value);
      }
      for (const [name, hex6] of Object.entries(SPY_COLORS)) {
        vmi.colorProperty(name)?.set(RiveColor.fromHexString(`#${hex6}`).toInt());
      }
      ref.playIfNeeded();
      if (!cancelled) setBindingsApplied(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [canRender, riveViewRef]);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: SPY_BACKGROUND,
    overflow: "hidden" as const,
  };

  if (!canRender || !riveFile) {
    return <View style={containerStyle} />;
  }

  return (
    <View style={containerStyle}>
      <Animated.View style={[styles.rive, { opacity: fadeOpacity }]}>
        <RiveView
          hybridRef={setHybridRef}
          file={riveFile}
          autoPlay
          fit={Fit.Contain}
          style={styles.rive}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  rive: {
    width: "100%",
    height: "100%",
  },
});
