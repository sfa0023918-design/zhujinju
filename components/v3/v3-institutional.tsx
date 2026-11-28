"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { FooterSocialIcon } from "@/components/footer-social-icon";
import { getWhatsAppHref } from "@/lib/contact-links";
import type {
  Artwork,
  BrandIntroContent,
  CollectingDirection,
  SiteConfigContent,
} from "@/lib/data/types";
import {
  getArtworkCardSrc,
  getArtworkFacts,
  getV3CategoryKey,
  padNumber,
} from "@/lib/v3-helpers";
import { buildOfficialPlatforms, resolveInstagramHref, useV3 } from "./v3-shell";
import { ArrowLink, Bi, SectionHead, useV3Reveal, V3Button } from "./v3-ui";

/* ======================================================================
   ABOUT PAGE
   ====================================================================== */
export function V3AboutPage({
  siteConfig,
  brandIntro,
  collectingDirections,
  artworks,
  exhibitionsCount,
  articlesCount,
}: {
  siteConfig: SiteConfigContent;
  brandIntro: BrandIntroContent;
  collectingDirections: CollectingDirection[];
  artworks: Artwork[];
  exhibitionsCount: number;
  articlesCount: number;
}) {
  const { setDarkHero } = useV3();
  useV3Reveal("about-page");

  useEffect(() => {
    setDarkHero(false);
  }, [setDarkHero]);

  const sampleByCat = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of artworks) {
      const k = getV3CategoryKey(a);
      if (!map[k]) map[k] = getArtworkCardSrc(a);
    }
    return map;
  }, [artworks]);

  const resolveDirectionCat = (dir: CollectingDirection): string => {
    const text = `${dir.name.zh} ${dir.name.en}`.toLowerCase();
    if (/唐卡|thangka|绘画|painting|卷轴/.test(text)) return "painting";
    if (/经书|经板|贝叶|manuscript|sutra|经/.test(text)) return "manuscript";
    if (/工艺|法器|ritual/.test(text)) return "ritual";
    return "sculpture";
  };

  const directions = collectingDirections.length
    ? collectingDirections
    : [
        {
          name: { zh: "造像", en: "Figure" },
          description: {
            zh: "聚焦早期西藏、尼泊尔、印度与相关区域的佛教造像。",
            en: "Focusing on early Buddhist sculpture from Tibet, Nepal, India, and related regions.",
          },
        },
        {
          name: { zh: "唐卡", en: "Thangka" },
          description: {
            zh: "关注图像系统完整、设色沉着、传承清晰的佛教绘画。",
            en: "Works selected for coherent iconographic systems, restrained color, and clear lines of transmission.",
          },
        },
        {
          name: { zh: "绘画", en: "Painting" },
          description: {
            zh: "包括卷轴、纸本与跨区域图像传统中的重要作品。",
            en: "Including scrolls, works on paper, and important paintings across intersecting visual traditions.",
          },
        },
        {
          name: { zh: "佛教工艺", en: "Ritual Objects" },
          description: {
            zh: "涵盖供器、法器与兼具宗教性与工艺价值的收藏方向。",
            en: "Covering offering vessels, liturgical implements, and objects valued for both ritual and material significance.",
          },
        },
        {
          name: { zh: "尼泊尔造像", en: "Nepalese Sculpture" },
          description: {
            zh: "侧重尼瓦尔工匠体系与喜马拉雅区域风格流动。",
            en: "With particular attention to Newar craftsmanship and the movement of style across the Himalayas.",
          },
        },
      ];

  const methods = brandIntro.methodology?.length
    ? brandIntro.methodology
    : [
        {
          zh: "以作品为中心，尊重图像与器物自身的时间性。",
          en: "Place the object at the center, respecting the temporal depth held within images and ritual forms.",
        },
        {
          zh: "以研究支撑判断，避免将古代艺术降格为单纯装饰消费。",
          en: "Ground judgement in research, rather than reducing historical art to decorative consumption.",
        },
        {
          zh: "以长期主义组织内容，持续积累展览、图录与学术输出。",
          en: "Organize content with a long-term view, steadily building exhibitions, catalogues, and scholarly output.",
        },
      ];

  const numbers = [
    { n: exhibitionsCount, zh: "项年度展览", en: "exhibitions" },
    { n: exhibitionsCount, zh: "册研究图录", en: "catalogues" },
    { n: artworks.length, zh: "件藏品档案", en: "catalogued works" },
    { n: articlesCount, zh: "篇文章与札记", en: "articles" },
  ];

  return (
    <>
      <section className="container v3-about-hero">
        <div className="v3-about-hero-copy">
          <p className="micro-label v3-eyebrow">
            ABOUT<span className="t-zh"> · 关于竹瑾居</span>
          </p>
          <h1 className="v3-h1">
            <span className="t-zh">
              以研究与眼光，
              <br />
              建立对作品更深的理解。
            </span>
            <span className="t-en" lang="en">
              Research and connoisseurship,
              <br />
              toward a deeper understanding.
            </span>
          </h1>
          <p className="v3-about-manifesto">
            <Bi text={brandIntro.statement} />
          </p>
          <div className="v3-about-meta">
            <span>
              <i className="dot-spark" aria-hidden="true" />
              <span className="t-zh">竹瑾居艺术空间 · 成都青羊区草堂东路 88 号</span>
              <span className="t-en" lang="en">
                Zhu Jin Ju Gallery · No. 88 Caotang East Rd, Chengdu
              </span>
            </span>
          </div>
        </div>
        <figure className="v3-about-facade">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/uploads/branding/about-space-himalayan-art-20260930.png"
            alt="竹瑾居艺术空间外立面与旋梯"
          />
          <figcaption>
            <span className="t-zh">竹瑾居艺术空间 · 成都外立面与旋梯</span>
            <span className="t-en" lang="en">
              Zhu Jin Ju Gallery, Chengdu
            </span>
          </figcaption>
        </figure>
      </section>

      <section className="container v3-about-body">
        <div className="v3-about-side">
          <p className="micro-label v3-eyebrow">
            <span className="t-zh">理念</span>
            <span className="t-en" lang="en">
              Position
            </span>
          </p>
        </div>
        <div className="v3-about-text">
          {siteConfig.about.body.map((para, idx) => (
            <p key={idx} data-reveal="">
              <Bi text={para} />
            </p>
          ))}
        </div>
      </section>

      <section className="container v3-method">
        <SectionHead eyebrow="METHOD · 方法" zh="我们如何工作" en="How We Work" />
        <ol className="v3-method-list" data-stagger="">
          {methods.map((item, k) => (
            <li key={k} data-reveal="">
              <span className="m-no">{padNumber(k + 1)}</span>
              <span className="m-line" data-draw="" />
              <p>
                <Bi text={item} />
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container v3-dirs">
        <SectionHead
          eyebrow="COLLECTING · 收藏方向"
          zh="收藏方向"
          en="Collecting Directions"
          right={<ArrowLink href="/collection" zh="浏览藏品" en="Browse" />}
        />
        <ol className="v3-dir-list">
          {directions.map((dir, i) => {
            const catKey = resolveDirectionCat(dir);
            return (
              <li key={dir.name.zh || i}>
                <Link
                  className="v3-dir"
                  href={`/collection?cat=${catKey}`}
                  data-follow={sampleByCat[catKey] || ""}
                >
                  <span className="dir-no">{padNumber(i + 1)}</span>
                  <span className="dir-name">
                    <span className="t-zh">{dir.name.zh}</span>
                    <em lang="en">{dir.name.en}</em>
                  </span>
                  <span className="dir-desc">
                    <Bi text={dir.description} />
                  </span>
                  <i className="row-arrow" aria-hidden="true">
                    →
                  </i>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="v3-numbers">
        <div className="container v3-numbers-grid" data-stagger="">
          {numbers.map((item) => (
            <div key={item.en} data-reveal="">
              <b data-count={item.n} data-pad="2">
                {padNumber(item.n)}
              </b>
              <span>
                <span className="t-zh">{item.zh}</span>
                <span className="t-en" lang="en">
                  {item.en}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="v3-visit">
        <div className="container v3-visit-grid">
          <div>
            <p className="micro-label v3-eyebrow v3-eyebrow-live">
              <i className="dot-spark" aria-hidden="true" />
              VISIT<span className="t-zh"> · 到访</span>
            </p>
            <h2 className="v3-visit-title">
              <span className="t-zh">成都 · 预约制会面</span>
              <span className="t-en" lang="en">
                Chengdu, by appointment
              </span>
            </h2>
          </div>
          <div className="v3-visit-side" data-reveal="">
            <p>
              <span className="t-zh">
                成都市青羊区草堂东路 88 号竹瑾居艺术空间。以预约制接待作品查看、借展洽谈、研究交流与图录交换。
              </span>
              <span className="t-en" lang="en">
                No. 88 Caotang East Road, Chengdu · Zhu Jin Ju Gallery. Viewings, loan discussions, research exchange and catalogue requests by appointment.
              </span>
            </p>
            <div className="v3-btn-row">
              <V3Button href="/contact" zh="预约到访" en="Book a visit" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ======================================================================
   CONTACT PAGE (Real POST /api/inquiry + Copy Chips + ?work=<slug>)
   ====================================================================== */
const ROLES = [
  { zh: "藏家", en: "Collector" },
  { zh: "机构", en: "Institution" },
  { zh: "策展人", en: "Curator" },
  { zh: "研究者", en: "Researcher" },
  { zh: "其他", en: "Other" },
] as const;

export function V3ContactPage({
  siteConfig,
  artworks,
}: {
  siteConfig: SiteConfigContent;
  artworks: Artwork[];
}) {
  const { lang, toast, copyText, openWechatQr, setDarkHero } = useV3();
  const searchParams = useSearchParams();
  const workSlugParam = searchParams.get("work") || "";
  const requestParam = searchParams.get("request") || "";

  useV3Reveal("contact-page");

  useEffect(() => {
    setDarkHero(false);
  }, [setDarkHero]);

  const selectedWork = useMemo(
    () => (workSlugParam ? artworks.find((a) => a.slug === workSlugParam) ?? null : null),
    [artworks, workSlugParam],
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [identity, setIdentity] = useState<string>("藏家");
  const [artworkText, setArtworkText] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [mountedAt] = useState(() => Date.now());
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (selectedWork) {
      setArtworkText(
        lang === "en" ? selectedWork.title.en || selectedWork.title.zh : selectedWork.title.zh,
      );
      if (requestParam) {
        setMessage(
          lang === "en"
            ? `I would like to request: ${requestParam}.`
            : `希望获取关于此作的资料：${requestParam}。`,
        );
      }
    }
  }, [selectedWork, requestParam, lang]);

  const whatsappValue = (siteConfig.contact.whatsapp || siteConfig.contact.phone || "").trim();
  const whatsappHref = getWhatsAppHref(whatsappValue);
  const instagramHref = resolveInstagramHref(siteConfig.contact.instagram);
  const socialPlatforms = useMemo(
    () => buildOfficialPlatforms(siteConfig.contact.instagram),
    [siteConfig.contact.instagram],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "busy") return;
    setFeedback("");

    if (!name.trim() || !email.trim() || !message.trim()) {
      setFeedback(
        lang === "en"
          ? "Please complete your name, email address, and message."
          : "请填写您的称谓、邮箱与留言内容。",
      );
      setStatus("error");
      return;
    }

    setStatus("busy");
    try {
      const elapsed = Date.now() - mountedAt;
      if (elapsed < 3100) {
        await new Promise((r) => window.setTimeout(r, 3100 - elapsed));
      }

      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          organization: organization.trim(),
          identity,
          artwork: artworkText.trim(),
          work: selectedWork && selectedWork.status !== "sold" ? selectedWork.slug : "",
          request: "",
          message: message.trim(),
          website,
          submittedAt: String(mountedAt),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setFeedback(
          data.error ||
            (lang === "en"
              ? "Submission could not be completed. Please email contact@zhujinju.com directly."
              : "提交暂未成功，请稍后再试，或直接发送邮件至 contact@zhujinju.com。"),
        );
        setStatus("error");
        return;
      }

      setStatus("done");
      setFeedback(
        lang === "en"
          ? "Thank you — your inquiry has been received. We usually reply within 24 hours."
          : "感谢您的留言，我们已收到咨询，通常于 24 小时内回复。",
      );
      toast(lang === "en" ? "Inquiry sent" : "咨询已发送");
      setMessage("");
    } catch {
      setFeedback(
        lang === "en"
          ? "Network error. Please email contact@zhujinju.com directly."
          : "网络连接异常，请稍后再试，或直接发送邮件至 contact@zhujinju.com。",
      );
      setStatus("error");
    }
  };

  return (
    <>
      <section className="v3-page-head container">
        <p className="micro-label v3-eyebrow v3-eyebrow-live">
          <i className="dot-spark" aria-hidden="true" />
          CONTACT<span className="t-zh"> · 联系与预约</span>
        </p>
        <h1 className="v3-h1">
          <span className="t-zh">
            作品咨询、研究交流
            <br className="mob-only-br" />
            或预约到访。
          </span>
          <span className="t-en" lang="en">
            Inquiries, research, or a visit.
          </span>
        </h1>
      </section>

      <section className="container v3-contact" id="inquiry">
        <div className="v3-contact-info">
          <ul className="v3-info-list">
            {siteConfig.contact.email ? (
              <li>
                <span className="micro-label">
                  <span className="t-zh">邮箱</span>
                  <span className="t-en" lang="en">
                    Email
                  </span>
                </span>
                <div className="v3-contact-action-row">
                  <a className="v3-contact-action" href={`mailto:${siteConfig.contact.email}`}>
                    <b>{siteConfig.contact.email}</b>
                    <em className="v3-action-pill">
                      <span className="t-zh">发送邮件 ↗</span>
                      <span className="t-en" lang="en">
                        Email ↗
                      </span>
                    </em>
                  </a>
                  <button
                    type="button"
                    className="v3-action-pill v3-copy-pill"
                    onClick={() => copyText(siteConfig.contact.email)}
                  >
                    <span className="t-zh">复制</span>
                    <span className="t-en" lang="en">
                      Copy
                    </span>
                  </button>
                </div>
              </li>
            ) : null}

            {siteConfig.contact.wechat ? (
              <li>
                <span className="micro-label">
                  <span className="t-zh">微信</span>
                  <span className="t-en" lang="en">
                    WeChat
                  </span>
                </span>
                <div className="v3-contact-action-row">
                  <button type="button" className="v3-contact-action" onClick={openWechatQr}>
                    <b>{siteConfig.contact.wechat}</b>
                    <em className="v3-action-pill">
                      <span className="t-zh">查看二维码</span>
                      <span className="t-en" lang="en">
                        QR Code
                      </span>
                    </em>
                  </button>
                  <button
                    type="button"
                    className="v3-action-pill v3-copy-pill"
                    onClick={() => copyText(siteConfig.contact.wechat)}
                  >
                    <span className="t-zh">复制</span>
                    <span className="t-en" lang="en">
                      Copy
                    </span>
                  </button>
                </div>
              </li>
            ) : null}

            {whatsappValue ? (
              <li>
                <span className="micro-label">
                  <span className="t-zh">电话 / WhatsApp</span>
                  <span className="t-en" lang="en">
                    Phone / WhatsApp
                  </span>
                </span>
                {whatsappHref ? (
                  <a
                    className="v3-contact-action"
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <b>{whatsappValue}</b>
                    <em className="v3-action-pill">WhatsApp ↗</em>
                  </a>
                ) : (
                  <b>{whatsappValue}</b>
                )}
              </li>
            ) : null}

            {siteConfig.contact.instagram ? (
              <li>
                <span className="micro-label">
                  <span className="t-zh">Instagram</span>
                  <span className="t-en" lang="en">
                    Instagram
                  </span>
                </span>
                <a
                  className="v3-contact-action"
                  href={instagramHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  <b>{siteConfig.contact.instagram}</b>
                  <em className="v3-action-pill">
                    <span className="t-zh">打开主页 ↗</span>
                    <span className="t-en" lang="en">
                      Open ↗
                    </span>
                  </em>
                </a>
              </li>
            ) : null}

            <li>
              <span className="micro-label">
                <span className="t-zh">地址</span>
                <span className="t-en" lang="en">
                  Address
                </span>
              </span>
              <b>
                <span className="t-zh">
                  成都市青羊区草堂东路 88 号
                  <br />
                  竹瑾居艺术空间
                </span>
                <span className="t-en" lang="en">
                  No. 88 Caotang East Road, Qingyang,
                  <br />
                  Chengdu · Zhu Jin Ju Gallery
                </span>
              </b>
            </li>
          </ul>
          <p className="v3-note">
            <span className="t-zh">咨询通常于 24 小时内回复。成都会面采用预约制。</span>
            <span className="t-en" lang="en">
              We usually reply within 24 hours. Meetings in Chengdu are by appointment.
            </span>
          </p>
          <div className="v3-contact-socials" aria-label="官方社交平台">
            {socialPlatforms.map((platform) =>
              platform.key === "wechat" ? (
                <button
                  key={platform.key}
                  type="button"
                  className="v3-contact-social-btn"
                  aria-label={platform.label}
                  title={platform.label}
                  onClick={openWechatQr}
                >
                  <FooterSocialIcon platform={platform.key} />
                </button>
              ) : (
                <a
                  key={platform.key}
                  href={platform.href}
                  target="_blank"
                  rel="noreferrer"
                  className="v3-contact-social-btn"
                  aria-label={platform.label}
                  title={platform.label}
                >
                  <FooterSocialIcon platform={platform.key} />
                </a>
              ),
            )}
          </div>
        </div>

        <form className="v3-form v3-contact-form" onSubmit={handleSubmit}>
          {/* Honeypot anti-spam field */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="v3-hp"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            aria-hidden="true"
          />

          {selectedWork ? (
            <div className="v3-form-work">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getArtworkCardSrc(selectedWork)} alt={selectedWork.title.zh} />
              <div>
                <p className="micro-label">
                  <span className="t-zh">意向作品</span>
                  <span className="t-en" lang="en">
                    Selected work
                  </span>
                </p>
                <b>
                  <Bi text={selectedWork.title} />
                </b>
                <span>
                  <Bi text={getArtworkFacts(selectedWork, ["region", "period", "dimensions"])} />
                </span>
              </div>
              <Link href="/contact" className="v3-form-work-x" aria-label="移除">
                ✕
              </Link>
            </div>
          ) : null}

          <div className="v3-form-row">
            <label className="float-field">
              <input
                type="text"
                name="name"
                required
                placeholder=" "
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <span>
                <span className="t-zh">称谓</span>
                <span className="t-en" lang="en">
                  Name
                </span>
              </span>
            </label>
            <label className="float-field">
              <input
                type="email"
                name="email"
                required
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <span>
                <span className="t-zh">电子邮箱</span>
                <span className="t-en" lang="en">
                  Email address
                </span>
              </span>
            </label>
          </div>

          <label className="float-field">
            <input
              type="text"
              name="organization"
              placeholder=" "
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
            <span>
              <span className="t-zh">机构（选填）</span>
              <span className="t-en" lang="en">
                Organisation (optional)
              </span>
            </span>
          </label>

          <fieldset className="v3-roles">
            <legend className="micro-label">
              <span className="t-zh">您的身份</span>
              <span className="t-en" lang="en">
                You are
              </span>
            </legend>
            {ROLES.map((r) => (
              <label key={r.zh} className="v3-role">
                <input
                  type="radio"
                  name="role"
                  checked={identity === r.zh}
                  onChange={() => setIdentity(r.zh)}
                />
                <span>
                  <span className="t-zh">{r.zh}</span>
                  <span className="t-en" lang="en">
                    {r.en}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <label className="float-field">
            <input
              type="text"
              name="artwork"
              placeholder=" "
              value={artworkText}
              onChange={(e) => setArtworkText(e.target.value)}
            />
            <span>
              <span className="t-zh">意向作品（选填）</span>
              <span className="t-en" lang="en">
                Artwork (optional)
              </span>
            </span>
          </label>

          <label className="float-field">
            <textarea
              name="message"
              rows={5}
              required
              placeholder=" "
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <span>
              <span className="t-zh">留言（可附微信或预约日期）</span>
              <span className="t-en" lang="en">
                Message (WeChat or preferred date optional)
              </span>
            </span>
          </label>

          <button
            type="submit"
            disabled={status === "busy"}
            className={`v3-btn v3-btn-dark v3-btn-submit${status === "busy" ? " is-busy" : ""}${status === "done" ? " is-done" : ""}`}
            data-magnetic="0.12"
          >
            <span className="v3-btn-text">
              <span className="sb-idle">
                <span className="roll-slot">
                  <span className="roll-a">
                    <span className="t-zh">发送咨询</span>
                    <span className="t-en" lang="en">
                      Send
                    </span>
                  </span>
                  <span className="roll-b" aria-hidden="true">
                    <span className="t-zh">发送咨询</span>
                    <span className="t-en">Send</span>
                  </span>
                </span>{" "}
                <i aria-hidden="true">→</i>
              </span>
              <span className="sb-busy">
                <i className="spinner" />
              </span>
              <span className="sb-done">
                ✓ <span className="t-zh">已发送</span>
                <span className="t-en" lang="en">
                  Sent
                </span>
              </span>
            </span>
          </button>

          {feedback ? (
            <p className={`v3-form-msg${status === "done" ? " is-ok" : ""}`} role="status">
              {feedback}
            </p>
          ) : null}
        </form>
      </section>
    </>
  );
}
