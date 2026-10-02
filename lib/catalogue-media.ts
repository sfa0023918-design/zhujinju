import assetManifest from "./catalogue-reader-assets.json";

export type CataloguePageGeometry = {
  width: number;
  height: number;
  spread: boolean;
  openingSide?: "right";
};
type CatalogueAsset = CataloguePageGeometry & { reader: string; thumb: string };
const assets: Record<string, CatalogueAsset> = assetManifest as Record<string, CatalogueAsset>;

export function catalogueImageVariant(source: string, variant: "reader" | "thumb") {
  return assets[source]?.[variant] ?? source;
}

export function cataloguePageGeometry(source: string, spread: boolean): CataloguePageGeometry {
  return assets[source] ?? { width: spread ? 4000 : 2000, height: 2358, spread };
}
