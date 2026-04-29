import type * as React from "react";
import { Image, View } from "react-native";

import type { CustomAvatar } from "./avatarConstants";
import { composeAvatarSvg } from "./avatarSvgComposer";

type Props = {
  size?: number;
};

const TIPS_AVATAR: CustomAvatar = {
  top: { shape: "Meta", colors: ["#6a6a6a", "#6a6a6a", "#6a6a6a", "#6a6a6a", "#6a6a6a"] },
  clo: { shape: "Meta", colors: ["#3a3a3a", "#5a6878"] },
  eyes: { shape: "Meta", colors: ["#1a1a1a", "#8aa3b0", "#8aa3b0"] },
  mouth: { shape: "Meta", colors: ["#ffffff", "#3a3a3a"] },
  background: "#9a9aa6",
  skin: "#d2ad6d",
};

const TIPS_DATA_URI = `data:image/svg+xml,${encodeURIComponent(composeAvatarSvg(TIPS_AVATAR))}`;

export const TipsAvatar = ({ size = 64 }: Props): React.ReactElement => {
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={{ uri: TIPS_DATA_URI }}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
};
