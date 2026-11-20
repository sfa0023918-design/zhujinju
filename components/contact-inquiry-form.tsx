"use client";

import { useSearchParams } from "next/navigation";

import { ContactForm } from "@/components/contact-form";
import {
  findInquiryRequest,
  type InquiryCatalogItem,
} from "@/lib/artwork-inquiry";
import type { PageCopyContent } from "@/lib/site-data";

type ContactInquiryFormProps = {
  inquiryWorks: InquiryCatalogItem[];
  copy: PageCopyContent["siteChrome"]["contactForm"];
};

export function ContactInquiryForm({
  inquiryWorks,
  copy,
}: ContactInquiryFormProps) {
  const searchParams = useSearchParams();
  const workSlug = searchParams.get("work")?.trim() ?? "";
  const matchedWork = workSlug
    ? inquiryWorks.find((item) => item.slug === workSlug)
    : undefined;
  const legacyTitle = (searchParams.get("artwork") ?? "").slice(0, 200);
  const requestText = (searchParams.get("request") ?? "").slice(0, 200);
  const selectedRequest = matchedWork
    ? findInquiryRequest(matchedWork.inquirySupport, requestText)
    : legacyTitle && requestText
      ? { zh: requestText, en: "" }
      : undefined;

  return (
    <ContactForm
      key={JSON.stringify([matchedWork?.slug, legacyTitle, selectedRequest])}
      work={matchedWork}
      request={selectedRequest}
      initialArtwork={legacyTitle}
      copy={copy}
    />
  );
}
