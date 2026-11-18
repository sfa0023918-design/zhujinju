"use client";

import Image, { getImageProps, type ImageProps } from "next/image";
import { preload } from "react-dom";
import { useState, type DragEvent, type MouseEvent } from "react";

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
  pictureSource: preferredSource,
  priority,
  className,
  alt,
  onContextMenu,
  onError,
  onDragStart,
  draggable,
  ...props
}: ProtectedImageProps) {
  const [failedSource, setFailedSource] = useState<string>();
  const pictureSource = preferredSource?.href === failedSource ? undefined : preferredSource;
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
  // WebKit can start a detached img's srcset while React inserts a picture
  // during navigation. Keep both real candidates in source elements so only
  // the selected format uses the network, including before hydration.
  const fallback = pictureSource ? getImageProps({ ...props, alt }).props : undefined;
  const image = (
    <Image
      {...props}
      unoptimized={pictureSource ? true : props.unoptimized}
      overrideSrc={pictureSource ? "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" : props.overrideSrc}
      priority={priority && !pictureSource}
      loading={priority && pictureSource ? "eager" : props.loading}
      alt={alt}
      className={className}
      draggable={draggable ?? false}
      data-protect="true"
      onError={pictureSource ? () => setFailedSource(pictureSource.href) : onError}
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
      {pictureSource && fallback ? (
        <picture style={{ display: "contents" }}>
          <source type={pictureSource.type} srcSet={pictureSource.srcSet} sizes={props.sizes} />
          <source srcSet={fallback.srcSet ?? fallback.src} sizes={fallback.sizes} />
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
