"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./artwork-detail.module.css";

type Section = { id: string; label: { zh: string; en: string } };

export function ArtworkSectionNav({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  const navRef = useRef<HTMLElement>(null);
  const manualUntil = useRef(0);
  const ids = sections.map((section) => section.id).join(" ");

  useEffect(() => {
    const targets = ids.split(" ").flatMap((id) => {
      const element = document.getElementById(id);
      return element ? [element] : [];
    });
    let frame = 0;
    const update = () => {
      if (performance.now() < manualUntil.current) return;
      const offset = (navRef.current?.offsetHeight ?? 60) + 36;
      const passed = targets.filter((target) => target.getBoundingClientRect().top <= offset);
      const current = passed.at(-1) ?? targets[0];
      if (current) {
        const row = passed.filter((target) => Math.abs(target.getBoundingClientRect().top - current.getBoundingClientRect().top) < 2);
        setActive((previous) => row.some((target) => target.id === previous) ? previous : (row[0] ?? current).id);
      }
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ids]);

  useEffect(() => {
    const nav = navRef.current;
    const button = nav?.querySelector<HTMLElement>("[aria-current]");
    if (!nav || !button) return;
    const offset = button.offsetLeft - nav.scrollLeft;
    if (offset < 0 || offset + button.offsetWidth > nav.clientWidth) {
      nav.scrollTo({ left: button.offsetLeft - 12, behavior: "instant" });
    }
  }, [active]);

  return <div className={styles.sectionNavBar}>
    <nav ref={navRef} className={styles.sectionNav} aria-label="作品栏目 / Artwork sections">
    {sections.map((section) => <button key={section.id} type="button" aria-current={active === section.id ? "location" : undefined}
      onClick={() => {
        manualUntil.current = performance.now() + 800;
        setActive(section.id);
        document.getElementById(section.id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
      }}>
      {section.label.zh}<span lang="en">{section.label.en}</span>
    </button>)}
    </nav>
  </div>;
}
