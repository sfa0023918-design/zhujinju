import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site-config";

export const alt = siteConfig.siteName;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#f4f0e8",
          color: "#171512",
          padding: "64px",
          flexDirection: "column",
          justifyContent: "space-between",
          border: "1px solid rgba(23,21,18,0.12)",
        }}
      >
        <div
          style={{
            fontSize: 24,
            letterSpacing: "0.28em",
            color: "#85715a",
          }}
        >
          竹瑾居
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 920 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 84,
              lineHeight: 1,
              letterSpacing: "-0.05em",
            }}
          >
            喜马拉雅艺术与
            <br />
            亚洲古代艺术
          </div>
          <div style={{ fontSize: 30, lineHeight: 1.6, color: "#5b554d" }}>
            收藏、研究、展览与图录
          </div>
        </div>
      </div>
    ),
    size,
  );
}
