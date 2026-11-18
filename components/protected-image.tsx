"use client";

import Image, { type ImageProps } from "next/image";
import { preload } from "react-dom";
import type { DragEvent, MouseEvent } from "react";

type ProtectedImageProps = ImageProps & {
  wrapperClassName?: string;
  shieldClassName?: string;
  pictureSource?: { href: string; type: string; srcSet: string };
};

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function ProtectedImage({
  wrapperClassName,
  shieldClassName,
  pictureSource,
  priority,
  className,
  alt,
  onContextMenu,
  onDragStart,
  draggable,
  ...props
}: ProtectedImageProps) {
  const handleContextMenu = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    onContextMenu?.(event as never);
  };

  const handleDragStart = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    onDragStart?.(event as never);
  };

  if (priority && pictureSource) {
    preload(pictureSource.href, {
      as: "image",
      type: pictureSource.type,
      imageSrcSet: pictureSource.srcSet,
      imageSizes: props.sizes,
      fetchPriority: "high",
    });
  }
  const image = (
    <Image
      {...props}
      priority={priority && !pictureSource}
      loading={priority && pictureSource ? "eager" : props.loading}
      alt={alt}
      className={className}
      draggable={draggable ?? false}
      data-protect="true"
      onContextMenu={handleContextMenu as never}
      onDragStart={handleDragStart as never}
    />
  );

  return (
    <span
      className={joinClassNames("protected-media", wrapperClassName)}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      data-protect-wrap="true"
    >
      {pictureSource ? (
        <picture style={{ display: "contents" }}>
          <source type={pictureSource.type} srcSet={pictureSource.srcSet} sizes={props.sizes} />
          {image}
        </picture>
      ) : image}
      <span
        aria-hidden="true"
        className={joinClassNames("protected-media__shield", shieldClassName)}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
      />
    </span>
  );
}
