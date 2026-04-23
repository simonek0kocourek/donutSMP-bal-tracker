"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

type GridScanProps = {
  sensitivity?: number;
  lineThickness?: number;
  linesColor?: string;
  gridScale?: number;
  scanColor?: string;
  scanOpacity?: number;
  enablePost?: boolean;
  bloomIntensity?: number;
  chromaticAberration?: number;
  noiseIntensity?: number;
};

const GridScan = dynamic(
  () => import("./GridScan") as unknown as Promise<{ default: ComponentType<GridScanProps> }>,
  {
    ssr: false,
    loading: () => <div style={{ position: "absolute", inset: 0, background: "#0a0a0f" }} />,
  }
);

export default function GridScanBackground() {
  return (
    <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <GridScan
        sensitivity={0.55}
        lineThickness={1}
        linesColor="#2F293A"
        gridScale={0.1}
        scanColor="#FF9FFC"
        scanOpacity={0.4}
        enablePost
        bloomIntensity={0.6}
        chromaticAberration={0.002}
        noiseIntensity={0.01}
      />
    </div>
  );
}
