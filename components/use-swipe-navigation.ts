"use client";

import { useEffect, useRef, useState, type PointerEvent, type MouseEvent } from "react";
import { swipeDirection } from "@/lib/swipe-gesture";

type Gesture = {
  id: number;
  x: number;
  y: number;
  time: number;
  axis: "pending" | "x" | "y";
};

/** Native vertical scrolling and pinch zoom remain available on pan-y surfaces. */
export function useSwipeNavigation<T extends HTMLElement>({
  enabled = true,
  onPrevious,
  onNext,
  ignoreControls = true,
}: {
  enabled?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  ignoreControls?: boolean;
}) {
  const ref = useRef<T>(null);
  const gesture = useRef<Gesture | null>(null);
  const suppressClickUntil = useRef(0);
  const frame = useRef(0);
  const settling = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [interacting, setInteracting] = useState(false);

  useEffect(() => () => {
    cancelAnimationFrame(frame.current);
    if (settling.current) clearTimeout(settling.current);
  }, []);

  function reset() {
    cancelAnimationFrame(frame.current);
    ref.current?.style.setProperty("--swipe-offset", "0px");
    ref.current?.removeAttribute("data-swiping");
    gesture.current = null;
    setInteracting(false);
  }

  function onPointerDown(event: PointerEvent<T>) {
    if (!enabled || event.pointerType === "mouse") return;
    if (!event.isPrimary) {
      reset();
      return;
    }
    const target = event.target as Element;
    if (target.closest("[data-no-swipe]") || (ignoreControls && target.closest("button, input, select, textarea"))) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now(), axis: "pending" };
    setInteracting(true);
  }

  function onPointerMove(event: PointerEvent<T>) {
    const initial = gesture.current;
    if (!initial || event.pointerId !== initial.id) return;
    const dx = event.clientX - initial.x;
    const dy = event.clientY - initial.y;
    if (initial.axis === "pending" && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
      if (Math.abs(dy) > Math.abs(dx)) initial.axis = "y";
      else if (Math.abs(dx) > Math.abs(dy) * 1.2) {
        initial.axis = "x";
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.setAttribute("data-swiping", "true");
      }
    }
    if (initial.axis !== "x") return;
    event.preventDefault();
    suppressClickUntil.current = performance.now() + 450;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      ref.current?.style.setProperty("--swipe-offset", `${Math.max(-80, Math.min(80, dx * 0.38))}px`);
    });
  }

  function onPointerUp(event: PointerEvent<T>) {
    const initial = gesture.current;
    if (!initial || event.pointerId !== initial.id) return;
    const direction = initial.axis !== "y"
      ? swipeDirection(event.clientX - initial.x, event.clientY - initial.y, performance.now() - initial.time, event.currentTarget.clientWidth)
      : 0;
    if (initial.axis === "x" || direction) suppressClickUntil.current = performance.now() + 450;
    if (direction) {
      ref.current?.setAttribute("data-swipe-settling", "true");
      if (settling.current) clearTimeout(settling.current);
      settling.current = setTimeout(() => ref.current?.removeAttribute("data-swipe-settling"), 400);
      if (direction === 1) onNext();
      else onPrevious();
    }
    reset();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function onClickCapture(event: MouseEvent<T>) {
    if (event.detail > 0 && performance.now() < suppressClickUntil.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  return {
    interacting,
    bindings: { ref, onPointerDown, onPointerMove, onPointerUp, onPointerCancel: reset, onLostPointerCapture: (event: PointerEvent<T>) => {
      // Touch initially captures the image child. Transferring capture to this
      // surface also bubbles a lost event from that child; the swipe is ongoing.
      if (event.target === event.currentTarget) reset();
    }, onClickCapture },
  };
}
