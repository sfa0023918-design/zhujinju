export const COVER_VAJRA_SLUG = "artwork-1790510831618";
export const COVER_VAJRA_IMAGE =
  "/uploads/artworks/five-pronged-vajra-cover-cutout-2026.png";
export const COVER_VAJRA_BACKDROP = "#9d4432";

// The embedded cover image includes an unrelated mark beside the very bottom of the object.
// Clip only that empty lower corner; all of the vajra remains visible.
export const COVER_VAJRA_CLIP =
  "polygon(0 0, 100% 0, 100% 90%, 55% 90%, 55% 100%, 40% 100%, 40% 90%, 0 90%)";

// The detail photos remain the original full-resolution images. These transparent
// masks retain the original silhouettes with identical alpha, without the unused
// photo RGB data. The metalwork still comes from the original photographs.
export const COVER_VAJRA_DETAIL_MASKS: Record<string, string> = {
  "/uploads/artworks/1790510915753-five-pronged-vajra-detail-1.jpg":
    "/uploads/artworks/five-pronged-vajra-detail-1-alpha-mask-20261117.png",
  "/uploads/artworks/1790510963122-five-pronged-vajra-detail-2.jpg":
    "/uploads/artworks/five-pronged-vajra-detail-2-alpha-mask-20261117.png",
  "/uploads/artworks/1790511004791-five-pronged-vajra-detail-3.jpg":
    "/uploads/artworks/five-pronged-vajra-detail-3-alpha-mask-20261117.png",
};

// Approved white-background cutouts only; preserve all other photograph colors.
export const PAPER_BLEND_ARTWORK_SLUGS = ["artwork-1790497697947"] as const;
