"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import type { ContactDetails } from "@/lib/data/types";
import { padNumber, type V3SearchIndex } from "@/lib/v3-helpers";
import { Bi, StatusPill } from "./v3-ui";

export type V3Lang = "zh" | "en";

export type LightboxState = {
  photos: string[];
  index: number;
  titleZh: string;
  titleEn: string;
} | null;

type InquirySeed = {
  slug?: string;
  requests?: string[];
};

type V3ContextValue = {
  lang: V3Lang;
  setLang: (l: V3Lang) => void;
  toast: (msg: string) => void;
  copyText: (text: string) => void;
  openCmd: () => void;
  openInquiry: (seed?: InquirySeed) => void;
  openLightbox: (photos: string[], index: number, titleZh: string, titleEn?: string) => void;
  setDarkHero: (dark: boolean) => void;
};

const V3Context = createContext<V3ContextValue | null>(null);

export function useV3() {
  const ctx = useContext(V3Context);
  if (!ctx) throw new Error("useV3 must be used within V3Shell");
  return ctx;
}

const NAV_ITEMS = [
  { key: "home", href: "/", zh: "首页", en: "Home" },
  { key: "collection", href: "/collection", zh: "藏品", en: "Collection" },
  { key: "exhibitions", href: "/exhibitions", zh: "展览与图录", en: "Exhibitions" },
  { key: "journal", href: "/journal", zh: "文章", en: "Journal" },
  { key: "about", href: "/about", zh: "关于", en: "About" },
  { key: "contact", href: "/contact", zh: "联系", en: "Contact" },
] as const;

function resolveRouteKind(pathname: string) {
  if (pathname === "/") return { nav: "home", page: "home" };
  if (pathname === "/collection" || pathname === "/collection-query") {
    return { nav: "collection", page: "collection" };
  }
  if (pathname.startsWith("/collection/")) return { nav: "collection", page: "work" };
  if (pathname === "/exhibitions") return { nav: "exhibitions", page: "exhibitions" };
  if (pathname.startsWith("/exhibitions/")) return { nav: "exhibitions", page: "exhibition" };
  if (pathname === "/journal") return { nav: "journal", page: "journal" };
  if (pathname.startsWith("/journal/")) return { nav: "journal", page: "article" };
  if (pathname.startsWith("/about")) return { nav: "about", page: "about" };
  if (pathname.startsWith("/contact")) return { nav: "contact", page: "contact" };
  return { nav: "home", page: "home" };
}

export function V3Shell({
  searchIndex,
  contact,
  children,
}: {
  searchIndex: V3SearchIndex;
  contact: ContactDetails;
  children: ReactNode;
}) {
  const pathname = usePathname() || "/";
  const { nav: activeNav, page: pageKind } = useMemo(() => resolveRouteKind(pathname), [pathname]);

  const [lang, setLangState] = useState<V3Lang>("zh");
  const [darkHero, setDarkHero] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [headerTucked, setHeaderTucked] = useState(false);
  const [headerLightInk, setHeaderLightInk] = useState(false);
  const [showFloatTop, setShowFloatTop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSlug, setDrawerSlug] = useState<string>("");
  const [drawerRequests, setDrawerRequests] = useState<string[]>([]);
  const [drawerName, setDrawerName] = useState("");
  const [drawerEmail, setDrawerEmail] = useState("");
  const [drawerMessage, setDrawerMessage] = useState("");
  const [drawerWebsite, setDrawerWebsite] = useState("");
  const [drawerOpenedAt, setDrawerOpenedAt] = useState<number>(0);
  const [drawerStatus, setDrawerStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [drawerError, setDrawerError] = useState("");
  const [lightbox, setLightbox] = useState<LightboxState>(null);
  const [lbScale, setLbScale] = useState(1);
  const [lbPan, setLbPan] = useState({ x: 0, y: 0 });
  const [lbTrackX, setLbTrackX] = useState(0);
  const [lbTrackAnimating, setLbTrackAnimating] = useState(false);
  const [lbGestureActive, setLbGestureActive] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const siteRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLElement>(null);
  const pillNavRef = useRef<HTMLElement>(null);
  const mercuryRef = useRef<HTMLDivElement>(null);
  const langSegRef = useRef<HTMLDivElement>(null);
  const langThumbRef = useRef<HTMLDivElement>(null);
  const cmdInputRef = useRef<HTMLInputElement>(null);
  const cursorTagRef = useRef<HTMLDivElement>(null);
  const cursorLabelRef = useRef<HTMLSpanElement>(null);
  const followBoxRef = useRef<HTMLDivElement>(null);
  const followImgRef = useRef<HTMLImageElement>(null);
  const toastTimerRef = useRef<number | null>(null);
  const lastYRef = useRef(0);
  const lbStageRef = useRef<HTMLDivElement>(null);
  const lbImgRef = useRef<HTMLImageElement>(null);
  const lbTapTimerRef = useRef<number | null>(null);
  const lbSlideTimerRef = useRef<number | null>(null);
  const lbSuppressClickRef = useRef(false);
  const lbScaleRef = useRef(1);
  const lbPanRef = useRef({ x: 0, y: 0 });
  const lbTouchRef = useRef<{
    mode: "idle" | "swipe" | "pan" | "pinch";
    startX: number;
    startY: number;
    lastX: number;
    lastTime: number;
    vx: number;
    panX: number;
    panY: number;
    pinchDist: number;
    pinchScale: number;
    pinchMidX: number;
    pinchMidY: number;
    moved: boolean;
  } | null>(null);

  // Hydrate persisted language preference safely on client
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("zhujinju:lang");
      if (saved === "en" || saved === "zh") setLangState(saved);
    } catch {
      // ignore storage errors
    }
  }, []);

  const setLang = useCallback((next: V3Lang) => {
    setLangState(next);
    document.documentElement.lang = next === "en" ? "en" : "zh-CN";
    try {
      window.localStorage.setItem("zhujinju:lang", next);
    } catch {
      // ignore
    }
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastOn(false), 1900);
  }, []);

  const copyText = useCallback(
    (text: string) => {
      navigator.clipboard?.writeText(text).catch(() => {});
      setCopiedKey(text);
      window.setTimeout(() => setCopiedKey((prev) => (prev === text ? null : prev)), 1500);
      toast(lang === "en" ? `Copied ${text}` : `已复制 ${text}`);
    },
    [lang, toast],
  );

  const openCmd = useCallback(() => {
    setCmdQuery("");
    setCmdOpen(true);
    window.setTimeout(() => cmdInputRef.current?.focus(), 40);
  }, []);

  const drawerArtwork = useMemo(
    () => (drawerSlug ? searchIndex.artworks.find((a) => a.slug === drawerSlug) ?? null : null),
    [drawerSlug, searchIndex.artworks],
  );

  const openInquiry = useCallback(
    (seed?: InquirySeed) => {
      const slug =
        seed?.slug !== undefined
          ? seed.slug
          : pathname.startsWith("/collection/")
            ? pathname.replace("/collection/", "").split("/")[0] || ""
            : "";
      const reqs = seed?.requests ?? [];
      setDrawerSlug(slug);
      setDrawerRequests(reqs);
      setDrawerStatus("idle");
      setDrawerError("");
      setDrawerOpenedAt(Date.now());
      const work = slug ? searchIndex.artworks.find((a) => a.slug === slug) : undefined;
      if (work) {
        if (lang === "en") {
          setDrawerMessage(
            reqs.length
              ? `I would like to inquire about "${work.title.en || work.title.zh}" and request: ${reqs.join(", ")}.`
              : `I would like to inquire about "${work.title.en || work.title.zh}".`,
          );
        } else {
          setDrawerMessage(
            reqs.length
              ? `您好，想了解「${work.title.zh}」，并索取：${reqs.join("、")}。`
              : `您好，想进一步了解「${work.title.zh}」。`,
          );
        }
      } else {
        setDrawerMessage("");
      }
      setDrawerOpen(true);
    },
    [lang, pathname, searchIndex.artworks],
  );

  const clampLbPan = useCallback((x: number, y: number, scale: number) => {
    if (scale <= 1.02) return { x: 0, y: 0 };
    const stage = lbStageRef.current?.getBoundingClientRect();
    const img = lbImgRef.current;
    const baseW = img ? img.offsetWidth : (stage?.width ?? window.innerWidth) * 0.85;
    const baseH = img ? img.offsetHeight : (stage?.height ?? window.innerHeight) * 0.85;
    const stageW = stage?.width ?? window.innerWidth;
    const stageH = stage?.height ?? window.innerHeight;
    const maxX = Math.max(0, (baseW * scale - stageW) / 2 + 24);
    const maxY = Math.max(0, (baseH * scale - stageH) / 2 + 24);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, []);

  const setLbTransform = useCallback((scale: number, pan: { x: number; y: number }) => {
    lbScaleRef.current = scale;
    lbPanRef.current = pan;
    setLbScale(scale);
    setLbPan(pan);
  }, []);

  const closeLightbox = useCallback(() => {
    if (lbTapTimerRef.current !== null) {
      window.clearTimeout(lbTapTimerRef.current);
      lbTapTimerRef.current = null;
    }
    if (lbSlideTimerRef.current !== null) {
      window.clearTimeout(lbSlideTimerRef.current);
      lbSlideTimerRef.current = null;
    }
    setLbGestureActive(false);
    setLbTrackAnimating(false);
    setLbTrackX(0);
    setLbTransform(1, { x: 0, y: 0 });
    setLightbox(null);
  }, [setLbTransform]);

  const animateSlideTo = useCallback(
    (delta: number) => {
      if (!lightbox || lightbox.photos.length <= 1) return;
      if (lbTapTimerRef.current !== null) {
        window.clearTimeout(lbTapTimerRef.current);
        lbTapTimerRef.current = null;
      }
      if (lbSlideTimerRef.current !== null) {
        window.clearTimeout(lbSlideTimerRef.current);
        lbSlideTimerRef.current = null;
      }
      const stride = (lbStageRef.current?.clientWidth || window.innerWidth) + 24;
      setLbTransform(1, { x: 0, y: 0 });
      setLbGestureActive(false);
      setLbTrackAnimating(true);
      setLbTrackX(delta > 0 ? -stride : stride);
      lbSlideTimerRef.current = window.setTimeout(() => {
        lbSlideTimerRef.current = null;
        setLbTrackAnimating(false);
        setLbTrackX(0);
        setLightbox((prev) =>
          prev && prev.photos.length > 1
            ? { ...prev, index: (prev.index + delta + prev.photos.length) % prev.photos.length }
            : prev,
        );
      }, 280);
    },
    [lightbox, setLbTransform],
  );

  const stepLightbox = useCallback(
    (delta: number) => {
      animateSlideTo(delta);
    },
    [animateSlideTo],
  );

  const openLightbox = useCallback(
    (photos: string[], index: number, titleZh: string, titleEn = "") => {
      if (lbTapTimerRef.current !== null) {
        window.clearTimeout(lbTapTimerRef.current);
        lbTapTimerRef.current = null;
      }
      if (lbSlideTimerRef.current !== null) {
        window.clearTimeout(lbSlideTimerRef.current);
        lbSlideTimerRef.current = null;
      }
      setLbGestureActive(false);
      setLbTrackAnimating(false);
      setLbTrackX(0);
      setLbTransform(1, { x: 0, y: 0 });
      setLightbox({ photos, index, titleZh, titleEn });
    },
    [setLbTransform],
  );

  // Lock background scroll & prevent Safari native pinch-zoom hijacking while lightbox is open
  useEffect(() => {
    if (!lightbox) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const stageEl = lbStageRef.current;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const stage = stageEl?.getBoundingClientRect();
      if (!stage) return;
      const prevScale = lbScaleRef.current;
      const nextScale = Math.max(1, Math.min(4, prevScale * Math.exp(-e.deltaY * 0.01)));
      const ux = e.clientX - (stage.left + stage.width / 2);
      const uy = e.clientY - (stage.top + stage.height / 2);
      const ratio = nextScale / prevScale;
      const rawX = ux - (ux - lbPanRef.current.x) * ratio;
      const rawY = uy - (uy - lbPanRef.current.y) * ratio;
      setLbTransform(nextScale, clampLbPan(rawX, rawY, nextScale));
    };

    const preventSafariGesture = (e: Event) => {
      e.preventDefault();
    };

    stageEl?.addEventListener("wheel", onWheel, { passive: false });
    stageEl?.addEventListener("gesturestart", preventSafariGesture, { passive: false });
    stageEl?.addEventListener("gesturechange", preventSafariGesture, { passive: false });

    return () => {
      document.body.style.overflow = prevOverflow;
      stageEl?.removeEventListener("wheel", onWheel);
      stageEl?.removeEventListener("gesturestart", preventSafariGesture);
      stageEl?.removeEventListener("gesturechange", preventSafariGesture);
      if (lbTapTimerRef.current !== null) {
        window.clearTimeout(lbTapTimerRef.current);
        lbTapTimerRef.current = null;
      }
      if (lbSlideTimerRef.current !== null) {
        window.clearTimeout(lbSlideTimerRef.current);
        lbSlideTimerRef.current = null;
      }
    };
  }, [lightbox, clampLbPan, setLbTransform]);

  // Sync sliding mercury indicator in header pill nav & language segmented pill
  const syncIndicators = useCallback(() => {
    const nav = pillNavRef.current;
    const ind = mercuryRef.current;
    if (nav && ind) {
      const active = nav.querySelector<HTMLElement>(".nav-item.is-active");
      if (active && active.offsetWidth > 0) {
        ind.style.width = `${active.offsetWidth}px`;
        ind.style.transform = `translate3d(${active.offsetLeft}px, 0, 0)`;
        ind.style.opacity = "1";
      }
    }
    const seg = langSegRef.current;
    const thumb = langThumbRef.current;
    if (seg && thumb) {
      const active = seg.querySelector<HTMLElement>(".seg-btn.is-active");
      if (active && active.offsetWidth > 0) {
        thumb.style.width = `${active.offsetWidth}px`;
        thumb.style.transform = `translate3d(${active.offsetLeft}px, 0, 0)`;
      }
    }
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(syncIndicators));
    window.addEventListener("resize", syncIndicators, { passive: true });
    document.fonts?.ready?.then(syncIndicators).catch(() => {});
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", syncIndicators);
    };
  }, [activeNav, lang, syncIndicators]);

  // Reset transient header state & close overlays on route change
  useEffect(() => {
    setMenuOpen(false);
    setCmdOpen(false);
    setHeaderTucked(false);
    setHeaderScrolled(window.scrollY > 24);
    lastYRef.current = window.scrollY;
    // Flagship exhibitions route starts over deep oxblood hero
    const isDarkRoute = pathname === "/exhibitions" || pathname === "/exhibitions/himalayan-art-2026";
    setDarkHero(isDarkRoute);
    if (followBoxRef.current) followBoxRef.current.classList.remove("is-on");
  }, [pathname]);

  // Unified scroll frame: header tuck, light-ink over dark hero, progress bar, parallax & float-top
  useEffect(() => {
    let ticking = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const update = () => {
      ticking = false;
      const y = window.scrollY;
      setHeaderScrolled(y > 24);
      if (!menuOpen) {
        if (y > 160 && y > lastYRef.current + 5) setHeaderTucked(true);
        else if (y < lastYRef.current - 5 || y <= 160) setHeaderTucked(false);
      }
      lastYRef.current = y;

      if (darkHero) {
        const hero = document.querySelector<HTMLElement>(".v3-ex-hero");
        setHeaderLightInk(y < (hero ? hero.offsetHeight - 70 : 420));
      } else {
        setHeaderLightInk(false);
      }

      const ft = footerRef.current;
      const nearFooter = Boolean(ft && ft.getBoundingClientRect().top < window.innerHeight - 16);
      setShowFloatTop(y > window.innerHeight * 1.35 && !nearFooter);

      if (progressRef.current) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progressRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max).toFixed(4) : 0})`;
      }

      if (!reduce) {
        const vh = window.innerHeight;
        document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
          const parent = el.parentElement;
          if (!parent) return;
          const r = parent.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) return;
          const f = parseFloat(el.dataset.parallax || "0.08");
          const off = (r.top + r.height / 2 - vh / 2) * -f;
          el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
        });
      }
    };

    const req = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", req, { passive: true });
    return () => {
      window.removeEventListener("scroll", req);
      window.removeEventListener("resize", req);
    };
  }, [darkHero, menuOpen, pathname]);

  // Global trailing micro-tag cursor + uncropped hover preview + keyboard shortcuts
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const host = siteRef.current;

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openCmd();
        return;
      }
      if (lightbox) {
        if (e.key === "Escape") closeLightbox();
        else if (e.key === "ArrowRight") stepLightbox(1);
        else if (e.key === "ArrowLeft") stepLightbox(-1);
        return;
      }
      if (e.key === "Escape") {
        setCmdOpen(false);
        setDrawerOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);

    if (!fine || reduce || !host) {
      return () => window.removeEventListener("keydown", onKeyDown);
    }

    let cx = -120;
    let cy = -120;
    let tx = -120;
    let ty = -120;
    let fx = -300;
    let fy = -300;
    let lastX = 0;
    let raf = 0;
    let activeCursor = "";
    let followOn = false;

    const tick = () => {
      cx += (tx - cx) * 0.24;
      cy += (ty - cy) * 0.24;
      if (cursorTagRef.current) {
        cursorTagRef.current.style.transform = `translate3d(${(cx + 14).toFixed(1)}px, ${(cy + 14).toFixed(1)}px, 0)`;
      }
      if (followOn && followBoxRef.current) {
        fx += (tx + 26 - fx) * 0.14;
        fy += (ty - 104 - fy) * 0.14;
        const clampedX = Math.min(window.innerWidth - 196, Math.max(12, fx));
        const clampedY = Math.min(window.innerHeight - 230, Math.max(76, fy));
        const tilt = Math.max(-4.5, Math.min(4.5, (tx - lastX) * 0.22));
        followBoxRef.current.style.transform = `translate3d(${clampedX.toFixed(1)}px, ${clampedY.toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg)`;
        lastX = tx;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onPointerMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const cEl = target?.closest<HTMLElement>("[data-cursor]");
      const mode = cEl?.dataset.cursor || "";
      if (mode !== activeCursor) {
        activeCursor = mode;
        host.classList.toggle("cursor-mode-view", mode === "view");
        host.classList.toggle("cursor-mode-drag", mode === "drag");
        if (cursorLabelRef.current) {
          cursorLabelRef.current.textContent =
            mode === "drag"
              ? lang === "en"
                ? "Drag"
                : "拖动"
              : mode === "view"
                ? lang === "en"
                  ? "View"
                  : "细赏"
                : "";
        }
      }

      const fEl = target?.closest<HTMLElement>("[data-follow]");
      if (fEl?.dataset.follow && followImgRef.current && followBoxRef.current) {
        if (followImgRef.current.getAttribute("src") !== fEl.dataset.follow) {
          followImgRef.current.src = fEl.dataset.follow;
        }
        followOn = true;
        followBoxRef.current.classList.add("is-on");
      } else if (!target?.closest("[data-follow]") && followOn && followBoxRef.current) {
        followOn = false;
        followBoxRef.current.classList.remove("is-on");
      }
    };
    const onMouseLeave = () => {
      activeCursor = "";
      host.classList.remove("cursor-mode-view", "cursor-mode-drag");
      followOn = false;
      followBoxRef.current?.classList.remove("is-on");
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseleave", onMouseLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [lang, lightbox, openCmd, closeLightbox, stepLightbox]);

  // Search filtering for ⌘K modal
  const cmdResults = useMemo(() => {
    const q = cmdQuery.trim().toLowerCase();
    const works = searchIndex.artworks.filter((a) => {
      if (!q) return true;
      if (q === "可洽询" || q === "available") return a.status !== "sold";
      return [
        a.title.zh,
        a.title.en,
        a.region.zh,
        a.region.en,
        a.period.zh,
        a.period.en,
        a.material.zh,
        a.material.en,
        a.category.zh,
        a.category.en,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    const arts = q
      ? searchIndex.articles
          .filter((a) => `${a.title.zh} ${a.title.en}`.toLowerCase().includes(q))
          .slice(0, 3)
      : [];
    return { works, arts };
  }, [cmdQuery, searchIndex]);

  const quickTags = useMemo(
    () =>
      lang === "en"
        ? ["Gandhara", "Gilt", "14th century", "Thangka", "Western Tibet", "Nepal", "Available"]
        : ["犍陀罗", "鎏金", "14世纪", "唐卡", "西藏西部", "尼泊尔", "可洽询"],
    [lang],
  );

  // Real POST /api/inquiry submission from Concierge Drawer
  const handleDrawerSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (drawerStatus === "busy") return;
    setDrawerError("");
    if (!drawerName.trim() || !drawerEmail.trim() || !drawerMessage.trim()) {
      setDrawerError(
        lang === "en"
          ? "Please provide your name, email address, and inquiry note."
          : "请填写您的称谓、邮箱与洽询内容。",
      );
      setDrawerStatus("error");
      return;
    }
    setDrawerStatus("busy");
    try {
      const elapsed = Date.now() - drawerOpenedAt;
      if (elapsed < 3100) {
        await new Promise((r) => window.setTimeout(r, 3100 - elapsed));
      }
      const reqSuffix =
        drawerRequests.length &&
        !drawerMessage.includes(drawerRequests[0])
          ? `\n\n[需要资料 / Requested: ${drawerRequests.join("、")}]`
          : "";
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: drawerName.trim(),
          email: drawerEmail.trim(),
          message: `${drawerMessage.trim()}${reqSuffix}`,
          artwork: drawerArtwork
            ? `${drawerArtwork.title.zh} / ${drawerArtwork.title.en}`
            : "",
          work: drawerArtwork && drawerArtwork.status !== "sold" ? drawerArtwork.slug : "",
          request: "",
          website: drawerWebsite,
          submittedAt: String(drawerOpenedAt || Date.now() - 4000),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setDrawerError(
          data.error ||
            (lang === "en"
              ? "Submission could not be completed. Please email contact@zhujinju.com directly."
              : "提交暂未成功，请稍后再试，或直接发送邮件至 contact@zhujinju.com。"),
        );
        setDrawerStatus("error");
        return;
      }
      setDrawerStatus("done");
      toast(lang === "en" ? "Inquiry received" : "洽询已发送");
    } catch {
      setDrawerError(
        lang === "en"
          ? "Network error. Please email contact@zhujinju.com directly."
          : "网络连接异常，请稍后再试，或直接发送邮件至 contact@zhujinju.com。",
      );
      setDrawerStatus("error");
    }
  };

  const ctxValue = useMemo<V3ContextValue>(
    () => ({
      lang,
      setLang,
      toast,
      copyText,
      openCmd,
      openInquiry,
      openLightbox,
      setDarkHero,
    }),
    [lang, setLang, toast, copyText, openCmd, openInquiry, openLightbox],
  );

  return (
    <V3Context.Provider value={ctxValue}>
      <div
        ref={siteRef}
        className={`v3-site lang-${lang}${darkHero ? " page-dark" : ""}${menuOpen ? " menu-open" : ""}`}
        data-page={pageKind}
      >
        {/* Scroll Progress Bar */}
        <div className="scroll-progress" aria-hidden="true">
          <i ref={progressRef} />
        </div>

        {/* Trailing Micro-Tag Cursor (pointer: fine only) */}
        <div ref={cursorTagRef} className="cursor-tag" aria-hidden="true">
          <i className="cursor-dot" />
          <span ref={cursorLabelRef} className="cursor-label" />
        </div>

        {/* Uncropped Hover Preview Card */}
        <div ref={followBoxRef} className="follow-img" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={followImgRef} alt="" />
        </div>

        {/* Global Floating Glass Header */}
        <header
          ref={headerRef}
          id="site-header"
          className={`site-header${headerScrolled ? " is-scrolled" : ""}${headerTucked ? " is-tucked" : ""}${headerLightInk ? " is-light-ink" : ""}`}
        >
          <div className="header-inner">
            <Link href="/" className="brand-link" aria-label="竹瑾居首页">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="brand-logo brand-logo-dark"
                src="/zhujinju-header-ink.png"
                alt="竹瑾居"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="brand-logo brand-logo-light"
                src="/zhujinju-header-cream.png"
                alt=""
              />
            </Link>

            <nav ref={pillNavRef} className="pill-nav" aria-label="主导航">
              <div ref={mercuryRef} className="mercury-indicator" aria-hidden="true" />
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`nav-item${activeNav === item.key ? " is-active" : ""}`}
                  data-nav={item.key}
                >
                  <span className="t-zh">{item.zh}</span>
                  <span className="t-en" lang="en">
                    {item.en}
                  </span>
                </Link>
              ))}
            </nav>

            <div className="header-tools">
              <button
                type="button"
                id="open-cmd-btn"
                className="cmd-trigger"
                aria-label="检索作品与文章"
                onClick={openCmd}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.8-3.8" />
                </svg>
                <span className="cmd-trigger-text">
                  <span className="t-zh">检索</span>
                  <span className="t-en">Search</span>
                </span>
                <kbd className="cmd-kbd">⌘K</kbd>
              </button>

              <div
                ref={langSegRef}
                className="segmented-mini"
                role="group"
                aria-label="语言切换"
              >
                <div ref={langThumbRef} className="seg-thumb" aria-hidden="true" />
                <button
                  type="button"
                  className={`seg-btn${lang === "zh" ? " is-active" : ""}`}
                  onClick={() => setLang("zh")}
                >
                  中
                </button>
                <button
                  type="button"
                  className={`seg-btn${lang === "en" ? " is-active" : ""}`}
                  onClick={() => setLang("en")}
                >
                  EN
                </button>
              </div>

              <button
                type="button"
                id="open-inquiry-top"
                className="header-inquire-btn"
                onClick={() => openInquiry()}
              >
                <i className="dot-spark" aria-hidden="true" />
                <span className="t-zh">洽询</span>
                <span className="t-en">Inquire</span>
              </button>

              <button
                type="button"
                id="mobile-menu-btn"
                className="mobile-menu-btn"
                aria-label="打开菜单"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                <span className="burger" aria-hidden="true">
                  <i />
                  <i />
                </span>
                <span className="t-zh">菜单</span>
                <span className="t-en">Menu</span>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Full-Screen Menu */}
        <div
          id="mobile-menu"
          className={`mobile-menu v3-menu${menuOpen ? " is-open" : ""}`}
          aria-hidden={!menuOpen}
        >
          <div className="mobile-menu-head">
            <span className="micro-label">ZHU JIN JU · CHENGDU</span>
            <button
              type="button"
              className="modal-close"
              aria-label="关闭菜单"
              onClick={() => setMenuOpen(false)}
            >
              ✕
            </button>
          </div>
          <nav className="mobile-menu-links" aria-label="移动端导航">
            {NAV_ITEMS.map((item, idx) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMenuOpen(false)}
              >
                <span className="m-num">{padNumber(idx + 1)}</span>
                <span className="t-zh">{item.zh}</span>
                <span className="t-en" lang="en">
                  {item.en}
                </span>
              </Link>
            ))}
          </nav>
          <p className="mobile-menu-foot">
            <span className="t-zh">成都市青羊区草堂东路 88 号 · 预约制</span>
            <span className="t-en" lang="en">
              No. 88 Caotang East Rd, Chengdu · By Appointment
            </span>
          </p>
        </div>

        {/* Main Page Content */}
        <main id="app-root" className="app-root" tabIndex={-1}>
          {children}
        </main>

        {/* Monograph Obsidian Footer */}
        <footer ref={footerRef} className="site-footer v3-footer">
          <div className="container v3-footer-top">
            <div className="v3-footer-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="v3-footer-logo"
                src="/zhujinju-header-cream.png"
                alt="竹瑾居"
              />
              <p className="v3-footer-note">
                <span className="t-zh">
                  专注喜马拉雅与亚洲古代艺术的研究、展览、出版与收藏交流。
                </span>
                <span className="t-en" lang="en">
                  Himalayan and Asian antiquities — research, annual exhibitions, monographs and
                  private collecting.
                </span>
              </p>
              <Link href="/contact" className="v3-footer-link">
                <i className="dot-spark" aria-hidden="true" />
                <span className="t-zh">与竹瑾居联系</span>
                <span className="t-en" lang="en">
                  Contact Zhu Jin Ju
                </span>
                <span className="v3-footer-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
            <div className="v3-footer-cols">
              <div>
                <p className="footer-heading">
                  <span className="t-zh">浏览</span>
                  <span className="t-en">Explore</span>
                </p>
                <ul className="footer-links">
                  <li>
                    <Link href="/collection">
                      <span className="t-zh">藏品浏览</span>
                      <span className="t-en">Collection</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/exhibitions">
                      <span className="t-zh">展览与图录</span>
                      <span className="t-en">Exhibitions</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/journal">
                      <span className="t-zh">文章与动态</span>
                      <span className="t-en">Journal</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/about">
                      <span className="t-zh">关于竹瑾居</span>
                      <span className="t-en">About</span>
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="footer-heading">
                  <span className="t-zh">联络</span>
                  <span className="t-en">Contact</span>
                </p>
                <ul className="footer-links">
                  <li>
                    <button
                      type="button"
                      className={copiedKey === contact.email ? "is-copied" : undefined}
                      onClick={() => copyText(contact.email)}
                    >
                      {contact.email}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={copiedKey === contact.wechat ? "is-copied" : undefined}
                      onClick={() => copyText(contact.wechat)}
                    >
                      <span className="t-zh">微信</span>
                      <span className="t-en">WeChat</span> · {contact.wechat}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={copiedKey === contact.phone ? "is-copied" : undefined}
                      onClick={() => copyText(contact.phone)}
                    >
                      {contact.phone}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className={copiedKey === contact.instagram ? "is-copied" : undefined}
                      onClick={() => copyText(contact.instagram)}
                    >
                      Instagram · {contact.instagram}
                    </button>
                  </li>
                </ul>
              </div>
              <div className="v3-footer-space">
                <p className="footer-heading">
                  <span className="t-zh">空间</span>
                  <span className="t-en">Gallery</span>
                </p>
                <ul className="footer-links">
                  <li>
                    <span className="t-zh">竹瑾居艺术空间</span>
                    <span className="t-en" lang="en">
                      Zhu Jin Ju Gallery, Chengdu
                    </span>
                  </li>
                  <li>
                    <span className="t-zh">成都市青羊区草堂东路 88 号</span>
                    <span className="t-en" lang="en">
                      No. 88 Caotang East Road, Chengdu
                    </span>
                  </li>
                  <li>
                    <span className="t-zh">成都会面采用预约制</span>
                    <span className="t-en" lang="en">
                      By Appointment in Chengdu
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="container footer-bottom">
            <span>© 2026 ZHU JIN JU</span>
            <span>
              <span className="t-zh">竹瑾居艺术空间 · 成都</span>
              <span className="t-en" lang="en">
                Zhu Jin Ju Gallery, Chengdu
              </span>
            </span>
            <button
              type="button"
              className="v3-top"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <span className="t-zh">回到顶部 ↑</span>
              <span className="t-en">Back to top ↑</span>
            </button>
          </div>
        </footer>

        {/* ⌘K Instant Search Modal */}
        <div
          id="cmd-backdrop"
          className={`modal-backdrop${cmdOpen ? " is-open" : ""}`}
          aria-hidden={!cmdOpen}
          onClick={(e) => {
            if (e.target === e.currentTarget) setCmdOpen(false);
          }}
        >
          <div className="cmd-panel" role="dialog" aria-modal="true" aria-label="站内检索">
            <div className="cmd-head">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.8-3.8" />
              </svg>
              <input
                ref={cmdInputRef}
                type="search"
                className="cmd-input"
                placeholder={
                  lang === "en"
                    ? "Title, period, region, material…"
                    : "作品名、年代、地区、材质…"
                }
                autoComplete="off"
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
              />
              <button
                type="button"
                className="modal-close"
                aria-label="关闭检索"
                onClick={() => setCmdOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="cmd-quick-tags">
              {quickTags.map((tag) => (
                <button key={tag} type="button" onClick={() => setCmdQuery(tag)}>
                  {tag}
                </button>
              ))}
            </div>
            <div className="cmd-results">
              {cmdResults.works.length || cmdResults.arts.length ? (
                <>
                  {cmdResults.works.slice(0, 7).map((a) => (
                    <Link
                      key={a.slug}
                      className="cmd-result-item"
                      href={`/collection/${a.slug}`}
                      onClick={() => setCmdOpen(false)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="cmd-result-thumb" src={a.card} alt="" />
                      <div>
                        <b>
                          <Bi text={a.title} />
                        </b>
                        <small>
                          <Bi
                            text={{
                              zh: [a.region.zh, a.period.zh, a.material.zh]
                                .filter(Boolean)
                                .join(" · "),
                              en: [a.region.en, a.period.en, a.material.en]
                                .filter(Boolean)
                                .join(" · "),
                            }}
                          />
                        </small>
                      </div>
                      <StatusPill status={a.status} />
                    </Link>
                  ))}
                  {cmdResults.arts.map((a) => (
                    <Link
                      key={a.slug}
                      className="cmd-result-item"
                      href={`/journal/${a.slug}`}
                      onClick={() => setCmdOpen(false)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="cmd-result-thumb" src={a.cover} alt="" />
                      <div>
                        <b>
                          <Bi text={a.title} />
                        </b>
                        <small>
                          <Bi text={a.category} />
                        </small>
                      </div>
                      <span className="micro-label">ARTICLE</span>
                    </Link>
                  ))}
                  {cmdResults.works.length > 7 ? (
                    <Link
                      className="cmd-all"
                      href="/collection"
                      onClick={() => setCmdOpen(false)}
                    >
                      <span className="t-zh">查看全部 {cmdResults.works.length} 件结果</span>
                      <span className="t-en">See all {cmdResults.works.length} works</span> →
                    </Link>
                  ) : null}
                </>
              ) : (
                <p className="cmd-empty">
                  <span className="t-zh">没有找到相关作品</span>
                  <span className="t-en">No matching works found</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Private Viewing Concierge Drawer (Wired to Real POST /api/inquiry) */}
        <div
          id="inquiry-backdrop"
          className={`modal-backdrop modal-backdrop-drawer${drawerOpen ? " is-open" : ""}`}
          aria-hidden={!drawerOpen}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDrawerOpen(false);
          }}
        >
          <aside className="inquiry-drawer" role="dialog" aria-modal="true" aria-label="作品洽询与预约">
            <div className="drawer-head">
              <div>
                <p className="micro-label drawer-eyebrow">
                  <i className="dot-spark" aria-hidden="true" />
                  PRIVATE INQUIRY · 私人洽询
                </p>
                <h2 className="drawer-title">
                  <span className="t-zh">作品洽询与预约</span>
                  <span className="t-en" lang="en">
                    Inquire &amp; Viewing
                  </span>
                </h2>
              </div>
              <button
                type="button"
                className="modal-close"
                aria-label="关闭洽询"
                onClick={() => setDrawerOpen(false)}
              >
                ✕
              </button>
            </div>
            <p className="drawer-sub">
              <span className="t-zh">
                请留下您的联络方式与意向，研究与收藏顾问通常于 24 小时内回复。
              </span>
              <span className="t-en" lang="en">
                Leave your contact details and note. Our research &amp; advisory team typically
                responds within 24 hours.
              </span>
            </p>

            {drawerArtwork ? (
              <div className="drawer-artwork">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={drawerArtwork.card} alt="" />
                <div>
                  <p className="micro-label">SELECTED WORK</p>
                  <b>
                    <Bi text={drawerArtwork.title} />
                  </b>
                  <small>
                    <Bi
                      text={{
                        zh: [
                          drawerArtwork.region.zh,
                          drawerArtwork.period.zh,
                          drawerArtwork.dimensions.zh,
                        ]
                          .filter(Boolean)
                          .join(" · "),
                        en: [
                          drawerArtwork.region.en,
                          drawerArtwork.period.en,
                          drawerArtwork.dimensions.en,
                        ]
                          .filter(Boolean)
                          .join(" · "),
                      }}
                    />
                  </small>
                </div>
              </div>
            ) : null}

            <form className="drawer-form v3-form" onSubmit={handleDrawerSubmit}>
              <input
                type="text"
                name="website"
                value={drawerWebsite}
                onChange={(e) => setDrawerWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
              />
              <label className="float-field">
                <input
                  type="text"
                  required
                  placeholder=" "
                  value={drawerName}
                  onChange={(e) => setDrawerName(e.target.value)}
                />
                <span>
                  <span className="t-zh">称谓</span>
                  <span className="t-en">Name</span>
                </span>
              </label>
              <label className="float-field">
                <input
                  type="email"
                  required
                  placeholder=" "
                  value={drawerEmail}
                  onChange={(e) => setDrawerEmail(e.target.value)}
                />
                <span>
                  <span className="t-zh">邮箱</span>
                  <span className="t-en">Email</span>
                </span>
              </label>
              <label className="float-field">
                <textarea
                  rows={4}
                  required
                  placeholder=" "
                  value={drawerMessage}
                  onChange={(e) => setDrawerMessage(e.target.value)}
                />
                <span>
                  <span className="t-zh">洽询内容</span>
                  <span className="t-en">Message</span>
                </span>
              </label>

              <button
                type="submit"
                className={`v3-btn v3-btn-dark v3-btn-block v3-btn-submit${drawerStatus === "busy" ? " is-busy" : ""}${drawerStatus === "done" ? " is-done" : ""}`}
                disabled={drawerStatus === "busy"}
              >
                <span className="v3-btn-text sb-idle">
                  <span className="t-zh">发送洽询</span>
                  <span className="t-en">Send inquiry</span>
                  <i aria-hidden="true">→</i>
                </span>
                <span className="sb-busy" aria-hidden="true">
                  <span className="spinner" />
                </span>
                <span className="sb-done">
                  ✓ <span className="t-zh">已发送</span>
                  <span className="t-en">Sent</span>
                </span>
              </button>

              {drawerStatus === "done" ? (
                <p className="drawer-feedback" role="status">
                  <span className="t-zh">已收到您的洽询，竹瑾居将在 24 小时内与您联络。</span>
                  <span className="t-en" lang="en">
                    Inquiry received. Zhu Jin Ju will respond within 24 hours.
                  </span>
                </p>
              ) : null}
              {drawerStatus === "error" && drawerError ? (
                <p className="drawer-error" role="alert">
                  {drawerError}
                </p>
              ) : null}
            </form>

            <div className="drawer-direct">
              <p className="micro-label">
                <span className="t-zh">直接联络</span>
                <span className="t-en">Direct desk</span>
              </p>
              <div className="drawer-direct-links">
                <button
                  type="button"
                  className={`drawer-copy-chip${copiedKey === contact.wechat ? " is-copied" : ""}`}
                  onClick={() => copyText(contact.wechat)}
                >
                  <span>
                    <span className="t-zh">微信</span>
                    <span className="t-en">WeChat</span> · {contact.wechat}
                  </span>
                  <em>
                    {copiedKey === contact.wechat ? (
                      <>
                        <span className="t-zh">已复制</span>
                        <span className="t-en">Copied</span>
                      </>
                    ) : (
                      <>
                        <span className="t-zh">复制</span>
                        <span className="t-en">Copy</span>
                      </>
                    )}
                  </em>
                </button>
                <button
                  type="button"
                  className={`drawer-copy-chip${copiedKey === contact.email ? " is-copied" : ""}`}
                  onClick={() => copyText(contact.email)}
                >
                  <span>{contact.email}</span>
                  <em>
                    {copiedKey === contact.email ? (
                      <>
                        <span className="t-zh">已复制</span>
                        <span className="t-en">Copied</span>
                      </>
                    ) : (
                      <>
                        <span className="t-zh">复制</span>
                        <span className="t-en">Copy</span>
                      </>
                    )}
                  </em>
                </button>
              </div>
              <p className="drawer-direct-addr">
                <span className="t-zh">竹瑾居艺术空间 · 成都市青羊区草堂东路 88 号（预约制）</span>
                <span className="t-en" lang="en">
                  Zhu Jin Ju Gallery, Chengdu · No. 88 Caotang East Road (By Appointment)
                </span>
              </p>
            </div>
          </aside>
        </div>

        {/* Full-Screen High-Res Lightbox (Silky 1:1 Carousel + Two-Finger Pinch Zoom) */}
        <div
          id="lightbox"
          className={`lightbox${lightbox ? " is-open" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="全屏作品大图"
          aria-hidden={!lightbox}
        >
          <div className="lightbox-top">
            <div className="lightbox-title-group">
              <span className="lightbox-meta">
                {lightbox ? (
                  <Bi text={{ zh: lightbox.titleZh, en: lightbox.titleEn || lightbox.titleZh }} />
                ) : null}
              </span>
              {lightbox ? (
                <span className="lightbox-count">
                  {padNumber(lightbox.index + 1)} / {padNumber(lightbox.photos.length)}
                </span>
              ) : null}
            </div>
            <div className="lightbox-controls">
              <button
                type="button"
                className={`lightbox-pill${lbScale > 1.05 ? " is-on" : ""}`}
                onClick={() => {
                  setLbGestureActive(false);
                  if (lbScaleRef.current > 1.05) {
                    setLbTransform(1, { x: 0, y: 0 });
                  } else {
                    setLbTransform(2.25, { x: 0, y: 0 });
                  }
                }}
              >
                {lbScale > 1.05 ? (
                  <>
                    <span className="t-zh">还原</span>
                    <span className="t-en">Fit</span>
                  </>
                ) : (
                  <>
                    <span className="t-zh">放大</span>
                    <span className="t-en">Zoom</span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="lightbox-close-btn"
                aria-label="关闭大图"
                onClick={closeLightbox}
              >
                <span className="t-zh">关闭</span>
                <span className="t-en">Close</span>
                <i aria-hidden="true">✕</i>
              </button>
            </div>
          </div>

          <div
            ref={lbStageRef}
            className={`lightbox-stage${lbScale > 1.05 ? " is-zoomed" : ""}`}
            onTouchStart={(e) => {
              if (!lightbox) return;
              if (lbSlideTimerRef.current !== null) return;
              if (e.touches.length === 2) {
                if (lbTapTimerRef.current !== null) {
                  window.clearTimeout(lbTapTimerRef.current);
                  lbTapTimerRef.current = null;
                }
                const [t1, t2] = [e.touches[0], e.touches[1]];
                const dist = Math.max(10, Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY));
                const stage = lbStageRef.current?.getBoundingClientRect();
                const cx = stage ? stage.left + stage.width / 2 : window.innerWidth / 2;
                const cy = stage ? stage.top + stage.height / 2 : window.innerHeight / 2;
                setLbTrackAnimating(false);
                setLbTrackX(0);
                setLbGestureActive(true);
                lbTouchRef.current = {
                  mode: "pinch",
                  startX: (t1.clientX + t2.clientX) / 2,
                  startY: (t1.clientY + t2.clientY) / 2,
                  lastX: (t1.clientX + t2.clientX) / 2,
                  lastTime: performance.now(),
                  vx: 0,
                  panX: lbPanRef.current.x,
                  panY: lbPanRef.current.y,
                  pinchDist: dist,
                  pinchScale: lbScaleRef.current,
                  pinchMidX: (t1.clientX + t2.clientX) / 2 - cx,
                  pinchMidY: (t1.clientY + t2.clientY) / 2 - cy,
                  moved: true,
                };
              } else if (e.touches.length === 1) {
                const t = e.touches[0];
                setLbTrackAnimating(false);
                lbTouchRef.current = {
                  mode: lbScaleRef.current > 1.05 ? "pan" : "idle",
                  startX: t.clientX,
                  startY: t.clientY,
                  lastX: t.clientX,
                  lastTime: performance.now(),
                  vx: 0,
                  panX: lbPanRef.current.x,
                  panY: lbPanRef.current.y,
                  pinchDist: 0,
                  pinchScale: lbScaleRef.current,
                  pinchMidX: 0,
                  pinchMidY: 0,
                  moved: false,
                };
              }
            }}
            onTouchMove={(e) => {
              const st = lbTouchRef.current;
              if (!st || !lightbox) return;

              if (e.touches.length === 2) {
                const [t1, t2] = [e.touches[0], e.touches[1]];
                const dist = Math.max(10, Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY));
                const stage = lbStageRef.current?.getBoundingClientRect();
                const cx = stage ? stage.left + stage.width / 2 : window.innerWidth / 2;
                const cy = stage ? stage.top + stage.height / 2 : window.innerHeight / 2;
                const midX = (t1.clientX + t2.clientX) / 2 - cx;
                const midY = (t1.clientY + t2.clientY) / 2 - cy;

                if (st.mode !== "pinch") {
                  st.mode = "pinch";
                  st.moved = true;
                  st.pinchDist = dist;
                  st.pinchScale = lbScaleRef.current;
                  st.panX = lbPanRef.current.x;
                  st.panY = lbPanRef.current.y;
                  st.pinchMidX = midX;
                  st.pinchMidY = midY;
                  setLbTrackX(0);
                  setLbGestureActive(true);
                  return;
                }

                const nextScale = Math.max(0.82, Math.min(4.5, st.pinchScale * (dist / st.pinchDist)));
                const ratio = nextScale / st.pinchScale;
                const nextX = midX - (st.pinchMidX - st.panX) * ratio;
                const nextY = midY - (st.pinchMidY - st.panY) * ratio;
                setLbTransform(nextScale, { x: nextX, y: nextY });
                return;
              }

              if (e.touches.length === 1) {
                const t = e.touches[0];
                const dx = t.clientX - st.startX;
                const dy = t.clientY - st.startY;
                if (Math.hypot(dx, dy) > 6) st.moved = true;
                if (!st.moved) return;

                if (st.mode === "pan" || lbScaleRef.current > 1.05) {
                  setLbGestureActive(true);
                  const clamped = clampLbPan(st.panX + dx, st.panY + dy, lbScaleRef.current);
                  setLbTransform(lbScaleRef.current, clamped);
                  return;
                }

                if (st.mode === "idle") {
                  if (lightbox.photos.length > 1 && Math.abs(dx) >= Math.abs(dy) * 0.9) {
                    st.mode = "swipe";
                    setLbGestureActive(true);
                  } else {
                    return;
                  }
                }

                if (st.mode === "swipe") {
                  const now = performance.now();
                  const dt = Math.max(1, now - st.lastTime);
                  st.vx = (t.clientX - st.lastX) / dt;
                  st.lastX = t.clientX;
                  st.lastTime = now;
                  const maxDrag = (lbStageRef.current?.clientWidth || window.innerWidth) * 0.98;
                  setLbTrackX(Math.max(-maxDrag, Math.min(maxDrag, dx)));
                }
              }
            }}
            onTouchEnd={(e) => {
              const st = lbTouchRef.current;
              if (!st || !lightbox) return;

              // Hand off seamlessly from 2-finger pinch to 1-finger pan when 1 finger stays down
              if (e.touches.length === 1 && st.mode === "pinch") {
                const t = e.touches[0];
                st.mode = "pan";
                st.startX = t.clientX;
                st.startY = t.clientY;
                st.panX = lbPanRef.current.x;
                st.panY = lbPanRef.current.y;
                st.moved = true;
                return;
              }

              lbTouchRef.current = null;

              if (st.moved) {
                lbSuppressClickRef.current = true;
                window.setTimeout(() => {
                  lbSuppressClickRef.current = false;
                }, 360);
              }

              if (st.mode === "pinch" || st.mode === "pan") {
                setLbGestureActive(false);
                const s = lbScaleRef.current;
                if (s < 1.08) {
                  setLbTransform(1, { x: 0, y: 0 });
                } else {
                  const clampedScale = Math.min(4, s);
                  const clampedPan = clampLbPan(lbPanRef.current.x, lbPanRef.current.y, clampedScale);
                  setLbTransform(clampedScale, clampedPan);
                }
                return;
              }

              if (st.mode === "swipe") {
                const t = e.changedTouches[0];
                const dx = t ? t.clientX - st.startX : 0;
                const stageW = lbStageRef.current?.clientWidth || window.innerWidth;
                const shouldAdvance =
                  Math.abs(dx) > Math.min(82, stageW * 0.18) ||
                  (Math.abs(dx) > 22 && Math.abs(st.vx) > 0.28);
                if (shouldAdvance && lightbox.photos.length > 1) {
                  animateSlideTo(dx < 0 ? 1 : -1);
                } else {
                  setLbGestureActive(false);
                  setLbTrackAnimating(true);
                  setLbTrackX(0);
                  window.setTimeout(() => setLbTrackAnimating(false), 260);
                }
              }
            }}
            onTouchCancel={() => {
              lbTouchRef.current = null;
              setLbGestureActive(false);
              setLbTrackAnimating(true);
              setLbTrackX(0);
              if (lbScaleRef.current < 1.08) {
                setLbTransform(1, { x: 0, y: 0 });
              }
            }}
            onClick={(e) => {
              if (!lightbox) return;
              if (lbSuppressClickRef.current) return;
              const clickX = e.clientX;
              const clickY = e.clientY;
              if (lbTapTimerRef.current !== null) {
                window.clearTimeout(lbTapTimerRef.current);
                lbTapTimerRef.current = null;
                setLbGestureActive(false);
                if (lbScaleRef.current <= 1.05) {
                  const stage = lbStageRef.current?.getBoundingClientRect();
                  const nextScale = 2.25;
                  if (stage) {
                    const ux = clickX - (stage.left + stage.width / 2);
                    const uy = clickY - (stage.top + stage.height / 2);
                    const pan = clampLbPan(-ux * (nextScale - 1), -uy * (nextScale - 1), nextScale);
                    setLbTransform(nextScale, pan);
                  } else {
                    setLbTransform(nextScale, { x: 0, y: 0 });
                  }
                } else {
                  setLbTransform(1, { x: 0, y: 0 });
                }
              } else {
                lbTapTimerRef.current = window.setTimeout(() => {
                  lbTapTimerRef.current = null;
                  closeLightbox();
                }, 230);
              }
            }}
          >
            {lightbox && lightbox.photos.length > 1 ? (
              <button
                type="button"
                className="lightbox-nav lightbox-prev"
                aria-label="上一张"
                onClick={(e) => {
                  e.stopPropagation();
                  stepLightbox(-1);
                }}
              >
                ←
              </button>
            ) : null}

            {lightbox ? (
              lightbox.photos.length > 1 ? (
                <div
                  className={`lightbox-track${lbTrackAnimating ? " is-animating" : ""}`}
                  style={{
                    transform: `translate3d(calc(-100% - 24px + ${lbTrackX.toFixed(1)}px), 0, 0)`,
                  }}
                >
                  <div className="lightbox-slide">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="lightbox-img"
                      src={
                        lightbox.photos[
                          (lightbox.index - 1 + lightbox.photos.length) % lightbox.photos.length
                        ]
                      }
                      alt=""
                      draggable={false}
                    />
                  </div>
                  <div className="lightbox-slide">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={lbImgRef}
                      className={`lightbox-img${lbScale > 1.05 ? " is-zoomed" : ""}${lbGestureActive ? " is-gesturing" : ""}`}
                      src={lightbox.photos[lightbox.index]}
                      alt={lightbox.titleZh}
                      draggable={false}
                      style={{
                        transform: `translate3d(${lbPan.x.toFixed(1)}px, ${lbPan.y.toFixed(1)}px, 0) scale(${lbScale.toFixed(3)})`,
                      }}
                    />
                  </div>
                  <div className="lightbox-slide">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="lightbox-img"
                      src={lightbox.photos[(lightbox.index + 1) % lightbox.photos.length]}
                      alt=""
                      draggable={false}
                    />
                  </div>
                </div>
              ) : (
                <div className="lightbox-slide">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={lbImgRef}
                    className={`lightbox-img${lbScale > 1.05 ? " is-zoomed" : ""}${lbGestureActive ? " is-gesturing" : ""}`}
                    src={lightbox.photos[lightbox.index]}
                    alt={lightbox.titleZh}
                    draggable={false}
                    style={{
                      transform: `translate3d(${lbPan.x.toFixed(1)}px, ${lbPan.y.toFixed(1)}px, 0) scale(${lbScale.toFixed(3)})`,
                    }}
                  />
                </div>
              )
            ) : null}

            {lightbox && lightbox.photos.length > 1 ? (
              <button
                type="button"
                className="lightbox-nav lightbox-next"
                aria-label="下一张"
                onClick={(e) => {
                  e.stopPropagation();
                  stepLightbox(1);
                }}
              >
                →
              </button>
            ) : null}
          </div>

          <div className="lightbox-foot">
            {lightbox && lightbox.photos.length > 1 ? (
              <div className="lightbox-dots" role="group" aria-label="图版切换">
                {lightbox.photos.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`lightbox-dot${idx === lightbox.index ? " is-active" : ""}`}
                    aria-label={`第 ${idx + 1} 张`}
                    aria-current={idx === lightbox.index ? "true" : undefined}
                    onClick={() => {
                      setLbGestureActive(false);
                      setLbTrackAnimating(false);
                      setLbTrackX(0);
                      setLbTransform(1, { x: 0, y: 0 });
                      setLightbox((prev) => (prev ? { ...prev, index: idx } : null));
                    }}
                  />
                ))}
              </div>
            ) : null}
            <p className="lightbox-hint micro-label">
              {lightbox && lightbox.photos.length > 1 ? (
                <>
                  <span className="t-zh">双指缩放 / 双击放大 · 左右滑动切换 · 单击关闭</span>
                  <span className="t-en" lang="en">
                    Pinch or double-tap to zoom · Swipe to browse · Tap to close
                  </span>
                </>
              ) : (
                <>
                  <span className="t-zh">双指缩放 / 双击放大 · 单击关闭</span>
                  <span className="t-en" lang="en">
                    Pinch or double-tap to zoom · Tap to close
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Quiet Frosted Back-to-Top Capsule (auto-hides near footer) */}
        <button
          type="button"
          id="float-top"
          className={`v3-float-top${showFloatTop ? " is-on" : ""}`}
          aria-label="回到顶部"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          ↑
        </button>

        {/* Subtle Toast */}
        <div
          id="toast"
          className={`v3-toast${toastOn ? " is-on" : ""}`}
          role="status"
          aria-live="polite"
        >
          {toastMsg}
        </div>
      </div>
    </V3Context.Provider>
  );
}
