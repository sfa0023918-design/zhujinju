export const COVER_VAJRA_SLUG = "artwork-1790510831618";
export const COVER_VAJRA_IMAGE = "/uploads/artworks/five-pronged-vajra-cover-cutout-2026.png";
export const COVER_VAJRA_BACKDROP = "#9d4433";

// The embedded cover image includes an unrelated mark beside the very bottom of the object.
// Clip only that empty lower corner; all of the vajra remains visible.
export const COVER_VAJRA_CLIP = "polygon(0 0, 100% 0, 100% 90%, 55% 90%, 55% 100%, 40% 100%, 40% 90%, 0 90%)";

// The detail photos remain the original full-resolution images. These transparent
// cutouts provide only their silhouettes, so the metalwork retains its original pixels.
export const COVER_VAJRA_DETAIL_MASKS: Record<string, string> = {
  "/uploads/artworks/1790510915753-five-pronged-vajra-detail-1.jpg": "/uploads/artworks/five-pronged-vajra-detail-1-mask-2026.png",
  "/uploads/artworks/1790510963122-five-pronged-vajra-detail-2.jpg": "/uploads/artworks/five-pronged-vajra-detail-2-mask-2026.png",
  "/uploads/artworks/1790511004791-five-pronged-vajra-detail-3.jpg": "/uploads/artworks/five-pronged-vajra-detail-3-mask-2026.png",
};
