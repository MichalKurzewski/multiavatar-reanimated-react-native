import { type RiveFile, RiveFileFactory } from "@rive-app/react-native";
import * as React from "react";

import avatarRiv from "../assets/avatar.riv";

let sharedRiveFile: RiveFile | null = null;
let sharedRivePromise: Promise<RiveFile> | null = null;
let sharedRiveError: Error | null = null;

export function loadSharedAvatarRiveFile(): Promise<RiveFile> {
  if (sharedRiveFile) return Promise.resolve(sharedRiveFile);
  if (sharedRivePromise) return sharedRivePromise;
  sharedRivePromise = RiveFileFactory.fromSource(avatarRiv, undefined)
    .then((f) => {
      sharedRiveFile = f;
      return f;
    })
    .catch((err) => {
      sharedRiveError = err instanceof Error ? err : new Error(String(err));
      sharedRivePromise = null;
      throw sharedRiveError;
    });
  return sharedRivePromise;
}

export type SharedRiveFileState = {
  riveFile: RiveFile | null;
  isLoading: boolean;
  error: Error | null;
};

export function useSharedAvatarRiveFile(): SharedRiveFileState {
  const [state, setState] = React.useState<SharedRiveFileState>(() => ({
    riveFile: sharedRiveFile,
    isLoading: sharedRiveFile === null && sharedRiveError === null,
    error: sharedRiveError,
  }));

  React.useEffect(() => {
    if (sharedRiveFile || sharedRiveError) return;
    let cancelled = false;
    loadSharedAvatarRiveFile().then(
      (f) => {
        if (!cancelled) setState({ riveFile: f, isLoading: false, error: null });
      },
      (err) => {
        if (!cancelled) setState({ riveFile: null, isLoading: false, error: err });
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
