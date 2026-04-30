import { Fit, RiveColor, RiveView, useRive } from "@rive-app/react-native";
import * as React from "react";
import { Animated, StyleSheet, View } from "react-native";

import {
  type CustomAvatar,
  getPartRiveBindingColors,
  RIVE_ENUM_PATH,
  toRiveHex,
} from "./avatarConstants";
import { useSharedAvatarRiveFile } from "./sharedAvatarRiveFile";
import { useAvatarMistakeTrigger, useAvatarWinTrigger } from "./useAvatarMistakeTrigger";
import { useFadeInOpacity } from "./useFadeInOpacity";

type Props = {
  avatar: CustomAvatar;
  size?: number;
  /**
   * Pause the avatar's idle animation while keeping the artboard mounted.
   * `yes` / `no` triggers still fire when invoked. Defaults to `false`.
   */
  noAnimation?: boolean;
};

export const RiveAvatar = ({
  avatar,
  size = 200,
  noAnimation = false,
}: Props): React.ReactElement | null => {
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
      vmi?.booleanProperty("noAnimation")?.set(noAnimation);
      if (!noAnimation) ref.playIfNeeded();
    })();
    return () => {
      cancelled = true;
    };
  }, [noAnimation, canRender, riveViewRef]);

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
      for (const part of ["top", "clo", "eyes", "mouth"] as const) {
        vmi.enumProperty(RIVE_ENUM_PATH[part])?.set(avatar[part].shape);
      }
      const setColor = (name: string, hex6: string | null) => {
        if (hex6 === null) return;
        vmi.colorProperty(name)?.set(RiveColor.fromHexString(`#${hex6}`).toInt());
      };
      const topColors = getPartRiveBindingColors(avatar.top.shape, "top", avatar.top.colors);
      setColor("topMain", topColors.main);
      setColor("topAccent", topColors.accent);
      const cloColors = getPartRiveBindingColors(avatar.clo.shape, "clo", avatar.clo.colors);
      setColor("clothesMain", cloColors.main);
      setColor("clothesAccent", cloColors.accent);
      const eyesColors = getPartRiveBindingColors(avatar.eyes.shape, "eyes", avatar.eyes.colors);
      setColor("eyesMain", eyesColors.main);
      setColor("eyesAccent", eyesColors.accent);
      const mouthColors = getPartRiveBindingColors(
        avatar.mouth.shape,
        "mouth",
        avatar.mouth.colors
      );
      setColor("mouthMain", mouthColors.main);
      setColor("mouthAccent", mouthColors.accent);
      setColor("skin", toRiveHex(avatar.skin));
      ref.playIfNeeded();
      if (!cancelled) setBindingsApplied(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [avatar, canRender, riveViewRef]);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: avatar.background,
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
