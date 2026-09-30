import Link from "next/link";
import type { Article } from "@/lib/data/types";
import type { EditorialImage, ExhibitionEditorial } from "@/lib/data/exhibition-editorial";
import { ProtectedImage } from "@/components/protected-image";
import styles from "./exhibition-journal.module.css";

function Plate({ image, priority = false, sizes = "(min-width: 1050px) 360px, (min-width: 768px) 300px, 85vw" }: {
  image: EditorialImage;
  priority?: boolean;
  sizes?: string;
}) {
  return <ProtectedImage src={image.src} alt={image.alt} width={image.width} height={image.height}
    priority={priority} sizes={sizes} quality={85} wrapperClassName={styles.plate} className={styles.image} />;
}

export function ExhibitionJournal({ article, editorial: e }: { article: Article; editorial: ExhibitionEditorial }) {
  return (
    <article className={styles.article}>
      <div className={styles.topLine}>
        <Link href="/journal">返回文章与动态 <span lang="en">Back to Journal</span></Link>
        <time dateTime={article.date}>{article.date}</time>
      </div>
      <header className={styles.cover}>
        <div className={styles.coverCopy}>
          <h1>{e.title.zh}</h1>
          <p className={styles.coverEnglish} lang="en">{e.title.en}</p>
          <div className={styles.coverEvent}>
            <p>{e.subtitle.zh}</p>
            <p lang="en">{e.subtitle.en}</p>
            <p>{e.eventLine}</p>
          </div>
        </div>
        <figure className={styles.coverPlate}>
          <Plate image={e.cover} priority sizes="(min-width: 768px) 260px, 200px" />
          <figcaption>{e.cover.alt}</figcaption>
        </figure>
      </header>
      <nav className={styles.contents} aria-label="本文章节">
        <a href="#preface">序 <span lang="en">Preface</span></a>
        {e.chapters.map(c => <a key={c.id} href={`#${c.id}`}>{c.title.zh}<span lang="en">{c.title.en}</span></a>)}
      </nav>
      <section className={styles.preface} id="preface" aria-labelledby="preface-title">
        <h2 id="preface-title">{e.prefaceTitle}</h2>
        <div className={styles.prefaceOpening}>
          <figure><Plate image={e.prefacePortrait} sizes="(min-width: 1050px) 220px, 200px" /></figure>
          <div className={styles.prose}>
            <p className={styles.lead}>{e.prefaceLead}</p>
            {e.prefaceFirst.map(p => <p key={p}>{p}</p>)}
          </div>
        </div>
        <figure className={styles.prefaceWalk}><Plate image={e.prefaceLandscape} sizes="(min-width: 768px) 600px, 95vw" /></figure>
        <div className={`${styles.prose} ${styles.prefaceClosing}`}>
          {e.prefaceSecond.map(p => <p key={p}>{p}</p>)}
          <p className={styles.introduction}>{e.introduction}</p>
        </div>
      </section>
      {e.chapters.map(chapter => (
        <section key={chapter.id} id={chapter.id} className={styles.chapter} aria-labelledby={`${chapter.id}-title`}>
          <header className={`${styles.chapterHeading} ${styles[chapter.tone]}`}>
            <div><h2 id={`${chapter.id}-title`}>{chapter.title.zh}</h2><p lang="en">{chapter.title.en}</p></div>
            <p className={styles.chapterIntro}>{chapter.introduction}</p>
          </header>
          {chapter.works.map(work => (
            <section key={work.id} id={work.id} className={styles.work} aria-labelledby={`${work.id}-title`}>
              <header className={styles.workHeader}>
                <h3 id={`${work.id}-title`}>{work.title.zh}</h3>
                <p className={styles.workEnglish} lang="en">{work.title.en}</p>
                <div className={styles.facts}>
                  <p>{work.basicFacts?.[0]?.zh ?? `${work.period.zh} · ${work.region.zh}`}<span lang="en">{work.basicFacts?.[0]?.en ?? `${work.period.en} · ${work.region.en}`}</span></p>
                  <p>材质　{work.basicFacts?.[1]?.zh ?? work.material.zh}<span lang="en">Medium　{work.basicFacts?.[1]?.en ?? work.material.en}</span></p>
                  <p>尺寸 <span className={styles.inline} lang="en">Dimensions　{work.dimensions}</span></p>
                </div>
                {work.records.length > 0 && <dl className={styles.records}>
                  {work.records.map((r, i) => <div key={i}><dt>{r.label.zh}<span lang="en">{r.label.en}</span></dt>
                    <dd>{r.lines.map((line, j) => <p key={j}>{line}</p>)}</dd></div>)}
                </dl>}
              </header>
              <figure className={styles.workPlate}><Plate image={work.image} /></figure>
              <div className={`${styles.prose} ${styles.essay}`}>
                <h4>{work.heading}</h4>
                {work.paragraphs.map(p => <p key={p}>{p}</p>)}
                {work.collectionSlug && <Link className={styles.textLink} href={`/collection/${work.collectionSlug}`}>作品详情 <span lang="en">View artwork</span><span aria-hidden="true"> ↗</span></Link>}
              </div>
              {work.detail && <figure className={styles.detailPlate}><Plate image={work.detail} sizes="(min-width: 768px) 600px, 95vw" /><figcaption>{work.detail.alt}</figcaption></figure>}
            </section>
          ))}
        </section>
      ))}
      <section className={styles.closing} aria-labelledby="closing-title">
        <div className={styles.prose}><h2 id="closing-title">{e.closingTitle}</h2>{e.closing.map(p => <p key={p}>{p}</p>)}</div>
        <div className={styles.event}><h3>{e.subtitle.zh}</h3>{e.event.map(p => <p key={p}>{p}</p>)}
          <Link className={styles.eventLink} href={`/exhibitions/${e.exhibitionSlug}#catalogue`}>展览与电子图录<span lang="en">Exhibition & Catalogue ↗</span></Link>
          {e.pdf && <a className={styles.textLink} href={e.pdf} download>下载本文 PDF <span lang="en">Download article</span></a>}
        </div>
      </section>
      <section className={styles.contact} aria-label="竹瑾居艺术空间地图与联系方式">
        <figure><Plate image={e.contactImage} sizes="(min-width: 768px) 480px, 95vw" /></figure>
        <p>{e.contactText}</p>
        <Link className={styles.textLink} href="/contact">联系与到访 <span lang="en">Contact & Visit ↗</span></Link>
      </section>
      <div className={styles.bottomLine}><Link href="/journal">更多阅读 <span lang="en">More from the Journal</span></Link><a href="#preface">返回序言 ↑</a></div>
    </article>
  );
}
