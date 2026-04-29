import * as React from "react";
import { Image, View } from "react-native";

import type { CustomAvatar } from "./avatarConstants";
import { composeAvatarSvg } from "./avatarSvgComposer";

type Props = {
  avatar: CustomAvatar;
  size?: number;
};

export const RiveAvatar = ({ avatar, size = 200 }: Props): React.ReactElement => {
  const dataUri = React.useMemo(() => {
    const svg = composeAvatarSvg(avatar);
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, [avatar]);

  return (
    <View style={{ width: size, height: size }}>
      <Image source={{ uri: dataUri }} style={{ width: size, height: size }} resizeMode="contain" />
    </View>
  );
};
