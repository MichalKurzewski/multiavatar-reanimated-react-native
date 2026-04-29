import type * as React from "react";
import { Image, View } from "react-native";

import { SPY34_AVATAR } from "./avatarConstants";
import { composeAvatarSvg } from "./avatarSvgComposer";

type Props = {
  size?: number;
};

const SPY_DATA_URI = `data:image/svg+xml,${encodeURIComponent(composeAvatarSvg(SPY34_AVATAR))}`;

export const SpyAvatar = ({ size = 64 }: Props): React.ReactElement => {
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={{ uri: SPY_DATA_URI }}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
};
