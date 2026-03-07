import { ImageResponse } from "next/og";

import { formatMetadataText } from "@/lib/bilingual";
import { siteConfig } from "@/lib/site-config";

export const alt = formatMetadataText(siteConfig.siteName);
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
            display: "flex",
            flexDirection: "column",
            gap: 6,
            color: "#85715a",
          }}
        >
          <div
            style={{
              fontSize: 24,
              letterSpacing: "0.28em",
            }}
          >
            竹瑾居
          </div>
          <div
            style={{
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: "0.24em",
            }}
          >
            Zhu Jin Ju
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 920 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
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
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.2,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#85715a",
              }}
            >
              Himalayan Art and Asian Antiquities
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, color: "#5b554d" }}>
            <div style={{ fontSize: 30, lineHeight: 1.6 }}>收藏、研究、展览与图录</div>
            <div style={{ fontSize: 18, lineHeight: 1.6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Collecting, Research, Exhibitions, and Catalogues
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
