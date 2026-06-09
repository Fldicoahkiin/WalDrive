import React from "react";
import { Composition } from "remotion";
import { DEMO_DURATION_IN_FRAMES, WalDriveDemo } from "./WalDriveDemo";
import { FPS } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="WalDriveDemo"
      component={WalDriveDemo}
      durationInFrames={DEMO_DURATION_IN_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
