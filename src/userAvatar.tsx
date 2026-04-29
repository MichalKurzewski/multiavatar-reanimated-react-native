import type * as React from "react";

import { RiveAvatar } from "./riveAvatar";
import { useAvatar } from "./store";

type Props = {
  size?: number;
};

/**
 * Renders the avatar held in {@link AvatarProvider}'s store. For one-off /
 * controlled usage, use {@link RiveAvatar} directly with a CustomAvatar prop.
 */
export const UserAvatar = ({ size = 84 }: Props): React.ReactElement => {
  const { avatar } = useAvatar();
  return <RiveAvatar avatar={avatar} size={size} />;
};
