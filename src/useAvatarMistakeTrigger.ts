import type { RiveViewRef } from "@rive-app/react-native";
import * as React from "react";

import { useAvatarGenerations } from "./store";

/**
 * Fire a Rive trigger on the avatar whenever `generation` increments.
 * Each avatar instance keeps its own `handledRef` so the trigger fires once
 * per increment per view.
 */
function useTriggerOnGeneration(
  triggerName: string,
  generation: number,
  canRender: boolean,
  riveViewRef: RiveViewRef | null
): void {
  const handledRef = React.useRef(generation);
  React.useEffect(() => {
    if (generation === handledRef.current) return;
    if (!canRender) return;
    if (!riveViewRef) return;
    handledRef.current = generation;
    void (async () => {
      const ready = await riveViewRef.awaitViewReady();
      if (!ready) return;
      const vmi = riveViewRef.getViewModelInstance();
      vmi?.triggerProperty(triggerName)?.trigger();
      riveViewRef.playIfNeeded();
    })();
  }, [triggerName, generation, canRender, riveViewRef]);
}

/**
 * Subscribe to the global mistake counter and fire the `no` Rive trigger when
 * the user types a wrong number. Called by every Rive-rendered avatar on
 * screen so they all react together.
 */
export function useAvatarMistakeTrigger(canRender: boolean, riveViewRef: RiveViewRef | null): void {
  const { no } = useAvatarGenerations();
  useTriggerOnGeneration("no", no, canRender, riveViewRef);
}

/**
 * Subscribe to the global win counter and fire the `yes` Rive trigger when
 * the player wins a game. Called by every Rive-rendered avatar on screen.
 */
export function useAvatarWinTrigger(canRender: boolean, riveViewRef: RiveViewRef | null): void {
  const { yes } = useAvatarGenerations();
  useTriggerOnGeneration("yes", yes, canRender, riveViewRef);
}
