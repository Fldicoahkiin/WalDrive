import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Series,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Caption, Screenshot, SceneFade } from "./components";
import { COLORS, FONT, FONT_MONO } from "./theme";

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

// Scene durations (seconds) — total ~46s.
const D = {
  title: 5,
  grid: 7,
  preview: 7,
  verify: 9,
  browse: 7,
  mcp: 6,
  outro: 5,
} as const;

const BgGlow: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.bg }}>
    <div
      style={{
        position: "absolute",
        top: "-20%",
        left: "50%",
        width: 1400,
        height: 1400,
        transform: "translateX(-50%)",
        background:
          "radial-gradient(circle, rgba(94,106,210,0.18) 0%, rgba(94,106,210,0) 60%)",
        filter: "blur(20px)",
      }}
    />
  </AbsoluteFill>
);

const TitleScene: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 200 } });
  const sub = interpolate(frame, [12, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });
  const tag = interpolate(frame, [24, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });

  return (
    <SceneFade durationInFrames={durationInFrames}>
      <BgGlow />
      <AbsoluteFill
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 132,
              fontWeight: 800,
              letterSpacing: -2,
              color: COLORS.ink,
              transform: `scale(${0.9 + pop * 0.1})`,
              opacity: pop,
            }}
          >
            Wal<span style={{ color: COLORS.accent }}>Drive</span>
          </div>
          <div
            style={{
              marginTop: 20,
              fontFamily: FONT,
              fontSize: 40,
              fontWeight: 500,
              color: COLORS.inkSubtle,
              opacity: sub,
            }}
          >
            Verifiable file storage on Walrus
          </div>
          <div
            style={{
              marginTop: 36,
              fontFamily: FONT_MONO,
              fontSize: 22,
              color: COLORS.inkTertiary,
              opacity: tag,
            }}
          >
            Sui Overflow 2026 · Walrus track
          </div>
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

const ShotScene: React.FC<{
  durationInFrames: number;
  src: string;
  caption: string;
  emphasis?: boolean;
  fallbackLabel?: string;
  focusX?: number;
  focusY?: number;
  fromScale?: number;
  toScale?: number;
  objectPosition?: string;
}> = ({ durationInFrames, src, caption, emphasis, fallbackLabel, ...rest }) => (
  <SceneFade durationInFrames={durationInFrames}>
    <BgGlow />
    <Screenshot
      src={src}
      durationInFrames={durationInFrames}
      fallbackLabel={fallbackLabel}
      {...rest}
    />
    <Caption text={caption} emphasis={emphasis} />
  </SceneFade>
);

const McpScene: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const line1 = interpolate(frame, [10, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });
  const line2 = interpolate(frame, [30, 54], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });

  return (
    <SceneFade durationInFrames={durationInFrames}>
      <BgGlow />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 28,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 56,
            fontWeight: 700,
            color: COLORS.ink,
            opacity: line1,
            transform: `translateY(${interpolate(line1, [0, 1], [20, 0])}px)`,
          }}
        >
          Agents write via{" "}
          <span style={{ color: COLORS.accent }}>MCP</span>
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 40,
            fontWeight: 500,
            color: COLORS.inkSubtle,
            opacity: line2,
            transform: `translateY(${interpolate(line2, [0, 1], [20, 0])}px)`,
          }}
        >
          You browse, verify, and share here.
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

const OutroScene: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 200 } });
  const repo = interpolate(frame, [14, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });

  return (
    <SceneFade durationInFrames={durationInFrames}>
      <BgGlow />
      <AbsoluteFill
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 104,
              fontWeight: 800,
              letterSpacing: -1.5,
              color: COLORS.ink,
              opacity: pop,
              transform: `scale(${0.92 + pop * 0.08})`,
            }}
          >
            Wal<span style={{ color: COLORS.accent }}>Drive</span>
          </div>
          <div
            style={{
              marginTop: 28,
              fontFamily: FONT_MONO,
              fontSize: 30,
              color: COLORS.accentSoft,
              opacity: repo,
            }}
          >
            github.com/Fldicoahkiin/WalDrive
          </div>
          <div
            style={{
              marginTop: 16,
              fontFamily: FONT_MONO,
              fontSize: 22,
              color: COLORS.inkTertiary,
              opacity: repo,
            }}
          >
            Walrus track · Sui Overflow 2026
          </div>
        </div>
      </AbsoluteFill>
    </SceneFade>
  );
};

export const WalDriveDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <Series>
        <Series.Sequence durationInFrames={s(D.title)}>
          <TitleScene durationInFrames={s(D.title)} />
        </Series.Sequence>

        <Series.Sequence durationInFrames={s(D.grid)}>
          <ShotScene
            durationInFrames={s(D.grid)}
            src="01-grid.png"
            fallbackLabel="01-grid.png"
            caption="Drag a file in — bytes land on Walrus, metadata on Sui. No backend."
          />
        </Series.Sequence>

        <Series.Sequence durationInFrames={s(D.preview)}>
          <ShotScene
            durationInFrames={s(D.preview)}
            src="02-preview.png"
            fallbackLabel="02-preview.png"
            caption="Instant preview, read straight from the Walrus aggregator."
          />
        </Series.Sequence>

        <Series.Sequence durationInFrames={s(D.verify)}>
          <ShotScene
            durationInFrames={s(D.verify)}
            src="02-preview.png"
            fallbackLabel="02-preview.png (verify)"
            caption="Verify it live — real bytes, content-addressed. Re-fetched & SHA-256'd on screen."
            emphasis
            focusX={0.62}
            focusY={0.78}
            fromScale={1.28}
            toScale={1.42}
            objectPosition="center bottom"
          />
        </Series.Sequence>

        <Series.Sequence durationInFrames={s(D.browse)}>
          <BrowseScene durationInFrames={s(D.browse)} />
        </Series.Sequence>

        <Series.Sequence durationInFrames={s(D.mcp)}>
          <McpScene durationInFrames={s(D.mcp)} />
        </Series.Sequence>

        <Series.Sequence durationInFrames={s(D.outro)}>
          <OutroScene durationInFrames={s(D.outro)} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

/** Scene 5: cross-fade between the search view and the folder view. */
const BrowseScene: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const half = durationInFrames / 2;
  const swap = interpolate(frame, [half - 12, half + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  });

  return (
    <SceneFade durationInFrames={durationInFrames}>
      <BgGlow />
      <AbsoluteFill style={{ opacity: 1 - swap }}>
        <Screenshot
          src="03-search.png"
          durationInFrames={durationInFrames}
          fallbackLabel="03-search.png"
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: swap }}>
        <Screenshot
          src="04-folder.png"
          durationInFrames={durationInFrames}
          fallbackLabel="04-folder.png"
        />
      </AbsoluteFill>
      <Caption text="Search, folders, tags, versions, trash — a real drive on Walrus." />
    </SceneFade>
  );
};

export const DEMO_DURATION_IN_FRAMES =
  s(D.title) +
  s(D.grid) +
  s(D.preview) +
  s(D.verify) +
  s(D.browse) +
  s(D.mcp) +
  s(D.outro);
