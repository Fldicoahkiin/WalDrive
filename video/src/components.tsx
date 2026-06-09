import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONT, FONT_MONO } from "./theme";

/** Fade a whole scene in at its start and out before its end. */
export const SceneFade: React.FC<{
  durationInFrames: number;
  fade?: number;
  children: React.ReactNode;
}> = ({ durationInFrames, fade = 14, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, fade, durationInFrames - fade, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

/**
 * A screenshot framed like a desktop window, with a slow Ken Burns push-in.
 * Falls back to a labelled colored card when the PNG is missing.
 */
export const Screenshot: React.FC<{
  src: string;
  durationInFrames: number;
  /** 0..1 origin focus point for the zoom (default center). */
  focusX?: number;
  focusY?: number;
  fromScale?: number;
  toScale?: number;
  /** Crop to a region of the source (object-position), for "zoomed" scenes. */
  objectPosition?: string;
  fallbackLabel?: string;
}> = ({
  src,
  durationInFrames,
  focusX = 0.5,
  focusY = 0.5,
  fromScale = 1.0,
  toScale = 1.06,
  objectPosition = "center top",
  fallbackLabel,
}) => {
  const frame = useCurrentFrame();
  const [failed, setFailed] = React.useState(false);
  const scale = interpolate(frame, [0, durationInFrames], [fromScale, toScale], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });

  const frameStyle: React.CSSProperties = {
    width: "82%",
    aspectRatio: "1280 / 800",
    borderRadius: 18,
    overflow: "hidden",
    border: `1px solid ${COLORS.hairline}`,
    boxShadow:
      "0 40px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(94,106,210,0.10)",
    background: COLORS.bgSoft,
  };

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={frameStyle}>
        {failed ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLORS.inkSubtle,
              fontFamily: FONT_MONO,
              fontSize: 28,
              background:
                "linear-gradient(135deg, #15151d 0%, #1c1c27 100%)",
            }}
          >
            {fallbackLabel ?? src}
          </div>
        ) : (
          <Img
            src={staticFile(src)}
            onError={() => setFailed(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition,
              transform: `scale(${scale})`,
              transformOrigin: `${focusX * 100}% ${focusY * 100}%`,
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};

/** Lower-third caption that rises + fades in. */
export const Caption: React.FC<{
  text: string;
  emphasis?: boolean;
  delay?: number;
}> = ({ text, emphasis = false, delay = 8 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - delay;
  const appear = interpolate(t, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });
  const rise = interpolate(appear, [0, 1], [26, 0]);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 104,
      }}
    >
      {/* Scrim keeps the caption legible over the screenshot window below it. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 320,
          background:
            "linear-gradient(to top, rgba(11,11,15,0.92) 0%, rgba(11,11,15,0.7) 45%, rgba(11,11,15,0) 100%)",
          opacity: appear,
        }}
      />
      <div
        style={{
          position: "relative",
          maxWidth: 1280,
          padding: "0 80px",
          opacity: appear,
          transform: `translateY(${rise}px)`,
          textAlign: "center",
        }}
      >
        {emphasis && (
          <div
            style={{
              display: "inline-block",
              marginBottom: 18,
              padding: "6px 16px",
              borderRadius: 999,
              background: "rgba(94,106,210,0.16)",
              border: `1px solid rgba(94,106,210,0.4)`,
              color: COLORS.accentSoft,
              fontFamily: FONT,
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            The differentiator
          </div>
        )}
        <div
          style={{
            fontFamily: FONT,
            fontSize: emphasis ? 52 : 44,
            fontWeight: emphasis ? 700 : 600,
            lineHeight: 1.25,
            color: emphasis ? COLORS.ink : COLORS.ink,
            textShadow: "0 2px 24px rgba(0,0,0,0.6)",
          }}
        >
          {text}
        </div>
      </div>
    </AbsoluteFill>
  );
};
