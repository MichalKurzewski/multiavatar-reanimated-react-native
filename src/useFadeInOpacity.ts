import * as React from "react";
import { Animated } from "react-native";

/**
 * Returns an Animated.Value that stays at 0 until `visible` becomes true,
 * then eases up to 1 over `duration` ms. Use as the opacity of an
 * Animated.View wrapper to fade content in once it's ready.
 */
export function useFadeInOpacity(visible: boolean, duration = 300): Animated.Value {
  const opacity = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (!visible) return;
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity, duration]);
  return opacity;
}
