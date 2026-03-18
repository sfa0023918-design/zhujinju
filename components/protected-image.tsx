"use client";

import Image, { type ImageProps } from "next/image";
import type { DragEvent, MouseEvent } from "react";

import { isUploadsPath } from "@/lib/media-path";

type ProtectedImageProps = ImageProps & {
  wrapperClassName?: string;
  shieldClassName?: string;
};

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function ProtectedImage({
  wrapperClassName,
  shieldClassName,
  className,
  alt,
  unoptimized,
  onContextMenu,
  onDragStart,
  draggable,
  ...props
}: ProtectedImageProps) {
  const shouldBypassOptimizer =
    typeof props.src === "string" ? isUploadsPath(props.src) : false;
  const resolvedUnoptimized = unoptimized || shouldBypassOptimizer;

  const handleContextMenu = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    onContextMenu?.(event as never);
  };

  const handleDragStart = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    onDragStart?.(event as never);
  };

  return (
    <span
      className={joinClassNames("protected-media", wrapperClassName)}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      data-protect-wrap="true"
    >
      <Image
        {...props}
        alt={alt}
        className={className}
        unoptimized={resolvedUnoptimized}
        draggable={draggable ?? false}
        data-protect="true"
        onContextMenu={handleContextMenu as never}
        onDragStart={handleDragStart as never}
      />
      <span
        aria-hidden="true"
        className={joinClassNames("protected-media__shield", shieldClassName)}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
      />
    </span>
  );
}
