"use client";

import dynamic from "next/dynamic";

const Silk = dynamic(() => import("./Silk"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#0a0a0f]" />,
});

export interface SilkBackgroundProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
}

export default function SilkBackground({
  speed = 5,
  scale = 1,
  color = "#7B7481",
  noiseIntensity = 1.5,
  rotation = 0,
}: SilkBackgroundProps) {
  return (
    <Silk
      speed={speed}
      scale={scale}
      color={color}
      noiseIntensity={noiseIntensity}
      rotation={rotation}
    />
  );
}
