import { Fit, RiveColor, RiveView, useRive } from "@rive-app/react-native";
import * as React from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSharedAvatarRiveFile } from "./sharedAvatarRiveFile";
import { useAvatarMistakeTrigger, useAvatarWinTrigger } from "./useAvatarMistakeTrigger";
import { useFadeInOpacity } from "./useFadeInOpacity";

type Props = {
  size?: number;
};

const TIPS_BACKGROUND = "#9a9aa6";

const TIPS_ENUMS: Record<string, string> = {
  topEnum: "Meta",
  clothesEnum: "Meta",
  eyesEnum: "Meta",
  mouthEnum: "Meta",
};

// Toned greys with a metallic silver-blue accent for the eye.
const TIPS_COLORS: Record<string, string> = {
  topMain: "6a6a6a",
  topAccent: "3a3a3a",
  clothesMain: "3a3a3a",
  clothesAccent: "5a6878",
  eyesMain: "1a1a1a",
  eyesAccent: "8aa3b0",
  mouthMain: "3a3a3a",
  mouthAccent: "5a5a5a",
  skin: "d2ad6d",
};

export const TipsAvatar = ({ size = 64 }: Props): React.ReactElement | null => {
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
      for (const [name, value] of Object.entries(TIPS_ENUMS)) {
        vmi.enumProperty(name)?.set(value);
      }
      for (const [name, hex6] of Object.entries(TIPS_COLORS)) {
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
    backgroundColor: TIPS_BACKGROUND,
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
