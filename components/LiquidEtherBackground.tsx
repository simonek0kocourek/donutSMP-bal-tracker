"use client";

import dynamic from "next/dynamic";

const LiquidEther = dynamic(() => import("./LiquidEther"), {
  ssr: false,
  loading: () => <div style={{ position: "absolute", inset: 0, background: "#0a0a0f" }} />,
});

export interface LiquidEtherBackgroundProps {
  colors?: string[];
}

export default function LiquidEtherBackground({
  colors = ["#5227FF", "#FF9FFC", "#B497CF"],
}: LiquidEtherBackgroundProps) {
  return (
    <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <LiquidEther
        colors={colors}
        mouseForce={20}
        cursorSize={100}
        isViscous
        viscous={30}
        iterationsViscous={32}
        iterationsPoisson={32}
        resolution={0.5}
        isBounce={false}
        autoDemo
        autoSpeed={0.5}
        autoIntensity={2.2}
        takeoverDuration={0.25}
        autoResumeDelay={3000}
        autoRampDuration={0.6}
        color0={colors[0]}
        color1={colors[1]}
        color2={colors[2]}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    </div>
  );
}
