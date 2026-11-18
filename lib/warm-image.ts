import { getImageProps } from "next/image";
import { preload } from "react-dom";

export function warmImage(src: string, width: number, height: number, sizes: string, quality: number) {
  if (!src || src.startsWith("/api/placeholder/")) return;
  const { props } = getImageProps({ src, width, height, sizes, quality, alt: "" });
  preload(props.src, {
    as: "image",
    imageSrcSet: props.srcSet,
    imageSizes: props.sizes,
    fetchPriority: "high",
  });
}
