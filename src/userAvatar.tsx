import type * as React from "react";

import { RiveAvatar } from "./riveAvatar";
import { useAvatar } from "./store";

type Props = {
  size?: number;
  /** Pause idle animation while keeping yes/no triggers responsive. */
  noAnimation?: boolean;
};

/**
 * Renders the avatar held in {@link AvatarProvider}'s store. For one-off /
 * controlled usage, use {@link RiveAvatar} directly with a CustomAvatar prop.
 */
export const UserAvatar = ({ size = 84, noAnimation }: Props): React.ReactElement => {
  const { avatar } = useAvatar();
  return <RiveAvatar avatar={avatar} size={size} noAnimation={noAnimation} />;
};
