"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Native modal behavior keeps background controls out of the focus order. */
export function ModalDialog({
  children,
  className,
  label,
  id,
  onDismiss,
}: {
  children: ReactNode;
  className: string;
  label: string;
  id?: string;
  onDismiss: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected && trigger.getClientRects().length) {
        trigger.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <dialog
      ref={ref}
      id={id}
      className={className}
      aria-label={label}
      onCancel={(event) => { event.preventDefault(); onDismiss(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onDismiss(); }}
    >
      {children}
    </dialog>
  );
}
