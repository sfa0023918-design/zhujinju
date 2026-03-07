import { NextRequest } from "next/server";

const palettes = [
  {
    base: "#eee6da",
    panel: "#d8c8b4",
    line: "#5f5547",
    accent: "#8e7b62",
  },
  {
    base: "#ebe3d8",
    panel: "#cdbba6",
    line: "#4f4a44",
    accent: "#746450",
  },
  {
    base: "#f1ece3",
    panel: "#d1c0ae",
    line: "#5d5348",
    accent: "#8b7558",
  },
  {
    base: "#ece7dd",
    panel: "#c6b8a4",
    line: "#544b40",
    accent: "#786553",
  },
];

function getHash(input: string) {
  return input.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function createArtworkSvg(slug: string, width: number, height: number) {
  const palette = palettes[getHash(slug) % palettes.length];
  const isLandscape = width > height;
  const midX = width / 2;
  const midY = height / 2;
  const silhouetteWidth = isLandscape ? width * 0.16 : width * 0.26;
  const silhouetteHeight = isLandscape ? height * 0.54 : height * 0.5;
  const baseY = midY + silhouetteHeight / 2;
  const haloRadius = isLandscape ? width * 0.13 : width * 0.18;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" fill="none">
      <rect width="${width}" height="${height}" fill="${palette.base}" />
      <rect x="${width * 0.04}" y="${height * 0.04}" width="${width * 0.92}" height="${height * 0.92}" stroke="${palette.line}" stroke-opacity="0.18" />
      <rect x="${width * 0.12}" y="${height * 0.12}" width="${width * 0.76}" height="${height * 0.76}" fill="${palette.base}" stroke="${palette.line}" stroke-opacity="0.08" />
      <circle cx="${midX}" cy="${midY * 0.86}" r="${haloRadius}" fill="${palette.panel}" fill-opacity="0.42" />
      <rect x="${midX - silhouetteWidth * 0.62}" y="${baseY}" width="${silhouetteWidth * 1.24}" height="${height * 0.05}" rx="${height * 0.01}" fill="${palette.accent}" fill-opacity="0.52" />
      <path d="M ${midX} ${midY - silhouetteHeight * 0.56} C ${midX - silhouetteWidth * 0.18} ${midY - silhouetteHeight * 0.47}, ${midX - silhouetteWidth * 0.2} ${midY - silhouetteHeight * 0.28}, ${midX} ${midY - silhouetteHeight * 0.18} C ${midX + silhouetteWidth * 0.2} ${midY - silhouetteHeight * 0.28}, ${midX + silhouetteWidth * 0.18} ${midY - silhouetteHeight * 0.47}, ${midX} ${midY - silhouetteHeight * 0.56} Z" fill="${palette.panel}" />
      <path d="M ${midX - silhouetteWidth * 0.22} ${midY - silhouetteHeight * 0.12} C ${midX - silhouetteWidth * 0.18} ${midY - silhouetteHeight * 0.32}, ${midX + silhouetteWidth * 0.18} ${midY - silhouetteHeight * 0.32}, ${midX + silhouetteWidth * 0.22} ${midY - silhouetteHeight * 0.12} L ${midX + silhouetteWidth * 0.34} ${midY + silhouetteHeight * 0.28} C ${midX + silhouetteWidth * 0.2} ${midY + silhouetteHeight * 0.52}, ${midX - silhouetteWidth * 0.2} ${midY + silhouetteHeight * 0.52}, ${midX - silhouetteWidth * 0.34} ${midY + silhouetteHeight * 0.28} Z" fill="${palette.line}" fill-opacity="0.82" />
      <path d="M ${midX - silhouetteWidth * 0.44} ${midY + silhouetteHeight * 0.36} C ${midX - silhouetteWidth * 0.18} ${midY + silhouetteHeight * 0.56}, ${midX + silhouetteWidth * 0.18} ${midY + silhouetteHeight * 0.56}, ${midX + silhouetteWidth * 0.44} ${midY + silhouetteHeight * 0.36}" stroke="${palette.line}" stroke-opacity="0.34" stroke-width="${isLandscape ? 4 : 3}" stroke-linecap="round" />
      <path d="M ${width * 0.16} ${height * 0.82} L ${width * 0.84} ${height * 0.82}" stroke="${palette.line}" stroke-opacity="0.16" stroke-width="1.5" />
      <text x="${width * 0.14}" y="${height * 0.18}" font-size="${isLandscape ? 18 : 16}" fill="${palette.accent}" fill-opacity="0.72" letter-spacing="4">ZHU JIN JU</text>
    </svg>
  `;
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      slug: string;
    }>;
  },
) {
  const { slug } = await context.params;
  const kind = request.nextUrl.searchParams.get("kind");
  const width = kind === "landscape" ? 1600 : 1200;
  const height = kind === "landscape" ? 1000 : 1500;
  const svg = createArtworkSvg(slug, width, height);

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
