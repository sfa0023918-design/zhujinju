"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { BilingualText } from "@/lib/site-data";
import { artworkDisplayPhoto } from "@/lib/artwork-display-photo";
import { COVER_VAJRA_CLIP, COVER_VAJRA_IMAGE } from "@/lib/artwork-presentation";
import { withImageVersion } from "@/lib/image-url";
import { ModalDialog } from "./modal-dialog";
import { ProtectedImage } from "./protected-image";
import styles from "./navigation-preview.module.css";

export type NavigationPreview = {
  title: BilingualText;
  facts: BilingualText;
  source: string;
  width: number;
  height: number;
  sizes: string;
  thumbnail?: string;
  exhibition?: boolean;
};

type OpenPreview = (href: string, preview: NavigationPreview) => void;
const PreviewContext = createContext<OpenPreview | null>(null);

const PreviewPending = createContext(false);

export function useNavigationPending() {
  return useContext(PreviewPending);
}

export function useNavigationPreview() {
  return useContext(PreviewContext);
}

export function NavigationPreviewProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [selection, setSelection] = useState<{ origin: string; preview: NavigationPreview } | null>(null);
  const [pending, startTransition] = useTransition();

  const open = useCallback<OpenPreview>((href, preview) => {
    setSelection({ origin: pathname, preview });
    startTransition(() => router.push(href));
  }, [pathname, router]);

  const preview = pending && selection?.origin === pathname ? selection.preview : null;

  function cancel() {
    setSelection(null);
    router.replace(window.location.pathname + window.location.search + window.location.hash, { scroll: false });
  }

  return (
    <PreviewContext.Provider value={open}>
      <PreviewPending.Provider value={Boolean(preview)}>{children}</PreviewPending.Provider>
      {preview ? (
        <ModalDialog className={styles.dialog} label={preview.title.zh || preview.title.en} onDismiss={cancel}>
          <section className={styles.sheet} data-navigation-preview={preview.exhibition ? "exhibition" : "artwork"}>
            <div className={styles.copy}>
              <button type="button" onClick={cancel} className={styles.back}>← 返回 <span lang="en">Back</span></button>
              <h2>{preview.title.zh}</h2>
              <p lang="en">{preview.title.en}</p>
              <div className={styles.facts}>{preview.facts.zh}<br /><span lang="en">{preview.facts.en}</span></div>
            </div>
            <div className={styles.photo}>
              {preview.source ? (
                <ProtectedImage src={withImageVersion(preview.source)} alt={preview.title.zh}
                  width={preview.width} height={preview.height} sizes={preview.sizes} quality={85}
                  pictureSource={artworkDisplayPhoto(preview.source)} priority fetchPriority="high"
                  style={{
                    clipPath: preview.source === COVER_VAJRA_IMAGE ? COVER_VAJRA_CLIP : undefined,
                    backgroundImage: preview.thumbnail ? `url(${JSON.stringify(preview.thumbnail)})` : undefined,
                  }}
                />
              ) : null}
            </div>
          </section>
        </ModalDialog>
      ) : null}
    </PreviewContext.Provider>
  );
}
